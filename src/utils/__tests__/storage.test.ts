import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAppState, saveAppState, createEmptyState, importDataFromJSON } from '../storage';
import { AppState } from '../../types/finance';

const STORAGE_KEY = 'my_finance_manager_data_v1';

// Minimal in-memory localStorage; storage.ts touches it at call time, not import time.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
});

describe('loadAppState', () => {
  it('returns an empty book when nothing is stored', () => {
    const state = loadAppState();
    expect(state.incomes).toEqual([]);
    expect(state.expenses).toEqual([]);
    expect(state.netWorthItems).toEqual([]);
    expect(state.monthlyReviewNotes).toEqual({});
  });

  it('never injects sample records into a real user book', () => {
    // Regression: a book with under three months of history used to get demo
    // transactions merged in, corrupting every downstream calculation.
    const stored = {
      incomes: [{ id: 'i1', source: 'Salary', amount: 50000, date: '2026-09-01', createdAt: '' }],
      expenses: [{ id: 'e1', category: 'Food', type: 'Essential', amount: 9000, date: '2026-09-03', createdAt: '' }],
      budgetConfig: { needsPercent: 50, wantsPercent: 30, savingsDebtPercent: 20, categoryBudgets: {} },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const state = loadAppState();
    expect(state.incomes).toHaveLength(1);
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].id).toBe('e1');
    expect(state.monthlyReviewNotes).toEqual({});
  });

  it('fills collections missing from stored data instead of leaving them undefined', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ incomes: [], expenses: [], budgetConfig: { categoryBudgets: {} } })
    );
    const state = loadAppState();
    expect(Array.isArray(state.debts)).toBe(true);
    expect(Array.isArray(state.savingsGoals)).toBe(true);
    expect(Array.isArray(state.netWorthItems)).toBe(true);
  });

  it('falls back to an empty book rather than demo data on corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{ not json');
    const state = loadAppState();
    expect(state.incomes).toEqual([]);
    expect(state.expenses).toEqual([]);
  });

  it('keeps default category budgets for categories the stored config omits', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ incomes: [], expenses: [], budgetConfig: { categoryBudgets: { Food: 1 } } })
    );
    const state = loadAppState();
    expect(state.budgetConfig.categoryBudgets.Food).toBe(1);
    expect(state.budgetConfig.categoryBudgets['Rent/Housing']).toBeGreaterThan(0);
  });
});

describe('createEmptyState', () => {
  it('persists a clean book', () => {
    const state = createEmptyState();
    expect(state.incomes).toEqual([]);
    expect(state.debts).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).expenses).toEqual([]);
  });

  it('does not share budget config between calls', () => {
    const a = createEmptyState();
    a.budgetConfig.categoryBudgets.Food = 999;
    const b = createEmptyState();
    expect(b.budgetConfig.categoryBudgets.Food).not.toBe(999);
  });
});

describe('importDataFromJSON', () => {
  const asFile = (data: unknown) =>
    ({ /* FileReader is stubbed below, so only identity matters */ }) as File;

  const runImport = (payload: unknown) =>
    new Promise<{ state?: AppState; error?: string }>((resolve) => {
      class FakeReader {
        onload: ((e: any) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsText() {
          this.onload?.({ target: { result: typeof payload === 'string' ? payload : JSON.stringify(payload) } });
        }
      }
      vi.stubGlobal('FileReader', FakeReader as any);
      importDataFromJSON(
        asFile(payload),
        (state) => resolve({ state }),
        (error) => resolve({ error })
      );
    });

  it('backfills collections a partial backup omits', async () => {
    // Regression: missing arrays used to reach the calculations and crash them.
    const { state, error } = await runImport({
      incomes: [],
      expenses: [],
      budgetConfig: { categoryBudgets: {} },
    });
    expect(error).toBeUndefined();
    expect(state!.debts).toEqual([]);
    expect(state!.savingsGoals).toEqual([]);
    expect(state!.netWorthItems).toEqual([]);
    expect(state!.selectedMonth).toMatch(/^\d{4}-\d{2}$/);
  });

  it('rejects a file that is not a backup', async () => {
    const { error } = await runImport({ hello: 'world' });
    expect(error).toContain('Invalid backup file structure');
  });

  it('rejects malformed JSON', async () => {
    const { error } = await runImport('{ not json');
    expect(error).toBeTruthy();
  });

  it('rejects a backup whose collections are the wrong shape', async () => {
    const { error } = await runImport({ incomes: 'nope', expenses: [], budgetConfig: {} });
    expect(error).toContain('Invalid backup file structure');
  });
});

describe('saveAppState', () => {
  it('survives a storage quota failure without throwing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => saveAppState({ incomes: [] } as unknown as AppState)).not.toThrow();
  });
});
