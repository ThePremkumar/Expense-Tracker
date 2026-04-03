import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Transaction,
  Category,
  MonthlyBudget,
  RecurringExpense,
  FamilyMember,
  FamilyTransaction,
  AppState
} from '../types';
import {
  getCurrentMonthKey,
  getPreviousMonthKey
} from '../utils/helpers';
import {
  calculateBudgetHealthScore,
  projectMonthEndSpend,
  calculateDailyAverage,
  getPaymentModeBreakdown,
  getTodaySpendingByMode
} from '../utils/finance';
import toast from 'react-hot-toast';

const DEFAULT_CATEGORIES: Category[] = [
  'Food & Drinks',
  'Interests',
  'Education',
  'Health',
  'Shopping',
  'Subscriptions',
  'Transport',
  'Rent/Mortgage',
  'Monthly Bill',
  'Gifts',
  'Salary',
  'Other'
];

interface UseExpenseTrackerReturn {
  state: AppState;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  currentMonthTransactions: Transaction[];
  totalSpent: number;
  currentBudget: number;
  upiBudget: number;
  cashBudget: number;
  remainingBalance: number;
  upiSpent: number;
  cashSpent: number;
  upiRemaining: number;
  cashRemaining: number;
  todaySpent: number;
  todayUpiSpent: number;
  todayCashSpent: number;
  dailyAverage: number;
  spendingVelocity: number;
  budgetHealthScore: number;
  availableMonths: string[];
  categories: string[];
  addTransaction: (t: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  bulkAddTransactions: (transactions: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string | string[]) => Promise<void>;
  updateBudget: (month: string, budget: number, reason?: string) => Promise<void>;
  updateUpiBudget: (month: string, amount: number) => Promise<void>;
  removeUpiBudget: (month: string) => Promise<void>;
  carryForwardBudget: (amount: number, target: 'budget' | 'savings') => Promise<void>;
  previousMonthRemaining: number;
  updateSavings: (newSavings: number) => Promise<void>;
  addCustomCategory: (name: string) => Promise<void>;
  deleteCustomCategory: (name: string) => Promise<void>;
  isLoaded: boolean;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  editRecurringExpense: (id: string, updates: Partial<RecurringExpense>) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  toggleRecurringExpense: (id: string) => Promise<void>;
  totalFixedExpenses: number;
  hasLocalData: boolean;
  syncLocalData: () => Promise<void>;
  addFamilyMember: (name: string, initialBalance?: number) => Promise<void>;
  removeFamilyMember: (id: string) => Promise<void>;
  modifyFamilyMemberAmount: (id: string, amount: number, type: 'deposit' | 'withdraw', description?: string) => Promise<void>;
  transferBetweenFamily: (fromId: string, toId: string, amount: number) => Promise<void>;
  transferFamilyToMain: (memberId: string, amount: number) => Promise<void>;
  transferMainToFamily: (memberId: string, amount: number) => Promise<void>;
}

export function useExpenseTracker(): UseExpenseTrackerReturn {
  const { currentUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey());
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<AppState>({
    transactions: [],
    budgets: {},
    savings: 0,
    customCategories: [],
    recurringExpenses: [],
    familyMembers: [],
    appliedRecurringMonths: []
  });

  // Listen for user data (budgets, savings, categories, etc.)
  useEffect(() => {
    if (!currentUser) {
      setIsLoaded(true);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setState(prev => ({
          ...prev,
          budgets: data.budgets || {},
          savings: data.savings || 0,
          customCategories: data.customCategories || [],
          recurringExpenses: data.recurringExpenses || [],
          familyMembers: data.familyMembers || [],
          appliedRecurringMonths: data.appliedRecurringMonths || []
        }));
      }
      setIsLoaded(true);
    }, () => {
      console.warn("Permission denied for user data, using local storage fallback.");
      // Initial local storage load
      const localBudgets = localStorage.getItem('budgets');
      const localSavings = localStorage.getItem('savings');
      const localCustomCategories = localStorage.getItem('customCategories');
      const localRecurring = localStorage.getItem('recurringExpenses');
      const localFamily = localStorage.getItem('familyMembers');
      
      setState(prev => ({
        ...prev,
        budgets: localBudgets ? JSON.parse(localBudgets) : {},
        savings: localSavings ? JSON.parse(localSavings) : 0,
        customCategories: localCustomCategories ? JSON.parse(localCustomCategories) : [],
        recurringExpenses: localRecurring ? JSON.parse(localRecurring) : [],
        familyMembers: localFamily ? JSON.parse(localFamily) : [],
        appliedRecurringMonths: []
      }));
      setIsLoaded(true);
    });

    return () => unsub();
  }, [currentUser]);

  // Listen for transactions (all transactions, we'll filter them locally)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const txns = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Transaction[];
      setState(prev => ({ ...prev, transactions: txns }));
    }, () => {
      console.warn("Permission denied for transactions, using local storage fallback.");
      const localTxns = localStorage.getItem('transactions');
      if (localTxns) {
        setState(prev => ({ ...prev, transactions: JSON.parse(localTxns) }));
      }
    });

    return () => unsub();
  }, [currentUser]);

  // DERIVED STATE
  const currentMonthTransactions = useMemo(() => {
    return state.transactions.filter(t => t.date.startsWith(currentMonth));
  }, [state.transactions, currentMonth]);

  const totalSpent = useMemo(() => {
    return currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentBudget = state.budgets[currentMonth]?.totalBudget || 0;
  const upiBudget = state.budgets[currentMonth]?.upiBudget || 0;
  const cashBudget = currentBudget - upiBudget;
  const remainingBalance = currentBudget - totalSpent;

  // UPI / Cash breakdowns
  const { upiSpent, cashSpent } = useMemo(() => 
    getPaymentModeBreakdown(currentMonthTransactions),
    [currentMonthTransactions]
  );

  const upiRemaining = upiBudget - upiSpent;
  const cashRemaining = cashBudget - cashSpent;

  // Today's spend breakdowns
  const { total: todaySpent, upi: todayUpiSpent, cash: todayCashSpent } = useMemo(() => 
    getTodaySpendingByMode(currentMonthTransactions), 
    [currentMonthTransactions]
  );

  // Daily average spend
  const dailyAverage = useMemo(() => 
    calculateDailyAverage(currentMonthTransactions, totalSpent),
    [currentMonthTransactions, totalSpent]
  );

  // Spending velocity (projected month-end total)
  const spendingVelocity = useMemo(() => 
    projectMonthEndSpend(totalSpent),
    [totalSpent]
  );

  // Budget health score (0-100)
  const budgetHealthScore = useMemo(() => 
    calculateBudgetHealthScore(totalSpent, currentBudget),
    [totalSpent, currentBudget]
  );

  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...state.customCategories];
  }, [state.customCategories]);

  const previousMonthRemaining = useMemo(() => {
    const prevMonth = getPreviousMonthKey(currentMonth);
    const prevBudget = state.budgets[prevMonth]?.totalBudget || 0;
    const prevSpent = state.transactions
      .filter(t => t.date.startsWith(prevMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    return Math.max(0, prevBudget - prevSpent);
  }, [state.transactions, state.budgets, currentMonth]);

  // ACTIONS
  const addTransaction = async (t: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "expenses"), {
        ...t,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const newTxn: Transaction = {
          ...t,
          id: Math.random().toString(36).substring(7),
          userId: currentUser.uid,
          createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
          updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any
        };
        const updatedTxns = [newTxn, ...state.transactions];
        setState(prev => ({ ...prev, transactions: updatedTxns }));
        localStorage.setItem('transactions', JSON.stringify(updatedTxns));
      } else {
        throw error;
      }
    }
  };

  const bulkAddTransactions = async (transactions: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => {
    if (!currentUser) return;
    const batchSize = 500;
    const toastId = toast.loading(`Importing ${transactions.length} expenses...`);
    
    try {
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = transactions.slice(i, i + batchSize);
        chunk.forEach(t => {
          const ref = doc(collection(db, "expenses"));
          batch.set(ref, {
            ...t,
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
      toast.success("Import successful!", { id: toastId });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        toast.error("Cloud storage unavailable. Import failed.");
      } else {
        toast.error("Import failed.", { id: toastId });
        throw error;
      }
    }
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!currentUser) return;
    const { id: _, userId: __, ...cleanUpdates } = updates as any;
    try {
      await updateDoc(doc(db, "expenses", id), {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const updatedTxns = state.transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        setState(prev => ({ ...prev, transactions: updatedTxns }));
        localStorage.setItem('transactions', JSON.stringify(updatedTxns));
      } else {
        throw error;
      }
    }
  };

  const deleteTransaction = async (id: string | string[]) => {
    if (!currentUser) return;
    const ids = Array.isArray(id) ? id : [id];
    
    try {
      if (ids.length === 1) {
        await deleteDoc(doc(db, "expenses", ids[0]));
      } else {
        const batch = writeBatch(db);
        ids.forEach(innerId => {
          batch.delete(doc(db, "expenses", innerId));
        });
        await batch.commit();
      }
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const updatedTxns = state.transactions.filter(t => !ids.includes(t.id));
        setState(prev => ({ ...prev, transactions: updatedTxns }));
        localStorage.setItem('transactions', JSON.stringify(updatedTxns));
      } else {
        throw error;
      }
    }
  };

  const updateBudget = async (month: string, budget: number, reason: string = 'Budget update') => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    const existingBudget = state.budgets[month];
    const newBudget = budget;
    
    const newHistoryEntry = {
      date: new Date().toISOString(),
      previousBudget: existingBudget?.totalBudget || 0,
      newBudget,
      reason
    };

    const updatedBudgets = {
      ...state.budgets,
      [month]: {
        month,
        totalBudget: newBudget,
        history: existingBudget ? [...existingBudget.history, newHistoryEntry] : [newHistoryEntry],
        carryForward: existingBudget?.carryForward || 0,
        carryForwardToSavings: existingBudget?.carryForwardToSavings || 0
      }
    };

    try {
      await updateDoc(userRef, { budgets: updatedBudgets });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, budgets: updatedBudgets }));
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      } else {
        throw error;
      }
    }
  };

  const carryForwardBudget = async (amount: number, target: 'budget' | 'savings') => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    const existingBudget = state.budgets[currentMonth];
    const updatedBudgets = { ...state.budgets };
    let updatedSavings = state.savings;

    if (target === 'budget') {
      const currentTotal = existingBudget?.totalBudget || 0;
      updatedBudgets[currentMonth] = {
        month: currentMonth,
        totalBudget: currentTotal + amount,
        history: existingBudget?.history || [],
        carryForward: amount,
        carryForwardToSavings: existingBudget?.carryForwardToSavings || 0
      };
      updatedBudgets[currentMonth].history.push({
        date: new Date().toISOString(),
        previousBudget: currentTotal,
        newBudget: currentTotal + amount,
        reason: `Carry forward from previous month`
      });
    } else {
      updatedSavings += amount;
      if (existingBudget) {
        updatedBudgets[currentMonth] = {
          ...existingBudget,
          carryForwardToSavings: (existingBudget.carryForwardToSavings || 0) + amount
        };
      } else {
        updatedBudgets[currentMonth] = {
          month: currentMonth,
          totalBudget: 0,
          history: [],
          carryForward: 0,
          carryForwardToSavings: amount
        };
      }
    }

    try {
      await updateDoc(userRef, { budgets: updatedBudgets, savings: updatedSavings });
      toast.success(target === 'budget' 
        ? `₹${amount.toLocaleString()} added to budget!` 
        : `₹${amount.toLocaleString()} moved to savings!`
      );
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, budgets: updatedBudgets, savings: updatedSavings }));
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
        localStorage.setItem('savings', JSON.stringify(updatedSavings));
      } else {
        throw error;
      }
    }
  };

  const updateSavings = async (newSavings: number) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userRef, { savings: newSavings });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, savings: newSavings }));
        localStorage.setItem('savings', JSON.stringify(newSavings));
      } else {
        throw error;
      }
    }
  };

  const addCustomCategory = async (name: string) => {
    if (!currentUser) return;
    const trimmed = name.trim();
    if (trimmed && !allCategories.includes(trimmed)) {
      const userRef = doc(db, "users", currentUser.uid);
      const updatedCategories = [...state.customCategories, trimmed];
      try {
        await updateDoc(userRef, { customCategories: updatedCategories });
      } catch (error: any) {
        if (error?.code === 'permission-denied') {
          setState(prev => ({ ...prev, customCategories: updatedCategories }));
          localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
        } else {
          throw error;
        }
      }
    }
  };

  const deleteCustomCategory = async (name: string) => {
    if (!currentUser) return;
    const updatedCategories = state.customCategories.filter(c => c !== name);
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userRef, { customCategories: updatedCategories });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, customCategories: updatedCategories }));
        localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
      } else {
        throw error;
      }
    }
  };

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => {
    if (!currentUser) return;
    const newRecurring: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: Date.now()
    };
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { recurringExpenses: [...state.recurringExpenses, newRecurring] });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const updated = [...state.recurringExpenses, newRecurring];
        setState(prev => ({ ...prev, recurringExpenses: updated }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updated));
      } else {
        throw error;
      }
    }
  };

  const editRecurringExpense = async (id: string, updates: Partial<RecurringExpense>) => {
    if (!currentUser) return;
    const updated = state.recurringExpenses.map(r => r.id === id ? { ...r, ...updates } : r);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { recurringExpenses: updated });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, recurringExpenses: updated }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updated));
      } else {
        throw error;
      }
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!currentUser) return;
    const updated = state.recurringExpenses.filter(r => r.id !== id);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { recurringExpenses: updated });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, recurringExpenses: updated }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updated));
      } else {
        throw error;
      }
    }
  };

  const toggleRecurringExpense = async (id: string) => {
    if (!currentUser) return;
    const updated = state.recurringExpenses.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { recurringExpenses: updated });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, recurringExpenses: updated }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updated));
      } else {
        throw error;
      }
    }
  };

  const _updateFamilyMembers = async (updatedMembers: FamilyMember[]) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userRef, { familyMembers: updatedMembers });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, familyMembers: updatedMembers }));
        localStorage.setItem('familyMembers', JSON.stringify(updatedMembers));
      } else {
        throw error;
      }
    }
  };

  const addFamilyMember = async (name: string, initialBalance: number = 0) => {
    const newMember: FamilyMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      balance: initialBalance,
      transactions: initialBalance > 0 ? [{
        id: crypto.randomUUID(),
        type: 'deposit',
        amount: initialBalance,
        description: 'Initial balance',
        date: new Date().toISOString().split('T')[0]
      }] : [],
      createdAt: Date.now()
    };
    await _updateFamilyMembers([...state.familyMembers, newMember]);
    toast.success(`${name} added to family wallet!`);
  };

  const removeFamilyMember = async (id: string) => {
    const member = state.familyMembers.find(m => m.id === id);
    await _updateFamilyMembers(state.familyMembers.filter(m => m.id !== id));
    toast.success(`${member?.name || 'Member'} removed`);
  };

  const modifyFamilyMemberAmount = async (id: string, amount: number, type: 'deposit' | 'withdraw', description: string = '') => {
    const updated = state.familyMembers.map(m => {
      if (m.id !== id) return m;
      const newBalance = type === 'deposit' ? m.balance + amount : Math.max(0, m.balance - amount);
      const txn: FamilyTransaction = {
        id: crypto.randomUUID(),
        type,
        amount,
        description: description || (type === 'deposit' ? 'Added' : 'Withdrawn'),
        date: new Date().toISOString().split('T')[0]
      };
      return { ...m, balance: newBalance, transactions: [...m.transactions, txn] };
    });
    await _updateFamilyMembers(updated);
  };

  const transferBetweenFamily = async (fromId: string, toId: string, amount: number) => {
    const fromMember = state.familyMembers.find(m => m.id === fromId);
    if (!fromMember || fromMember.balance < amount) {
      toast.error('Insufficient balance');
      return;
    }
    const updated = state.familyMembers.map(m => {
      if (m.id === fromId) return { ...m, balance: m.balance - amount };
      if (m.id === toId) return { ...m, balance: m.balance + amount };
      return m;
    });
    await _updateFamilyMembers(updated);
    toast.success('Transfer successful');
  };

  const transferFamilyToMain = async (memberId: string, amount: number) => {
    const member = state.familyMembers.find(m => m.id === memberId);
    if (!member || member.balance < amount) return;
    const updatedFamily = state.familyMembers.map(m => m.id === memberId ? { ...m, balance: m.balance - amount } : m);
    await _updateFamilyMembers(updatedFamily);
    await updateBudget(currentMonth, (state.budgets[currentMonth]?.totalBudget || 0) + amount, `Transfer from ${member.name}`);
  };

  const transferMainToFamily = async (memberId: string, amount: number) => {
    const member = state.familyMembers.find(m => m.id === memberId);
    if (!member) return;
    const updatedFamily = state.familyMembers.map(m => m.id === memberId ? { ...m, balance: m.balance + amount } : m);
    await _updateFamilyMembers(updatedFamily);
    await updateBudget(currentMonth, Math.max(0, (state.budgets[currentMonth]?.totalBudget || 0) - amount), `Transfer to ${member.name}`);
  };

  const updateUpiBudget = async (month: string, amount: number) => {
    if (!currentUser) return;
    const existing = state.budgets[month];
    const updated = {
      ...state.budgets,
      [month]: { ...existing, month, totalBudget: existing?.totalBudget || 0, history: existing?.history || [], upiBudget: amount }
    };
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { budgets: updated });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, budgets: updated }));
        localStorage.setItem('budgets', JSON.stringify(updated));
      } else {
        throw error;
      }
    }
  };

  const removeUpiBudget = async (month: string) => {
    if (!currentUser) return;
    const existing = state.budgets[month];
    if (!existing) return;
    const updated = { ...state.budgets, [month]: { ...existing, upiBudget: 0 } };
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { budgets: updated });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, budgets: updated }));
        localStorage.setItem('budgets', JSON.stringify(updated));
      } else {
        throw error;
      }
    }
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(getCurrentMonthKey());
    state.transactions.forEach((t) => months.add(t.date.substring(0, 7)));
    Object.keys(state.budgets).forEach((m) => months.add(m));
    return Array.from(months).sort().reverse();
  }, [state.transactions, state.budgets]);

  const totalFixedExpenses = useMemo(() => {
    return state.recurringExpenses
      .filter((r) => r.isActive)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [state.recurringExpenses]);

  const syncLocalData = async () => {
    const localData = localStorage.getItem('transactions');
    if (!localData || !currentUser) return;
    const transactions = JSON.parse(localData);
    if (transactions.length === 0) return;
    const toastId = toast.loading("Syncing data...");
    try {
      const batch = writeBatch(db);
      transactions.forEach((t: any) => {
        const ref = doc(collection(db, "expenses"));
        const { id: _, ...data } = t;
        batch.set(ref, { ...data, userId: currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
      await batch.commit();
      localStorage.removeItem('transactions');
      toast.success("Sync complete!", { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Sync failed.", { id: toastId });
    }
  };

  return {
    state,
    currentMonth,
    setCurrentMonth,
    currentMonthTransactions,
    totalSpent,
    currentBudget,
    upiBudget,
    cashBudget,
    remainingBalance,
    upiSpent,
    cashSpent,
    upiRemaining,
    cashRemaining,
    todaySpent,
    todayUpiSpent,
    todayCashSpent,
    dailyAverage,
    spendingVelocity,
    budgetHealthScore,
    availableMonths,
    categories: allCategories,
    addTransaction,
    bulkAddTransactions,
    editTransaction,
    deleteTransaction,
    updateBudget,
    updateUpiBudget,
    removeUpiBudget,
    carryForwardBudget,
    previousMonthRemaining,
    updateSavings,
    addCustomCategory,
    deleteCustomCategory,
    isLoaded,
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    totalFixedExpenses,
    addFamilyMember,
    removeFamilyMember,
    modifyFamilyMemberAmount,
    transferBetweenFamily,
    transferFamilyToMain,
    transferMainToFamily,
    hasLocalData: localStorage.getItem('transactions') !== null && JSON.parse(localStorage.getItem('transactions') || '[]').length > 0,
    syncLocalData
  };
}