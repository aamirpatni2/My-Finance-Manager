import React, { useState, useRef } from 'react';
import {
  Calendar,
  Sun,
  Moon,
  Download,
  Upload,
  RotateCcw,
  X,
  FileJson,
  Home,
  ArrowLeftRight,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import { TabType, AppState } from '../types/finance';
import { formatMonthName } from '../utils/formatters';
import { AuthBar } from './AuthBar';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetSample: () => void;
  currentState: AppState;
}

// Flat tab registry — still the source of truth for labels & routing.
export const NAV_TABS: Array<{ id: TabType; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expenses' },
  { id: 'recurring', label: 'Recurring' },
  { id: 'budget', label: 'Budget' },
  { id: 'savings', label: 'Savings & Emergency' },
  { id: 'debt', label: 'Debt Manager' },
  { id: 'networth', label: 'Net Worth' },
  { id: 'stress', label: 'Stress Check' },
  { id: 'review', label: 'Monthly Review' },
  { id: 'coach', label: 'AI Coach' },
  { id: 'islamic', label: 'Islamic Guidance' },
];

export interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tabs: TabType[];
}

// Simplified information architecture: 12 tabs collapsed into 4 destinations.
// Mobile uses these as the bottom tab bar; desktop uses them as the primary nav row.
export const NAV_GROUPS: NavGroup[] = [
  { id: 'home', label: 'Home', icon: Home, tabs: ['dashboard'] },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, tabs: ['income', 'expense', 'recurring'] },
  { id: 'plan', label: 'Plan', icon: PiggyBank, tabs: ['budget', 'savings', 'debt', 'networth'] },
  { id: 'insights', label: 'Insights', icon: Sparkles, tabs: ['stress', 'review', 'coach', 'islamic'] },
];

export function getGroupForTab(tab: TabType): NavGroup {
  return NAV_GROUPS.find((g) => g.tabs.includes(tab)) || NAV_GROUPS[0];
}

function labelFor(tab: TabType): string {
  return NAV_TABS.find((t) => t.id === tab)?.label || tab;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  selectedMonth,
  onChangeMonth,
  isDarkMode,
  onToggleDarkMode,
  onExportBackup,
  onImportBackup,
  onResetSample,
  currentState,
}) => {
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate list of available months (last 12 months + next 3 months)
  const monthOptions = React.useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = -11; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push(val);
    }
    return list;
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      setIsBackupModalOpen(false);
    }
  };

  const activeGroup = getGroupForTab(activeTab);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-bold text-base sm:text-lg">
              Rs
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  My Finance Manager
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  PKR
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Financial Stress Diagnostic & Wealth System
              </p>
            </div>
          </div>

          {/* Controls: Month Selector, Backup, Auth, Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Month Filter */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <Calendar className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                id="selected-month-select"
                aria-label="Select Financial Month"
                value={selectedMonth}
                onChange={(e) => onChangeMonth(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer max-w-[76px] sm:max-w-none"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m} className="dark:bg-slate-800 dark:text-slate-100">
                    {formatMonthName(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Google Auth & Firestore Cloud Sync */}
            <AuthBar currentState={currentState} />

            {/* Backup & CSV Modal Button */}
            <button
              id="backup-btn"
              onClick={() => setIsBackupModalOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Backup, Restore & Export Data"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Dark/Light Mode */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleDarkMode}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Primary Group Nav — desktop/tablet only; mobile uses the bottom tab bar instead */}
        <nav className="hidden md:flex space-x-1 pb-2 text-xs font-medium border-t border-slate-100 dark:border-slate-800/80 pt-2">
          {NAV_GROUPS.map((group) => {
            const isActive = activeGroup.id === group.id;
            const Icon = group.icon;
            return (
              <button
                key={group.id}
                onClick={() => onSelectTab(group.tabs[0])}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg transition font-semibold ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {group.label}
              </button>
            );
          })}
        </nav>

        {/* Sub-tab strip for the active group — visible on all breakpoints when the group has more than one tab */}
        {activeGroup.tabs.length > 1 && (
          <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none text-xs font-medium border-t border-slate-100 dark:border-slate-800/80 pt-2 md:border-t-0 md:pt-0">
            {activeGroup.tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  onClick={() => onSelectTab(tab)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition font-medium ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  {labelFor(tab)}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Backup, Restore & Sample Data Modal */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileJson className="h-5 w-5 text-emerald-600" />
                Data Backup & Management
              </h3>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Your financial records are stored securely and privately in your browser's local storage.
              Export regular backup files so you never lose your data.
            </p>

            <div className="space-y-3 text-xs">
              {/* Export Button */}
              <button
                onClick={() => {
                  onExportBackup();
                  setIsBackupModalOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Export Backup (JSON)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Download full data file to your device
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600">Download</span>
              </button>

              {/* Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Restore from Backup (JSON)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Upload previously exported backup file
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600">Select File</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />

              {/* Reset to Pakistani Sample Data */}
              <button
                onClick={() => {
                  onResetSample();
                  setIsBackupModalOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Load Sample Dataset (PKR)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Populates authentic sample household finances
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-600">Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
