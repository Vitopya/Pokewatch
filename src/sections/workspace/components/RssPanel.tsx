import { Loader2, Settings2, Telescope } from 'lucide-react'
import type { Article, RssFeed, SearchFilters } from '../types'
import { ArticleCard } from './ArticleCard'
import { FilterControls } from './FilterControls'

export interface RssPanelProps {
  feeds: RssFeed[]
  filters: SearchFilters
  articles: Article[]
  isFetching: boolean
  isGenerating: boolean
  onOpenSettings?: () => void
  onUpdateFilters?: (next: Partial<SearchFilters>) => void
  onToggleFeedActive?: (feedId: string, isActive: boolean) => void
  onRemoveFeed?: (feedId: string) => void
  onFetchArticles?: () => void
  onToggleArticleSelection?: (articleId: string, isSelected: boolean) => void
  onSelectAllArticles?: () => void
  onDeselectAllArticles?: () => void
  onGenerateNewsletter?: () => void
}

export function RssPanel({
  feeds,
  filters,
  articles,
  isFetching,
  isGenerating,
  onOpenSettings,
  onUpdateFilters,
  onToggleFeedActive,
  onRemoveFeed,
  onFetchArticles,
  onToggleArticleSelection,
  onSelectAllArticles,
  onDeselectAllArticles,
  onGenerateNewsletter,
}: RssPanelProps) {
  const feedById = new Map(feeds.map((feed) => [feed.id, feed]))
  const selectedCount = articles.filter((article) => article.isSelected).length
  const hasArticles = articles.length > 0
  const hasSelection = selectedCount > 0
  const hasFeeds = feeds.length > 0

  return (
    <section
      aria-label="Sources et filtres"
      className="paper-grain flex h-full min-h-0 flex-col bg-bone dark:bg-night"
    >
      <header className="shrink-0 px-3 sm:px-4 py-2.5 border-b-2 border-ink dark:border-night-text flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-baseline gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion shrink-0">
            A · Sources
          </p>
          <span aria-hidden="true" className="text-rule dark:text-night-rule">/</span>
          <h2 className="font-display text-base font-black tracking-tight leading-none text-ink dark:text-night-text truncate">
            Dépêches
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="cursor-pointer inline-flex items-center gap-1.5 border border-ink dark:border-night-text bg-bone dark:bg-night px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink dark:text-night-text hover:bg-ink hover:text-bone dark:hover:bg-night-text dark:hover:text-night transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion shrink-0"
        >
          <Settings2 className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
          Gérer
        </button>
      </header>

      <div
        data-tour="filter-controls"
        className="shrink-0 px-3 sm:px-4 py-3 border-b-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper space-y-3"
      >
        <FilterControls
          feeds={feeds}
          filters={filters}
          onUpdateFilters={onUpdateFilters}
          onToggleFeedActive={onToggleFeedActive}
          onRemoveFeed={onRemoveFeed}
        />

        <button
          type="button"
          onClick={onFetchArticles}
          disabled={isFetching || filters.activeFeedIds.length === 0}
          className="cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-ink dark:bg-night-text text-bone dark:text-night font-mono uppercase tracking-[0.18em] text-[11px] py-2.5 border-2 border-ink dark:border-night-text hover:bg-vermillion hover:border-vermillion hover:text-paper dark:hover:bg-vermillion dark:hover:text-paper dark:hover:border-vermillion transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion focus-visible:ring-offset-2 focus-visible:ring-offset-paper dark:focus-visible:ring-offset-night-paper disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:text-bone disabled:hover:border-ink dark:disabled:hover:bg-night-text dark:disabled:hover:text-night"
        >
          {isFetching ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" strokeWidth={2.5} />
              Réception en cours
            </>
          ) : (
            <>
              <Telescope className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
              Lancer la recherche
            </>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {hasArticles ? (
          <>
            <div className="shrink-0 px-3 sm:px-4 py-1.5 flex items-center justify-between border-b border-rule dark:border-night-rule bg-bone dark:bg-night">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3">
                <span className="text-vermillion font-bold">{String(selectedCount).padStart(2, '0')}</span>
                <span> / {String(articles.length).padStart(2, '0')} retenues</span>
              </span>
              <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.16em]">
                <button
                  type="button"
                  onClick={onSelectAllArticles}
                  className="cursor-pointer text-ink-3 hover:text-ink dark:text-night-text-3 dark:hover:text-night-text underline-offset-4 hover:underline transition-colors"
                >
                  Tout
                </button>
                <span className="text-rule dark:text-night-rule" aria-hidden="true">|</span>
                <button
                  type="button"
                  onClick={onDeselectAllArticles}
                  className="cursor-pointer text-ink-3 hover:text-ink dark:text-night-text-3 dark:hover:text-night-text underline-offset-4 hover:underline transition-colors"
                >
                  Rien
                </button>
              </div>
            </div>
            <ol className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2.5 space-y-2 list-none [counter-reset:wire]">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  feed={feedById.get(article.feedId)}
                  onToggleSelection={(isSelected) => onToggleArticleSelection?.(article.id, isSelected)}
                />
              ))}
            </ol>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center px-6 py-6">
            <div className="text-center max-w-xs">
              <div
                aria-hidden="true"
                className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink dark:border-night-text text-ink dark:text-night-text"
              >
                <Telescope className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">
                Salle vide
              </p>
              <p className="mt-1.5 font-display text-base leading-snug text-ink dark:text-night-text">
                {hasFeeds ? 'Aucune dépêche reçue.' : 'Aucune source configurée.'}
              </p>
              <p className="mt-1 text-xs text-ink-3 dark:text-night-text-3">
                {hasFeeds
                  ? 'Lance la recherche pour rapatrier les derniers articles.'
                  : 'Ouvre les réglages pour ajouter ton premier flux RSS.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {hasArticles && (
        <footer className="shrink-0 px-3 sm:px-4 py-2.5 border-t-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper">
          <button
            type="button"
            onClick={onGenerateNewsletter}
            disabled={!hasSelection || isGenerating}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-vermillion text-paper font-display font-bold tracking-tight text-sm py-2.5 border-2 border-ink dark:border-night-text hover:bg-vermillion-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-night-text focus-visible:ring-offset-2 focus-visible:ring-offset-paper dark:focus-visible:ring-offset-night-paper disabled:opacity-40 disabled:cursor-not-allowed shadow-[3px_3px_0_0_rgba(14,14,12,1)] dark:shadow-[3px_3px_0_0_rgba(232,226,212,0.6)] hover:shadow-[1px_1px_0_0_rgba(14,14,12,1)] dark:hover:shadow-[1px_1px_0_0_rgba(232,226,212,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" strokeWidth={2.5} />
                <span className="font-mono uppercase tracking-[0.18em] text-[11px]">Composition</span>
              </>
            ) : (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Composer</span>
                <span aria-hidden="true" className="opacity-50">·</span>
                <span>Lancer ({selectedCount})</span>
              </>
            )}
          </button>
        </footer>
      )}
    </section>
  )
}
