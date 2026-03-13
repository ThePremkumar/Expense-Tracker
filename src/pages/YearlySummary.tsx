import { useMemo } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  formatCurrency, 
  getMonthsInYear, 
  formatMonthShort,
  getCategoryColor 
} from '../utils/helpers';
import { Transaction } from '../types';
import { TrendingUpIcon, TrendingDownIcon, CalendarIcon, TargetIcon } from 'lucide-react';

interface YearlySummaryProps {
  transactions: Transaction[];
  currentMonth: string;
}

export function YearlySummary({ transactions, currentMonth }: YearlySummaryProps) {
  const currentYear = currentMonth.split('-')[0];
  
  const yearlyStats = useMemo(() => {
    const yearTransactions = transactions.filter(t => t.date.startsWith(currentYear));
    const totalSpent = yearTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Group by month
    const months = getMonthsInYear(currentYear);
    const monthlyData = months.map(m => {
      const monthTransactions = yearTransactions.filter(t => t.date.startsWith(m));
      return {
        month: formatMonthShort(m),
        amount: monthTransactions.reduce((sum, t) => sum + t.amount, 0)
      };
    });

    // Group by category
    const categoryMap: Record<string, number> = {};
    yearTransactions.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const activeMonths = monthlyData.filter(d => d.amount > 0).length || 1;
    const avgMonthly = totalSpent / activeMonths;

    return {
      totalSpent,
      avgMonthly,
      monthlyData,
      categoryData,
      count: yearTransactions.length
    };
  }, [transactions, currentYear]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{currentYear} Yearly Summary</h1>
          <p className="text-slate-500">Comprehensive overview of your finances for the year</p>
        </div>
        <div className="bg-white p-2 px-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-slate-700">{currentYear}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <TargetIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Spent in {currentYear}</p>
                <h3 className="text-3xl font-bold mt-1">{formatCurrency(yearlyStats.totalSpent)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Avg. Monthly Spent</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">{formatCurrency(yearlyStats.avgMonthly)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                <TrendingDownIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Transactions</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">{yearlyStats.count}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Monthly Spending Spread</h3>
          </div>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyStats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => `₹${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {yearlyStats.monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.amount > yearlyStats.avgMonthly ? '#6366f1' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Annual Category Breakdown</h3>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={yearlyStats.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {yearlyStats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {yearlyStats.categoryData.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(cat.name) }} 
                      />
                      <span className="text-sm text-slate-600 font-medium">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {Math.round((cat.value / yearlyStats.totalSpent) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}