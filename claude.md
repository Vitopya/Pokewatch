# PokeWatch — Project Instructions

PokeWatch is a single-screen webapp that turns Pokémon RSS feeds into structured, AI-generated newsletters. The user fetches articles from configured RSS feeds, selects which ones to include, generates a newsletter via Google Gemini (auto-grouped by event tag), edits inline, and copies in markdown or HTML.

## Stack

- React 19 + TypeScript (Vite)
- Tailwind CSS v4 (no `tailwind.config.js` — built-in palettes only)
- Plus Jakarta Sans + JetBrains Mono (loaded in `index.html`)
- lucide-react for icons
- Path alias `@/*` → `./src/*`

## Architecture

- `src/App.tsx` — App entry, wraps `Workspace` in `AppShell` with theme state
- `src/main.tsx` — React mount
- `src/index.css` — Tailwind import + theme tokens (font families)
- `src/shell/components/` — Application shell (`AppShell`, `MainNav`, `UserMenu`, `ThemeToggle`)
- `src/sections/workspace/` — Main workspace section
  - `components/Workspace.tsx` — Top-level orchestrator
  - `components/RssPanel.tsx` — Left panel (feeds + filters + articles list)
  - `components/NewsletterPanel.tsx` — Right panel (generated newsletter, edit, copy)
  - + `FilterControls`, `ArticleCard`, `NewsletterSectionCard`, `NewsletterItemCard`, `NewsletterSkeleton`, `OnboardingCard`, `EventTagBadge`
  - `types.ts` — All data + props interfaces

All section components are **props-based** — they accept data + callbacks. State management lives outside (currently in `App.tsx`, console.log stubs).

## Design Tokens

- **Primary:** `sky` (Tailwind) — primary actions, focus rings, accents
- **Secondary:** `rose` — destructive CTAs, newsletter panel accent
- **Neutral:** `zinc` — backgrounds, borders, text
- **Heading & body font:** Plus Jakarta Sans
- **Mono font:** JetBrains Mono — used on micro-labels (uppercase tracking-widest), timestamps

## Tailwind Rules

- Tailwind v4 only. Never reference `tailwind.config.js`.
- Use built-in utility classes only. Avoid custom CSS.
- Use built-in color palettes (`sky-500`, `rose-500`, `zinc-100`, etc.).

## Layout / Responsive

- `AppShell` locks layout to `h-dvh max-h-dvh overflow-hidden flex flex-col`. Header sticky top, main fills the rest.
- `Workspace` uses `flex-1 min-h-0` chain so panels manage their own internal scrolling. Article list and newsletter content scroll independently.
- Desktop split vertical (panneaux côte-à-côte gauche/droite), `minmax(320px, 40%) 1fr`.
- Mobile (<768px) : panels stack with bottom toggle (`md:hidden sticky bottom-0`).
- All UI must support light + dark mode via `dark:` variants.

## Out-of-Scope (To Implement)

The current `App.tsx` wires console.log stubs to all callbacks. Real implementation needs:

- **Settings drawer** — Feed CRUD, default copy format, reset localStorage. Triggered by `onOpenSettings`. The Gemini API key lives server-side (Vercel env `GEMINI_API_KEY`), not in the drawer.
- **RSS fetching** — Browser CORS blocks most feeds; `api/rss.ts` proxies the fetch + parsing server-side and returns `Article[]`.
- **Gemini integration** — `api/generate.ts` streams `gemini-2.5-flash` (free tier) over SSE. System prompt asks for synthesis + auto-tag + grouping. Output parsed into `Newsletter` shape on the client.
- **Clipboard serialization** — `onCopyMarkdown` and `onCopyHtml` walk `newsletter.sections` and write to clipboard via `navigator.clipboard`.
- **Persistence** — localStorage keys: `pokewatch:feeds`, `pokewatch:newsletter-draft`, `pokewatch:filters`, `pokewatch:onboarding`, `pokewatch:theme`, `pokewatch:ui-panel`.

## Reference Documents

- `product-plan/` — Complete design handoff package
  - `instructions/incremental/01-shell.md`, `02-workspace.md` — Implementation guides
  - `sections/workspace/tests.md` — Framework-agnostic test specs
  - `design-system/`, `data-shapes/`, `shell/`, `sections/` — Assets

## User Email

joseph.deffayet@gmail.com
