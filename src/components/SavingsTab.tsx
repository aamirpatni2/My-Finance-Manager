import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  ShieldCheck,
  Calendar,
  Sparkles,
  TrendingUp,
  Trash2,
  Edit2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { AppState, SavingsGoal } from '../types/finance';
import { calculateMonthlyTotals, calculateEmergencyFundTotal } from '../utils/financialCalculations';
import { formatPKR, formatDate, getCurrentDateStr } from '../utils/formatters';

interface SavingsTabProps {
  state: AppState;
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (id: string, amount: number) => void;
}

export const SavingsTab: React.FC<SavingsTabProps> = ({
  state,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onDepositToGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [notes, setNotes] = useState('');

  // Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const { totalIncome, needsExpenses, totalExpenses } = calculateMonthlyTotals(
    state,
    state.selectedMonth
  );

  // Essential monthly expenses for Emergency Fund calculation
  const monthlyEssentialBurn = needsExpenses > 0 ? needsExpenses : (totalExpenses * 0.7) || 45000;
  const recommended3MonthEF = monthlyEssentialBurn * 3;
  const recommended6MonthEF = monthlyEssentialBurn * 6;

  // Emergency Fund total
  const currentEmergencyFundTotal = calculateEmergencyFundTotal(state);

  const handleOpenAdd = (presetEmergency: boolean = false) => {
    setEditingGoal(null);
    if (presetEmergency) {
      setName('Emergency Reserve Fund (6 Months)');
      setTargetAmount(recommended6MonthEF.toString());
      setCurrentAmount(currentEmergencyFundTotal.toString());
      setIsEmergencyFund(true);
      setDeadline('2026-12-31');
      setNotes('Liquid safety cushion for job loss, unexpected medical or essential home repairs');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setIsEmergencyFund(false);
      setDeadline('2027-06-30');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline);
    setIsEmergencyFund(Boolean(goal.isEmergencyFund));
    setNotes(goal.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = Math.max(0, parseFloat(currentAmount) || 0);
    if (isNaN(target) || target <= 0) return;

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline,
        isEmergencyFund,
        notes: notes.trim(),
      });
    } else {
      onAddGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline,
        isEmergencyFund,
        notes: notes.trim(),
      });
    }
    setIsModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(depositAmount);
    if (depositGoalId && !isNaN(num) && num > 0) {
      onDepositToGoal(depositGoalId, num);
      setDepositGoalId(null);
      setDepositAmount('');
    }
  };

  // Helper to calculate monthly amount needed
  const calculateMonthlyNeeded = (target: number, current: number, deadlineStr: string): number => {
    const remaining = Math.max(0, target - current);
    if (remaining === 0) return 0;
    const now = new Date();
    const targetDate = new Date(deadlineStr);
    const months = Math.max(
      1,
      (targetDate.getFullYear() - now.getFullYear()) * 12 +
        (targetDate.getMonth() - now.getMonth())
    );
    return Math.ceil(remaining / months);
  };

  const totalSavedAcrossGoals = state.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTargetAcrossGoals = state.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Savings Goals & Emergency Fund
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pay Yourself First, establish a robust emergency cushion, and systematically reach milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-200 transition"
          >
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            + Setup Emergency Fund
          </button>
          <button
            id="add-goal-main-btn"
            onClick={() => handleOpenAdd(false)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </button>
        </div>
      </div>

      {/* Pay Yourself First Strategy Banner */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-5 shadow-xs dark:border-emerald-900 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-600 p-2 text-white shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                Principle: "Pay Yourself First" Immediately When Income Arrives
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Do not save what is left over after spending; instead, spend what is left after allocating to savings.
                With your current monthly income of <strong>{formatPKR(totalIncome)}</strong>, automatically routing{' '}
                <strong>{formatPKR(totalIncome * 0.2)}</strong> (20%) directly into your emergency or target goals shields your family from financial shocks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Total Goals Progress:
            </span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {totalTargetAcrossGoals > 0
                ? `${Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Fund Benchmark Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Emergency Fund Health Check
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculated based on your monthly essential expenses (PKR {monthlyEssentialBurn.toLocaleString()}/month)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Current Dedicated Cushion:</span>
            <div className="text-base font-bold text-teal-600 dark:text-teal-400">
              {formatPKR(currentEmergencyFundTotal)} ({(currentEmergencyFundTotal / monthlyEssentialBurn).toFixed(1)} Months)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Baseline (3 Months Essentials)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatPKR(recommended3MonthEF)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-2 rounded-full bg-teal-600 transition-all"
                style={{
                  width: `${Math.min(100, (currentEmergencyFundTotal / recommended3MonthEF) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {currentEmergencyFundTotal >= recommended3MonthEF
                ? '✓ 3-month baseline achieved!'
                : `Need ${formatPKR(recommended3MonthEF - currentEmergencyFundTotal)} more to cover 3 months`}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Recommended Buffer (6 Months Essentials)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatPKR(recommended6MonthEF)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-2 rounded-full bg-emerald-600 transition-all"
                style={{
                  width: `${Math.min(100, (currentEmergencyFundTotal / recommended6MonthEF) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {currentEmergencyFundTotal >= recommended6MonthEF
                ? '✓ Full 6-month buffer achieved! High financial peace.'
                : `Need ${formatPKR(recommended6MonthEF - currentEmergencyFundTotal)} more for complete peace of mind`}
            </p>
          </div>
        </div>
      </div>

      {/* Savings Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.savingsGoals.map((goal) => {
          const progressPercent = Math.min(
            100,
            Math.round((goal.currentAmount / goal.targetAmount) * 100)
          );
          const monthlyNeeded = calculateMonthlyNeeded(
            goal.targetAmount,
            goal.currentAmount,
            goal.deadline
          );

          return (
            <div
              key={goal.id}
              className={`rounded-xl border p-5 shadow-xs transition flex flex-col justify-between ${
                goal.isEmergencyFund
                  ? 'border-teal-300 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {goal.isEmergencyFund && (
                      <span className="inline-flex items-center gap-1 rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-200 mb-1.5">
                        <ShieldCheck className="h-3 w-3" /> Emergency Fund
                      </span>
                    )}
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {goal.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Edit Goal"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                      title="Delete Goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {formatPKR(goal.currentAmount)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    of {formatPKR(goal.targetAmount)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      progressPercent >= 100
                        ? 'bg-emerald-600'
                        : goal.isEmergencyFund
                        ? 'bg-teal-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{progressPercent}% reached</span>
                  <span>Due: {formatDate(goal.deadline)}</span>
                </div>

                {/* Monthly Required Calculation */}
                <div className="mt-4 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/70 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Monthly savings needed:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {progressPercent >= 100 ? 'Goal Met!' : `${formatPKR(monthlyNeeded)}/mo`}
                    </strong>
                  </div>
                  {goal.notes && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      "{goal.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action: Deposit funds */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Remaining: {formatPKR(Math.max(0, goal.targetAmount - goal.currentAmount))}
                </span>
                <button
                  onClick={() => {
                    setDepositGoalId(goal.id);
                    setDepositAmount('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Deposit Funds
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency Fund, Hajj Journey, New Car"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Balance (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Deadline Date *
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-ef"
                  checked={isEmergencyFund}
                  onChange={(e) => setIsEmergencyFund(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="is-ef" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mark as Emergency Fund (Tracks essential months cushion)
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Kept in Shariah-compliant high yield account"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {editingGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Add Funds to Goal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Transfer savings from current cash/income directly into this goal.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount in PKR *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">
                    Rs
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full rounded-lg border border-slate-300 p-2.5 pl-9 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
