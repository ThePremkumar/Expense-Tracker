import { useMemo } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  AlertTriangleIcon, 
  CheckCircle2Icon,
  LightbulbIcon,
  ZapIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon
} from 'lucide-react';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { Transaction } from '../types';

interface InsightsProps {
  transactions: Transaction[];
  currentMonth: string;
  totalBudget: number;
}

export function Insights({ transactions, currentMonth, totalBudget }: InsightsProps) {
  const insights = useMemo(() => {
    const list: any[] = [];
    const thisMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    const thisMonthTotal = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get previous month
    const [year, month] = currentMonth.split('-').map(Number);
    const prevMonthDate = new Date(year, month - 2, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthTransactions = transactions.filter(t => t.date.startsWith(prevMonthKey));
    const prevMonthTotal = prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 1. Budget Status
    if (totalBudget > 0) {
      const budgetUsage = (thisMonthTotal / totalBudget) * 100;
      if (budgetUsage > 90) {
        list.push({
          id: 'budget-warning',
          type: 'danger',
          icon: AlertTriangleIcon,
          title: 'Critical Budget Alert',
          message: `You have used ${Math.round(budgetUsage)}% of your monthly budget. Extreme caution advised!`,
          color: 'text-rose-600',
          bg: 'bg-rose-50'
        });
      } else if (budgetUsage > 75) {
        list.push({
          id: 'budget-info',
          type: 'warning',
          icon: AlertTriangleIcon,
          title: 'Budget Threshold Reached',
          message: `You've utilized ${Math.round(budgetUsage)}% of your budget. Keep a close watch on your spending.`,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        });
      } else {
        list.push({
          id: 'budget-success',
          type: 'success',
          icon: CheckCircle2Icon,
          title: 'Healthy Budgeting',
          message: `You are well within your budget. Keep up the disciplined spending!`,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50'
        });
      }
    }

    // 2. Month-over-Month comparison
    if (prevMonthTotal > 0) {
      const diff = thisMonthTotal - prevMonthTotal;
      const percent = Math.abs((diff / prevMonthTotal) * 100);
      if (diff > 0) {
        list.push({
          id: 'mom-increase',
          type: 'warning',
          icon: TrendingUpIcon,
          title: 'Spending Increased',
          message: `You spent ${formatCurrency(diff)} (${Math.round(percent)}%) more than last month.`,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        });
      } else {
        list.push({
          id: 'mom-decrease',
          type: 'success',
          icon: TrendingDownIcon,
          title: 'Spending Decreased',
          message: `Awesome! You spent ${formatCurrency(Math.abs(diff))} (${Math.round(percent)}%) less than in ${getMonthName(prevMonthKey)}.`,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50'
        });
      }
    }

    // 3. Category deep dive
    const categoryTotals: Record<string, number> = {};
    thisMonthTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (highestCategory) {
      list.push({
        id: 'category-insight',
        type: 'info',
        icon: ZapIcon,
        title: 'Top Category Spend',
        message: `Your highest spend this month is in "${highestCategory[0]}" at ${formatCurrency(highestCategory[1])}, which is ${Math.round((highestCategory[1] / thisMonthTotal) * 100)}% of your total spending.`,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
      });
    }

    return list;
  }, [transactions, currentMonth, totalBudget]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Insights</h1>
          <p className="text-slate-500">Personalized data-driven tips for your finances</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <LightbulbIcon className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Powered by Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.length > 0 ? (
          insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <Card key={insight.id} className="overflow-hidden border-none shadow-md">
                <div className={`${insight.bg} p-1 h-2`}></div>
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`${insight.bg} p-2 rounded-lg ${insight.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900">{insight.title}</h4>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                      {insight.message}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                        Take Action
                      </button>
                      <span className="text-xs text-slate-400 font-medium">Updated just now</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CompassIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Not enough data for insights yet</h3>
            <p className="text-slate-500 mt-2">Add more transactions to unlock powerful financial analysis.</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Spending Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                <ArrowUpRightIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming Bill Forecast</p>
                <p className="text-lg font-bold text-slate-900">3 subscriptions detected</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                <ArrowDownRightIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Potential Savings</p>
                <p className="text-lg font-bold text-slate-900">Save up to ₹1,200 this month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CompassIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
