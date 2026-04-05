import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  PlusIcon,
  PieChart as PieChartIcon,
  CalendarIcon,
  ZapIcon,
  ActivityIcon,
  TargetIcon,
  DownloadIcon,
  WalletIcon,
  ReceiptIcon,
  Edit2Icon,
  Trash2Icon,
  ArrowRightIcon
} from 'lucide-react';
import { SummaryStat } from '../components/DashboardComponents';
import { SmartInsights } from '../components/SmartInsights';
import {
  formatCurrency,
  getCategoryColor,
  groupTransactionsByCategory,
  groupTransactionsByDate,
  exportToCSV
} from '../utils/helpers';
import { Transaction, MonthlyBudget } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  totalBudget: number;
  totalSpent: number;
  remainingBalance: number;
  todaySpent: number;
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
  todaySpent,
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

  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
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

  // Cumulative spending data for area chart
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


  return (
    <div className="space-y-8 entry-animation">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-500/10 px-2 py-0.5 rounded-md">Financial Core</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" /> Operations for {currentMonth}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExport} className="glass-card font-black text-xs uppercase tracking-widest px-6 h-12">
            <DownloadIcon className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={onAddExpense} className="premium-gradient font-black text-xs uppercase tracking-widest px-6 h-12 shadow-xl shadow-indigo-500/20">
            <PlusIcon className="w-4 h-4 mr-2" /> New Expense
          </Button>
        </div>
      </div>

      {/* TOP STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <SummaryStat label="Monthly Cap" value={formatCurrency(totalBudget)} icon={TargetIcon} trend="neutral" />
        <SummaryStat label="Total Flow" value={formatCurrency(totalSpent)} subValue={`${spentPercentage.toFixed(0)}% Utilized`} icon={ActivityIcon} trend={isOverLimit ? 'down' : 'neutral'} />
        <SummaryStat label="Free Capital" value={formatCurrency(Math.max(0, remainingBalance))} icon={WalletIcon} trend={remainingBalance < 0 ? 'down' : 'up'} />
        <SummaryStat label="Today's Spend" value={formatCurrency(todaySpent)} icon={ZapIcon} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CENTER LEFT - MAIN FLOW CHART */}
        <Card className="lg:col-span-2 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="p-8 pb-2 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight">Cumulative Capital Flow</CardTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time spending trajectory</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                    labelStyle={{ fontWeight: 800, marginBottom: '8px', color: '#1E293B' }}
                    formatter={(value: any) => [`₹${(value as number).toLocaleString()}`, '']}
                  />
                  {totalBudget > 0 && <ReferenceLine y={totalBudget} stroke="#EF4444" strokeDasharray="10 10" strokeWidth={2} label={{ value: 'LIMIT', fill: '#EF4444', fontSize: 10, fontWeight: 900 }} />}
                  <Area type="monotone" dataKey="spent" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSpent)" activeDot={{ r: 8, fill: '#6366f1', strokeWidth: 4, stroke: '#fff' }} />
                  {totalBudget > 0 && <Area type="monotone" dataKey="remaining" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRemaining)" activeDot={{ r: 8, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CATEGORY DONUT - MOVED UP */}
        <Card className="glass-card border-none shadow-2xl overflow-hidden p-8 flex flex-col justify-center">
            <div className="space-y-1 mb-8">
              <CardTitle className="text-lg font-black tracking-tight">Category Distribution</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight split by sector</p>
            </div>
            {categoryData.length > 0 ? (
              <>
                <div className="h-56 w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                        {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(item.name) }} />
                        <span className="text-[11px] font-bold text-slate-500 tracking-tight group-hover:text-slate-900 transition-colors">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 tracking-tighter">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                <PieChartIcon className="w-12 h-12 mb-3 opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting sector data</span>
              </div>
            )}
        </Card>
      </div>


      {/* RECENT ACTIVITY */}
      <div className="space-y-8">
        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight tracking-tight">Financial Ledger</CardTitle>
              <div className="flex gap-2">
                {(['all', 'UPI', 'Cash'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTransactionModeFilter(mode)}
                    className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest transition-all ${
                      transactionModeFilter === mode 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="font-bold text-xs uppercase tracking-widest text-indigo-600 hover:text-indigo-700" onClick={onViewAll}>
              Full Ledger
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.slice(0, 5).map((t: Transaction) => (
                  <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-300 group">
                    <div className="flex items-center space-x-5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg transform group-hover:scale-110 transition-transform duration-500"
                        style={{ backgroundColor: getCategoryColor(t.category) }}>
                        {t.category.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{t.title}</p>
                        <div className="flex items-center text-[10px] font-bold text-slate-400 space-x-2 tracking-widest uppercase">
                          <span className="text-slate-800">{t.category}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded-md border bg-slate-50 text-slate-500 border-slate-100 font-black">
                            QTY: {t.quantity || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-5">
                      <div className="text-right flex flex-col items-end">
                        <span className="font-black text-lg text-slate-900 tracking-tighter">-{formatCurrency(t.amount)}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${t.paymentMode === 'UPI' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                          {t.paymentMode} Flow
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => onEdit(t)} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"><Edit2Icon className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if (window.confirm('Delete entry?')) onDelete(t.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2Icon className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4"><ReceiptIcon className="w-8 h-8 text-slate-200" /></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching operations recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SMART INSIGHTS PANEL */}
      <Card className="glass-card border-none shadow-2xl p-8">
        <div className="flex flex-row items-center justify-between mb-8">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight">Intelligence Feed</CardTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Algorithmic financial insights</p>
          </div>
          <Button variant="ghost" size="sm" className="font-bold text-xs uppercase tracking-widest text-indigo-600" onClick={onViewInsights}>
            Full Analysis
          </Button>
        </div>
        <SmartInsights
            allTransactions={allTransactions}
            allBudgets={allBudgets}
            currentMonth={currentMonth}
            maxInsights={4}
          />
      </Card>
    </div>
  );
}