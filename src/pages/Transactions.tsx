import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  PlusIcon,
  SearchIcon,
  Edit2Icon,
  Trash2Icon,
  FilterIcon,
  DownloadIcon,
  UploadIcon } from
'lucide-react';
import { formatCurrency, formatDate, getCategoryColor, exportToCSV, parseCSV } from '../utils/helpers';
import { Transaction, Category } from '../types';
interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onImport: (ts: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
}
export function Transactions({
  transactions,
  categories,
  onAdd,
  onEdit,
  onDelete,
  onImport
}: TransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handleExport = () => {
    const filename = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredTransactions, filename);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          if (window.confirm(`Found ${parsed.length} transactions. Import them?`)) {
            onImport(parsed);
          }
        } else {
          alert('No valid transactions found in the CSV.');
        }
      } catch (err: any) {
        alert(`Error parsing CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ?
    t.category === categoryFilter :
    true;
    return matchesSearch && matchesCategory;
  });
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500">Manage your income and expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="csv-import"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button 
            variant="secondary" 
            className="shadow-sm"
            onClick={() => document.getElementById('csv-import')?.click()}
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="secondary" onClick={handleExport} className="shadow-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onAdd} className="shadow-sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>



      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <div className="w-full sm:w-64">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
              {
                value: '',
                label: 'All Categories'
              },
              ...categories.map((c) => ({
                value: c,
                label: c
              }))]
              } />

          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                  <th className="p-4 whitespace-nowrap">Date</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length > 0 ?
                filteredTransactions.map((t) =>
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/80 transition-colors group">

                      <td className="p-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(t.date)}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{t.title}</p>
                        {t.notes &&
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                            {t.notes}
                          </p>
                    }
                      </td>
                      <td className="p-4">
                        <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(t.category)}15`,
                        color: getCategoryColor(t.category)
                      }}>

                          {t.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-900">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                        onClick={() => onEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Edit">

                            <Edit2Icon className="w-4 h-4" />
                          </button>
                          <button
                        onClick={() => {
                          if (
                          window.confirm(
                            'Are you sure you want to delete this expense?'
                          ))
                          {
                            onDelete(t.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete">

                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ) :

                <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FilterIcon className="w-10 h-10 text-slate-300 mb-3" />
                        <p>No transactions found.</p>
                        {searchTerm || categoryFilter ?
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('');
                        }}>

                            Clear filters
                          </Button> :
                      null}
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>);

}