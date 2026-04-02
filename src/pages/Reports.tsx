import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Transaction, MonthlyBudget } from '../types';
import {
  formatCurrency,
  getCategoryColor,
  groupTransactionsByCategory,
  groupTransactionsByDate
} from '../utils/helpers';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import {
  PieChartIcon,
  BarChart3Icon,
  TrendingUpIcon,
  LayersIcon,
  CalendarIcon,
  WalletIcon,
  SmartphoneIcon,
  BanknoteIcon,
  PiggyBankIcon,
  ArrowDownIcon,
  ReceiptIcon
} from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
  totalBudget: number;
  savings?: number;
  monthlyBudget?: MonthlyBudget | null;
  currentMonth?: string;
  allTransactions?: Transaction[];
}

export function Reports({ 
  transactions, 
  totalBudget, 
  savings = 0, 
  monthlyBudget
}: ReportsProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'category'>('monthly');

  const categoryData = groupTransactionsByCategory(transactions);
  const dailyData = groupTransactionsByDate(transactions).map((d) => ({
    ...d,
    dateFormatted: new Date(d.date).getDate().toString()
  }));
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  // UPI vs Cash breakdown
  const upiTotal = useMemo(() =>
    transactions.filter(t => t.paymentMode === 'UPI').reduce((sum, t) => sum + t.amount, 0),
    [transactions]);
  const cashTotal = useMemo(() =>
    transactions.filter(t => t.paymentMode === 'Cash').reduce((sum, t) => sum + t.amount, 0),
    [transactions]);

  const remainingBalance = totalBudget - totalSpent;
  const carryForward = monthlyBudget?.carryForward || 0;

  // Payment mode chart data
  const paymentModeData = [
    { name: 'UPI', value: upiTotal, color: '#8b5cf6' },
    { name: 'Cash', value: cashTotal, color: '#10b981' }
  ].filter(d => d.value > 0);

  // Weekly breakdown
  const weeklyData = useMemo(() => {
    const weeks: { week: string; amount: number; upi: number; cash: number }[] = [];
    if (transactions.length === 0) return weeks;

    // Group by ISO week-like chunks (7-day periods of the month)
    
    for (let w = 0; w < 5; w++) {
      const startDay = w * 7 + 1;
      const endDay = w === 4 ? 31 : (w + 1) * 7;
      const weekTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        const day = d.getDate();
        return day >= startDay && day <= endDay;
      });
      
      if (weekTransactions.length > 0 || w < 4) {
        const weekUpi = weekTransactions.filter(t => t.paymentMode === 'UPI').reduce((s, t) => s + t.amount, 0);
        const weekCash = weekTransactions.filter(t => t.paymentMode === 'Cash').reduce((s, t) => s + t.amount, 0);
        weeks.push({
          week: `Week ${w + 1}`,
          amount: weekTransactions.reduce((s, t) => s + t.amount, 0),
          upi: weekUpi,
          cash: weekCash
        });
      }
    }
    return weeks;
  }, [transactions]);

  // Cumulative spending data
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return groupTransactionsByDate(transactions).map((d) => {
      cumulative += d.amount;
      return {
        day: new Date(d.date).getDate(),
        amount: cumulative
      };
    });
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Summary</h1>
          <p className="text-slate-500">Analyze your spending patterns</p>
        </div>
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
          <PieChartIcon className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">
            No data to display
          </h3>
          <p className="text-slate-500 mt-1">
            Add some transactions to see your reports.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Summary</h1>
          <p className="text-slate-500 text-sm">Comprehensive spending analysis</p>
        </div>
        {/* View mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 self-start sm:self-auto">
          {(['monthly', 'weekly', 'category'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-xs font-semibold capitalize transition-all ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-indigo-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Monthly Summary Cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Budget', value: totalBudget, icon: WalletIcon, color: 'text-indigo-700', bg: 'bg-indigo-50' },
          { label: 'Carry Forward', value: carryForward, icon: ArrowDownIcon, color: 'text-sky-700', bg: 'bg-sky-50' },
          { label: 'Savings', value: savings, icon: PiggyBankIcon, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Cash Spent', value: cashTotal, icon: BanknoteIcon, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'UPI Spent', value: upiTotal, icon: SmartphoneIcon, color: 'text-violet-700', bg: 'bg-violet-50' },
          { label: 'Remaining', value: remainingBalance, icon: ReceiptIcon, 
            color: remainingBalance >= 0 ? 'text-emerald-700' : 'text-rose-700',
            bg: remainingBalance >= 0 ? 'bg-emerald-50' : 'bg-rose-50' }
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className={`${stat.bg} p-1.5 rounded-lg w-fit mb-2`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-sm font-bold ${stat.color} mt-0.5`}>{formatCurrency(stat.value)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== Charts Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI vs Cash Pie Chart */}
        <Card className="flex flex-col shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SmartphoneIcon className="w-5 h-5 mr-2 text-violet-500" />
              UPI vs Cash
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-64 w-full">
              {paymentModeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentModeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentModeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No data</div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-xs text-slate-600">UPI ({formatCurrency(upiTotal)})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600">Cash ({formatCurrency(cashTotal)})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="flex flex-col shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-indigo-500" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Report - shown when weekly mode is on or always */}
        {(viewMode === 'weekly' || viewMode === 'monthly') && (
          <Card className="flex flex-col shadow-md border-none">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-sky-500" />
                Weekly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6">
              <div className="h-64 w-full">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'upi' ? 'UPI' : name === 'cash' ? 'Cash' : 'Total'
                        ]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="upi" name="UPI" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                      <Bar dataKey="cash" name="Cash" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">No data</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Spending Trend */}
        <Card className="flex flex-col shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3Icon className="w-5 h-5 mr-2 text-emerald-500" />
              Daily Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dateFormatted"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Spending */}
        <Card className="flex flex-col shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2 text-violet-500" />
              Cumulative Spending
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cumulativeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Comparison Progress Bars */}
        <Card className="flex flex-col shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LayersIcon className="w-5 h-5 mr-2 text-amber-500" />
              Category Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {categoryData.map((cat) => {
                const percentage = totalSpent > 0 ? (cat.value / totalSpent) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(cat.name) }}
                        />
                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
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
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: getCategoryColor(cat.name)
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown Table */}
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Amount Spent</th>
                    <th className="p-4 text-right">UPI</th>
                    <th className="p-4 text-right">Cash</th>
                    <th className="p-4 text-right">% of Total</th>
                    <th className="p-4 text-right">% of Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryData.map((cat) => {
                    const pctOfSpent = totalSpent > 0 ? (cat.value / totalSpent) * 100 : 0;
                    const pctOfBudget = totalBudget > 0 ? (cat.value / totalBudget) * 100 : 0;
                    const catUpi = transactions
                      .filter(t => t.category === cat.name && t.paymentMode === 'UPI')
                      .reduce((s, t) => s + t.amount, 0);
                    const catCash = transactions
                      .filter(t => t.category === cat.name && t.paymentMode === 'Cash')
                      .reduce((s, t) => s + t.amount, 0);
                    return (
                      <tr key={cat.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getCategoryColor(cat.name) }}
                            />
                            <span className="font-medium text-slate-900">{cat.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-900">
                          {formatCurrency(cat.value)}
                        </td>
                        <td className="p-4 text-right text-violet-600 font-medium">
                          {formatCurrency(catUpi)}
                        </td>
                        <td className="p-4 text-right text-emerald-600 font-medium">
                          {formatCurrency(catCash)}
                        </td>
                        <td className="p-4 text-right text-slate-600">
                          {pctOfSpent.toFixed(1)}%
                        </td>
                        <td className="p-4 text-right text-slate-600">
                          {totalBudget > 0 ? `${pctOfBudget.toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}