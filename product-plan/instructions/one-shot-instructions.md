# Gazette — Complete Implementation Instructions

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Testing

Each section includes a `tests.md` file with UI behavior test specs. These are **framework-agnostic** — adapt them to your testing setup.

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

---

## Product Overview

Gazette is a single-screen webapp that turns sujet RSS feeds into structured, illustrated, synthesized newsletters. The left panel manages RSS feeds and search filters; the right panel renders an AI-generated newsletter (grouped by event type), inline-editable, and copyable in markdown or HTML.

### Sections

1. **Workspace** — Main and only screen. Combines RSS feed management, filters, article selection, and newsletter generation/edition in a vertical split (panels side-by-side, gauche/droite).

> Note : la roadmap initiale définissait 5 sections (Gestion flux RSS, Recherche/filtres, Génération, Édition/export, Paramètres). Vu le caractère single-screen du produit, les sections 2/3/4 ont été regroupées dans la section "Workspace". Les sections 1 et 5 (gestion flux + paramètres) sont implémentées sous forme de drawer accessible depuis le shell — à concevoir lors de l'implémentation.

### Product Entities

- **RssFeed** — A configured RSS source (URL, title, isActive, accentColor, lastSyncedAt)
- **Article** — An RSS-fetched article candidate
- **SearchFilters** — Active search criteria (date range, sources, keyword, limit)
- **Newsletter** — Generated newsletter with sections, status, format
- **NewsletterSection** — Group of items by event tag
- **NewsletterItem** — A single rendered event with bullets
- **OnboardingState** — First-launch progression
- **EventTag** — `event | raid | update | community | research | spotlight | misc`

### Design System

- **Primary:** `sky` (Tailwind) — primary actions, focus, accents
- **Secondary:** `rose` (Tailwind) — destructive CTAs, panneau newsletter accent
- **Neutral:** `zinc` (Tailwind) — backgrounds, borders, text
- **Heading & body font:** Plus Jakarta Sans
- **Mono font:** JetBrains Mono (used for micro-labels uppercase tracking-widest, timestamps)

---

# Milestone 1: Shell

## Goal

Set up the design tokens and application shell — the persistent chrome that wraps Gazette's workspace screen.

## What to Implement

### 1. Design Tokens

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind palette mapping
- See `product-plan/design-system/fonts.md` for Google Fonts setup

Gazette uses **Tailwind CSS v4** (no `tailwind.config.js`). Built-in palettes: `sky-500`, `rose-500`, `zinc-100`, etc.

### 2. Application Shell

Copy from `product-plan/shell/components/` to your project:
- `AppShell.tsx` — Layout wrapper. `h-dvh max-h-dvh overflow-hidden flex flex-col`
- `MainNav.tsx` — Sticky header (h-12 / h-14)
- `UserMenu.tsx` — Avatar dropdown
- `ThemeToggle.tsx` — Light/dark toggle
- `index.ts` — Barrel exports

Gazette is single-screen. Default `navigationItems` to `[]`. Header carries: clickable logo, settings button, theme toggle, user menu.

Implement a **settings drawer** (out of scope for shell components) that supports: feed CRUD, Claude API key input, default copy format, reset localStorage. The shell exposes `onOpenSettings` callback — wire to your drawer.

Persist theme preference in `localStorage` key `gazette:theme`.

## Done When

- [ ] Plus Jakarta Sans + JetBrains Mono loaded via Google Fonts
- [ ] Tailwind palettes `sky`, `rose`, `zinc` usable
- [ ] AppShell renders with `h-dvh` and locks scroll to internal panels
- [ ] Header logo, settings, theme toggle, user menu wired
- [ ] Theme preference persists in `localStorage`
- [ ] Light/dark functional across the shell
- [ ] Responsive (compact < 768px, full ≥ 768px)

---

# Milestone 2: Workspace

## Goal

Implement the **Workspace** feature — Gazette's main and only screen.

## Overview

Users land on the Workspace right after the shell loads. If onboarding is not yet complete, the screen shows a centered 3-step onboarding card. Once done, the screen splits into RSS sources and filters on the left, generated newsletter on the right. The user fetches articles from configured RSS feeds, selects which ones to include, generates a newsletter via Claude, edits it inline, and copies the result to the clipboard.

**Key Functionality:**
- 3-step onboarding for first launch (Claude API key, first RSS feed, first search)
- Filter and fetch articles (date range, source toggles, keyword, limit)
- Article selection with select-all / deselect-all
- Newsletter generation via Claude with auto-grouping by event tag
- Skeleton loading during generation
- Inline editing of sections, items, descriptions, bullets, images
- Clipboard copy in markdown or HTML rich format
- Mobile responsive (panels stack with bottom toggle below 768px)

## Components Provided

Copy from `product-plan/sections/workspace/components/`:
- **`Workspace`** — Top-level orchestrator
- **`RssPanel`** — Left panel
- **`NewsletterPanel`** — Right panel
- **`FilterControls`** — Filter inputs
- **`ArticleCard`** — Article row with checkbox
- **`NewsletterSectionCard`** — Editable section header + items
- **`NewsletterItemCard`** — Editable item with image, title, description, bullets
- **`NewsletterSkeleton`** — Loading placeholder
- **`OnboardingCard`** — 3-step empty state
- **`EventTagBadge`** — Color-coded tag pill

