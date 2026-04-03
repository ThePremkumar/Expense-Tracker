import { useState, useMemo } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  SmartphoneIcon,
  SearchIcon,
  FilterIcon,
  TrendingUpIcon,
  SettingsIcon,
  Trash2Icon,
  TargetIcon,
  AlertTriangleIcon,
  CalendarIcon
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { SummaryStat, BudgetProgressCard } from '../components/DashboardComponents';

interface UPITrackerProps {
  transactions: Transaction[];
  upiBudget: number;
  currentMonth: string;
  onAddExpense: () => void;
  onUpdateUpiBudget: (month: string, amount: number) => void;
  onRemoveUpiBudget: (month: string) => void;
}

export function UPITracker({
  transactions,
  upiBudget,
  currentMonth,
  onAddExpense,
  onUpdateUpiBudget,
  onRemoveUpiBudget
}: UPITrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'upi'>('upi');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(upiBudget > 0 ? upiBudget.toString() : '');
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  // UPI-only transactions
  const upiTransactions = useMemo(() =>
    transactions.filter(t => t.paymentMode === 'UPI'), [transactions]);

  const totalUPI = useMemo(() =>
    upiTransactions.reduce((sum, t) => sum + t.amount, 0), [upiTransactions]);

  const upiRemaining = upiBudget - totalUPI;
  const upiSpentPercent = upiBudget > 0 ? (totalUPI / upiBudget) * 100 : 0;
  const isOverBudget = upiBudget > 0 && totalUPI > upiBudget;
  const isNearBudget = upiBudget > 0 && upiSpentPercent > 80 && !isOverBudget;

  // Today's UPI
  const today = new Date().toISOString().split('T')[0];
  const todayUPI = useMemo(() =>
    upiTransactions.filter(t => t.date === today).reduce((s, t) => s + t.amount, 0),
    [upiTransactions, today]);

  // This week UPI
  const thisWeekUPI = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return upiTransactions
      .filter(t => new Date(t.date) >= weekAgo)
      .reduce((s, t) => s + t.amount, 0);
  }, [upiTransactions]);

  // Daily average UPI
  const dailyAvgUPI = useMemo(() => {
    const days = new Set(upiTransactions.map(t => t.date)).size;
    return days > 0 ? totalUPI / days : 0;
  }, [upiTransactions, totalUPI]);

  // Most used UPI day
  const busiestDay = useMemo(() => {
    const dayMap: Record<string, number> = {};
    upiTransactions.forEach(t => {
      const day = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayMap[day] = (dayMap[day] || 0) + t.amount;
    });
    const entries = Object.entries(dayMap);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [upiTransactions]);

  // Filtered transactions
  const displayTransactions = useMemo(() => {
    let filtered = activeFilter === 'upi' ? upiTransactions : transactions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.upiId?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, upiTransactions, activeFilter, searchQuery]);

  // Daily UPI trend
  const dailyUPITrend = useMemo(() => {
    const dayMap: Record<string, number> = {};
    upiTransactions.forEach(t => {
      dayMap[t.date] = (dayMap[t.date] || 0) + t.amount;
    });
    return Object.entries(dayMap)
      .map(([date, amount]) => ({ date, amount, day: new Date(date).getDate() }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [upiTransactions]);

  // UPI grouped by ID/dest
  const upiByIdData = useMemo(() => {
    const idMap: Record<string, number> = {};
    upiTransactions.forEach(t => {
      const key = t.upiId || t.title;
      idMap[key] = (idMap[key] || 0) + t.amount;
    });
    return Object.entries(idMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [upiTransactions]);

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) {
      onUpdateUpiBudget(currentMonth, amount);
      setIsBudgetModalOpen(false);
    }
  };

  const handleRemoveBudget = () => {
    onRemoveUpiBudget(currentMonth);
    setBudgetInput('');
    setShowConfirmRemove(false);
    setIsBudgetModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">UPI Tracker</h1>
          <p className="text-slate-500 text-sm">Monitor and manage your UPI spending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setBudgetInput(upiBudget > 0 ? upiBudget.toString() : ''); setIsBudgetModalOpen(true); }}>
            <SettingsIcon className="w-4 h-4 mr-2" /> UPI Budget
          </Button>
          <Button onClick={onAddExpense}>
            <SmartphoneIcon className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Budget Alerts */}
      <div className="space-y-3">
        {isOverBudget && (
          <div className="p-4 rounded-xl flex items-start gap-3 bg-rose-50 text-rose-800 border border-rose-200 animate-in slide-in-from-top-2">
            <AlertTriangleIcon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">UPI Budget Exceeded!</h4>
              <p className="text-sm mt-0.5">You've overspent your UPI budget by {formatCurrency(Math.abs(upiRemaining))}. Consider switching to cash.</p>
            </div>
          </div>
        )}
        {isNearBudget && (
          <div className="p-4 rounded-xl flex items-start gap-3 bg-amber-50 text-amber-800 border border-amber-200 animate-in slide-in-from-top-2">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Approaching UPI Limit</h4>
              <p className="text-sm mt-0.5">You've used {upiSpentPercent.toFixed(0)}% of your UPI budget. Only {formatCurrency(upiRemaining)} remaining.</p>
            </div>
          </div>
        )}
      </div>

      {/* UPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BudgetProgressCard
          title="UPI Budget"
          budget={upiBudget}
          spent={totalUPI}
          remaining={upiRemaining}
          primaryColor="bg-gradient-to-br from-violet-600 to-purple-700"
          icon={TargetIcon}
        />
        <SummaryStat label="UPI Spent" value={formatCurrency(totalUPI)} subValue={`${upiTransactions.length} transactions`} icon={SmartphoneIcon} trend="neutral" />
        <SummaryStat label="Today's UPI" value={formatCurrency(todayUPI)} icon={CalendarIcon} trend="neutral" />
        <SummaryStat label="Weekly UPI" value={formatCurrency(thisWeekUPI)} icon={TrendingUpIcon} trend="neutral" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Daily Avg', value: formatCurrency(dailyAvgUPI), icon: '📊' },
          { label: 'Busiest Day', value: busiestDay ? busiestDay[0] : '—', icon: '🔥' },
          { label: 'Top Dest.', value: upiByIdData[0]?.name || '—', icon: '📍' },
          { label: 'UPI Purity', value: transactions.length > 0 ? `${((upiTransactions.length / transactions.length) * 100).toFixed(0)}%` : '0%', icon: '💎' }
        ].map(stat => (
          <div key={stat.label} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{stat.icon}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI Spending Trend */}
        <Card className="shadow-md border-none">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-slate-900">UPI Spending Trend</h3>
          </div>
          <CardContent className="p-4">
            {dailyUPITrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyUPITrend}>
                  <defs>
                    <linearGradient id="upiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'UPI Spent']}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#upiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400 italic">
                No UPI transactions yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories & Top Destinations */}
        <div className="space-y-6">
          <Card className="shadow-md border-none">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <FilterIcon className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-slate-900">Top Destinations</h3>
            </div>
            <CardContent className="p-4">
              {upiByIdData.length > 0 ? (
                <div className="space-y-4">
                  {upiByIdData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-violet-400 w-6">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{item.name}</span>
                          <span className="text-sm font-bold text-violet-700">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="w-full bg-violet-50 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(item.amount / totalUPI) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 italic">No destination data</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction List */}
      <Card className="shadow-md border-none">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search UPI transactions, IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              {(['upi', 'all'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-xs font-semibold transition-all ${
                    activeFilter === filter
                      ? 'bg-violet-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-violet-50'
                  }`}
                >
                  {filter === 'all' ? 'All' : 'UPI Only'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {displayTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {displayTransactions.map(t => (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-violet-100">
                      <SmartphoneIcon className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{formatDate(t.date)}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500">{t.category}</span>
                        {t.upiId && <><span className="text-xs text-slate-300">•</span><span className="text-xs text-violet-500 truncate max-w-[120px]">{t.upiId}</span></>}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">No transactions found</div>
          )}
        </CardContent>
      </Card>

      {/* UPI Budget Modal */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => { setIsBudgetModalOpen(false); setShowConfirmRemove(false); }} title="UPI Budget Settings">
        <div className="space-y-5">
          <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Current UPI Budget</p>
              <p className="text-xl font-bold text-violet-800 mt-1">{formatCurrency(upiBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-violet-500">Left: {formatCurrency(upiRemaining)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Set UPI Budget (₹)</label>
            <div className="flex gap-2">
              <Input type="number" placeholder="e.g., 5000" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} autoFocus />
              <Button onClick={handleSaveBudget} disabled={!budgetInput}>
                {upiBudget > 0 ? 'Update' : 'Set'}
              </Button>
            </div>
          </div>

          {/* Quick amounts */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick set</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {[2000, 5000, 10000, 15000].map(amt => (
                <button key={amt} onClick={() => setBudgetInput(amt.toString())} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${budgetInput === amt.toString() ? 'bg-violet-100 border-violet-300 text-violet-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-violet-50'}`}>
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          {upiBudget > 0 && (
            <div className="pt-4 border-t border-slate-100">
              {showConfirmRemove ? (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 space-y-2">
                  <p className="text-sm text-rose-700 font-medium text-center">Are you sure?</p>
                  <div className="flex gap-2">
                    <Button variant="danger" onClick={handleRemoveBudget} className="flex-1">Remove</Button>
                    <Button variant="ghost" onClick={() => setShowConfirmRemove(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowConfirmRemove(true)} className="w-full text-sm text-rose-500 hover:text-rose-700 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <Trash2Icon className="w-4 h-4" /> Remove UPI Budget
                </button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
