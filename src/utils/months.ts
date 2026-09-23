const toMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// A rolling window around today, plus every month that holds a record, plus the
// month currently selected. Without the last two, older history is unreachable,
// and a selected month outside the window makes the dropdown display a
// different month from the one the app is actually computing.
export function buildMonthOptions(now: Date, recordDates: string[], selectedMonth: string): string[] {
  const months = new Set<string>();
  for (let i = -11; i <= 3; i++) {
    months.add(toMonth(new Date(now.getFullYear(), now.getMonth() + i, 1)));
  }
  for (const date of recordDates) {
    const month = date?.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month)) months.add(month);
  }
  if (/^\d{4}-\d{2}$/.test(selectedMonth)) months.add(selectedMonth);
  return [...months].sort();
}
