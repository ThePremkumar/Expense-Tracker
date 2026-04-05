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
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || 1);
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
      amount: Number(amount) * quantity, // Save the product of quantity and unit price
      category,
      date,
      paymentMode,
      quantity,
      notes: notes.trim() || ''
    });
  };

  const totalAmount = (Number(amount) || 0) * (quantity || 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Expense Description"
            placeholder="What did you spend on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            autoFocus
            className="h-12"
          />
        </div>

        <Input
          label="Rate per Item (₹)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          className="h-12 text-lg font-black rounded-xl border-slate-200"
        />
        
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Quantity
          </label>
          <div className="flex items-center h-12 w-full">
            <button 
              type="button" 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-full flex items-center justify-center rounded-l-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-black text-xl border-y border-l border-slate-200"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 h-full text-center text-lg font-black bg-white border-y border-slate-200 focus:outline-none focus:ring-0 w-full"
            />
            <button 
              type="button" 
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-full flex items-center justify-center rounded-r-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-black text-xl border-y border-r border-indigo-600 shadow-lg shadow-indigo-600/10"
            >
              +
            </button>
          </div>
        </div>

        <Input
          label="Date of Operation"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          className="h-12 rounded-xl border-slate-200"
        />
        <Select
          label="Transaction Sector"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          error={errors.category}
          options={categories.map((c) => ({
            value: c,
            label: c
          }))}
          className="h-12 rounded-xl border-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Payment Mode Selector */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Payment Channel
          </label>
          <div className="flex p-1 bg-slate-100 rounded-[16px] gap-1 h-12">
            <button
              type="button"
              onClick={() => setPaymentMode('Cash')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                paymentMode === 'Cash'
                  ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BanknoteIcon className="w-4 h-4" />
              CASH
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('UPI')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                paymentMode === 'UPI'
                  ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <SmartphoneIcon className="w-4 h-4" />
              UPI
            </button>
          </div>
        </div>

        {/* Total Preview */}
        {totalAmount > 0 && (
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center transition-all duration-500 shadow-xl shadow-indigo-900/10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total Impact</p>
            <h4 className="text-xl font-black text-white tracking-tighter">
              ₹{totalAmount.toLocaleString()}
            </h4>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          Internal Notes (Optional)
        </label>
        <textarea
          className="block w-full rounded-xl border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 sm:text-sm p-3 transition-all duration-300"
          rows={2}
          placeholder="Add specific context here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t border-slate-100">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          className="w-full sm:w-auto h-12 px-6 font-black uppercase tracking-widest text-slate-400 text-xs"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          className="w-full sm:flex-1 h-12 px-6 font-black uppercase tracking-widest premium-gradient shadow-xl shadow-indigo-500/10 text-xs"
        >
          {initialData ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
