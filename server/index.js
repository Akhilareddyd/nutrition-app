import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const systemPrompt = [
  "You are a careful sports nutrition assistant.",
  "Estimate only these nutrition fields for one meal description:",
  "- calories (kcal)",
  "- protein (g)",
  "- carbs (g)",
  "- fat (g)",
  "- items: concise ingredient-level breakdown",
  "Use realistic serving sizes when quantity is not provided.",
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
        content: `Meal description: ${mealText}\n\nReturn valid JSON with keys calories, protein, carbs, fat, items.`,
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
    return res.status(500).json({ error: "Could not analyze meal" });
  }
});

app.listen(port, () => {
  console.log(`Nutrition backend listening on http://localhost:${port}`);
});
