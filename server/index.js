import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 8787);
const allowedOrigins = [
  "https://nutrition-app-ebon-eight.vercel.app",
  "http://localhost:5173",
];

function isAllowedOrigin(origin) {
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && url.hostname === "localhost") return true;
  } catch {
    return false;
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const systemPrompt = [
  "You are a precise nutrition database assistant with expert knowledge of USDA food data and branded food nutrition labels.",
  "When analyzing meals, follow these rules strictly:",
  "1. For branded or packaged foods (e.g. 'Oikos yogurt', 'Mission tortilla', 'Fairlife milk', 'Premier Protein shake'), use the EXACT nutrition facts from that product's standard packaging label.",
  "2. For whole foods (e.g. 'chicken breast', 'rice', 'eggs', 'banana'), use USDA FoodData Central standard values.",
  "3. For restaurant or fast food items, use the official published nutrition info from that brand.",
  "4. Always assume the most common serving size unless the user specifies — for example: 1 container for yogurt, 1 tortilla, 1 large egg, 1 scoop for protein powder.",
  "5. Think step by step: identify each ingredient separately, recall its real nutrition values from label or USDA data, then sum everything up for the totals.",
  "6. Never guess broadly — use real label values. It is better to be slightly off than wildly off.",
  "7. In the items array, include a detailed per-item breakdown like: 'Oikos Triple Zero Vanilla (150g): 120 cal, 15g protein, 13g carbs, 0g fat'.",
  "Return strict JSON only and no markdown.",
].join(" ");

function sanitizeNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 10) / 10;
}

function normalizeOutput(raw = {}) {
  return {
    calories: sanitizeNumber(raw.calories),
    protein: sanitizeNumber(raw.protein),
    carbs: sanitizeNumber(raw.carbs),
    fat: sanitizeNumber(raw.fat),
    items: Array.isArray(raw.items)
      ? raw.items.slice(0, 12).map((item) => String(item).trim()).filter(Boolean)
      : [],
  };
}

async function analyzeMealWithOpenAI(mealText) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze the exact nutrition for this meal. For any branded or packaged products, use their real package label values. For whole foods, use USDA standard values. Think through each ingredient step by step before giving totals.\n\nMeal: ${mealText}\n\nReturn valid JSON with keys calories, protein, carbs, fat, items.`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "meal_macros",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            items: {
              type: "array",
              items: { type: "string" },
              maxItems: 12,
            },
          },
          required: ["calories", "protein", "carbs", "fat", "items"],
        },
      },
    },
  });

  const rawText = response.output_text || "{}";
  const parsed = JSON.parse(rawText);
  return normalizeOutput(parsed);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, providerReady: Boolean(openai), date: new Date().toISOString() });
});

app.post("/api/analyze-meal", async (req, res) => {
  try {
    const mealText = String(req.body?.mealText || "").trim();
    if (!mealText) {
      return res.status(400).json({ error: "mealText is required" });
    }

    if (!openai) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured on the server",
      });
    }

    const analyzed = await analyzeMealWithOpenAI(mealText);
    return res.json(analyzed);
  } catch (error) {
    console.error("analyze-meal failed", error);
    const detail =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Could not analyze meal";
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({ error: isProduction ? "Could not analyze meal" : detail });
  }
});

app.listen(port, () => {
  console.log(`Nutrition backend listening on http://localhost:${port}`);
});