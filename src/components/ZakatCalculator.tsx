import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Info,
  Sparkles,
  HelpCircle,
  Landmark,
  Wallet,
  Building2,
  FileText,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppState, NetWorthItem, TabType } from '../types/finance';
import { formatPKR, formatDate } from '../utils/formatters';

interface ZakatCalculatorProps {
  state: AppState;
  onNavigateTab?: (tab: TabType) => void;
}

// Standard Pakistani benchmark rates
const DEFAULT_GOLD_RATE_PER_TOLA = 275000; // PKR per tola 24K
const DEFAULT_SILVER_RATE_PER_TOLA = 3100; // PKR per tola
const SILVER_NISAB_TOLAS = 52.5; // 612.36 grams
const GOLD_NISAB_TOLAS = 7.5; // 87.48 grams

export const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({
  state,
  onNavigateTab,
}) => {
  // Rates & Configuration
  const [goldRatePerTola, setGoldRatePerTola] = useState<number>(DEFAULT_GOLD_RATE_PER_TOLA);
  const [silverRatePerTola, setSilverRatePerTola] = useState<number>(DEFAULT_SILVER_RATE_PER_TOLA);
  const [nisabStandard, setNisabStandard] = useState<'silver' | 'gold'>('silver');
  const [calendarType, setCalendarType] = useState<'lunar' | 'solar'>('lunar');
  const [jewelryRuling, setJewelryRuling] = useState<'hanafi' | 'majority'>('hanafi');

  // Copied feedback state
  const [isCopied, setIsCopied] = useState(false);

  // Expandable sections
  const [showGoldDetails, setShowGoldDetails] = useState(true);
  const [showSavingsDetails, setShowSavingsDetails] = useState(true);
  const [showInvestmentsDetails, setShowInvestmentsDetails] = useState(false);
  const [showDeductionsDetails, setShowDeductionsDetails] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  // Extract from Net Worth
  const goldSilverNetWorthItems = useMemo(() => {
    return state.netWorthItems.filter(
      (item) => item.type === 'asset' && item.category === 'Gold/Silver'
    );
  }, [state.netWorthItems]);

  const cashBankNetWorthItems = useMemo(() => {
    return state.netWorthItems.filter(
      (item) =>
        item.type === 'asset' &&
        (item.category === 'Cash' || item.category === 'Bank accounts')
    );
  }, [state.netWorthItems]);

  const investmentNetWorthItems = useMemo(() => {
    return state.netWorthItems.filter(
      (item) => item.type === 'asset' && item.category === 'Investments'
    );
  }, [state.netWorthItems]);

  const totalImmediateDebtsFromTracker = useMemo(() => {
    // Current minimum monthly installments due now + short term credit card debts
    const debtsMin = state.debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const ccDebts = state.netWorthItems
      .filter((i) => i.type === 'liability' && i.category === 'Credit cards')
      .reduce((sum, i) => sum + i.amount, 0);
    return debtsMin + ccDebts;
  }, [state.debts, state.netWorthItems]);

  // Customizable item inclusion / values
  // Gold / Silver override states
  const initialGoldValue = useMemo(() => {
    return goldSilverNetWorthItems.reduce((sum, item) => sum + item.amount, 0);
  }, [goldSilverNetWorthItems]);

  const initialSavingsValue = useMemo(() => {
    return cashBankNetWorthItems.reduce((sum, item) => sum + item.amount, 0);
  }, [cashBankNetWorthItems]);

  const initialInvestmentsValue = useMemo(() => {
    return investmentNetWorthItems.reduce((sum, item) => sum + item.amount, 0);
  }, [investmentNetWorthItems]);

  const [goldSilverValue, setGoldSilverValue] = useState<number>(initialGoldValue);
  const [cashSavingsValue, setCashSavingsValue] = useState<number>(initialSavingsValue);
  const [investmentsValue, setInvestmentsValue] = useState<number>(initialInvestmentsValue);
  const [investmentZakatablePercent, setInvestmentZakatablePercent] = useState<number>(100);
  const [businessStockValue, setBusinessStockValue] = useState<number>(0);
  const [moneyOwedToYou, setMoneyOwedToYou] = useState<number>(0);
  const [immediateDebtsDeduction, setImmediateDebtsDeduction] = useState<number>(
    totalImmediateDebtsFromTracker
  );

  // Sync with Net Worth changes
  useEffect(() => {
    setGoldSilverValue(initialGoldValue);
  }, [initialGoldValue]);

  useEffect(() => {
    setCashSavingsValue(initialSavingsValue);
  }, [initialSavingsValue]);

  useEffect(() => {
    setInvestmentsValue(initialInvestmentsValue);
  }, [initialInvestmentsValue]);

  useEffect(() => {
    setImmediateDebtsDeduction(totalImmediateDebtsFromTracker);
  }, [totalImmediateDebtsFromTracker]);

  const handleResetToNetWorth = () => {
    setGoldSilverValue(initialGoldValue);
    setCashSavingsValue(initialSavingsValue);
    setInvestmentsValue(initialInvestmentsValue);
    setInvestmentZakatablePercent(100);
    setBusinessStockValue(0);
    setMoneyOwedToYou(0);
    setImmediateDebtsDeduction(totalImmediateDebtsFromTracker);
  };

  // Calculations
  const silverNisabPKR = SILVER_NISAB_TOLAS * silverRatePerTola;
  const goldNisabPKR = GOLD_NISAB_TOLAS * goldRatePerTola;
  const activeNisabThreshold = nisabStandard === 'silver' ? silverNisabPKR : goldNisabPKR;

  // Effective Gold & Silver value considering jewelry ruling
  // If Majority (Shafi'i/Hanbali/Maliki) view is selected, personal use jewelry is exempt; Hanafi holds all gold is zakatable
  const effectiveGoldValue = jewelryRuling === 'hanafi' ? goldSilverValue : Math.max(0, goldSilverValue * 0.4);

  const effectiveInvestmentsValue = (investmentsValue * investmentZakatablePercent) / 100;

  const totalZakatableAssets =
    effectiveGoldValue +
    cashSavingsValue +
    effectiveInvestmentsValue +
    businessStockValue +
    moneyOwedToYou;

  const netZakatableWealth = Math.max(0, totalZakatableAssets - immediateDebtsDeduction);
  const isNisabReached = netZakatableWealth >= activeNisabThreshold;

  // Rate: 2.5% for Lunar (354 days) or 2.577% for Solar (365 days)
  const zakatRate = calendarType === 'lunar' ? 0.025 : 0.02577;
  const zakatDue = isNisabReached ? Math.round(netZakatableWealth * zakatRate) : 0;

  // Breakdown percentages
  const goldZakatDue = isNisabReached && totalZakatableAssets > 0
    ? Math.round((effectiveGoldValue / totalZakatableAssets) * zakatDue)
    : 0;
  const savingsZakatDue = isNisabReached && totalZakatableAssets > 0
    ? Math.round((cashSavingsValue / totalZakatableAssets) * zakatDue)
    : 0;
  const investmentsZakatDue = isNisabReached && totalZakatableAssets > 0
    ? Math.round((effectiveInvestmentsValue / totalZakatableAssets) * zakatDue)
    : 0;
  const otherZakatDue = Math.max(0, zakatDue - (goldZakatDue + savingsZakatDue + investmentsZakatDue));

  // Savings goals comparison summary
  const totalInSavingsGoals = useMemo(() => {
    return state.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [state.savingsGoals]);

  // Copy Zakat Assessment
  const handleCopyAssessment = () => {
    const assessmentText = `--- MY FINANCE MANAGER: ISLAMIC ZAKAT ASSESSMENT ---
Date: ${new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
Calendar Method: ${calendarType === 'lunar' ? 'Lunar / Hijri (2.50%)' : 'Solar / Gregorian (2.577%)'}
Nisab Standard: ${nisabStandard === 'silver' ? 'Silver Standard (52.5 Tola)' : 'Gold Standard (7.5 Tola)'}
Active Nisab Threshold: ${formatPKR(activeNisabThreshold)}

QUALIFYING ASSETS (From Net Worth Tracker):
- Gold & Silver Holdings: ${formatPKR(effectiveGoldValue)} (Hanafi ruling: all jewelry/bullion included)
- Cash & Bank Savings: ${formatPKR(cashSavingsValue)}
- Tradable Investments (${investmentZakatablePercent}% zakatable): ${formatPKR(effectiveInvestmentsValue)}
- Business Stock & Receivables: ${formatPKR(businessStockValue + moneyOwedToYou)}
--------------------------------------------------
Gross Zakatable Assets: ${formatPKR(totalZakatableAssets)}
Immediate Debts / Due Liabilities: -${formatPKR(immediateDebtsDeduction)}
Net Zakatable Wealth: ${formatPKR(netZakatableWealth)}
--------------------------------------------------
Nisab Status: ${isNisabReached ? 'OBLIGATORY (Nisab Reached)' : 'BELOW NISAB (No Zakat Due)'}
TOTAL ZAKAT DUE: ${formatPKR(zakatDue)}

*Generated using My Finance Manager Net Worth integration.`;

    navigator.clipboard.writeText(assessmentText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Net Worth Sync Status */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-6 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Coins className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Comprehensive Zakat Calculator
              </h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Net Worth Linked
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Dynamically computes your annual 2.5% Zakat obligation directly from your recorded{' '}
              <strong>Gold/Silver holdings</strong>, <strong>Liquid Savings</strong>, and{' '}
              <strong>Bank Accounts</strong> in the Net Worth tracker.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              id="zakat-reset-networth-btn"
              onClick={handleResetToNetWorth}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              title="Reload latest values from Net Worth Tracker"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
              <span>Re-sync from Net Worth</span>
            </button>

            {onNavigateTab && (
              <button
                id="zakat-goto-networth-btn"
                onClick={() => onNavigateTab('networth')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <span>Edit Holdings</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nisab Benchmarks & Configuration Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Nisab Benchmark & Jurisprudence Preferences
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              The minimum threshold of net wealth that makes Zakat mandatory
            </p>
          </div>

          {/* Standard Toggle (Silver vs Gold) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Nisab Base:</span>
            <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                id="nisab-silver-btn"
                onClick={() => setNisabStandard('silver')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  nisabStandard === 'silver'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Silver (52.5 Tola) — Most Beneficial for Poor
              </button>
              <button
                id="nisab-gold-btn"
                onClick={() => setNisabStandard('gold')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  nisabStandard === 'gold'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Gold (7.5 Tola)
              </button>
            </div>
          </div>
        </div>

        {/* Live Rates & Benchmark Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Silver Nisab Card */}
          <div
            className={`rounded-xl border p-3 transition ${
              nisabStandard === 'silver'
                ? 'border-emerald-500/80 bg-emerald-50/50 dark:border-emerald-500/80 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20'
                : 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Silver Nisab (52.5 Tola)
              </span>
              {nisabStandard === 'silver' && (
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Active
                </span>
              )}
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {formatPKR(silverNisabPKR)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Rate: PKR {silverRatePerTola}/tola</span>
            </div>
          </div>

          {/* Gold Nisab Card */}
          <div
            className={`rounded-xl border p-3 transition ${
              nisabStandard === 'gold'
                ? 'border-emerald-500/80 bg-emerald-50/50 dark:border-emerald-500/80 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20'
                : 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Gold Nisab (7.5 Tola)
              </span>
              {nisabStandard === 'gold' && (
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Active
                </span>
              )}
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {formatPKR(goldNisabPKR)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Rate: PKR {goldRatePerTola.toLocaleString()}/tola</span>
            </div>
          </div>

          {/* Rate Adjuster: Gold */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-850 text-xs">
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
              Gold 24K Rate / Tola (PKR):
            </label>
            <input
              type="number"
              value={goldRatePerTola}
              onChange={(e) => setGoldRatePerTola(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">1 Tola = 11.664 grams</span>
          </div>

          {/* Rate Adjuster: Silver */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-850 text-xs">
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
              Silver Rate / Tola (PKR):
            </label>
            <input
              type="number"
              value={silverRatePerTola}
              onChange={(e) => setSilverRatePerTola(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">52.5 Tolas = 612.36 grams</span>
          </div>
        </div>

        {/* Secondary Options: Calendar Type & Jewelry Ruling */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Calculation Year:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="radio"
                name="calendarType"
                checked={calendarType === 'lunar'}
                onChange={() => setCalendarType('lunar')}
                className="text-emerald-600"
              />
              <span>Lunar / Hijri (2.50%)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="radio"
                name="calendarType"
                checked={calendarType === 'solar'}
                onChange={() => setCalendarType('solar')}
                className="text-emerald-600"
              />
              <span>Solar / Gregorian (2.577%)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Personal Jewelry Ruling:
            </span>
            <select
              value={jewelryRuling}
              onChange={(e) => setJewelryRuling(e.target.value as any)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="hanafi">Hanafi (All Gold/Silver Jewelry Zakatable)</option>
              <option value="majority">Majority/Shafi'i (Routine Personal Wear Jewelry Exempt)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Calculation & Status Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Asset Inputs (Linked to Net Worth) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Gold & Silver Holdings */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowGoldDetails(!showGoldDetails)}
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    1. Gold & Silver Holdings
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {goldSilverNetWorthItems.length} Item(s) in Net Worth
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Jewelry, gold biscuits, sovereigns, bullion, silver sets & utensils
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {formatPKR(effectiveGoldValue)}
                </span>
                {showGoldDetails ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {showGoldDetails && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* List items pulled from Net Worth */}
                {goldSilverNetWorthItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Imported from Net Worth Tracker:
                    </div>
                    {goldSilverNetWorthItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-amber-50/50 p-2.5 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatPKR(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-850 dark:text-slate-400 flex items-center justify-between">
                    <span>No Gold/Silver items found in Net Worth tracker.</span>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('networth')}
                        className="text-emerald-600 hover:underline font-semibold"
                      >
                        Add to Net Worth &rarr;
                      </button>
                    )}
                  </div>
                )}

                {/* Direct Override or Adjustment Input */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Zakatable Gold/Silver Value for Assessment (PKR):
                  </label>
                  <input
                    type="number"
                    value={goldSilverValue}
                    onChange={(e) => setGoldSilverValue(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>
                      Approx weight: ~{(goldSilverValue / goldRatePerTola).toFixed(2)} tolas gold equivalent
                    </span>
                    {jewelryRuling === 'majority' && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        (60% personal wear allowance applied)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Cash & Savings Accounts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowSavingsDetails(!showSavingsDetails)}
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    2. Cash, Bank Accounts & Savings
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {cashBankNetWorthItems.length} Account(s) Linked
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Physical cash, checking, savings, fixed deposits, emergency corpus
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPKR(cashSavingsValue)}
                </span>
                {showSavingsDetails ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {showSavingsDetails && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* Linked Cash and Bank Accounts */}
                {cashBankNetWorthItems.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Accounts from Net Worth Tracker:
                    </div>
                    {cashBankNetWorthItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-emerald-50/40 p-2.5 border border-emerald-100/60 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatPKR(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Savings Goals info chip */}
                {totalInSavingsGoals > 0 && (
                  <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-850 dark:text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Dedicated Savings Goals Total:</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatPKR(totalInSavingsGoals)}
                    </span>
                  </div>
                )}

                {/* Direct Adjustment Input */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Qualifying Cash & Savings (PKR):
                  </label>
                  <input
                    type="number"
                    value={cashSavingsValue}
                    onChange={(e) => setCashSavingsValue(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Includes savings held for marriage, Hajj, home purchase, or emergency fund once 1 Hawl is completed.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Investments & Business Assets */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowInvestmentsDetails(!showInvestmentsDetails)}
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    3. Investments & Trade Merchandise
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    PSX equities, mutual funds, Sukuk, trade goods & money owed to you
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {formatPKR(effectiveInvestmentsValue + businessStockValue + moneyOwedToYou)}
                </span>
                {showInvestmentsDetails ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {showInvestmentsDetails && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                {/* Investment items from Net Worth */}
                {investmentNetWorthItems.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-semibold text-slate-600 dark:text-slate-400">
                      Investments from Net Worth:
                    </div>
                    {investmentNetWorthItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-850"
                      >
                        <span>{item.name}</span>
                        <span className="font-bold">{formatPKR(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Investment Zakatable Proportion Selector */}
                <div className="rounded-lg bg-indigo-50/50 p-3 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-indigo-900 dark:text-indigo-200">
                      Zakatable Share of Investments:
                    </label>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      {investmentZakatablePercent}% ({formatPKR(effectiveInvestmentsValue)})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInvestmentZakatablePercent(100)}
                      className={`p-1.5 rounded-md border text-center transition ${
                        investmentZakatablePercent === 100
                          ? 'border-indigo-600 bg-white font-bold text-indigo-900 dark:bg-indigo-900 dark:text-white'
                          : 'border-slate-200 bg-white/60 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      100% (Trading / Liquid Portfolio)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestmentZakatablePercent(30)}
                      className={`p-1.5 rounded-md border text-center transition ${
                        investmentZakatablePercent === 30
                          ? 'border-indigo-600 bg-white font-bold text-indigo-900 dark:bg-indigo-900 dark:text-white'
                          : 'border-slate-200 bg-white/60 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      30% (Long-Term Equity Holding Proxy)
                    </button>
                  </div>
                </div>

                {/* Business Stock in Trade */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business Stock in Trade / Merchandise (PKR):
                  </label>
                  <input
                    type="number"
                    value={businessStockValue}
                    onChange={(e) => setBusinessStockValue(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Current wholesale value of inventory held for resale</span>
                </div>

                {/* Good Debts Receivable */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Good Debts Receivable (Money Owed to You, expected to be repaid) (PKR):
                  </label>
                  <input
                    type="number"
                    value={moneyOwedToYou}
                    onChange={(e) => setMoneyOwedToYou(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Deductible Immediate Liabilities */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowDeductionsDetails(!showDeductionsDetails)}
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    4. Deductible Immediate Debts & Expenses Due
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Immediate installments, overdue bills, and short-term obligations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  -{formatPKR(immediateDebtsDeduction)}
                </span>
                {showDeductionsDetails ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {showDeductionsDetails && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div className="rounded-lg bg-amber-50/60 p-3 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  <strong>Shariah Debt Rule:</strong> Only debts that are due immediately or this month's installments may be deducted from your zakatable assets. The full capital value of long-term debts (like 5-year auto or 15-year house financing) is not deducted in one lump sum.
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deductible Amount Due Now (PKR):
                  </label>
                  <input
                    type="number"
                    value={immediateDebtsDeduction}
                    onChange={(e) => setImmediateDebtsDeduction(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 p-2 font-bold text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      Pushed from Debt Tracker installments: {formatPKR(totalImmediateDebtsFromTracker)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImmediateDebtsDeduction(totalImmediateDebtsFromTracker)}
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      Reset to Tracker
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assessment Summary Card & Receipt */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Result Card */}
          <div
            className={`rounded-2xl border p-6 shadow-sm transition ${
              isNisabReached
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/70 to-white dark:border-emerald-800 dark:from-emerald-950/40 dark:to-slate-900'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Zakat Assessment
              </span>
              {isNisabReached ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Nisab Reached (Obligatory)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Info className="h-3.5 w-3.5" />
                  Below Nisab (No Zakat Due)
                </span>
              )}
            </div>

            {/* Total Zakat Due Display */}
            <div className="my-5 text-center">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Zakat Due ({calendarType === 'lunar' ? '2.5% Lunar Year' : '2.577% Solar Year'})
              </div>
              <div
                className={`mt-1.5 text-3xl sm:text-4xl font-black tracking-tight ${
                  isNisabReached
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {formatPKR(zakatDue)}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Calculated on net wealth of <strong>{formatPKR(netZakatableWealth)}</strong>
              </div>
            </div>

            {/* Assessment Breakdown List */}
            <div className="space-y-2.5 rounded-xl bg-slate-50/80 p-3.5 text-xs dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Gold & Silver Value:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatPKR(effectiveGoldValue)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Cash & Liquid Bank Savings:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatPKR(cashSavingsValue)}
                </span>
              </div>

              {(effectiveInvestmentsValue > 0 || businessStockValue > 0 || moneyOwedToYou > 0) && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Investments & Trade Goods:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatPKR(effectiveInvestmentsValue + businessStockValue + moneyOwedToYou)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold">Gross Zakatable Wealth:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatPKR(totalZakatableAssets)}
                </span>
              </div>

              <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                <span>Immediate Debts Deducted:</span>
                <span className="font-semibold">-{formatPKR(immediateDebtsDeduction)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700 font-bold">
                <span>Net Qualifying Wealth:</span>
                <span>{formatPKR(netZakatableWealth)}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                <span>Active Nisab Threshold ({nisabStandard}):</span>
                <span>{formatPKR(activeNisabThreshold)}</span>
              </div>
            </div>

            {/* Category Contributions to Zakat */}
            {isNisabReached && zakatDue > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Share by Asset Type:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-amber-50 p-2 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40">
                    <span className="text-amber-700 dark:text-amber-300 font-medium">Gold / Silver Share:</span>
                    <div className="font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                      {formatPKR(goldZakatDue)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">Savings / Cash Share:</span>
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                      {formatPKR(savingsZakatDue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions: Copy & Record */}
            <div className="mt-5 flex gap-2">
              <button
                id="zakat-copy-summary-btn"
                onClick={handleCopyAssessment}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Copied Assessment!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-500" />
                    <span>Copy Assessment Summary</span>
                  </>
                )}
              </button>

              <button
                id="zakat-print-btn"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                title="Print or Save as PDF"
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Hawl (Possession Period) Guidance Notice */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              The Condition of Hawl (One Lunar Year)
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
              Zakat is due only once qualifying wealth remains above Nisab for one full lunar year (approximately 354 days). Fluctuations during the year do not interrupt the Hawl as long as wealth was above Nisab at both the beginning and the end of the Zakat cycle.
            </p>
          </div>
        </div>
      </div>

      {/* Educational Guide: Quranic Beneficiaries of Zakat */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowFaq(!showFaq)}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Shariah Guidance: Beneficiaries & Non-Zakatable Assets
            </h3>
          </div>
          <button className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <span>{showFaq ? 'Hide Details' : 'View Guidelines'}</span>
            {showFaq ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showFaq && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            {/* The 8 Categories in Surah At-Tawbah (9:60) */}
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                The 8 Quranic Beneficiaries of Zakat (Surah At-Tawbah 9:60):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block font-bold">1. Al-Fuqara (The Poor)</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Those whose total wealth is below the Nisab threshold.</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block font-bold">2. Al-Masakin (Destitute)</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Those with virtually no possessions or immediate basic provisions.</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block font-bold">3. Al-Gharimin (Debtors)</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Those burdened by essential debt who cannot repay on their own.</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block font-bold">4. Ibn as-Sabil (Traveler)</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Wayfarers stranded far from home lacking access to their funds.</span>
                </div>
              </div>
            </div>

            {/* Non-Zakatable Assets Clarification */}
            <div className="rounded-xl bg-slate-50/70 p-4 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white mb-2">
                Which Assets in your Net Worth are 100% Exempt from Zakat?
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                <li>
                  <strong>Primary Residence & Personal Vehicles:</strong> The house you live in and the cars/motorbikes you use for personal travel have 0% Zakat regardless of their value.
                </li>
                <li>
                  <strong>Household Furniture & Gadgets:</strong> Electronics, appliances, and personal clothing are strictly exempt.
                </li>
                <li>
                  <strong>Tools of Trade & Factory Machinery:</strong> Work tools, office laptops, doctor's clinic equipment, and factory plants are exempt; only finished inventory held for resale is zakatable.
                </li>
                <li>
                  <strong>Investment Real Estate:</strong> Long-term rental property is not zakatable on its land/building capital value; only accumulated net rental income held for one Hawl is subject to Zakat.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
