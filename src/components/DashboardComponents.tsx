import { Card, CardContent } from './ui/Card';
import { LucideIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from 'lucide-react';

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
  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUpIcon;
    if (trend === 'down') return TrendingDownIcon;
    return MinusIcon;
  };
  
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-500';
    if (trend === 'down') return 'text-rose-500';
    return 'text-slate-400';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="glass-card glow-on-hover entry-animation group">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight group-hover:text-primary transition-colors">
              {value}
            </h3>
            {subValue && (
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon className={`w-3 h-3 ${getTrendColor()}`} />
                <span className={`text-[10px] font-bold ${getTrendColor()}`}>{subValue}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
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
    <Card className="glass-card overflow-hidden entry-animation stat-card-glow group">
      <div className={`p-6 flex flex-col justify-between h-full bg-slate-50 transition-colors duration-500`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${primaryColor} shadow-lg shadow-black/10`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{title}</span>
          </div>
          {budget > 0 && (
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold shadow-sm ${
              isOver ? 'bg-rose-500 text-white' : isNear ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {spentPercent.toFixed(0)}%
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800">{unit}{budget.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-slate-400">Monthly Cap</span>
          </div>
          
          <div className="space-y-2">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : primaryColor
                }`}
                style={{ width: `${Math.min(spentPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-black tracking-tight">
              <span className="text-slate-500">USED: {unit}{spent.toLocaleString()}</span>
              <span className={remaining < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                {remaining < 0 ? 'OVER: ' : 'FREE: '}{unit}{Math.abs(remaining).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
