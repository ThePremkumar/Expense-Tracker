import { Transaction } from '../types';

/**
 * Calculates financial health score (0-100) based on spending vs expected path
 */
export const calculateBudgetHealthScore = (totalSpent: number, currentBudget: number): number => {
  if (currentBudget <= 0) return 50;
  
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const expectedSpendRate = dayOfMonth / daysInMonth;
  const actualSpendRate = totalSpent / currentBudget;
  
  if (actualSpendRate >= 1) return 0;
  
  const ratio = actualSpendRate / expectedSpendRate;
  
  // Scoring logic:
  // < 0.5 (Spending half of expected): 100
  // < 0.8 (Slightly under expected): 85
  // < 1.0 (On track): 70
  // < 1.2 (Slightly over expected): 50
  // < 1.5 (Warning): 30
  // > 1.5 (Critical): 10
  if (ratio <= 0.5) return 100;
  if (ratio <= 0.8) return 85;
  if (ratio <= 1.0) return 70;
  if (ratio <= 1.2) return 50;
  if (ratio <= 1.5) return 30;
  return 10;
};

/**
 * Projects month-end spending based on current daily average
 */
export const projectMonthEndSpend = (totalSpent: number): number => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  if (dayOfMonth === 0) return 0;
  return (totalSpent / dayOfMonth) * daysInMonth;
};

/**
 * Calculates daily average spending
 */
export const calculateDailyAverage = (transactions: Transaction[], totalSpent: number): number => {
  const daysWithSpending = new Set(transactions.map(t => t.date)).size;
  return daysWithSpending > 0 ? totalSpent / daysWithSpending : 0;
};

/**
 * Groups transactions for mode-specific breakdowns
 */
export const getPaymentModeBreakdown = (transactions: Transaction[]) => {
  const upiTransactions = transactions.filter(t => t.paymentMode === 'UPI');
  const cashTransactions = transactions.filter(t => t.paymentMode === 'Cash');
  
  const upiSpent = upiTransactions.reduce((sum, t) => sum + t.amount, 0);
  const cashSpent = cashTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  return {
    upiSpent,
    cashSpent,
    upiTransactions,
    cashTransactions
  };
};

/**
 * Today's spending by mode
 */
export const getTodaySpendingByMode = (transactions: Transaction[]) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTxns = transactions.filter(t => t.date === today);
  
  const total = todayTxns.reduce((s, t) => s + t.amount, 0);
  const upi = todayTxns.filter(t => t.paymentMode === 'UPI').reduce((s, t) => s + t.amount, 0);
  const cash = todayTxns.filter(t => t.paymentMode === 'Cash').reduce((s, t) => s + t.amount, 0);
  
  return { total, upi, cash };
};