## Props Reference

**Data props:** `feeds`, `filters`, `articles`, `newsletter`, `onboarding`, `ui`

**Callbacks:** `onOpenSettings`, `onChangeActivePanel`, `onAddFeed`, `onRemoveFeed`, `onToggleFeedActive`, `onUpdateFilters`, `onFetchArticles`, `onToggleArticleSelection`, `onSelectAllArticles`, `onDeselectAllArticles`, `onGenerateNewsletter`, `onRegenerateNewsletter`, `onEditSectionTitle`, `onReorderSections`, `onDeleteSection`, `onEditItemTitle`, `onEditItemDescription`, `onEditItemBullet`, `onAddItemBullet`, `onRemoveItemBullet`, `onReorderItemBullets`, `onReplaceItemImage`, `onRemoveItemImage`, `onCopyMarkdown`, `onCopyHtml`, `onCompleteOnboardingStep`

See `product-plan/sections/workspace/types.ts` for full signatures and `product-plan/sections/workspace/README.md` for callback descriptions.

## Expected User Flows

### Flow 1: First-Launch Onboarding
New user → OnboardingCard shows → user clicks step 1 (API key) → settings drawer → user clicks step 2 (first feed) → settings drawer → user clicks step 3 → `onCompleteOnboardingStep('first-search')` → host marks onboarding complete → workspace panels appear.

### Flow 2: Search and Generate
User configures filters → clicks Rechercher → host fetches articles → list renders with all selected → user unchecks 2 → clicks Générer (8) → skeleton shows during Claude call → newsletter renders in right panel.

### Flow 3: Inline Edit and Copy
User clicks item title, edits, blurs → `onEditItemTitle` fires → user clicks X on bullet → `onRemoveItemBullet` fires → user clicks "Ajouter un point" → `onAddItemBullet` fires → user replaces image via menu → user clicks Copier MD → host serializes + writes to clipboard → button turns green "Copié MD".

### Flow 4: Mobile Panel Switch
On mobile, only RSS panel visible → user fetches articles → user taps Newsletter toggle → `onChangeActivePanel('newsletter')` → newsletter panel becomes visible.

## Empty States

- **Onboarding incomplete** → OnboardingCard centered
- **No articles fetched** → "Lance une recherche…" message in left panel; no Generate footer
- **No active feeds** → "Aucun flux activé. Gère tes flux dans les paramètres." Rechercher disabled
- **No newsletter** → "Aucune newsletter pour le moment" centered in right panel
- **Generating** → NewsletterSkeleton in right panel
- **Item with no image** → ImageOff placeholder; "Retirer" hidden in image menu
- **Item with no bullets** → only "Ajouter un point" link

## Backend Considerations

### RSS Fetching
Browser CORS blocks most RSS feeds direct. Options: backend proxy, third-party RSS-to-JSON API, browser extension. Components don't care — they receive `articles` as prop.

### Claude API
Build pipeline in host code:
1. Send selected articles' title + description + URL to Claude
2. System prompt asks for: per-article synthesis (title, description, bullets) + auto-tag with `EventTag` enum + group into NewsletterSections
3. Parse structured output (JSON / tool-use) into `Newsletter` shape
4. Set `newsletter.status` to `'generating'` then `'ready'`

Use `claude-sonnet-4-6` default. Enable prompt caching for system prompt + feed metadata.

### Clipboard Serialization
Implement `onCopyMarkdown` and `onCopyHtml`:
1. Walk `newsletter.sections`
2. Serialize to target format
3. `navigator.clipboard.writeText` (markdown) or `navigator.clipboard.write(ClipboardItem)` (HTML)
4. Update `ui.lastCopyFormat` (host state) — clear after 2-3 seconds

### Persistence
localStorage keys:
- `gazette:feeds`
- `gazette:newsletter-draft`
- `gazette:filters`
- `gazette:onboarding`
- `gazette:api-key` (warn user about plain-text storage)
- `gazette:theme`

## Testing

See `product-plan/sections/workspace/tests.md` for full test specs.

## Done When

- [ ] OnboardingCard renders when `onboarding.completed === false`
- [ ] Both panels side-by-side desktop, stacked + bottom toggle mobile
- [ ] All filter inputs fire `onUpdateFilters`
- [ ] Rechercher calls `onFetchArticles` with loading state
- [ ] Article cards render correctly (thumbnail, dot accent, date, 2-line title)
- [ ] Selection counter + select-all + deselect-all work
- [ ] Générer disabled when 0 selected
- [ ] Skeleton during generation
- [ ] Inline edit (titles, descriptions, bullets) works via blur
- [ ] Image replace/remove menu works
- [ ] Section delete works
- [ ] Copy MD / HTML buttons fire callbacks + show success state
- [ ] Mobile bottom toggle switches panels
- [ ] Theme switching updates all surfaces
- [ ] Layout fits 100% viewport (`h-dvh`) without page-level scroll
- [ ] End-to-end flow works: onboarding → search → select → generate → edit → copy
