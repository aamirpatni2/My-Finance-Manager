import { AppState, ExpenseCategory } from '../types/finance';
import { MilestoneBadge, MilestoneStats, MilestoneTier } from '../types/milestones';
import {
  calculateMonthlyTotals,
  calculateNetWorth,
  calculateEmergencyFundTotal,
  calculateTotalDebt,
  getMonthlyExpenses,
} from './financialCalculations';
import { formatPKR } from './formatters';

const STORAGE_KEY_UNLOCKED_BADGES = 'mfm_milestone_unlock_dates_v1';

// Helper to get stored unlock dates
function getStoredUnlockDates(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNLOCKED_BADGES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Helper to record an unlock date
function saveUnlockDate(id: string): string {
  const dates = getStoredUnlockDates();
  if (dates[id]) return dates[id];

  const now = new Date().toISOString().split('T')[0];
  dates[id] = now;
  try {
    localStorage.setItem(STORAGE_KEY_UNLOCKED_BADGES, JSON.stringify(dates));
  } catch {
    // ignore
  }
  return now;
}

export function evaluateMilestones(state: AppState): {
  badges: MilestoneBadge[];
  stats: MilestoneStats;
} {
  const storedDates = getStoredUnlockDates();
  const month = state.selectedMonth;

  const { totalIncome, totalExpenses, savingsRate, needsExpenses } = calculateMonthlyTotals(state, month);
  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(state);
  const emergencyFund = calculateEmergencyFundTotal(state);
  const { totalRemaining, totalOriginal } = calculateTotalDebt(state);

  // 1. Savings Goals Evaluation
  const validGoals = state.savingsGoals.filter((g) => g.targetAmount > 0);
  const metGoals = validGoals.filter((g) => g.currentAmount >= g.targetAmount);
  const hasMetGoal = metGoals.length > 0;
  const bestGoalProgress = validGoals.reduce(
    (max, g) => Math.max(max, Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))),
    0
  );
  const bestHalfwayGoal = validGoals.find((g) => g.currentAmount >= g.targetAmount * 0.5);

  // 2. Debt Evaluation
  // Count total debt repayments made across all debts
  const totalDebtPaymentsLogged = state.debts.reduce(
    (acc, d) => acc + (d.paymentHistory ? d.paymentHistory.length : 0),
    0
  );
  const isCompletelyDebtFree = state.debts.length > 0 && totalRemaining === 0;
  const hasStrongDebtStreak = totalDebtPaymentsLogged >= 3 || (state.debts.length === 0 && totalAssets > 0);
  const isDebtStreakUnlocked = isCompletelyDebtFree || hasStrongDebtStreak;

  // Paid off a debt or cut in half
  const hasPaidOffOrHalvedDebt = state.debts.some(
    (d) => (d.remainingAmount === 0 && d.originalAmount > 0) || (d.remainingAmount <= d.originalAmount * 0.5 && d.originalAmount > 0)
  );

  // 3. Emergency Fund Evaluation
  const monthlyEssentialBurn = needsExpenses > 0 ? needsExpenses : (totalExpenses * 0.7) || 45000;
  const efTarget1Month = monthlyEssentialBurn;
  const efProgress1Month = efTarget1Month > 0 ? Math.min(100, Math.round((emergencyFund / efTarget1Month) * 100)) : 0;
  const isEmergencyShieldUnlocked = emergencyFund >= efTarget1Month && emergencyFund > 0;

  // 4. Budget & Spending Evaluation
  const monthlyExpensesList = getMonthlyExpenses(state, month);
  const categorySpendingMap: Partial<Record<ExpenseCategory, number>> = {};
  monthlyExpensesList.forEach((e) => {
    categorySpendingMap[e.category] = (categorySpendingMap[e.category] || 0) + e.amount;
  });

  const budgetedCategoriesWithSpend = Object.keys(state.budgetConfig.categoryBudgets).filter((c) => {
    const lim = state.budgetConfig.categoryBudgets[c as ExpenseCategory];
    return lim && lim > 0;
  });

  let overspentCount = 0;
  budgetedCategoriesWithSpend.forEach((cat) => {
    const lim = state.budgetConfig.categoryBudgets[cat as ExpenseCategory] || 0;
    const spent = categorySpendingMap[cat as ExpenseCategory] || 0;
    if (spent > lim) {
      overspentCount++;
    }
  });

  const isBudgetMasterUnlocked =
    budgetedCategoriesWithSpend.length >= 2 &&
    overspentCount === 0 &&
    monthlyExpensesList.length > 0;

  // 5. Net Worth Evaluation
  const isNetWorthPositiveUnlocked = netWorth > 0 && totalAssets > 0;

  // 6. Consistency Evaluation (10+ records)
  const totalEntriesCount = state.incomes.length + state.expenses.length;
  const isConsistencyUnlocked = totalEntriesCount >= 10;

  // 7. Asset Diversification (3+ asset categories)
  const assetCategoriesPresent = new Set(
    state.netWorthItems.filter((i) => i.type === 'asset' && i.amount > 0).map((i) => i.category)
  );
  const isWealthDiversifiedUnlocked = assetCategoriesPresent.size >= 3;

  // 8. 20% Golden Saver
  const isGoldenSaverUnlocked = savingsRate >= 20 && totalIncome > 0;

  // 9. Budget Setup
  const hasAllocatedBudget = budgetedCategoriesWithSpend.length >= 3;

  // Construct Badges Array
  const badges: MilestoneBadge[] = [
    {
      id: 'first-savings-goal',
      title: 'First Savings Goal Met',
      tagline: 'Achieved 100% of a target savings milestone',
      description: 'You successfully funded a complete savings goal! Reaching your first savings target creates powerful financial momentum and proves that consistent habits yield real wealth.',
      category: 'savings',
      tier: 'gold',
      iconName: 'Target',
      isUnlocked: hasMetGoal,
      unlockedAt: hasMetGoal ? (storedDates['first-savings-goal'] || saveUnlockDate('first-savings-goal')) : undefined,
      progress: hasMetGoal ? 100 : bestGoalProgress,
      currentProgressLabel: hasMetGoal ? '1 Goal Completed' : `${bestGoalProgress}% of closest goal`,
      targetProgressLabel: '100% on any goal',
      howToEarn: 'Create a savings goal and deposit enough to meet or exceed the target amount.',
      motivationalQuote: '“A journey of a thousand miles begins with a single step — and a single rupee saved.”',
      targetTab: 'savings',
      actionText: 'View Savings Goals',
    },
    {
      id: 'debt-free-streak',
      title: 'Debt-Free Streak',
      tagline: 'Maintained 3+ logged repayments or zero debt burden',
      description: 'Demonstrated exceptional debt discipline by logging 3 or more regular repayments or eliminating all personal debt liabilities. You are reclaiming your freedom from interest and stress.',
      category: 'debt',
      tier: 'diamond',
      iconName: 'Flame',
      isUnlocked: isDebtStreakUnlocked,
      unlockedAt: isDebtStreakUnlocked ? (storedDates['debt-free-streak'] || saveUnlockDate('debt-free-streak')) : undefined,
      progress: isDebtStreakUnlocked
        ? 100
        : Math.min(100, Math.round((totalDebtPaymentsLogged / 3) * 100)),
      currentProgressLabel: isCompletelyDebtFree
        ? 'Debt Free!'
        : `${totalDebtPaymentsLogged} repayments logged`,
      targetProgressLabel: '3 logged payments or 0 debt',
      howToEarn: 'Log at least 3 repayments in the Debt Manager or pay off your total outstanding balances.',
      motivationalQuote: '“Debt is like a heavyweight; every payment makes you lighter, faster, and freer.”',
      targetTab: 'debt',
      actionText: 'Manage Debts',
    },
    {
      id: 'emergency-shield',
      title: 'Emergency Shield',
      tagline: 'Protected by at least 1 month of essential expenses',
      description: 'You have insulated yourself against unforeseen emergencies, sudden medical costs, or job disruption by building a liquid emergency cushion of at least 1 full month.',
      category: 'savings',
      tier: 'silver',
      iconName: 'ShieldCheck',
      isUnlocked: isEmergencyShieldUnlocked,
      unlockedAt: isEmergencyShieldUnlocked ? (storedDates['emergency-shield'] || saveUnlockDate('emergency-shield')) : undefined,
      progress: efProgress1Month,
      currentProgressLabel: formatPKR(emergencyFund),
      targetProgressLabel: formatPKR(efTarget1Month),
      howToEarn: 'Set aside an emergency fund equal to at least 1 month of essential expenses in your savings or cash accounts.',
      motivationalQuote: '“An emergency fund turns a financial catastrophe into a mere inconvenience.”',
      targetTab: 'savings',
      actionText: 'Check Emergency Fund',
    },
    {
      id: 'golden-saver',
      title: 'Golden 20% Saver',
      tagline: 'Reached a 20%+ savings rate this month',
      description: 'In accordance with the golden 50/30/20 rule, you set aside at least 20% of your total monthly earnings for savings, debt reduction, or future growth.',
      category: 'discipline',
      tier: 'gold',
      iconName: 'Coins',
      isUnlocked: isGoldenSaverUnlocked,
      unlockedAt: isGoldenSaverUnlocked ? (storedDates['golden-saver'] || saveUnlockDate('golden-saver')) : undefined,
      progress: Math.min(100, Math.round((savingsRate / 20) * 100)),
      currentProgressLabel: `${savingsRate.toFixed(1)}% current rate`,
      targetProgressLabel: '20% of monthly income',
      howToEarn: 'Retain at least 20% of your recorded income as unspent savings in the current month.',
      motivationalQuote: '“Do not save what is left after spending, but spend what is left after saving.”',
      targetTab: 'dashboard',
      actionText: 'Review Savings Rate',
    },
    {
      id: 'debt-slayer',
      title: 'Debt Slayer',
      tagline: 'Reduced a debt balance by 50%+ or cleared a loan',
      description: 'You delivered a crushing blow to high-interest obligations by paying off a debt in full or reducing its remaining principal by more than half.',
      category: 'debt',
      tier: 'silver',
      iconName: 'Zap',
      isUnlocked: hasPaidOffOrHalvedDebt,
      unlockedAt: hasPaidOffOrHalvedDebt ? (storedDates['debt-slayer'] || saveUnlockDate('debt-slayer')) : undefined,
      progress: hasPaidOffOrHalvedDebt
        ? 100
        : totalOriginal > 0
        ? Math.min(100, Math.round(((totalOriginal - totalRemaining) / (totalOriginal * 0.5)) * 100))
        : 0,
      currentProgressLabel: hasPaidOffOrHalvedDebt ? '50%+ Paid Off' : 'Progressing',
      targetProgressLabel: '50% principal reduction',
      howToEarn: 'Pay off any single debt completely or reduce its balance by at least 50% of the original loan.',
      motivationalQuote: '“Every rupee paid toward your principal is an instant, risk-free guaranteed return.”',
      targetTab: 'debt',
      actionText: 'Make Debt Payment',
    },
    {
      id: 'budget-master',
      title: 'Budget Master',
      tagline: 'Zero category budget overspending this month',
      description: 'Flawless discipline! You stayed within every single budgeted category limit without a single rupee of deficit or impulsive breach.',
      category: 'budget',
      tier: 'silver',
      iconName: 'Award',
      isUnlocked: isBudgetMasterUnlocked,
      unlockedAt: isBudgetMasterUnlocked ? (storedDates['budget-master'] || saveUnlockDate('budget-master')) : undefined,
      progress: isBudgetMasterUnlocked
        ? 100
        : budgetedCategoriesWithSpend.length > 0
        ? Math.max(0, Math.round(((budgetedCategoriesWithSpend.length - overspentCount) / budgetedCategoriesWithSpend.length) * 100))
        : 0,
      currentProgressLabel: `${budgetedCategoriesWithSpend.length - overspentCount}/${budgetedCategoriesWithSpend.length} on track`,
      targetProgressLabel: '100% on budget',
      howToEarn: 'Set limits for at least 2 categories in the Budget Planner and stay within them throughout the month.',
      motivationalQuote: '“A budget is not a prison; it is a declaration of what truly matters to you.”',
      targetTab: 'budget',
      actionText: 'Review Budget',
    },
    {
      id: 'net-worth-positive',
      title: 'Net Worth Positive',
      tagline: 'Assets securely exceed all outstanding liabilities',
      description: 'Your balance sheet is in the green! Your total assets (cash, bank, gold, investments, property) exceed your total debts, giving you positive net equity.',
      category: 'wealth',
      tier: 'bronze',
      iconName: 'TrendingUp',
      isUnlocked: isNetWorthPositiveUnlocked,
      unlockedAt: isNetWorthPositiveUnlocked ? (storedDates['net-worth-positive'] || saveUnlockDate('net-worth-positive')) : undefined,
      progress: isNetWorthPositiveUnlocked ? 100 : totalAssets > 0 ? Math.min(100, Math.round((totalAssets / (totalLiabilities || 1)) * 100)) : 0,
      currentProgressLabel: formatPKR(netWorth),
      targetProgressLabel: 'Positive (> Rs 0)',
      howToEarn: 'Accumulate more assets than liabilities in your Net Worth Tracker.',
      motivationalQuote: '“True wealth is what you keep, not what you spend.”',
      targetTab: 'networth',
      actionText: 'View Balance Sheet',
    },
    {
      id: 'halfway-hero',
      title: 'Halfway Hero',
      tagline: 'Crossed the 50% milestone on a savings goal',
      description: 'You crossed the critical tipping point on a savings goal. Once you hit 50%, momentum takes over and reaching the finish line becomes much easier.',
      category: 'savings',
      tier: 'bronze',
      iconName: 'Sparkles',
      isUnlocked: !!bestHalfwayGoal,
      unlockedAt: bestHalfwayGoal ? (storedDates['halfway-hero'] || saveUnlockDate('halfway-hero')) : undefined,
      progress: Math.min(100, bestGoalProgress * 2),
      currentProgressLabel: bestHalfwayGoal ? `${bestGoalProgress}% reached` : `${bestGoalProgress}% / 50%`,
      targetProgressLabel: '50% on any goal',
      howToEarn: 'Save at least 50% of the target amount for any active savings goal.',
      motivationalQuote: '“The halfway mark is where hope transforms into certainty.”',
      targetTab: 'savings',
      actionText: 'Add to Savings Goal',
    },
    {
      id: 'consistency-champion',
      title: 'Consistency Champion',
      tagline: 'Logged 10+ financial transactions',
      description: 'You have actively recorded 10 or more income and expense transactions. Regular logging is the #1 proven habit that dissolves financial blind spots.',
      category: 'discipline',
      tier: 'bronze',
      iconName: 'CheckCircle2',
      isUnlocked: isConsistencyUnlocked,
      unlockedAt: isConsistencyUnlocked ? (storedDates['consistency-champion'] || saveUnlockDate('consistency-champion')) : undefined,
      progress: Math.min(100, Math.round((totalEntriesCount / 10) * 100)),
      currentProgressLabel: `${totalEntriesCount} records`,
      targetProgressLabel: '10 records logged',
      howToEarn: 'Log at least 10 income or expense items across your accounts.',
      motivationalQuote: '“What gets measured gets managed.”',
      targetTab: 'expense',
      actionText: 'Log Transactions',
    },
    {
      id: 'wealth-diversifier',
      title: 'Asset Diversifier',
      tagline: 'Holdings in 3+ distinct asset categories',
      description: 'Your wealth is resilient! By holding assets across cash, bank, gold/silver, investments, or property, you minimize volatility and safeguard purchasing power.',
      category: 'wealth',
      tier: 'gold',
      iconName: 'Trophy',
      isUnlocked: isWealthDiversifiedUnlocked,
      unlockedAt: isWealthDiversifiedUnlocked ? (storedDates['wealth-diversifier'] || saveUnlockDate('wealth-diversifier')) : undefined,
      progress: Math.min(100, Math.round((assetCategoriesPresent.size / 3) * 100)),
      currentProgressLabel: `${assetCategoriesPresent.size} categories active`,
      targetProgressLabel: '3 categories (e.g. Cash, Gold, Investments)',
      howToEarn: 'Add assets spanning at least 3 distinct categories in the Net Worth Tracker.',
      motivationalQuote: '“Diversification is the only free lunch in investing.”',
      targetTab: 'networth',
      actionText: 'Diversify Holdings',
    },
  ];

  // Point system: Bronze = 50, Silver = 100, Gold = 200, Diamond = 300
  const tierPoints: Record<MilestoneTier, number> = {
    bronze: 50,
    silver: 100,
    gold: 200,
    diamond: 300,
  };

  const totalPoints = badges.reduce((sum, b) => sum + tierPoints[b.tier], 0);
  const pointsEarned = badges
    .filter((b) => b.isUnlocked)
    .reduce((sum, b) => sum + tierPoints[b.tier], 0);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const completionPercent = Math.round((unlockedCount / badges.length) * 100);

  let currentRank = 'Novice Planner';
  let nextRank = 'Disciplined Saver';

  if (unlockedCount >= 9) {
    currentRank = 'Financial Sovereign (Master)';
    nextRank = 'Fully Completed';
  } else if (unlockedCount >= 7) {
    currentRank = 'Wealth Architect';
    nextRank = 'Financial Sovereign';
  } else if (unlockedCount >= 5) {
    currentRank = 'Strategic Builder';
    nextRank = 'Wealth Architect';
  } else if (unlockedCount >= 3) {
    currentRank = 'Disciplined Saver';
    nextRank = 'Strategic Builder';
  }

  return {
    badges,
    stats: {
      totalBadges: badges.length,
      unlockedCount,
      completionPercent,
      currentRank,
      nextRank,
      pointsEarned,
      totalPoints,
    },
  };
}
