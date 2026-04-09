import { useMemo } from 'react';
import { AppState, Transaction } from '../types';
import { 
  getPreviousMonthKey, 
} from '../utils/helpers';
import { 
  calculateBudgetHealthScore, 
  projectMonthEndSpend, 
  calculateDailyAverage, 
  getPaymentModeBreakdown, 
  getTodaySpendingByMode 
} from '../utils/finance';

interface FinanceMetricsProps {
  state: AppState;
  currentMonth: string;
}

export function useFinanceLogic({ state, currentMonth }: FinanceMetricsProps) {
  // Filter transactions for the current month once
  const currentMonthTransactions = useMemo(() => {
    return state.transactions.filter(t => t.date.startsWith(currentMonth));
  }, [state.transactions, currentMonth]);

  // Breakdown by payment mode - CALC FIRST to avoid initialization errors
  const { upiSpent, cashSpent } = useMemo(() => {
    return getPaymentModeBreakdown(currentMonthTransactions);
  }, [currentMonthTransactions]);

  const totalMissing = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.title.toLowerCase().includes('missing amount'))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [currentMonthTransactions]);

  const totalSpent = useMemo(() => {
    return currentMonthTransactions
      .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0);
  }, [currentMonthTransactions]);

  const currentBudget = state.budgets[currentMonth]?.totalBudget || 0;
  const upiBudget = state.budgets[currentMonth]?.upiBudget || 0;
  const cashBudget = state.budgets[currentMonth]?.cashBudget || 0;
  
  const remainingBalance = currentBudget - totalSpent;
  const upiRemaining = upiBudget - upiSpent;
  const cashRemaining = cashBudget - cashSpent;

  // Real-time spending velocity and projections
  const today = new Date().toISOString().split('T')[0];
  const { total: rawTodayTotal, upi: todayUpiSpent, cash: todayCashSpent } = useMemo(() => 
    getTodaySpendingByMode(currentMonthTransactions), 
    [currentMonthTransactions]
  );
  
  const todayMissing = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.date === today && t.title.toLowerCase().includes('missing amount'))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [currentMonthTransactions, today]);

  const todaySpent = rawTodayTotal - todayMissing;

  const dailyAverage = useMemo(() => 
    calculateDailyAverage(currentMonthTransactions.filter(t => !t.title.toLowerCase().includes('missing amount')), totalSpent),
    [currentMonthTransactions, totalSpent]
  );

  const spendingVelocity = useMemo(() => 
    projectMonthEndSpend(totalSpent),
    [totalSpent]
  );

  const budgetHealthScore = useMemo(() => 
    calculateBudgetHealthScore(totalSpent, currentBudget),
    [totalSpent, currentBudget]
  );

  const previousMonthRemaining = useMemo(() => {
    const prevMonth = getPreviousMonthKey(currentMonth);
    const prevBudget = state.budgets[prevMonth]?.totalBudget || 0;
    const prevSpent = state.transactions
      .filter(t => t.date.startsWith(prevMonth))
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    return Math.max(0, prevBudget - prevSpent);
  }, [state.transactions, state.budgets, currentMonth]);

  const totalFixedExpenses = useMemo(() => {
    return state.recurringExpenses
      .filter((r) => r.isActive)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [state.recurringExpenses]);

  return {
    currentMonthTransactions,
    totalSpent,
    currentBudget,
    upiBudget,
    cashBudget,
    remainingBalance,
    upiRemaining,
    cashRemaining,
    upiSpent,
    cashSpent,
    todaySpent,
    todayUpiSpent,
    todayCashSpent,
    totalMissing,
    todayMissing,
    dailyAverage,
    spendingVelocity,
    budgetHealthScore,
    previousMonthRemaining,
    totalFixedExpenses
  };
}
