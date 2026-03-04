import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Transaction, MonthlyBudget } from '../types';
import {
  formatCurrency,
  formatMonthShort,
  getMonthsInYear,
  groupTransactionsByCategory,
  getCategoryColor } from
'../utils/helpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend } from
'recharts';
import {
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  WalletIcon,
  PiggyBankIcon,
  ArrowUpIcon,
  ArrowDownIcon } from
'lucide-react';
interface YearlySummaryProps {
  availableYears: string[];
  getYearlyTransactions: (year: string) => Transaction[];
  getYearlyBudgetTotal: (year: string) => number;
  allBudgets: Record<string, MonthlyBudget>;
}
export function YearlySummary({
  availableYears,
  getYearlyTransactions,
  getYearlyBudgetTotal,
  allBudgets
}: YearlySummaryProps) {
  const [selectedYear, setSelectedYear] = useState(
    availableYears[0] || new Date().getFullYear().toString()
  );
  const yearlyData = useMemo(() => {
    const transactions = getYearlyTransactions(selectedYear);
    const totalBudget = getYearlyBudgetTotal(selectedYear);
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const savings = totalBudget - totalSpent;
    const avgMonthlySpend = totalSpent / 12;
    // Month-wise data for chart
    const monthsInYear = getMonthsInYear(selectedYear);
    const monthlyData = monthsInYear.map((month) => {
      const monthTxns = transactions.filter((t) => t.date.startsWith(month));
      const spent = monthTxns.reduce((sum, t) => sum + t.amount, 0);
      const budget = allBudgets[month]?.totalBudget || 0;
      return {
        month: formatMonthShort(month),
        monthKey: month,
        spent,
        budget
      };
    });
    // Find highest and lowest spending months (only months with spending)
    const monthsWithSpending = monthlyData.filter((m) => m.spent > 0);
    const highestMonth =
    monthsWithSpending.length > 0 ?
    monthsWithSpending.reduce((max, m) => m.spent > max.spent ? m : max) :
    null;
    const lowestMonth =
    monthsWithSpending.length > 0 ?
    monthsWithSpending.reduce((min, m) => m.spent < min.spent ? m : min) :
    null;
    // Category breakdown for the year
    const categoryData = groupTransactionsByCategory(transactions);
    // Savings rate
    const savingsRate = totalBudget > 0 ? savings / totalBudget * 100 : 0;
    return {
      totalBudget,
      totalSpent,
      savings,
      avgMonthlySpend,
      monthlyData,
      highestMonth,
      lowestMonth,
      categoryData,
      savingsRate,
      transactionCount: transactions.length
    };
  }, [selectedYear, getYearlyTransactions, getYearlyBudgetTotal, allBudgets]);
  const isOverspent = yearlyData.savings < 0;
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yearly Summary</h1>
          <p className="text-slate-500">Annual spending overview and trends</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-slate-800 focus:ring-0 p-0 cursor-pointer">

            {availableYears.map((year) =>
            <option key={year} value={year}>
                {year}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  Total Budget
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(yearlyData.totalBudget)}
                </p>
              </div>
              <WalletIcon className="w-8 h-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(yearlyData.totalSpent)}
                </p>
              </div>
              <TrendingDownIcon className="w-8 h-8 text-rose-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  {isOverspent ? 'Overspent' : 'Saved'}
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${isOverspent ? 'text-rose-600' : 'text-emerald-600'}`}>

                  {formatCurrency(Math.abs(yearlyData.savings))}
                </p>
              </div>
              <PiggyBankIcon
                className={`w-8 h-8 ${isOverspent ? 'text-rose-400' : 'text-emerald-400'}`} />

            </div>
            <p
              className={`text-xs mt-2 ${isOverspent ? 'text-rose-600' : 'text-emerald-600'}`}>

              {yearlyData.savingsRate.toFixed(1)}%{' '}
              {isOverspent ? 'over budget' : 'savings rate'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Avg Monthly
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(yearlyData.avgMonthlySpend)}
                </p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highest/Lowest Month Cards */}
      {(yearlyData.highestMonth || yearlyData.lowestMonth) &&
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {yearlyData.highestMonth &&
        <Card className="border-l-4 border-l-rose-500">
              <CardContent className="p-5 flex items-center space-x-4">
                <div className="p-3 bg-rose-100 rounded-full">
                  <ArrowUpIcon className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    Highest Spending Month
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {yearlyData.highestMonth.month}
                  </p>
                  <p className="text-sm font-medium text-rose-600">
                    {formatCurrency(yearlyData.highestMonth.spent)}
                  </p>
                </div>
              </CardContent>
            </Card>
        }
          {yearlyData.lowestMonth &&
        yearlyData.lowestMonth !== yearlyData.highestMonth &&
        <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-5 flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <ArrowDownIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      Lowest Spending Month
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {yearlyData.lowestMonth.month}
                    </p>
                    <p className="text-sm font-medium text-emerald-600">
                      {formatCurrency(yearlyData.lowestMonth.spent)}
                    </p>
                  </div>
                </CardContent>
              </Card>
        }
        </div>
      }

      {/* Month-wise Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget vs Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={yearlyData.monthlyData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
                  bottom: 0
                }}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9" />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 12
                  }} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 12
                  }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />

                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />

                <Legend />
                <Bar
                  dataKey="budget"
                  name="Budget"
                  fill="#c7d2fe"
                  radius={[4, 4, 0, 0]} />

                <Bar
                  dataKey="spent"
                  name="Spent"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]} />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category-wise Yearly Totals</CardTitle>
        </CardHeader>
        <CardContent>
          {yearlyData.categoryData.length > 0 ?
          <div className="space-y-4">
              {yearlyData.categoryData.map((cat) => {
              const percentage =
              yearlyData.totalSpent > 0 ?
              cat.value / yearlyData.totalSpent * 100 :
              0;
              return (
                <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getCategoryColor(cat.name)
                        }} />

                        <span className="text-sm font-medium text-slate-700">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(cat.value)}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getCategoryColor(cat.name)
                      }} />

                    </div>
                  </div>);

            })}
            </div> :

          <div className="text-center py-8 text-slate-500">
              <p>No transactions recorded for {selectedYear}</p>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}