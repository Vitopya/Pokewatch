# Test Specs: Workspace

These test specs are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

Workspace is Gazette's main and only screen. It manages RSS feeds, runs filtered searches, lets the user select articles, generates a newsletter via Claude, and supports inline editing + clipboard copy. These tests cover onboarding, search/selection, generation states, inline editing, and clipboard export.

---

## User Flow Tests

### Flow 1: First-Launch Onboarding

**Scenario:** A new user opens Gazette for the first time and walks through the 3-step onboarding.

#### Success Path

**Setup:**
- `onboarding.completed === false`
- `onboarding.currentStep === 1`
- All steps `completed === false`

**Steps:**
1. User loads the workspace
2. User sees the centered onboarding card with heading "Trois étapes pour ta première newsletter"
3. User sees a progress bar at "0/3"
4. User sees three step cards: "Connecter Claude API", "Ajouter un premier flux RSS", "Lancer une recherche"
5. User clicks the first step card

**Expected Results:**
- [ ] Onboarding card is rendered (workspace panels are NOT visible)
- [ ] Progress bar shows `0%` width
- [ ] Step 1 has the active styling (sky border, sky background tint)
- [ ] Steps 2 and 3 have neutral styling
- [ ] Clicking step 1 calls `onOpenSettings`
- [ ] Clicking step 2 also calls `onOpenSettings`
- [ ] Clicking step 3 calls `onCompleteOnboardingStep('first-search')`
- [ ] Completed steps render emerald background and check icon
- [ ] When all 3 steps are completed and `onboarding.completed === true`, the workspace panels replace the onboarding card

#### Failure Path: Active Step Click With No Settings Handler

**Steps:**
1. User clicks an active step card while `onOpenSettings` is undefined

**Expected Results:**
- [ ] No error thrown — optional chaining swallows the call
- [ ] Step is not marked as completed (no `onCompleteOnboardingStep` triggered for steps 1 and 2)

---

### Flow 2: Configure Filters and Run Search

**Scenario:** User configures search filters and fetches articles from active RSS feeds.

#### Success Path

**Setup:**
- `onboarding.completed === true`
- At least 2 active feeds in `feeds`
- `articles` is empty
- `ui.isFetching === false`

**Steps:**
1. User views the left panel "Sources et filtres"
2. User changes the "Du" date input to a new value
3. User changes the "Au" date input to a new value
4. User clicks one of the source pills (toggles it off)
5. User types "raid" in the keyword field
6. User changes the limit input to 10
7. User clicks "Rechercher les articles"

**Expected Results:**
- [ ] `onUpdateFilters` is called with `{ dateFrom: <new value> }` after step 2
- [ ] `onUpdateFilters` is called with `{ dateTo: <new value> }` after step 3
- [ ] `onUpdateFilters` is called with `{ activeFeedIds: <updated array> }` after step 4
- [ ] `onToggleFeedActive` is also called with the feed id and the new state after step 4
- [ ] `onUpdateFilters` is called with `{ keyword: 'raid' }` after step 5
- [ ] `onUpdateFilters` is called with `{ limit: 10 }` after step 6
- [ ] `onFetchArticles` is called once after step 7
- [ ] When `ui.isFetching === true`, the "Rechercher" button shows "Recherche en cours…" with a spinning icon and is disabled
- [ ] When all active feed ids are removed from `filters.activeFeedIds`, the "Rechercher" button is disabled

#### Failure Path: Limit Input Below Minimum

**Steps:**
1. User clears the limit input and types "0"

**Expected Results:**
- [ ] `onUpdateFilters` is called with `{ limit: 1 }` (clamped to minimum 1)

#### Failure Path: No Feeds Configured

**Steps:**
1. User has no feeds (`feeds` is `[]`) and reaches the workspace

**Expected Results:**
- [ ] The source toggles area shows the message "Aucun flux activé. Gère tes flux dans les paramètres."
- [ ] The "Rechercher" button is disabled
- [ ] The empty state in the article list shows "Lance une recherche pour récupérer les derniers articles de tes flux RSS."

