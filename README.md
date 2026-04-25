# PokeWatch

Webapp single-screen : flux RSS Pokémon → newsletter générée par Google Gemini. Édition inline, copie markdown ou HTML rich.

## Setup

```bash
npm install
cp .env.example .env   # ajoute ton GEMINI_API_KEY
npm run dev            # http://localhost:3000
```

Get your free Gemini API key at https://aistudio.google.com/apikey.

## Scripts

- `npm run dev` — Vite + API serverless émulées
- `npm run build` — type check + build
- `npm test` — suite Vitest
- `npm run lint` — ESLint

## Stack

React 19 · Vite · Tailwind v4 · Tiptap · @dnd-kit · Vercel functions Node 20 · `gemini-2.5-flash` (free tier)

## Deploy Vercel

```bash
vercel link
vercel env add GEMINI_API_KEY
vercel --prod
```

Variables d'env : `GEMINI_API_KEY` (obligatoire), `GEMINI_MODEL` (optionnel, défaut `gemini-2.5-flash`).

## Architecture

- `api/` — fonctions serverless : `health`, `rss`, `generate` (SSE streaming)
- `src/App.tsx` — câblage shell + workspace + drawer + reducer
- `src/lib/` — reducer, hooks, fetch, serialize
- `src/shell/` — header, theme toggle, user menu
- `src/sections/workspace/` — split RSS / newsletter
- `product-plan/` — handoff package (référence design)

## Persistance

localStorage : `pokewatch:feeds`, `pokewatch:filters`, `pokewatch:newsletter-draft`, `pokewatch:onboarding`, `pokewatch:theme`, `pokewatch:ui-panel`. Reset via drawer paramètres.

## Docs

- `CLAUDE.md` — conventions projet
- `product-plan/sections/workspace/tests.md` — specs tests
