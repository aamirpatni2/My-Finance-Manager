import React, { useState } from 'react';
import {
  Compass,
  Coins,
  ShieldCheck,
  Heart,
  Scale,
  BookOpen,
  Info,
  CheckCircle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { AppState } from '../types/finance';
import { calculateZakat, calculateNetWorth } from '../utils/financialCalculations';
import { formatPKR } from '../utils/formatters';

interface IslamicGuidanceTabProps {
  state: AppState;
}

export const IslamicGuidanceTab: React.FC<IslamicGuidanceTabProps> = ({ state }) => {
  const { totalAssets, totalLiabilities } = calculateNetWorth(state);

  // Zakat inputs
  const [cashInHand, setCashInHand] = useState<string>(
    state.netWorthItems
      .filter((i) => i.type === 'asset' && (i.category === 'Cash' || i.category === 'Bank accounts'))
      .reduce((sum, i) => sum + i.amount, 0)
      .toString()
  );

  const [goldSilverValue, setGoldSilverValue] = useState<string>(
    state.netWorthItems
      .filter((i) => i.type === 'asset' && i.category === 'Gold/Silver')
      .reduce((sum, i) => sum + i.amount, 0)
      .toString()
  );

  const [investmentsValue, setInvestmentsValue] = useState<string>(
    state.netWorthItems
      .filter((i) => i.type === 'asset' && i.category === 'Investments')
      .reduce((sum, i) => sum + i.amount, 0)
      .toString()
  );

  const [businessMerchandise, setBusinessMerchandise] = useState<string>('0');

  const [debtsDueNow, setDebtsDueNow] = useState<string>(
    state.debts.reduce((sum, d) => sum + d.minimumPayment, 0).toString()
  );

  // Nisab configuration
  const [nisabStandard, setNisabStandard] = useState<'silver' | 'gold'>('silver');
  const [silverPricePerTola, setSilverPricePerTola] = useState<number>(3100); // Approx PKR per tola silver
  const [goldPricePerTola, setGoldPricePerTola] = useState<number>(270000); // Approx PKR per tola gold

  const silverNisabValue = 52.5 * silverPricePerTola; // 52.5 tola silver
  const goldNisabValue = 7.5 * goldPricePerTola; // 7.5 tola gold
  const activeNisabThreshold = nisabStandard === 'silver' ? silverNisabValue : goldNisabValue;

  const totalZakatableAssets =
    (parseFloat(cashInHand) || 0) +
    (parseFloat(goldSilverValue) || 0) +
    (parseFloat(investmentsValue) || 0) +
    (parseFloat(businessMerchandise) || 0);

  const netZakatableWealth = Math.max(0, totalZakatableAssets - (parseFloat(debtsDueNow) || 0));
  const isZakatObligatory = netZakatableWealth >= activeNisabThreshold;
  const calculatedZakat = isZakatObligatory ? netZakatableWealth * 0.025 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Islamic Financial Guidance & Zakat Calculator
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ethical principles for debt elimination, Barakah, moderation, and obligatory charity
        </p>
      </div>

      {/* Prominent Educational Disclaimer Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Important Guidance Notice:</strong>
          This section is purely educational guidance and computational assistance based on standard Islamic jurisprudence (Fiqh al-Mu'amalat). It is kept distinct from personal accounting calculations. For complex business structures, joint ownership, or religious rulings, please consult a qualified Islamic scholar.
        </div>
      </div>

      {/* Interactive Zakat Calculator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              Annual Zakat Calculator (2.5% of Qualifying Wealth)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Auto-prefilled with qualifying assets and immediate liabilities from your Net Worth
            </p>
          </div>

          {/* Nisab Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Nisab Standard:
            </span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setNisabStandard('silver')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  nisabStandard === 'silver'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Silver (52.5 Tola - Traditional)
              </button>
              <button
                onClick={() => setNisabStandard('gold')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  nisabStandard === 'gold'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Gold (7.5 Tola)
              </button>
            </div>
          </div>
        </div>

        {/* Nisab Benchmark Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Active Nisab Threshold ({nisabStandard === 'silver' ? '52.5 Tola Silver' : '7.5 Tola Gold'}):
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {formatPKR(activeNisabThreshold)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Rate: PKR {nisabStandard === 'silver' ? silverPricePerTola : goldPricePerTola} / tola
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Zakat Obligation Status:
            </span>
            <div className="mt-0.5">
              {isZakatObligatory ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle className="h-3.5 w-3.5" /> Nisab Reached (Obligatory)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2.5 py-1 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Below Nisab (No Zakat Due)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cash & Bank Balances (PKR)
            </label>
            <input
              type="number"
              value={cashInHand}
              onChange={(e) => setCashInHand(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gold & Silver Value (PKR)
            </label>
            <input
              type="number"
              value={goldSilverValue}
              onChange={(e) => setGoldSilverValue(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tradable Shares & Investments (PKR)
            </label>
            <input
              type="number"
              value={investmentsValue}
              onChange={(e) => setInvestmentsValue(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business Inventory / Merchandise (PKR)
            </label>
            <input
              type="number"
              value={businessMerchandise}
              onChange={(e) => setBusinessMerchandise(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Immediate Debts & Expenses Due Now (PKR)
            </label>
            <input
              type="number"
              value={debtsDueNow}
              onChange={(e) => setDebtsDueNow(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-[10px] text-slate-400">Deducted from gross zakatable assets</span>
          </div>

          {/* Result Block */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40 flex flex-col justify-center">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              Total Calculated Zakat Due:
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {formatPKR(calculatedZakat)}
            </div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300">
              2.5% of net {formatPKR(netZakatableWealth)}
            </span>
          </div>
        </div>
      </div>

      {/* Islamic Financial Principles & Debt Guidance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          Core Shariah Principles for Financial Peace & Barakah
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Riba prohibition & debt freedom */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-rose-600" />
              1. Urgent Avoidance of Riba (Interest/Usury)
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              In Islam, interest is strictly prohibited as an unjust exploitation of wealth. Carrying high-interest debt (such as conventional credit cards and personal loans) causes severe spiritual and emotional stress. The Prophet (ﷺ) sought refuge from heavy debt. Eliminating interest-bearing liabilities should be your highest financial urgency.
            </p>
          </div>

          {/* Israf and Moderation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Scale className="h-4 w-4 text-amber-600" />
              2. Moderation & Guarding Against Israf (Wastefulness)
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <em>"Eat and drink, but do not waste by excess; for God loves not the wasters."</em> (Quran 7:31). 
              The 50/30/20 framework aligns harmoniously with Islamic moderation: prioritizing genuine family needs (Dharuriyyat), keeping discretionary wants (Tahseeniyyat) measured, and saving prudently for unforeseen trials.
            </p>
          </div>

          {/* Halal Wealth & Barakah */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Coins className="h-4 w-4 text-emerald-600" />
              3. Halal Earnings & Contentment (Qana'ah)
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              True wealth is not an abundance of possessions, but contentment of the soul. Ensuring that every rupee of income is earned through transparent, honest, and ethical transactions brings divine blessing (Barakah), making a modest income stretch far further than a large, tainted one.
            </p>
          </div>

          {/* Sadaqah and Charity */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Heart className="h-4 w-4 text-rose-600" />
              4. Sadaqah (Charity) Never Diminishes Wealth
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              The Prophet (ﷺ) declared: <em>"Charity does not decrease wealth."</em> Even when money feels tight, setting aside regular small amounts of voluntary charity shields against calamities, purifies the heart from greed, and restores tranquility and optimism.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
