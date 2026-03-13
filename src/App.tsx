import React, { useState, Component } from 'react';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { BudgetSettings } from './pages/BudgetSettings';
import { YearlySummary } from './pages/YearlySummary';
import { InsightsPage } from './pages/InsightsPage';
import { FixedExpenses } from './pages/FixedExpenses';
import { Modal } from './components/ui/Modal';
import { TransactionForm } from './components/TransactionForm';
import { getMonthName } from './utils/helpers';
import { Transaction } from './types';
export function App() {
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
    updateBudget,
    isLoaded,
    availableYears,
    getYearlyTransactions,
    getYearlyBudgetTotal,
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    totalFixedExpenses
  } = useExpenseTracker();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    Transaction | undefined>(
  );
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>);

  }
  const handleOpenAddModal = () => {
    setEditingTransaction(undefined);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };
  const handleFormSubmit = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      editTransaction(editingTransaction.id, data);
    } else {
      addTransaction(data);
    }
    handleCloseModal();
  };
  // Month Selector Component for the Header
  const MonthSelector = () =>
  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
      <span className="text-sm text-slate-500 font-medium hidden sm:inline">
        Period:
      </span>
      <select
      value={currentMonth}
      onChange={(e) => setCurrentMonth(e.target.value)}
      className="bg-transparent border-none text-sm font-semibold text-slate-800 focus:ring-0 p-0 cursor-pointer">

        {availableMonths.map((m) =>
      <option key={m} value={m}>
            {getMonthName(m)}
          </option>
      )}
      </select>
    </div>;

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {/* Top Bar with Month Selector */}
      <div className="flex justify-end mb-6">
        <MonthSelector />
      </div>

      {/* Main Content Area */}
      <div className="pb-20 md:pb-0">
        {currentTab === 'dashboard' &&
        <Dashboard
          totalBudget={currentBudget}
          totalSpent={totalSpent}
          remainingBalance={remainingBalance}
          recentTransactions={currentMonthTransactions}
          onAddExpense={handleOpenAddModal}
          onViewAll={() => setCurrentTab('transactions')}
          onEdit={handleOpenEditModal}
          onDelete={deleteTransaction}
          allTransactions={state.transactions}
          allBudgets={state.budgets}
          currentMonth={currentMonth} />

        }

        {currentTab === 'transactions' &&
        <Transactions
          transactions={currentMonthTransactions}
          categories={categories}
          onAdd={handleOpenAddModal}
          onEdit={handleOpenEditModal}
          onDelete={deleteTransaction}
          onImport={bulkAddTransactions} />

        }

        {currentTab === 'reports' &&
        <Reports
          transactions={currentMonthTransactions}
          totalBudget={currentBudget} />

        }

        {currentTab === 'fixed' &&
        <FixedExpenses
          recurringExpenses={state.recurringExpenses}
          categories={categories}
          totalFixedExpenses={totalFixedExpenses}
          onAdd={addRecurringExpense}
          onEdit={editRecurringExpense}
          onDelete={deleteRecurringExpense}
          onToggle={toggleRecurringExpense} />

        }

        {currentTab === 'yearly' &&
        <YearlySummary
          availableYears={availableYears}
          getYearlyTransactions={getYearlyTransactions}
          getYearlyBudgetTotal={getYearlyBudgetTotal}
          allBudgets={state.budgets} />

        }

        {currentTab === 'insights' &&
        <InsightsPage
          allTransactions={state.transactions}
          allBudgets={state.budgets}
          currentMonth={currentMonth} />

        }

        {currentTab === 'budget' &&
        <BudgetSettings
          currentMonth={currentMonth}
          currentBudget={currentBudget}
          totalSpent={totalSpent}
          budgetData={state.budgets[currentMonth]}
          onUpdateBudget={updateBudget} />

        }
      </div>

      {/* Add/Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Edit Expense' : 'Add New Expense'}>

        <TransactionForm
          initialData={editingTransaction}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal} />

      </Modal>
    </Layout>);

}