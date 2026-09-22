import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Tag,
  ShieldCheck,
  Heart,
  Sliders,
  Repeat,
  Zap,
  Search,
  X,
  Calendar,
} from 'lucide-react';
import { AppState, ExpenseCategory, ExpenseItem, ExpenseType, RecurringFrequency } from '../types/finance';
import { formatPKR, formatDate, getCurrentDateStr, exportToCSV, formatMonthName } from '../utils/formatters';
import { detectPendingRecurring, getRecurringSummary } from '../utils/recurring';
import { EXPENSE_CATEGORIES } from '../constants/categories';

export { EXPENSE_CATEGORIES };

interface ExpenseTabProps {
  state: AppState;
  onAddExpense: (item: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (item: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToBudget: () => void;
  onProcessRecurring?: (targetMonth: string) => void;
  onNavigateToRecurring?: () => void;
}


export const ExpenseTab: React.FC<ExpenseTabProps> = ({
  state,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onNavigateToBudget,
  onProcessRecurring,
  onNavigateToRecurring,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [type, setType] = useState<ExpenseType>('Essential');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentDateStr());
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRecurring, setFilterRecurring] = useState<'all' | 'recurring' | 'onetime'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewScope, setViewScope] = useState<'month' | 'year' | 'all'>('month');

  const selectedMonth = state.selectedMonth; // YYYY-MM
  const selectedYear = selectedMonth.split('-')[0];

  // Recurring summaries & pending detection
  const recurringSummary = getRecurringSummary(state.incomes, state.expenses);
  const pendingRecurring = detectPendingRecurring(state, selectedMonth);

  // Category aggregate calculation for selectedMonth
  const categorySpendingMap: Record<ExpenseCategory, number> = {} as any;
  EXPENSE_CATEGORIES.forEach((cat) => {
    categorySpendingMap[cat] = 0;
  });

  const monthExpenses = state.expenses.filter((e) => e.date.startsWith(selectedMonth));
  monthExpenses.forEach((e) => {
    categorySpendingMap[e.category] = (categorySpendingMap[e.category] || 0) + e.amount;
  });

  const totalMonthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const essentialMonthExpense = monthExpenses
    .filter((e) => e.type === 'Essential')
    .reduce((sum, e) => sum + e.amount, 0);
  const wantsMonthExpense = monthExpenses
    .filter((e) => e.type === 'Want')
    .reduce((sum, e) => sum + e.amount, 0);

  // Category counts within current time scope
  const scopedExpenses = state.expenses.filter((item) => {
    if (viewScope === 'month' && !item.date.startsWith(selectedMonth)) return false;
    if (viewScope === 'year' && !item.date.startsWith(selectedYear)) return false;
    return true;
  });

