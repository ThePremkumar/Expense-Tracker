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
  WalletIcon,
  ReceiptIcon,
  Edit2Icon,
  Trash2Icon,
  ArrowRightIcon,
  SmartphoneIcon,
  BanknoteIcon,
  DownloadIcon
} from 'lucide-react';

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
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  totalBudget: number;
  totalSpent: number;
  remainingBalance: number;
  upiSpent: number;
  cashSpent: number;
  todaySpent: number;
  recentTransactions: Transaction[];
  onAddExpense: () => void;
  onViewAll: () => void;
  onViewInsights?: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  allBudgets: Record<string, MonthlyBudget>;
  currentMonth: string;
  upiBudget: number;
  cashBudget: number;
  upiRemaining: number;
  cashRemaining: number;
  onAddMissingAmount: (amount: number, mode: 'UPI' | 'Cash', notes?: string) => Promise<void>;
  allTransactions: Transaction[];
  totalMissing: number;
  todayMissing: number;
}

export function Dashboard({
  totalBudget,
  totalSpent,
  remainingBalance,
  upiSpent,
  cashSpent,
  todaySpent,
  recentTransactions,
  onAddExpense,
  onViewAll,
  onViewInsights,
  onEdit,
  onDelete,
  allTransactions,
  allBudgets,
  currentMonth,
  upiBudget,
  cashBudget,
  upiRemaining,
  cashRemaining,
  onAddMissingAmount,
  totalMissing,
  todayMissing: _todayMissing
}: DashboardProps) {

  const [transactionModeFilter, setTransactionModeFilter] = useState<'all' | 'UPI' | 'Cash'>('all');

  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  const filteredTransactions = useMemo(() => {
    if (transactionModeFilter === 'all') return recentTransactions;
    return recentTransactions.filter(t => t.paymentMode === transactionModeFilter);
  }, [recentTransactions, transactionModeFilter]);

  const categoryData = groupTransactionsByCategory(recentTransactions);
  const dailyData = groupTransactionsByDate(allTransactions.filter(t => t.date.startsWith(currentMonth)));

  const cumulativeData = useMemo(() => {
    let cumulativeSpent = 0;
    return dailyData.map(d => {
      cumulativeSpent += d.amount;
      return {
        date: d.date,
        spent: cumulativeSpent,
        remaining: Math.max(0, totalBudget - cumulativeSpent)
      };
    });
  }, [dailyData, totalBudget]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 slide-in-from-bottom-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">Financial Core</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Command Center</h1>
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm tracking-tight pt-1">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            <span>Operations for {currentMonth}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="lg" className="rounded-2xl border-slate-200 shadow-xl shadow-slate-200/50 hover:bg-slate-50 gap-2 px-6 h-14" onClick={() => exportToCSV(allTransactions, `expenses_${currentMonth}`)}>
            <DownloadIcon className="w-4 h-4 text-slate-400" />
            <span className="font-black text-xs uppercase tracking-widest text-slate-600">Export</span>
          </Button>
          <Button size="lg" onClick={onAddExpense} className="premium-gradient rounded-2xl shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 gap-2 px-8 h-14">
            <PlusIcon className="w-5 h-5 text-white" />
            <span className="font-black text-xs uppercase tracking-widest text-white">New Expense</span>
          </Button>
        </div>
      </div>

      {/* CORE PERFORMANCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Monthly Cap */}
        <Card className="glass-card glow-on-hover p-6 relative overflow-hidden bg-white/50 group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Cap</span>
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                <TargetIcon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tighter block">{formatCurrency(totalBudget)}</span>
          </div>
        </Card>

        {/* Total Flow */}
        <Card className="glass-card glow-on-hover p-6 relative overflow-hidden bg-white/50 group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Flow</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-100 transition-colors">
                <ActivityIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-slate-900 tracking-tighter block">{formatCurrency(totalSpent)}</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{spentPercentage.toFixed(0)}% Utilized</p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100/50">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">UPI (S/R)</span>
                <span className="text-[11px] font-black text-indigo-600 leading-none">
                  {formatCurrency(upiSpent)} / <span className={upiRemaining < 0 ? 'text-rose-500' : 'text-slate-400'}>{formatCurrency(upiRemaining)}</span>
                </span>
              </div>
              <div className="w-px h-5 bg-slate-100" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">CASH (S/R)</span>
                <span className="text-[11px] font-black text-emerald-600 leading-none">
                  {formatCurrency(cashSpent)} / <span className={cashRemaining < 0 ? 'text-rose-500' : 'text-slate-400'}>{formatCurrency(cashRemaining)}</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Free Capital */}
        <Card className="glass-card glow-on-hover p-6 relative overflow-hidden bg-white/50 group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Free Capital</span>
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-400 transition-colors">
                <WalletIcon className="w-4 h-4" />
              </div>
            </div>
            <span className={`text-3xl font-black tracking-tighter block ${remainingBalance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>{formatCurrency(Math.max(0, remainingBalance))}</span>
          </div>
        </Card>

        {/* Today's Spend */}
        <Card className="glass-card glow-on-hover p-6 relative overflow-hidden bg-white/50 group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Spend</span>
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-amber-50 group-hover:text-amber-400 transition-colors">
                <ZapIcon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tighter block">{formatCurrency(todaySpent)}</span>
          </div>
        </Card>

        {/* Discrepancy */}
        <Card className="glass-card glow-on-hover p-6 relative overflow-hidden bg-white/50 group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discrepancy</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${totalMissing > 0 ? 'bg-rose-50 text-rose-400' : 'bg-slate-50 text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-400'}`}>
                <TargetIcon className="w-4 h-4" />
              </div>
            </div>
            <span className={`text-3xl font-black tracking-tighter block ${totalMissing > 0 ? 'text-rose-500' : 'text-slate-900'}`}>{formatCurrency(totalMissing)}</span>
          </div>
        </Card>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{payload[0].payload.date}</p>
                          <div className="space-y-1">
                            <p className="text-sm font-black flex justify-between gap-8 text-indigo-400">
                               <span>SPENT</span>
                               <span>{formatCurrency(payload[0].value as number)}</span>
                            </p>
                            <p className="text-sm font-black flex justify-between gap-8 text-emerald-400">
                               <span>BALANCE</span>
                               <span>{formatCurrency(payload[1].value as number)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Area type="monotone" dataKey="spent" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSpent)" />
                  <Area type="monotone" dataKey="remaining" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRemaining)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SECTOR DISTRIBUTION PIE */}
        <Card className="glass-card border-none shadow-2xl overflow-hidden p-8 flex flex-col">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl font-black tracking-tight">Category Distribution</CardTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weight split by sector</p>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col justify-center">
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '12px' }}
                    itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 space-y-3">
              {categoryData.slice(0, 4).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat.name) }} />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ANALYTICS & LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black tracking-tight">Financial Ledger</CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent operational activity</p>
              </div>
              
              <div className="flex rounded-xl overflow-hidden border border-slate-200">
                {(['all', 'UPI', 'Cash'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTransactionModeFilter(mode)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      transactionModeFilter === mode
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-6">Transaction</th>
                      <th className="p-6">Category</th>
                      <th className="p-6 text-right">Amount</th>
                      <th className="p-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${t.paymentMode === 'UPI' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                              {t.paymentMode === 'UPI' ? <SmartphoneIcon className="w-5 h-5" /> : <BanknoteIcon className="w-5 h-5" />}
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{t.title}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                             {t.category}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-sm font-black text-slate-900">{formatCurrency(t.amount)}</span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(t)} className="p-2.5 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all">
                              <Edit2Icon className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(t.id)} className="p-2.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all">
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                <Button variant="secondary" size="sm" onClick={onViewAll} className="rounded-xl border-slate-200 uppercase tracking-widest text-[9px] font-black px-6">
                  Access Complete Ledger
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
           <SmartInsights allTransactions={allTransactions} allBudgets={allBudgets} currentMonth={currentMonth} />
           <Card className="flex-1 glass-card border-none shadow-2xl p-8 bg-slate-900 text-white overflow-hidden relative group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-colors" />
              <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight">Manual Audit Discrepancy</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Logged balance mismatches requiring manual reconciliation</p>
                </div>
                <div className="pt-2">
                   <Button onClick={() => onAddMissingAmount(0, 'Cash')} className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 gap-2">
                       <PlusIcon className="w-5 h-5" />
                       <span className="font-black text-xs uppercase tracking-widest">Report Missing Amount</span>
                   </Button>
                </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}