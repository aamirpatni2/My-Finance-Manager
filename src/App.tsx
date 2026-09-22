import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppState,
  TabType,
  IncomeItem,
  ExpenseItem,
  SavingsGoal,
  DebtItem,
  DebtPayment,
  NetWorthItem,
  BudgetConfig,
} from './types/finance';
import {
  loadAppState,
  saveAppState,
  exportDataAsJSON,
  importDataFromJSON,
  resetToSampleData,
  createEmptyState,
} from './utils/storage';
import { detectPendingRecurring } from './utils/recurring';
import { formatPKR, formatMonthName } from './utils/formatters';
import { auth } from './firebase/config';
import { saveFinancialStateToCloud } from './firebase/service';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { OnboardingTour } from './components/OnboardingTour';
import { DashboardTab } from './components/DashboardTab';
import { IncomeTab } from './components/IncomeTab';
import { ExpenseTab } from './components/ExpenseTab';
import { BudgetPlannerTab } from './components/BudgetPlannerTab';
import { SavingsTab } from './components/SavingsTab';
import { DebtManagerTab } from './components/DebtManagerTab';
import { NetWorthTab } from './components/NetWorthTab';
import { StressTab } from './components/StressTab';
import { ReviewTab } from './components/ReviewTab';
import { AICoachTab } from './components/AICoachTab';
import { IslamicGuidanceTab } from './components/IslamicGuidanceTab';
import { RecurringAutomationTab } from './components/RecurringAutomationTab';

