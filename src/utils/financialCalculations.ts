import { AppState, DebtItem, FinancialStressMetrics, ExpenseCategory, StressFactor } from '../types/finance';

export function getMonthlyIncomes(state: AppState, monthStr: string) {
  return state.incomes.filter((item) => item.date.startsWith(monthStr));
}

export function getMonthlyExpenses(state: AppState, monthStr: string) {
  return state.expenses.filter((item) => item.date.startsWith(monthStr));
}

export function calculateMonthlyTotals(state: AppState, monthStr?: string) {
  const targetMonth = monthStr || state.selectedMonth;
  const incomes = getMonthlyIncomes(state, targetMonth);
  const expenses = getMonthlyExpenses(state, targetMonth);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const needsExpenses = expenses
    .filter((e) => e.type === 'Essential')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const wantsExpenses = expenses
    .filter((e) => e.type === 'Want')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlySavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;
  const needsPercentage = totalIncome > 0 ? (needsExpenses / totalIncome) * 100 : 0;
  const wantsPercentage = totalIncome > 0 ? (wantsExpenses / totalIncome) * 100 : 0;

  // Category spending aggregation
  const catMap: Partial<Record<ExpenseCategory, number>> = {};
  expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });

  const topCategories = Object.entries(catMap)
    .map(([cat, amount]) => ({ category: cat as ExpenseCategory, amount: amount as number }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpenses,
    needsExpenses,
    wantsExpenses,
    monthlySavings,
    savingsRate,
    needsPercentage,
    wantsPercentage,
    topCategories,
  };
}

export function calculateNetWorth(state: AppState) {
  const totalAssets = state.netWorthItems
    .filter((item) => item.type === 'asset')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalLiabilities = state.netWorthItems
    .filter((item) => item.type === 'liability')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}

export function calculateEmergencyFundTotal(state: AppState): number {
  const efGoal = state.savingsGoals.find((g) => g.isEmergencyFund);
  if (efGoal) {
    return efGoal.currentAmount;
  }
  const cashAsset = state.netWorthItems
    .filter((item) => item.name.toLowerCase().includes('emergency') || item.category === 'Cash')
    .reduce((acc, curr) => acc + curr.amount, 0);
  return cashAsset;
}

export function calculateTotalDebt(state: AppState): {
  totalRemaining: number;
  totalMonthlyMinimum: number;
  totalOriginal: number;
} {
  const totalRemaining = state.debts.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalMonthlyMinimum = state.debts.reduce((acc, curr) => acc + curr.minimumPayment, 0);
  const totalOriginal = state.debts.reduce((acc, curr) => acc + curr.originalAmount, 0);
  return { totalRemaining, totalMonthlyMinimum, totalOriginal };
}

