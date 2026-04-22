import { useMemo } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Transaction,
  RecurringExpense,
  FamilyMember,
  FamilyTransaction,
  PaymentMode,
} from '../types';
import {
  getCurrentMonthKey,
} from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAppState } from './useAppState';
import { useFinanceLogic } from './useFinanceLogic';

export function useExpenseTracker() {
  const { currentUser } = useAuth();
  const { state, setState, currentMonth, setCurrentMonth, isLoaded } = useAppState();
  const metrics = useFinanceLogic({ state, currentMonth });

  const categories = useMemo(() => {
    return state.customCategories.length > 0 
      ? state.customCategories 
      : ['Room Rent', 'Food', 'Dress', 'Travel', 'Essentials', 'Miscellaneous'];
  }, [state.customCategories]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(getCurrentMonthKey());
    state.transactions.forEach((t) => months.add(t.date.substring(0, 7)));
    Object.keys(state.budgets).forEach((m) => months.add(m));
    return Array.from(months).sort().reverse();
  }, [state.transactions, state.budgets]);

  // HELPER: Initialize or Update User Profile with the current state to ensure Firestore existence
  const syncUserProfile = async (updates: Partial<any>) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await setDoc(userRef, updates, { merge: true });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        // Fallback strategy: update local state only
        setState(prev => ({ ...prev, ...updates }));
        Object.entries(updates).forEach(([key, val]) => {
          localStorage.setItem(key, JSON.stringify(val));
        });
      } else {
        throw error;
      }
    }
  };

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
        const localId = `local-${Date.now()}`;
        const newTxn: Transaction = {
          ...t,
          id: localId,
          userId: currentUser.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        const updatedTxns = [newTxn, ...state.transactions];
        setState(prev => ({ ...prev, transactions: updatedTxns }));
        localStorage.setItem('transactions', JSON.stringify(updatedTxns));
      } else {
        toast.error("Failed to add transaction.");
        throw error;
      }
    }
  };

  const bulkAddTransactions = async (transactions: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => {
    if (!currentUser) return;
    const batchSize = 500;
    const toastId = toast.loading(`Processing ${transactions.length} items...`);
    
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
      toast.error("Import restricted or failed.", { id: toastId });
      throw error;
    }
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!currentUser) return;
    const { id: _id, userId: _uid, ...cleanUpdates } = updates as any;
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

  const updateBudget = async (month: string, budget: number, upiBudget?: number, cashBudget?: number, reason = 'Budget update') => {
    const existing = state.budgets[month];
    const newHistoryEntry = {
      date: new Date().toISOString(),
      previousBudget: existing?.totalBudget || 0,
      newBudget: budget,
      reason
    };

    const updatedBudgets = {
      ...state.budgets,
      [month]: {
        ...(existing || { month, totalBudget: 0, history: [], carryForward: 0, carryForwardToSavings: 0 }),
        totalBudget: budget,
        upiBudget: upiBudget !== undefined ? upiBudget : (existing?.upiBudget ?? budget / 2),
        // If cashBudget is not provided, it should absorb the remainder of the total budget to ensure reflection in pools
        cashBudget: cashBudget !== undefined ? cashBudget : (budget - (upiBudget !== undefined ? upiBudget : (existing?.upiBudget ?? budget / 2))),
        history: existing ? [...existing.history, newHistoryEntry] : [newHistoryEntry],
      }
    };

    await syncUserProfile({ budgets: updatedBudgets });
  };

  const transferBetweenModes = async (amount: number, from: 'UPI' | 'Cash') => {
    const existing = state.budgets[currentMonth];
    if (!existing) return toast.error("Budget not set for this month");

    const upi = existing.upiBudget || 0;
    const cash = existing.cashBudget || 0;

    let updatedUpi = upi;
    let updatedCash = cash;

    if (from === 'Cash') {
      if (cash < amount) return toast.error("Insufficient Cash budget");
      updatedUpi += amount;
      updatedCash -= amount;
    } else {
      if (upi < amount) return toast.error("Insufficient UPI budget");
      updatedUpi -= amount;
      updatedCash += amount;
    }

    const updatedBudgets = {
      ...state.budgets,
      [currentMonth]: {
        ...existing,
        upiBudget: updatedUpi,
        cashBudget: updatedCash,
      }
    };

    await syncUserProfile({ budgets: updatedBudgets });
    toast.success(`Transferred ₹${amount} from ${from} to ${from === 'Cash' ? 'UPI' : 'Cash'}`);
  };

  const addMissingAmount = async (amount: number, mode: 'UPI' | 'Cash', notes = '') => {
    await addTransaction({
      title: 'Missing Amount (Discrepancy)',
      amount,
      category: 'Miscellaneous',
      paymentMode: mode,
      date: new Date().toISOString().split('T')[0],
      notes: notes || 'Automatically adjusted for missing funds',
    });
    toast.success(`₹${amount} recorded as missing ${mode}`);
  };

  const updateMissingAmount = async (month: string, amount: number) => {
    const existing = state.budgets[month];
    const updatedBudgets = {
      ...state.budgets,
      [month]: {
        ...(existing || { month, totalBudget: 0, history: [], carryForward: 0, carryForwardToSavings: 0 }),
        missingAmountOverride: amount
      }
    };
    await syncUserProfile({ budgets: updatedBudgets });
    toast.success(`Missing amount updated for ${month}`);
  };

  const carryForwardBudget = async (amount: number, target: 'budget' | 'savings') => {
    const existingBudget = state.budgets[currentMonth];
    const updatedBudgets = { ...state.budgets };
    let updatedSavings = state.savings;

    if (target === 'budget') {
      const currentTotal = existingBudget?.totalBudget || 0;
      const historyEntry = {
        date: new Date().toISOString(),
        previousBudget: currentTotal,
        newBudget: currentTotal + amount,
        reason: `Carry forward from previous month`
      };

      updatedBudgets[currentMonth] = {
        ...(existingBudget || { month: currentMonth, totalBudget: 0, history: [], carryForward: 0, carryForwardToSavings: 0 }),
        totalBudget: currentTotal + amount,
        carryForward: amount,
        history: existingBudget ? [...existingBudget.history, historyEntry] : [historyEntry]
      };
    } else {
      updatedSavings += amount;
      if (existingBudget) {
        updatedBudgets[currentMonth] = {
          ...existingBudget,
          carryForwardToSavings: (existingBudget.carryForwardToSavings || 0) + amount
        };
      }
    }

    await syncUserProfile({ budgets: updatedBudgets, savings: updatedSavings });
    toast.success(target === 'budget' ? `₹${amount} added to budget!` : `₹${amount} saved!`);
  };

  const updateSavings = async (newSavings: number) => {
    await syncUserProfile({ savings: newSavings });
  };

  const addCustomCategory = async (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !categories.includes(trimmed)) {
      const updatedCategories = [...state.customCategories, trimmed];
      await syncUserProfile({ customCategories: updatedCategories });
    }
  };

  const deleteCustomCategory = async (name: string) => {
    const updatedCategories = state.customCategories.filter(c => c !== name);
    await syncUserProfile({ customCategories: updatedCategories });
  };

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => {
    const newRecurring: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: Date.now()
    };
    await syncUserProfile({ recurringExpenses: [...state.recurringExpenses, newRecurring] });
  };

  const editRecurringExpense = async (id: string, updates: Partial<RecurringExpense>) => {
    const updated = state.recurringExpenses.map(r => r.id === id ? { ...r, ...updates } : r);
    await syncUserProfile({ recurringExpenses: updated });
  };

  const toggleRecurringExpense = async (id: string) => {
    const updated = state.recurringExpenses.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    await syncUserProfile({ recurringExpenses: updated });
  };

  const deleteRecurringExpense = async (id: string) => {
    const updated = state.recurringExpenses.filter(r => r.id !== id);
    await syncUserProfile({ recurringExpenses: updated });
  };

  // FAMILY WALLET ACTIONS
  const addFamilyMember = async (name: string, initialBalance = 0) => {
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
    await syncUserProfile({ familyMembers: [...state.familyMembers, newMember] });
    toast.success(`${name} joined family wallet!`);
  };

  const removeFamilyMember = async (id: string) => {
    const updatedMembers = state.familyMembers.filter(m => m.id !== id);
    await syncUserProfile({ familyMembers: updatedMembers });
  };

  const modifyFamilyMemberAmount = async (id: string, amount: number, type: 'deposit' | 'withdraw', description = '', date?: string, mode?: string, notes?: string) => {
    const updated = state.familyMembers.map(m => {
      if (m.id !== id) return m;
      const newBalance = type === 'deposit' ? m.balance + amount : Math.max(0, m.balance - amount);
      const txn: FamilyTransaction = {
        id: crypto.randomUUID(),
        type,
        amount,
        description: description || (type === 'deposit' ? 'Refill' : 'Expense'),
        date: date || new Date().toISOString().split('T')[0],
        paymentMode: mode as PaymentMode,
        notes: notes
      };
      return { ...m, balance: newBalance, transactions: [...m.transactions, txn] };
    });
    await syncUserProfile({ familyMembers: updated });
  };

  const transferBetweenFamily = async (fromId: string, toId: string, amount: number, date?: string, mode?: string, description?: string) => {
    const fromMember = state.familyMembers.find(m => m.id === fromId);
    if (!fromMember || fromMember.balance < amount) return toast.error('Insufficient funds');
    
    const targetMember = state.familyMembers.find(m => m.id === toId);
    const txnDate = date || new Date().toISOString().split('T')[0];

    const updated = state.familyMembers.map(m => {
      if (m.id === fromId) {
        const txn: FamilyTransaction = { id: crypto.randomUUID(), type: 'transfer_out', amount, description: description || `Transfer to ${targetMember?.name}`, date: txnDate, paymentMode: mode as PaymentMode, relatedMemberId: toId, relatedMemberName: targetMember?.name };
        return { ...m, balance: m.balance - amount, transactions: [...m.transactions, txn] };
      }
      if (m.id === toId) {
        const txn: FamilyTransaction = { id: crypto.randomUUID(), type: 'transfer_in', amount, description: description || `Transfer from ${fromMember.name}`, date: txnDate, paymentMode: mode as PaymentMode, relatedMemberId: fromId, relatedMemberName: fromMember.name };
        return { ...m, balance: m.balance + amount, transactions: [...m.transactions, txn] };
      }
      return m;
    });
    await syncUserProfile({ familyMembers: updated });
  };

  const transferFamilyToMain = async (memberId: string, amount: number, date?: string, mode?: string, notes?: string) => {
    const member = state.familyMembers.find(m => m.id === memberId);
    if (!member || member.balance < amount) return;
    const txnDate = date || new Date().toISOString().split('T')[0];
    const updatedFamily = state.familyMembers.map(m => {
      if (m.id === memberId) {
        const txn: FamilyTransaction = { id: crypto.randomUUID(), type: 'withdraw', amount, description: 'Move to Main Wallet', date: txnDate, paymentMode: mode as PaymentMode, notes };
        return { ...m, balance: m.balance - amount, transactions: [...m.transactions, txn] };
      }
      return m;
    });
    await syncUserProfile({ familyMembers: updatedFamily });
    await updateBudget(currentMonth, metrics.currentBudget + amount, undefined, undefined, `Transfer from ${member.name}`);
  };

  const transferMainToFamily = async (memberId: string, amount: number, date?: string, mode?: string, notes?: string) => {
    const member = state.familyMembers.find(m => m.id === memberId);
    if (!member) return;
    if (metrics.currentBudget < amount) return toast.error('Exceeds current month budget');
    const txnDate = date || new Date().toISOString().split('T')[0];
    const updatedFamily = state.familyMembers.map(m => {
      if (m.id === memberId) {
        const txn: FamilyTransaction = { id: crypto.randomUUID(), type: 'deposit', amount, description: 'Refill from Main', date: txnDate, paymentMode: mode as PaymentMode, notes };
        return { ...m, balance: m.balance + amount, transactions: [...m.transactions, txn] };
      }
      return m;
    });
    await syncUserProfile({ familyMembers: updatedFamily });
    await updateBudget(currentMonth, Math.max(0, metrics.currentBudget - amount), undefined, undefined, `Sent to ${member.name}`);
  };

  const syncLocalData = async () => {
    const localData = localStorage.getItem('transactions');
    if (!localData || !currentUser) return;
    const txns = JSON.parse(localData);
    if (txns.length === 0) return;
    
    const toastId = toast.loading("Cloud syncing...");
    try {
      const batch = writeBatch(db);
      txns.forEach((t: any) => {
        const ref = doc(collection(db, "expenses"));
        const { id: _id, ...data } = t;
        batch.set(ref, { ...data, userId: currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
      await batch.commit();
      localStorage.removeItem('transactions');
      toast.success("Synced!", { id: toastId });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Sync failed.", { id: toastId });
    }
  };

  return {
    state,
    isLoaded,
    currentMonth,
    setCurrentMonth,
    categories,
    availableMonths,
    hasLocalData: localStorage.getItem('transactions') !== null && JSON.parse(localStorage.getItem('transactions') || '[]').length > 0,
    
    // Spread Metrics
    ...metrics,
    
    // Actions
    addTransaction,
    bulkAddTransactions,
    editTransaction,
    deleteTransaction,
    updateBudget,
    carryForwardBudget,
    updateSavings,
    addCustomCategory,
    deleteCustomCategory,
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    addFamilyMember,
    removeFamilyMember,
    modifyFamilyMemberAmount,
    transferBetweenFamily,
    transferFamilyToMain,
    transferMainToFamily,
    transferBetweenModes,
    addMissingAmount,
    updateMissingAmount,
    syncLocalData
  };
}