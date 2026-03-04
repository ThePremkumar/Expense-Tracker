export type Category =
'Room Rent' |
'Food' |
'Dress' |
'Travel' |
'Essentials' |
'Miscellaneous' |
string;

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
  isRecurring?: boolean; // Flag for auto-generated recurring transactions
}

export interface BudgetAdjustment {
  date: string;
  previousBudget: number;
  newBudget: number;
  reason?: string;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  totalBudget: number;
  history: BudgetAdjustment[];
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  notes?: string;
  isActive: boolean;
  createdAt: number;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Record<string, MonthlyBudget>; // Keyed by YYYY-MM
  customCategories: string[];
  recurringExpenses: RecurringExpense[];
  appliedRecurringMonths: string[]; // YYYY-MM keys where recurring expenses have been applied
}

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  icon: string;
  message: string;
  detail?: string;
}