import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  ShieldCheck,
  Scale,
  CreditCard,
  PlusCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { AppState, ExpenseCategory } from '../types/finance';
import {
  calculateMonthlyTotals,
  calculateNetWorth,
  calculateEmergencyFundTotal,
  calculateTotalDebt,
  calculateFinancialStress,
  getMonthlyExpenses,
} from '../utils/financialCalculations';
import { formatPKR, formatMonthName } from '../utils/formatters';
import { SpendingTrendChart } from './SpendingTrendChart';
import { FinancialMilestonesSection } from './FinancialMilestonesSection';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardTabProps {
  state: AppState;
  onNavigate?: (tab: any) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenAddIncome?: () => void;
  onOpenAddExpense?: () => void;
  onQuickAdd?: (type: 'income' | 'expense' | 'goal' | 'debt') => void;
}

const COLORS = [
  '#059669', // Emerald
  '#0284c7', // Sky
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#65a30d', // Lime
  '#db2777', // Pink
  '#475569', // Slate
  '#9333ea', // Purple
];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  state,
  onNavigate,
  onNavigateTab,
  onOpenAddIncome,
  onOpenAddExpense,
  onQuickAdd,
}) => {
  const navigate = (tab: any) => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onNavigate) onNavigate(tab);
  };
  const month = state.selectedMonth;
  const {
    totalIncome,
    totalExpenses,
    needsExpenses,
    wantsExpenses,
    monthlySavings,
    savingsRate,
  } = calculateMonthlyTotals(state, month);

  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(state);
  const emergencyFund = calculateEmergencyFundTotal(state);
  const { totalRemaining: debtOutstanding } = calculateTotalDebt(state);
  const stress = calculateFinancialStress(state, month);

  // Category breakdown for Pie Chart
  const monthlyExpensesList = getMonthlyExpenses(state, month);
  const categoryMap: Record<string, number> = {};
  monthlyExpensesList.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const categoryPieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Budget vs Actual overspending check
  const overspentCategories: { category: ExpenseCategory; spent: number; budget: number }[] = [];
  Object.entries(categoryMap).forEach(([cat, spent]) => {
    const budget = state.budgetConfig.categoryBudgets[cat as ExpenseCategory] || 0;
    if (budget > 0 && spent > budget) {
      overspentCategories.push({ category: cat as ExpenseCategory, spent, budget });
    }
  });

  // 50/30/20 data
  const targetNeeds = totalIncome * (state.budgetConfig.needsPercent / 100);
  const targetWants = totalIncome * (state.budgetConfig.wantsPercent / 100);
  const targetSavings = totalIncome * (state.budgetConfig.savingsDebtPercent / 100);

  const budgetSplitData = [
    { name: 'Needs (Essentials)', Target: targetNeeds, Actual: needsExpenses },
    { name: 'Wants', Target: targetWants, Actual: wantsExpenses },
    { name: 'Savings / Surplus', Target: targetSavings, Actual: monthlySavings },
  ];

  // Emergency Fund target calculation: 6 months of essentials
  const monthlyEssentialBurn = needsExpenses > 0 ? needsExpenses : (totalExpenses * 0.7) || 40000;
  const efTarget = monthlyEssentialBurn * 6;
  const efProgressPercent = efTarget > 0 ? Math.min(100, Math.round((emergencyFund / efTarget) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome & Month Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Personal Financial Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview for {formatMonthName(month)} • Financial Stress Principle System
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              onOpenAddIncome ? onOpenAddIncome() : onQuickAdd ? onQuickAdd('income') : navigate('income')
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
            + Income
          </button>
          <button
            onClick={() =>
              onOpenAddExpense ? onOpenAddExpense() : onQuickAdd ? onQuickAdd('expense') : navigate('expense')
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <PlusCircle className="h-3.5 w-3.5 text-rose-600" />
            - Expense
          </button>
          <button
            onClick={() => navigate('review')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition"
          >
            Monthly Review
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Overspending Alert Banner */}
      {overspentCategories.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Budget Alert: {overspentCategories.length} {overspentCategories.length === 1 ? 'category has' : 'categories have'} exceeded their monthly limits
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {overspentCategories.map((item) => (
                  <span
                    key={item.category}
                    className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/70 dark:text-rose-200"
                  >
                    <strong>{item.category}:</strong> {formatPKR(item.spent)} (Budget: {formatPKR(item.budget)}) • +{formatPKR(item.spent - item.budget)}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('budget')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 dark:text-rose-300 underline"
            >
              Adjust Budget
            </button>
          </div>
        </div>
      )}

      {/* Core 8 Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Monthly Income */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Monthly Income</span>
            <div className="rounded-lg bg-emerald-50 p-1.5 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPKR(totalIncome)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{state.incomes.filter(i => i.date.startsWith(month)).length} records</span>
            <button onClick={() => navigate('income')} className="text-emerald-600 hover:underline font-medium">
              View &gt;
            </button>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Monthly Expenses</span>
            <div className="rounded-lg bg-rose-50 p-1.5 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPKR(totalExpenses)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Needs: {formatPKR(needsExpenses)}</span>
            <button onClick={() => navigate('expense')} className="text-rose-600 hover:underline font-medium">
              View &gt;
            </button>
          </div>
        </div>

        {/* Monthly Savings & Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Monthly Savings</span>
            <div className="rounded-lg bg-blue-50 p-1.5 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPKR(monthlySavings)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className={savingsRate >= 20 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-medium'}>
              {savingsRate.toFixed(1)}% savings rate
            </span>
            <span className="text-[10px] text-slate-400">(Goal: 20%)</span>
          </div>
        </div>

        {/* Emergency Fund */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Emergency Fund</span>
            <div className="rounded-lg bg-teal-50 p-1.5 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPKR(emergencyFund)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {stress.emergencyFundMonths.toFixed(1)} mos. essentials
            </span>
            <button onClick={() => navigate('savings')} className="text-teal-600 hover:underline font-medium">
              Goals &gt;
            </button>
          </div>
        </div>

        {/* Debt Outstanding */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Debt Outstanding</span>
            <div className="rounded-lg bg-amber-50 p-1.5 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPKR(debtOutstanding)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{state.debts.length} active liabilities</span>
            <button onClick={() => navigate('debt')} className="text-amber-600 hover:underline font-medium">
              Manage &gt;
            </button>
          </div>
        </div>

        {/* Net Worth */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Net Worth</span>
            <div className="rounded-lg bg-indigo-50 p-1.5 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPKR(netWorth)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Assets: {formatPKR(totalAssets, true)}</span>
            <button onClick={() => navigate('networth')} className="text-indigo-600 hover:underline font-medium">
              Details &gt;
            </button>
          </div>
        </div>

        {/* Emergency Fund Progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">6-Mo Cushion Progress</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{efProgressPercent}%</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 dark:bg-slate-800 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all"
              style={{ width: `${efProgressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Target: {formatPKR(efTarget, true)}</span>
            <button onClick={() => navigate('savings')} className="text-emerald-600 hover:underline font-medium">
              Adjust &gt;
            </button>
          </div>
        </div>

        {/* Financial Stress Level */}
        <div
          onClick={() => navigate('stress')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-emerald-500 transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Financial Health</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                stress.level === 'Calm'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : stress.level === 'Low'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : stress.level === 'Moderate'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {stress.level}
            </span>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Stress Score: {stress.score}</span>
            <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {stress.score <= 35 ? 'Balanced finances & steady savings' : 'Needs attention to non-essentials'}
          </div>
        </div>
      </div>

      {/* Financial Milestones & Digital Badges Section */}
      <FinancialMilestonesSection state={state} onNavigateTab={navigate} />

      {/* 6-Month Spending Trends & Seasonal Shift Analysis Line Chart */}
      <SpendingTrendChart state={state} selectedMonth={month} />

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 50/30/20 Framework: Target vs Actual */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                50/30/20 Budget Framework vs Actual
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Needs ({state.budgetConfig.needsPercent}%) • Wants ({state.budgetConfig.wantsPercent}%) • Savings/Debt ({state.budgetConfig.savingsDebtPercent}%)
              </p>
            </div>
            <button
              onClick={() => navigate('budget')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Edit Percentages
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetSplitData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `Rs ${val / 1000}k`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [formatPKR(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Monthly Spending by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total monthly expenses: {formatPKR(totalExpenses)}
              </p>
            </div>
            <button
              onClick={() => navigate('expense')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              All Expenses
            </button>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400 text-xs">
              No expenses recorded for this month yet.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatPKR(Number(value)), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '11px', maxHeight: '200px', overflowY: 'auto' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Practical Action Recommendations from Financial Stress Document */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-teal-50/70 p-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg bg-emerald-600 p-1.5 text-white">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Financial Stress Document: Recommended Actions For You
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic insights calculated directly from your actual numbers
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {stress.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-white/90 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-750 dark:bg-slate-850 dark:text-slate-300"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Principles: Prioritize essentials • Avoid impulsive spending • Build emergency buffer • Pay yourself first.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('coach')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Open AI Coach & Guidelines &gt;
            </button>
            <button
              onClick={() => navigate('islamic')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline"
            >
              Islamic Guidance &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
