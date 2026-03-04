import React, { useMemo, Component } from 'react';
import { Transaction, MonthlyBudget, Insight } from '../types';
import {
  formatCurrency,
  groupTransactionsByCategory,
  getCurrentMonthKey } from
'../utils/helpers';
import {
  AlertTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  TargetIcon,
  CalendarIcon,
  InfoIcon,
  SparklesIcon } from
'lucide-react';
interface SmartInsightsProps {
  allTransactions: Transaction[];
  allBudgets: Record<string, MonthlyBudget>;
  currentMonth: string;
  maxInsights?: number;
}
const ICON_MAP: Record<string, React.ElementType> = {
  'alert-triangle': AlertTriangleIcon,
  'trending-up': TrendingUpIcon,
  'trending-down': TrendingDownIcon,
  'piggy-bank': PiggyBankIcon,
  target: TargetIcon,
  calendar: CalendarIcon,
  info: InfoIcon,
  sparkles: SparklesIcon
};
const TYPE_STYLES: Record<
  string,
  {
    bg: string;
    border: string;
    icon: string;
  }> =
{
  warning: {
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    icon: 'text-amber-600'
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    icon: 'text-emerald-600'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    icon: 'text-blue-600'
  },
  danger: {
    bg: 'bg-rose-50',
    border: 'border-l-rose-500',
    icon: 'text-rose-600'
  }
};
export function SmartInsights({
  allTransactions,
  allBudgets,
  currentMonth,
  maxInsights = 5
}: SmartInsightsProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];
    // Get current month data
    const currentMonthTxns = allTransactions.filter((t) =>
    t.date.startsWith(currentMonth)
    );
    const currentMonthSpent = currentMonthTxns.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const currentBudget = allBudgets[currentMonth]?.totalBudget || 0;
    // Get previous month data
    const [year, month] = currentMonth.split('-').map(Number);
    const prevMonth =
    month === 1 ?
    `${year - 1}-12` :
    `${year}-${String(month - 1).padStart(2, '0')}`;
    const prevMonthTxns = allTransactions.filter((t) =>
    t.date.startsWith(prevMonth)
    );
    const prevMonthSpent = prevMonthTxns.reduce((sum, t) => sum + t.amount, 0);
    // Category data
    const currentCategoryData = groupTransactionsByCategory(currentMonthTxns);
    const prevCategoryData = groupTransactionsByCategory(prevMonthTxns);
    // 1. Budget proximity warning
    if (currentBudget > 0) {
      const usagePercent = currentMonthSpent / currentBudget * 100;
      if (usagePercent >= 100) {
        result.push({
          id: 'over-budget',
          type: 'danger',
          icon: 'alert-triangle',
          message: `You've exceeded your budget by ${formatCurrency(currentMonthSpent - currentBudget)}`,
          detail: `${usagePercent.toFixed(0)}% of budget used`
        });
      } else if (usagePercent >= 85) {
        result.push({
          id: 'near-budget',
          type: 'warning',
          icon: 'alert-triangle',
          message: `You're at ${usagePercent.toFixed(0)}% of your monthly budget`,
          detail: `Only ${formatCurrency(currentBudget - currentMonthSpent)} remaining`
        });
      }
    }
    // 2. Savings insight
    if (currentBudget > 0 && currentMonthSpent < currentBudget) {
      const saved = currentBudget - currentMonthSpent;
      result.push({
        id: 'savings',
        type: 'success',
        icon: 'piggy-bank',
        message: `You've saved ${formatCurrency(saved)} this month`,
        detail: `${(saved / currentBudget * 100).toFixed(0)}% of your budget`
      });
    }
    // 3. Highest spending category
    if (currentCategoryData.length > 0) {
      const highest = currentCategoryData[0];
      result.push({
        id: 'highest-category',
        type: 'info',
        icon: 'target',
        message: `${highest.name} is your highest spending category`,
        detail: formatCurrency(highest.value)
      });
    }
    // 4. Category comparison vs last month
    if (prevCategoryData.length > 0 && currentCategoryData.length > 0) {
      const prevCategoryMap = Object.fromEntries(
        prevCategoryData.map((c) => [c.name, c.value])
      );
      for (const cat of currentCategoryData) {
        const prevAmount = prevCategoryMap[cat.name] || 0;
        if (prevAmount > 0) {
          const diff = cat.value - prevAmount;
          const percentChange = diff / prevAmount * 100;
          if (percentChange > 20) {
            result.push({
              id: `category-increase-${cat.name}`,
              type: 'warning',
              icon: 'trending-up',
              message: `${cat.name} spending increased by ${percentChange.toFixed(0)}%`,
              detail: `${formatCurrency(prevAmount)} → ${formatCurrency(cat.value)}`
            });
            break; // Only show one category comparison
          } else if (percentChange < -20) {
            result.push({
              id: `category-decrease-${cat.name}`,
              type: 'success',
              icon: 'trending-down',
              message: `${cat.name} spending decreased by ${Math.abs(percentChange).toFixed(0)}%`,
              detail: `${formatCurrency(prevAmount)} → ${formatCurrency(cat.value)}`
            });
            break;
          }
        }
      }
    }
    // 5. Daily average spend
    const today = new Date();
    const currentDay = today.getDate();
    if (currentMonthSpent > 0 && currentDay > 1) {
      const dailyAvg = currentMonthSpent / currentDay;
      result.push({
        id: 'daily-avg',
        type: 'info',
        icon: 'calendar',
        message: `Your daily average spend is ${formatCurrency(dailyAvg)}`,
        detail: `Based on ${currentDay} days`
      });
    }
    // 6. Month-over-month comparison
    if (prevMonthSpent > 0 && currentMonthSpent > 0) {
      const diff = currentMonthSpent - prevMonthSpent;
      const percentChange = diff / prevMonthSpent * 100;
      if (Math.abs(percentChange) > 10) {
        result.push({
          id: 'mom-comparison',
          type: diff > 0 ? 'warning' : 'success',
          icon: diff > 0 ? 'trending-up' : 'trending-down',
          message: `Overall spending ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(0)}% vs last month`,
          detail: `${formatCurrency(prevMonthSpent)} → ${formatCurrency(currentMonthSpent)}`
        });
      }
    }
    return result.slice(0, maxInsights);
  }, [allTransactions, allBudgets, currentMonth, maxInsights]);
  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <SparklesIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p>Add more transactions to see personalized insights</p>
      </div>);

  }
  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const IconComponent = ICON_MAP[insight.icon] || InfoIcon;
        const styles = TYPE_STYLES[insight.type];
        return (
          <div
            key={insight.id}
            className={`${styles.bg} ${styles.border} border-l-4 rounded-r-lg p-4 flex items-start space-x-3`}>

            <IconComponent
              className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {insight.message}
              </p>
              {insight.detail &&
              <p className="text-xs text-slate-500 mt-0.5">
                  {insight.detail}
                </p>
              }
            </div>
          </div>);

      })}
    </div>);

}