# Gazette — Project Instructions

Gazette is a single-screen, white-label webapp that turns arbitrary RSS feeds into structured, AI-generated newsletters. The user fetches articles from configured RSS feeds, selects which ones to include, generates a newsletter via an AI provider (Gemini by default — Anthropic / OpenAI hookable), edits inline, and copies in markdown or HTML.

The product is intentionally domain-agnostic: no built-in topic, no preset feeds. Each user brings their own sources and adapts the tone via the provider prompt.

## Stack

- React 19 + TypeScript (Vite)
- Tailwind CSS v4 (no `tailwind.config.js` — built-in palettes only)
- Inter Tight + Fraunces + JetBrains Mono (loaded in `index.html`)
- lucide-react for icons
- Path alias `@/*` → `./src/*`

## Architecture

- `src/App.tsx` — App entry, wraps `Workspace` in `AppShell` with theme + first-launch flow
- `src/main.tsx` — React mount
- `src/index.css` — Tailwind import + theme tokens (font families, editorial palette)
- `src/shell/components/` — Application shell (`AppShell`, `MainNav`, `UserMenu`, `ThemeToggle`)
- `src/sections/workspace/` — Main workspace section
  - `components/Workspace.tsx` — Top-level orchestrator
  - `components/RssPanel.tsx` — Left panel (feeds + filters + articles list)
  - `components/NewsletterPanel.tsx` — Right panel (generated newsletter, edit, copy)
  - `components/Splashscreen.tsx` — First-launch splash
  - `components/AppTour.tsx` — Highlight-and-modal guided tour
  - `components/SetupWizardModal.tsx` — Provider activation + initial RSS feeds
  - + `FilterControls`, `ArticleCard`, `NewsletterSectionCard`, `NewsletterItemCard`, `NewsletterSkeleton`, `EventTagBadge`
  - `types.ts` — All data + props interfaces

All section components are **props-based** — they accept data + callbacks. State management lives in `App.tsx` + `useWorkspace` reducer.

## Design Tokens

The visual language is editorial / press (Gazette = newspaper). Vermillion accent, ink/bone neutrals, Fraunces display. Tokens defined in `src/index.css`:

- `vermillion` — primary accent
- `ink` / `bone` — light-mode neutrals
- `night` family — dark-mode neutrals
- `--font-display: Fraunces`, `--font-sans: Inter Tight`, `--font-mono: JetBrains Mono`

## Tailwind Rules

- Tailwind v4 only. Never reference `tailwind.config.js`.
- Use built-in utility classes only. Avoid custom CSS.

## Layout / Responsive

- `AppShell` locks layout to `h-dvh max-h-dvh overflow-hidden flex flex-col`. Header sticky top, main fills the rest.
- `Workspace` uses `flex-1 min-h-0` chain so panels manage their own internal scrolling.
- Desktop split vertical: `minmax(320px, 36%) 1fr`.
- Mobile (<768px): panels stack with bottom toggle (`md:hidden sticky bottom-0`).
- All UI must support light + dark mode via `dark:` variants.
- Use `100dvh` (dynamic viewport) not `100vh` so mobile address bar collapse doesn't clip layout.

## First-launch flow

1. Splashscreen — name + welcome — auto-fades to main UI
2. AppTour — highlights MainNav, RssPanel, FilterControls, NewsletterPanel via spotlight overlay + dialog
3. SetupWizardModal — provider selection (Gemini / Anthropic / OpenAI / custom), API key info, first RSS feeds
4. First fetch triggered automatically when user validates wizard

After first run, tour is replayable from Settings drawer ("Relancer la visite guidée").

## Persistence

localStorage keys (all under `gazette:` namespace):
- `gazette:feeds`, `gazette:filters`, `gazette:newsletter-draft`
- `gazette:setup` (`{ splashSeen, tourSeen, wizardSeen, provider }`)
- `gazette:theme`, `gazette:ui-panel`

## RSS / AI

- `api/rss.ts` proxies feeds server-side (browser CORS).
- `api/generate.ts` streams Gemini `gemini-2.5-flash` over SSE. The system prompt is generic / domain-agnostic — it adapts to the source material.
- `api/health.ts` reports provider key presence.

## Reference Documents

- `product-plan/` — original design handoff (kept for layout reference; brand strings inside that folder are stale and should be ignored).
