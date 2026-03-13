import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
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
  UploadIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon } from
'lucide-react';
import { formatCurrency, formatDate, getCategoryColor, exportToCSV, parseCSV } from '../utils/helpers';
import { CSVImportModal } from '../components/CSVImportModal';
import { Transaction, Category } from '../types';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onImport: (ts: Omit<Transaction, 'id' | 'createdAt' | 'userId'>[]) => void;
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
  const [importPreviewData, setImportPreviewData] = useState<Omit<Transaction, 'id' | 'createdAt' | 'userId'>[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
          setImportPreviewData(parsed);
          setIsImportModalOpen(true);
        } else {
          alert('No valid transactions found in the CSV.');
        }
      } catch (err: any) {
        alert(`Error parsing CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async (data: Omit<Transaction, 'id' | 'createdAt' | 'userId'>[]) => {
    try {
      await onImport(data);
      toast.success(`Successfully imported ${data.length} transactions!`);
      clearAllFilters();
      setIsImportModalOpen(false);
      setImportPreviewData([]);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    }
  };

  const isDateInRange = (date: string) => {
    const transactionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateRangeFilter) {
      case 'all': return true;
      case 'today': return transactionDate.toDateString() === today.toDateString();
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return transactionDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return transactionDate >= monthAgo;
      }
      case 'custom': {
        if (!customStartDate || !customEndDate) return true;
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return transactionDate >= start && transactionDate <= end;
      }
      default: return true;
    }
  };

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
      const matchesDateRange = isDateInRange(t.date);
      const matchesAmountRange = 
        (!minAmount || t.amount >= parseFloat(minAmount)) &&
        (!maxAmount || t.amount <= parseFloat(maxAmount));
      
      return matchesSearch && matchesCategory && matchesDateRange && matchesAmountRange;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'amount': comparison = a.amount - b.amount; break;
        case 'title': comparison = a.title.localeCompare(b.title); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, categoryFilter, dateRangeFilter, customStartDate, customEndDate, minAmount, maxAmount, sortBy, sortOrder]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setDateRangeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || categoryFilter || dateRangeFilter !== 'all' || 
    customStartDate || customEndDate || minAmount || maxAmount || 
    (sortBy !== 'date') || (sortOrder !== 'desc');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm md:text-base">Manage your income and expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" id="csv-import" accept=".csv" className="hidden" onChange={handleImport} />
          <Button 
            variant="secondary" 
            className="shadow-sm flex-1 sm:flex-none"
            onClick={() => document.getElementById('csv-import')?.click()}
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Import CSV</span>
            <span className="xs:hidden">Import</span>
          </Button>
          <Button variant="secondary" onClick={handleExport} className="shadow-sm flex-1 sm:flex-none">
            <DownloadIcon className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Export CSV</span>
            <span className="xs:hidden">Export</span>
          </Button>
          <Button onClick={onAdd} className="shadow-sm w-full sm:w-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <CSVImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        data={importPreviewData}
        onConfirm={confirmImport}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<SearchIcon className="w-4 h-4" />}
                className="w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-64">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c, label: c }))
                  ]}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <FilterIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Advanced Filters</span>
                <span className="sm:hidden">Filters</span>
                {showAdvancedFilters ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="border-t border-slate-200 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                  <Select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value as any)}
                    options={[
                      { value: 'all', label: 'All Time' },
                      { value: 'today', label: 'Today' },
                      { value: 'week', label: 'Last 7 Days' },
                      { value: 'month', label: 'Last 30 Days' },
                      { value: 'custom', label: 'Custom Range' }
                    ]}
                  />
                </div>
                {dateRangeFilter === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                      <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                      <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Min Amount (₹)</label>
                  <Input type="number" placeholder="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Max Amount (₹)</label>
                  <Input type="number" placeholder="No limit" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    options={[
                      { value: 'date', label: 'Date' },
                      { value: 'amount', label: 'Amount' },
                      { value: 'title', label: 'Title' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sort Order</label>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    options={[
                      { value: 'desc', label: 'Descending' },
                      { value: 'asc', label: 'Ascending' }
                    ]}
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={clearAllFilters} className="text-slate-600 hover:text-slate-900 border border-slate-200">
                    <XIcon className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {/* Mobile View (Cards) */}
          <div className="block md:hidden">
            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ backgroundColor: getCategoryColor(t.category) }}
                        >
                          {t.category.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{t.title}</p>
                          <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">-{formatCurrency(t.amount)}</p>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: `${getCategoryColor(t.category)}15`,
                            color: getCategoryColor(t.category)
                          }}
                        >
                          {t.category}
                        </span>
                      </div>
                    </div>
                    {t.notes && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{t.notes}"</p>}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                      <button onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200">
                        <Edit2Icon className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => { if (window.confirm('Are you sure?')) onDelete(t.id); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200">
                        <Trash2Icon className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                  <th className="p-4">Date</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 whitespace-nowrap text-sm text-slate-600">{formatDate(t.date)}</td>
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{t.title}</p>
                      {t.notes && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{t.notes}</p>}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${getCategoryColor(t.category)}15`, color: getCategoryColor(t.category) }}>
                        {t.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-900">{formatCurrency(t.amount)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2Icon className="w-4 h-4" /></button>
                        <button onClick={() => { if (window.confirm('Are you sure?')) onDelete(t.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2Icon className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 md:p-8">
            {filteredTransactions.length > 0 ? (
              <div className="text-center text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <FilterIcon className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-medium text-slate-700">No transactions found</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={hasActiveFilters ? clearAllFilters : onAdd}>
                  {hasActiveFilters ? 'Clear All Filters' : 'Add Your First Expense'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}