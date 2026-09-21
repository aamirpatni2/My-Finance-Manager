import { TabType } from './finance';

export type MilestoneCategory = 'savings' | 'debt' | 'budget' | 'wealth' | 'discipline';

export type MilestoneTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface MilestoneBadge {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: MilestoneCategory;
  tier: MilestoneTier;
  iconName: string;
  isUnlocked: boolean;
  unlockedAt?: string; // ISO date string or formatted date
  progress: number; // 0 to 100
  currentProgressLabel: string;
  targetProgressLabel: string;
  howToEarn: string;
  motivationalQuote: string;
  targetTab?: TabType;
  actionText?: string;
}

export interface MilestoneStats {
  totalBadges: number;
  unlockedCount: number;
  completionPercent: number;
  currentRank: string;
  nextRank: string;
  pointsEarned: number;
  totalPoints: number;
}
