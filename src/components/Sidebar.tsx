import { 
  LayoutDashboardIcon,
  ReceiptIcon,
  SettingsIcon,
  LightbulbIcon,
  LogOutIcon,
  WalletIcon,
  XIcon,
  UsersIcon,
  ChevronRightIcon,
  RepeatIcon,
  BarChart3Icon,
  CalendarIcon,
  ShieldCheckIcon
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
    { id: 'fixed-expenses', label: 'Fixed Expenses', icon: RepeatIcon },
    { id: 'family', label: 'Family Wallet', icon: UsersIcon },
    { id: 'reports', label: 'Reports', icon: BarChart3Icon },
    { id: 'budget-audit', label: 'Budget Audit', icon: ShieldCheckIcon },
    { id: 'yearly-summary', label: 'Year Summary', icon: CalendarIcon },
    { id: 'insights', label: 'Insights', icon: LightbulbIcon },
    { id: 'settings', label: 'Budget Settings', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out securely');
      navigate('/login');
    } catch (err) {
      toast.error('Sign out failed');
    }
  };

  const handleTabClick = (id: string) => {
    onTabChange(id);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800/50 shadow-2xl">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 group transition-all duration-300 transform">
          <div className="premium-gradient p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <WalletIcon className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl text-white tracking-tighter">Tracker</span>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden p-2 -mr-2 text-slate-500 hover:text-white transition-colors"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                ? 'bg-white/10 text-white font-bold shadow-sm' 
                : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </div>
              {isActive && (
                <ChevronRightIcon className="w-4 h-4 text-indigo-400 animate-in slide-in-from-left-2 duration-300" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 group hover:bg-white/[0.08] transition-all duration-300">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center text-sm font-black text-white shadow-lg overflow-hidden border-2 border-white/10">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate tracking-tight">{currentUser?.displayName || 'Finance Pro'}</p>
              <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-widest mt-0.5">Premium Plan</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 text-xs font-black uppercase tracking-widest"
          >
            <LogOutIcon className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-500"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 z-50 md:hidden transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
        isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
