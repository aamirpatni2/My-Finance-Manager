import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  TrendingDown,
  User,
} from 'lucide-react';
import { AppState } from '../types/finance';
import { calculateFinancialStress, calculateMonthlyTotals, calculateTotalDebt, calculateEmergencyFundTotal, calculateNetWorth } from '../utils/financialCalculations';
import { formatPKR } from '../utils/formatters';

interface AICoachTabProps {
  state: AppState;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'How can I lower my financial stress score this month?',
  'Should I use Debt Snowball or Avalanche for my specific debts?',
  'Am I compliant with the 50/30/20 budget rule?',
  'How can I build my 6-month emergency fund faster with my income?',
  'Where am I overspending on non-essential wants right now?',
];

export const AICoachTab: React.FC<AICoachTabProps> = ({ state }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Assalam o Alaikum! I am your personal AI Financial Coach, powered by the principles of the Financial Stress Guide.

I have direct visibility into your actual recorded numbers for **${state.selectedMonth}**:
- **Monthly Income:** ${formatPKR(calculateMonthlyTotals(state, state.selectedMonth).totalIncome)}
- **Monthly Expenses:** ${formatPKR(calculateMonthlyTotals(state, state.selectedMonth).totalExpenses)}
- **Remaining Debt:** ${formatPKR(calculateTotalDebt(state).totalRemaining)}
- **Emergency Reserve:** ${formatPKR(calculateEmergencyFundTotal(state))}
- **Stress Score:** ${calculateFinancialStress(state).score}/100 (${calculateFinancialStress(state).level})

How can I help you improve your cashflow, pay off debt, or optimize your savings today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const monthTotals = calculateMonthlyTotals(state, state.selectedMonth);
  const totalDebt = calculateTotalDebt(state);
  const netWorth = calculateNetWorth(state);
  const emergencyFund = calculateEmergencyFundTotal(state);
  const stress = calculateFinancialStress(state);

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);
    setErrorMessage(null);

    // Prepare real financial context snapshot
    const financialData = {
      selectedMonth: state.selectedMonth,
      currency: 'PKR',
      monthlyIncome: monthTotals.totalIncome,
      monthlyExpenses: monthTotals.totalExpenses,
      needsExpenses: monthTotals.needsExpenses,
      wantsExpenses: monthTotals.wantsExpenses,
      monthlySavings: monthTotals.monthlySavings,
      savingsRatePercent: monthTotals.savingsRate,
      topExpenseCategories: monthTotals.topCategories,
      budgetRule: {
        targetNeedsPercent: state.budgetConfig.needsPercent,
        targetWantsPercent: state.budgetConfig.wantsPercent,
        targetSavingsPercent: state.budgetConfig.savingsDebtPercent,
        actualNeedsPercent: monthTotals.needsPercentage,
        actualWantsPercent: monthTotals.wantsPercentage,
      },
      emergencyFund: {
        currentBalance: emergencyFund,
        recommended3Month: monthTotals.needsExpenses * 3,
        recommended6Month: monthTotals.needsExpenses * 6,
      },
      debts: state.debts.map((d) => ({
        creditor: d.creditor,
        remaining: d.remainingAmount,
        interestRate: d.interestRate,
        minimumPayment: d.minimumPayment,
      })),
      totalDebtRemaining: totalDebt.totalRemaining,
      totalAssets: netWorth.totalAssets,
      totalLiabilities: netWorth.totalLiabilities,
      netWorth: netWorth.netWorth,
      stressDiagnostic: {
        score: stress.score,
        level: stress.level,
        factors: stress.factors,
      },
    };

    try {
      const response = await fetch('/api/coach/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialData,
          prompt: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.insights || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('AI Coach Error:', err);
      setErrorMessage(
        'Unable to contact AI Coach service. Please ensure your GEMINI_API_KEY is configured in Settings.'
      );
      // Fallback offline guidance based on user's actual data
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Here is a diagnostic based on your recorded data:
1. **Emergency Buffer**: Your emergency fund is **${formatPKR(emergencyFund)}**. Aim for at least 3 months of essential needs (${formatPKR(monthTotals.needsExpenses * 3)}).
2. **Debt Focus**: You have **${formatPKR(totalDebt.totalRemaining)}** in total debts. Using the Debt Snowball method, target your smallest balance first for rapid behavioral momentum.
3. **Budget Discipline**: Your needs are ${monthTotals.needsPercentage.toFixed(0)}% of income (Target: ${state.budgetConfig.needsPercent}%) and wants are ${monthTotals.wantsPercentage.toFixed(0)}% (Target: ${state.budgetConfig.wantsPercent}%).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Financial Coach & Stress Advisor
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Grounded strictly in your recorded PKR finances and the principles of the Financial Stress Guide
        </p>
      </div>

      {/* Suggested Prompts Pill Carousel */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 transition text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
                <div
                  className={`mt-2 text-[10px] ${
                    msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-slate-100 p-4 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                Analyzing your real financial records...
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              {errorMessage}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-850">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask for personalized advice (e.g. 'How can I save PKR 20,000 next month?')..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
