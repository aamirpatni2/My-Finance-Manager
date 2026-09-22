import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Save,
  Layers,
  ArrowRight,
  Download,
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AppState, BudgetConfig, ExpenseCategory } from '../types/finance';
import { calculateMonthlyTotals, calculateTotalDebt } from '../utils/financialCalculations';
import { formatPKR, formatMonthName, exportToCSV } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { RadialBudgetProgressChart } from './RadialBudgetProgressChart';

interface BudgetPlannerTabProps {
  state: AppState;
  onUpdateBudgetConfig: (config: BudgetConfig) => void;
  onNavigateToExpenses: () => void;
}

const getCategoryType = (cat: ExpenseCategory): 'Essential' | 'Want' => {
  if (['Shopping', 'Entertainment', 'Other'].includes(cat)) {
    return 'Want';
  }
  return 'Essential';
};

export const BudgetPlannerTab: React.FC<BudgetPlannerTabProps> = ({
  state,
  onUpdateBudgetConfig,
  onNavigateToExpenses,
}) => {
  const month = state.selectedMonth;
  const { totalIncome, needsExpenses, wantsExpenses, monthlySavings } = calculateMonthlyTotals(state, month);
  const { totalMonthlyMinimum: debtCommitment } = calculateTotalDebt(state);

  // Local state for configuration
  const [needsPercent, setNeedsPercent] = useState<number>(state.budgetConfig.needsPercent);
  const [wantsPercent, setWantsPercent] = useState<number>(state.budgetConfig.wantsPercent);
  const [savingsPercent, setSavingsPercent] = useState<number>(state.budgetConfig.savingsDebtPercent);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<ExpenseCategory, number>>(
    { ...state.budgetConfig.categoryBudgets }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Category actual spending aggregation for current month
  const monthExpenses = state.expenses.filter((e) => e.date.startsWith(month));
  const categorySpendingMap: Record<ExpenseCategory, number> = {} as any;
  EXPENSE_CATEGORIES.forEach((cat) => {
    categorySpendingMap[cat] = 0;
  });
  monthExpenses.forEach((e) => {
    categorySpendingMap[e.category] = (categorySpendingMap[e.category] || 0) + e.amount;
  });
  const totalActualSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const overBudgetCategoriesCount = EXPENSE_CATEGORIES.filter((cat) => {
    const budget = categoryBudgets[cat] || 0;
    const spent = categorySpendingMap[cat] || 0;
    return budget > 0 && spent > budget;
  }).length;

  const percentTotal = needsPercent + wantsPercent + savingsPercent;
  const isPercentValid = percentTotal === 100;

  // Zero-Based Budget calculations
  // Sum of all category budgets + planned savings/debt allocation
  const totalCategoryBudgetsAssigned = Object.values(categoryBudgets).reduce((sum, val) => sum + (val || 0), 0);
  const targetSavingsAmount = (totalIncome * savingsPercent) / 100;
  const totalZeroBasedAllocated = totalCategoryBudgetsAssigned + targetSavingsAmount;
  const unallocatedRupees = totalIncome - totalZeroBasedAllocated;

  const handleCategoryBudgetChange = (cat: ExpenseCategory, value: string) => {
    const num = parseFloat(value) || 0;
    setCategoryBudgets((prev) => ({
      ...prev,
      [cat]: Math.max(0, num),
    }));
  };

  const handleSave = () => {
    if (!isPercentValid) return;
    onUpdateBudgetConfig({
      needsPercent,
      wantsPercent,
      savingsDebtPercent: savingsPercent,
      categoryBudgets,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetTo503020 = () => {
    setNeedsPercent(50);
    setWantsPercent(30);
    setSavingsPercent(20);
  };

  // Auto-distribute based on total income
  const handleAutoSuggestBudgets = () => {
    if (totalIncome <= 0) return;
    const needsBudget = (totalIncome * needsPercent) / 100;
    const wantsBudget = (totalIncome * wantsPercent) / 100;

    // Distribute needs among essential categories
    const essentialCats: ExpenseCategory[] = [
      'Rent/Housing',
      'Food',
      'Utilities',
      'Transport',
      'Medicine',
      'Education',
      'Family',
      'Insurance',
      'Work',
    ];
    // Distribute wants among wants categories
    const wantsCats: ExpenseCategory[] = ['Shopping', 'Entertainment', 'Other'];

    const newBudgets = { ...categoryBudgets };
    // Suggested weights for Pakistan household expenses
    newBudgets['Rent/Housing'] = Math.round(needsBudget * 0.32);
    newBudgets['Food'] = Math.round(needsBudget * 0.28);
    newBudgets['Utilities'] = Math.round(needsBudget * 0.16);
    newBudgets['Transport'] = Math.round(needsBudget * 0.1);
    newBudgets['Education'] = Math.round(needsBudget * 0.08);
    newBudgets['Medicine'] = Math.round(needsBudget * 0.06);

    newBudgets['Shopping'] = Math.round(wantsBudget * 0.55);
    newBudgets['Entertainment'] = Math.round(wantsBudget * 0.35);
    newBudgets['Other'] = Math.round(wantsBudget * 0.1);

    setCategoryBudgets(newBudgets);
  };

  // CSV Export Functionality
  const handleExportCSV = () => {
    const plannedNeeds = (totalIncome * needsPercent) / 100;
    const plannedWants = (totalIncome * wantsPercent) / 100;
    const plannedSavings = (totalIncome * savingsPercent) / 100;

    const actualNeeds = needsExpenses;
    const actualWants = wantsExpenses;
    const actualSavings = monthlySavings;

    const rows: (string | number)[][] = [
      ['MY FINANCE MANAGER - BUDGET CONFIGURATION & ACTUAL SPENDING REPORT'],
      ['Report Period', `${formatMonthName(month)} (${month})`],
      ['Exported On', new Date().toLocaleString('en-PK')],
      ['Currency', 'PKR (Pakistani Rupee)'],
      ['Total Verified Monthly Income', Math.round(totalIncome)],
      [],
      ['1. 50/30/20 INCOME ALLOCATION FRAMEWORK'],
      ['Framework Component', 'Target %', 'Planned Budget (PKR)', 'Actual Spending (PKR)', 'Variance (PKR)', 'Status'],
      [
        'Needs (Essential Expenses)',
        `${needsPercent}%`,
        Math.round(plannedNeeds),
        Math.round(actualNeeds),
        Math.round(plannedNeeds - actualNeeds),
        actualNeeds > plannedNeeds ? `Over Budget by PKR ${Math.round(actualNeeds - plannedNeeds).toLocaleString()}` : 'Within Budget',
      ],
      [
        'Wants (Discretionary Expenses)',
        `${wantsPercent}%`,
        Math.round(plannedWants),
        Math.round(actualWants),
        Math.round(plannedWants - actualWants),
        actualWants > plannedWants ? `Over Budget by PKR ${Math.round(actualWants - plannedWants).toLocaleString()}` : 'Within Budget',
      ],
      [
        'Savings & Debt Commitment',
        `${savingsPercent}%`,
        Math.round(plannedSavings),
        Math.round(actualSavings),
        Math.round(actualSavings - plannedSavings),
        actualSavings >= plannedSavings ? 'Target Achieved' : `Shortfall of PKR ${Math.round(plannedSavings - actualSavings).toLocaleString()}`,
      ],
      [
        'Total Framework Sum',
        `${percentTotal}%`,
        Math.round(totalIncome),
        Math.round(actualNeeds + actualWants + actualSavings),
        Math.round(totalIncome - (actualNeeds + actualWants)),
        isPercentValid ? '100% Balanced' : 'Unbalanced Percentage',
      ],
      [],
      ['2. ZERO-BASED BUDGETING ALLOCATION METRICS'],
      ['Metric', 'Amount (PKR)', 'Details'],
      ['Total Verified Income', Math.round(totalIncome), 'Total inflow recorded for this month'],
      ['Total Category Limits Assigned', Math.round(totalCategoryBudgetsAssigned), 'Sum of all category spending caps'],
      ['Planned Savings/Debt Payoff Target', Math.round(targetSavingsAmount), `${savingsPercent}% assigned to wealth building & debt`],
      ['Total Zero-Based Amount Allocated', Math.round(totalZeroBasedAllocated), 'Category Budgets + Planned Savings'],
      [
        'Unallocated Balance',
        Math.round(unallocatedRupees),
        Math.abs(unallocatedRupees) < 100
          ? 'Every Rupee Planned (Zero-Based Balanced)'
          : unallocatedRupees > 0
          ? `Surplus of PKR ${Math.round(unallocatedRupees).toLocaleString()} unassigned`
          : `Deficit of PKR ${Math.round(Math.abs(unallocatedRupees)).toLocaleString()} over-allocated`,
      ],
      [],
      ['3. CATEGORY-LEVEL BUDGET VS ACTUAL SPENDING COMPARISON'],
      [
        'Expense Category',
        'Classification',
        'Planned Budget (PKR)',
        'Actual Spent (PKR)',
        'Remaining / Variance (PKR)',
        'Utilization (%)',
        'Status',
      ],
    ];

    let totalBudgetSum = 0;
    let totalSpentSum = 0;

    EXPENSE_CATEGORIES.forEach((cat) => {
      const budget = categoryBudgets[cat] || 0;
      const spent = categorySpendingMap[cat] || 0;
      const variance = budget - spent;
      const utilization = budget > 0 ? `${((spent / budget) * 100).toFixed(1)}%` : 'N/A';
      const type = getCategoryType(cat);

      totalBudgetSum += budget;
      totalSpentSum += spent;

      let status = 'Within Budget';
      if (budget === 0 && spent > 0) {
        status = 'No Budget Cap Set';
      } else if (budget > 0 && spent > budget) {
        status = `OVER BUDGET by PKR ${Math.round(spent - budget).toLocaleString()}`;
      } else if (budget > 0 && spent === 0) {
        status = 'Zero Spent';
      }

      rows.push([
        cat,
        type,
        budget,
        spent,
        variance,
        utilization,
        status,
      ]);
    });

    rows.push([
      'TOTAL ALL CATEGORIES',
      'All Types',
      totalBudgetSum,
      totalSpentSum,
      totalBudgetSum - totalSpentSum,
      totalBudgetSum > 0 ? `${((totalSpentSum / totalBudgetSum) * 100).toFixed(1)}%` : 'N/A',
      totalSpentSum > totalBudgetSum ? 'Net Category Overspending' : 'Net Category Surplus',
    ]);

    rows.push([]);
    rows.push(['4. SUMMARY FINANCIAL HEALTH KPIS']);
    rows.push(['Debt Monthly Minimum Commitment (PKR)', Math.round(debtCommitment)]);
    rows.push(['Actual Net Monthly Savings (PKR)', Math.round(monthlySavings)]);
    rows.push([
      'Actual Savings Rate',
      totalIncome > 0 ? `${((monthlySavings / totalIncome) * 100).toFixed(1)}%` : '0%',
    ]);
    rows.push([
      'Actual Expense Ratio',
      totalIncome > 0 ? `${(((needsExpenses + wantsExpenses) / totalIncome) * 100).toFixed(1)}%` : '0%',
    ]);

    const filename = `my-finance-manager-budget-vs-actual-${month}`;
    exportToCSV(filename, rows);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Planner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            50/30/20 Framework & Zero-Based Budgeting: Give every single rupee a mission
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="export-budget-csv-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition shadow-2xs"
            title="Download budget configuration and actual spending comparison CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            Export CSV
          </button>
          <button
            onClick={handleResetTo503020}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Standard 50/30/20
          </button>
          <button
            id="save-budget-btn"
            onClick={handleSave}
            disabled={!isPercentValid}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
              isPercentValid ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4" />
            Save Budget Plan
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Budget configuration and actual spending comparison exported as CSV for {formatMonthName(month)}!
          </div>
          <span className="text-[11px] font-normal text-blue-600 dark:text-blue-300">File downloaded to your device</span>
        </div>
      )}

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Budget configuration successfully saved! All dashboard and alerts are updated.
        </div>
      )}

      {/* Zero-Based Budgeting Core Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Zero-Based Budgeting Meter
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              In the Financial Stress document, every rupee earned has a planned assignment before the month starts:
              <strong> Income (PKR {totalIncome.toLocaleString()}) - Total Allocated (PKR {Math.round(totalZeroBasedAllocated).toLocaleString()}) = PKR 0</strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/80 min-w-56">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Unallocated Balance
            </span>
            <div
              className={`text-xl font-extrabold mt-1 ${
                Math.abs(unallocatedRupees) < 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : unallocatedRupees > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatPKR(unallocatedRupees)}
            </div>
            <span className="text-[11px] font-medium block mt-0.5">
              {Math.abs(unallocatedRupees) < 100
                ? '✓ Every Rupee Planned!'
                : unallocatedRupees > 0
                ? 'Assign to Savings or Debt'
                : 'Over-allocated! Reduce budgets'}
            </span>
          </div>
        </div>
      </div>

      {/* Customizable 50/30/20 Framework */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-emerald-600" />
              Customize Income Split Framework
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Default is 50% Needs, 30% Wants, 20% Savings/Debt. Current sum:{' '}
              <strong className={isPercentValid ? 'text-emerald-600' : 'text-rose-600'}>
                {percentTotal}%
              </strong>{' '}
              {percentTotal !== 100 && '(Must sum to 100%)'}
            </p>
          </div>
          <button
            onClick={handleAutoSuggestBudgets}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Auto-calculate Category Limits from Income
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Needs */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Needs (Essentials)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {needsPercent}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={needsPercent}
              onChange={(e) => setNeedsPercent(Number(e.target.value))}
              className="mt-3 w-full accent-emerald-600"
            />
            <div className="mt-2 text-xs flex justify-between text-slate-500 dark:text-slate-400">
              <span>Budget: {formatPKR((totalIncome * needsPercent) / 100)}</span>
              <span>Actual: {formatPKR(needsExpenses)}</span>
            </div>
          </div>

          {/* Wants */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Wants (Discretionary)</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                {wantsPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={wantsPercent}
              onChange={(e) => setWantsPercent(Number(e.target.value))}
              className="mt-3 w-full accent-amber-600"
            />
            <div className="mt-2 text-xs flex justify-between text-slate-500 dark:text-slate-400">
              <span>Budget: {formatPKR((totalIncome * wantsPercent) / 100)}</span>
              <span>Actual: {formatPKR(wantsExpenses)}</span>
            </div>
          </div>

          {/* Savings / Debt */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Savings & Debt Payoff</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                {savingsPercent}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={savingsPercent}
              onChange={(e) => setSavingsPercent(Number(e.target.value))}
              className="mt-3 w-full accent-blue-600"
            />
            <div className="mt-2 text-xs flex justify-between text-slate-500 dark:text-slate-400">
              <span>Target: {formatPKR((totalIncome * savingsPercent) / 100)}</span>
              <span>Savings: {formatPKR(monthlySavings)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 50/30/20 Radial Progress Chart & Actual Spending Analysis */}
      <RadialBudgetProgressChart
        totalIncome={totalIncome}
        needsPercent={needsPercent}
        wantsPercent={wantsPercent}
        savingsPercent={savingsPercent}
        needsExpenses={needsExpenses}
        wantsExpenses={wantsExpenses}
        monthlySavings={monthlySavings}
        monthName={formatMonthName(month)}
      />

      {/* Category Monthly Budget Limits */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Category-Level Planned Budgets (PKR)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign exact limits per category. When an expense is recorded, alerts will trigger if you exceed these limits.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Total Allocated: {formatPKR(totalCategoryBudgetsAssigned)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="rounded-lg border border-slate-200 bg-slate-50/40 p-3 dark:border-slate-800 dark:bg-slate-850 text-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200">{cat}</label>
                <span className="text-[10px] text-slate-400">Monthly Cap</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-bold">
                  Rs
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={categoryBudgets[cat] || ''}
                  onChange={(e) => handleCategoryBudgetChange(cat, e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full rounded-md border border-slate-300 py-1.5 pl-8 pr-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onNavigateToExpenses}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline mr-4"
          >
            Review Expenses
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!isPercentValid}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Live Budget vs Actual Spending Comparison Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Budget vs. Actual Spending Comparison ({formatMonthName(month)})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live variance tracking of your planned category caps against actual recorded expenses. Ready for offline export.
            </p>
          </div>

          <button
            id="export-comparison-table-csv-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Download Comparison CSV
          </button>
        </div>

        {/* Overview metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Planned Budget</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatPKR(totalCategoryBudgetsAssigned)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Allocated across {EXPENSE_CATEGORIES.length} categories
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Actual Spending</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatPKR(totalActualSpent)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {monthExpenses.length} transactions recorded
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Variance / Buffer</span>
            <div
              className={`text-lg font-bold mt-1 ${
                totalCategoryBudgetsAssigned >= totalActualSpent
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatPKR(Math.abs(totalCategoryBudgetsAssigned - totalActualSpent))}
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {totalCategoryBudgetsAssigned >= totalActualSpent ? 'Remaining under budget' : 'Net over-budget spending'}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Over-Budget Categories</span>
            <div
              className={`text-lg font-bold mt-1 ${
                overBudgetCategoriesCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {overBudgetCategoriesCount}{' '}
              <span className="text-xs font-normal text-slate-500">/ {EXPENSE_CATEGORIES.length}</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {overBudgetCategoriesCount === 0 ? 'All categories in control' : 'Action recommended'}
            </span>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Classification</th>
                  <th className="px-4 py-3 font-semibold text-right">Planned Budget</th>
                  <th className="px-4 py-3 font-semibold text-right">Actual Spent</th>
                  <th className="px-4 py-3 font-semibold">Utilization</th>
                  <th className="px-4 py-3 font-semibold text-right">Variance</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const budget = categoryBudgets[cat] || 0;
                  const spent = categorySpendingMap[cat] || 0;
                  const variance = budget - spent;
                  const isOver = budget > 0 && spent > budget;
                  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                  const type = getCategoryType(cat);

                  return (
                    <tr key={cat} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {cat}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            type === 'Essential'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                          }`}
                        >
                          {type === 'Essential' ? 'Need (Essential)' : 'Want (Discretionary)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                        {budget > 0 ? formatPKR(budget) : <span className="text-slate-400 italic">No cap set</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap text-slate-900 dark:text-white">
                        {formatPKR(spent)}
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        {budget > 0 ? (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1 font-medium">
                              <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                                {pct}%
                              </span>
                              <span className="text-slate-400">of cap</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isOver
                                    ? 'bg-rose-500'
                                    : pct > 85
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                          budget === 0
                            ? 'text-slate-400'
                            : variance < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {budget === 0
                          ? '—'
                          : variance < 0
                          ? `-${formatPKR(Math.abs(variance))}`
                          : `+${formatPKR(variance)}`}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <AlertCircle className="h-3 w-3" />
                            Over by {formatPKR(spent - budget)}
                          </span>
                        ) : budget > 0 && spent > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            On Track
                          </span>
                        ) : budget > 0 && spent === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Unused Cap
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Uncapped
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-850 dark:text-white">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>
                    Total All Categories
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatPKR(totalCategoryBudgetsAssigned)}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">
                    {formatPKR(totalActualSpent)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold">
                      {totalCategoryBudgetsAssigned > 0
                        ? `${Math.round((totalActualSpent / totalCategoryBudgetsAssigned) * 100)}% overall`
                        : '—'}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${
                      totalCategoryBudgetsAssigned >= totalActualSpent
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {totalCategoryBudgetsAssigned >= totalActualSpent
                      ? `+${formatPKR(totalCategoryBudgetsAssigned - totalActualSpent)}`
                      : `-${formatPKR(totalActualSpent - totalCategoryBudgetsAssigned)}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition"
                    >
                      <Download className="h-3 w-3" /> Export
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
