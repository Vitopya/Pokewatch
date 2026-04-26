# Milestone 2: Workspace

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Shell) complete

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

## Goal

Implement the **Workspace** feature — Gazette's main and only screen, which combines RSS feed management, search filters, article selection, newsletter generation, inline editing, and clipboard export.

## Overview

Users land on the Workspace right after the shell loads. If onboarding is not yet complete (`onboarding.completed === false`), the screen shows a centered 3-step onboarding card. Once onboarding is done, the screen splits into two panels: RSS sources and filters on the left, generated newsletter on the right. The user fetches articles from configured RSS feeds, selects which ones to include, generates a newsletter via Claude, edits it inline, and copies the result to the clipboard in markdown or HTML.

**Key Functionality:**
- 3-step onboarding for first launch (Claude API key, first RSS feed, first search)
- Filter and fetch articles from configured RSS feeds (date range, source toggles, keyword, limit)
- Article selection via checkboxes with select-all / deselect-all
- Newsletter generation via Claude with auto-grouping by event tag (raid, event, update, etc.)
- Skeleton loading state during generation
- Inline editing of newsletter sections, items, descriptions, bullets, and images
- Clipboard copy in markdown or HTML rich format with success feedback
- Mobile-first responsive layout (panels stack with bottom toggle below 768px)

## Components Provided

Copy from `product-plan/sections/workspace/components/`:

- **`Workspace`** — Top-level orchestrator. Handles onboarding empty state, desktop/mobile layout switching, and dispatches callbacks
- **`RssPanel`** — Left panel: header, filter controls, fetch button, article list with selection, footer Generate button
- **`NewsletterPanel`** — Right panel: header (status, copy MD/HTML, regenerate), skeleton during generation, newsletter content with editable sections
- **`FilterControls`** — Date range pickers, source toggles, keyword input, limit input
- **`ArticleCard`** — Single article row with custom checkbox, thumbnail, title, source badge, relative date, external link
- **`NewsletterSectionCard`** — Section header (drag handle, tag badge, editable title, item count, delete button) + child items
- **`NewsletterItemCard`** — Editable item: image (with replace/remove menu), title, description, bullet list with add/remove/edit, source link
- **`NewsletterSkeleton`** — Animated placeholder during generation (3 sections × 2 items)
- **`OnboardingCard`** — 3-step onboarding empty state with progression bar, icons, active/completed states
- **`EventTagBadge`** — Color-coded pill per event tag

## Props Reference

The components expect these data shapes (see `types.ts` for full definitions):

**Data props (passed to `<Workspace>`):**
- `feeds: RssFeed[]` — configured feeds with id, title, url, isActive, accentColor, lastSyncedAt
- `filters: SearchFilters` — current filter state (dateFrom, dateTo, activeFeedIds, keyword, limit)
- `articles: Article[]` — fetched articles with isSelected flag
- `newsletter: Newsletter` — generated newsletter (sections, items, status, format)
- `onboarding: OnboardingState` — first-launch progress (currentStep, completed, steps)
- `ui: WorkspaceUiState` — UI slice (activePanel, isFetching, isGenerating, lastCopyFormat)

**Callback props:**

