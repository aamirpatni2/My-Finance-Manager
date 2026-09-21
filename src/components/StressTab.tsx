import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Sparkles,
  HeartHandshake,
  Check,
} from 'lucide-react';
import { AppState, TabType } from '../types/finance';
import { calculateFinancialStress } from '../utils/financialCalculations';
import { formatPKR } from '../utils/formatters';

interface StressTabProps {
  state: AppState;
  onNavigateTab: (tab: TabType) => void;
}

export const StressTab: React.FC<StressTabProps> = ({ state, onNavigateTab }) => {
  const stress = calculateFinancialStress(state);

  const getScoreColor = () => {
    switch (stress.level) {
      case 'Calm':
      case 'Low':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'Moderate':
        return 'text-blue-600 dark:text-blue-400';
      case 'High':
        return 'text-amber-600 dark:text-amber-400';
      case 'Severe':
        return 'text-rose-600 dark:text-rose-400';
    }
  };

  const getBadgeStyle = () => {
    switch (stress.level) {
      case 'Calm':
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'Moderate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      case 'High':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'Severe':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Financial Stress Diagnostic
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Evaluated strictly from your recorded income, expenses, debts, and emergency liquidity
        </p>
      </div>

      {/* Main Stress Meter Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getBadgeStyle()}`}>
                {stress.level} Financial Stress
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Stress Index: {stress.score} / 100 (Lower is healthier)
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {(stress.level === 'Calm' || stress.level === 'Low') && 'Excellent Financial Peace & Preparedness'}
              {stress.level === 'Moderate' && 'Manageable Position with Targeted Optimization Opportunities'}
              {stress.level === 'High' && 'Heightened Stress Points - Immediate Defensive Planning Needed'}
              {stress.level === 'Severe' && 'Critical Financial Strain - Urgent Stabilization Action Required'}
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              According to the Financial Stress framework, financial anxiety stems primarily from uncertainty, lack of liquidity, and heavy debt obligations. By tackling the specific red indicators below, your peace of mind will systematically improve.
            </p>

            {/* Score Bar */}
            <div className="space-y-1 pt-1">
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    stress.score <= 25
                      ? 'bg-emerald-500'
                      : stress.score <= 50
                      ? 'bg-blue-500'
                      : stress.score <= 75
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(5, stress.score)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0 (Calm / Peaceful)</span>
                <span>25 (Safe)</span>
                <span>50 (Moderate)</span>
                <span>75 (High)</span>
                <span>100 (Severe Panic)</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-center dark:border-slate-800 dark:bg-slate-850 flex flex-col justify-center items-center">
            <Activity className={`h-8 w-8 mb-2 ${getScoreColor()}`} />
            <div className={`text-4xl font-black ${getScoreColor()}`}>
              {stress.score}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
              Composite Stress Score
            </span>
            <span className="text-[11px] text-slate-400">
              Evaluated across 5 diagnostic criteria
            </span>
          </div>
        </div>
      </div>

      {/* 5 Core Diagnostic Indicators */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Detailed Indicator Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stress.factors.map((factor, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 transition text-xs ${
                factor.status === 'danger'
                  ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
                  : factor.status === 'warning'
                  ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20'
                  : 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {factor.status === 'danger' ? (
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                  ) : factor.status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  {factor.name}
                </span>

                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    factor.status === 'danger'
                      ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                      : factor.status === 'warning'
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                      : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                  }`}
                >
                  {factor.status === 'danger'
                    ? 'High Risk'
                    : factor.status === 'warning'
                    ? 'Caution'
                    : 'Safe'}
                </span>
              </div>

              <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                Value: {factor.value}
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Practical Action Steps */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Personalized Practical Actions to Lower Stress
          </h3>
        </div>

        <div className="space-y-3">
          {stress.practicalActions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px] mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 leading-relaxed">
                {action}
              </div>
            </div>
          ))}
        </div>

        {/* Quick jump buttons */}
        <div className="pt-2 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => onNavigateTab('savings')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Go to Emergency Fund
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => onNavigateTab('debt')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Review Debt Snowball
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => onNavigateTab('budget')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Adjust Budget Caps
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
