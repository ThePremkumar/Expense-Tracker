export type Category =
  'Room Rent' |
  'Food' |
  'Dress' |
  'Travel' |
  'Essentials' |
  'Miscellaneous' |
  string;

export type PaymentMode = 'Cash' | 'UPI';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: Category;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  notes?: string;
  upiId?: string; // UPI ID or description for UPI payments
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  userId: string;
  isRecurring?: boolean;
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
  upiBudget?: number; // Separate UPI budget allocation
  history: BudgetAdjustment[];
  carryForward?: number; // Amount carried forward from previous month
  carryForwardToSavings?: number; // Amount moved to savings instead
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

export interface FamilyMember {
  id: string;
  name: string;
  balance: number;
  transactions: FamilyTransaction[];
  createdAt: number;
}

export interface FamilyTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  date: string;
  relatedMemberId?: string; // For transfers between family members
  relatedMemberName?: string;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Record<string, MonthlyBudget>; // Keyed by YYYY-MM
  customCategories: string[];
  recurringExpenses: RecurringExpense[];
  appliedRecurringMonths: string[]; // YYYY-MM keys where recurring expenses have been applied
  familyMembers: FamilyMember[];
  savings: number;
}

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  icon: string;
  message: string;
  detail?: string;
}