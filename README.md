# Gazette

Webapp single-screen, white-label : tu connectes des flux RSS, sélectionnes les articles, et un LLM (Gemini par défaut, Anthropic, OpenAI…) compose une newsletter structurée. Édition inline, copie markdown ou HTML.

## Setup

```bash
npm install
cp .env.example .env   # ajoute la clé du provider IA choisi
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

Variables d'env : `GEMINI_API_KEY` (obligatoire pour le provider Gemini), `GEMINI_MODEL` (optionnel, défaut `gemini-2.5-flash`).

## Architecture

- `api/` — fonctions serverless : `health`, `rss`, `generate` (SSE streaming)
- `src/App.tsx` — câblage shell + workspace + drawer + tour + reducer
- `src/lib/` — reducer, hooks, fetch, serialize
- `src/shell/` — header, theme toggle, user menu
- `src/sections/workspace/` — split RSS / newsletter
- `product-plan/` — handoff package (référence design d'origine)

## Persistance

localStorage : `gazette:feeds`, `gazette:filters`, `gazette:newsletter-draft`, `gazette:setup`, `gazette:theme`, `gazette:ui-panel`. Reset via drawer paramètres.

## Docs

- `CLAUDE.md` — conventions projet
- `product-plan/sections/workspace/tests.md` — specs tests
