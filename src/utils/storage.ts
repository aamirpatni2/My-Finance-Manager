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

export function getHistoricalMonthStr(monthsAgo: number): string {
  const current = getCurrentMonthStr();
  const [yStr, mStr] = current.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) - monthsAgo;
  while (m <= 0) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export const sampleInitialState: AppState = {
  selectedMonth: getCurrentMonthStr(),
  theme: 'light',
  budgetConfig: defaultBudgetConfig,
  incomes: [
    // Current Month Incomes
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
    // Historical Incomes for Last 5 Months
    {
      id: 'hist-inc-1',
      source: 'Salary',
      amount: 195000,
      date: `${getHistoricalMonthStr(1)}-01`,
      notes: 'Monthly corporate salary',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-2',
      source: 'Freelance',
      amount: 40000,
      date: `${getHistoricalMonthStr(1)}-12`,
      notes: 'Consulting milestone',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-3',
      source: 'Salary',
      amount: 195000,
      date: `${getHistoricalMonthStr(2)}-01`,
      notes: 'Monthly corporate salary',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-4',
      source: 'Freelance',
      amount: 55000,
      date: `${getHistoricalMonthStr(2)}-10`,
      notes: 'Mid-year consulting bonuses & extra projects',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-5',
      source: 'Business',
      amount: 25000,
      date: `${getHistoricalMonthStr(2)}-18`,
      notes: 'Trade seasonal distribution',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-6',
      source: 'Salary',
      amount: 195000,
      date: `${getHistoricalMonthStr(3)}-01`,
      notes: 'Monthly corporate salary',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-7',
      source: 'Freelance',
      amount: 35000,
      date: `${getHistoricalMonthStr(3)}-14`,
      notes: 'Client retainer',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-8',
      source: 'Salary',
      amount: 195000,
      date: `${getHistoricalMonthStr(4)}-01`,
      notes: 'Monthly corporate salary',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-9',
      source: 'Freelance',
      amount: 42000,
      date: `${getHistoricalMonthStr(4)}-11`,
      notes: 'Advisory project',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-10',
      source: 'Salary',
      amount: 195000,
      date: `${getHistoricalMonthStr(5)}-01`,
      notes: 'Monthly corporate salary',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hist-inc-11',
      source: 'Freelance',
      amount: 38000,
      date: `${getHistoricalMonthStr(5)}-15`,
      notes: 'Web application review contract',
      createdAt: new Date().toISOString(),
    },
  ],
  expenses: [
    // Current Month Expenses
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

    // Historical Expenses: Month -1 (August - Academic Resumption & Fees)
    { id: 'h-e1-1', category: 'Rent/Housing', type: 'Essential', amount: 48000, date: `${getHistoricalMonthStr(1)}-02`, notes: 'House rent', createdAt: new Date().toISOString() },
    { id: 'h-e1-2', category: 'Food', type: 'Essential', amount: 36000, date: `${getHistoricalMonthStr(1)}-05`, notes: 'Monthly groceries', createdAt: new Date().toISOString() },
    { id: 'h-e1-3', category: 'Utilities', type: 'Essential', amount: 34000, date: `${getHistoricalMonthStr(1)}-07`, notes: 'Electricity bill (summer tariff)', createdAt: new Date().toISOString() },
    { id: 'h-e1-4', category: 'Transport', type: 'Essential', amount: 16000, date: `${getHistoricalMonthStr(1)}-09`, notes: 'Commute & fuel', createdAt: new Date().toISOString() },
    { id: 'h-e1-5', category: 'Education', type: 'Essential', amount: 28000, date: `${getHistoricalMonthStr(1)}-10`, notes: 'Academic reopening, term registration & uniforms', createdAt: new Date().toISOString() },
    { id: 'h-e1-6', category: 'Medicine', type: 'Essential', amount: 8500, date: `${getHistoricalMonthStr(1)}-12`, notes: 'Routine healthcare', createdAt: new Date().toISOString() },
    { id: 'h-e1-7', category: 'Family', type: 'Essential', amount: 11000, date: `${getHistoricalMonthStr(1)}-14`, notes: 'Family assistance', createdAt: new Date().toISOString() },
    { id: 'h-e1-8', category: 'Shopping', type: 'Want', amount: 10000, date: `${getHistoricalMonthStr(1)}-18`, notes: 'School bags & stationery supplies', createdAt: new Date().toISOString() },
    { id: 'h-e1-9', category: 'Entertainment', type: 'Want', amount: 7000, date: `${getHistoricalMonthStr(1)}-22`, notes: 'Family dining', createdAt: new Date().toISOString() },

    // Historical Expenses: Month -2 (July - Summer Peak & Festival Surge)
    { id: 'h-e2-1', category: 'Rent/Housing', type: 'Essential', amount: 48000, date: `${getHistoricalMonthStr(2)}-02`, notes: 'House rent', createdAt: new Date().toISOString() },
    { id: 'h-e2-2', category: 'Food', type: 'Essential', amount: 42000, date: `${getHistoricalMonthStr(2)}-05`, notes: 'Holiday feasts & extended family gatherings', createdAt: new Date().toISOString() },
    { id: 'h-e2-3', category: 'Utilities', type: 'Essential', amount: 46000, date: `${getHistoricalMonthStr(2)}-07`, notes: 'Peak summer electricity (dual AC units & heatwave tariff)', createdAt: new Date().toISOString() },
    { id: 'h-e2-4', category: 'Transport', type: 'Essential', amount: 18000, date: `${getHistoricalMonthStr(2)}-09`, notes: 'Summer travel & holiday fuel', createdAt: new Date().toISOString() },
    { id: 'h-e2-5', category: 'Education', type: 'Essential', amount: 18000, date: `${getHistoricalMonthStr(2)}-10`, notes: 'Monthly tuition reserve', createdAt: new Date().toISOString() },
    { id: 'h-e2-6', category: 'Medicine', type: 'Essential', amount: 9000, date: `${getHistoricalMonthStr(2)}-12`, notes: 'Routine healthcare', createdAt: new Date().toISOString() },
    { id: 'h-e2-7', category: 'Family', type: 'Essential', amount: 16000, date: `${getHistoricalMonthStr(2)}-15`, notes: 'Gifting and holiday support for relatives', createdAt: new Date().toISOString() },
    { id: 'h-e2-8', category: 'Shopping', type: 'Want', amount: 28000, date: `${getHistoricalMonthStr(2)}-18`, notes: 'Seasonal celebratory wardrobe, footwear & home upgrades', createdAt: new Date().toISOString() },
    { id: 'h-e2-9', category: 'Entertainment', type: 'Want', amount: 13000, date: `${getHistoricalMonthStr(2)}-23`, notes: 'Holiday family outings & restaurant visits', createdAt: new Date().toISOString() },

    // Historical Expenses: Month -3 (June - Summer Tariffs Onset)
    { id: 'h-e3-1', category: 'Rent/Housing', type: 'Essential', amount: 48000, date: `${getHistoricalMonthStr(3)}-02`, notes: 'House rent', createdAt: new Date().toISOString() },
    { id: 'h-e3-2', category: 'Food', type: 'Essential', amount: 37000, date: `${getHistoricalMonthStr(3)}-05`, notes: 'Monthly groceries', createdAt: new Date().toISOString() },
    { id: 'h-e3-3', category: 'Utilities', type: 'Essential', amount: 39000, date: `${getHistoricalMonthStr(3)}-07`, notes: 'Summer AC cooling tariff onset', createdAt: new Date().toISOString() },
    { id: 'h-e3-4', category: 'Transport', type: 'Essential', amount: 16500, date: `${getHistoricalMonthStr(3)}-09`, notes: 'Commuting & petrol', createdAt: new Date().toISOString() },
    { id: 'h-e3-5', category: 'Education', type: 'Essential', amount: 18000, date: `${getHistoricalMonthStr(3)}-10`, notes: 'Children school fees', createdAt: new Date().toISOString() },
    { id: 'h-e3-6', category: 'Medicine', type: 'Essential', amount: 8000, date: `${getHistoricalMonthStr(3)}-12`, notes: 'Routine medication', createdAt: new Date().toISOString() },
    { id: 'h-e3-7', category: 'Family', type: 'Essential', amount: 12000, date: `${getHistoricalMonthStr(3)}-14`, notes: 'Family support', createdAt: new Date().toISOString() },
    { id: 'h-e3-8', category: 'Shopping', type: 'Want', amount: 12000, date: `${getHistoricalMonthStr(3)}-18`, notes: 'Summer clothing essentials', createdAt: new Date().toISOString() },
    { id: 'h-e3-9', category: 'Entertainment', type: 'Want', amount: 9500, date: `${getHistoricalMonthStr(3)}-21`, notes: 'Weekend dining', createdAt: new Date().toISOString() },

    // Historical Expenses: Month -4 (May - Moderate Transition)
    { id: 'h-e4-1', category: 'Rent/Housing', type: 'Essential', amount: 48000, date: `${getHistoricalMonthStr(4)}-02`, notes: 'House rent', createdAt: new Date().toISOString() },
    { id: 'h-e4-2', category: 'Food', type: 'Essential', amount: 35000, date: `${getHistoricalMonthStr(4)}-05`, notes: 'Monthly groceries', createdAt: new Date().toISOString() },
    { id: 'h-e4-3', category: 'Utilities', type: 'Essential', amount: 23000, date: `${getHistoricalMonthStr(4)}-07`, notes: 'Moderate spring utilities bill', createdAt: new Date().toISOString() },
    { id: 'h-e4-4', category: 'Transport', type: 'Essential', amount: 16000, date: `${getHistoricalMonthStr(4)}-09`, notes: 'Petrol & maintenance', createdAt: new Date().toISOString() },
    { id: 'h-e4-5', category: 'Education', type: 'Essential', amount: 18000, date: `${getHistoricalMonthStr(4)}-10`, notes: 'Children school fees', createdAt: new Date().toISOString() },
    { id: 'h-e4-6', category: 'Medicine', type: 'Essential', amount: 7500, date: `${getHistoricalMonthStr(4)}-12`, notes: 'Medical maintenance', createdAt: new Date().toISOString() },
    { id: 'h-e4-7', category: 'Family', type: 'Essential', amount: 10000, date: `${getHistoricalMonthStr(4)}-14`, notes: 'Family assistance', createdAt: new Date().toISOString() },
    { id: 'h-e4-8', category: 'Shopping', type: 'Want', amount: 9000, date: `${getHistoricalMonthStr(4)}-18`, notes: 'Minor apparel', createdAt: new Date().toISOString() },
    { id: 'h-e4-9', category: 'Entertainment', type: 'Want', amount: 7500, date: `${getHistoricalMonthStr(4)}-20`, notes: 'Dining out', createdAt: new Date().toISOString() },

    // Historical Expenses: Month -5 (April - Pleasant Spring Low Baseline)
    { id: 'h-e5-1', category: 'Rent/Housing', type: 'Essential', amount: 48000, date: `${getHistoricalMonthStr(5)}-02`, notes: 'House rent', createdAt: new Date().toISOString() },
    { id: 'h-e5-2', category: 'Food', type: 'Essential', amount: 34000, date: `${getHistoricalMonthStr(5)}-05`, notes: 'Standard groceries', createdAt: new Date().toISOString() },
    { id: 'h-e5-3', category: 'Utilities', type: 'Essential', amount: 16000, date: `${getHistoricalMonthStr(5)}-07`, notes: 'Low spring electricity bill (no AC/cooling needed)', createdAt: new Date().toISOString() },
    { id: 'h-e5-4', category: 'Transport', type: 'Essential', amount: 15000, date: `${getHistoricalMonthStr(5)}-09`, notes: 'Fuel & routine maintenance', createdAt: new Date().toISOString() },
    { id: 'h-e5-5', category: 'Education', type: 'Essential', amount: 18000, date: `${getHistoricalMonthStr(5)}-10`, notes: 'Children school fees', createdAt: new Date().toISOString() },
    { id: 'h-e5-6', category: 'Medicine', type: 'Essential', amount: 7000, date: `${getHistoricalMonthStr(5)}-12`, notes: 'Medical pharmacy', createdAt: new Date().toISOString() },
    { id: 'h-e5-7', category: 'Family', type: 'Essential', amount: 10000, date: `${getHistoricalMonthStr(5)}-14`, notes: 'Family support', createdAt: new Date().toISOString() },
    { id: 'h-e5-8', category: 'Shopping', type: 'Want', amount: 8000, date: `${getHistoricalMonthStr(5)}-18`, notes: 'Household items', createdAt: new Date().toISOString() },
    { id: 'h-e5-9', category: 'Entertainment', type: 'Want', amount: 6000, date: `${getHistoricalMonthStr(5)}-21`, notes: 'Recreation', createdAt: new Date().toISOString() },
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

export const emptyInitialState: AppState = {
  selectedMonth: getCurrentMonthStr(),
  theme: 'light',
  budgetConfig: defaultBudgetConfig,
  incomes: [],
  expenses: [],
  savingsGoals: [],
  debts: [],
  netWorthItems: [],
  monthlyReviewNotes: {},
};

export function createEmptyState(): AppState {
  const fresh: AppState = {
    ...emptyInitialState,
    selectedMonth: getCurrentMonthStr(),
    budgetConfig: {
      ...defaultBudgetConfig,
      categoryBudgets: { ...defaultBudgetConfig.categoryBudgets },
    },
    monthlyReviewNotes: {},
  };
  saveAppState(fresh);
  return fresh;
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // No seeding here — onboarding asks the user to choose fresh vs sample data.
      return emptyInitialState;
    }
    const parsed = JSON.parse(raw);

    return {
      ...emptyInitialState,
      ...parsed,
      incomes: parsed.incomes || [],
      expenses: parsed.expenses || [],
      savingsGoals: parsed.savingsGoals || [],
      debts: parsed.debts || [],
      netWorthItems: parsed.netWorthItems || [],
      monthlyReviewNotes: parsed.monthlyReviewNotes || {},
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
    return emptyInitialState;
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
      if (!Array.isArray(parsed.incomes) || !Array.isArray(parsed.expenses) || !parsed.budgetConfig) {
        throw new Error('Invalid backup file structure.');
      }
      // Fill any missing collections so a partial backup cannot crash the calculations.
      onSuccess({
        ...emptyInitialState,
        ...parsed,
        incomes: parsed.incomes,
        expenses: parsed.expenses,
        savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [],
        debts: Array.isArray(parsed.debts) ? parsed.debts : [],
        netWorthItems: Array.isArray(parsed.netWorthItems) ? parsed.netWorthItems : [],
        monthlyReviewNotes: parsed.monthlyReviewNotes || {},
        selectedMonth: parsed.selectedMonth || getCurrentMonthStr(),
        budgetConfig: {
          ...defaultBudgetConfig,
          ...parsed.budgetConfig,
          categoryBudgets: {
            ...defaultBudgetConfig.categoryBudgets,
            ...(parsed.budgetConfig?.categoryBudgets || {}),
          },
        },
      } as AppState);
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
