import { GoogleGenAI } from '@google/genai';

// Serverless port of the Express /api/coach/insights route in server.ts, used
// when the app is hosted on Vercel. server.ts still serves local development.
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { financialData, prompt } = req.body || {};
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        source: 'rule_engine',
        message:
          'Gemini API key is not configured. Using built-in financial stress and recommendation engine.',
      });
    }

    const systemInstruction = `
You are the personal finance advisor inside 'My Finance Manager', an app using principles from the Financial Stress framework.
Currency: PKR (Pakistani Rupees).
Principles to adhere to:
1. Never invent financial figures. Base all advice strictly on the user's recorded data:
   - Monthly Income: PKR ${financialData?.monthlyIncome || 0}
   - Monthly Expenses: PKR ${financialData?.monthlyExpenses || 0}
   - Essential (Needs): PKR ${financialData?.needsExpenses || 0}
   - Wants: PKR ${financialData?.wantsExpenses || 0}
   - Savings: PKR ${financialData?.monthlySavings || 0}
2. Core rules from the framework:
   - Prioritize essential expenses (food, shelter, utilities, essential healthcare).
   - Cut or pause non-essential wants if cash flow or emergency fund is constrained.
   - Pay Yourself First: allocate savings as soon as income is received.
   - Build 3-6 months emergency fund based on essential expenses.
   - Systematic debt management: compare Snowball (smallest balance first) vs Avalanche (highest interest first).
   - Zero-based budgeting: give every rupee a planned purpose.
   - If asked about Islamic financial perspective, emphasize halal income, barakah, gratitude, charity, avoiding riba, and patience.
3. Be calm, supportive, actionable and practical. Do not make guaranteed investment or speculative return predictions.
`;

    const userMessage = prompt
      ? `User question: "${prompt}"\n\nCurrent financial snapshot:\n${JSON.stringify(financialData, null, 2)}`
      : `Provide 3-5 concise, high-impact financial recommendations based on this exact profile:\n${JSON.stringify(financialData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: { systemInstruction, temperature: 0.7 },
    });

    return res.status(200).json({ source: 'gemini', analysis: response.text });
  } catch (error: any) {
    console.error('Gemini Coach API error:', error);
    return res.status(500).json({ error: 'Failed to generate AI insights.', details: error?.message });
  }
}