const ONBOARDED_KEY = 'mfm_onboarded_v1';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const skipNextCloudPush = useRef(false);

  const [onboardingStage, setOnboardingStage] = useState<'welcome' | 'tour' | 'done'>(() => {
    try {
      return localStorage.getItem(ONBOARDED_KEY) ? 'done' : 'welcome';
    } catch {
      return 'done';
    }
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('mfm_theme') === 'dark' ||
        (!('mfm_theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  // Dark mode effect
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('mfm_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('mfm_theme', 'light');
    }
  }, [isDarkMode]);

  // Lock background scrolling while the welcome screen or tour is open
  useEffect(() => {
    if (onboardingStage === 'done') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [onboardingStage]);

  // Cloud State Hydration from Firestore
  const handleCloudStateSync = useCallback((cloudState: AppState) => {
    // Cloud-originated state must not be pushed straight back up, or the
    // snapshot listener and the auto-sync effect write to each other forever.
    skipNextCloudPush.current = true;
    setState(cloudState);
    saveAppState(cloudState);
  }, []);

  // Auto-sync state changes to Firestore when authenticated
  useEffect(() => {
    if (skipNextCloudPush.current) {
      skipNextCloudPush.current = false;
      return;
    }
    if (auth.currentUser) {
      const timer = setTimeout(() => {
        saveFinancialStateToCloud(auth.currentUser!.uid, state).catch((err) => {
          console.error('Auto cloud sync error:', err);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Persist state changes
  const updateState = (updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveAppState(next);
      return next;
    });
  };

  // Month navigation
  const handleMonthChange = (month: string) => {
    updateState((prev) => ({
      ...prev,
      selectedMonth: month,
    }));
  };

  // Income Handlers
  const handleAddIncome = (item: Omit<IncomeItem, 'id' | 'createdAt'>) => {
    updateState((prev) => ({
      ...prev,
      incomes: [
        ...prev.incomes,
        {
          ...item,
          id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleUpdateIncome = (item: IncomeItem) => {
    updateState((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => (i.id === item.id ? item : i)),
    }));
  };

  const handleDeleteIncome = (id: string) => {
    updateState((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((i) => i.id !== id),
    }));
  };

  // Expense Handlers
  const handleAddExpense = (item: Omit<ExpenseItem, 'id' | 'createdAt'>) => {
    updateState((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        {
          ...item,
          id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleUpdateExpense = (item: ExpenseItem) => {
    updateState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === item.id ? item : e)),
    }));
  };

  const handleDeleteExpense = (id: string) => {
    updateState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  // Budget Config Handler
  const handleUpdateBudgetConfig = (config: BudgetConfig) => {
    updateState((prev) => ({
      ...prev,
      budgetConfig: config,
    }));
  };

  // Savings Goal Handlers
  const handleAddSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    updateState((prev) => ({
      ...prev,
      savingsGoals: [
        ...prev.savingsGoals,
        {
          ...goal,
          id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleUpdateSavingsGoal = (goal: SavingsGoal) => {
    updateState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => (g.id === goal.id ? goal : g)),
    }));
  };

  const handleDeleteSavingsGoal = (id: string) => {
    updateState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
    }));
  };

  const handleDepositToGoal = (id: string, amount: number) => {
    updateState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) =>
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    }));
  };

  // Debt Handlers
  const handleAddDebt = (debt: Omit<DebtItem, 'id' | 'createdAt' | 'paymentHistory'>) => {
    updateState((prev) => ({
      ...prev,
      debts: [
        ...prev.debts,
        {
          ...debt,
          id: `debt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString(),
          paymentHistory: [],
        },
      ],
    }));
  };

  const handleUpdateDebt = (debt: DebtItem) => {
    updateState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === debt.id ? debt : d)),
    }));
  };

  const handleDeleteDebt = (id: string) => {
    updateState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  const handleRecordDebtPayment = (debtId: string, payment: Omit<DebtPayment, 'id'>) => {
    updateState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => {
        if (d.id !== debtId) return d;
        const newPayment: DebtPayment = {
          ...payment,
          id: `pay_${Date.now()}`,
        };
        const newRemaining = Math.max(0, d.remainingAmount - payment.amount);
        return {
          ...d,
          remainingAmount: newRemaining,
          paymentHistory: [...d.paymentHistory, newPayment],
        };
      }),
    }));
  };

  // Net Worth Handlers
  const handleAddNetWorthItem = (item: Omit<NetWorthItem, 'id' | 'updatedAt'>) => {
    updateState((prev) => ({
      ...prev,
      netWorthItems: [
        ...prev.netWorthItems,
        {
          ...item,
          id: `nw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleUpdateNetWorthItem = (item: NetWorthItem) => {
    updateState((prev) => ({
      ...prev,
      netWorthItems: prev.netWorthItems.map((n) => (n.id === item.id ? item : n)),
    }));
  };

  const handleDeleteNetWorthItem = (id: string) => {
    updateState((prev) => ({
      ...prev,
      netWorthItems: prev.netWorthItems.filter((n) => n.id !== id),
    }));
  };

  // Monthly Review Notes Handler
  const handleSaveReviewNotes = (notes: string) => {
    updateState((prev) => ({
      ...prev,
      monthlyReviewNotes: {
        ...prev.monthlyReviewNotes,
        [prev.selectedMonth]: notes,
      },
    }));
  };

  // Recurring Automation Handler
  const handleProcessRecurring = (targetMonth: string = state.selectedMonth) => {
    const pending = detectPendingRecurring(state, targetMonth);
    if (pending.totalCount === 0) return;

    // A weekly rule can produce four or five entries at once, so never insert silently.
    const incomeTotal = pending.pendingIncomes.reduce((sum, i) => sum + i.amount, 0);
    const expenseTotal = pending.pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const confirmed = window.confirm(
      `Add ${pending.totalCount} recurring ${pending.totalCount === 1 ? 'entry' : 'entries'} to ${formatMonthName(targetMonth)}?\n\n` +
        `Income: ${pending.pendingIncomes.length} entries — ${formatPKR(incomeTotal)}\n` +
        `Expenses: ${pending.pendingExpenses.length} entries — ${formatPKR(expenseTotal)}`
    );
    if (!confirmed) return;

    const newIncomes: IncomeItem[] = pending.pendingIncomes.map((item) => ({
      ...item,
      id: `inc_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    }));

    const newExpenses: ExpenseItem[] = pending.pendingExpenses.map((item) => ({
      ...item,
      id: `exp_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    }));

    updateState((prev) => ({
      ...prev,
      incomes: [...prev.incomes, ...newIncomes],
      expenses: [...prev.expenses, ...newExpenses],
    }));
  };

  // Backup & Restore
  const handleExportBackup = () => {
    exportDataAsJSON(state);
  };

  const handleImportBackup = (file: File) => {
    importDataFromJSON(
      file,
      (newState) => {
        setState(newState);
        saveAppState(newState);
      },
      (error) => {
        alert(error);
      }
    );
  };

  const handleResetSample = () => {
    if (
      window.confirm(
        'Reset to comprehensive sample Pakistani financial dataset? This will replace current records.'
      )
    ) {
      const sample = resetToSampleData();
      setState(sample);
    }
  };

  const markOnboarded = () => {
    try {
      localStorage.setItem(ONBOARDED_KEY, new Date().toISOString());
    } catch {
      // Private-mode browsers simply replay onboarding next visit.
    }
    setOnboardingStage('done');
  };

  const handleFinishOnboarding = (mode: 'fresh' | 'sample') => {
    const next = mode === 'sample' ? resetToSampleData() : createEmptyState();
    setState(next);
    setActiveTab('dashboard');
    markOnboarded();
  };

  const handleReplayTour = () => setOnboardingStage('tour');

  return (
    <AuthProvider currentState={state} onStateUpdateFromCloud={handleCloudStateSync}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        {/* Top Navigation & Subnav */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedMonth={state.selectedMonth}
          onChangeMonth={handleMonthChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetSample={handleResetSample}
          onReplayTour={handleReplayTour}
          currentState={state}
        />

        {/* Main Tab View Port */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            state={state}
            onNavigateTab={setActiveTab}
            onOpenAddIncome={() => setActiveTab('income')}
            onOpenAddExpense={() => setActiveTab('expense')}
          />
        )}

        {activeTab === 'income' && (
          <IncomeTab
            state={state}
            onAddIncome={handleAddIncome}
            onUpdateIncome={handleUpdateIncome}
            onDeleteIncome={handleDeleteIncome}
            onNavigateToSavings={() => setActiveTab('savings')}
            onProcessRecurring={handleProcessRecurring}
            onNavigateToRecurring={() => setActiveTab('recurring')}
          />
        )}

        {activeTab === 'expense' && (
          <ExpenseTab
            state={state}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onNavigateToBudget={() => setActiveTab('budget')}
            onProcessRecurring={handleProcessRecurring}
            onNavigateToRecurring={() => setActiveTab('recurring')}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringAutomationTab
            state={state}
            onProcessRecurring={handleProcessRecurring}
            onDeleteIncome={handleDeleteIncome}
            onDeleteExpense={handleDeleteExpense}
            onNavigateToIncome={() => setActiveTab('income')}
            onNavigateToExpense={() => setActiveTab('expense')}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetPlannerTab
            state={state}
            onUpdateBudgetConfig={handleUpdateBudgetConfig}
            onNavigateToExpenses={() => setActiveTab('expense')}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsTab
            state={state}
            onAddGoal={handleAddSavingsGoal}
            onUpdateGoal={handleUpdateSavingsGoal}
            onDeleteGoal={handleDeleteSavingsGoal}
            onDepositToGoal={handleDepositToGoal}
          />
        )}

        {activeTab === 'debt' && (
          <DebtManagerTab
            state={state}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
            onRecordPayment={handleRecordDebtPayment}
          />
        )}

        {activeTab === 'networth' && (
          <NetWorthTab
            state={state}
            onAddItem={handleAddNetWorthItem}
            onUpdateItem={handleUpdateNetWorthItem}
            onDeleteItem={handleDeleteNetWorthItem}
          />
        )}

        {activeTab === 'stress' && (
          <StressTab state={state} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'review' && (
          <ReviewTab state={state} onSaveNotes={handleSaveReviewNotes} />
        )}

        {activeTab === 'coach' && <AICoachTab state={state} />}

        {activeTab === 'islamic' && (
          <IslamicGuidanceTab state={state} onNavigateTab={setActiveTab} />
        )}
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>My Finance Manager</strong> • Grounded in the principles of the Financial Stress Guide
          </span>
          <span className="text-[11px] text-slate-400">
            Currency: Pakistani Rupee (PKR) • All calculations processed locally & privately
          </span>
        </div>
      </footer>

      {/* Mobile Primary Navigation & Quick Add */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
      />

      {/* First-run welcome & guided tour */}
      {onboardingStage === 'welcome' && (
        <WelcomeScreen onStartTour={() => setOnboardingStage('tour')} onSkip={markOnboarded} />
      )}
      {onboardingStage === 'tour' && (
        <OnboardingTour onFinish={handleFinishOnboarding} onClose={markOnboarded} />
      )}
    </div>
  </AuthProvider>
  );
}
