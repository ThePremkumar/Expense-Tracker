import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  AppState,
  Transaction,
  Category,
  RecurringExpense,
  FamilyMember,
  FamilyTransaction
} from '../types';
import {
  getCurrentMonthKey,
  getPreviousMonthKey
} from '../utils/helpers';
import toast from 'react-hot-toast';

const DEFAULT_CATEGORIES: Category[] = [
  'Room Rent',
  'Food',
  'Dress',
  'Travel',
  'Essentials',
  'Miscellaneous'
];

const DEV_MODE = true;

export function useExpenseTracker() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<AppState>({
    transactions: [],
    budgets: {},
    customCategories: [],
    recurringExpenses: [],
    appliedRecurringMonths: [],
    familyMembers: [],
    savings: 0
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey());

  const handleFirstTimeUser = useCallback(async () => {
    if (!currentUser) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const batch = writeBatch(db);
      
      batch.set(userDocRef, {
        customCategories: [],
        budgets: {},
        recurringExpenses: [],
        appliedRecurringMonths: [],
        familyMembers: [],
        savings: 0
      });

      await batch.commit();
    }
  }, [currentUser]);

  // Listen to Transactions
  useEffect(() => {
    if (!currentUser) return;

    if (DEV_MODE && false) {
      const localTransactions = localStorage.getItem('transactions') || '[]';
      const localBudgets = localStorage.getItem('budgets') || '{}';
      const localCategories = localStorage.getItem('customCategories') || '[]';
      const localRecurring = localStorage.getItem('recurringExpenses') || '[]';
      const localAppliedMonths = localStorage.getItem('appliedRecurringMonths') || '[]';
      const localFamily = localStorage.getItem('familyMembers') || '[]';
      const localSavings = localStorage.getItem('savings') || '0';
      
      setState({
        transactions: JSON.parse(localTransactions),
        budgets: JSON.parse(localBudgets),
        customCategories: JSON.parse(localCategories),
        recurringExpenses: JSON.parse(localRecurring),
        appliedRecurringMonths: JSON.parse(localAppliedMonths),
        familyMembers: JSON.parse(localFamily),
        savings: parseFloat(localSavings)
      });
      setIsLoaded(true);
      return;
    }

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const transactionsData: Transaction[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          transactionsData.push({ 
            id: doc.id, 
            ...data,
            paymentMode: data.paymentMode || 'Cash' // Default for old transactions
          } as Transaction);
        });
        
        setState(prev => ({ ...prev, transactions: transactionsData }));
        setIsLoaded(true);
      },
      (error) => {
        console.error("Firestore error:", error);
        
        if (error.code === 'permission-denied') {
          console.warn("Permission denied. Falling back to local storage.");
          toast.error("Firebase Permission Denied! Using local storage fallback.", { id: 'permission-error' });
        } else if (error.code === 'failed-precondition') {
          console.warn("Missing Index! Click the link in the console to create it.");
          toast.error("Database Index Building... Data will appear shortly. Please check console for the link!", { 
            duration: 6000,
            id: 'index-error' 
          });
        }
        
        const localTransactions = localStorage.getItem('transactions') || '[]';
        const localBudgets = localStorage.getItem('budgets') || '{}';
        const localCategories = localStorage.getItem('customCategories') || '[]';
        const localRecurring = localStorage.getItem('recurringExpenses') || '[]';
        const localAppliedMonths = localStorage.getItem('appliedRecurringMonths') || '[]';
        const localFamily = localStorage.getItem('familyMembers') || '[]';
        const localSavings = localStorage.getItem('savings') || '0';
        
        setState(prev => ({
          ...prev,
          transactions: JSON.parse(localTransactions),
          budgets: JSON.parse(localBudgets),
          customCategories: JSON.parse(localCategories),
          recurringExpenses: JSON.parse(localRecurring),
          appliedRecurringMonths: JSON.parse(localAppliedMonths),
          familyMembers: JSON.parse(localFamily),
          savings: parseFloat(localSavings)
        }));
        
        setIsLoaded(true); 
      }
    );

    const checkInitialization = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await handleFirstTimeUser();
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.warn("User settings access denied. Using local fallback.");
        }
      }
    };
    checkInitialization();

    return unsubscribe;
  }, [currentUser, handleFirstTimeUser]);

  // Listen to Budgets and Settings
  useEffect(() => {
    if (!currentUser) return;

    const unsubSettings = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setState(prev => ({
          ...prev,
          budgets: data.budgets || {},
          customCategories: data.customCategories || [],
          recurringExpenses: data.recurringExpenses || [],
          appliedRecurringMonths: data.appliedRecurringMonths || [],
          familyMembers: data.familyMembers || [],
          savings: data.savings || 0
        }));
        
        localStorage.setItem('budgets', JSON.stringify(data.budgets || {}));
        localStorage.setItem('customCategories', JSON.stringify(data.customCategories || []));
        localStorage.setItem('recurringExpenses', JSON.stringify(data.recurringExpenses || []));
        localStorage.setItem('appliedRecurringMonths', JSON.stringify(data.appliedRecurringMonths || []));
        localStorage.setItem('familyMembers', JSON.stringify(data.familyMembers || []));
        localStorage.setItem('savings', JSON.stringify(data.savings || 0));
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Settings permission denied. Using cached values.");
      }
    });

    return unsubSettings;
  }, [currentUser]);

  // Derived state
  const currentMonthTransactions = useMemo(() => {
    return state.transactions.filter((t) => t.date.startsWith(currentMonth));
  }, [state.transactions, currentMonth]);

  const totalSpent = useMemo(() => {
    return currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentBudget = state.budgets[currentMonth]?.totalBudget || 0;
  const upiBudget = state.budgets[currentMonth]?.upiBudget || 0;
  const cashBudget = Math.max(0, currentBudget - upiBudget);
  const remainingBalance = currentBudget - totalSpent;

  // UPI / Cash breakdowns
  const upiSpent = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.paymentMode === 'UPI')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const cashSpent = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.paymentMode === 'Cash')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const upiRemaining = upiBudget - upiSpent;
  const cashRemaining = cashBudget - cashSpent;

  // Today's spend breakdowns
  const today = new Date().toISOString().split('T')[0];
  const todaySpent = useMemo(() => {
    return currentMonthTransactions.filter(t => t.date === today).reduce((s, t) => s + t.amount, 0);
  }, [currentMonthTransactions, today]);
  const todayUpiSpent = useMemo(() => {
    return currentMonthTransactions.filter(t => t.date === today && t.paymentMode === 'UPI').reduce((s, t) => s + t.amount, 0);
  }, [currentMonthTransactions, today]);
  const todayCashSpent = useMemo(() => {
    return currentMonthTransactions.filter(t => t.date === today && t.paymentMode === 'Cash').reduce((s, t) => s + t.amount, 0);
  }, [currentMonthTransactions, today]);

  // Daily average spend
  const dailyAverage = useMemo(() => {
    const daysWithSpending = new Set(currentMonthTransactions.map(t => t.date)).size;
    return daysWithSpending > 0 ? totalSpent / daysWithSpending : 0;
  }, [currentMonthTransactions, totalSpent]);

  // Spending velocity (projected month-end total)
  const spendingVelocity = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (dayOfMonth === 0) return 0;
    return (totalSpent / dayOfMonth) * daysInMonth;
  }, [totalSpent]);

  // Budget health score (0-100)
  const budgetHealthScore = useMemo(() => {
    if (currentBudget === 0) return 50;
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const expectedSpendRate = dayOfMonth / daysInMonth;
    const actualSpendRate = totalSpent / currentBudget;
    if (actualSpendRate >= 1) return 0;
    const ratio = actualSpendRate / expectedSpendRate;
    if (ratio <= 0.5) return 100;
    if (ratio <= 0.8) return 85;
    if (ratio <= 1.0) return 70;
    if (ratio <= 1.2) return 50;
    if (ratio <= 1.5) return 30;
    return 10;
  }, [totalSpent, currentBudget]);

  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...state.customCategories];
  }, [state.customCategories]);

  // Previous month carry forward calculation
  const previousMonthRemaining = useMemo(() => {
    const prevMonth = getPreviousMonthKey(currentMonth);
    const prevBudget = state.budgets[prevMonth]?.totalBudget || 0;
    if (prevBudget === 0) return 0;
    const prevTransactions = state.transactions.filter(t => t.date.startsWith(prevMonth));
    const prevSpent = prevTransactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.max(0, prevBudget - prevSpent);
  }, [state.transactions, state.budgets, currentMonth]);

  // ============ ACTIONS ============

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!currentUser) return;
    
    const newTransaction: Transaction = {
      ...transaction,
      paymentMode: transaction.paymentMode || 'Cash',
      id: crypto.randomUUID(),
      userId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await addDoc(collection(db, "expenses"), {
        ...transaction,
        paymentMode: transaction.paymentMode || 'Cash',
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn("Using local storage fallback for adding transaction.");
        const updatedTransactions = [...state.transactions, newTransaction];
        setState(prev => ({ ...prev, transactions: updatedTransactions }));
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        toast.success("Saved to local storage (Firebase Offline)");
      } else {
        throw error;
      }
    }
  };

  const bulkAddTransactions = async (transactions: Omit<Transaction, 'id' | 'createdAt' | 'userId'>[]) => {
    if (!currentUser) return;
    
    const newTransactions: Transaction[] = transactions.map(t => ({
      ...t,
      paymentMode: t.paymentMode || 'Cash',
      id: crypto.randomUUID(),
      userId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    try {
      const batch = writeBatch(db);
      transactions.forEach(t => {
        const ref = doc(collection(db, "expenses"));
        batch.set(ref, {
          ...t,
          paymentMode: t.paymentMode || 'Cash',
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn("Using local storage fallback for bulk adding transactions.");
        const updatedTransactions = [...state.transactions, ...newTransactions];
        setState(prev => ({ ...prev, transactions: updatedTransactions }));
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        toast.success(`Imported ${transactions.length} items to local storage`);
      } else {
        throw error;
      }
    }
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const ref = doc(db, "expenses", id);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn("Using local storage fallback for editing transaction.");
        const updatedTransactions = state.transactions.map(t => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
        );
        setState(prev => ({ ...prev, transactions: updatedTransactions }));
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      } else {
        throw error;
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn("Using local storage fallback for deleting transaction.");
        const updatedTransactions = state.transactions.filter(t => t.id !== id);
        setState(prev => ({ ...prev, transactions: updatedTransactions }));
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      } else {
        throw error;
      }
    }
  };

  const updateBudget = async (month: string, newBudget: number, reason?: string) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    const existingBudget = state.budgets[month];
    const previousBudget = existingBudget?.totalBudget || 0;

    const newHistoryEntry = {
      date: new Date().toISOString(),
      previousBudget,
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
        console.warn("Using local storage fallback for updating budget.");
        setState(prev => ({ ...prev, budgets: updatedBudgets }));
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      } else {
        throw error;
      }
    }
  };

  // Carry forward remaining balance from previous month
  const carryForwardBudget = async (amount: number, target: 'budget' | 'savings') => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    
    const existingBudget = state.budgets[currentMonth];
    let updatedBudgets = { ...state.budgets };
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

      // Add a history entry
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
        ? `₹${amount.toLocaleString()} added to this month's budget!` 
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

  // Update savings
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
        await updateDoc(userRef, {
          customCategories: updatedCategories
        });
      } catch (error: any) {
        if (error?.code === 'permission-denied') {
          console.warn("Using local storage fallback for adding custom category.");
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
      await updateDoc(userRef, {
        customCategories: updatedCategories
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn("Using local storage fallback for deleting custom category.");
        setState(prev => ({ ...prev, customCategories: updatedCategories }));
        localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
      } else {
        throw error;
      }
    }
  };

  // ============ RECURRING ACTIONS ============

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
      await updateDoc(userRef, {
        recurringExpenses: [...state.recurringExpenses, newRecurring]
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const updatedRecurring = [...state.recurringExpenses, newRecurring];
        setState(prev => ({ ...prev, recurringExpenses: updatedRecurring }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updatedRecurring));
      } else {
        throw error;
      }
    }
  };

  const editRecurringExpense = async (id: string, updates: Partial<RecurringExpense>) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        recurringExpenses: state.recurringExpenses.map(r => 
          r.id === id ? { ...r, ...updates } : r
        )
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const updatedRecurring = state.recurringExpenses.map(r => 
          r.id === id ? { ...r, ...updates } : r
        );
        setState(prev => ({ ...prev, recurringExpenses: updatedRecurring }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updatedRecurring));
      } else {
        throw error;
      }
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        recurringExpenses: state.recurringExpenses.filter(r => r.id !== id)
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const updatedRecurring = state.recurringExpenses.filter(r => r.id !== id);
        setState(prev => ({ ...prev, recurringExpenses: updatedRecurring }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updatedRecurring));
      } else {
        throw error;
      }
    }
  };

  const toggleRecurringExpense = async (id: string) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        recurringExpenses: state.recurringExpenses.map(r => 
          r.id === id ? { ...r, isActive: !r.isActive } : r
        )
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        const updatedRecurring = state.recurringExpenses.map(r => 
          r.id === id ? { ...r, isActive: !r.isActive } : r
        );
        setState(prev => ({ ...prev, recurringExpenses: updatedRecurring }));
        localStorage.setItem('recurringExpenses', JSON.stringify(updatedRecurring));
      } else {
        throw error;
      }
    }
  };

  // ============ FAMILY WALLET ACTIONS ============

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
    const updated = [...state.familyMembers, newMember];
    await _updateFamilyMembers(updated);
    toast.success(`${name} added to family wallet!`);
  };

  const removeFamilyMember = async (id: string) => {
    const member = state.familyMembers.find(m => m.id === id);
    const updated = state.familyMembers.filter(m => m.id !== id);
    await _updateFamilyMembers(updated);
    toast.success(`${member?.name || 'Member'} removed from family wallet`);
  };

  const modifyFamilyMemberAmount = async (id: string, amount: number, type: 'deposit' | 'withdraw', description: string = '') => {
    const updated = state.familyMembers.map(m => {
      if (m.id !== id) return m;
      const newBalance = type === 'deposit' ? m.balance + amount : Math.max(0, m.balance - amount);
      const txn: FamilyTransaction = {
        id: crypto.randomUUID(),
        type,
        amount,
        description: description || (type === 'deposit' ? 'Amount added' : 'Amount withdrawn'),
        date: new Date().toISOString().split('T')[0]
      };
      return { ...m, balance: newBalance, transactions: [...m.transactions, txn] };
    });
    await _updateFamilyMembers(updated);
  };

  const transferBetweenFamily = async (fromId: string, toId: string, amount: number) => {
    const fromMember = state.familyMembers.find(m => m.id === fromId);
    const toMember = state.familyMembers.find(m => m.id === toId);
    if (!fromMember || !toMember) return;
    if (fromMember.balance < amount) {
      toast.error('Insufficient balance for transfer');
      return;
    }

    const updated = state.familyMembers.map(m => {
      if (m.id === fromId) {
        const txn: FamilyTransaction = {
          id: crypto.randomUUID(),
          type: 'transfer_out',
          amount,
          description: `Transfer to ${toMember.name}`,
          date: new Date().toISOString().split('T')[0],
          relatedMemberId: toId,
          relatedMemberName: toMember.name
        };
        return { ...m, balance: m.balance - amount, transactions: [...m.transactions, txn] };
      }
      if (m.id === toId) {
        const txn: FamilyTransaction = {
          id: crypto.randomUUID(),
          type: 'transfer_in',
          amount,
          description: `Transfer from ${fromMember.name}`,
          date: new Date().toISOString().split('T')[0],
          relatedMemberId: fromId,
          relatedMemberName: fromMember.name
        };
        return { ...m, balance: m.balance + amount, transactions: [...m.transactions, txn] };
      }
      return m;
    });
    await _updateFamilyMembers(updated);
    toast.success(`₹${amount.toLocaleString()} transferred from ${fromMember.name} to ${toMember.name}`);
  };

  const transferFamilyToMain = async (memberId: string, amount: number) => {
    const member = state.familyMembers.find(m => m.id === memberId);
    if (!member || member.balance < amount) {
      toast.error('Insufficient balance');
      return;
    }

    // Deduct from family member
    const updatedMembers = state.familyMembers.map(m => {
      if (m.id !== memberId) return m;
      const txn: FamilyTransaction = {
        id: crypto.randomUUID(),
        type: 'transfer_out',
        amount,
        description: 'Transfer to Main Wallet',
        date: new Date().toISOString().split('T')[0]
      };
      return { ...m, balance: m.balance - amount, transactions: [...m.transactions, txn] };
    });

    // Add to current month budget
    const existingBudget = state.budgets[currentMonth];
    const currentTotal = existingBudget?.totalBudget || 0;
    const updatedBudgets = {
      ...state.budgets,
      [currentMonth]: {
        month: currentMonth,
        totalBudget: currentTotal + amount,
        history: [...(existingBudget?.history || []), {
          date: new Date().toISOString(),
          previousBudget: currentTotal,
          newBudget: currentTotal + amount,
          reason: `Transfer from ${member.name}'s family wallet`
        }],
        carryForward: existingBudget?.carryForward || 0,
        carryForwardToSavings: existingBudget?.carryForwardToSavings || 0
      }
    };

    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userRef, { familyMembers: updatedMembers, budgets: updatedBudgets });
      toast.success(`₹${amount.toLocaleString()} transferred from ${member.name} to main wallet`);
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, familyMembers: updatedMembers, budgets: updatedBudgets }));
        localStorage.setItem('familyMembers', JSON.stringify(updatedMembers));
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      } else {
        throw error;
      }
    }
  };

  const transferMainToFamily = async (memberId: string, amount: number) => {
    const member = state.familyMembers.find(m => m.id === memberId);
    if (!member) return;

    // Add to family member
    const updatedMembers = state.familyMembers.map(m => {
      if (m.id !== memberId) return m;
      const txn: FamilyTransaction = {
        id: crypto.randomUUID(),
        type: 'transfer_in',
        amount,
        description: 'Transfer from Main Wallet',
        date: new Date().toISOString().split('T')[0]
      };
      return { ...m, balance: m.balance + amount, transactions: [...m.transactions, txn] };
    });

    // Deduct from current month budget
    const existingBudget = state.budgets[currentMonth];
    const currentTotal = existingBudget?.totalBudget || 0;
    const newTotal = Math.max(0, currentTotal - amount);
    const updatedBudgets = {
      ...state.budgets,
      [currentMonth]: {
        month: currentMonth,
        totalBudget: newTotal,
        history: [...(existingBudget?.history || []), {
          date: new Date().toISOString(),
          previousBudget: currentTotal,
          newBudget: newTotal,
          reason: `Transfer to ${member.name}'s family wallet`
        }],
        carryForward: existingBudget?.carryForward || 0,
        carryForwardToSavings: existingBudget?.carryForwardToSavings || 0
      }
    };

    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userRef, { familyMembers: updatedMembers, budgets: updatedBudgets });
      toast.success(`₹${amount.toLocaleString()} transferred from main wallet to ${member.name}`);
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, familyMembers: updatedMembers, budgets: updatedBudgets }));
        localStorage.setItem('familyMembers', JSON.stringify(updatedMembers));
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
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

  // UPI Budget management
  const updateUpiBudget = async (month: string, amount: number) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    const existingBudget = state.budgets[month];
    const updatedBudgets = {
      ...state.budgets,
      [month]: {
        ...existingBudget,
        month,
        totalBudget: existingBudget?.totalBudget || 0,
        history: existingBudget?.history || [],
        upiBudget: amount
      }
    };
    try {
      await updateDoc(userRef, { budgets: updatedBudgets });
      toast.success(`UPI budget updated to ₹${amount.toLocaleString()}`);
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, budgets: updatedBudgets }));
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      } else {
        throw error;
      }
    }
  };

  const removeUpiBudget = async (month: string) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    const existingBudget = state.budgets[month];
    if (!existingBudget) return;
    const { upiBudget: _, ...rest } = existingBudget;
    const updatedBudgets = {
      ...state.budgets,
      [month]: { ...rest, upiBudget: 0 }
    };
    try {
      await updateDoc(userRef, { budgets: updatedBudgets });
      toast.success('UPI budget removed');
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        setState(prev => ({ ...prev, budgets: updatedBudgets }));
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      } else {
        throw error;
      }
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
    // Family wallet
    addFamilyMember,
    removeFamilyMember,
    modifyFamilyMemberAmount,
    transferBetweenFamily,
    transferFamilyToMain,
    transferMainToFamily,
    hasLocalData: localStorage.getItem('transactions') !== null && JSON.parse(localStorage.getItem('transactions') || '[]').length > 0,
    syncLocalData: async () => {
      const localData = localStorage.getItem('transactions');
      if (!localData || !currentUser) return;
      const transactions = JSON.parse(localData);
      if (transactions.length === 0) return;
      const toastId = toast.loading("Syncing data to cloud...");
      try {
        const batch = writeBatch(db);
        transactions.forEach((t: any) => {
          const ref = doc(collection(db, "expenses"));
          const { id, ...data } = t;
          batch.set(ref, { ...data, userId: currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        });
        await batch.commit();
        localStorage.removeItem('transactions');
        toast.success("Sync complete!", { id: toastId });
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error("Sync failed.", { id: toastId });
      }
    }
  };
}