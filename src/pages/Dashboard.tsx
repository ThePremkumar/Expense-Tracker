import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  PlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  WalletIcon,
  ReceiptIcon,
  PieChartIcon,
  CalendarIcon,
  Edit2Icon,
  Trash2Icon,
  DownloadIcon } from
'lucide-react';
import {
  formatCurrency,
  formatDate,
  getCategoryColor,
  groupTransactionsByCategory,
  groupTransactionsByDate,
  exportToCSV } from
'../utils/helpers';
import { Transaction, MonthlyBudget } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine } from
'recharts';
import { SmartInsights } from '../components/SmartInsights';
interface DashboardProps {
  totalBudget: number;
  totalSpent: number;
  remainingBalance: number;
  recentTransactions: Transaction[];
  onAddExpense: () => void;
  onViewAll: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  allTransactions: Transaction[];
  allBudgets: Record<string, MonthlyBudget>;
  currentMonth: string;
}
export function Dashboard({
  totalBudget,
  totalSpent,
  remainingBalance,
  recentTransactions,
  onAddExpense,
  onViewAll,
  onEdit,
  onDelete,
  allTransactions,
  allBudgets,
  currentMonth
}: DashboardProps) {
  const spentPercentage = totalBudget > 0 ? totalSpent / totalBudget * 100 : 0;
  const isNearLimit = spentPercentage > 85;
  const isOverLimit = spentPercentage >= 100;
  const categoryData = groupTransactionsByCategory(recentTransactions);

  const handleExport = () => {
    const filename = `expenses-${currentMonth}.csv`;
    exportToCSV(recentTransactions, filename);
  };
  
  // Today's spending
  const today = new Date().toISOString().split('T')[0];
  const todaySpent = useMemo(() => {
    return recentTransactions.
    filter((t) => t.date === today).
    reduce((sum, t) => sum + t.amount, 0);
  }, [recentTransactions, today]);
  // Cumulative spending data for line chart
  const cumulativeData = useMemo(() => {
    const dailyData = groupTransactionsByDate(recentTransactions);
    let cumulative = 0;
    return dailyData.map((d) => {
      cumulative += d.amount;
      return {
        day: new Date(d.date).getDate(),
        amount: cumulative
      };
    });
  }, [recentTransactions]);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of your monthly spending</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport} className="shadow-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onAddExpense} className="shadow-sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>


      {/* Alert for near/over budget */}
      {(isNearLimit || isOverLimit) && totalBudget > 0 &&
      <div
        className={`p-4 rounded-xl flex items-start space-x-3 ${isOverLimit ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>

          <AlertCircleIcon
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isOverLimit ? 'text-rose-600' : 'text-amber-600'}`} />

          <div>
            <h4 className="font-semibold">
              {isOverLimit ? 'Budget Exceeded!' : 'Approaching Budget Limit'}
            </h4>
            <p className="text-sm mt-1">
              {isOverLimit ?
            `You have exceeded your monthly budget by ${formatCurrency(Math.abs(remainingBalance))}.` :
            `You have spent ${spentPercentage.toFixed(1)}% of your budget. Only ${formatCurrency(remainingBalance)} remaining.`}
            </p>
          </div>
        </div>
      }

      {/* Top Cards - Now 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 font-medium text-sm mb-1">
                  Total Budget
                </p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(totalBudget)}
                </h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <WalletIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm mb-1">
                  Total Spent
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalSpent)}
                </h3>
              </div>
              <div className="p-2 bg-rose-100 rounded-lg">
                <TrendingDownIcon className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{
                  width: `${Math.min(spentPercentage, 100)}%`
                }} />

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm mb-1">
                  Remaining
                </p>
                <h3
                  className={`text-2xl font-bold ${remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>

                  {formatCurrency(remainingBalance)}
                </h3>
              </div>
              <div
                className={`p-2 rounded-lg ${remainingBalance < 0 ? 'bg-rose-100' : 'bg-emerald-100'}`}>

                <TrendingUpIcon
                  className={`w-5 h-5 ${remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`} />

              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm mb-1">
                  Today's Spend
                </p>
                <h3 className="text-2xl font-bold text-amber-600">
                  {formatCurrency(todaySpent)}
                </h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trend Chart */}
      {cumulativeData.length > 1 &&
      <Card>
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                data={cumulativeData}
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
                  dataKey="day"
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
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />

                  {totalBudget > 0 &&
                <ReferenceLine
                  y={totalBudget}
                  stroke="#f43f5e"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Budget',
                    fill: '#f43f5e',
                    fontSize: 12
                  }} />

                }
                  <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{
                    fill: '#6366f1',
                    strokeWidth: 0,
                    r: 4
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#6366f1'
                  }} />

                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {recentTransactions.length > 0 ?
            <div className="divide-y divide-slate-100">
                {recentTransactions.slice(0, 5).map((t) =>
              <div
                key={t.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{
                      backgroundColor: getCategoryColor(t.category)
                    }}>
                    {t.category.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{t.title}</p>
                    <div className="flex items-center text-xs text-slate-500 space-x-2">
                      <span>{t.category}</span>
                      <span>•</span>
                      <span>{formatDate(t.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 transition-opacity">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit">
                      <Edit2Icon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this expense?')) {
                          onDelete(t.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Delete">
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-semibold text-slate-900">
                    -{formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
              )}
              </div> :

            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <ReceiptIcon className="w-12 h-12 text-slate-300 mb-3" />
                <p>No transactions this month.</p>
                <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={onAddExpense}>

                  Add your first expense
                </Button>
              </div>
            }
          </CardContent>
        </Card>

        {/* Mini Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
            {categoryData.length > 0 ?
            <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none">

                        {categoryData.map((entry, index) =>
                      <Cell
                        key={`cell-${index}`}
                        fill={getCategoryColor(entry.name)} />

                      )}
                      </Pie>
                      <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }} />

                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 w-full space-y-2">
                  {categoryData.slice(0, 3).map((item) =>
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm">

                      <div className="flex items-center space-x-2">
                        <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getCategoryColor(item.name)
                      }} />

                        <span className="text-slate-600 truncate max-w-[100px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                )}
                </div>
              </> :

            <div className="text-center text-slate-500">
                <PieChartIcon className="w-12 h-12 text-slate-300 mb-3 mx-auto" />
                <p>Not enough data</p>
              </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartInsights
            allTransactions={allTransactions}
            allBudgets={allBudgets}
            currentMonth={currentMonth}
            maxInsights={4} />

        </CardContent>
      </Card>
    </div>);

}