| Callback                        | Triggered When                                                       |
| ------------------------------- | -------------------------------------------------------------------- |
| `onOpenSettings`                | User opens settings (gérer les flux, settings icon, user menu)       |
| `onChangeActivePanel`           | User taps mobile bottom toggle                                       |
| `onAddFeed`                     | User adds a feed in settings drawer                                  |
| `onRemoveFeed`                  | User deletes a feed                                                  |
| `onToggleFeedActive`            | User toggles a feed in source filters                                |
| `onUpdateFilters`               | User changes any filter                                              |
| `onFetchArticles`               | User clicks "Rechercher"                                             |
| `onToggleArticleSelection`      | User checks/unchecks an article                                      |
| `onSelectAllArticles`           | User clicks "Tout sélectionner"                                      |
| `onDeselectAllArticles`         | User clicks "Tout retirer"                                           |
| `onGenerateNewsletter`          | User clicks "Générer la newsletter"                                  |
| `onRegenerateNewsletter`        | User clicks "Régénérer"                                              |
| `onEditSectionTitle`            | User edits a section title                                           |
| `onReorderSections`             | User drags sections to a new order                                   |
| `onDeleteSection`               | User deletes a section                                               |
| `onEditItemTitle`               | User edits an item title                                             |
| `onEditItemDescription`         | User edits an item description                                       |
| `onEditItemBullet`              | User edits a single bullet                                           |
| `onAddItemBullet`               | User adds a bullet                                                   |
| `onRemoveItemBullet`            | User removes a bullet                                                |
| `onReorderItemBullets`          | User reorders bullets                                                |
| `onReplaceItemImage`            | User replaces an item image                                          |
| `onRemoveItemImage`             | User removes an item image                                           |
| `onCopyMarkdown`                | User clicks "Copier MD"                                              |
| `onCopyHtml`                    | User clicks "Copier HTML"                                            |
| `onCompleteOnboardingStep`      | User completes an onboarding step                                    |

## Expected User Flows

### Flow 1: First-Launch Onboarding

1. New user lands on the workspace
2. User sees the OnboardingCard with three steps (Claude API key, first feed, launch search)
3. User clicks step 1 — settings drawer opens, user pastes Claude API key
4. User clicks step 2 — settings drawer opens, user adds first RSS feed
5. User clicks step 3 — `onCompleteOnboardingStep('first-search')` fires; host marks onboarding complete and the workspace panels replace the OnboardingCard
6. **Outcome:** Workspace is in normal split view, ready to search

### Flow 2: Search and Generate

1. User configures filters (dates, source toggles, keyword, limit)
2. User clicks "Rechercher les articles" — host fetches via RSS proxy/parser
3. Articles appear as cards in the left list with all `isSelected: true` by default
4. User unchecks 2 articles to exclude them
5. User clicks "Générer la newsletter (8)"
6. Right panel shows `NewsletterSkeleton` while host calls Claude API
7. Claude returns sections + items with auto-tagged event types
8. **Outcome:** Newsletter renders in the right panel, ready to edit/copy

### Flow 3: Inline Edit and Copy

1. User clicks an item title, types a refined version, blurs — `onEditItemTitle` fires
2. User clicks the X next to a bullet — `onRemoveItemBullet` fires
3. User clicks "Ajouter un point" — `onAddItemBullet` fires; host appends an empty bullet and the user starts typing
4. User hovers an image, clicks the menu, chooses "Remplacer", pastes a new URL
5. User clicks "Copier MD" — host serializes the newsletter to markdown and writes to clipboard
6. **Outcome:** Button shows green "Copié MD" feedback for 2-3 seconds; markdown is in clipboard

### Flow 4: Mobile Panel Switch

1. On a mobile viewport, only the RSS panel is visible (default `activePanel === 'rss'`)
2. User configures filters, fetches, selects articles
3. User taps the rose "Newsletter" button in the bottom toggle bar — `onChangeActivePanel('newsletter')`
4. **Outcome:** Newsletter panel becomes visible, RSS panel is hidden

## Empty States

The components include empty state designs. Make sure to handle:

- **Onboarding incomplete** (`onboarding.completed === false`): Workspace renders the centered OnboardingCard instead of the panels
- **No articles fetched** (`articles === []`): Left panel shows "Lance une recherche pour récupérer les derniers articles de tes flux RSS." Footer Generate button is hidden
- **No active feeds** (`feeds.filter(f => f.isActive) === []`): Filter controls show "Aucun flux activé. Gère tes flux dans les paramètres." The Rechercher button is disabled
- **No newsletter yet** (`newsletter.sections === []`): Right panel shows centered empty state with "Aucune newsletter pour le moment"
- **Generating** (`ui.isGenerating === true` or `newsletter.status === 'generating'`): Right panel shows the `NewsletterSkeleton`
- **Item with no image** (`item.imageUrl === null`): Image slot shows `ImageOff` icon placeholder; "Retirer" option is hidden in the image menu
- **Item with no bullets**: Only the "Ajouter un point" link is rendered

