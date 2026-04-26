# Workspace

## Overview

Workspace is Gazette's main and only screen. It combines RSS feed management, search filters, article selection, and newsletter generation/edition in a vertical split view (panels side-by-side, left/right, separated by a vertical divider).

## User Flows

- **First launch** — 3-step onboarding (1. Claude API key, 2. first RSS feed, 3. launch search), with visible progression and dedicated CTA per step
- **Configure filters** in the left panel: date range, active sources (per-feed toggle), keyword, limit
- **Launch RSS search** via the "Rechercher" button: button shows loading state, fetches candidate articles
- **Browse and select articles** fetched: list with checkbox, image thumbnail, title, source, date, selection counter
- **Deselect articles** to exclude from the newsletter
- **Generate newsletter** via "Générer la newsletter" button: right panel shows skeleton (placeholder sections + items), then the full newsletter replaces the skeleton
- **Inline-edit the newsletter**: titles and descriptions on click, add/remove/reorder bullet points, replace or remove images, reorder and delete sections
- **Copy to clipboard** in raw markdown or rich HTML (two distinct buttons), success toast feedback
- **Regenerate the newsletter** on the same selected articles
- **Open Settings drawer** to manage RSS feeds (CRUD), Claude API key, and export format

## Design Decisions

- **Single-font system** — Plus Jakarta Sans is used for both headings and body text, paired with JetBrains Mono for micro-labels (uppercase tracking-widest), timestamps, dates, and event tags. Keeps cognitive overhead low while maintaining technical character.
- **Split vertical, asymmetric** — left panel is `minmax(320px, 40%)`, right panel takes the remaining 60%. Newsletter (the output) is the focus, not the input controls.
- **Subtle gradient atmospherics** — radial sky gradient on the onboarding background, soft rose gradient at the top of the newsletter panel header. Just enough to add depth without noise.
- **Per-feed accent dots** — each RSS feed has an `accentColor` (sky, rose, amber, etc.) shown as a 1.5px colored dot in source toggles and on article cards. Quick visual identification of source.
- **Color-coded event tags** — newsletter sections carry an `EventTag` (event/raid/update/community/research/spotlight/misc), each with its own pill color. Reinforces the LLM's auto-categorization.
- **Inline edit on blur** — titles, descriptions, and bullets use defaultValue inputs that fire `onEdit*` callbacks on blur if the value changed. No save button per field.
- **Mobile bottom toggle** — below 768px, only one panel is visible at a time. A sticky bottom bar with two buttons (sky for Sources, rose for Newsletter) switches between them.

## Data Shapes

**Section types** (`types.ts`):
- `RssFeed`, `Article`, `SearchFilters` — feed/search domain
- `Newsletter`, `NewsletterSection`, `NewsletterItem`, `EventTag`, `NewsletterStatus`, `NewsletterFormat` — newsletter domain
- `OnboardingStep`, `OnboardingState`, `OnboardingStepKey` — first-launch flow
- `WorkspaceUiState`, `ActivePanel` — UI state slice
- `WorkspaceProps` — main component contract

## Visual Reference

See screenshots in this folder if available.

## Components Provided

- **`Workspace`** — Top-level orchestrator. Handles onboarding empty state, desktop/mobile layout switching, and dispatches all callback props to child panels.
- **`RssPanel`** — Left panel. Header, filter controls, fetch button, articles list with selection, footer "Generate" button.
- **`NewsletterPanel`** — Right panel. Header (status, copy MD/HTML, regenerate), skeleton during generation, newsletter content with editable sections.
- **`FilterControls`** — Date range pickers, source toggles, keyword input, limit input.
- **`ArticleCard`** — Single article row with custom checkbox, thumbnail, title (2-line clamp), source badge, relative date, external link.
- **`NewsletterSectionCard`** — Section header with drag handle, tag badge, editable title, item count, delete button. Renders child items.
- **`NewsletterItemCard`** — Editable item: image (with replace/remove menu), title, description, bullet list with add/remove/edit, source link.
- **`NewsletterSkeleton`** — Animated placeholder shown during generation (3 sections × 2 items).
- **`OnboardingCard`** — Empty state for first launch. 3 steps with progression bar, icons, active/completed states.
- **`EventTagBadge`** — Color-coded pill per event tag (sky for event, rose for raid, emerald for update, etc.).

## Callback Props

| Callback                        | Triggered When                                                       |
| ------------------------------- | -------------------------------------------------------------------- |
| `onOpenSettings`                | User clicks "Gérer les flux", settings icon, or user menu Settings    |
| `onChangeActivePanel`           | User taps mobile bottom toggle (rss / newsletter)                    |
| `onAddFeed`                     | User adds a new feed in the settings drawer                          |
| `onRemoveFeed`                  | User deletes a feed                                                  |
| `onToggleFeedActive`            | User toggles a feed in source filters                                |
| `onUpdateFilters`               | User changes any filter (date, keyword, limit, sources)              |
| `onFetchArticles`               | User clicks "Rechercher"                                             |
| `onToggleArticleSelection`      | User checks/unchecks an article                                      |
| `onSelectAllArticles`           | User clicks "Tout sélectionner"                                      |
| `onDeselectAllArticles`         | User clicks "Tout retirer"                                           |
| `onGenerateNewsletter`          | User clicks "Générer la newsletter"                                  |
| `onRegenerateNewsletter`        | User clicks "Régénérer" in newsletter header                         |
| `onEditSectionTitle`            | User edits a section title (on input blur with changed value)        |
| `onReorderSections`             | User drags sections to a new order                                   |
| `onDeleteSection`               | User clicks the trash icon on a section header                       |
| `onEditItemTitle`               | User edits an item title                                             |
| `onEditItemDescription`         | User edits an item description                                       |
| `onEditItemBullet`              | User edits a single bullet                                           |
| `onAddItemBullet`               | User clicks "Ajouter un point"                                       |
| `onRemoveItemBullet`            | User clicks the X next to a bullet                                   |
| `onReorderItemBullets`          | User drags bullets to a new order                                    |
| `onReplaceItemImage`            | User chooses "Remplacer" in image menu and provides a URL            |
| `onRemoveItemImage`             | User chooses "Retirer" in image menu                                 |
| `onCopyMarkdown`                | User clicks "Copier MD"                                              |
| `onCopyHtml`                    | User clicks "Copier HTML"                                            |
| `onCompleteOnboardingStep`      | User completes an onboarding step (e.g., clicks step 3 CTA)          |
