
import { 
  LayoutDashboardIcon, 
  ReceiptIcon, 
  RepeatIcon, 
  PieChartIcon, 
  SettingsIcon,
  BarChart3Icon,
  LightbulbIcon,
  LogOutIcon,
  WalletIcon,
  XIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'transactions', label: 'Transactions', icon: ReceiptIcon },
    { id: 'fixed', label: 'Fixed Expenses', icon: RepeatIcon },
    { id: 'reports', label: 'Monthly Reports', icon: PieChartIcon },
    { id: 'yearly', label: 'Yearly Summary', icon: BarChart3Icon },
    { id: 'insights', label: 'Insights', icon: LightbulbIcon },
    { id: 'settings', label: 'Budget Settings', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  const handleTabClick = (id: string) => {
    onTabChange(id);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-6 flex items-center justify-between text-indigo-600">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <WalletIcon className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-900">Tracker</span>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName || ''} />
            ) : (
              currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{currentUser?.displayName || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOutIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}

