import { describe, it, expect } from 'vitest';
import { syncSignature } from '../syncState';
import { AppState } from '../../types/finance';

const book = (over: Partial<AppState> = {}): AppState => ({
  selectedMonth: '2026-09',
  budgetConfig: { needsPercent: 50, wantsPercent: 30, savingsDebtPercent: 20, categoryBudgets: { Food: 1000 } as any },
  incomes: [{ id: 'i1', source: 'Salary', amount: 100000, date: '2026-09-01', createdAt: '' }],
  expenses: [],
  savingsGoals: [],
  debts: [],
  netWorthItems: [],
  monthlyReviewNotes: {},
  ...over,
});

describe('syncSignature', () => {
  it('ignores the month being viewed', () => {
    // A month switch must not trigger a cloud write or move other devices.
    expect(syncSignature(book({ selectedMonth: '2026-01' }))).toBe(
      syncSignature(book({ selectedMonth: '2026-09' }))
    );
  });

  it('treats the cloud echo of a write as unchanged', () => {
    // Firestore hands maps back with keys sorted and undefined fields dropped.
    const local = book({
      expenses: [
        { id: 'e1', category: 'Food', type: 'Essential', amount: 500, date: '2026-09-02', createdAt: '', notes: undefined, recurringFrequency: undefined },
      ],
    });
    const fromCloud = JSON.parse(JSON.stringify({
      monthlyReviewNotes: {},
      netWorthItems: [],
      debts: [],
      savingsGoals: [],
      expenses: [{ type: 'Essential', createdAt: '', date: '2026-09-02', amount: 500, category: 'Food', id: 'e1' }],
      incomes: [{ source: 'Salary', id: 'i1', date: '2026-09-01', createdAt: '', amount: 100000 }],
      budgetConfig: { categoryBudgets: { Food: 1000 }, wantsPercent: 30, savingsDebtPercent: 20, needsPercent: 50 },
      selectedMonth: '2026-11',
    }));
    expect(syncSignature(fromCloud)).toBe(syncSignature(local));
  });

  it('detects a real change to the records', () => {
    const changed = book({
      incomes: [{ id: 'i1', source: 'Salary', amount: 120000, date: '2026-09-01', createdAt: '' }],
    });
    expect(syncSignature(changed)).not.toBe(syncSignature(book()));
  });

  it('preserves record order, since order is meaningful', () => {
    const a = { id: 'a', source: 'Salary' as const, amount: 1, date: '2026-09-01', createdAt: '' };
    const b = { id: 'b', source: 'Salary' as const, amount: 2, date: '2026-09-01', createdAt: '' };
    expect(syncSignature(book({ incomes: [a, b] }))).not.toBe(syncSignature(book({ incomes: [b, a] })));
  });
});
