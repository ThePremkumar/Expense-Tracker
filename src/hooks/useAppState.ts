import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AppState, Transaction } from '../types';
import { getCurrentMonthKey } from '../utils/helpers';

export function useAppState() {
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

  // 1. Sync User Document (Budgets, Savings, Settings)
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
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Using local storage fallback for user profile.");
        const getLocal = (key: string, def: any) => {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : def;
        };
        setState(prev => ({
          ...prev,
          budgets: getLocal('budgets', {}),
          savings: getLocal('savings', 0),
          customCategories: getLocal('customCategories', []),
          recurringExpenses: getLocal('recurringExpenses', []),
          familyMembers: getLocal('familyMembers', []),
        }));
      }
      setIsLoaded(true);
    });

    return () => unsub();
  }, [currentUser]);

  // 2. Sync Transactions
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
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Using local storage fallback for transactions.");
        const localTxns = localStorage.getItem('transactions');
        if (localTxns) {
          setState(prev => ({ ...prev, transactions: JSON.parse(localTxns) }));
        }
      }
    });

    return () => unsub();
  }, [currentUser]);

  return { 
    state, 
    setState, 
    currentMonth, 
    setCurrentMonth, 
    isLoaded 
  };
}
