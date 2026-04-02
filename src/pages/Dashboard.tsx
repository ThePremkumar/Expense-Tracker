import { useMemo, useState } from 'react';
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
  DownloadIcon,
  SmartphoneIcon,
  BanknoteIcon,
  ZapIcon,
  TargetIcon,
  GaugeIcon,
  ActivityIcon,
  HelpCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  LightbulbIcon
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getCategoryColor,
  groupTransactionsByCategory,
  groupTransactionsByDate,
  exportToCSV
} from '../utils/helpers';
import { formatDistanceToNow } from 'date-fns';
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
  ReferenceLine
} from 'recharts';
import { SmartInsights } from '../components/SmartInsights';

interface DashboardProps {
  totalBudget: number;
  totalSpent: number;
  remainingBalance: number;
  upiBudget?: number;
  cashBudget?: number;
  upiSpent?: number;
  cashSpent?: number;
  upiRemaining?: number;
  cashRemaining?: number;
  todaySpent?: number;
  todayUpiSpent?: number;
  todayCashSpent?: number;
  dailyAverage?: number;
  spendingVelocity?: number;
  budgetHealthScore?: number;
  recentTransactions: Transaction[];
  onAddExpense: () => void;
  onViewAll: () => void;
  onViewInsights?: () => void;
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
  upiBudget = 0,
  cashBudget = 0,
  upiSpent = 0,
  cashSpent = 0,
  upiRemaining = 0,
  cashRemaining = 0,
  todaySpent = 0,
  todayUpiSpent = 0,
  todayCashSpent = 0,
  dailyAverage = 0,
  spendingVelocity = 0,
  budgetHealthScore = 50,
  recentTransactions,
  onAddExpense,
  onViewAll,
  onViewInsights,
  onEdit,
  onDelete,
  allTransactions,
  allBudgets,
  currentMonth
}: DashboardProps) {

  const [transactionModeFilter, setTransactionModeFilter] = useState<'all' | 'UPI' | 'Cash'>('all');

  const spentPercentage = totalBudget > 0 ? totalSpent / totalBudget * 100 : 0;
  const isNearLimit = spentPercentage > 85;
  const isOverLimit = spentPercentage >= 100;
  
  const filteredTransactions = useMemo(() => {
    if (transactionModeFilter === 'all') return recentTransactions;
    return recentTransactions.filter(t => t.paymentMode === transactionModeFilter);
  }, [recentTransactions, transactionModeFilter]);

  const categoryData = groupTransactionsByCategory(recentTransactions);

  const handleExport = () => {
    const filename = `expenses-${currentMonth}.csv`;
    exportToCSV(recentTransactions, filename);
  };

  // Cumulative spending data for line chart with remaining balance
  const cumulativeData = useMemo(() => {
    const dailyData = groupTransactionsByDate(recentTransactions);
    let cumulative = 0;
    const data = dailyData.map((d) => {
      cumulative += d.amount;
      return {
        day: new Date(d.date).getDate(),
        date: d.date,
        spent: cumulative,
        remaining: totalBudget > 0 ? Math.max(totalBudget - cumulative, 0) : 0,
        dailySpend: d.amount
      };
    });
    if (data.length > 0 && data[0].day > 1 && totalBudget > 0) {
      data.unshift({ day: 1, date: '', spent: 0, remaining: totalBudget, dailySpend: 0 });
    }
    return data;
  }, [recentTransactions, totalBudget]);

  // Health score color
  const getHealthColor = (score: number) => {
    if (score >= 70) return { text: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Healthy' };
    if (score >= 50) return { text: 'text-sky-600', bg: 'bg-sky-500', label: 'Moderate' };
    if (score >= 30) return { text: 'text-amber-600', bg: 'bg-amber-500', label: 'Warning' };
    return { text: 'text-rose-600', bg: 'bg-rose-500', label: 'Critical' };
  };
  const healthInfo = getHealthColor(budgetHealthScore);

  const pmTip = useMemo(() => {
    if (totalBudget === 0) return { icon: HelpCircleIcon, title: 'Set a Budget', tip: 'Start by setting a monthly budget to get personalized financial tips.', bg: 'bg-slate-50', text: 'text-slate-700' };
    if (isOverLimit) return { icon: AlertTriangleIcon, title: 'Budget Breached', tip: 'You have exceeded your total limit. Stop all non-essential spending immediately.', bg: 'bg-rose-50', text: 'text-rose-700' };
    if (spendingVelocity > totalBudget && totalBudget > 0) return { icon: ZapIcon, title: 'Velocity Warning', tip: 'You are spending faster than your budget allows. Slow down to avoid overshooting.', bg: 'bg-amber-50', text: 'text-amber-700' };
    if (budgetHealthScore > 85) return { icon: CheckCircle2Icon, title: 'Great Progress', tip: 'Your financial discipline is top-notch! Consider moving surplus to savings.', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    if (budgetHealthScore > 60) return { icon: LightbulbIcon, title: 'Steady Pace', tip: 'You are on track. Maintain this momentum to reach your monthly goals.', bg: 'bg-indigo-50', text: 'text-indigo-700' };
    return { icon: TargetIcon, title: 'Budget Advisory', tip: 'Check your mode efficiency. Try using Cash for small expenses to stay in control.', bg: 'bg-sky-50', text: 'text-sky-700' };
  }, [budgetHealthScore, totalBudget, spendingVelocity, isOverLimit]);

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

      {/* Dynamic PM Tip */}
      <Card className={`border-none ${pmTip.bg} overflow-hidden shadow-sm animate-in slide-in-from-top-1 duration-500`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`${pmTip.bg.replace('50', '100')} p-3 rounded-xl ${pmTip.text}`}>
            <pmTip.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-sm font-bold ${pmTip.text}`}>{pmTip.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">{pmTip.tip}</p>
          </div>
        </CardContent>
      </Card>

      {/* Alert for near/over budget */}
      {(isNearLimit || isOverLimit) && totalBudget > 0 &&
        <div className={`p-4 rounded-xl flex items-start space-x-3 ${isOverLimit ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          <AlertCircleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isOverLimit ? 'text-rose-600' : 'text-amber-600'}`} />
          <div>
            <h4 className="font-semibold">
              {isOverLimit ? 'Budget Exceeded!' : 'Approaching Budget Limit'}
            </h4>
            <p className="text-sm mt-1">
              {isOverLimit
                ? `You have exceeded your monthly budget by ${formatCurrency(Math.abs(remainingBalance))}.`
                : `You have spent ${spentPercentage.toFixed(1)}% of your budget. Only ${formatCurrency(remainingBalance)} remaining.`}
            </p>
          </div>
        </div>
      }

      {/* ===== OVERALL ROW ===== */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">📊 Overall Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 font-medium text-sm mb-1">Total Budget</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(totalBudget)}</h3>
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
                  <p className="text-slate-500 font-medium text-sm mb-1">Total Spent</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</h3>
                </div>
                <div className="p-2 bg-rose-100 rounded-lg">
                  <TrendingDownIcon className="w-5 h-5 text-rose-600" />
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium text-sm mb-1">Remaining</p>
                  <h3 className={`text-2xl font-bold ${remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(remainingBalance)}
                  </h3>
                </div>
                <div className={`p-2 rounded-lg ${remainingBalance < 0 ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                  <TrendingUpIcon className={`w-5 h-5 ${remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium text-sm mb-1">Today's Spend</p>
                  <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(todaySpent)}</h3>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== CASH & UPI BREAKDOWN ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Section */}
        <div>
          <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <BanknoteIcon className="w-3.5 h-3.5" /> Cash Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cash Budget</p>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(cashBudget)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cash Spent</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(cashSpent)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cash Remaining</p>
                <p className={`text-lg font-bold ${cashRemaining >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(cashRemaining)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today Cash</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(todayCashSpent)}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* UPI Section */}
        <div>
          <h2 className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <SmartphoneIcon className="w-3.5 h-3.5" /> UPI Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-l-4 border-l-violet-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UPI Budget</p>
                <p className="text-lg font-bold text-violet-700">{upiBudget > 0 ? formatCurrency(upiBudget) : 'Not Set'}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UPI Spent</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(upiSpent)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UPI Remaining</p>
                <p className={`text-lg font-bold ${upiRemaining >= 0 ? 'text-violet-700' : 'text-rose-700'}`}>
                  {upiBudget > 0 ? formatCurrency(upiRemaining) : '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today UPI</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(todayUpiSpent)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ===== SMART STATS & PERFORMANCE ROW (Bonus Features) ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Budget Health Score */}
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <GaugeIcon className={`w-4 h-4 ${healthInfo.text}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Score</span>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${healthInfo.text}`}>{budgetHealthScore}</span>
              <span className="text-xs text-slate-400 mb-1">/100</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Average */}
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ActivityIcon className="w-4 h-4 text-sky-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Avg</span>
            </div>
            <p className="text-xl font-bold text-sky-700">{formatCurrency(dailyAverage)}</p>
          </CardContent>
        </Card>

        {/* Projected Spend */}
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ZapIcon className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected</span>
            </div>
            <p className={`text-xl font-bold ${spendingVelocity > totalBudget && totalBudget > 0 ? 'text-rose-600' : 'text-amber-700'}`}>
              {formatCurrency(spendingVelocity)}
            </p>
          </CardContent>
        </Card>

        {/* Mode Efficiency Insight */}
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TargetIcon className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode Burn</span>
            </div>
            <p className="text-sm font-bold text-slate-700">
              {upiSpent > cashSpent ? 'UPI Heavy' : cashSpent > upiSpent ? 'Cash Heavy' : 'Balanced'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Which mode burns faster</p>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saved</span>
            </div>
            <p className={`text-xl font-bold ${remainingBalance > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {totalBudget > 0 ? `${Math.max(0, 100 - spentPercentage).toFixed(0)}%` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {cumulativeData.length > 1 &&
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Spending Trend</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-500">Spent</span>
                </div>
                {totalBudget > 0 &&
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-500">Remaining</span>
                  </div>
                }
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'spent' ? 'Cumulative Spent' : name === 'remaining' ? 'Remaining Balance' : 'Today\'s Spend'
                      ]}
                      labelFormatter={(label) => `Day ${label}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px -1px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
                    />
                    {totalBudget > 0 &&
                      <ReferenceLine y={totalBudget} stroke="#f43f5e" strokeDasharray="5 5" label={{ value: 'Limit', fill: '#f43f5e', fontSize: 10 }} />
                    }
                    <Line type="monotone" dataKey="spent" name="spent" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                    {totalBudget > 0 &&
                      <Line type="monotone" dataKey="remaining" name="remaining" stroke="#10b981" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                    }
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Budget vs Reality</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'UPI Spent', value: upiSpent, color: '#8b5cf6' },
                        { name: 'UPI Left', value: Math.max(0, upiRemaining), color: '#ede9fe' },
                        { name: 'Cash Spent', value: cashSpent, color: '#10b981' },
                        { name: 'Cash Left', value: Math.max(0, cashRemaining), color: '#ecfdf5' },
                      ]} 
                      cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none"
                    >
                      {[
                        { color: '#8b5cf6' }, { color: '#00000010' },
                        { color: '#10b981' }, { color: '#00000010' }
                      ].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? ['#8b5cf6', '#ede9fe', '#10b981', '#ecfdf5'][index] : '#f1f5f9'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-violet-500" /> UPI Efficiency
                  </span>
                  <span className="font-bold text-slate-700">{upiBudget > 0 ? `${((upiSpent/upiBudget)*100).toFixed(0)}%` : '0%'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Cash Efficiency
                  </span>
                  <span className="font-bold text-slate-700">{cashBudget > 0 ? `${((cashSpent/cashBudget)*100).toFixed(0)}%` : '0%'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                {(['all', 'UPI', 'Cash'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTransactionModeFilter(mode)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      transactionModeFilter === mode 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {mode === 'all' ? 'All' : mode}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: getCategoryColor(t.category) }}>
                        {t.category.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{t.title}</p>
                        <div className="flex items-center text-xs text-slate-500 space-x-2">
                          <span>{t.category}</span>
                          <span>•</span>
                          <span>{t.createdAt?.seconds
                            ? formatDistanceToNow(t.createdAt.seconds * 1000, { addSuffix: true })
                            : formatDate(t.date)}</span>
                          <span>•</span>
                          <span className={`font-semibold ${t.paymentMode === 'UPI' ? 'text-violet-500' : 'text-emerald-500'}`}>
                            {t.paymentMode === 'UPI' ? '📱 UPI' : '💵 Cash'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 transition-opacity">
                        <button onClick={() => onEdit(t)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                          <Edit2Icon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (window.confirm('Are you sure you want to delete this expense?')) onDelete(t.id); }} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete">
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-semibold text-slate-900">
                        -{formatCurrency(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <ReceiptIcon className="w-12 h-12 text-slate-300 mb-3" />
                <p>No transactions match your filter.</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTransactionModeFilter('all')}>
                  Clear Filter
                </Button>
              </div>
            )}
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
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {categoryData.map((entry, index) =>
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                        )}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 w-full space-y-2">
                  {categoryData.slice(0, 3).map((item) =>
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(item.name) }} />
                        <span className="text-slate-600 truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Smart Insights</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewInsights}>
            View Detailed Insights
          </Button>
        </CardHeader>
        <CardContent>
          <SmartInsights
            allTransactions={allTransactions}
            allBudgets={allBudgets}
            currentMonth={currentMonth}
            maxInsights={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}