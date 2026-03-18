# Nutrition Tracker: Tech Stack and Build Plan

## Product scope (phase 1)
- Input: free-text meal logs ("2 eggs, toast, latte")
- Output: calories, protein, carbs, fat per meal
- Daily total tracking vs goals
- Manual edit/delete meals
- High-confidence response format (strict JSON contract)

## Recommended stack
- Frontend: React + your existing component structure
- Backend API: Node.js + Express
- AI model: OpenAI Responses API with JSON schema output
- Storage now: browser localStorage (already implemented in UI)
- Storage next: Postgres (Supabase or Neon) for accounts + history sync
- Auth next: Clerk or Supabase Auth
- Hosting: Vercel (frontend) + Render/Railway/Fly (API)

## Why this stack
- Keeps your current UI and coding style
- Moves API key/model calls to backend (security + control)
- JSON schema gives reliable macro fields and fewer parse failures
- Easy migration path from local-only to multi-device sync

## API contract
### POST /api/analyze-meal
Request
```json
{ "mealText": "2 scrambled eggs and a banana" }
```

Response
```json
{
  "calories": 320,
  "protein": 17,
  "carbs": 27,
  "fat": 14,
  "items": [
    "2 scrambled eggs: 180 kcal, 12g protein, 1g carbs, 14g fat",
    "1 medium banana: 105 kcal, 1g protein, 27g carbs, 0g fat"
  ]
}
```

## Data model for phase 2 (database)
- users: id, email, created_at
- goals: user_id, calories, protein, carbs, fat, updated_at
- meals: id, user_id, eaten_at, description, source_text
- meal_macros: meal_id, calories, protein, carbs, fat
- meal_items: id, meal_id, label, calories, protein, carbs, fat

## Accuracy strategy
- Require quantity prompts in UI hint text
- Enforce JSON schema in API output
- Add user correction flow (edit meal macro numbers)
- Save corrected meals and use them for future suggestions

## Build order
1. Keep current UI and backend API connected (done in this repo)
2. Add edit meal endpoint + inline meal editing
3. Add Postgres + user auth
4. Add weekly trends and export
5. Add barcode/photo support later if needed

## Local run
1. Backend
   - `cd server`
   - `npm install`
   - Copy `.env.example` to `.env` and set `OPENAI_API_KEY`
   - `npm run dev`
2. Frontend
   - Run your React UI and proxy `/api` to `http://localhost:8787`

## Proxy example (Vite)
```js
// vite.config.js
export default {
  server: {
    proxy: {
      "/api": "http://localhost:8787"
    }
  }
}
```
