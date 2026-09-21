import React, { useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sliders,
  Info,
} from 'lucide-react';
import { formatPKR } from '../utils/formatters';

interface RadialBudgetProgressChartProps {
  totalIncome: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  needsExpenses: number;
  wantsExpenses: number;
  monthlySavings: number;
  monthName: string;
}

type ViewMode = 'utilization' | 'incomeShare';

export const RadialBudgetProgressChart: React.FC<RadialBudgetProgressChartProps> = ({
  totalIncome,
  needsPercent,
  wantsPercent,
  savingsPercent,
  needsExpenses,
  wantsExpenses,
  monthlySavings,
  monthName,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('utilization');
  const [hoveredBucket, setHoveredBucket] = useState<string | null>(null);

  // Planned amounts in PKR
  const plannedNeeds = (totalIncome * needsPercent) / 100;
  const plannedWants = (totalIncome * wantsPercent) / 100;
  const plannedSavings = (totalIncome * savingsPercent) / 100;

  // Actual amounts
  const actualNeeds = needsExpenses;
  const actualWants = wantsExpenses;
  const actualSavings = monthlySavings;

  // Budget utilization (% of planned cap consumed / achieved)
  const needsUtilizationRaw = plannedNeeds > 0 ? (actualNeeds / plannedNeeds) * 100 : 0;
  const wantsUtilizationRaw = plannedWants > 0 ? (actualWants / plannedWants) * 100 : 0;
  const savingsAchievementRaw = plannedSavings > 0 ? (actualSavings / plannedSavings) * 100 : 0;

  // Actual income shares (% of total monthly income)
  const actualNeedsShare = totalIncome > 0 ? (actualNeeds / totalIncome) * 100 : 0;
  const actualWantsShare = totalIncome > 0 ? (actualWants / totalIncome) * 100 : 0;
  const actualSavingsShare = totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0;

  // Over budget checks
  const isNeedsOver = actualNeeds > plannedNeeds && plannedNeeds > 0;
  const isWantsOver = actualWants > plannedWants && plannedWants > 0;
  const isSavingsAchieved = actualSavings >= plannedSavings && plannedSavings > 0;

  // Variances in PKR
  const needsVariance = plannedNeeds - actualNeeds;
  const wantsVariance = plannedWants - actualWants;
  const savingsVariance = actualSavings - plannedSavings;

  // Colors
  const needsColor = isNeedsOver ? '#ef4444' : '#10b981'; // red-500 if over, emerald-500
  const wantsColor = isWantsOver ? '#f43f5e' : '#f59e0b'; // rose-500 if over, amber-500
  const savingsColor = isSavingsAchieved ? '#3b82f6' : '#6366f1'; // blue-500 if achieved, indigo-500

  // Chart data for Recharts RadialBarChart
  // Ordered inner to outer: Savings -> Wants -> Needs
  const chartData = [
    {
      id: 'savings',
      name: 'Savings & Debt',
      category: 'Savings & Debt Payoff',
      // In utilization mode: progress toward savings target (capped visually at 100 for arc length)
      value:
        viewMode === 'utilization'
          ? Math.min(100, Math.round(savingsAchievementRaw))
          : Math.min(100, Math.round(actualSavingsShare)),
      rawPct:
        viewMode === 'utilization'
          ? Math.round(savingsAchievementRaw)
          : Math.round(actualSavingsShare),
      targetPct: savingsPercent,
      fill: savingsColor,
      plannedPKR: plannedSavings,
      actualPKR: actualSavings,
      variancePKR: savingsVariance,
      isOver: false,
      isAchieved: isSavingsAchieved,
      statusLabel:
        viewMode === 'utilization'
          ? isSavingsAchieved
            ? 'Target Met'
            : `${Math.round(savingsAchievementRaw)}% of Goal`
          : `${Math.round(actualSavingsShare)}% of Income (Target ${savingsPercent}%)`,
    },
    {
      id: 'wants',
      name: 'Wants (Discretionary)',
      category: 'Wants',
      value:
        viewMode === 'utilization'
          ? Math.min(100, Math.round(wantsUtilizationRaw))
          : Math.min(100, Math.round(actualWantsShare)),
      rawPct:
        viewMode === 'utilization'
          ? Math.round(wantsUtilizationRaw)
          : Math.round(actualWantsShare),
      targetPct: wantsPercent,
      fill: wantsColor,
      plannedPKR: plannedWants,
      actualPKR: actualWants,
      variancePKR: wantsVariance,
      isOver: isWantsOver,
      isAchieved: !isWantsOver,
      statusLabel:
        viewMode === 'utilization'
          ? isWantsOver
            ? 'Over Budget'
            : `${Math.round(wantsUtilizationRaw)}% of Cap`
          : `${Math.round(actualWantsShare)}% of Income (Target ${wantsPercent}%)`,
    },
    {
      id: 'needs',
      name: 'Needs (Essentials)',
      category: 'Needs',
      value:
        viewMode === 'utilization'
          ? Math.min(100, Math.round(needsUtilizationRaw))
          : Math.min(100, Math.round(actualNeedsShare)),
      rawPct:
        viewMode === 'utilization'
          ? Math.round(needsUtilizationRaw)
          : Math.round(actualNeedsShare),
      targetPct: needsPercent,
      fill: needsColor,
      plannedPKR: plannedNeeds,
      actualPKR: actualNeeds,
      variancePKR: needsVariance,
      isOver: isNeedsOver,
      isAchieved: !isNeedsOver,
      statusLabel:
        viewMode === 'utilization'
          ? isNeedsOver
            ? 'Over Budget'
            : `${Math.round(needsUtilizationRaw)}% of Cap`
          : `${Math.round(actualNeedsShare)}% of Income (Target ${needsPercent}%)`,
    },
  ];

  // Overall financial discipline score (0 - 100)
  const totalPlannedExpenses = plannedNeeds + plannedWants;
  const totalActualExpenses = actualNeeds + actualWants;
  const overallAdherence =
    totalPlannedExpenses > 0
      ? Math.max(0, Math.min(100, Math.round(100 - Math.max(0, totalActualExpenses - totalPlannedExpenses) / totalPlannedExpenses * 100)))
      : 100;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 text-xs z-50 min-w-48">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: data.fill }}
            />
            <span className="font-bold text-slate-900 dark:text-white">
              {data.name}
            </span>
          </div>

          <div className="space-y-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Target Split:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {data.targetPct}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Planned Budget:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatPKR(data.plannedPKR)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Actual:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatPKR(data.actualPKR)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>{viewMode === 'utilization' ? 'Cap Utilized:' : 'Income Share:'}</span>
              <span
                className={`font-bold ${
                  data.isOver ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {data.rawPct}%
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Variance:</span>
              <span
                className={`font-medium ${
                  data.variancePKR < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {data.variancePKR < 0
                  ? `-${formatPKR(Math.abs(data.variancePKR))}`
                  : `+${formatPKR(data.variancePKR)}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper for Circular SVG Gauge
  const renderCircularGauge = (
    pct: number,
    color: string,
    isOver: boolean,
    size = 72,
    strokeWidth = 7
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Cap visual dash at 100%, but show full loop if 100%
    const normalizedPct = Math.min(100, Math.max(0, pct));
    const offset = circumference - (normalizedPct / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span
            className={`text-xs font-extrabold ${
              isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {Math.round(pct)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                50/30/20 Radial Allocation & Spending Patterns ({monthName})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualizing target framework thresholds against verified monthly transactions
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-850 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('utilization')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'utilization'
                ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Cap Utilization (%)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('incomeShare')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'incomeShare'
                ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Income Share vs. Target
          </button>
        </div>
      </div>

      {/* Main Radial Chart & Rings Visualization Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radial Progress Chart Centerpiece */}
        <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
          <div className="w-full h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="95%"
                barSize={16}
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: '#e2e8f0', opacity: 0.35 }}
                  dataKey="value"
                  cornerRadius={10}
                  className="cursor-pointer transition-opacity duration-200"
                />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>

            {/* Inner Center Content / KPI Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {viewMode === 'utilization' ? 'Budget Health' : 'Income Ratio'}
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {viewMode === 'utilization'
                    ? `${overallAdherence}%`
                    : `${Math.round(actualNeedsShare + actualWantsShare)}%`}
                </div>
                <span
                  className={`inline-block text-[10px] font-bold rounded-full px-2 py-0.5 mt-0.5 ${
                    isNeedsOver || isWantsOver
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {isNeedsOver || isWantsOver ? 'Attention' : 'On Track'}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Rings Legend Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Outer: Needs</span>
              <span className="text-[11px] text-slate-400">({needsPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Middle: Wants</span>
              <span className="text-[11px] text-slate-400">({wantsPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Inner: Savings</span>
              <span className="text-[11px] text-slate-400">({savingsPercent}%)</span>
            </div>
          </div>
        </div>

        {/* 3 Interactive Bucket Performance Cards */}
        <div className="lg:col-span-7 space-y-3">
          {/* Needs Bucket Card */}
          <div
            className={`rounded-xl border p-4 transition ${
              isNeedsOver
                ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20'
                : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {renderCircularGauge(
                  viewMode === 'utilization' ? needsUtilizationRaw : actualNeedsShare,
                  needsColor,
                  isNeedsOver
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Needs (Essentials)
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Target: {needsPercent}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span>
                      Planned Cap: <strong>{formatPKR(plannedNeeds)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>
                      Actual Spent: <strong>{formatPKR(actualNeeds)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-xs font-bold ${
                    needsVariance < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {needsVariance < 0
                    ? `Over by ${formatPKR(Math.abs(needsVariance))}`
                    : `${formatPKR(needsVariance)} Buffer Left`}
                </div>
                <span className="text-[10px] text-slate-400">
                  {viewMode === 'utilization'
                    ? `${Math.round(needsUtilizationRaw)}% of cap consumed`
                    : `${Math.round(actualNeedsShare)}% of total income`}
                </span>
              </div>
            </div>
          </div>

          {/* Wants Bucket Card */}
          <div
            className={`rounded-xl border p-4 transition ${
              isWantsOver
                ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20'
                : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {renderCircularGauge(
                  viewMode === 'utilization' ? wantsUtilizationRaw : actualWantsShare,
                  wantsColor,
                  isWantsOver
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Wants (Discretionary)
                    </span>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Target: {wantsPercent}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span>
                      Planned Cap: <strong>{formatPKR(plannedWants)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>
                      Actual Spent: <strong>{formatPKR(actualWants)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-xs font-bold ${
                    wantsVariance < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {wantsVariance < 0
                    ? `Over by ${formatPKR(Math.abs(wantsVariance))}`
                    : `${formatPKR(wantsVariance)} Buffer Left`}
                </div>
                <span className="text-[10px] text-slate-400">
                  {viewMode === 'utilization'
                    ? `${Math.round(wantsUtilizationRaw)}% of cap consumed`
                    : `${Math.round(actualWantsShare)}% of total income`}
                </span>
              </div>
            </div>
          </div>

          {/* Savings / Debt Payoff Bucket Card */}
          <div
            className={`rounded-xl border p-4 transition ${
              isSavingsAchieved
                ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20'
                : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {renderCircularGauge(
                  viewMode === 'utilization' ? savingsAchievementRaw : actualSavingsShare,
                  savingsColor,
                  false
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Savings & Debt Payoff
                    </span>
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Target: {savingsPercent}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span>
                      Target Allocation: <strong>{formatPKR(plannedSavings)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>
                      Actual Net Savings: <strong>{formatPKR(actualSavings)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-xs font-bold ${
                    savingsVariance >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {savingsVariance >= 0
                    ? `+${formatPKR(savingsVariance)} Ahead of Goal`
                    : `${formatPKR(Math.abs(savingsVariance))} Shortfall`}
                </div>
                <span className="text-[10px] text-slate-400">
                  {viewMode === 'utilization'
                    ? `${Math.round(savingsAchievementRaw)}% of target met`
                    : `${Math.round(actualSavingsShare)}% saved from income`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Insight Note */}
      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-850/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span>
            {isNeedsOver
              ? `Essential Needs are currently exceeding your ${needsPercent}% allocation cap by ${formatPKR(Math.abs(needsVariance))}. Consider reallocating discretionary spending or reviewing housing/utility expenses.`
              : isWantsOver
              ? `Discretionary Wants have exceeded your ${wantsPercent}% allocation cap by ${formatPKR(Math.abs(wantsVariance))}. Try holding off on non-essential purchases for the rest of ${monthName}.`
              : isSavingsAchieved
              ? `Outstanding performance! You have achieved ${Math.round(savingsAchievementRaw)}% of your monthly savings target (${formatPKR(actualSavings)} saved). Both Needs and Wants remain safely under control.`
              : `Your spending is within safe boundaries. Needs are using ${Math.round(needsUtilizationRaw)}% of their planned cap and Wants are at ${Math.round(wantsUtilizationRaw)}%.`}
          </span>
        </div>
      </div>
    </div>
  );
};
