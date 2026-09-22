import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { IncomeItem, IncomeSource, ExpenseItem, ExpenseCategory, ExpenseType } from '../types/finance';
import { getCurrentDateStr } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../constants/categories';

const INCOME_SOURCES: IncomeSource[] = ['Salary', 'Freelance', 'Business', 'Rental', 'Investment', 'Other'];

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncome: (item: Omit<IncomeItem, 'id' | 'createdAt'>) => void;
  onAddExpense: (item: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
}

// A single fast-entry surface for the most common action in the app: logging a transaction.
// Opens as a bottom sheet on mobile, a centered modal on desktop.
export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddIncome,
  onAddExpense,
}) => {
  const [mode, setMode] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<IncomeSource>('Salary');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [expenseType, setExpenseType] = useState<ExpenseType>('Essential');
  const [date, setDate] = useState(getCurrentDateStr());
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setAmount('');
    setNotes('');
    setDate(getCurrentDateStr());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    if (mode === 'income') {
      onAddIncome({ source, amount: numAmount, date, notes: notes || undefined });
    } else {
      onAddExpense({ category, type: expenseType, amount: numAmount, date, notes: notes || undefined });
    }
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Add</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('expense')}
            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition ${
              mode === 'expense'
                ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            <TrendingDown className="h-4 w-4" /> Expense
          </button>
          <button
            type="button"
            onClick={() => setMode('income')}
            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition ${
              mode === 'income'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Amount (PKR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {mode === 'income' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as IncomeSource)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Essential">Essential</option>
                  <option value="Want">Want</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Grocery run"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className={`w-full rounded-lg py-3 text-sm font-bold text-white shadow-sm transition ${
              mode === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            Add {mode === 'income' ? 'Income' : 'Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};
