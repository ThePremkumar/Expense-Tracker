import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Transaction } from '../types';
import {
  formatCurrency,
  getCategoryColor,
  groupTransactionsByCategory,
  groupTransactionsByDate } from
'../utils/helpers';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area } from
'recharts';
import {
  PieChartIcon,
  BarChart3Icon,
  TrendingUpIcon,
  LayersIcon } from
'lucide-react';
interface ReportsProps {
  transactions: Transaction[];
  totalBudget: number;
}
export function Reports({ transactions, totalBudget }: ReportsProps) {
  const categoryData = groupTransactionsByCategory(transactions);
  const dailyData = groupTransactionsByDate(transactions).map((d) => ({
    ...d,
    dateFormatted: new Date(d.date).getDate().toString()
  }));
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  // Cumulative spending data
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return groupTransactionsByDate(transactions).map((d) => {
      cumulative += d.amount;
      return {
        day: new Date(d.date).getDate(),
        amount: cumulative
      };
    });
  }, [transactions]);
  if (transactions.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500">Analyze your spending patterns</p>
        </div>
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
          <PieChartIcon className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">
            No data to display
          </h3>
          <p className="text-slate-500 mt-1">
            Add some transactions to see your reports.
          </p>
        </Card>
      </div>);

  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500">Analyze your spending patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-indigo-500" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none">

                    {categoryData.map((entry, index) =>
                    <Cell
                      key={`cell-${index}`}
                      fill={getCategoryColor(entry.name)} />

                    )}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle" />

                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Spending Trend */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3Icon className="w-5 h-5 mr-2 text-emerald-500" />
              Daily Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9" />

                  <XAxis
                    dataKey="dateFormatted"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 12
                    }}
                    dy={10} />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 12
                    }}
                    tickFormatter={(value) => `₹${value}`} />

                  <RechartsTooltip
                    cursor={{
                      fill: '#f8fafc'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} />

                  <Bar
                    dataKey="amount"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40} />

                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Spending */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2 text-violet-500" />
              Cumulative Spending
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cumulativeData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>

                  <defs>
                    <linearGradient
                      id="colorAmount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1">

                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9" />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 12
                    }} />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 12
                    }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />

                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} />

                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)" />

                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Comparison Progress Bars */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LayersIcon className="w-5 h-5 mr-2 text-amber-500" />
              Category Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {categoryData.map((cat) => {
                const percentage =
                totalSpent > 0 ? cat.value / totalSpent * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getCategoryColor(cat.name)
                          }} />

                        <span className="text-sm font-medium text-slate-700">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(cat.value)}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: getCategoryColor(cat.name)
                        }} />

                    </div>
                  </div>);

              })}
            </div>
          </CardContent>
        </Card>

        {/* Category List Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Amount Spent</th>
                    <th className="p-4 text-right">% of Total Spent</th>
                    <th className="p-4 text-right">% of Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryData.map((cat) => {
                    const pctOfSpent =
                    totalSpent > 0 ? cat.value / totalSpent * 100 : 0;
                    const pctOfBudget =
                    totalBudget > 0 ? cat.value / totalBudget * 100 : 0;
                    return (
                      <tr
                        key={cat.name}
                        className="hover:bg-slate-50/50 transition-colors">

                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: getCategoryColor(cat.name)
                              }} />

                            <span className="font-medium text-slate-900">
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-900">
                          {formatCurrency(cat.value)}
                        </td>
                        <td className="p-4 text-right text-slate-600">
                          {pctOfSpent.toFixed(1)}%
                        </td>
                        <td className="p-4 text-right text-slate-600">
                          {totalBudget > 0 ?
                          `${pctOfBudget.toFixed(1)}%` :
                          'N/A'}
                        </td>
                      </tr>);

                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}