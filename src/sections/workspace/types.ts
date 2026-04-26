export type FeedAccentColor =
  | 'sky'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'violet'
  | 'cyan'
  | 'orange'
  | 'pink'

export interface RssFeed {
  id: string
  title: string
  url: string
  isActive: boolean
  accentColor: FeedAccentColor
  lastSyncedAt: string | null
}

export interface Article {
  id: string
  feedId: string
  title: string
  description: string
  url: string
  publishedAt: string
  imageUrl: string | null
  sourceName: string
  isSelected: boolean
}

export interface SearchFilters {
  dateFrom: string | null
  dateTo: string | null
  activeFeedIds: string[]
  keyword: string
  limit: number
}

export type NewsletterStatus = 'draft' | 'generating' | 'ready' | 'error'
export type NewsletterFormat = 'markdown' | 'html'
export type EventTag =
  | 'event'
  | 'raid'
  | 'update'
  | 'community'
  | 'research'
  | 'spotlight'
  | 'misc'

export interface NewsletterItem {
  id: string
  sourceArticleId: string
  title: string
  description: string
  imageUrl: string | null
  sourceUrl: string
  sourceName: string
  bullets: string[]
}

export interface NewsletterSection {
  id: string
  title: string
  tag: EventTag
  items: NewsletterItem[]
}

export interface Newsletter {
  id: string
  title: string
  generatedAt: string | null
  status: NewsletterStatus
  format: NewsletterFormat
  sections: NewsletterSection[]
}

export type AiProvider = 'gemini' | 'anthropic' | 'openai' | 'custom'

export interface SetupState {
  /** Splashscreen has been displayed at least once. */
  splashSeen: boolean
  /** Guided app tour has been completed (or skipped). */
  tourSeen: boolean
  /** First-launch wizard (provider + initial feeds) has been completed. */
  wizardSeen: boolean
  /** Currently selected AI provider for newsletter generation. */
  provider: AiProvider
}

export type ActivePanel = 'rss' | 'newsletter'

export interface WorkspaceUiState {
  activePanel: ActivePanel
  isFetching: boolean
  isGenerating: boolean
  isSettingsOpen: boolean
  lastCopyFormat: NewsletterFormat | null
}

export interface WorkspaceProps {
  feeds: RssFeed[]
  filters: SearchFilters
  articles: Article[]
  newsletter: Newsletter
  ui: WorkspaceUiState

  /** Open the settings drawer (feed CRUD, API key, format prefs). */
  onOpenSettings?: () => void
  /** Switch the active panel on mobile (rss vs newsletter). */
  onChangeActivePanel?: (panel: ActivePanel) => void

  /** Add a new RSS feed by URL. Validation handled by host. */
  onAddFeed?: (input: { url: string; title?: string }) => void
  /** Remove an RSS feed by id. */
  onRemoveFeed?: (feedId: string) => void
  /** Toggle a feed active flag. */
  onToggleFeedActive?: (feedId: string, isActive: boolean) => void

  /** Update one or more search filters. */
  onUpdateFilters?: (next: Partial<SearchFilters>) => void
  /** Trigger the RSS fetch using current filters. */
  onFetchArticles?: () => void

  /** Toggle a single article selection state. */
  onToggleArticleSelection?: (articleId: string, isSelected: boolean) => void
  /** Select all currently fetched articles. */
  onSelectAllArticles?: () => void
  /** Deselect all currently fetched articles. */
  onDeselectAllArticles?: () => void

  /** Trigger newsletter generation from selected articles. */
  onGenerateNewsletter?: () => void
  /** Re-run generation on the same selected articles. */
  onRegenerateNewsletter?: () => void

  /** Edit a section title inline. */
  onEditSectionTitle?: (sectionId: string, title: string) => void
  /** Reorder sections by passing the new ordered list of section ids. */
  onReorderSections?: (orderedSectionIds: string[]) => void
  /** Delete a section entirely. */
  onDeleteSection?: (sectionId: string) => void

  /** Edit an item title inline. */
  onEditItemTitle?: (itemId: string, title: string) => void
  /** Edit an item short description inline. */
  onEditItemDescription?: (itemId: string, description: string) => void

  /** Update a specific bullet by index inside an item. */
  onEditItemBullet?: (itemId: string, bulletIndex: number, value: string) => void
  /** Append a new bullet at the end of an item bullets list. */
  onAddItemBullet?: (itemId: string) => void
  /** Remove a bullet by index. */
  onRemoveItemBullet?: (itemId: string, bulletIndex: number) => void
  /** Reorder bullets inside an item by passing the new ordered list of values. */
  onReorderItemBullets?: (itemId: string, orderedBullets: string[]) => void

  /** Replace an item image with a new URL (from another article or pasted). */
  onReplaceItemImage?: (itemId: string, imageUrl: string) => void
  /** Remove the item image. */
  onRemoveItemImage?: (itemId: string) => void

  /** Copy the newsletter to clipboard in markdown format. */
  onCopyMarkdown?: () => void
  /** Copy the newsletter to clipboard in HTML rich format. */
  onCopyHtml?: () => void
}
