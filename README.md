# Nutrition App

A simple nutrition tracker with:
- React + Vite frontend
- Node.js + Express backend
- OpenAI-powered meal macro estimation (calories, protein, carbs, fat)

## Features
- Log meals in plain English
- Get estimated macros per meal
- View daily totals vs goals
- Save data in browser `localStorage`
- See ingredient-level breakdown for each meal

## Tech Stack
- Frontend: React, Vite
- Backend: Node.js, Express
- AI: OpenAI Responses API

## Project Structure
- `main.jsx` + `macro-tracker.jsx`: frontend app
- `server/index.js`: backend API
- `server/.env.example`: backend environment template

## Prerequisites
- Node.js 18+ recommended
- npm
- OpenAI API key

## Local Setup

### 1. Clone and install frontend deps
```bash
npm install
```

### 2. Install backend deps
```bash
cd server
npm install
```

### 3. Configure backend environment
Create `server/.env` from `server/.env.example`:
```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
PORT=8787
```

### 4. Run backend
From `server/`:
```bash
npm run dev
```

### 5. Run frontend
From project root:
```bash
npm run dev
```

Frontend runs on Vite dev server and proxies `/api` to `http://localhost:8787`.

## Scripts

Root:
- `npm run dev` - run frontend dev server
- `npm run build` - build frontend
- `npm run preview` - preview frontend build

Server (`server/`):
- `npm run dev` - run backend with watch mode
- `npm start` - run backend

## API

### `GET /api/health`
Health check.

### `POST /api/analyze-meal`
Request:
```json
{ "mealText": "2 eggs and toast" }
```

Response:
```json
{
  "calories": 320,
  "protein": 17,
  "carbs": 27,
  "fat": 14,
  "items": ["..."]
}
```

## Deployment (Recommended)
- Backend: Render
- Frontend: Vercel

High-level order:
1. Deploy backend first (`server/`)
2. Set backend env vars (`OPENAI_API_KEY`, optional `OPENAI_MODEL`)
3. Deploy frontend
4. Point frontend to backend URL (via env var approach if you add it)
5. Restrict backend CORS to your frontend domain

## Security Notes
- Never commit `server/.env`
- Rotate keys immediately if exposed
- Consider adding basic rate limiting before sharing widely

## License
ISC
