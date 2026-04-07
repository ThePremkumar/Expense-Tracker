import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AppState, Transaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { ShieldCheckIcon, CalendarIcon, ArrowDownIcon, PiggyBankIcon, AlertCircleIcon, TrendingUpIcon, CheckIcon, XIcon, Edit2Icon } from 'lucide-react';

interface BudgetAuditProps {
  state: AppState;
  allTransactions: Transaction[];
  onUpdateMissingAmount: (month: string, amount: number) => Promise<void>;
}

export function BudgetAudit({ state, allTransactions, onUpdateMissingAmount }: BudgetAuditProps) {
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Get all months that have either a budget or transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    // Add months from budgets
    Object.keys(state.budgets).forEach(m => months.add(m));
    
    // Add months from transactions
    allTransactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      months.add(monthKey);
    });
    
    return Array.from(months).sort().reverse();
  }, [state.budgets, allTransactions]);

  const auditData = useMemo(() => {
    return availableMonths.map(month => {
      const budget = state.budgets[month];
      const monthTransactions = allTransactions.filter(t => t.date.startsWith(month));
      
      const totalBudget = budget?.totalBudget || 0;
      const totalSpent = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Calculate Missing Amount from transactions (fallback)
      const computedMissing = monthTransactions
        .filter(t => t.title.toLowerCase().includes('missing amount'))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Use override if set, otherwise use computed value
      const missingAmount = budget?.missingAmountOverride !== undefined 
        ? budget.missingAmountOverride 
        : computedMissing;
      
      const savings = budget?.carryForwardToSavings || 0;
      const carryForward = budget?.carryForward || 0;
      
      const remaining = totalBudget - totalSpent;
      const efficiency = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0';

      return {
        month,
        totalBudget,
        totalSpent,
        missingAmount,
        savings,
        carryForward,
        remaining,
        efficiency
      };
    });
  }, [availableMonths, state.budgets, allTransactions]);

  const handleStartEdit = (month: string, currentAmount: number) => {
    setEditingMonth(month);
    setEditValue(currentAmount.toString());
  };

  const handleSave = async () => {
    if (editingMonth === null) return;
    const amount = parseFloat(editValue) || 0;
    await onUpdateMissingAmount(editingMonth, amount);
    setEditingMonth(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setEditValue('');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-500/10 px-2 py-0.5 rounded-md">Financial Audit</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Budget Audit</h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight">Historical flow performance and discrepancy tracking</p>
        </div>
      </div>

      {/* Audit Table Card */}
      <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem]">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Historical Ledger</CardTitle>
            </div>
            <div className="flex items-center gap-2 py-1.5 px-4 bg-indigo-50 rounded-full border border-indigo-100">
              <TrendingUpIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Global Stability Active</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-8">Month Cycle</th>
                  <th className="p-8">Total Budget</th>
                  <th className="p-8">Net Spent</th>
                  <th className="p-8 text-rose-500">Missing Amount</th>
                  <th className="p-8 text-emerald-500">Savings Flow</th>
                  <th className="p-8 text-sky-500">Carry Forward (S/F)</th>
                  <th className="p-8 text-right">Efficiency %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 italic">
                {auditData.map((row) => (
                  <tr key={row.month} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <span className="text-base font-black text-slate-900">{row.month}</span>
                      </div>
                    </td>
                    <td className="p-8 font-bold text-slate-700">{formatCurrency(row.totalBudget)}</td>
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="text-base font-black text-slate-900">{formatCurrency(row.totalSpent)}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validated Cycle</span>
                      </div>
                    </td>
                    <td className="p-8">
                      {editingMonth === row.month ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                              }}
                              className="w-28 pl-7 pr-2 py-2 text-sm font-black text-rose-600 border-2 border-rose-200 rounded-xl bg-rose-50/50 focus:outline-none focus:border-rose-400 transition-colors not-italic"
                              autoFocus
                            />
                          </div>
                          <button onClick={handleSave} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Save">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancel} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" title="Cancel">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/edit">
                          {row.missingAmount > 0 && <AlertCircleIcon className="w-4 h-4 text-rose-500" />}
                          <span className={`text-base font-black ${row.missingAmount > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                            {formatCurrency(row.missingAmount)}
                          </span>
                          <button
                            onClick={() => handleStartEdit(row.month, row.missingAmount)}
                            className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="Edit missing amount"
                          >
                            <Edit2Icon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2">
                        <PiggyBankIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-base font-black text-emerald-600">{formatCurrency(row.savings)}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <ArrowDownIcon className="w-4 h-4 text-sky-500" />
                          <span className="text-base font-black text-sky-600">{formatCurrency(row.carryForward)}</span>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last month balance</span>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="inline-flex items-center py-1.5 px-3 rounded-xl bg-slate-100 text-[11px] font-black text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {row.efficiency}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {auditData.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                <ShieldCheckIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Zero Records Found</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize your first budget cycle to start auditing</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card border-none shadow-xl p-8 bg-slate-900 text-white">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Total Missing Cumulative</h3>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-black tracking-tighter text-rose-500">
              {formatCurrency(auditData.reduce((sum, r) => sum + r.missingAmount, 0))}
            </span>
            <span className="text-xs font-bold text-slate-400 italic">Across all recorded cycles</span>
          </div>
        </Card>
        <Card className="glass-card border-none shadow-xl p-8 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUpIcon className="w-24 h-24 text-indigo-600" />
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Capital Retention Rate</h3>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-black tracking-tighter text-indigo-600">
              {(auditData.reduce((sum, r) => sum + r.savings + r.carryForward, 0) / Math.max(1, auditData.reduce((sum, r) => sum + r.totalBudget, 0)) * 100).toFixed(1)}%
            </span>
            <span className="text-xs font-bold text-slate-400 italic">Historical efficiency index</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