---

### Flow 3: Select Articles and Generate Newsletter

**Scenario:** After fetching articles, the user adjusts selection and triggers newsletter generation.

#### Success Path

**Setup:**
- `articles` contains 10 items, mixed `isSelected` states (e.g., 8 selected, 2 not)
- `ui.isFetching === false`
- `ui.isGenerating === false`
- `newsletter.status === 'ready'`

**Steps:**
1. User views the article list in the left panel
2. User reads the counter "8 / 10 sélectionnés"
3. User clicks "Tout retirer"
4. User clicks an article card to re-select it (clicks the visible custom checkbox)
5. User clicks "Tout sélectionner"
6. User clicks "Générer la newsletter (10)"

**Expected Results:**
- [ ] Each article renders as a card with thumbnail, source badge with accent dot, relative date, and 2-line title clamp
- [ ] Selected articles have sky border styling; unselected have neutral border
- [ ] The counter at the top reflects "<selected> / <total> sélectionnés"
- [ ] Clicking "Tout retirer" calls `onDeselectAllArticles`
- [ ] Clicking an article card calls `onToggleArticleSelection(articleId, true|false)` based on the new state
- [ ] Clicking "Tout sélectionner" calls `onSelectAllArticles`
- [ ] The "Générer la newsletter" button label includes the selected count
- [ ] Clicking "Générer la newsletter" calls `onGenerateNewsletter` once
- [ ] When `ui.isGenerating === true`, the button shows "Génération en cours…" with spinner and is disabled

#### Failure Path: Zero Selection

**Steps:**
1. User has 0 selected articles after deselecting all

**Expected Results:**
- [ ] "Générer la newsletter (0)" button is disabled
- [ ] No call to `onGenerateNewsletter` even if button is clicked

#### Failure Path: External Link Doesn't Toggle Selection

**Steps:**
1. User hovers an article card; the external link icon appears in the top right
2. User clicks the external link icon

**Expected Results:**
- [ ] The link opens in a new tab (`target="_blank"`)
- [ ] `onToggleArticleSelection` is NOT called (event propagation stopped)

---

### Flow 4: Inline Edit Generated Newsletter

**Scenario:** User edits the generated newsletter inline.

#### Success Path

**Setup:**
- `newsletter.status === 'ready'`
- `newsletter.sections` has at least one section with at least one item with at least 2 bullets

**Steps:**
1. User views the right panel newsletter
2. User clicks a section title input, changes it, and blurs the field
3. User clicks an item title input, changes it, and blurs
4. User clicks an item description textarea, changes it, and blurs
5. User clicks a bullet input, changes it, and blurs
6. User clicks "Ajouter un point" on an item
7. User hovers an existing bullet and clicks its X icon
8. User hovers a section header and clicks the trash icon
9. User hovers an item image and clicks the image options button
10. User clicks "Remplacer" and provides a URL in the prompt
11. User reopens the image menu and clicks "Retirer"

**Expected Results:**
- [ ] Section title input renders with sky focus ring on focus
- [ ] After step 2, `onEditSectionTitle(sectionId, newTitle)` is called only if value changed
- [ ] After step 3, `onEditItemTitle(itemId, newTitle)` is called only if value changed
- [ ] After step 4, `onEditItemDescription(itemId, newDescription)` is called only if value changed
- [ ] After step 5, `onEditItemBullet(itemId, bulletIndex, newValue)` is called only if value changed and not empty
- [ ] After step 6, `onAddItemBullet(itemId)` is called once
- [ ] After step 7, `onRemoveItemBullet(itemId, bulletIndex)` is called with the correct index
- [ ] After step 8, `onDeleteSection(sectionId)` is called once
- [ ] After step 10, `onReplaceItemImage(itemId, newUrl)` is called only if URL is non-empty and different
- [ ] After step 11, `onRemoveItemImage(itemId)` is called once
- [ ] When an item has no `imageUrl`, the "Retirer" option is hidden in the image menu

