import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Building,
  Coins,
  Wallet,
  Landmark,
  Layers,
  Download,
} from 'lucide-react';
import {
  AppState,
  AssetCategory,
  LiabilityCategory,
  NetWorthItem,
} from '../types/finance';
import { calculateNetWorth } from '../utils/financialCalculations';
import { formatPKR, formatDate, exportToCSV } from '../utils/formatters';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface NetWorthTabProps {
  state: AppState;
  onAddItem: (item: Omit<NetWorthItem, 'id' | 'updatedAt'>) => void;
  onUpdateItem: (item: NetWorthItem) => void;
  onDeleteItem: (id: string) => void;
}

const ASSET_CATEGORIES: AssetCategory[] = [
  'Cash',
  'Bank accounts',
  'Investments',
  'Property',
  'Gold/Silver',
  'Other assets',
];

const LIABILITY_CATEGORIES: LiabilityCategory[] = [
  'Loans',
  'Credit cards',
  'Other debts',
];

const PIE_COLORS = [
  '#059669',
  '#0284c7',
  '#7c3aed',
  '#d97706',
  '#ea580c',
  '#475569',
  '#db2777',
];

export const NetWorthTab: React.FC<NetWorthTabProps> = ({
  state,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NetWorthItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'asset' | 'liability'>('asset');
  const [category, setCategory] = useState<string>('Cash');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(state);

  const assets = state.netWorthItems.filter((i) => i.type === 'asset');
  const liabilities = state.netWorthItems.filter((i) => i.type === 'liability');

  // Chart data for Asset allocation
  const assetChartData = ASSET_CATEGORIES.map((cat) => {
    const val = assets.filter((a) => a.category === cat).reduce((sum, a) => sum + a.amount, 0);
    return { name: cat, value: val };
  }).filter((item) => item.value > 0);

  const handleOpenAdd = (defaultType: 'asset' | 'liability') => {
    setEditingItem(null);
    setName('');
    setType(defaultType);
    setCategory(defaultType === 'asset' ? 'Cash' : 'Loans');
    setAmount('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: NetWorthItem) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setCategory(item.category);
    setAmount(item.amount.toString());
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return;

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        name: name.trim(),
        type,
        category: category as any,
        amount: num,
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddItem({
        name: name.trim(),
        type,
        category: category as any,
        amount: num,
        notes: notes.trim(),
      });
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Name', 'Type', 'Category', 'Amount (PKR)', 'Notes', 'Last Updated'],
      ...state.netWorthItems.map((i) => [
        i.name,
        i.type,
        i.category,
        i.amount,
        i.notes || '',
        i.updatedAt,
      ]),
    ];
    exportToCSV(`net-worth-statement-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Net Worth Statement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Net Worth = Total Assets (What You Own) - Total Liabilities (What You Owe)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Download className="h-4 w-4" />
            Export Statement
          </button>
          <button
            id="add-asset-btn"
            onClick={() => handleOpenAdd('asset')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </button>
          <button
            id="add-liability-btn"
            onClick={() => handleOpenAdd('liability')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Liability
          </button>
        </div>
      </div>

      {/* Main Net Worth Calculation Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Assets
            </span>
            <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatPKR(totalAssets)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {assets.length} recorded assets
            </span>
          </div>

          <div className="text-center md:border-x border-slate-200 dark:border-slate-800 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Liabilities
            </span>
            <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
              -{formatPKR(totalLiabilities)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {liabilities.length} recorded liabilities
            </span>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Calculated Net Worth
            </span>
            <div
              className={`mt-1 text-3xl font-black tracking-tight ${
                netWorth >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatPKR(netWorth)}
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {netWorth >= 0 ? '✓ Positive Wealth Foundation' : '⚠ Deficit - Focus on Debt Relief'}
            </span>
          </div>
        </div>
      </div>

      {/* Asset Allocation Chart & Stats */}
      {assetChartData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
            Asset Distribution by Class
          </h3>
          <div className="h-60 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatPKR(Number(val)), 'Asset Value']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Assets & Liabilities Side-by-Side Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets List */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Assets (Owned)</h3>
            </div>
            <button
              onClick={() => handleOpenAdd('asset')}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              + Add Asset
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {assets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No assets recorded yet.</div>
            ) : (
              assets.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.category} {item.notes ? `• ${item.notes}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPKR(item.amount)}
                    </span>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Liabilities List */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Liabilities (Owed)
              </h3>
            </div>
            <button
              onClick={() => handleOpenAdd('liability')}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              + Add Liability
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {liabilities.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No liabilities recorded. Debt-free!
              </div>
            ) : (
              liabilities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.category} {item.notes ? `• ${item.notes}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -{formatPKR(item.amount)}
                    </span>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Net Worth Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingItem ? 'Edit Statement Entry' : `Add New ${type === 'asset' ? 'Asset' : 'Liability'}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('asset');
                    setCategory('Cash');
                  }}
                  className={`rounded-lg border p-2 font-semibold transition ${
                    type === 'asset'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  Asset (Own)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('liability');
                    setCategory('Loans');
                  }}
                  className={`rounded-lg border p-2 font-semibold transition ${
                    type === 'liability'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  Liability (Owe)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name / Account *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meezan Savings Account, Gold Jewelry, Car Loan"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  {type === 'asset'
                    ? ASSET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    : LIABILITY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount in PKR *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Estimated market value"
                  className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {editingItem ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