export function calculateFinancialStress(state: AppState, monthStr?: string): FinancialStressMetrics {
  const targetMonth = monthStr || state.selectedMonth;
  const { totalIncome, totalExpenses, needsExpenses, wantsExpenses, needsPercentage, wantsPercentage } =
    calculateMonthlyTotals(state, targetMonth);
  const { totalRemaining, totalMonthlyMinimum } = calculateTotalDebt(state);
  const emergencyFund = calculateEmergencyFundTotal(state);

  const liquidCash = state.netWorthItems
    .filter((item) => item.type === 'asset' && (item.category === 'Cash' || item.category === 'Bank accounts'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 1. Income vs Expenses
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;

  // 2. Debt Burden (Monthly DTI)
  const dtiRatio = totalIncome > 0 ? (totalMonthlyMinimum / totalIncome) * 100 : 0;

  // 3. Emergency Fund Months
  const monthlyEssentialBurn = needsExpenses > 0 ? needsExpenses : (totalExpenses * 0.7) || 45000;
  const emergencyFundMonths = emergencyFund / monthlyEssentialBurn;

  // 4. Overspending count
  const expenses = getMonthlyExpenses(state, targetMonth);
  const categorySpending: Partial<Record<ExpenseCategory, number>> = {};
  expenses.forEach((e) => {
    categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount;
  });

  let overspendingCount = 0;
  Object.entries(categorySpending).forEach(([cat, spent]) => {
    const budget = state.budgetConfig.categoryBudgets[cat as ExpenseCategory] || 0;
    if (budget > 0 && spent && spent > budget) {
      overspendingCount++;
    }
  });

  // Calculate stress score (0-100)
  let score = 25; // baseline

  // Paycheck-to-paycheck / Deficit
  if (totalExpenses >= totalIncome && totalIncome > 0) {
    score += Math.min(30, Math.round(((totalExpenses - totalIncome) / totalIncome) * 60) + 15);
  } else if (expenseRatio > 85) {
    score += 15;
  } else if (expenseRatio < 70) {
    score -= 10;
  }

  // Debt penalty
  if (dtiRatio > 40) {
    score += 25;
  } else if (dtiRatio > 20) {
    score += 15;
  } else if (totalRemaining === 0) {
    score -= 10;
  }

  // Emergency cushion
  if (emergencyFundMonths < 1) {
    score += 25;
  } else if (emergencyFundMonths < 3) {
    score += 10;
  } else if (emergencyFundMonths >= 6) {
    score -= 20;
  } else if (emergencyFundMonths >= 3) {
    score -= 10;
  }

  // Overspending penalty
  if (overspendingCount > 0) {
    score += Math.min(15, overspendingCount * 5);
  }

  // Wants overspending
  if (wantsPercentage > 35) {
    score += 10;
  }

  score = Math.max(5, Math.min(95, Math.round(score)));

  let level: FinancialStressMetrics['level'] = 'Calm';
  if (score >= 75) level = 'Severe';
  else if (score >= 60) level = 'High';
  else if (score >= 40) level = 'Moderate';
  else if (score >= 20) level = 'Low';

  // 5 Core Indicators breakdown from document
  const factors: StressFactor[] = [
    {
      name: 'Cashflow Buffer & Paycheck Living',
      status: expenseRatio >= 100 ? 'danger' : expenseRatio > 85 ? 'warning' : 'safe',
      value: `${expenseRatio.toFixed(0)}% expenses to income`,
      description:
        expenseRatio >= 100
          ? 'Spending completely matches or exceeds income, causing severe vulnerability.'
          : expenseRatio > 85
          ? 'Narrow margin between income and outflow; small delays in income create stress.'
          : 'Healthy surplus retained every month for wealth and stability.',
    },
    {
      name: 'Debt-to-Income (DTI) Ratio',
      status: dtiRatio > 36 ? 'danger' : dtiRatio > 20 ? 'warning' : 'safe',
      value: `${dtiRatio.toFixed(0)}% monthly income committed to debt`,
      description:
        dtiRatio > 36
          ? 'Dangerous debt burden consuming over a third of monthly earnings.'
          : dtiRatio > 20
          ? 'Moderate debt payments. Prioritize Debt Snowball or Avalanche.'
          : 'Low or zero monthly debt obligation; excellent financial agility.',
    },
    {
      name: 'Emergency Fund Runway',
      status: emergencyFundMonths < 1 ? 'danger' : emergencyFundMonths < 3 ? 'warning' : 'safe',
      value: `${emergencyFundMonths.toFixed(1)} months of essential coverage`,
      description:
        emergencyFundMonths < 1
          ? 'Less than 1 month reserve. Unforeseen medical or home repairs could force unplanned borrowing.'
          : emergencyFundMonths < 3
          ? 'Partial safety cushion. Aim for the recommended 3-6 month baseline.'
          : 'Strong liquid defense protecting your family from unexpected shocks.',
    },
    {
      name: 'Discretionary Wants Discipline',
      status: wantsPercentage > 35 ? 'danger' : wantsPercentage > 30 ? 'warning' : 'safe',
      value: `${wantsPercentage.toFixed(0)}% spent on Wants (Target: ≤30%)`,
      description:
        wantsPercentage > 35
          ? 'Excessive spending on non-essential lifestyle, shopping, or entertainment.'
          : wantsPercentage > 30
          ? 'Slightly above the 30% guideline. Moderation recommended.'
          : 'Well within disciplined lifestyle limits.',
    },
    {
      name: 'Category Budget Overspending',
      status: overspendingCount >= 2 ? 'danger' : overspendingCount === 1 ? 'warning' : 'safe',
      value: `${overspendingCount} categories over planned limits`,
      description:
        overspendingCount > 0
          ? `${overspendingCount} categories breached their assigned limits this month.`
          : 'All expense categories stayed within planned budgetary boundaries.',
    },
  ];

  const practicalActions: string[] = [];
  if (emergencyFundMonths < 3) {
    const diff = Math.round(monthlyEssentialBurn * 3 - emergencyFund);
    practicalActions.push(
      `Set aside PKR ${diff > 0 ? (diff / 6).toLocaleString() : '15,000'}/month immediately into your Emergency Fund using "Pay Yourself First".`
    );
  }
  if (totalRemaining > 0) {
    practicalActions.push(
      `Cease any new credit borrowing and direct an extra PKR 10,000/month toward priority #1 in your Debt Snowball plan.`
    );
  }
  if (wantsPercentage > 30) {
    practicalActions.push(
      `Trim dining out, shopping, and discretionary entertainment by 15-20% to restore the 50/30/20 balance.`
    );
  }
  if (overspendingCount > 0) {
    practicalActions.push(
      `Review category limits in the Budget Planner and use the Zero-Based Budgeting meter before starting next month.`
    );
  }
  if (practicalActions.length < 3) {
    practicalActions.push(
      `Conduct a 15-minute monthly review using the reflection prompts to celebrate progress and set targets.`
    );
  }

  return {
    score,
    level,
    incomeVsExpensesRatio: expenseRatio,
    debtToIncomeRatio: dtiRatio,
    emergencyFundMonths,
    overspendingCount,
    liquidCash,
    recommendations: practicalActions,
    factors,
    practicalActions,
  };
}

// Compare Debt Snowball vs Debt Avalanche
export function calculateDebtStrategies(debts: DebtItem[], extraMonthlyPayment: number = 10000) {
  const activeDebts = debts.filter((d) => d.remainingAmount > 0);
  if (activeDebts.length === 0) {
    return {
      snowballOrder: [],
      avalancheOrder: [],
      totalRemaining: 0,
      monthlyMinTotal: 0,
      estimatedMonths: 0,
      extraMonthlyPayment,
    };
  }

  // Snowball: Smallest balance first
  const snowballOrder = [...activeDebts].sort((a, b) => a.remainingAmount - b.remainingAmount);

  // Avalanche: Highest interest rate first
  const avalancheOrder = [...activeDebts].sort((a, b) => b.interestRate - a.interestRate);

  const totalRemaining = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const monthlyMinTotal = activeDebts.reduce((sum, d) => sum + d.minimumPayment, 0);

  const totalPaymentPerMonth = monthlyMinTotal + extraMonthlyPayment;
  const estimatedMonths = totalPaymentPerMonth > 0 ? Math.ceil(totalRemaining / totalPaymentPerMonth) : 0;

  return {
    snowballOrder,
    avalancheOrder,
    totalRemaining,
    monthlyMinTotal,
    estimatedMonths,
    extraMonthlyPayment,
  };
}

// Zakat Calculator
export function calculateZakat(state: AppState) {
  const silverNisabPKR = 180000;

  const cash = state.netWorthItems
    .filter((i) => i.type === 'asset' && i.category === 'Cash')
    .reduce((sum, i) => sum + i.amount, 0);

  const bank = state.netWorthItems
    .filter((i) => i.type === 'asset' && i.category === 'Bank accounts')
    .reduce((sum, i) => sum + i.amount, 0);

  const goldSilver = state.netWorthItems
    .filter((i) => i.type === 'asset' && i.category === 'Gold/Silver')
    .reduce((sum, i) => sum + i.amount, 0);

  const investments = state.netWorthItems
    .filter((i) => i.type === 'asset' && i.category === 'Investments')
    .reduce((sum, i) => sum + i.amount, 0);

  const shortTermDebts = state.debts.reduce((sum, d) => sum + d.minimumPayment, 0);

  const zakatableTotal = Math.max(0, cash + bank + goldSilver + investments - shortTermDebts);
  const isEligible = zakatableTotal >= silverNisabPKR;
  const zakatDue = isEligible ? zakatableTotal * 0.025 : 0;

  return {
    cash,
    bank,
    goldSilver,
    investments,
    shortTermDebts,
    zakatableTotal,
    silverNisabPKR,
    isEligible,
    zakatDue,
  };
}

export function getPastNMonths(baseMonthStr: string, count: number = 6): string[] {
  const [yearStr, monthStr] = baseMonthStr.split('-');
  const baseYear = parseInt(yearStr, 10);
  const baseMonth = parseInt(monthStr, 10);

  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    let targetMonth = baseMonth - i;
    let targetYear = baseYear;
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    const mPad = String(targetMonth).padStart(2, '0');
    months.push(`${targetYear}-${mPad}`);
  }
  return months;
}

export interface MonthTrendData {
  monthKey: string;
  monthLabel: string;
  shortLabel: string;
  totalExpenses: number;
  needsExpenses: number;
  wantsExpenses: number;
  totalIncome: number;
  monthlySavings: number;
  savingsRate: number;
  topCategory: string;
  topCategoryAmount: number;
}

export interface SixMonthTrendsSummary {
  trendData: MonthTrendData[];
  averageExpense: number;
  averageIncome: number;
  highestMonth: MonthTrendData;
  lowestMonth: MonthTrendData;
  seasonalSwing: number;
  seasonalSwingPercent: number;
  currentMonthTrendVsAvg: number;
  hasSufficientData: boolean;
}

export function calculateSixMonthTrends(state: AppState, currentMonth: string): SixMonthTrendsSummary {
  const months = getPastNMonths(currentMonth, 6);

  const trendData: MonthTrendData[] = months.map((m) => {
    const totals = calculateMonthlyTotals(state, m);
    const [year, monthNum] = m.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
    const shortLabel = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const topCat = totals.topCategories[0] || { category: 'None', amount: 0 };

    return {
      monthKey: m,
      monthLabel,
      shortLabel,
      totalExpenses: totals.totalExpenses,
      needsExpenses: totals.needsExpenses,
      wantsExpenses: totals.wantsExpenses,
      totalIncome: totals.totalIncome,
      monthlySavings: totals.monthlySavings,
      savingsRate: totals.savingsRate,
      topCategory: topCat.category,
      topCategoryAmount: topCat.amount,
    };
  });

  const monthsWithExpenses = trendData.filter((d) => d.totalExpenses > 0);
  const totalExpensesSum = trendData.reduce((sum, d) => sum + d.totalExpenses, 0);
  const totalIncomeSum = trendData.reduce((sum, d) => sum + d.totalIncome, 0);
  const averageExpense = Math.round(totalExpensesSum / 6);
  const averageIncome = Math.round(totalIncomeSum / 6);

  let highestMonth = trendData[0];
  let lowestMonth = trendData[0];

  trendData.forEach((d) => {
    if (d.totalExpenses > highestMonth.totalExpenses) {
      highestMonth = d;
    }
    if (lowestMonth.totalExpenses === 0 || (d.totalExpenses > 0 && d.totalExpenses < lowestMonth.totalExpenses)) {
      lowestMonth = d;
    }
  });

  const seasonalSwing = Math.max(0, highestMonth.totalExpenses - lowestMonth.totalExpenses);
  const seasonalSwingPercent = lowestMonth.totalExpenses > 0
    ? Math.round((seasonalSwing / lowestMonth.totalExpenses) * 100)
    : 0;

  const currentMonthData = trendData[trendData.length - 1];
  const currentMonthTrendVsAvg = averageExpense > 0
    ? Math.round(((currentMonthData.totalExpenses - averageExpense) / averageExpense) * 100)
    : 0;

  return {
    trendData,
    averageExpense,
    averageIncome,
    highestMonth,
    lowestMonth,
    seasonalSwing,
    seasonalSwingPercent,
    currentMonthTrendVsAvg,
    hasSufficientData: monthsWithExpenses.length >= 2,
  };
}