#### Failure Path: Empty Title on Blur

**Steps:**
1. User clears a section title and blurs

**Expected Results:**
- [ ] `onEditSectionTitle` is NOT called (input rejects empty trimmed value)
- [ ] The displayed section title visually keeps the previous value via `defaultValue` (no controlled re-render)

---

### Flow 5: Copy Newsletter to Clipboard

**Scenario:** User copies the newsletter in markdown or HTML format.

#### Success Path

**Setup:**
- `newsletter.status === 'ready'`
- `newsletter.sections` has content
- `ui.lastCopyFormat === null`

**Steps:**
1. User clicks "Copier MD"
2. After the host triggers `setLastCopyFormat('markdown')`, the user re-renders
3. User clicks "Copier HTML"
4. After the host triggers `setLastCopyFormat('html')`, the user re-renders

**Expected Results:**
- [ ] Clicking "Copier MD" calls `onCopyMarkdown` once
- [ ] When `ui.lastCopyFormat === 'markdown'`, the MD button shows emerald background and label "Copié MD"
- [ ] Clicking "Copier HTML" calls `onCopyHtml` once
- [ ] When `ui.lastCopyFormat === 'html'`, the HTML button shows emerald background and label "Copié HTML"
- [ ] On mobile widths, only the icon is visible (label hidden via `sm:inline`)

---

### Flow 6: Mobile Panel Toggle

**Scenario:** On mobile, user switches between RSS panel and Newsletter panel.

#### Success Path

**Setup:**
- Viewport width below 768px
- `ui.activePanel === 'rss'`
- Onboarding completed

**Steps:**
1. User views the workspace; only RSS panel is visible
2. User taps the bottom toggle "Newsletter"
3. User taps the bottom toggle "Sources"

**Expected Results:**
- [ ] On mobile, only the RSS panel is in the visual flow (newsletter panel is hidden via `hidden md:flex`)
- [ ] The bottom toggle bar is visible (sticky, `md:hidden`)
- [ ] The "Sources" button shows sky background when active; "Newsletter" shows rose background when active
- [ ] Clicking "Newsletter" calls `onChangeActivePanel('newsletter')`
- [ ] Clicking "Sources" calls `onChangeActivePanel('rss')`
- [ ] On desktop (≥768px), both panels are always visible side-by-side and the bottom toggle is hidden

---

## Empty State Tests

### Onboarding Empty State

**Scenario:** First launch, no API key configured, no feeds.

**Setup:**
- `onboarding.completed === false`

**Expected Results:**
- [ ] OnboardingCard renders centered, replacing the workspace panels
- [ ] Heading "Trois étapes pour ta première newsletter" is visible
- [ ] Description "Configure tes accès, ajoute tes flux RSS, lance ta première recherche." is visible
- [ ] Progress bar reflects `<completedCount>/<totalSteps>` ratio
- [ ] Three step cards are rendered with icons (KeyRound, Rss, Search)

### No Articles Fetched

**Scenario:** Onboarding done but user has not yet clicked Rechercher.

**Setup:**
- `onboarding.completed === true`
- `articles === []`
- `ui.isFetching === false`

**Expected Results:**
- [ ] The article list zone shows a centered message "Lance une recherche pour récupérer les derniers articles de tes flux RSS."
- [ ] The footer "Générer la newsletter" button is NOT rendered (because `articles.length === 0`)
- [ ] The selection counter is NOT rendered

### No Newsletter Generated Yet

**Scenario:** User has fetched articles but has never generated a newsletter.

**Setup:**
- `newsletter.sections === []`
- `ui.isGenerating === false`
- `newsletter.status !== 'generating'`

**Expected Results:**
- [ ] The newsletter panel content area shows a centered empty state
- [ ] Empty state displays the heading "Aucune newsletter pour le moment"
- [ ] Empty state shows the helper text "Sélectionne des articles puis lance la génération depuis le panneau gauche."
- [ ] The copy buttons in the header are still rendered (they are no-ops on empty content if implementation chooses, or work on `[]`)

