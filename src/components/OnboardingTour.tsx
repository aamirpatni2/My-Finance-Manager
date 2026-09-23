import React, { useState } from 'react';
import {
  Home,
  ArrowLeftRight,
  PiggyBank,
  Sparkles,
  Repeat,
  CloudUpload,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';

interface OnboardingTourProps {
  onFinish: (mode: 'fresh' | 'sample') => void;
  onClose: () => void;
  // Replaying the tour from the menu must never silently wipe a real book.
  hasExistingData?: boolean;
}

interface TourStep {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  accent: string;
}

const STEPS: TourStep[] = [
  {
    icon: Home,
    eyebrow: 'Tab 1 of 4',
    title: 'Home tells you if you are okay',
    body: 'The dashboard opens on this month: what came in, what went out, what you kept, and your net worth.',
    points: [
      'Hero row answers "am I okay?" at a glance',
      'A red banner appears the moment a category goes over budget',
      'Health score (0–100) summarises your financial stress',
    ],
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    icon: ArrowLeftRight,
    eyebrow: 'Tab 2 of 4',
    title: 'Transactions is where you log money',
    body: 'Income, Expenses and Recurring live together. The green + button is always within thumb reach on your phone.',
    points: [
      'Tap + to add income or an expense in about 5 seconds',
      'Mark anything as Essential (need) or Want',
      'Flag it recurring once and it repeats every month',
    ],
    accent: 'from-sky-500 to-blue-600',
  },
  {
    icon: PiggyBank,
    eyebrow: 'Tab 3 of 4',
    title: 'Plan is where you decide',
    body: 'Set your 50/30/20 split, build the emergency fund, choose a debt payoff strategy and track what you own.',
    points: [
      'Budget Planner gives every rupee a job before the month starts',
      'Savings & Emergency targets 3–6 months of essentials',
      'Debt Manager compares Snowball vs Avalanche on your actual loans',
    ],
    accent: 'from-violet-500 to-indigo-600',
  },
  {
    icon: Sparkles,
    eyebrow: 'Tab 4 of 4',
    title: 'Insights is where you reflect',
    body: 'Your stress diagnostic, monthly review, AI coach and Islamic guidance — all reading your real numbers.',
    points: [
      'Stress Check breaks down the 5 pressure points',
      'AI Coach answers questions using only your recorded data',
      'Zakat calculator pulls straight from your net worth tracker',
    ],
    accent: 'from-amber-500 to-orange-600',
  },
  {
    icon: Repeat,
    eyebrow: 'Time saver',
    title: 'Let recurring entries run themselves',
    body: 'Rent, salary, school fees and utilities repeat every month. Record them once and generate them in one tap.',
    points: [
      'Recurring Automation shows what is still pending this month',
      'Weekly, monthly and yearly frequencies supported',
      'Review before generating — nothing is added behind your back',
    ],
    accent: 'from-rose-500 to-pink-600',
  },
  {
    icon: CloudUpload,
    eyebrow: 'Your data',
    title: 'It stays yours',
    body: 'Everything is stored in your browser first. Sign in with Google only if you want it synced across devices.',
    points: [
      'Export a JSON backup any time from the download icon',
      'Restore on a new device from that same file',
      'Cloud sync is optional and private to your account',
    ],
    accent: 'from-slate-600 to-slate-800',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onFinish, onClose, hasExistingData = false }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const choose = (mode: 'fresh' | 'sample') => {
    if (hasExistingData) {
      const message =
        mode === 'fresh'
          ? 'Erase all your records and start an empty book? If you are signed in, this also clears them on your other devices. Export a backup first if unsure.'
          : 'Replace all your records with demo data? If you are signed in, this also replaces them on your other devices. Export a backup first if unsure.';
      if (!window.confirm(message)) return;
    }
    onFinish(mode);
  };

  const isChoiceStep = stepIndex === STEPS.length;
  const step = STEPS[stepIndex];
  const totalDots = STEPS.length + 1;

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-lg sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalDots }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? 'w-6 bg-emerald-600'
                    : i < stepIndex
                    ? 'w-1.5 bg-emerald-300 dark:bg-emerald-800'
                    : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Close tour"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {isChoiceStep ? (
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {hasExistingData ? 'You already have records' : 'How do you want to begin?'}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {hasExistingData
                  ? 'Keep them, or replace everything with an empty book or the demo data.'
                  : 'You can switch later from the backup menu at any time.'}
              </p>

              <div className="mt-6 space-y-3 text-left">
                {hasExistingData && (
                  <button
                    onClick={onClose}
                    className="flex w-full items-start gap-3 rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 p-4 text-left transition hover:bg-emerald-50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
                  >
                    <div className="rounded-xl bg-emerald-600 p-2 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Keep my current records
                      </div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        Close the tour and carry on exactly where you were.
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => choose('fresh')}
                  className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition ${
                    hasExistingData
                      ? 'border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      : 'border-2 border-emerald-600 bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50'
                  }`}
                >
                  <div className="rounded-xl bg-emerald-600 p-2 text-white">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Start fresh
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      An empty book. Add your own income and expenses — recommended so every number you
                      see is genuinely yours.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => choose('sample')}
                  className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="rounded-xl bg-slate-200 p-2 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Explore with sample data
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      A demo Pakistani household budget so you can see charts, trends and badges filled
                      in. These numbers are not yours.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`inline-flex rounded-2xl bg-gradient-to-br ${step.accent} p-3 text-white shadow-lg`}
              >
                <step.icon className="h-6 w-6" />
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {step.eyebrow}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.body}
              </p>

              <ul className="mt-5 space-y-2.5">
                {step.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        {!isChoiceStep && (
          <div
            className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:invisible dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <button
              onClick={onClose}
              className="text-xs font-medium text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            >
              Skip tour
            </button>

            <button
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
