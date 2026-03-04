import React, { useState } from 'react';
import {
  LayoutDashboardIcon,
  ReceiptIcon,
  PieChartIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  WalletIcon,
  CalendarIcon,
  LightbulbIcon,
  RepeatIcon } from
'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}
export function Layout({ children, currentTab, onTabChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: ReceiptIcon
  },
  {
    id: 'fixed',
    label: 'Fixed Expenses',
    icon: RepeatIcon
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: PieChartIcon
  },
  {
    id: 'yearly',
    label: 'Yearly Summary',
    icon: CalendarIcon
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: LightbulbIcon
  },
  {
    id: 'budget',
    label: 'Budget Settings',
    icon: SettingsIcon
  }];

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setIsMobileMenuOpen(false);
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-600 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center space-x-2 font-bold text-xl">
          <WalletIcon className="w-6 h-6" />
          <span>Tipons Tracker</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-indigo-700 rounded-lg transition-colors">

          {isMobileMenuOpen ?
          <XIcon className="w-6 h-6" /> :

          <MenuIcon className="w-6 h-6" />
          }
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`
        fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        <div className="p-6 hidden md:flex items-center space-x-3 text-indigo-600">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <WalletIcon className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-900">Tipons</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}>

                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />

                <span>{item.label}</span>
              </button>);

          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500 text-center">
            <p>Student Expense Tracker</p>
            <p className="mt-1 text-xs">Local Storage Mode</p>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen &&
      <div
        className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
        onClick={() => setIsMobileMenuOpen(false)} />

      }

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>
    </div>);

}