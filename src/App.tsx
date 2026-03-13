import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { FixedExpenses } from './pages/FixedExpenses';
import { YearlySummary } from './pages/YearlySummary';
import { Insights } from './pages/Insights';
import { BudgetSettings } from './pages/BudgetSettings';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Modal } from './components/ui/Modal';
import { AddExpenseForm } from './components/AddExpenseForm';
import { Transaction } from './types';

function AppContent() {
  const {
    state,
    currentMonth,
    setCurrentMonth,
    currentMonthTransactions,
    totalSpent,
    currentBudget,
    remainingBalance,
    availableMonths,
    categories,
    addTransaction,
    bulkAddTransactions,
    editTransaction,
    deleteTransaction,
    isLoaded,
    totalFixedExpenses,
    addRecurringExpense,
    editRecurringExpense,
    toggleRecurringExpense,
    deleteRecurringExpense,
    updateBudget,
    addCustomCategory,
    deleteCustomCategory
  } = useExpenseTracker();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'reports' | 'fixed' | 'yearly' | 'insights' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setIsAddModalOpen(true);
  };

  const handleSaveExpense = async (data: any) => {
    if (editingTransaction) {
      await editTransaction(editingTransaction.id, data);
    } else {
      await addTransaction(data);
    }
    setIsAddModalOpen(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar 
          currentMonth={currentMonth} 
          onMonthChange={setCurrentMonth}
          availableMonths={availableMonths}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <Dashboard
              totalBudget={currentBudget}
              totalSpent={totalSpent}
              remainingBalance={remainingBalance}
              recentTransactions={currentMonthTransactions}
              onAddExpense={handleOpenAddModal}
              onViewAll={() => setCurrentTab('transactions')}
              onViewInsights={() => setCurrentTab('insights')}
              onEdit={handleOpenEditModal}

              onDelete={deleteTransaction}
              allTransactions={state.transactions}
              allBudgets={state.budgets}
              currentMonth={currentMonth}
            />
          )}

          {currentTab === 'transactions' && (
            <Transactions
              transactions={currentMonthTransactions}
              categories={categories}
              onAdd={handleOpenAddModal}
              onEdit={handleOpenEditModal}
              onDelete={deleteTransaction}
              onImport={bulkAddTransactions}
            />
          )}

          {currentTab === 'reports' && (
            <Reports 
              transactions={currentMonthTransactions}
              totalBudget={currentBudget}
            />
          )}

          {currentTab === 'fixed' && (
            <FixedExpenses
              recurringExpenses={state.recurringExpenses}
              categories={categories}
              totalFixedExpenses={totalFixedExpenses}
              onAdd={addRecurringExpense}
              onEdit={editRecurringExpense}
              onDelete={deleteRecurringExpense}
              onToggle={toggleRecurringExpense}
            />
          )}

          {currentTab === 'yearly' && (
            <YearlySummary 
              transactions={state.transactions}
              currentMonth={currentMonth}
            />
          )}

          {currentTab === 'insights' && (
            <Insights 
              transactions={state.transactions}
              currentMonth={currentMonth}
              totalBudget={currentBudget}
            />
          )}

          {currentTab === 'settings' && (
            <BudgetSettings 
              currentMonth={currentMonth}
              monthlyBudget={state.budgets[currentMonth] || null}
              customCategories={state.customCategories}
              onUpdateBudget={updateBudget}
              onAddCategory={addCustomCategory}
              onDeleteCategory={deleteCustomCategory}
            />
          )}
        </main>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingTransaction ? 'Edit Expense' : 'Add Expense'}
      >
        <AddExpenseForm
          categories={categories}
          onSave={handleSaveExpense}
          onCancel={() => setIsAddModalOpen(false)}
          initialData={editingTransaction || undefined}
        />
      </Modal>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}