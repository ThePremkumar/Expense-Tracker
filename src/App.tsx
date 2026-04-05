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
import { Insights } from './pages/Insights';
import { BudgetSettings } from './pages/BudgetSettings';
import { FamilyWallet } from './pages/FamilyWallet';
import { FixedExpenses } from './pages/FixedExpenses';
import { Reports } from './pages/Reports';
import { YearlySummary } from './pages/YearlySummary';
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
    todaySpent,
    availableMonths,
    categories,
    addTransaction,
    bulkAddTransactions,
    editTransaction,
    deleteTransaction,
    isLoaded,
    updateBudget,
    carryForwardBudget,
    previousMonthRemaining,
    updateSavings,
    addCustomCategory,
    deleteCustomCategory,
    // Family wallet
    addFamilyMember,
    removeFamilyMember,
    modifyFamilyMemberAmount,
    transferMainToFamily,
    transferBetweenFamily,
    transferFamilyToMain,
    hasLocalData,
    syncLocalData,
    // Recurring
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    totalFixedExpenses
  } = useExpenseTracker();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'insights' | 'settings' | 'family' | 'fixed-expenses' | 'reports' | 'yearly-summary'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar 
          currentMonth={currentMonth} 
          onMonthChange={setCurrentMonth}
          availableMonths={availableMonths}
          onMenuClick={() => setIsSidebarOpen(true)}
        hasLocalData={hasLocalData}
        onSync={syncLocalData}
      />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">

          {currentTab === 'dashboard' && (
            <Dashboard 
              totalBudget={currentBudget}
              totalSpent={totalSpent}
              remainingBalance={remainingBalance}
              todaySpent={todaySpent}
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
              transactions={state.transactions}
              categories={categories}
              onAdd={() => setIsAddModalOpen(true)}
              onEdit={(t) => {
                setEditingTransaction(t);
                setIsAddModalOpen(true);
              }}
              onDelete={deleteTransaction}
              onImport={bulkAddTransactions}
            />
          )}



          {currentTab === 'family' && (
            <FamilyWallet
              familyMembers={state.familyMembers}
              currentBudget={currentBudget}
              onAddMember={addFamilyMember}
              onRemoveMember={removeFamilyMember}
              onModifyAmount={modifyFamilyMemberAmount}
              onTransferBetweenFamily={transferBetweenFamily}
              onTransferFamilyToMain={transferFamilyToMain}
              onTransferMainToFamily={transferMainToFamily}
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
              categories={categories}
              onUpdateBudget={updateBudget}
              onAddCategory={addCustomCategory}
              onDeleteCategory={deleteCustomCategory}
              previousMonthRemaining={previousMonthRemaining}
              onCarryForward={carryForwardBudget}
              savings={state.savings}
              onUpdateSavings={updateSavings}
            />
          )}

          {currentTab === 'fixed-expenses' && (
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

          {currentTab === 'reports' && (
            <Reports
              transactions={currentMonthTransactions}
              totalBudget={currentBudget}
              savings={state.savings}
              monthlyBudget={state.budgets[currentMonth]}
              currentMonth={currentMonth}
              allTransactions={state.transactions}
            />
          )}

          {currentTab === 'yearly-summary' && (
            <YearlySummary
              transactions={state.transactions}
              currentMonth={currentMonth}
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