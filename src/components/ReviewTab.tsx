import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  Save,
  MessageSquare,
  Award,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { AppState } from '../types/finance';
import { calculateMonthlyTotals, calculateTotalDebt, calculateEmergencyFundTotal } from '../utils/financialCalculations';
import { formatPKR, formatMonthName, exportToCSV } from '../utils/formatters';

interface ReviewTabProps {
  state: AppState;
  onSaveNotes: (notes: string) => void;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({ state, onSaveNotes }) => {
  const month = state.selectedMonth;
  const totals = calculateMonthlyTotals(state, month);
  const debt = calculateTotalDebt(state);
  const emergencyFund = calculateEmergencyFundTotal(state);

  const [notes, setNotes] = useState<string>(
    state.monthlyReviewNotes[month] || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compliance checks
  const needsCompliant = totals.needsPercentage <= state.budgetConfig.needsPercent;
  const wantsCompliant = totals.wantsPercentage <= state.budgetConfig.wantsPercent;
  const savingsCompliant = totals.savingsRate >= state.budgetConfig.savingsDebtPercent;

  const handleSave = () => {
    onSaveNotes(notes);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportSummary = () => {
    const report = [
      ['MY FINANCE MANAGER - MONTHLY REVIEW REPORT'],
      ['Period', formatMonthName(month)],
      ['Total Income', totals.totalIncome],
      ['Total Expenses', totals.totalExpenses],
      ['Essential Needs Expenses', totals.needsExpenses],
      ['Discretionary Wants Expenses', totals.wantsExpenses],
      ['Net Savings', totals.monthlySavings],
      ['Savings Rate', `${totals.savingsRate.toFixed(1)}%`],
      ['Total Outstanding Debt', debt.totalRemaining],
      ['Emergency Fund Balance', emergencyFund],
      [''],
      ['TOP EXPENSE CATEGORIES'],
      ...totals.topCategories.map((c) => [c.category, c.amount]),
      [''],
      ['MONTHLY REFLECTION & COMMITMENTS'],
      [notes || 'No reflections saved yet.'],
    ];
    exportToCSV(`monthly-financial-review-${month}`, report);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Monthly Financial Review & Reflection
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automated performance audit and self-reflection for {formatMonthName(month)}
          </p>
        </div>
        <button
          onClick={handleExportSummary}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
        >
          <Download className="h-4 w-4" />
          Export Monthly Report
        </button>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          Your monthly reflection notes have been saved to secure local storage!
        </div>
      )}

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Income</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(totals.totalIncome)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Inflows recorded</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Expenses</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(totals.totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {totals.totalIncome > 0
              ? `${((totals.totalExpenses / totals.totalIncome) * 100).toFixed(0)}% of income`
              : '—'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Surplus / Savings</span>
          <div
            className={`mt-1 text-xl font-bold ${
              totals.monthlySavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {formatPKR(totals.monthlySavings)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Savings Rate: {totals.savingsRate.toFixed(1)}%
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Emergency Cushion</span>
          <div className="mt-1 text-xl font-bold text-teal-600 dark:text-teal-400">
            {formatPKR(emergencyFund)}
          </div>
          <span className="text-[11px] text-teal-600 font-medium">Liquid reserve balance</span>
        </div>
      </div>

      {/* Compliance Scorecard */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-600" />
          50/30/20 Framework Compliance Audit
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Needs Check */}
          <div
            className={`rounded-xl border p-4 text-xs ${
              needsCompliant
                ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Needs ≤ {state.budgetConfig.needsPercent}%
              </span>
              {needsCompliant ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  <CheckCircle className="h-3 w-3" /> Met
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                  <AlertTriangle className="h-3 w-3" /> Over
                </span>
              )}
            </div>
            <div className="font-extrabold text-base text-slate-900 dark:text-white">
              {totals.needsPercentage.toFixed(1)}% of Income
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {needsCompliant
                ? 'Essential living costs remained within planned parameters.'
                : 'Essential spending consumed more than half of income. Look for housing or utility reductions.'}
            </p>
          </div>

          {/* Wants Check */}
          <div
            className={`rounded-xl border p-4 text-xs ${
              wantsCompliant
                ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Wants ≤ {state.budgetConfig.wantsPercent}%
              </span>
              {wantsCompliant ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  <CheckCircle className="h-3 w-3" /> Met
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                  <AlertTriangle className="h-3 w-3" /> Over
                </span>
              )}
            </div>
            <div className="font-extrabold text-base text-slate-900 dark:text-white">
              {totals.wantsPercentage.toFixed(1)}% of Income
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {wantsCompliant
                ? 'Discretionary spending was disciplined and controlled.'
                : 'Lifestyle inflation / shopping / dining exceeded the recommended ceiling.'}
            </p>
          </div>

          {/* Savings Check */}
          <div
            className={`rounded-xl border p-4 text-xs ${
              savingsCompliant
                ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                : 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Savings ≥ {state.budgetConfig.savingsDebtPercent}%
              </span>
              {savingsCompliant ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  <CheckCircle className="h-3 w-3" /> Met
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-3 w-3" /> Under Target
                </span>
              )}
            </div>
            <div className="font-extrabold text-base text-slate-900 dark:text-white">
              {totals.savingsRate.toFixed(1)}% Saved
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {savingsCompliant
                ? 'Target wealth accumulation achieved for this month.'
                : 'Did not hit the 20% mark. Focus on "Pay Yourself First" as soon as salary lands.'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Spending Categories Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Top Expense Outflows this Month
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {totals.topCategories.map((item, idx) => (
            <div
              key={item.category}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-850"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] dark:bg-slate-700 dark:text-slate-300">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{item.category}</span>
              </div>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatPKR(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Reflection Prompts from Document */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              End-of-Month Reflection & Accountability Journal
            </h3>
          </div>
          <button
            id="save-reflection-btn"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Save className="h-3.5 w-3.5" />
            Save Reflections
          </button>
        </div>

        <div className="rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600 dark:bg-slate-850 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Core Reflection Prompts from the Financial Stress Guide:
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Where did I overspend this month compared to my plan?</li>
            <li>What recurring or unnecessary expense can I cut or renegotiate next month?</li>
            <li>Did I remember to Pay Myself First before spending on wants?</li>
            <li>What is one financial victory (e.g. debt payment, resisting an impulse buy) to celebrate?</li>
            <li>What is my singular top financial commitment for next month?</li>
          </ul>
        </div>

        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your monthly review reflections here...
1. Overspending: I noticed food delivery was high in week 2.
2. Cut next month: Cancel unused streaming subscription.
3. Win: Paid PKR 15,000 extra toward credit card snowball!
4. Next month focus: Build emergency fund to PKR 100,000."
          className="w-full rounded-xl border border-slate-300 p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
};
