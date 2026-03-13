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
  RecurringExpense 
} from '../types';
import {
  getCurrentMonthKey
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

const DEV_MODE = true; // Enabled for development to allow local storage fallback when Firestore permissions fail

export function useExpenseTracker() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<AppState>({
    transactions: [],
    budgets: {},
    customCategories: [],
    recurringExpenses: [],
    appliedRecurringMonths: []
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey());

  const handleFirstTimeUser = useCallback(async () => {
    if (!currentUser) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // First time initialization - Keep it empty
      const batch = writeBatch(db);
      
      batch.set(userDocRef, {
        customCategories: [],
        budgets: {},
        recurringExpenses: [],
        appliedRecurringMonths: []
      });

      await batch.commit();
    }
  }, [currentUser]);

  // Listen to Transactions
  useEffect(() => {
    if (!currentUser) return;

    if (DEV_MODE && false) { // Skip this for now, handled by onSnapshot error
      // In development mode with permission issues, load all data from localStorage
      const localTransactions = localStorage.getItem('transactions') || '[]';
      const localBudgets = localStorage.getItem('budgets') || '{}';
      const localCategories = localStorage.getItem('customCategories') || '[]';
      const localRecurring = localStorage.getItem('recurringExpenses') || '[]';
      const localAppliedMonths = localStorage.getItem('appliedRecurringMonths') || '[]';
      
      setState({
        transactions: JSON.parse(localTransactions),
        budgets: JSON.parse(localBudgets),
        customCategories: JSON.parse(localCategories),
        recurringExpenses: JSON.parse(localRecurring),
        appliedRecurringMonths: JSON.parse(localAppliedMonths)
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
          transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        
        setState(prev => ({ ...prev, transactions: transactionsData }));
        setIsLoaded(true);
      },
      (error) => {
        console.error("Firestore error:", error);
        
        // Handle common Firestore errors
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
        
        // Load from localStorage as fallback for ANY query error so user sees SOMETHING
        const localTransactions = localStorage.getItem('transactions') || '[]';
        const localBudgets = localStorage.getItem('budgets') || '{}';
        const localCategories = localStorage.getItem('customCategories') || '[]';
        const localRecurring = localStorage.getItem('recurringExpenses') || '[]';
        const localAppliedMonths = localStorage.getItem('appliedRecurringMonths') || '[]';
        
        setState(prev => ({
          ...prev,
          transactions: JSON.parse(localTransactions),
          budgets: JSON.parse(localBudgets),
          customCategories: JSON.parse(localCategories),
          recurringExpenses: JSON.parse(localRecurring),
          appliedRecurringMonths: JSON.parse(localAppliedMonths)
        }));
        
        setIsLoaded(true); 
      }
    );

    // Independent check for new user initialization
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
          appliedRecurringMonths: data.appliedRecurringMonths || []
        }));
        
        // Always cache to local storage in case of future permission issues
        localStorage.setItem('budgets', JSON.stringify(data.budgets || {}));
        localStorage.setItem('customCategories', JSON.stringify(data.customCategories || []));
        localStorage.setItem('recurringExpenses', JSON.stringify(data.recurringExpenses || []));
        localStorage.setItem('appliedRecurringMonths', JSON.stringify(data.appliedRecurringMonths || []));
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
  const remainingBalance = currentBudget - totalSpent;

  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...state.customCategories];
  }, [state.customCategories]);

  // Actions
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!currentUser) return;
    
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      userId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await addDoc(collection(db, "expenses"), {
        ...transaction,
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
        history: existingBudget ? [...existingBudget.history, newHistoryEntry] : [newHistoryEntry]
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


  // Recurring Actions (simplified for brevity, stored in user doc)
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
        console.warn("Using local storage fallback for adding recurring expense.");
        const updatedRecurring = [...state.recurringExpenses, newRecurring];
        const updatedState = { ...state, recurringExpenses: updatedRecurring };
        setState(updatedState);
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
        console.warn("Using local storage fallback for editing recurring expense.");
        const updatedRecurring = state.recurringExpenses.map(r => 
          r.id === id ? { ...r, ...updates } : r
        );
        const updatedState = { ...state, recurringExpenses: updatedRecurring };
        setState(updatedState);
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
        console.warn("Using local storage fallback for deleting recurring expense.");
        const updatedRecurring = state.recurringExpenses.filter(r => r.id !== id);
        const updatedState = { ...state, recurringExpenses: updatedRecurring };
        setState(updatedState);
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
        console.warn("Using local storage fallback for toggling recurring expense.");
        const updatedRecurring = state.recurringExpenses.map(r => 
          r.id === id ? { ...r, isActive: !r.isActive } : r
        );
        const updatedState = { ...state, recurringExpenses: updatedRecurring };
        setState(updatedState);
        localStorage.setItem('recurringExpenses', JSON.stringify(updatedRecurring));
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

  return {
    state,
    currentMonth,
    setCurrentMonth,
    currentMonthTransactions,
    totalSpent,
    currentBudget,
    remainingBalance,
    availableMonths,
    categories: allCategories,
    addTransaction,
    bulkAddTransactions,
    editTransaction,
    deleteTransaction,
    updateBudget,
    addCustomCategory,
    deleteCustomCategory,
    isLoaded,
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    totalFixedExpenses,
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