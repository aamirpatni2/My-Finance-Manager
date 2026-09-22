import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyTotals,
  calculateNetWorth,
  calculateTotalDebt,
  calculateEmergencyFundTotal,
  calculateFinancialStress,
  calculateDebtStrategies,
  calculateZakat,
} from '../financialCalculations';
import { AppState } from '../../types/finance';

const state = (over: Partial<AppState> = {}): AppState => ({
  selectedMonth: '2026-09',
  budgetConfig: { needsPercent: 50, wantsPercent: 30, savingsDebtPercent: 20, categoryBudgets: {} as any },
  incomes: [],
  expenses: [],
  savingsGoals: [],
  debts: [],
  netWorthItems: [],
  monthlyReviewNotes: {},
  ...over,
});

const inc = (amount: number, date = '2026-09-01') => ({
  id: 'i' + Math.random(),
  source: 'Salary' as const,
  amount,
  date,
  createdAt: '',
});

const exp = (amount: number, type: 'Essential' | 'Want' = 'Essential', date = '2026-09-05') => ({
  id: 'e' + Math.random(),
  category: 'Food' as const,
  type,
  amount,
  date,
  createdAt: '',
});

describe('calculateMonthlyTotals', () => {
  it('sums only the selected month', () => {
    const s = state({
      incomes: [inc(100000, '2026-09-01'), inc(50000, '2026-08-01')],
      expenses: [exp(30000, 'Essential', '2026-09-05'), exp(9000, 'Want', '2026-08-05')],
    });
    const t = calculateMonthlyTotals(s, '2026-09');
    expect(t.totalIncome).toBe(100000);
    expect(t.totalExpenses).toBe(30000);
    expect(t.monthlySavings).toBe(70000);
    expect(t.savingsRate).toBe(70);
  });

  it('splits needs and wants', () => {
    const s = state({ expenses: [exp(30000, 'Essential'), exp(20000, 'Want')] });
    const t = calculateMonthlyTotals(s, '2026-09');
    expect(t.needsExpenses).toBe(30000);
    expect(t.wantsExpenses).toBe(20000);
  });

  it('does not report negative savings when overspending', () => {
    const s = state({ incomes: [inc(50000)], expenses: [exp(80000)] });
    expect(calculateMonthlyTotals(s, '2026-09').monthlySavings).toBe(0);
  });

  it('does not divide by zero with no income', () => {
    const t = calculateMonthlyTotals(state({ expenses: [exp(5000)] }), '2026-09');
    expect(t.savingsRate).toBe(0);
    expect(Number.isFinite(t.needsPercentage)).toBe(true);
  });

  it('ranks top categories by spend', () => {
    const s = state({
      expenses: [
        { ...exp(5000), category: 'Food' as const },
        { ...exp(20000), category: 'Transport' as const },
      ],
    });
    expect(calculateMonthlyTotals(s, '2026-09').topCategories[0].category).toBe('Transport');
  });
});

describe('calculateNetWorth', () => {
  it('subtracts liabilities from assets', () => {
    const s = state({
      netWorthItems: [
        { id: 'a', name: 'Cash', type: 'asset', category: 'Cash', amount: 500000, updatedAt: '' },
        { id: 'b', name: 'Loan', type: 'liability', category: 'Loans', amount: 200000, updatedAt: '' },
      ],
    });
    const n = calculateNetWorth(s);
    expect(n.totalAssets).toBe(500000);
    expect(n.totalLiabilities).toBe(200000);
    expect(n.netWorth).toBe(300000);
  });

  it('can go negative', () => {
    const s = state({
      netWorthItems: [{ id: 'b', name: 'Loan', type: 'liability', category: 'Loans', amount: 200000, updatedAt: '' }],
    });
    expect(calculateNetWorth(s).netWorth).toBe(-200000);
  });

  it('is zero for an empty book', () => {
    expect(calculateNetWorth(state()).netWorth).toBe(0);
  });
});

describe('calculateTotalDebt', () => {
  it('totals remaining balances and minimums', () => {
    const s = state({
      debts: [
        { id: 'd1', creditor: 'A', originalAmount: 100000, remainingAmount: 60000, interestRate: 20, minimumPayment: 5000, dueDate: '1st', paymentHistory: [], createdAt: '' },
        { id: 'd2', creditor: 'B', originalAmount: 50000, remainingAmount: 25000, interestRate: 0, minimumPayment: 2000, dueDate: '5th', paymentHistory: [], createdAt: '' },
      ],
    });
    const d = calculateTotalDebt(s);
    expect(d.totalRemaining).toBe(85000);
    expect(d.totalMonthlyMinimum).toBe(7000);
  });
});

