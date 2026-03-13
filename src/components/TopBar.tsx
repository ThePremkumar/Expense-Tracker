
import { CalendarIcon, BellIcon, SearchIcon, MenuIcon, WalletIcon } from 'lucide-react';
import { getMonthName } from '../utils/helpers';

interface TopBarProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  onMenuClick?: () => void;
}

export function TopBar({ currentMonth, onMonthChange, availableMonths, onMenuClick }: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2 md:hidden text-indigo-600">
           <WalletIcon className="w-5 h-5" />
           <span className="font-bold text-lg text-slate-900">Tracker</span>
        </div>

        <div className="relative max-w-xs w-full hidden sm:block">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            className="w-full bg-slate-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 bg-slate-50 px-2 md:px-3 py-1.5 rounded-lg border border-slate-200">
          <CalendarIcon className="w-4 h-4 text-slate-500 hidden xs:block" />
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent border-none text-xs md:text-sm font-semibold text-slate-800 focus:ring-0 p-0 cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>
        </div>
        
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}

