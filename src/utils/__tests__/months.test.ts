import { describe, it, expect } from 'vitest';
import { buildMonthOptions } from '../months';

const NOW = new Date(2026, 8, 15); // September 2026

describe('buildMonthOptions', () => {
  it('offers the last 11 and next 3 months around today', () => {
    const months = buildMonthOptions(NOW, [], '2026-09');
    expect(months[0]).toBe('2025-10');
    expect(months[months.length - 1]).toBe('2026-12');
    expect(months).toHaveLength(15);
  });

  it('includes older months that hold records', () => {
    const months = buildMonthOptions(NOW, ['2024-03-10', '2026-09-01'], '2026-09');
    expect(months[0]).toBe('2024-03');
  });

  it('always includes the selected month, so the dropdown shows what is computed', () => {
    // Regression: a restored backup could select a month outside the window.
    expect(buildMonthOptions(NOW, [], '2023-01')).toContain('2023-01');
  });

  it('returns sorted, de-duplicated months and skips malformed dates', () => {
    const months = buildMonthOptions(NOW, ['2026-09-01', '2026-09-20', 'garbage', ''], '2026-09');
    expect(months.filter((m) => m === '2026-09')).toHaveLength(1);
    expect(months).not.toContain('garbage');
    expect([...months].sort()).toEqual(months);
  });
});
