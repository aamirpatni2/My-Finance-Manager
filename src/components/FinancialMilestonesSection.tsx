import React, { useState, useMemo } from 'react';
import {
  Award,
  Trophy,
  Target,
  Flame,
  ShieldCheck,
  Coins,
  Zap,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Lock,
  Unlock,
  ChevronRight,
  Info,
  X,
  ExternalLink,
  Share2,
  Check,
  Star,
} from 'lucide-react';
import { AppState, TabType } from '../types/finance';
import { MilestoneBadge, MilestoneCategory, MilestoneTier } from '../types/milestones';
import { evaluateMilestones } from '../utils/milestoneEvaluator';
import { formatPKR } from '../utils/formatters';

interface FinancialMilestonesSectionProps {
  state: AppState;
  onNavigateTab?: (tab: TabType) => void;
}

export const FinancialMilestonesSection: React.FC<FinancialMilestonesSectionProps> = ({
  state,
  onNavigateTab,
}) => {
  const { badges, stats } = useMemo(() => evaluateMilestones(state), [state]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | MilestoneCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    if (activeFilter === 'all') return badges;
    if (activeFilter === 'unlocked') return badges.filter((b) => b.isUnlocked);
    if (activeFilter === 'locked') return badges.filter((b) => !b.isUnlocked);
    return badges.filter((b) => b.category === activeFilter);
  }, [badges, activeFilter]);

  // Next closest badge to unlock
  const nextTargetBadge = useMemo(() => {
    const locked = badges.filter((b) => !b.isUnlocked);
    if (locked.length === 0) return null;
    return locked.reduce((prev, curr) => (curr.progress > prev.progress ? curr : prev), locked[0]);
  }, [badges]);

  // Icon mapping helper
  const renderBadgeIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Target':
        return <Target className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Coins':
        return <Coins className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'Trophy':
      default:
        return <Trophy className={className} />;
    }
  };

  // Tier visual styles
  const getTierStyles = (tier: MilestoneTier, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        cardBorder: 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 opacity-80 hover:opacity-100',
        badgeBg: 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500',
        tierLabelBg: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
        ring: '',
      };
    }

    switch (tier) {
      case 'diamond':
        return {
          cardBorder:
            'border-cyan-300 bg-gradient-to-br from-cyan-50/90 via-sky-50/50 to-white dark:border-cyan-800 dark:from-cyan-950/40 dark:via-sky-950/20 dark:to-slate-900 shadow-xs hover:shadow-md',
          badgeBg:
            'bg-gradient-to-tr from-cyan-600 to-sky-400 text-white shadow-md shadow-cyan-500/20',
          tierLabelBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
          ring: 'ring-1 ring-cyan-400/40',
        };
      case 'gold':
        return {
          cardBorder:
            'border-amber-300 bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white dark:border-amber-800 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-slate-900 shadow-xs hover:shadow-md',
          badgeBg:
            'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/20',
          tierLabelBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
          ring: 'ring-1 ring-amber-400/40',
        };
      case 'silver':
        return {
          cardBorder:
            'border-slate-300 bg-gradient-to-br from-slate-100/90 via-slate-50/60 to-white dark:border-slate-700 dark:from-slate-800/60 dark:via-slate-850/40 dark:to-slate-900 shadow-xs hover:shadow-md',
          badgeBg:
            'bg-gradient-to-tr from-slate-500 to-slate-400 text-white shadow-md shadow-slate-500/20',
          tierLabelBg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600',
          ring: 'ring-1 ring-slate-400/40',
        };
      case 'bronze':
      default:
        return {
          cardBorder:
            'border-orange-300 bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white dark:border-orange-900/60 dark:from-orange-950/40 dark:via-amber-950/20 dark:to-slate-900 shadow-xs hover:shadow-md',
          badgeBg:
            'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20',
          tierLabelBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-900',
          ring: 'ring-1 ring-orange-400/40',
        };
    }
  };

  // Copy achievements summary
  const handleShareAchievements = () => {
    const unlockedTitles = badges
      .filter((b) => b.isUnlocked)
      .map((b) => `• 🏆 [${b.tier.toUpperCase()}] ${b.title}: ${b.tagline}`)
      .join('\n');

    const text = `🌟 MY FINANCE MANAGER — FINANCIAL MILESTONES 🌟
Rank: ${stats.currentRank}
Badges Unlocked: ${stats.unlockedCount} / ${stats.totalBadges} (${stats.completionPercent}%)
Score: ${stats.pointsEarned} / ${stats.totalPoints} Achievement Points

Achievements Unlocked:
${unlockedTitles || '• In progress towards first badge!'}

Next Target: ${nextTargetBadge ? `${nextTargetBadge.title} (${nextTargetBadge.progress}% completed)` : 'All milestones unlocked!'}

*Track your wealth, debt-free streak & financial health at My Finance Manager.*`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
      {/* Header & Gamification Level Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-xs">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Financial Milestones & Badges
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {stats.pointsEarned} Points
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlock digital badges for hitting savings goals, conquering debts, and building consistent financial discipline.
              </p>
            </div>
          </div>
        </div>

        {/* Level & Rank Card */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-850 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Rank:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {stats.currentRank}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 w-28 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${stats.completionPercent}%` }}
                />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                {stats.unlockedCount}/{stats.totalBadges} ({stats.completionPercent}%)
              </span>
            </div>
          </div>

          <button
            id="share-milestones-btn"
            onClick={handleShareAchievements}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
            title="Copy achievement report to clipboard"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied Report!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Share Milestones</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Motivational Prompt / Next Target Banner */}
      {nextTargetBadge && (
        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-4 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-850 dark:to-slate-850">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Next Milestone in Reach: {nextTargetBadge.title}
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                  {nextTargetBadge.tagline} • Currently at{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {nextTargetBadge.currentProgressLabel}
                  </strong>{' '}
                  ({nextTargetBadge.progress}%)
                </p>
              </div>
            </div>

            {nextTargetBadge.targetTab && onNavigateTab && (
              <button
                onClick={() => onNavigateTab(nextTargetBadge.targetTab!)}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 self-start sm:self-auto shrink-0 transition"
              >
                <span>{nextTargetBadge.actionText || 'Take Action'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-2">
          Filter:
        </span>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({badges.length})
        </button>
        <button
          onClick={() => setActiveFilter('unlocked')}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition ${
            activeFilter === 'unlocked'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Unlock className="h-3 w-3" />
          Unlocked ({stats.unlockedCount})
        </button>
        <button
          onClick={() => setActiveFilter('locked')}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition ${
            activeFilter === 'locked'
              ? 'bg-slate-700 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="h-3 w-3" />
          In Progress ({badges.length - stats.unlockedCount})
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        <button
          onClick={() => setActiveFilter('savings')}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            activeFilter === 'savings'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Savings
        </button>
        <button
          onClick={() => setActiveFilter('debt')}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            activeFilter === 'debt'
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Debt
        </button>
        <button
          onClick={() => setActiveFilter('budget')}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            activeFilter === 'budget'
              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Budget
        </button>
        <button
          onClick={() => setActiveFilter('wealth')}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            activeFilter === 'wealth'
              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Wealth
        </button>
        <button
          onClick={() => setActiveFilter('discipline')}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            activeFilter === 'discipline'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Discipline
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {filteredBadges.map((badge) => {
          const styles = getTierStyles(badge.tier, badge.isUnlocked);

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${styles.cardBorder} ${styles.ring}`}
            >
              <div>
                {/* Top Badge Header: Tier & Status */}
                <div className="flex items-center justify-between text-[11px] mb-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.tierLabelBg}`}
                  >
                    {badge.tier}
                  </span>

                  {badge.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-400 dark:text-slate-500 text-[11px]">
                      <Lock className="h-3 w-3" />
                      <span>{badge.progress}%</span>
                    </span>
                  )}
                </div>

                {/* Digital Coin / Shield Icon */}
                <div className="flex items-center justify-center my-3">
                  <div
                    className={`relative flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${styles.badgeBg}`}
                  >
                    {renderBadgeIcon(badge.iconName, 'h-8 w-8')}
                    {badge.isUnlocked && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div className="text-center mt-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {badge.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {badge.tagline}
                  </p>
                </div>
              </div>

              {/* Bottom Progress Bar or Unlocked Date */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {badge.isUnlocked ? (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Completed
                    </span>
                    <span>{badge.unlockedAt ? `Earned: ${badge.unlockedAt}` : 'Active'}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {badge.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Badge Emblem Centerpiece */}
            <div className="flex flex-col items-center text-center pt-2">
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-3xl mb-3 shadow-lg ${
                  getTierStyles(selectedBadge.tier, selectedBadge.isUnlocked).badgeBg
                }`}
              >
                {renderBadgeIcon(selectedBadge.iconName, 'h-12 w-12')}
                {selectedBadge.isUnlocked && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-slate-900 shadow-xs">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    getTierStyles(selectedBadge.tier, selectedBadge.isUnlocked).tierLabelBg
                  }`}
                >
                  {selectedBadge.tier} Tier • {selectedBadge.category}
                </span>
                {selectedBadge.isUnlocked && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Unlocked
                  </span>
                )}
              </div>

              <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {selectedBadge.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedBadge.tagline}
              </p>
            </div>

            {/* Detailed Description */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 dark:bg-slate-850 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
              {selectedBadge.description}
            </div>

            {/* Real-time Progress Breakdown */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-850 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Current Progress:</span>
                <span
                  className={
                    selectedBadge.isUnlocked
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-amber-600 dark:text-amber-400 font-bold'
                  }
                >
                  {selectedBadge.currentProgressLabel}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Unlock Criteria:</span>
                <span>{selectedBadge.targetProgressLabel}</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    selectedBadge.isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${selectedBadge.progress}%` }}
                />
              </div>

              {selectedBadge.isUnlocked && selectedBadge.unlockedAt && (
                <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 text-right">
                  Achieved on: <strong>{selectedBadge.unlockedAt}</strong>
                </div>
              )}
            </div>

            {/* How to Earn */}
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">How to unlock:</span>
              <p className="text-[11px] leading-relaxed">{selectedBadge.howToEarn}</p>
            </div>

            {/* Motivational Quote */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center dark:border-emerald-950 dark:bg-emerald-950/20">
              <p className="italic text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                {selectedBadge.motivationalQuote}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              {selectedBadge.targetTab && onNavigateTab && (
                <button
                  onClick={() => {
                    onNavigateTab(selectedBadge.targetTab!);
                    setSelectedBadge(null);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <span>{selectedBadge.actionText || 'Take Action'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setSelectedBadge(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