## Backend Considerations

These are **out of scope** for this handoff but you'll need to implement them:

### RSS Fetching

The browser cannot fetch most RSS feeds directly due to CORS. Options:
- Backend proxy that fetches RSS server-side and returns parsed JSON
- Third-party service (e.g., RSS-to-JSON APIs)
- Browser extension (limits portability)

The components don't care how RSS is fetched — they receive `articles` as a prop.

### Claude API Integration

Build the generation pipeline in your host code. Recommended approach:
1. Take the user-selected articles' titles + descriptions + URLs
2. Send to Claude with a system prompt that asks for:
   - Synthesis of each article into a NewsletterItem (title, description, bullets)
   - Auto-categorization with one of the `EventTag` enum values
   - Grouping items into NewsletterSections by tag
3. Parse Claude's structured output (JSON or tool-use) into the `Newsletter` shape
4. Set `newsletter.status` to `'generating'` while in flight, then to `'ready'`

Use `claude-sonnet-4-6` as the default model. Enable prompt caching for the system prompt + feed metadata to keep costs low across regenerations.

### Clipboard Serialization

Implement `onCopyMarkdown` and `onCopyHtml` to:
1. Walk the `newsletter.sections` array
2. Serialize each section + items + bullets to the target format
3. Write to clipboard via `navigator.clipboard.writeText` (markdown) or `navigator.clipboard.write` with `ClipboardItem` for rich HTML
4. Update `ui.lastCopyFormat` to trigger the success state on the button (host-controlled state, set null again after 2-3 seconds)

### Persistence

Store in localStorage:
- `gazette:feeds` — RssFeed[]
- `gazette:newsletter-draft` — Newsletter (last generated, with edits)
- `gazette:filters` — last filter state
- `gazette:onboarding` — OnboardingState
- `gazette:api-key` — Claude API key (consider warning user about plain-text storage)
- `gazette:theme` — 'light' | 'dark'

## Testing

See `product-plan/sections/workspace/tests.md` for UI behavior test specs covering:
- Onboarding flow
- Filter configuration and search
- Article selection and generation
- Inline editing
- Clipboard copy
- Mobile panel toggle
- Empty states and edge cases
- Accessibility checks

## Files to Reference

- `product-plan/sections/workspace/README.md` — Feature overview and design intent
- `product-plan/sections/workspace/tests.md` — UI behavior test specs
- `product-plan/sections/workspace/components/` — React components
- `product-plan/sections/workspace/types.ts` — TypeScript interfaces
- `product-plan/sections/workspace/sample-data.json` — Test data

## Done When

- [ ] Workspace renders the OnboardingCard when `onboarding.completed === false`
- [ ] Workspace renders both panels side-by-side on desktop, stacked with bottom toggle on mobile
- [ ] All filter inputs fire `onUpdateFilters` with correct partial values
- [ ] "Rechercher" calls `onFetchArticles` and shows loading state via `ui.isFetching`
- [ ] Article cards render with thumbnail, source badge with accent dot, relative date, 2-line title clamp
- [ ] Selection counter, Tout sélectionner, Tout retirer all work
- [ ] "Générer la newsletter" calls `onGenerateNewsletter` and respects disabled state when 0 selected
- [ ] Skeleton renders during generation (3 sections × 2 items)
- [ ] Newsletter sections/items/bullets are editable inline (defaultValue + onBlur callbacks)
- [ ] Image replace/remove menu works
- [ ] Section delete button works
- [ ] Copy MD / Copy HTML buttons fire callbacks and show success state when `ui.lastCopyFormat` matches
- [ ] Mobile bottom toggle switches between rss and newsletter panels
- [ ] Theme switching (light → dark) updates all surfaces correctly
- [ ] Layout fits 100% viewport height (`h-dvh`) without page-level scroll
- [ ] User can complete onboarding → search → select → generate → edit → copy end-to-end
