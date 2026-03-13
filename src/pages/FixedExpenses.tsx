import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { RecurringExpense, Category } from '../types';
import { formatCurrency } from '../utils/helpers';
import {
  RepeatIcon,
  PlusIcon,
  Edit2Icon,
  Trash2Icon,
  ToggleLeftIcon,
  ToggleRightIcon,
  ZapIcon,
  InfoIcon } from
'lucide-react';
interface FixedExpensesProps {
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  totalFixedExpenses: number;
  onAdd: (
  expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>)
  => void;
  onEdit: (id: string, updates: Partial<RecurringExpense>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}
export function FixedExpenses({
  recurringExpenses,
  categories,
  totalFixedExpenses,
  onAdd,
  onEdit,
  onDelete,
  onToggle
}: FixedExpensesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(
    null
  );
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const activeExpenses = recurringExpenses.filter((r) => r.isActive);
  const inactiveExpenses = recurringExpenses.filter((r) => !r.isActive);
  const openAddModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setCategory('');
    setNotes('');
    setErrors({});
    setIsModalOpen(true);
  };
  const openEditModal = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setNotes(expense.notes || '');
    setErrors({});
    setIsModalOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    newErrors.amount = 'Valid amount is required';
    if (!category) newErrors.category = 'Category is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (editingExpense) {
      onEdit(editingExpense.id, {
        title: title.trim(),
        amount: Number(amount),
        category,
        notes: notes.trim() || undefined
      });
    } else {
      onAdd({
        title: title.trim(),
        amount: Number(amount),
        category,
        notes: notes.trim() || undefined
      });
    }
    setIsModalOpen(false);
  };
  const ExpenseRow = ({ expense }: {expense: RecurringExpense;}) =>
  <div
    className={`p-4 flex items-center justify-between group transition-colors ${expense.isActive ? 'hover:bg-slate-50' : 'opacity-60 bg-slate-50/50'}`}>

      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <button
        onClick={() => onToggle(expense.id)}
        className="flex-shrink-0 transition-colors"
        title={expense.isActive ? 'Deactivate' : 'Activate'}>

          {expense.isActive ?
        <ToggleRightIcon className="w-7 h-7 text-indigo-600" /> :

        <ToggleLeftIcon className="w-7 h-7 text-slate-400" />
        }
        </button>
        <div className="min-w-0">
          <p
          className={`font-medium truncate ${expense.isActive ? 'text-slate-900' : 'text-slate-500 line-through'}`}>

            {expense.title}
          </p>
          <div className="flex items-center text-xs text-slate-500 space-x-2">
            <span>{expense.category}</span>
            {expense.notes &&
          <>
                <span>•</span>
                <span className="truncate max-w-[150px]">{expense.notes}</span>
              </>
          }
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span
        className={`font-semibold whitespace-nowrap ${expense.isActive ? 'text-slate-900' : 'text-slate-400'}`}>

          {formatCurrency(expense.amount)}
        </span>
        <div className="flex items-center space-x-1 transition-opacity">
          <button
          onClick={() => openEditModal(expense)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="Edit">

            <Edit2Icon className="w-4 h-4" />
          </button>
          <button
          onClick={() => {
            if (
            window.confirm(`Remove "${expense.title}" from fixed expenses?`))
            {
              onDelete(expense.id);
            }
          }}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          title="Delete">

            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fixed Expenses</h1>
          <p className="text-slate-500">
            Manage recurring monthly expenses that auto-add each month
          </p>
        </div>
        <Button onClick={openAddModal} className="shadow-sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Fixed Expense
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start space-x-3">
        <InfoIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-indigo-900">How it works</h4>
          <p className="text-sm text-indigo-700 mt-0.5">
            Fixed expenses are automatically added as transactions on the 1st of
            each month. Once added, they become regular transactions that you
            can edit or delete individually.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none">
          <CardContent className="p-5">
            <p className="text-indigo-100 text-sm font-medium">
              Monthly Fixed Total
            </p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(totalFixedExpenses)}
            </p>
            <p className="text-indigo-200 text-xs mt-1">
              {activeExpenses.length} active item
              {activeExpenses.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {activeExpenses.length}
                </p>
              </div>
              <ZapIcon className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Paused</p>
                <p className="text-2xl font-bold text-slate-400 mt-1">
                  {inactiveExpenses.length}
                </p>
              </div>
              <ToggleLeftIcon className="w-8 h-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RepeatIcon className="w-5 h-5 mr-2 text-indigo-500" />
            Fixed Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recurringExpenses.length > 0 ?
          <div className="divide-y divide-slate-100">
              {activeExpenses.map((expense) =>
            <ExpenseRow key={expense.id} expense={expense} />
            )}
              {inactiveExpenses.length > 0 && activeExpenses.length > 0 &&
            <div className="px-4 py-2 bg-slate-50 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Paused
                </div>
            }
              {inactiveExpenses.map((expense) =>
            <ExpenseRow key={expense.id} expense={expense} />
            )}
            </div> :

          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <RepeatIcon className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium">No fixed expenses yet</p>
              <p className="text-sm mt-1">
                Add recurring expenses like rent, WiFi, or subscriptions
              </p>
              <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={openAddModal}>

                Add your first fixed expense
              </Button>
            </div>
          }
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Fixed Expense' : 'Add Fixed Expense'}>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Expense Title"
            placeholder="e.g., PG Room Rent, WiFi Bill"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            autoFocus />


          <Input
            label="Monthly Amount (₹)"
            type="number"
            step="1"
            min="0"
            placeholder="e.g., 6000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount} />


          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            error={errors.category}
            options={categories.map((c) => ({
              value: c,
              label: c
            }))} />


          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Notes (Optional)
            </label>
            <textarea
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={2}
              placeholder="e.g., Due on 5th of every month"
              value={notes}
              onChange={(e) => setNotes(e.target.value)} />

          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}>

              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingExpense ? 'Save Changes' : 'Add Fixed Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);

}