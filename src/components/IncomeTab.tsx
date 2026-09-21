import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Download,
  Filter,
  Briefcase,
  DollarSign,
  Calendar,
  Sparkles,
  Repeat,
  Zap,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import { AppState, IncomeItem, IncomeSource, RecurringFrequency } from '../types/finance';
import { formatPKR, formatDate, getCurrentDateStr, exportToCSV, formatMonthName } from '../utils/formatters';
import { detectPendingRecurring, getRecurringSummary } from '../utils/recurring';

interface IncomeTabProps {
  state: AppState;
  onAddIncome: (item: Omit<IncomeItem, 'id' | 'createdAt'>) => void;
  onUpdateIncome: (item: IncomeItem) => void;
  onDeleteIncome: (id: string) => void;
  onNavigateToSavings: () => void;
  onProcessRecurring?: (targetMonth: string) => void;
  onNavigateToRecurring?: () => void;
}

const SOURCES: IncomeSource[] = ['Salary', 'Freelance', 'Business', 'Rental', 'Investment', 'Other'];

export const IncomeTab: React.FC<IncomeTabProps> = ({
  state,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onNavigateToSavings,
  onProcessRecurring,
  onNavigateToRecurring,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);

  // Form states
  const [source, setSource] = useState<IncomeSource>('Salary');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentDateStr());
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterRecurring, setFilterRecurring] = useState<'all' | 'recurring' | 'onetime'>('all');
  const [viewScope, setViewScope] = useState<'month' | 'year' | 'all'>('month');

  // Show "Pay yourself first" celebration banner when an income is added
  const [showPayYourselfFirst, setShowPayYourselfFirst] = useState(false);
  const [recentIncomeAmount, setRecentIncomeAmount] = useState<number>(0);

  const selectedMonth = state.selectedMonth; // YYYY-MM
  const selectedYear = selectedMonth.split('-')[0];

  // Recurring summary
  const recurringSummary = getRecurringSummary(state.incomes, state.expenses);
  const pendingRecurring = detectPendingRecurring(state, selectedMonth);

  // Category counts within current time scope
  const scopedIncomes = state.incomes.filter((item) => {
    if (viewScope === 'month' && !item.date.startsWith(selectedMonth)) return false;
    if (viewScope === 'year' && !item.date.startsWith(selectedYear)) return false;
    return true;
  });

  const sourceCounts = SOURCES.reduce((acc, src) => {
    acc[src] = scopedIncomes.filter((i) => i.source === src).length;
    return acc;
  }, {} as Record<IncomeSource, number>);

  // Filtered income items
  const filteredIncomes = state.incomes.filter((item) => {
    if (viewScope === 'month' && !item.date.startsWith(selectedMonth)) return false;
    if (viewScope === 'year' && !item.date.startsWith(selectedYear)) return false;
    if (filterSource !== 'all' && item.source !== filterSource) return false;
    if (filterRecurring === 'recurring' && !item.isRecurring) return false;
    if (filterRecurring === 'onetime' && item.isRecurring) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchSource = item.source.toLowerCase().includes(q);
      const matchAmount = item.amount.toString().includes(q);
      const matchDate = item.date.includes(q);
      if (!matchNotes && !matchSource && !matchAmount && !matchDate) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Totals
  const monthlyTotal = state.incomes
    .filter((i) => i.date.startsWith(selectedMonth))
    .reduce((sum, i) => sum + i.amount, 0);

  const yearlyTotal = state.incomes
    .filter((i) => i.date.startsWith(selectedYear))
    .reduce((sum, i) => sum + i.amount, 0);

  const filteredTotal = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSource('Salary');
    setAmount('');
    setDate(getCurrentDateStr());
    setNotes('');
    setIsRecurring(false);
    setRecurringFrequency('monthly');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: IncomeItem) => {
    setEditingItem(item);
    setSource(item.source);
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
      onUpdateIncome({
        ...editingItem,
        source,
        amount: num,
        date,
        notes: notes.trim(),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
    } else {
      onAddIncome({
        source,
        amount: num,
        date,
        notes: notes.trim(),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
      // Trigger Pay Yourself First reminder
      setRecentIncomeAmount(num);
      setShowPayYourselfFirst(true);
    }
    setIsModalOpen(false);
  };

  const handleSyncPendingRecurring = () => {
    if (onProcessRecurring) {
      onProcessRecurring(selectedMonth);
    } else {
      pendingRecurring.pendingIncomes.forEach((item) => {
        onAddIncome(item);
      });
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Source', 'Amount (PKR)', 'Recurring', 'Frequency', 'Notes'],
      ...filteredIncomes.map((i) => [
        i.date,
        i.source,
        i.amount,
        i.isRecurring ? 'Yes' : 'No',
        i.isRecurring ? i.recurringFrequency || 'monthly' : '—',
        i.notes || '',
      ]),
    ];
    exportToCSV(`income-records-${viewScope}-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header & Summaries */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Income Records
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track and categorize all earnings in PKR with monthly and annual visibility
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
            id="add-income-main-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Income
          </button>
        </div>
      </div>

      {/* Pending Recurring Sync Banner */}
      {pendingRecurring.pendingIncomes.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/90 p-4 dark:border-indigo-800 dark:bg-indigo-950/60 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-xs shrink-0 mt-0.5">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <span>Automate Repetitive Income</span>
                  <span className="rounded-full bg-indigo-200/80 dark:bg-indigo-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-900 dark:text-indigo-100">
                    {pendingRecurring.pendingIncomes.length} due for {formatMonthName(selectedMonth)}
                  </span>
                </h4>
                <p className="text-xs text-indigo-800/90 dark:text-indigo-300 mt-0.5">
                  You have active recurring income rules ready to be populated for this month (e.g.{' '}
                  {pendingRecurring.pendingIncomes.map((i) => `${i.source}: ${formatPKR(i.amount)}`).join(', ')}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onNavigateToRecurring && (
                <button
                  onClick={onNavigateToRecurring}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700 transition"
                  title="View recurring calendar & automated processing history"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Calendar History
                </button>
              )}
              <button
                onClick={handleSyncPendingRecurring}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <Zap className="h-3.5 w-3.5" />
                Populate for {selectedMonth}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Yourself First Suggestion Banner */}
      {showPayYourselfFirst && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-800 dark:bg-emerald-950/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Pay Yourself First Principle
                </h4>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-300 mt-0.5 leading-relaxed">
                  You just recorded <strong>{formatPKR(recentIncomeAmount)}</strong>! In the Financial Stress guideline, allocating at least 20% (<strong>{formatPKR(recentIncomeAmount * 0.2)}</strong>) right away to your emergency fund or savings goals prevents lifestyle creep and unexpected shortfalls.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onNavigateToSavings}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Allocate to Goals
              </button>
              <button
                onClick={() => setShowPayYourselfFirst(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly, Yearly & Recurring Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Total ({selectedMonth})</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(monthlyTotal)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active selected month
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Yearly Total ({selectedYear})</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(yearlyTotal)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            All records in {selectedYear}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recurring Baseline</span>
            {onNavigateToRecurring && (
              <button
                onClick={onNavigateToRecurring}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Calendar &gt;
              </button>
            )}
          </div>
          <div className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatPKR(recurringSummary.monthlyRecIncome)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mo</span>
          </div>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
            {recurringSummary.recurringIncomeCount} automated streams
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filtered View Sum</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {formatPKR(filteredTotal)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {filteredIncomes.length} records matching filters
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 text-xs shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter:
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

            {/* Category / Source dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="income-category-filter" className="sr-only">Filter by Category</label>
              <select
                id="income-category-filter"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className={`rounded-lg border px-2.5 py-1 font-medium focus:outline-none transition ${
                  filterSource !== 'all'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <option value="all">All Categories ({scopedIncomes.length})</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s} ({sourceCounts[s] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Recurring filter */}
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
              id="income-search-input"
              placeholder="Search source, notes, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 font-medium text-slate-700 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition"
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
        {(searchQuery || filterSource !== 'all' || filterRecurring !== 'all') && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Matching: <strong className="text-slate-700 dark:text-slate-200">{filteredIncomes.length}</strong> {filteredIncomes.length === 1 ? 'item' : 'items'} ({formatPKR(filteredTotal)}) • Active filters:
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
            {filterSource !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Category: {filterSource}
                <button
                  type="button"
                  onClick={() => setFilterSource('all')}
                  className="hover:text-emerald-950 dark:hover:text-emerald-100 p-0.5"
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
                setFilterSource('all');
                setFilterRecurring('all');
              }}
              className="ml-auto font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-[11px] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Table of Incomes */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Source / Category</th>
                <th className="px-4 py-3 font-semibold">Type / Schedule</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                        {searchQuery || filterSource !== 'all' || filterRecurring !== 'all'
                          ? 'No matching income transactions found'
                          : 'No income records found for this period'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        {searchQuery || filterSource !== 'all' || filterRecurring !== 'all'
                          ? 'Try modifying your search keywords, clearing the category filter, or switching view scope to All Time.'
                          : 'Click "+ Add Income" above to log your salary, freelancing, or business earnings.'}
                      </p>
                      {(searchQuery || filterSource !== 'all' || filterRecurring !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterSource('all');
                            setFilterRecurring('all');
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
                        >
                          Clear Search & Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        <Briefcase className="h-3 w-3" />
                        {item.source}
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
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatPKR(item.amount)}
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
                          onClick={() => onDeleteIncome(item.id)}
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

      {/* Add / Edit Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingItem ? 'Edit Income Record' : 'Add New Income'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source *
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as IncomeSource)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
                    placeholder="e.g. 150000"
                    className="w-full rounded-lg border border-slate-300 p-2.5 pl-9 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date Received *
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
                  Notes / Description
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Monthly salary from company or client bonus"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Recurring Entry Controls */}
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
                      Recurring Income (Automate repetitive entry)
                    </span>
                  </label>
                  {isRecurring && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 rounded-full">
                      Automated
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Enable to automatically populate or schedule this income stream in future periods.
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
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {editingItem ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
