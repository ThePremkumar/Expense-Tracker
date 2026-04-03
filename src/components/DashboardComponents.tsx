import { Card, CardContent } from './ui/Card';
import { LucideIcon } from 'lucide-react';

interface SummaryStatProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
}

export function SummaryStat({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend 
}: SummaryStatProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'bg-emerald-100 text-emerald-600';
    if (trend === 'down') return 'bg-rose-100 text-rose-600';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1 truncate">{label}</p>
            <h3 className={`text-2xl font-bold truncate ${trend === 'down' ? 'text-rose-600' : trend === 'up' ? 'text-emerald-600' : 'text-slate-900'}`}>
              {value}
            </h3>
            {subValue && (
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{subValue}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${getTrendColor()} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BudgetProgressCardProps {
  title: string;
  budget: number;
  spent: number;
  remaining: number;
  primaryColor: string;
  icon: LucideIcon;
  unit?: string;
}

export function BudgetProgressCard({
  title,
  budget,
  spent,
  remaining,
  primaryColor,
  icon: Icon,
  unit = '₹'
}: BudgetProgressCardProps) {
  const spentPercent = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = spent > budget && budget > 0;
  const isNear = spentPercent > 85 && !isOver;

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <div className={`p-5 h-full flex flex-col justify-between ${primaryColor} text-white`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <Icon className="w-4 h-4" /> {title}
          </div>
          {budget > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${
              isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-white/20 text-white'
            }`}>
              {spentPercent.toFixed(0)}%
            </span>
          )}
        </div>
        
        <div>
          <p className="text-2xl font-bold">{budget > 0 ? `${unit}${budget.toLocaleString()}` : 'Not Set'}</p>
          <div className="mt-4 space-y-2">
            <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden backdrop-blur-sm shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isOver ? 'bg-rose-400' : isNear ? 'bg-amber-400' : 'bg-white'
                }`}
                style={{ width: `${Math.min(spentPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-white/80">
              <span>Spent: {unit}{spent.toLocaleString()}</span>
              <span className={remaining < 0 ? 'text-rose-200' : ''}>
                Remaining: {unit}{remaining.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
