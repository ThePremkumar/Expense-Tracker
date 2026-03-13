import { Transaction } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthName = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export const getYearKey = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getFullYear().toString();
};

export const getMonthsInYear = (year: string): string[] => {
  return Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`
  );
};

export const groupTransactionsByMonth = (
transactions: Transaction[])
: {month: string;amount: number;}[] => {
  const grouped = transactions.reduce(
    (acc, curr) => {
      const month = curr.date.substring(0, 7);
      acc[month] = (acc[month] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(grouped).
  map(([month, amount]) => ({ month, amount })).
  sort((a, b) => a.month.localeCompare(b.month));
};

export const formatMonthShort = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
};

export const groupTransactionsByCategory = (transactions: Transaction[]) => {
  const grouped = transactions.reduce(
    (acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(grouped).
  map(([name, value]) => ({ name, value })).
  sort((a, b) => b.value - a.value);
};

export const groupTransactionsByDate = (transactions: Transaction[]) => {
  const grouped = transactions.reduce(
    (acc, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(grouped).
  map(([date, amount]) => ({ date, amount })).
  sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Room Rent': '#6366f1', // Indigo
  Food: '#10b981', // Emerald
  Dress: '#f43f5e', // Rose
  Travel: '#f59e0b', // Amber
  Essentials: '#0ea5e9', // Sky
  Miscellaneous: '#64748b', // Slate
  'Other Necessities': '#8b5cf6' // Violet (legacy)
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#94a3b8'; // Slate as fallback
};

export const exportToCSV = (transactions: Transaction[], filename: string) => {
  const headers = ['Date', 'Title', 'Category', 'Amount', 'Notes'];
  const rows = transactions.map(t => [
    t.date,
    `"${t.title.replace(/"/g, '""')}"`,
    t.category,
    t.amount.toString(),
    t.notes ? `"${t.notes.replace(/"/g, '""')}"` : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};