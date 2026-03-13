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

export const parseCSV = (csvText: string): Omit<Transaction, 'id' | 'createdAt'>[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Find indices of important columns
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('description') || h.includes('details'));
  const categoryIdx = headers.findIndex(h => h.includes('category'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('value'));
  const notesIdx = headers.findIndex(h => h.includes('notes') || h.includes('comment'));

  if (dateIdx === -1 || amountIdx === -1 || titleIdx === -1) {
    throw new Error('CSV must contain at least Date, Title/Description, and Amount columns.');
  }

  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple split by comma, respecting quotes
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    
    if (values.length < 3) continue;

    const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

    const dateStr = clean(values[dateIdx]);
    const title = clean(values[titleIdx]);
    const category = categoryIdx !== -1 ? clean(values[categoryIdx]) : 'Miscellaneous';
    const amount = parseFloat(clean(values[amountIdx]).replace(/[^\d.-]/g, ''));
    const notes = notesIdx !== -1 ? clean(values[notesIdx]) : '';

    if (dateStr && title && !isNaN(amount)) {
      // Basic date validation/conversion if needed
      // Assuming YYYY-MM-DD or similar that Date can parse
      const dateObj = new Date(dateStr);
      const formattedDate = !isNaN(dateObj.getTime()) 
        ? dateObj.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      transactions.push({
        date: formattedDate,
        title,
        category: category as any,
        amount,
        notes: notes || undefined
      });
    }
  }

  return transactions;
};