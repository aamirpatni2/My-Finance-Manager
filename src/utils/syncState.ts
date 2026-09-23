import { AppState } from '../types/finance';

// Firestore returns map keys sorted and drops undefined fields, so the same
// records come back in a different shape than they were written. Normalise
// before comparing, or every echo of our own write looks like a change.
function normalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = normalise(v);
    }
    return out;
  }
  return value;
}

// Fingerprint of the records worth syncing. selectedMonth is per-device view
// state: excluding it stops a month switch from firing a cloud write and from
// flipping every other signed-in device to the same month.
export function syncSignature(state: AppState): string {
  const { selectedMonth: _selectedMonth, ...records } = state;
  return JSON.stringify(normalise(records));
}
