import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initialize Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// AI Coach recommendation endpoint
app.post("/api/coach/insights", async (req, res) => {
  try {
    const { financialData, prompt } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        source: "rule_engine",
        message: "Gemini API key is not configured. Using built-in financial stress and recommendation engine.",
      });
    }

    const systemInstruction = `
You are the personal finance advisor inside 'My Finance Manager', an app using principles from the Financial Stress framework.
Currency: PKR (Pakistani Rupees).
Principles to adhere to:
1. Never invent financial figures. Base all advice strictly on the user's recorded data:
   - Monthly Income: PKR ${financialData?.monthlyIncome || 0}
   - Monthly Expenses: PKR ${financialData?.monthlyExpenses || 0}
   - Essential (Needs): PKR ${financialData?.monthlyNeeds || 0}
   - Wants: PKR ${financialData?.monthlyWants || 0}
   - Savings: PKR ${financialData?.monthlySavings || 0}
   - Total Debt: PKR ${financialData?.totalDebt || 0}
   - Emergency Fund: PKR ${financialData?.emergencyFund || 0}
   - Net Worth: PKR ${financialData?.netWorth || 0}
2. Core rules from the framework:
   - Prioritize essential expenses (food, shelter, utilities, essential healthcare).
   - Cut or pause non-essential wants if cash flow or emergency fund is constrained.
   - Pay Yourself First: allocate savings as soon as income is received.
   - Build 3-6 months emergency fund based on essential expenses.
   - Systematic debt management: Compare Snowball (smallest balance first for psychological momentum) vs Avalanche (highest interest first for mathematical optimization).
   - Zero-based budgeting: give every rupee a planned purpose.
   - Avoid impulsive spending and high-interest consumer debt.
   - If user asks about Islamic financial perspective, emphasize halal income, barakah, gratitude (shukr), regular charity (sadqa/zakat), repentance (istighfar), avoiding interest (riba), and patience.
3. Be calm, supportive, actionable, and practical. Do not make guaranteed investment or speculative return predictions.
`;

    const userMessage = prompt
      ? `User question: "${prompt}"\n\nCurrent financial snapshot:\n${JSON.stringify(financialData, null, 2)}`
      : `Provide 3-5 concise, high-impact financial recommendations and an actionable next-month plan based on this exact financial profile:\n${JSON.stringify(financialData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      source: "gemini",
      analysis: response.text,
    });
  } catch (error: any) {
    console.error("Gemini Coach API error:", error);
    return res.status(500).json({
      error: "Failed to generate AI insights.",
      details: error?.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
