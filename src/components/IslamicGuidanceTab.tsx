import React from 'react';
import {
  Compass,
  Coins,
  ShieldCheck,
  Heart,
  Scale,
  BookOpen,
  Info,
} from 'lucide-react';
import { AppState, TabType } from '../types/finance';
import { ZakatCalculator } from './ZakatCalculator';

interface IslamicGuidanceTabProps {
  state: AppState;
  onNavigateTab?: (tab: TabType) => void;
}

export const IslamicGuidanceTab: React.FC<IslamicGuidanceTabProps> = ({
  state,
  onNavigateTab,
}) => {
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

      {/* Dedicated Zakat Calculator Component Linked to Net Worth Tracker */}
      <ZakatCalculator state={state} onNavigateTab={onNavigateTab} />

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
