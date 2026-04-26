import { useState } from 'react'
import type { RssFeed, SearchFilters } from '../types'
import { Calendar, Hash, Search, X } from 'lucide-react'

const ACCENT_DOT_CLASSES: Record<string, string> = {
  sky: 'bg-sky-600',
  rose: 'bg-rose-600',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-600',
  violet: 'bg-violet-600',
  cyan: 'bg-cyan-600',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
}

export interface FilterControlsProps {
  feeds: RssFeed[]
  filters: SearchFilters
  onUpdateFilters?: (next: Partial<SearchFilters>) => void
  onToggleFeedActive?: (feedId: string, isActive: boolean) => void
  onRemoveFeed?: (feedId: string) => void
}

const inputClass =
  'w-full bg-paper dark:bg-night border-2 border-ink dark:border-night-text pl-7 pr-2 py-1.5 text-xs font-mono text-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-1 focus:ring-offset-paper dark:focus:ring-offset-night-paper'

const kickerClass =
  'font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 dark:text-night-text-3'

export function FilterControls({
  feeds,
  filters,
  onUpdateFilters,
  onToggleFeedActive,
  onRemoveFeed,
}: FilterControlsProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const activeCount = feeds.filter((f) => f.isActive).length

  function handleFeedToggle(feed: RssFeed) {
    const nextActive = !feed.isActive
    onToggleFeedActive?.(feed.id, nextActive)
    if (nextActive) {
      onUpdateFilters?.({ activeFeedIds: Array.from(new Set([...filters.activeFeedIds, feed.id])) })
    } else {
      onUpdateFilters?.({ activeFeedIds: filters.activeFeedIds.filter((id) => id !== feed.id) })
    }
  }

  function handleRemoveClick(feedId: string) {
    if (pendingRemoveId === feedId) {
      onRemoveFeed?.(feedId)
      setPendingRemoveId(null)
    } else {
      setPendingRemoveId(feedId)
      window.setTimeout(() => {
        setPendingRemoveId((curr) => (curr === feedId ? null : curr))
      }, 2200)
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-[1fr_1fr_72px] gap-2">
        <label className="block">
          <span className={kickerClass}>Du</span>
          <div className="mt-0.5 relative">
            <Calendar className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-4 dark:text-night-text-3" aria-hidden="true" strokeWidth={2.25} />
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(event) => onUpdateFilters?.({ dateFrom: event.target.value || null })}
              className={inputClass}
            />
          </div>
        </label>
        <label className="block">
          <span className={kickerClass}>Au</span>
          <div className="mt-0.5 relative">
            <Calendar className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-4 dark:text-night-text-3" aria-hidden="true" strokeWidth={2.25} />
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(event) => onUpdateFilters?.({ dateTo: event.target.value || null })}
              className={inputClass}
            />
          </div>
        </label>
        <label className="block">
          <span className={kickerClass}>Tirage</span>
          <div className="mt-0.5 relative">
            <Hash className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-4 dark:text-night-text-3" aria-hidden="true" strokeWidth={2.25} />
            <input
              type="number"
              min={1}
              max={100}
              value={filters.limit}
              onChange={(event) => onUpdateFilters?.({ limit: Math.max(1, Number(event.target.value) || 1) })}
              className={`${inputClass} text-center pl-6`}
            />
          </div>
        </label>
      </div>

      <label className="block">
        <span className={kickerClass}>Mot-clé</span>
        <div className="mt-0.5 relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-4 dark:text-night-text-3" aria-hidden="true" strokeWidth={2.25} />
          <input
            type="text"
            value={filters.keyword}
            onChange={(event) => onUpdateFilters?.({ keyword: event.target.value })}
            placeholder="filtrer les dépêches…"
            className={`${inputClass} pl-7 placeholder:text-ink-4 dark:placeholder:text-night-text-3 placeholder:italic placeholder:font-display placeholder:normal-case placeholder:text-[12px]`}
          />
        </div>
      </label>

      <div>
        <div className="flex items-baseline justify-between">
          <span className={kickerClass}>Sources actives</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-4 dark:text-night-text-3">
            {activeCount}/{feeds.length}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {feeds.length === 0 ? (
            <p className="font-display italic text-xs text-ink-3 dark:text-night-text-3">
              Aucune source configurée.
            </p>
          ) : (
            feeds.map((feed) => {
              const active = feed.isActive
              const pendingRemove = pendingRemoveId === feed.id
              return (
                <span
                  key={feed.id}
                  className={[
                    'inline-flex items-stretch text-[11px] font-mono uppercase tracking-[0.1em] border transition-colors',
                    active
                      ? 'bg-ink text-bone dark:bg-night-text dark:text-night border-ink dark:border-night-text'
                      : 'bg-paper dark:bg-night text-ink-3 dark:text-night-text-3 border-ink/60 dark:border-night-text/60',
                    pendingRemove ? 'ring-2 ring-vermillion' : '',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => handleFeedToggle(feed)}
                    className="cursor-pointer inline-flex items-center gap-1 px-1.5 py-0.5 hover:opacity-90"
                    aria-pressed={active}
                    aria-label={`${active ? 'Désactiver' : 'Activer'} la source ${feed.title}`}
                    title={active ? 'Désactiver' : 'Activer'}
                  >
                    <span
                      className={[
                        'h-1.5 w-1.5 transition-opacity',
                        ACCENT_DOT_CLASSES[feed.accentColor] ?? 'bg-ink',
                        active ? 'opacity-100' : 'opacity-40',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                    <span className={active ? '' : 'line-through decoration-1'}>{feed.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveClick(feed.id)}
                    className={[
                      'cursor-pointer inline-flex items-center justify-center px-1.5 border-l',
                      active ? 'border-bone/30 dark:border-night/30 hover:bg-vermillion hover:text-paper' : 'border-ink/30 dark:border-night-text/30 hover:bg-vermillion hover:text-paper',
                      pendingRemove ? 'bg-vermillion text-paper' : '',
                    ].join(' ')}
                    aria-label={
                      pendingRemove
                        ? `Confirmer la suppression de ${feed.title}`
                        : `Supprimer la source ${feed.title}`
                    }
                    title={pendingRemove ? 'Confirmer ?' : 'Supprimer'}
                  >
                    <X className="h-2.5 w-2.5" aria-hidden="true" strokeWidth={2.5} />
                  </button>
                </span>
              )
            })
          )}
        </div>
        {pendingRemoveId && (
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-vermillion">
            Re-clique la croix pour confirmer la suppression.
          </p>
        )}
      </div>
    </div>
  )
}
