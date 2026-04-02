import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Transaction, Category, PaymentMode } from '../types';
import { BanknoteIcon, SmartphoneIcon } from 'lucide-react';

interface AddExpenseFormProps {
  initialData?: Transaction;
  categories: Category[];
  onSave: (data: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  onCancel: () => void;
}

export function AddExpenseForm({
  initialData,
  categories,
  onSave,
  onCancel
}: AddExpenseFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState<Category>(initialData?.category || (categories[0] || ''));
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialData?.paymentMode || 'Cash');
  const [upiId, setUpiId] = useState(initialData?.upiId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = 'Valid amount is required';
    if (!category) newErrors.category = 'Category is required';
    if (!date) newErrors.date = 'Date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      paymentMode,
      upiId: paymentMode === 'UPI' ? upiId.trim() : '',
      notes: notes.trim() || ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Expense Title"
        placeholder="e.g., Groceries, Uber ride"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        autoFocus
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />
      </div>

      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        error={errors.category}
        options={categories.map((c) => ({
          value: c,
          label: c
        }))}
      />

      {/* Payment Mode Selector */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Payment Mode
        </label>
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          <button
            type="button"
            onClick={() => setPaymentMode('Cash')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              paymentMode === 'Cash'
                ? 'bg-emerald-600 text-white shadow-inner'
                : 'bg-white text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <BanknoteIcon className="w-4 h-4" />
            Cash
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('UPI')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              paymentMode === 'UPI'
                ? 'bg-violet-600 text-white shadow-inner'
                : 'bg-white text-slate-600 hover:bg-violet-50'
            }`}
          >
            <SmartphoneIcon className="w-4 h-4" />
            UPI
          </button>
        </div>
      </div>

      {/* UPI ID field - only shown when UPI is selected */}
      {paymentMode === 'UPI' && (
        <Input
          label="UPI ID / Description"
          placeholder="e.g., name@upi or Google Pay payment"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Notes (Optional)
        </label>
        <textarea
          className="block w-full rounded-lg border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          rows={3}
          placeholder="Add any extra details here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
