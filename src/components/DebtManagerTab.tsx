import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  TrendingDown,
  ArrowRight,
  Flame,
  Snowflake,
  HelpCircle,
  History,
  DollarSign,
} from 'lucide-react';
import { AppState, DebtItem, DebtPayment } from '../types/finance';
import { calculateTotalDebt, calculateDebtStrategies } from '../utils/financialCalculations';
import { formatPKR, formatDate, getCurrentDateStr } from '../utils/formatters';

interface DebtManagerTabProps {
  state: AppState;
  onAddDebt: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'paymentHistory'>) => void;
  onUpdateDebt: (debt: DebtItem) => void;
  onDeleteDebt: (id: string) => void;
  onRecordPayment: (debtId: string, payment: Omit<DebtPayment, 'id'>) => void;
}

export const DebtManagerTab: React.FC<DebtManagerTabProps> = ({
  state,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onRecordPayment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);

  // Form states
  const [creditor, setCreditor] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('10th of every month');
  const [notes, setNotes] = useState('');

  // Payment recording modal
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getCurrentDateStr());
  const [paymentNotes, setPaymentNotes] = useState('Monthly installment');

  // Strategy view
  const [activeStrategy, setActiveStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(10000);

  const { totalRemaining, totalMonthlyMinimum, totalOriginal } = calculateTotalDebt(state);
  const strategies = calculateDebtStrategies(state.debts, extraMonthlyPayment);

  const handleOpenAdd = () => {
    setEditingDebt(null);
    setCreditor('');
    setOriginalAmount('');
    setRemainingAmount('');
    setInterestRate('0');
    setMinimumPayment('');
    setDueDate('10th of every month');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (debt: DebtItem) => {
    setEditingDebt(debt);
    setCreditor(debt.creditor);
    setOriginalAmount(debt.originalAmount.toString());
    setRemainingAmount(debt.remainingAmount.toString());
    setInterestRate(debt.interestRate.toString());
    setMinimumPayment(debt.minimumPayment.toString());
    setDueDate(debt.dueDate);
    setNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orig = parseFloat(originalAmount);
    const rem = parseFloat(remainingAmount);
    const rate = Math.max(0, parseFloat(interestRate) || 0);
    const minPay = Math.max(0, parseFloat(minimumPayment) || 0);
    if (isNaN(orig) || isNaN(rem) || orig < 0 || rem < 0) return;

    if (editingDebt) {
      onUpdateDebt({
        ...editingDebt,
        creditor: creditor.trim(),
        originalAmount: orig,
        remainingAmount: rem,
        interestRate: rate,
        minimumPayment: minPay,
        dueDate,
        notes: notes.trim(),
      });
    } else {
      onAddDebt({
        creditor: creditor.trim(),
        originalAmount: orig,
        remainingAmount: rem,
        interestRate: rate,
        minimumPayment: minPay,
        dueDate,
        notes: notes.trim(),
      });
    }
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(paymentAmount);
    if (payingDebtId && !isNaN(num) && num > 0) {
      onRecordPayment(payingDebtId, {
        amount: num,
        date: paymentDate,
        notes: paymentNotes.trim(),
      });
      setPayingDebtId(null);
      setPaymentAmount('');
    }
  };

  const debtReductionProgress =
    totalOriginal > 0 ? Math.round(((totalOriginal - totalRemaining) / totalOriginal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Debt Management & Systematic Elimination
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare Debt Snowball vs Debt Avalanche, track payments, and systematically become debt-free
          </p>
        </div>
        <button
          id="add-debt-main-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Debt / Loan
        </button>
      </div>

      {/* Overview Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Debt Remaining</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(totalRemaining)}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Original: {formatPKR(totalOriginal)}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Minimum Required</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(totalMonthlyMinimum)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Across {state.debts.filter((d) => d.remainingAmount > 0).length} active balances
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Payoff Progress</span>
          <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {debtReductionProgress}% Paid Off
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-emerald-600 transition-all"
              style={{ width: `${debtReductionProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Strategy Comparison Section: Snowball vs Avalanche */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Debt Payoff Strategies: Snowball vs. Avalanche
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your preferred methodology as prescribed in the Financial Stress framework
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Extra Monthly Snowball:
            </span>
            <select
              value={extraMonthlyPayment}
              onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="5000">PKR 5,000/mo extra</option>
              <option value="10000">PKR 10,000/mo extra</option>
              <option value="20000">PKR 20,000/mo extra</option>
              <option value="35000">PKR 35,000/mo extra</option>
              <option value="50000">PKR 50,000/mo extra</option>
            </select>
          </div>
        </div>

        {/* Strategy Explanations Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Debt Snowball */}
          <div
            onClick={() => setActiveStrategy('snowball')}
            className={`cursor-pointer rounded-xl border p-4 transition ${
              activeStrategy === 'snowball'
                ? 'border-blue-500 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30'
                : 'border-slate-200 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-850 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-sm text-blue-900 dark:text-blue-200">
                <Snowflake className="h-4 w-4 text-blue-600" />
                Debt Snowball Method (Behavioral)
              </span>
              {activeStrategy === 'snowball' && (
                <span className="rounded bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                  Active View
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>How it works:</strong> Pay minimums on all debts, then put every extra rupee toward the{' '}
              <strong>smallest balance first</strong>, regardless of interest rate. Once that is eliminated, roll its payment into the next smallest.
            </p>
            <div className="mt-2 text-[11px] font-medium text-blue-800 dark:text-blue-300">
              💡 <strong>Why choose this:</strong> Creates quick, tangible psychological victories early on. Perfect if you need emotional momentum and stress relief.
            </div>
          </div>

          {/* Debt Avalanche */}
          <div
            onClick={() => setActiveStrategy('avalanche')}
            className={`cursor-pointer rounded-xl border p-4 transition ${
              activeStrategy === 'avalanche'
                ? 'border-amber-500 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30'
                : 'border-slate-200 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-850 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-sm text-amber-900 dark:text-amber-200">
                <Flame className="h-4 w-4 text-amber-600" />
                Debt Avalanche Method (Mathematical)
              </span>
              {activeStrategy === 'avalanche' && (
                <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                  Active View
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>How it works:</strong> Pay minimums on all debts, then direct every extra rupee toward the debt with the{' '}
              <strong>highest interest rate first</strong> (e.g. credit cards at 28%).
            </p>
            <div className="mt-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              💡 <strong>Why choose this:</strong> Saves the absolute most money in interest charges over time. Mathematically optimal.
            </div>
          </div>
        </div>

        {/* Prioritized Action Order */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
            Recommended Payoff Sequence under{' '}
            <span className="uppercase text-emerald-600 dark:text-emerald-400">
              {activeStrategy}
            </span>{' '}
            (Estimated complete payoff in ~{strategies.estimatedMonths} months):
          </h4>
          <div className="space-y-2">
            {(activeStrategy === 'snowball' ? strategies.snowballOrder : strategies.avalancheOrder).map(
              (debt, idx) => (
                <div
                  key={debt.id}
                  className="flex items-center justify-between rounded-lg bg-white p-3 text-xs shadow-2xs dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[10px] dark:bg-white dark:text-slate-900">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {debt.creditor}
                      </span>
                      <span className="ml-2 text-[11px] text-slate-400">
                        ({debt.interestRate}% interest • Min: {formatPKR(debt.minimumPayment)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatPKR(debt.remainingAmount)}
                    </span>
                    {idx === 0 && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Target #1 Focus!
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Debt List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.debts.map((debt) => {
          const paidOff = debt.originalAmount - debt.remainingAmount;
          const progressPct =
            debt.originalAmount > 0
              ? Math.min(100, Math.round((paidOff / debt.originalAmount) * 100))
              : 100;

          return (
            <div
              key={debt.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {debt.creditor}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Interest: {debt.interestRate}% • Due: {debt.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(debt)}
                      className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDebt(debt.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between text-xs">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {formatPKR(debt.remainingAmount)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    of {formatPKR(debt.originalAmount)}
                  </span>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>{progressPct}% cleared</span>
                  <span>Min: {formatPKR(debt.minimumPayment)}/mo</span>
                </div>

                {debt.notes && (
                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{debt.notes}"
                  </p>
                )}

                {/* Payment History Preview */}
                {debt.paymentHistory.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px]">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <History className="h-3 w-3" /> Recent Payments:
                    </span>
                    <div className="mt-1 space-y-1">
                      {debt.paymentHistory.slice(-2).map((p) => (
                        <div key={p.id} className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>{formatDate(p.date)}</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            -{formatPKR(p.amount)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action: Record Payment */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setPayingDebtId(debt.id);
                    setPaymentAmount(debt.minimumPayment.toString());
                    setPaymentDate(getCurrentDateStr());
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Record Payment
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Debt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingDebt ? 'Edit Debt Record' : 'Add New Debt or Loan'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Creditor / Loan Name *
                </label>
                <input
                  type="text"
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  placeholder="e.g. Bank Alfalah Credit Card, Meezan Auto Loan, Relative Qard Hasan"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Original Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    placeholder="e.g. 200000"
                    className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remaining Balance (PKR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={remainingAmount}
                    onChange={(e) => setRemainingAmount(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="0 for Qard Hasan"
                    className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Minimum Monthly Payment (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minimumPayment}
                    onChange={(e) => setMinimumPayment(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="e.g. 15th of every month or 2026-11-30"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prioritize payoff before year end"
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
                  className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                >
                  {editingDebt ? 'Save Changes' : 'Record Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingDebtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Record Debt Payment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              This amount will be deducted directly from the remaining balance.
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (PKR) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid online via bank app"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingDebtId(null)}
                  className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