### Generating State Skeleton

**Scenario:** Generation is in progress.

**Setup:**
- `ui.isGenerating === true` OR `newsletter.status === 'generating'`

**Expected Results:**
- [ ] The newsletter panel renders the `NewsletterSkeleton` component
- [ ] Skeleton shows 3 placeholder sections, each with 2 placeholder items
- [ ] Each item placeholder has an image rectangle, title bar, description bar, and 3 bullet bars
- [ ] Skeleton has `animate-pulse` class
- [ ] The "Régénérer" button shows a spinning icon and is disabled

---

## Component Interaction Tests

### ArticleCard

**Renders correctly:**
- [ ] Displays the article title with `line-clamp-2` (max 2 lines)
- [ ] Displays the source name from the linked feed (or article.sourceName as fallback)
- [ ] Displays a colored accent dot matching the feed's `accentColor`
- [ ] Displays a relative date (e.g., "il y a 3 h", "il y a 2 j", or formatted date for older)
- [ ] Renders the thumbnail image when `imageUrl` is non-null
- [ ] Hides the thumbnail container gracefully if image fails to load (`onError` hides the image element)

**User interactions:**
- [ ] Clicking the card toggles the selection (calls `onToggleSelection(!isSelected)`)
- [ ] The custom checkbox visually shows a check icon when selected
- [ ] On hover, an "Open external" icon appears in the top right; clicking it opens the article URL in a new tab
- [ ] Clicking the external link does NOT toggle selection

### EventTagBadge

**Renders correctly:**
- [ ] Displays the localized tag label ("Événement", "Raid", "Mise à jour", etc.)
- [ ] Applies the correct color classes for each tag (sky for event, rose for raid, emerald for update, amber for community, violet for research, orange for spotlight, zinc for misc)
- [ ] Shows a colored dot before the label

### NewsletterItemCard

**Renders correctly:**
- [ ] Displays the item image when `imageUrl` is non-null; otherwise displays an `ImageOff` icon placeholder
- [ ] Renders title and description as editable inputs (but visually styled like static text)
- [ ] Renders bullets as a list with sky bullet markers

**User interactions:**
- [ ] Hovering an item shows the image options button overlay
- [ ] Clicking the options button toggles a small menu with "Remplacer" and (if image exists) "Retirer"
- [ ] Hovering a bullet shows the X removal icon; clicking calls `onRemoveBullet(index)`
- [ ] The "Ajouter un point" link calls `onAddBullet`

---

## Edge Cases

- [ ] Handles very long article titles via `line-clamp-2` (truncated with ellipsis)
- [ ] Handles articles with `imageUrl: null` gracefully (no broken image, no thumbnail container)
- [ ] Handles 0 articles, 1 article, 10 articles, 100+ articles (article list scrolls within its container)
- [ ] Handles 0 sections in newsletter (empty state instead of skeleton)
- [ ] Handles a section with 0 items (renders header but no items list)
- [ ] Handles an item with 0 bullets (only the "Ajouter un point" button is rendered)
- [ ] Selection counter updates correctly when toggling individual articles vs. select-all/deselect-all
- [ ] When the workspace renders inside the AppShell, vertical overflow is contained: each panel scrolls internally, no global page scroll
- [ ] On mobile, switching panels preserves scroll position within each panel (browser default)
- [ ] Theme switching (light → dark) updates all panel surfaces, including gradients and skeleton colors
- [ ] Source filter pills handle 1 feed, 5 feeds, and 20+ feeds (wraps via `flex-wrap`)
- [ ] Date inputs accept null (no date set) without errors
- [ ] Copy button "lastCopyFormat" indicator is mutually exclusive (only one button at a time shows the success state)

---

## Accessibility Checks

