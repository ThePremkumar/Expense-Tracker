import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  Transaction,
  MonthlyBudget,
  Category,
  RecurringExpense } from
'../types';
import {
  getCurrentMonthKey,
  getYearKey,
  getMonthsInYear } from
'../utils/helpers';

const STORAGE_KEY = 'student_expense_tracker_data';

const DEFAULT_CATEGORIES: Category[] = [
'Room Rent',
'Food',
'Dress',
'Travel',
'Essentials',
'Miscellaneous'];


const initialState: AppState = {
  transactions: [],
  budgets: {},
  customCategories: [],
  recurringExpenses: [],
  appliedRecurringMonths: []
};

export function useExpenseTracker() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey());

  // Load from local storage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setState({
          ...initialState,
          ...parsed,
          customCategories: parsed.customCategories || [],
          recurringExpenses: parsed.recurringExpenses || [],
          appliedRecurringMonths: parsed.appliedRecurringMonths || []
        });
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Auto-apply recurring expenses when month changes or on first load
  useEffect(() => {
    if (!isLoaded) return;

    const activeRecurring = state.recurringExpenses.filter((r) => r.isActive);
    if (activeRecurring.length === 0) return;
    if (state.appliedRecurringMonths.includes(currentMonth)) return;

    // Generate transactions for this month from recurring expenses
    const firstOfMonth = `${currentMonth}-01`;
    const newTransactions: Transaction[] = activeRecurring.map((r) => ({
      id: crypto.randomUUID(),
      title: r.title,
      amount: r.amount,
      category: r.category,
      date: firstOfMonth,
      notes: r.notes ?
      `${r.notes} (Auto-added)` :
      'Auto-added from fixed expenses',
      createdAt: Date.now(),
      isRecurring: true
    }));

    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, ...newTransactions],
      appliedRecurringMonths: [...prev.appliedRecurringMonths, currentMonth]
    }));
  }, [
  currentMonth,
  isLoaded,
  state.recurringExpenses,
  state.appliedRecurringMonths]
  );

  // Derived state for current month
  const currentMonthTransactions = useMemo(() => {
    return state.transactions.
    filter((t) => t.date.startsWith(currentMonth)).
    sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, currentMonth]);

  const totalSpent = useMemo(() => {
    return currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentBudget = state.budgets[currentMonth]?.totalBudget || 0;
  const remainingBalance = currentBudget - totalSpent;

  // All categories (default + custom)
  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...state.customCategories];
  }, [state.customCategories]);

  // Yearly transactions
  const getYearlyTransactions = (year: string) => {
    return state.transactions.filter((t) => t.date.startsWith(year));
  };

  // Yearly budget total
  const getYearlyBudgetTotal = (year: string) => {
    const monthsInYear = getMonthsInYear(year);
    return monthsInYear.reduce((sum, month) => {
      return sum + (state.budgets[month]?.totalBudget || 0);
    }, 0);
  };

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(getYearKey(new Date()));
    state.transactions.forEach((t) => years.add(t.date.substring(0, 4)));
    Object.keys(state.budgets).forEach((m) => years.add(m.substring(0, 4)));
    return Array.from(years).sort().reverse();
  }, [state.transactions, state.budgets]);

  // Actions
  const addTransaction = (
  transaction: Omit<Transaction, 'id' | 'createdAt'>) =>
  {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction]
    }));
  };

  const bulkAddTransactions = (
    transactions: Omit<Transaction, 'id' | 'createdAt'>[]
  ) => {
    const newTransactions: Transaction[] = transactions.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    }));
    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, ...newTransactions]
    }));
  };


  const editTransaction = (id: string, updates: Partial<Transaction>) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
      )
    }));
  };

  const deleteTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id)
    }));
  };

  const updateBudget = (month: string, newBudget: number, reason?: string) => {
    setState((prev) => {
      const existingBudget = prev.budgets[month];
      const previousBudget = existingBudget?.totalBudget || 0;

      const newHistoryEntry = {
        date: new Date().toISOString(),
        previousBudget,
        newBudget,
        reason
      };

      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [month]: {
            month,
            totalBudget: newBudget,
            history: existingBudget ?
            [...existingBudget.history, newHistoryEntry] :
            [newHistoryEntry]
          }
        }
      };
    });
  };

  const addCustomCategory = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !allCategories.includes(trimmed)) {
      setState((prev) => ({
        ...prev,
        customCategories: [...prev.customCategories, trimmed]
      }));
    }
  };

  // Recurring expense actions
  const addRecurringExpense = (
  expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) =>
  {
    const newExpense: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: Date.now()
    };
    setState((prev) => ({
      ...prev,
      recurringExpenses: [...prev.recurringExpenses, newExpense]
    }));
  };

  const editRecurringExpense = (
  id: string,
  updates: Partial<RecurringExpense>) =>
  {
    setState((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map((r) =>
      r.id === id ? { ...r, ...updates } : r
      )
    }));
  };

  const deleteRecurringExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter((r) => r.id !== id)
    }));
  };

  const toggleRecurringExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
      )
    }));
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(getCurrentMonthKey());
    state.transactions.forEach((t) => months.add(t.date.substring(0, 7)));
    Object.keys(state.budgets).forEach((m) => months.add(m));
    return Array.from(months).sort().reverse();
  }, [state.transactions, state.budgets]);

  // Total fixed expenses per month
  const totalFixedExpenses = useMemo(() => {
    return state.recurringExpenses.
    filter((r) => r.isActive).
    reduce((sum, r) => sum + r.amount, 0);
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
    allCategories,
    addTransaction,
    bulkAddTransactions,
    editTransaction,
    deleteTransaction,
    updateBudget,
    addCustomCategory,
    isLoaded,
    availableYears,
    getYearlyTransactions,
    getYearlyBudgetTotal,
    // Recurring expense features
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    totalFixedExpenses
  };
}