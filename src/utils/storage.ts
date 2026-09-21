import { AppState, BudgetConfig } from '../types/finance';
import { getCurrentMonthStr } from './formatters';

const STORAGE_KEY = 'my_finance_manager_data_v1';

export const defaultBudgetConfig: BudgetConfig = {
  needsPercent: 50,
  wantsPercent: 30,
  savingsDebtPercent: 20,
  categoryBudgets: {
    'Rent/Housing': 50000,
    'Food': 40000,
    'Utilities': 25000,
    'Transport': 18000,
    'Medicine': 10000,
    'Education': 20000,
    'Family': 15000,
    'Work': 5000,
    'Insurance': 4000,
    'Shopping': 12000,
    'Entertainment': 8000,
    'Other': 5000,
  },
};

export const sampleInitialState: AppState = {
  selectedMonth: getCurrentMonthStr(),
  theme: 'light',
  budgetConfig: defaultBudgetConfig,
  incomes: [
    {
      id: 'inc-1',
      source: 'Salary',
      amount: 195000,
      date: `${getCurrentMonthStr()}-01`,
      notes: 'Monthly corporate salary (direct bank transfer)',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'inc-2',
      source: 'Freelance',
      amount: 45000,
      date: `${getCurrentMonthStr()}-10`,
      notes: 'Software consulting project payout',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'inc-3',
      source: 'Business',
      amount: 20000,
      date: `${getCurrentMonthStr()}-15`,
      notes: 'Family trade partnership distribution',
      createdAt: new Date().toISOString(),
    },
  ],
  expenses: [
    {
      id: 'exp-1',
      category: 'Rent/Housing',
      type: 'Essential',
      amount: 48000,
      date: `${getCurrentMonthStr()}-02`,
      notes: 'House rent',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'exp-2',
      category: 'Food',
      type: 'Essential',
      amount: 36500,
      date: `${getCurrentMonthStr()}-05`,
      notes: 'Monthly grocery, meat & staples',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-3',
      category: 'Utilities',
      type: 'Essential',
      amount: 28000,
      date: `${getCurrentMonthStr()}-07`,
      notes: 'Electricity bill (K-Electric/LESCO) & Gas',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'exp-4',
      category: 'Transport',
      type: 'Essential',
      amount: 16500,
      date: `${getCurrentMonthStr()}-09`,
      notes: 'Motorbike & car petrol and maintenance',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringFrequency: 'weekly',
    },
    {
      id: 'exp-5',
      category: 'Education',
      type: 'Essential',
      amount: 18000,
      date: `${getCurrentMonthStr()}-10`,
      notes: 'Children school fees & books',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'exp-6',
      category: 'Medicine',
      type: 'Essential',
      amount: 8500,
      date: `${getCurrentMonthStr()}-12`,
      notes: 'Parent routine medication & pharmacy',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'exp-7',
      category: 'Family',
      type: 'Essential',
      amount: 12000,
      date: `${getCurrentMonthStr()}-14`,
      notes: 'Support for extended family / Sila Rehmi',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-8',
      category: 'Shopping',
      type: 'Want',
      amount: 10500,
      date: `${getCurrentMonthStr()}-18`,
      notes: 'Casual seasonal clothing',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-9',
      category: 'Entertainment',
      type: 'Want',
      amount: 6500,
      date: `${getCurrentMonthStr()}-20`,
      notes: 'Weekend dining out with family',
      createdAt: new Date().toISOString(),
    },
  ],
  savingsGoals: [
    {
      id: 'sav-1',
      name: 'Emergency Fund (6 Months Essentials)',
      targetAmount: 600000,
      currentAmount: 280000,
      deadline: '2026-12-31',
      isEmergencyFund: true,
      notes: 'Reserved in Islamic profit-sharing savings account for unforeseen events',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sav-2',
      name: 'Children Higher Education',
      targetAmount: 500000,
      currentAmount: 160000,
      deadline: '2027-06-30',
      notes: 'Long-term educational corpus',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sav-3',
      name: 'Hajj / Umrah Fund',
      targetAmount: 800000,
      currentAmount: 320000,
      deadline: '2027-02-28',
      notes: 'Dedicated spiritual journey savings',
      createdAt: new Date().toISOString(),
    },
  ],
  debts: [
    {
      id: 'debt-1',
      creditor: 'Car Loan / Islamic Auto Financing',
      originalAmount: 850000,
      remainingAmount: 380000,
      interestRate: 14.5,
      minimumPayment: 22000,
      dueDate: '10th of every month',
      notes: 'Monthly auto installment',
      paymentHistory: [
        { id: 'p-1', amount: 22000, date: `${getCurrentMonthStr()}-10`, notes: 'On-time monthly payment' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'debt-2',
      creditor: 'Family Qard Hasan (Brother-in-law)',
      originalAmount: 150000,
      remainingAmount: 70000,
      interestRate: 0,
      minimumPayment: 15000,
      dueDate: 'End of month',
      notes: 'Interest-free family loan taken during house renovation',
      paymentHistory: [
        { id: 'p-2', amount: 15000, date: `${getCurrentMonthStr()}-01`, notes: 'Installment repaid' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'debt-3',
      creditor: 'Credit Card (Bank Alfalah)',
      originalAmount: 95000,
      remainingAmount: 42000,
      interestRate: 28.0,
      minimumPayment: 8000,
      dueDate: '25th of month',
      notes: 'High-interest card balance to eliminate promptly',
      paymentHistory: [],
      createdAt: new Date().toISOString(),
    },
  ],
  netWorthItems: [
    { id: 'nw-1', name: 'Cash in Hand & Wallet', type: 'asset', category: 'Cash', amount: 35000, updatedAt: new Date().toISOString() },
    { id: 'nw-2', name: 'Meezan Bank Checking Account', type: 'asset', category: 'Bank accounts', amount: 145000, updatedAt: new Date().toISOString() },
    { id: 'nw-3', name: 'Emergency Savings Account', type: 'asset', category: 'Bank accounts', amount: 280000, updatedAt: new Date().toISOString() },
    { id: 'nw-4', name: 'Mutual Funds / PSX Shariah Equities', type: 'asset', category: 'Investments', amount: 420000, updatedAt: new Date().toISOString() },
    { id: 'nw-5', name: 'Physical Gold (Jewelry/Coins 3 Tolas)', type: 'asset', category: 'Gold/Silver', amount: 690000, updatedAt: new Date().toISOString() },
    { id: 'nw-6', name: 'Residential Plot / Property Equity', type: 'asset', category: 'Property', amount: 4500000, updatedAt: new Date().toISOString() },
    { id: 'nw-7', name: 'Household Electronics & Valuables', type: 'asset', category: 'Other assets', amount: 350000, updatedAt: new Date().toISOString() },
    { id: 'nw-8', name: 'Remaining Car Financing', type: 'liability', category: 'Loans', amount: 380000, updatedAt: new Date().toISOString() },
    { id: 'nw-9', name: 'Credit Card Outstanding', type: 'liability', category: 'Credit cards', amount: 42000, updatedAt: new Date().toISOString() },
    { id: 'nw-10', name: 'Qard Hasan (Personal Debt)', type: 'liability', category: 'Other debts', amount: 70000, updatedAt: new Date().toISOString() },
  ],
  monthlyReviewNotes: {
    [getCurrentMonthStr()]:
      '1. Overspending: Noticed slightly elevated dining out in the 2nd week.\n2. Action for next month: Transfer 20% to emergency fund immediately when salary lands.\n3. Win: Cleared an extra PKR 15,000 on family Qard Hasan debt.',
  },
};

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAppState(sampleInitialState);
      return sampleInitialState;
    }
    const parsed = JSON.parse(raw);
    return {
      ...sampleInitialState,
      ...parsed,
      monthlyReviewNotes: {
        ...(sampleInitialState.monthlyReviewNotes || {}),
        ...(parsed.monthlyReviewNotes || {}),
      },
      budgetConfig: {
        ...defaultBudgetConfig,
        ...(parsed.budgetConfig || {}),
        categoryBudgets: {
          ...defaultBudgetConfig.categoryBudgets,
          ...(parsed.budgetConfig?.categoryBudgets || {}),
        },
      },
    };
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
    return sampleInitialState;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function exportDataAsJSON(state: AppState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `my-finance-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(state: AppState): void {
  exportDataAsJSON(state);
}

export function importDataFromJSON(
  file: File,
  onSuccess: (state: AppState) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      if (!parsed.incomes || !parsed.expenses || !parsed.budgetConfig) {
        throw new Error('Invalid backup file structure.');
      }
      onSuccess(parsed as AppState);
    } catch (err: any) {
      onError('Failed to parse backup JSON file: ' + err.message);
    }
  };
  reader.onerror = () => {
    onError('Failed to read file.');
  };
  reader.readAsText(file);
}

export function resetToSampleData(): AppState {
  saveAppState(sampleInitialState);
  return sampleInitialState;
}
