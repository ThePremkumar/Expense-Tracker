import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MonthlyBudget } from '../types';
import { formatCurrency, formatDate, getMonthName } from '../utils/helpers';
import { SettingsIcon, HistoryIcon, AlertTriangleIcon } from 'lucide-react';
interface BudgetSettingsProps {
  currentMonth: string;
  currentBudget: number;
  totalSpent: number;
  budgetData?: MonthlyBudget;
  onUpdateBudget: (month: string, amount: number, reason?: string) => void;
}
export function BudgetSettings({
  currentMonth,
  currentBudget,
  totalSpent,
  budgetData,
  onUpdateBudget
}: BudgetSettingsProps) {
  const [newBudget, setNewBudget] = useState(
    currentBudget ? currentBudget.toString() : ''
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newBudget);
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (amount < totalSpent) {
      if (
      !window.confirm(
        `Warning: The new budget (${formatCurrency(amount)}) is less than what you've already spent (${formatCurrency(totalSpent)}). Are you sure?`
      ))
      {
        return;
      }
    }
    onUpdateBudget(currentMonth, amount, reason.trim() || undefined);
    setReason('');
    setError('');
    // Show success state briefly or just let UI update
  };
  const remaining = currentBudget - totalSpent;
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budget Settings</h1>
        <p className="text-slate-500">
          Manage your budget for {getMonthName(currentMonth)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2 text-slate-500" />
              Set Monthly Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg mb-6 flex justify-between items-center border border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Current Budget</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(currentBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Remaining</p>
                <p
                  className={`text-xl font-bold ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>

                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label="New Budget Amount (₹)"
                type="number"
                step="100"
                min="0"
                placeholder="e.g., 10000"
                value={newBudget}
                onChange={(e) => {
                  setNewBudget(e.target.value);
                  setError('');
                }}
                error={error} />


              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Reason for change (Optional)
                </label>
                <input
                  type="text"
                  className="block w-full rounded-lg border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Received extra allowance"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)} />

              </div>

              {Number(newBudget) > 0 && Number(newBudget) < totalSpent &&
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg flex items-start space-x-2 text-sm border border-amber-200">
                  <AlertTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Warning: This budget is lower than your current expenses.
                    Your remaining balance will be negative.
                  </p>
                </div>
              }

              <Button type="submit" className="w-full">
                {currentBudget === 0 ? 'Set Initial Budget' : 'Update Budget'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HistoryIcon className="w-5 h-5 mr-2 text-slate-500" />
              Adjustment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {budgetData?.history && budgetData.history.length > 0 ?
            <div className="divide-y divide-slate-100">
                {/* Sort history descending by date */}
                {[...budgetData.history].reverse().map((entry, idx) => {
                const isIncrease = entry.newBudget > entry.previousBudget;
                const diff = Math.abs(entry.newBudget - entry.previousBudget);
                return (
                  <div
                    key={idx}
                    className="p-4 hover:bg-slate-50 transition-colors">

                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm text-slate-500">
                          {formatDate(entry.date)}
                        </span>
                        <span
                        className={`text-sm font-medium ${isIncrease ? 'text-emerald-600' : 'text-rose-600'}`}>

                          {isIncrease ? '+' : '-'}
                          {formatCurrency(diff)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-slate-900 font-medium">
                          <span className="text-slate-400 line-through text-sm">
                            {formatCurrency(entry.previousBudget)}
                          </span>
                          <span>→</span>
                          <span>{formatCurrency(entry.newBudget)}</span>
                        </div>
                      </div>
                      {entry.reason &&
                    <p className="text-sm text-slate-600 mt-2 bg-slate-100 p-2 rounded-md inline-block">
                          "{entry.reason}"
                        </p>
                    }
                    </div>);

              })}
              </div> :

            <div className="p-8 text-center text-slate-500">
                <p>No budget adjustments recorded for this month.</p>
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>);

}