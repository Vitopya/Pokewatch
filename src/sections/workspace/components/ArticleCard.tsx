import { ExternalLink } from 'lucide-react'
import type { Article, RssFeed } from '../types'

const ACCENT_BAR: Record<string, string> = {
  sky: 'bg-sky-600',
  rose: 'bg-rose-600',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-600',
  violet: 'bg-violet-600',
  cyan: 'bg-cyan-600',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
}

function formatRelative(isoDate: string) {
  const now = new Date()
  const then = new Date(isoDate)
  const diffMs = now.getTime() - then.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 60) return `T-${Math.max(1, minutes)}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `T-${hours}h`
  const days = Math.round(hours / 24)
  if (days < 7) return `T-${days}j`
  return then
    .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    .replace('/', '·')
}

export interface ArticleCardProps {
  article: Article
  feed?: RssFeed
  onToggleSelection?: (isSelected: boolean) => void
}

export function ArticleCard({ article, feed, onToggleSelection }: ArticleCardProps) {
  const accentBar = feed ? ACCENT_BAR[feed.accentColor] ?? 'bg-ink' : 'bg-ink'
  const isSelected = article.isSelected

  return (
    <li className="[counter-increment:wire]">
      <label
        className={[
          'group relative flex gap-3 cursor-pointer transition-all border-2',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vermillion has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bone dark:has-[:focus-visible]:ring-offset-night',
          isSelected
            ? 'border-vermillion bg-paper dark:bg-night-paper shadow-[3px_3px_0_0_rgba(194,32,15,1)]'
            : 'border-ink dark:border-night-text bg-paper dark:bg-night-paper hover:shadow-[3px_3px_0_0_rgba(14,14,12,1)] dark:hover:shadow-[3px_3px_0_0_rgba(232,226,212,0.5)] hover:-translate-x-[1px] hover:-translate-y-[1px]',
        ].join(' ')}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => onToggleSelection?.(event.target.checked)}
          aria-label={`Sélectionner l'article : ${article.title}`}
          className="sr-only peer"
        />

        <span
          aria-hidden="true"
          className={`w-1.5 shrink-0 ${isSelected ? 'bg-vermillion' : accentBar}`}
        />

        <div className="flex flex-1 min-w-0 gap-3 p-2.5 pr-3">
          {article.imageUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-bone-2 dark:bg-night-2 border border-ink dark:border-night-rule">
              <img
                src={article.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3">
              <span className="font-bold text-ink dark:text-night-text before:content-['№'] after:content-[counter(wire,decimal-leading-zero)]" />
              <span className="truncate">{article.sourceName}</span>
              <span className="text-rule dark:text-night-rule" aria-hidden="true">·</span>
              <span className="text-vermillion shrink-0">{formatRelative(article.publishedAt)}</span>
            </div>
            <p
              className={[
                'mt-1 line-clamp-2 font-display text-[15px] leading-tight tracking-tight font-semibold',
                isSelected ? 'text-ink dark:text-night-text' : 'text-ink dark:text-night-text',
              ].join(' ')}
            >
              {article.title}
            </p>
          </div>

          <span
            aria-hidden="true"
            className={[
              'self-start mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[10px] font-bold border-2 transition-colors',
              isSelected
                ? 'bg-vermillion border-vermillion text-paper'
                : 'bg-paper dark:bg-night-paper border-ink dark:border-night-text text-paper dark:text-night-paper group-hover:bg-ink dark:group-hover:bg-night-text group-hover:text-paper dark:group-hover:text-night',
            ].join(' ')}
          >
            {isSelected ? '✓' : '+'}
          </span>
        </div>

        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="absolute right-1.5 bottom-1.5 inline-flex h-6 w-6 items-center justify-center text-ink-4 dark:text-night-text-3 hover:text-vermillion transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion"
          aria-label={`Ouvrir l'article ${article.title} dans un nouvel onglet`}
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
        </a>
      </label>
    </li>
  )
}