- [ ] All interactive elements (buttons, checkboxes, inputs) are keyboard accessible (Tab navigation reaches them)
- [ ] Focus rings are visible on all interactive elements (sky-500 ring)
- [ ] Form fields have ARIA labels or visible label spans
- [ ] Icon-only buttons have descriptive `aria-label` attributes (e.g., "Ouvrir paramètres", "Régénérer la newsletter", "Supprimer la section")
- [ ] The article checkbox is functional via keyboard (the visible checkbox is a `<label>` wrapping a hidden `<input type="checkbox">` with `peer`)
- [ ] Error/empty messages are visible to screen readers (text in DOM, not background images)
- [ ] Drag-and-drop alternative for keyboard users is implemented (currently a TODO — see `onReorderSections` and `onReorderItemBullets` callbacks)
- [ ] Color is not the only indicator: source toggles use both color dot AND label text; selected articles use both border color AND background tint AND check icon

---

## Sample Test Data

Use the data from `sample-data.json` or create variations:

```typescript
import type {
  Article,
  Newsletter,
  OnboardingState,
  RssFeed,
  SearchFilters,
  WorkspaceUiState,
} from './types'

// Populated state (newsletter ready, articles fetched)
const mockFeeds: RssFeed[] = [
  {
    id: 'feed-source-a',
    title: 'Source A',
    url: 'https://example.com/feed-a.xml',
    isActive: true,
    accentColor: 'sky',
    lastSyncedAt: '2026-04-25T08:12:00Z',
  },
  {
    id: 'feed-source-b',
    title: 'Source B',
    url: 'https://example.com/feed-b/feed/',
    isActive: true,
    accentColor: 'rose',
    lastSyncedAt: '2026-04-25T08:12:00Z',
  },
]

const mockFilters: SearchFilters = {
  dateFrom: '2026-04-18',
  dateTo: '2026-04-25',
  activeFeedIds: ['feed-source-a', 'feed-source-b'],
  keyword: '',
  limit: 25,
}

const mockArticle: Article = {
  id: 'article-001',
  feedId: 'feed-source-a',
  title: 'Community Day de mai 2026 : Tepig devient sujet vedette',
  description: 'Niantic annonce officiellement Tepig.',
  url: 'https://topicgohub.net/post/news/tepig-cd-2026/',
  publishedAt: '2026-04-24T14:30:00Z',
  imageUrl: 'https://images.example/tepig.jpg',
  sourceName: 'Source A',
  isSelected: true,
}

const mockNewsletterReady: Newsletter = {
  id: 'newsletter-1',
  title: 'Gazette — Hebdo du 25 avril 2026',
  generatedAt: '2026-04-25T08:30:00Z',
  status: 'ready',
  format: 'markdown',
  sections: [
    {
      id: 'section-events',
      title: 'Événements à venir',
      tag: 'event',
      items: [
        {
          id: 'item-001',
          sourceArticleId: 'article-001',
          title: 'Community Day de mai',
          description: 'Tepig vedette.',
          imageUrl: 'https://images.example/tepig.jpg',
          sourceUrl: 'https://topicgohub.net/post/news/tepig-cd-2026/',
          sourceName: 'Source A',
          bullets: ['10 mai 14h–17h', 'Bonus poussière x3'],
        },
      ],
    },
  ],
}

const mockOnboardingPending: OnboardingState = {
  currentStep: 1,
  completed: false,
  steps: [
    { key: 'api-key', title: 'Connecter Claude API', description: '…', completed: false },
    { key: 'first-feed', title: 'Ajouter un premier flux RSS', description: '…', completed: false },
    { key: 'first-search', title: 'Lancer une recherche', description: '…', completed: false },
  ],
}

const mockOnboardingDone: OnboardingState = {
  currentStep: 3,
  completed: true,
  steps: mockOnboardingPending.steps.map((s) => ({ ...s, completed: true })),
}

const mockUi: WorkspaceUiState = {
  activePanel: 'newsletter',
  isFetching: false,
  isGenerating: false,
  isSettingsOpen: false,
  lastCopyFormat: null,
}

// Empty states
const mockEmptyArticles: Article[] = []
const mockEmptyNewsletter: Newsletter = { ...mockNewsletterReady, sections: [] }
```
