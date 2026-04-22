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
  TrendingDownIcon,
  PiggyBankIcon,
  ArrowDownCircleIcon,
  WalletIcon,
  SparklesIcon,
  SmartphoneIcon,
  BanknoteIcon
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { MonthlyBudget } from '../types';
import toast from 'react-hot-toast';

interface BudgetSettingsProps {
  currentMonth: string;
  monthlyBudget: MonthlyBudget | null;
  categories: string[];
  onUpdateBudget: (month: string, budget: number, upiBudget?: number, cashBudget?: number, reason?: string) => Promise<void>;
  onAddCategory: (name: string) => void;
  onDeleteCategory?: (name: string) => void;
  previousMonthRemaining?: number;
  onCarryForward?: (amount: number, target: 'budget' | 'savings') => void;
  savings?: number;
  onUpdateSavings?: (amount: number) => void;
  onTransferModes?: (amount: number, from: 'UPI' | 'Cash') => Promise<void>;
  upiBudget?: number;
  cashBudget?: number;
}

export function BudgetSettings({ 
  currentMonth, 
  monthlyBudget, 
  categories,
  onUpdateBudget,
  onAddCategory,
  onDeleteCategory,
  previousMonthRemaining = 0,
  onCarryForward,
  savings = 0,
  onUpdateSavings,
  onTransferModes,
  upiBudget = 0,
  cashBudget = 0
}: BudgetSettingsProps) {
  const [newBudget, setNewBudget] = useState(monthlyBudget?.totalBudget.toString() || '0');
  const [newCategory, setNewCategory] = useState('');

  // Quick adjust states
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [quickNote, setQuickNote] = useState('');

  // Carry forward states
  const [carryForwardAmount, setCarryForwardAmount] = useState(previousMonthRemaining.toString());
  const [carryTarget, setCarryTarget] = useState<'budget' | 'savings'>('budget');

  // Savings adjust
  const [savingsAdjust, setSavingsAdjust] = useState('');

  // Transfer states
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMode, setTransferMode] = useState<'Cash' | 'UPI'>('Cash'); // from
  const [newUpiBudget, setNewUpiBudget] = useState(monthlyBudget?.upiBudget?.toString() || '0');

  const currentBudgetAmount = monthlyBudget?.totalBudget || 0;
  const alreadyCarriedForward = (monthlyBudget?.carryForward || 0) + (monthlyBudget?.carryForwardToSavings || 0);

  const handleUpdateBudget = () => {
    const amount = parseFloat(newBudget);
    if (!isNaN(amount) && amount >= 0) {
      onUpdateBudget(currentMonth, amount, undefined, undefined, 'Full update');
    }
  };

  const handleUpdateDetailedBudget = () => {
    const total = parseFloat(newBudget);
    const upi = parseFloat(newUpiBudget);
    if (!isNaN(total) && !isNaN(upi) && total >= 0 && upi >= 0 && upi <= total) {
      onUpdateBudget(currentMonth, total, upi, total - upi, 'Detailed allocation update');
    } else if (upi > total) {
      toast.error("UPI budget cannot exceed total budget");
    }
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!isNaN(amount) && amount > 0 && onTransferModes) {
      onTransferModes(amount, transferMode);
      setTransferAmount('');
    }
  };


  const handleAddToBudget = () => {
    const amount = parseFloat(adjustAmount);
    if (!isNaN(amount) && amount > 0) {
      const newTotal = currentBudgetAmount + amount;
      onUpdateBudget(currentMonth, newTotal, undefined, undefined, quickNote.trim() || 'Budget added');
      setAdjustAmount('');
      setQuickNote('');
      setNewBudget(newTotal.toString());
    }
  };

  const handleRemoveFromBudget = () => {
    const amount = parseFloat(adjustAmount);
    if (!isNaN(amount) && amount > 0) {
      const newTotal = Math.max(0, currentBudgetAmount - amount);
      onUpdateBudget(currentMonth, newTotal, undefined, undefined, quickNote.trim() || 'Budget removed');
      setAdjustAmount('');
      setQuickNote('');
      setNewBudget(newTotal.toString());
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleCarryForward = () => {
    const amount = parseFloat(carryForwardAmount);
    if (!isNaN(amount) && amount > 0 && onCarryForward) {
      onCarryForward(Math.min(amount, previousMonthRemaining), carryTarget);
      setCarryForwardAmount('0');
    }
  };

  const handleAddToSavings = () => {
    const amount = parseFloat(savingsAdjust);
    if (!isNaN(amount) && amount > 0 && onUpdateSavings) {
      onUpdateSavings(savings + amount);
      setSavingsAdjust('');
    }
  };

  const handleRemoveFromSavings = () => {
    const amount = parseFloat(savingsAdjust);
    if (!isNaN(amount) && amount > 0 && onUpdateSavings) {
      onUpdateSavings(Math.max(0, savings - amount));
      setSavingsAdjust('');
    }
  };

  // Computed preview values
  const adjustNum = parseFloat(adjustAmount) || 0;
  const previewNewBudget = adjustMode === 'add'
    ? currentBudgetAmount + adjustNum
    : Math.max(0, currentBudgetAmount - adjustNum);
  const isValidAdjust = adjustNum > 0;
  const wouldGoNegative = adjustMode === 'remove' && adjustNum > currentBudgetAmount;

// Removed defaultCategories which are now handled in useExpenseTracker

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budget Settings</h1>
          <p className="text-slate-500 text-sm">Control your spending limits, savings and categories</p>
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
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Total Budget Amount (₹)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Total Budget"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleUpdateBudget}>Update</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">UPI Allocation (₹)</label>
                    <Input
                      type="number"
                      placeholder="UPI portion"
                      value={newUpiBudget}
                      onChange={(e) => setNewUpiBudget(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <Button onClick={handleUpdateDetailedBudget} className="w-full">Set Allocation</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      <SmartphoneIcon className="w-3 h-3 text-indigo-500" /> UPI Pool
                    </div>
                    <span className="text-lg font-bold text-indigo-700">{formatCurrency(upiBudget)}</span>
                  </div>

                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      <BanknoteIcon className="w-3 h-3 text-emerald-500" /> Cash Pool
                    </div>
                    <span className="text-lg font-bold text-emerald-700">{formatCurrency(cashBudget)}</span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Carry Forward Card */}
          {previousMonthRemaining > 0 && alreadyCarriedForward === 0 && onCarryForward && (
            <Card className="overflow-hidden border-none shadow-md">
              <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-2">
                <div className="flex items-center gap-2">
                  <ArrowDownCircleIcon className="w-5 h-5 text-sky-200" />
                  <h3 className="font-bold">Carry Forward</h3>
                </div>
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full w-fit">
                  {formatCurrency(previousMonthRemaining)} available
                </span>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                  You have <span className="font-bold text-sky-700">{formatCurrency(previousMonthRemaining)}</span> remaining from last month. Choose where to allocate it.
                </p>

                {/* Target Toggle */}
                <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-5">
                  <button
                    onClick={() => setCarryTarget('budget')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      carryTarget === 'budget'
                        ? 'bg-sky-600 text-white shadow-inner'
                        : 'bg-white text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    <WalletIcon className="w-4 h-4" />
                    Add to Budget
                  </button>
                  <button
                    onClick={() => setCarryTarget('savings')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      carryTarget === 'savings'
                        ? 'bg-emerald-600 text-white shadow-inner'
                        : 'bg-white text-slate-600 hover:bg-emerald-50'
                    }`}
                  >
                    <PiggyBankIcon className="w-4 h-4" />
                    Move to Savings
                  </button>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Amount to carry forward (₹)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={carryForwardAmount}
                      onChange={(e) => setCarryForwardAmount(e.target.value)}
                      className="flex-1"
                      min="0"
                      max={previousMonthRemaining.toString()}
                    />
                    <Button
                      onClick={handleCarryForward}
                      disabled={parseFloat(carryForwardAmount) <= 0}
                      className={carryTarget === 'budget'
                        ? 'bg-sky-600 hover:bg-sky-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                      }
                    >
                      <SparklesIcon className="w-4 h-4 mr-1.5" />
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Quick amounts */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick amounts</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[previousMonthRemaining, Math.round(previousMonthRemaining / 2), Math.round(previousMonthRemaining / 4)].filter(a => a > 0).map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCarryForwardAmount(amt.toString())}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                          carryForwardAmount === amt.toString()
                            ? 'bg-sky-100 border-sky-300 text-sky-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already carried forward indicator */}
          {alreadyCarriedForward > 0 && (
            <Card className="overflow-hidden border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Carry Forward Applied</p>
                    <p className="text-xs text-slate-500">
                      {monthlyBudget?.carryForward ? `${formatCurrency(monthlyBudget.carryForward)} to budget` : ''}
                      {monthlyBudget?.carryForward && monthlyBudget?.carryForwardToSavings ? ' • ' : ''}
                      {monthlyBudget?.carryForwardToSavings ? `${formatCurrency(monthlyBudget.carryForwardToSavings)} to savings` : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Savings Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-2">
              <div className="flex items-center gap-2">
                <PiggyBankIcon className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold">Savings</h3>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full w-fit">
                {formatCurrency(savings)}
              </span>
            </div>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                Add or withdraw from your savings balance.
              </p>
              <div className="flex gap-2 mb-4">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={savingsAdjust}
                  onChange={(e) => setSavingsAdjust(e.target.value)}
                  className="flex-1"
                  min="0"
                />
                <Button
                  onClick={handleAddToSavings}
                  disabled={!savingsAdjust || parseFloat(savingsAdjust) <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <PlusCircleIcon className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button
                  onClick={handleRemoveFromSavings}
                  disabled={!savingsAdjust || parseFloat(savingsAdjust) <= 0}
                  variant="danger"
                >
                  <MinusCircleIcon className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-sm text-emerald-700">Total Savings:</span>
                <span className="text-lg font-bold text-emerald-800">{formatCurrency(savings)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Adjust Budget Card */}
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
              {/* Mode Toggles */}
              <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6">
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
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {adjustMode === 'add' ? 'Amount to Add (₹)' : 'Amount to Remove (₹)'}
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full h-12 text-lg font-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Quick Note (Optional)
                  </label>
                  <Input
                    placeholder="e.g., Salary, Bonus, Emergency..."
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Button
                  className={`w-full py-6 font-bold uppercase tracking-widest ${
                    adjustMode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                  disabled={!isValidAdjust || (adjustMode === 'remove' && wouldGoNegative)}
                  onClick={adjustMode === 'add' ? handleAddToBudget : handleRemoveFromBudget}
                >
                  {adjustMode === 'add' ? (
                    <><PlusCircleIcon className="w-5 h-5 mr-2" /> Complete Addition</>
                  ) : (
                    <><MinusCircleIcon className="w-5 h-5 mr-2" /> Complete Removal</>
                  )}
                </Button>
              </div>

              {/* Live Preview Calculation */}
              {isValidAdjust && (
                <div className={`p-4 rounded-2xl border-2 transition-all duration-300 mb-6 ${
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
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      adjustMode === 'add' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      Preview Result
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-500">
                        {formatCurrency(currentBudgetAmount)}
                      </span>
                      <span className={`text-sm font-black ${adjustMode === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {adjustMode === 'add' ? '+' : '−'} {formatCurrency(adjustNum)}
                      </span>
                      <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                      <span className={`text-base font-black ${
                        adjustMode === 'add' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {formatCurrency(previewNewBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Amount Shortcuts */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Presets</span>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAdjustAmount(amt.toString())}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all duration-300 ${
                        adjustAmount === amt.toString()
                          ? adjustMode === 'add'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/20'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
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
                 {categories.map((c: string) => (
                   <div key={c} className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2 text-sm text-indigo-700 font-medium group">
                     {c}
                     <button 
                       onClick={() => { if (window.confirm(`Are you sure you want to delete the category "${c}"?`)) onDeleteCategory?.(c); }}
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

          {/* Flow Transfer Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-2">
              <div className="flex items-center gap-2">
                <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold">Flow Transfer</h3>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full w-fit">Inter-mode control</span>
            </div>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                Reprioritize capital between your <span className="font-bold">UPI</span> and <span className="font-bold">Cash</span> flows.
              </p>

              <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-5">
                <button
                  onClick={() => setTransferMode('Cash')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    transferMode === 'Cash'
                      ? 'bg-slate-900 text-white shadow-inner'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BanknoteIcon className="w-4 h-4" />
                  Cash to UPI
                </button>
                <button
                  onClick={() => setTransferMode('UPI')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    transferMode === 'UPI'
                      ? 'bg-slate-900 text-white shadow-inner'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <SmartphoneIcon className="w-4 h-4" />
                  UPI to Cash
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount to Transfer (₹)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="flex-1"
                      min="0"
                    />
                    <Button
                      onClick={handleTransfer}
                      disabled={!transferAmount || parseFloat(transferAmount) <= 0}
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      Process Transfer
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1 flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Source Balance</span>
                    <span className="text-sm font-bold text-slate-700">{formatCurrency(transferMode === 'Cash' ? cashBudget : upiBudget)}</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-slate-300" />
                  <div className="flex-1 flex flex-col text-right">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Flow</span>
                    <span className="text-sm font-bold text-indigo-600">{transferMode === 'Cash' ? 'UPI' : 'Cash'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Budget Change History */}
          <Card className="shadow-sm h-fit">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Budget Change History</h3>
          </div>
          <CardContent className="p-0">
            {monthlyBudget?.history && monthlyBudget.history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {monthlyBudget.history.slice().reverse().map((entry: any, idx: number) => (
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
                    {entry.reason && (
                      <p className="text-xs text-slate-500 mb-1">{entry.reason}</p>
                    )}
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