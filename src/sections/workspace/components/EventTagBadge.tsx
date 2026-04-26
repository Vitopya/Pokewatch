import type { EventTag } from '../types'

const TAG_LABELS: Record<EventTag, string> = {
  event: 'Événement',
  raid: 'Raid',
  update: 'Mise à jour',
  community: 'Community',
  research: 'Recherche',
  spotlight: 'Spotlight',
  misc: 'Divers',
}

const TAG_STYLES: Record<EventTag, string> = {
  event: 'bg-vermillion text-paper border-ink dark:border-night-text',
  raid: 'bg-ink text-bone border-ink dark:bg-night-text dark:text-night dark:border-night-text',
  update: 'bg-moss text-paper border-ink dark:border-night-text',
  community: 'bg-ochre text-ink border-ink dark:border-night-text',
  research: 'bg-paper text-ink border-ink dark:bg-night-paper dark:text-night-text dark:border-night-text',
  spotlight: 'bg-bone text-ink border-vermillion dark:bg-night-2 dark:text-night-text',
  misc: 'bg-bone-2 text-ink border-ink dark:bg-night-2 dark:text-night-text dark:border-night-text',
}

export interface EventTagBadgeProps {
  tag: EventTag
  className?: string
}

export function EventTagBadge({ tag, className = '' }: EventTagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-bold border-2 ${TAG_STYLES[tag]} ${className}`}
    >
      <span aria-hidden="true">[</span>
      {TAG_LABELS[tag]}
      <span aria-hidden="true">]</span>
    </span>
  )
}
