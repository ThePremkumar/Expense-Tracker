import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { SmartInsights } from '../components/SmartInsights';
import { Transaction, MonthlyBudget } from '../types';
import { LightbulbIcon } from 'lucide-react';
interface InsightsPageProps {
  allTransactions: Transaction[];
  allBudgets: Record<string, MonthlyBudget>;
  currentMonth: string;
}
export function InsightsPage({
  allTransactions,
  allBudgets,
  currentMonth
}: InsightsPageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Smart Insights</h1>
        <p className="text-slate-500">
          Personalized analysis of your spending habits
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LightbulbIcon className="w-5 h-5 mr-2 text-amber-500" />
            Your Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SmartInsights
            allTransactions={allTransactions}
            allBudgets={allBudgets}
            currentMonth={currentMonth}
            maxInsights={10} />

        </CardContent>
      </Card>
    </div>);

}