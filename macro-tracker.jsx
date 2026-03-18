import { useState } from "react";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };
const STORAGE_KEYS = {
  goals: "macro-tracker-goals-v1",
  mealsByDate: "macro-tracker-meals-by-date-v1",
};

const MACROS = [
  { key: "calories", label: "Calories", unit: "kcal", color: "#6366f1" },
  { key: "protein", label: "Protein", unit: "g", color: "#10b981" },
  { key: "carbs", label: "Carbs", unit: "g", color: "#f59e0b" },
  { key: "fat", label: "Fat", unit: "g", color: "#f43f5e" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseGoalValue(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizeMacros(raw = {}) {
  return {
    calories: Number(raw.calories) || 0,
    protein: Number(raw.protein) || 0,
    carbs: Number(raw.carbs) || 0,
    fat: Number(raw.fat) || 0,
  };
}

function loadGoals() {
  if (typeof window === "undefined") return DEFAULT_GOALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.goals);
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw);
    return {
      calories: parseGoalValue(parsed.calories, DEFAULT_GOALS.calories),
      protein: parseGoalValue(parsed.protein, DEFAULT_GOALS.protein),
      carbs: parseGoalValue(parsed.carbs, DEFAULT_GOALS.carbs),
      fat: parseGoalValue(parsed.fat, DEFAULT_GOALS.fat),
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

function loadMealsForToday() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.mealsByDate);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed[getTodayKey()]) ? parsed[getTodayKey()] : [];
  } catch {
    return [];
  }
}

function saveGoals(goals) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
}

function saveMealsForToday(meals) {
  if (typeof window === "undefined") return;
  let byDate = {};
  try {
    byDate = JSON.parse(localStorage.getItem(STORAGE_KEYS.mealsByDate) || "{}");
  } catch {
    byDate = {};
  }

  byDate[getTodayKey()] = meals;
  localStorage.setItem(STORAGE_KEYS.mealsByDate, JSON.stringify(byDate));
}

function MacroCard({ label, unit, color, value, goal }) {
  const safeGoal = goal || 1;
  const pct = Math.min((value / safeGoal) * 100, 100);
  const over = value > safeGoal;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: over ? "#f43f5e" : "#1a1a1a", lineHeight: 1 }}>{Math.round(value)}</span>
        <span style={{ fontSize: 12, color: "#bbb" }}>/ {safeGoal} {unit}</span>
      </div>
      <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${pct}%`,
            background: over ? "#f43f5e" : color,
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

function MealRow({ meal, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: "#222", lineHeight: 1.5, marginBottom: 5 }}>{meal.description}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "cal", value: meal.macros.calories },
              { label: "protein", value: meal.macros.protein, unit: "g" },
              { label: "carbs", value: meal.macros.carbs, unit: "g" },
              { label: "fat", value: meal.macros.fat, unit: "g" },
            ].map(({ label, value, unit }) => (
              <span key={label} style={{ fontSize: 12, color: "#888" }}>
                <span style={{ color: "#444", fontWeight: 500 }}>{Math.round(value)}{unit || ""}</span> {label}
              </span>
            ))}
          </div>

          {meal.items.length > 0 && (
            <>
              <button
                onClick={() => setOpen(!open)}
                style={{ fontSize: 11, color: "#bbb", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 6, fontFamily: "inherit" }}
              >
                {open ? "hide" : "breakdown"}
              </button>
              {open && (
                <div style={{ marginTop: 6, paddingLeft: 2 }}>
                  {meal.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#bbb", lineHeight: 1.8 }}>- {item}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#ccc" }}>{meal.time}</span>
          <button
            onClick={onDelete}
            style={{ fontSize: 11, color: "#ddd", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", transition: "color 0.15s" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f43f5e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#ddd";
            }}
          >
            remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [meals, setMeals] = useState(loadMealsForToday);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState(loadGoals);
  const [editingGoals, setEditingGoals] = useState(false);
  const [draftGoals, setDraftGoals] = useState(loadGoals);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.macros.calories,
      protein: acc.protein + m.macros.protein,
      carbs: acc.carbs + m.macros.carbs,
      fat: acc.fat + m.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const deleteMeal = (id) => {
    const nextMeals = meals.filter((meal) => meal.id !== id);
    setMeals(nextMeals);
    saveMealsForToday(nextMeals);
  };

  const logMeal = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ mealText: input.trim() }),
      });

      if (!response.ok) {
        throw new Error("Meal analysis failed");
      }

      const analyzed = await response.json();
      const nextMeals = [
        {
          id: Date.now(),
          description: input,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          macros: normalizeMacros(analyzed),
          items: Array.isArray(analyzed.items) ? analyzed.items : [],
        },
        ...meals,
      ];

      setMeals(nextMeals);
      saveMealsForToday(nextMeals);
      setInput("");
    } catch {
      setError("Could not analyze that meal. Try adding quantities and ingredients.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1a1a1a" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "36px 20px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Today&apos;s Macros</h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#aaa" }}>
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => {
              setDraftGoals(goals);
              setEditingGoals(!editingGoals);
            }}
            style={{ fontSize: 12, color: "#888", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, cursor: "pointer", padding: "6px 14px", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            {editingGoals ? "Cancel" : "Edit goals"}
          </button>
        </div>

        {editingGoals && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 14 }}>Daily Goals</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { k: "calories", label: "Calories (kcal)" },
                { k: "protein", label: "Protein (g)" },
                { k: "carbs", label: "Carbs (g)" },
                { k: "fat", label: "Fat (g)" },
              ].map(({ k, label }) => (
                <div key={k}>
                  <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 5 }}>{label}</label>
                  <input
                    type="number"
                    value={draftGoals[k]}
                    onChange={(e) => setDraftGoals((g) => ({ ...g, [k]: Number(e.target.value) }))}
                    style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e8e8e8", borderRadius: 8, padding: "8px 12px", fontSize: 15, fontFamily: "inherit", outline: "none", color: "#1a1a1a" }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const sanitized = {
                  calories: parseGoalValue(draftGoals.calories, goals.calories),
                  protein: parseGoalValue(draftGoals.protein, goals.protein),
                  carbs: parseGoalValue(draftGoals.carbs, goals.carbs),
                  fat: parseGoalValue(draftGoals.fat, goals.fat),
                };
                setGoals(sanitized);
                saveGoals(sanitized);
                setEditingGoals(false);
              }}
              style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
            >
              Save goals
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {MACROS.map((macro) => (
            <MacroCard key={macro.key} {...macro} value={totals[macro.key]} goal={goals[macro.key]} />
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", marginBottom: 28 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                logMeal();
              }
            }}
            placeholder="What did you eat? Example: two scrambled eggs, toast with butter, and a latte"
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "none",
              outline: "none",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "none",
              color: "#222",
              lineHeight: 1.6,
              background: "transparent",
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {error ? <span style={{ fontSize: 12, color: "#f43f5e" }}>{error}</span> : <span style={{ fontSize: 11, color: "#ccc" }}>Press Enter to log</span>}
            <button
              onClick={logMeal}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? "#f0f0f0" : "#1a1a1a",
                color: loading || !input.trim() ? "#bbb" : "#fff",
                border: "none",
                borderRadius: 8,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading || !input.trim() ? "default" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Analyzing..." : "Log meal"}
            </button>
          </div>
        </div>

        {meals.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
              Logged today - {meals.length} meal{meals.length !== 1 ? "s" : ""}
            </div>
            {meals.map((meal) => (
              <MealRow key={meal.id} meal={meal} onDelete={() => deleteMeal(meal.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
