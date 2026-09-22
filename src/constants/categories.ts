import { ExpenseCategory } from '../types/finance';

// Kept out of ExpenseTab so importing the list does not drag the whole
// (large) tab component into another chunk and defeat code splitting.
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Medicine',
  'Rent/Housing',
  'Utilities',
  'Transport',
  'Work',
  'Insurance',
  'Education',
  'Family',
  'Shopping',
  'Entertainment',
  'Other',
];