describe('calculateEmergencyFundTotal', () => {
  it('prefers the flagged emergency fund goal', () => {
    const s = state({
      savingsGoals: [
        { id: 'g1', name: 'EF', targetAmount: 600000, currentAmount: 250000, deadline: '', isEmergencyFund: true, createdAt: '' },
        { id: 'g2', name: 'Car', targetAmount: 100000, currentAmount: 90000, deadline: '', createdAt: '' },
      ],
    });
    expect(calculateEmergencyFundTotal(s)).toBe(250000);
  });

  it('falls back to cash holdings when no goal is flagged', () => {
    const s = state({
      netWorthItems: [{ id: 'a', name: 'Cash in hand', type: 'asset', category: 'Cash', amount: 40000, updatedAt: '' }],
    });
    expect(calculateEmergencyFundTotal(s)).toBe(40000);
  });
});

describe('calculateFinancialStress', () => {
  it('stays inside its documented range', () => {
    const broke = calculateFinancialStress(
      state({ incomes: [inc(30000)], expenses: [exp(90000)] }),
      '2026-09'
    );
    expect(broke.score).toBeGreaterThanOrEqual(5);
    expect(broke.score).toBeLessThanOrEqual(95);
    expect(['Calm', 'Low', 'Moderate', 'High', 'Severe']).toContain(broke.level);
  });

  it('scores a strained book worse than a healthy one', () => {
    const healthy = calculateFinancialStress(
      state({
        incomes: [inc(300000)],
        expenses: [exp(80000)],
        savingsGoals: [{ id: 'g', name: 'EF', targetAmount: 1, currentAmount: 900000, deadline: '', isEmergencyFund: true, createdAt: '' }],
      }),
      '2026-09'
    );
    const strained = calculateFinancialStress(
      state({
        incomes: [inc(100000)],
        expenses: [exp(120000)],
        debts: [{ id: 'd', creditor: 'CC', originalAmount: 200000, remainingAmount: 180000, interestRate: 30, minimumPayment: 45000, dueDate: '', paymentHistory: [], createdAt: '' }],
      }),
      '2026-09'
    );
    expect(strained.score).toBeGreaterThan(healthy.score);
  });

  it('survives an entirely empty book', () => {
    const s = calculateFinancialStress(state(), '2026-09');
    expect(Number.isFinite(s.score)).toBe(true);
    expect(Number.isFinite(s.emergencyFundMonths)).toBe(true);
    expect(s.factors).toHaveLength(5);
    expect(s.recommendations.length).toBeGreaterThan(0);
  });
});

describe('calculateDebtStrategies', () => {
  it('orders snowball by balance and avalanche by interest rate', () => {
    const debts = [
      { id: 'big-cheap', creditor: 'A', originalAmount: 0, remainingAmount: 500000, interestRate: 5, minimumPayment: 1000, dueDate: '', paymentHistory: [], createdAt: '' },
      { id: 'small-dear', creditor: 'B', originalAmount: 0, remainingAmount: 20000, interestRate: 40, minimumPayment: 1000, dueDate: '', paymentHistory: [], createdAt: '' },
    ];
    const r = calculateDebtStrategies(debts, 5000);
    expect(r.snowballOrder[0].id).toBe('small-dear');
    expect(r.avalancheOrder[0].id).toBe('small-dear');
    expect(r.totalRemaining).toBe(520000);
  });

  it('handles having no debt', () => {
    const r = calculateDebtStrategies([], 5000);
    expect(r.totalRemaining).toBe(0);
    expect(r.estimatedMonths).toBe(0);
  });

  it('ignores debts already cleared', () => {
    const r = calculateDebtStrategies(
      [{ id: 'paid', creditor: 'A', originalAmount: 10000, remainingAmount: 0, interestRate: 10, minimumPayment: 0, dueDate: '', paymentHistory: [], createdAt: '' }],
      1000
    );
    expect(r.snowballOrder).toHaveLength(0);
  });
});

describe('calculateZakat', () => {
  it('charges 2.5% once nisab is met', () => {
    const s = state({
      netWorthItems: [{ id: 'a', name: 'Gold', type: 'asset', category: 'Gold/Silver', amount: 1000000, updatedAt: '' }],
    });
    const z = calculateZakat(s);
    expect(z.isEligible).toBe(true);
    expect(z.zakatDue).toBeCloseTo(25000, 0);
  });

  it('charges nothing below nisab', () => {
    const s = state({
      netWorthItems: [{ id: 'a', name: 'Cash', type: 'asset', category: 'Cash', amount: 1000, updatedAt: '' }],
    });
    const z = calculateZakat(s);
    expect(z.isEligible).toBe(false);
    expect(z.zakatDue).toBe(0);
  });

  it('never returns negative zakatable wealth', () => {
    const s = state({
      netWorthItems: [{ id: 'a', name: 'Cash', type: 'asset', category: 'Cash', amount: 1000, updatedAt: '' }],
      debts: [{ id: 'd', creditor: 'X', originalAmount: 0, remainingAmount: 0, interestRate: 0, minimumPayment: 999999, dueDate: '', paymentHistory: [], createdAt: '' }],
    });
    expect(calculateZakat(s).zakatableTotal).toBe(0);
  });
});
