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
  CheckCircle2Icon
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

  const handleUpdateBudget = () => {
    const amount = parseFloat(newBudget);
    if (!isNaN(amount) && amount >= 0) {
      onUpdateBudget(currentMonth, amount);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

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
                  <span className="text-lg font-bold text-indigo-700">{formatCurrency(monthlyBudget?.totalBudget || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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


        <Card className="shadow-sm h-full">
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.newBudget > entry.previousBudget ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {entry.newBudget > entry.previousBudget ? 'Increased' : 'Decreased'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-slate-400">{formatCurrency(entry.previousBudget)}</span>
                        <span className="text-sm font-bold text-slate-900">→ {formatCurrency(entry.newBudget)}</span>
                      </div>
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