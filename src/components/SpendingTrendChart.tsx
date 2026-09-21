import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  GraduationCap,
  Calendar,
  Info,
} from 'lucide-react';
import { AppState } from '../types/finance';
import { calculateSixMonthTrends, MonthTrendData } from '../utils/financialCalculations';
import { formatPKR } from '../utils/formatters';

interface SpendingTrendChartProps {
  state: AppState;
  selectedMonth: string;
}

type ViewMode = 'total' | 'breakdown' | 'cashflow';

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ state, selectedMonth }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('total');

  const summary = useMemo(() => {
    return calculateSixMonthTrends(state, selectedMonth);
  }, [state, selectedMonth]);

  const {
    trendData,
    averageExpense,
    averageIncome,
    highestMonth,
    lowestMonth,
    seasonalSwing,
    seasonalSwingPercent,
    currentMonthTrendVsAvg,
  } = summary;

  const currentMonthData = trendData[trendData.length - 1];
  const dateRangeLabel = `${trendData[0]?.monthLabel || ''} — ${trendData[trendData.length - 1]?.monthLabel || ''}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              6-Month Spending Trends & Seasonal Shifts
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>Tracking {dateRangeLabel}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Identify seasonal expense spikes & plan buffers</span>
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium self-start sm:self-auto">
          <button
            id="trend-view-total-btn"
            onClick={() => setViewMode('total')}
            className={`rounded-md px-2.5 py-1 transition ${
              viewMode === 'total'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Total Spend
          </button>
          <button
            id="trend-view-breakdown-btn"
            onClick={() => setViewMode('breakdown')}
            className={`rounded-md px-2.5 py-1 transition ${
              viewMode === 'breakdown'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Needs vs Wants
          </button>
          <button
            id="trend-view-cashflow-btn"
            onClick={() => setViewMode('cashflow')}
            className={`rounded-md px-2.5 py-1 transition ${
              viewMode === 'cashflow'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Income vs Spend
          </button>
        </div>
      </div>

      {/* 4 Metric Chips for Seasonal KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        {/* 6-Month Average */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            6-Month Monthly Avg
          </div>
          <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            {formatPKR(averageExpense)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            Normalized spending baseline
          </div>
        </div>

        {/* Seasonal Peak */}
        <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-3 dark:border-rose-950/60 dark:bg-rose-950/20">
          <div className="flex items-center justify-between text-[11px] font-medium text-rose-700 dark:text-rose-300">
            <span>Seasonal Peak</span>
            <Flame className="h-3 w-3 text-rose-500" />
          </div>
          <div className="mt-1 text-base font-bold text-rose-900 dark:text-rose-200">
            {highestMonth ? formatPKR(highestMonth.totalExpenses) : 'PKR 0'}
          </div>
          <div className="mt-0.5 text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            {highestMonth?.monthLabel || 'N/A'} (Top: {highestMonth?.topCategory})
          </div>
        </div>

        {/* Seasonal Low */}
        <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-3 dark:border-sky-950/60 dark:bg-sky-950/20">
          <div className="flex items-center justify-between text-[11px] font-medium text-sky-700 dark:text-sky-300">
            <span>Seasonal Low</span>
            <Sparkles className="h-3 w-3 text-sky-500" />
          </div>
          <div className="mt-1 text-base font-bold text-sky-900 dark:text-sky-200">
            {lowestMonth ? formatPKR(lowestMonth.totalExpenses) : 'PKR 0'}
          </div>
          <div className="mt-0.5 text-[10px] text-sky-600 dark:text-sky-400 font-medium">
            {lowestMonth?.monthLabel || 'N/A'} (Baseline low)
          </div>
        </div>

        {/* Seasonal Variance Swing */}
        <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-950/60 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-[11px] font-medium text-amber-700 dark:text-amber-300">
            <span>Seasonal Swing</span>
            <Layers className="h-3 w-3 text-amber-500" />
          </div>
          <div className="mt-1 text-base font-bold text-amber-900 dark:text-amber-200">
            +{seasonalSwingPercent}%
          </div>
          <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Δ {formatPKR(seasonalSwing)} max swing
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 15, right: 15, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(val) => `Rs ${Math.round(val / 1000)}k`}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              domain={['auto', 'auto']}
            />

            {/* Custom Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as MonthTrendData;
                  const deltaVsAvg = averageExpense > 0 ? data.totalExpenses - averageExpense : 0;
                  const deltaPercent = averageExpense > 0 ? Math.round((deltaVsAvg / averageExpense) * 100) : 0;

                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5 text-xs text-white shadow-xl min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-sm text-slate-100">{data.monthLabel}</span>
                        {deltaVsAvg !== 0 && (
                          <span
                            className={`flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                              deltaVsAvg > 0
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {deltaVsAvg > 0 ? `+${deltaPercent}% vs avg` : `${deltaPercent}% vs avg`}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Total Expenses:
                          </span>
                          <span className="font-bold text-white">{formatPKR(data.totalExpenses)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-400 pl-3.5">
                          <span>Essential Needs:</span>
                          <span className="font-medium text-sky-400">{formatPKR(data.needsExpenses)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-400 pl-3.5">
                          <span>Wants / Discretionary:</span>
                          <span className="font-medium text-amber-400">{formatPKR(data.wantsExpenses)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-300 pt-1.5 border-t border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Total Income:
                          </span>
                          <span className="font-bold text-emerald-400">{formatPKR(data.totalIncome)}</span>
                        </div>

                        <div className="mt-2 rounded-md bg-slate-800/80 p-1.5 text-[10px] text-slate-300 flex items-center justify-between">
                          <span>Top Category:</span>
                          <span className="font-semibold text-slate-200">
                            {data.topCategory} ({formatPKR(data.topCategoryAmount)})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

            {/* 6-Month Average Reference Line */}
            {averageExpense > 0 && viewMode === 'total' && (
              <ReferenceLine
                y={averageExpense}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: `6-Mo Avg: Rs ${Math.round(averageExpense / 1000)}k`,
                  position: 'insideTopRight',
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
            )}

            {/* Conditional Lines Based on View Mode */}
            {viewMode === 'total' && (
              <Line
                type="monotone"
                dataKey="totalExpenses"
                name="Total Expenses"
                stroke="#e11d48"
                strokeWidth={3}
                dot={{ r: 4, stroke: '#e11d48', strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 7, stroke: '#e11d48', strokeWidth: 2, fill: '#e11d48' }}
              />
            )}

            {viewMode === 'breakdown' && (
              <>
                <Line
                  type="monotone"
                  dataKey="needsExpenses"
                  name="Needs (Essential)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, stroke: '#0284c7', strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, fill: '#0284c7' }}
                />
                <Line
                  type="monotone"
                  dataKey="wantsExpenses"
                  name="Wants (Discretionary)"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, stroke: '#d97706', strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, fill: '#d97706' }}
                />
              </>
            )}

            {viewMode === 'cashflow' && (
              <>
                <Line
                  type="monotone"
                  dataKey="totalIncome"
                  name="Total Income"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, stroke: '#059669', strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
                <Line
                  type="monotone"
                  dataKey="totalExpenses"
                  name="Total Expenses"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, stroke: '#e11d48', strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, fill: '#e11d48' }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonal Insights & Actionable Observations */}
      <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850/50">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Info className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Seasonal Shift Diagnostic</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2 rounded-lg bg-white p-2.5 border border-slate-100 dark:bg-slate-800 dark:border-slate-750">
            <Sun className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white">Summer Cooling Surge:</strong>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Peak electricity tariffs & AC cooling in June–July drive up utility expenses by up to +180% compared to spring baselines.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-white p-2.5 border border-slate-100 dark:bg-slate-800 dark:border-slate-750">
            <GraduationCap className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white">Academic Resumption:</strong>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                August school term fees, uniforms, and books generate predictable cyclical need surges before settling into standard tuition.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-white p-2.5 border border-slate-100 dark:bg-slate-800 dark:border-slate-750">
            <Sparkles className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white">Buffer Recommendation:</strong>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Reserve PKR 12,000–15,000/mo during low-spend months ({lowestMonth?.monthLabel || 'Spring'}) into a seasonal sinking fund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
