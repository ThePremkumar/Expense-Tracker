import { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  SettingsIcon, 
  PlusIcon, 
  Trash2Icon, 
  HistoryIcon, 
  TargetIcon,
  TagIcon,
  CheckCircle2Icon,
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { MonthlyBudget } from '../types';

interface BudgetSettingsProps {
  currentMonth: string;
  monthlyBudget: MonthlyBudget | null;
  customCategories: string[];
  onUpdateBudget: (month: string, amount: number) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory?: (name: string) => void;
}

export function BudgetSettings({ 
  currentMonth, 
  monthlyBudget, 
  customCategories,
  onUpdateBudget,
  onAddCategory,
  onDeleteCategory
}: BudgetSettingsProps) {
  const [newBudget, setNewBudget] = useState(monthlyBudget?.totalBudget.toString() || '0');
  const [newCategory, setNewCategory] = useState('');

  // Quick adjust states
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');

  const currentBudgetAmount = monthlyBudget?.totalBudget || 0;

  const handleUpdateBudget = () => {
    const amount = parseFloat(newBudget);
    if (!isNaN(amount) && amount >= 0) {
      onUpdateBudget(currentMonth, amount);
    }
  };

  const handleAddToBudget = () => {
    const amount = parseFloat(adjustAmount);
    if (!isNaN(amount) && amount > 0) {
      const newTotal = currentBudgetAmount + amount;
      onUpdateBudget(currentMonth, newTotal);
      setAdjustAmount('');
      setNewBudget(newTotal.toString());
    }
  };

  const handleRemoveFromBudget = () => {
    const amount = parseFloat(adjustAmount);
    if (!isNaN(amount) && amount > 0) {
      const newTotal = Math.max(0, currentBudgetAmount - amount);
      onUpdateBudget(currentMonth, newTotal);
      setAdjustAmount('');
      setNewBudget(newTotal.toString());
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  // Computed preview values
  const adjustNum = parseFloat(adjustAmount) || 0;
  const previewNewBudget = adjustMode === 'add'
    ? currentBudgetAmount + adjustNum
    : Math.max(0, currentBudgetAmount - adjustNum);
  const isValidAdjust = adjustNum > 0;
  const wouldGoNegative = adjustMode === 'remove' && adjustNum > currentBudgetAmount;

  const defaultCategories = ['Room Rent', 'Food', 'Dress', 'Travel', 'Essentials', 'Miscellaneous'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budget Settings</h1>
          <p className="text-slate-500 text-sm">Control your spending limits and categories</p>
        </div>
        <div className="bg-white p-2 px-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 self-start sm:self-auto">
          <SettingsIcon className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-slate-700">Settings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Set Full Budget Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <div className="bg-indigo-600 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-2">
              <div className="flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-indigo-200" />
                <h3 className="font-bold">Monthly Budget</h3>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full w-fit">{currentMonth}</span>
            </div>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Setting a monthly budget helps you stay financially disciplined and achieve your savings goals faster.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Budget Amount (₹)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleUpdateBudget}>Update</Button>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Current active budget:</span>
                  <span className="text-lg font-bold text-indigo-700">{formatCurrency(currentBudgetAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Adjust Budget Card — NEW FEATURE */}
          <Card className="overflow-hidden border-none shadow-md">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-2">
              <div className="flex items-center gap-2">
                {adjustMode === 'add' 
                  ? <PlusCircleIcon className="w-5 h-5 text-emerald-200" />
                  : <MinusCircleIcon className="w-5 h-5 text-emerald-200" />
                }
                <h3 className="font-bold">Quick Adjust Budget</h3>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full w-fit">{currentMonth}</span>
            </div>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                Quickly add or remove amount from your existing monthly budget without replacing it entirely.
              </p>

              {/* Mode Toggle */}
              <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-5">
                <button
                  onClick={() => { setAdjustMode('add'); setAdjustAmount(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    adjustMode === 'add'
                      ? 'bg-emerald-600 text-white shadow-inner'
                      : 'bg-white text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Add to Budget
                </button>
                <button
                  onClick={() => { setAdjustMode('remove'); setAdjustAmount(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    adjustMode === 'remove'
                      ? 'bg-rose-600 text-white shadow-inner'
                      : 'bg-white text-slate-600 hover:bg-rose-50'
                  }`}
                >
                  <MinusCircleIcon className="w-4 h-4" />
                  Remove from Budget
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {adjustMode === 'add' ? 'Amount to Add (₹)' : 'Amount to Remove (₹)'}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={adjustMode === 'add' ? 'e.g. 5000' : 'e.g. 3000'}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="flex-1"
                    min="0"
                  />
                  <Button
                    onClick={adjustMode === 'add' ? handleAddToBudget : handleRemoveFromBudget}
                    disabled={!isValidAdjust}
                    className={adjustMode === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300'
                      : 'bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300'
                    }
                  >
                    {adjustMode === 'add' ? (
                      <><PlusCircleIcon className="w-4 h-4 mr-1.5" /> Add</>
                    ) : (
                      <><MinusCircleIcon className="w-4 h-4 mr-1.5" /> Remove</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Live Preview Calculation */}
              {isValidAdjust && (
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  adjustMode === 'add'
                    ? 'bg-emerald-50 border-emerald-200'
                    : wouldGoNegative
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center gap-1.5 mb-3">
                    {adjustMode === 'add' 
                      ? <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
                      : <TrendingDownIcon className="w-4 h-4 text-rose-600" />
                    }
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      adjustMode === 'add' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      Preview
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatCurrency(currentBudgetAmount)}
                      </span>
                      <span className={`text-sm font-bold ${adjustMode === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {adjustMode === 'add' ? '+' : '−'} {formatCurrency(adjustNum)}
                      </span>
                      <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                      <span className={`text-base font-bold ${
                        adjustMode === 'add' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {formatCurrency(previewNewBudget)}
                      </span>
                    </div>
                  </div>
                  {wouldGoNegative && (
                    <p className="text-xs text-amber-700 mt-2 font-medium">
                      ⚠️ Amount exceeds current budget. Budget will be set to ₹0.
                    </p>
                  )}
                </div>
              )}

              {/* Quick Amount Shortcuts */}
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick amounts</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1000, 2000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAdjustAmount(amt.toString())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                        adjustAmount === amt.toString()
                          ? adjustMode === 'add'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-rose-100 border-rose-300 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {adjustMode === 'add' ? '+' : '−'} {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Categories Card */}
          <Card className="shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Custom Categories</h3>
            </div>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Add unique categories to better organize and track your personal spending habits.
              </p>
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" onClick={handleAddCategory}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Add</span>
                </Button>
              </div>
              <div className="space-y-2">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Active Categories</h4>
               <div className="flex flex-wrap gap-2">
                 {defaultCategories.map(c => (
                   <div key={c} className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2 text-sm text-slate-600">
                     <CheckCircle2Icon className="w-3 h-3 text-emerald-500" />
                     {c}
                   </div>
                 ))}
                 {customCategories.map(c => (
                   <div key={c} className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2 text-sm text-indigo-700 font-medium group">
                     {c}
                     <button 
                       onClick={() => onDeleteCategory?.(c)}
                       className="text-indigo-300 hover:text-rose-500 transition-colors"
                     >
                       <Trash2Icon className="w-3 h-3" />
                     </button>
                   </div>
                 ))}
               </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Change History */}
        <Card className="shadow-sm h-fit">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Budget Change History</h3>
          </div>
          <CardContent className="p-0">
            {monthlyBudget?.history && monthlyBudget.history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {monthlyBudget.history.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-400">{formatDate(entry.date)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        entry.newBudget > entry.previousBudget
                          ? 'bg-emerald-100 text-emerald-700'
                          : entry.newBudget < entry.previousBudget
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {entry.newBudget > entry.previousBudget
                          ? 'Increased'
                          : entry.newBudget < entry.previousBudget
                            ? 'Decreased'
                            : 'Set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-slate-400">{formatCurrency(entry.previousBudget)}</span>
                        <ArrowRightIcon className="w-3 h-3 text-slate-300" />
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(entry.newBudget)}</span>
                      </div>
                      {entry.newBudget !== entry.previousBudget && (
                        <span className={`text-xs font-semibold ${
                          entry.newBudget > entry.previousBudget ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {entry.newBudget > entry.previousBudget ? '+' : '−'}
                          {formatCurrency(Math.abs(entry.newBudget - entry.previousBudget))}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <HistoryIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p>No budget change history recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}