  const categoryCounts = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = scopedExpenses.filter((e) => e.category === cat).length;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Filtered expense table list
  const filteredExpenses = state.expenses
    .filter((item) => {
      if (viewScope === 'month' && !item.date.startsWith(selectedMonth)) return false;
      if (viewScope === 'year' && !item.date.startsWith(selectedYear)) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterRecurring === 'recurring' && !item.isRecurring) return false;
      if (filterRecurring === 'onetime' && item.isRecurring) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNotes = item.notes?.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchType = item.type.toLowerCase().includes(q);
        const matchAmount = item.amount.toString().includes(q);
        const matchDate = item.date.includes(q);
        if (!matchNotes && !matchCategory && !matchType && !matchAmount && !matchDate) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredTotalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCategory('Food');
    setType('Essential');
    setAmount('');
    setDate(getCurrentDateStr());
    setNotes('');
    setIsRecurring(false);
    setRecurringFrequency('monthly');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExpenseItem) => {
    setEditingItem(item);
    setCategory(item.category);
    setType(item.type);
    setAmount(item.amount.toString());
    setDate(item.date);
    setNotes(item.notes || '');
    setIsRecurring(!!item.isRecurring);
    setRecurringFrequency(item.recurringFrequency || 'monthly');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    if (editingItem) {
      onUpdateExpense({
        ...editingItem,
        category,
        type,
        amount: num,
        date,
        notes: notes.trim(),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
    } else {
      onAddExpense({
        category,
        type,
        amount: num,
        date,
        notes: notes.trim(),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
    }
    setIsModalOpen(false);
  };

  const handleSyncPendingRecurring = () => {
    if (onProcessRecurring) {
      onProcessRecurring(selectedMonth);
    } else {
      pendingRecurring.pendingExpenses.forEach((item) => {
        onAddExpense(item);
      });
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Category', 'Classification', 'Amount (PKR)', 'Recurring', 'Frequency', 'Notes'],
      ...filteredExpenses.map((e) => [
        e.date,
        e.category,
        e.type,
        e.amount,
        e.isRecurring ? 'Yes' : 'No',
        e.isRecurring ? e.recurringFrequency || 'monthly' : '—',
        e.notes || '',
      ]),
    ];
    exportToCSV(`expense-records-${viewScope}-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  // Overspent categories
  const overspentList = EXPENSE_CATEGORIES.filter((cat) => {
    const budget = state.budgetConfig.categoryBudgets[cat] || 0;
    return budget > 0 && categorySpendingMap[cat] > budget;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expense Records
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Categorized expenses with Essential (Need) vs Want separation and budget alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            id="add-expense-main-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Pending Recurring Sync Banner */}
      {pendingRecurring.pendingExpenses.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 dark:border-rose-900/60 dark:bg-rose-950/60 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-rose-600 p-2 text-white shadow-xs shrink-0 mt-0.5">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-rose-950 dark:text-rose-200 flex items-center gap-2">
                  <span>Automate Repetitive Expenses</span>
                  <span className="rounded-full bg-rose-200/80 dark:bg-rose-800 px-2 py-0.5 text-[10px] font-semibold text-rose-900 dark:text-rose-100">
                    {pendingRecurring.pendingExpenses.length} bills due for {formatMonthName(selectedMonth)}
                  </span>
                </h4>
                <p className="text-xs text-rose-800/90 dark:text-rose-300 mt-0.5">
                  You have active recurring bill rules ready for this month (e.g.{' '}
                  {pendingRecurring.pendingExpenses.slice(0, 3).map((e) => `${e.category}: ${formatPKR(e.amount)}`).join(', ')}
                  {pendingRecurring.pendingExpenses.length > 3 ? '...' : ''}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onNavigateToRecurring && (
                <button
                  onClick={onNavigateToRecurring}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700 transition"
                  title="View recurring calendar & automated processing history"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Calendar History
                </button>
              )}
              <button
                onClick={handleSyncPendingRecurring}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
              >
                <Zap className="h-3.5 w-3.5" />
                Populate for {selectedMonth}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Monthly Expenses</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(totalMonthExpense)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {monthExpenses.length} transactions in {selectedMonth}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Needs (Essential)</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(essentialMonthExpense)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {totalMonthExpense > 0 ? ((essentialMonthExpense / totalMonthExpense) * 100).toFixed(0) : 0}% of expenses (Target: ~50%)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Wants (Discretionary)</span>
            <Heart className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(wantsMonthExpense)}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {totalMonthExpense > 0 ? ((wantsMonthExpense / totalMonthExpense) * 100).toFixed(0) : 0}% of expenses (Target: ≤30%)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Recurring Committed</span>
            <div className="flex items-center gap-1.5">
              {onNavigateToRecurring && (
                <button
                  onClick={onNavigateToRecurring}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Calendar &gt;
                </button>
              )}
              <Repeat className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatPKR(recurringSummary.monthlyRecExpense)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mo</span>
          </div>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
            {recurringSummary.recurringExpenseCount} automated rules active
          </span>
        </div>
      </div>

      {/* Category Budget vs Actual Overview Cards */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Category Spending vs Planned Budgets ({selectedMonth})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live alert indicators when spending exceeds your assigned limit
            </p>
          </div>
          <button
            onClick={onNavigateToBudget}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Sliders className="h-3.5 w-3.5" />
            Set Category Limits
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXPENSE_CATEGORIES.map((cat) => {
            const spent = categorySpendingMap[cat] || 0;
            const budget = state.budgetConfig.categoryBudgets[cat] || 0;
            const isOver = budget > 0 && spent > budget;
            const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

            return (
              <div
                key={cat}
                className={`rounded-lg border p-3 transition text-xs ${
                  isOver
                    ? 'border-rose-300 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/40'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                  {isOver ? (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-900 dark:bg-rose-900 dark:text-rose-100">
                      <AlertTriangle className="h-3 w-3" />
                      +{formatPKR(spent - budget)} Over
                    </span>
                  ) : budget > 0 ? (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {pct}% used
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">No limit set</span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatPKR(spent)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Budget: {budget > 0 ? formatPKR(budget) : '—'}
                  </span>
                </div>

                {budget > 0 && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isOver ? 'bg-rose-600' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 text-xs shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </span>

            {/* Scope buttons */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              <button
                onClick={() => setViewScope('month')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  viewScope === 'month'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setViewScope('year')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  viewScope === 'year'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                This Year
              </button>
              <button
                onClick={() => setViewScope('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  viewScope === 'all'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="expense-category-filter" className="sr-only">Filter by Category</label>
              <select
                id="expense-category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`rounded-lg border px-2.5 py-1 font-medium focus:outline-none transition ${
                  filterCategory !== 'all'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <option value="all">All Categories ({scopedExpenses.length})</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({categoryCounts[cat] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Essential vs Want Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="Essential">Essential (Need)</option>
              <option value="Want">Want (Discretionary)</option>
            </select>

            {/* Recurring Filter */}
            <select
              value={filterRecurring}
              onChange={(e) => setFilterRecurring(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Recurring & One-Time</option>
              <option value="recurring">🔁 Recurring Only</option>
              <option value="onetime">One-Time Only</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              id="expense-search-input"
              placeholder="Search category, notes, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 font-medium text-slate-700 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {(searchQuery || filterCategory !== 'all' || filterType !== 'all' || filterRecurring !== 'all') && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Matching: <strong className="text-slate-700 dark:text-slate-200">{filteredExpenses.length}</strong> {filteredExpenses.length === 1 ? 'item' : 'items'} ({formatPKR(filteredTotalExpense)}) • Active filters:
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Search: "{searchQuery}"
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-medium text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Category: {filterCategory}
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className="hover:text-rose-950 dark:hover:text-rose-100 p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Type: {filterType}
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className="hover:text-amber-950 dark:hover:text-amber-100 p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {filterRecurring !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {filterRecurring === 'recurring' ? 'Recurring Only' : 'One-Time Only'}
                <button
                  type="button"
                  onClick={() => setFilterRecurring('all')}
                  className="hover:text-indigo-950 dark:hover:text-indigo-100 p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterType('all');
                setFilterRecurring('all');
              }}
              className="ml-auto font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 text-[11px] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Expense List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Schedule</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                        {searchQuery || filterCategory !== 'all' || filterType !== 'all' || filterRecurring !== 'all'
                          ? 'No matching expense transactions found'
                          : 'No expense records found for this period'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        {searchQuery || filterCategory !== 'all' || filterType !== 'all' || filterRecurring !== 'all'
                          ? 'Try modifying your search keywords, clearing the category filter, or switching view scope to All Time.'
                          : 'Click "+ Add Expense" above to record household expenses or daily spending.'}
                      </p>
                      {(searchQuery || filterCategory !== 'all' || filterType !== 'all' || filterRecurring !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterCategory('all');
                            setFilterType('all');
                            setFilterRecurring('all');
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition"
                        >
                          Clear Search & Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                          item.type === 'Essential'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        }`}
                      >
                        {item.type === 'Essential' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <Heart className="h-3 w-3" />
                        )}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.isRecurring ? (
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                          <Repeat className="h-3 w-3" />
                          Recurring ({(item.recurringFrequency || 'monthly')})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">One-time</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500 dark:text-slate-400">
                      {item.notes || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-rose-600 dark:text-rose-400">
                      -{formatPKR(item.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(item.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingItem ? 'Edit Expense' : 'Add New Expense'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classification (Need vs Want) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('Essential')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 font-semibold transition ${
                      type === 'Essential'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Essential (Need)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Want')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 font-semibold transition ${
                      type === 'Want'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Heart className="h-4 w-4 text-amber-600" />
                    Want (Non-essential)
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {type === 'Essential'
                    ? 'Required for survival, health, family welfare, or basic livelihood.'
                    : 'Comfort, entertainment, upgrades, or discretionary spending.'}
                </p>
              </div>

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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full rounded-lg border border-slate-300 p-2.5 pl-9 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Merchant
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Weekly grocery at Imtiaz / Metro, or petrol refill"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Recurring Bill / Commitment Controls */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <Repeat className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      Recurring Expense (Automate repetitive bill)
                    </span>
                  </label>
                  {isRecurring && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 rounded-full">
                      Automated
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Ideal for fixed commitments like house rent, electricity, Wi-Fi, school tuition, or car insurance.
                </p>

                {isRecurring && (
                  <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Repeat Frequency *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setRecurringFrequency(freq)}
                          className={`py-1.5 px-2 rounded-lg font-medium text-xs capitalize transition border ${
                            recurringFrequency === freq
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-indigo-700 dark:text-indigo-300">
                      {recurringFrequency === 'monthly' && `Repeats on day ${date.split('-')[2] || '1'} of every month.`}
                      {recurringFrequency === 'weekly' && 'Repeats every 7 days on the selected day of the week.'}
                      {recurringFrequency === 'yearly' && 'Repeats annually in this same month.'}
                    </p>
                  </div>
                )}
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
                  className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
                >
                  {editingItem ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
