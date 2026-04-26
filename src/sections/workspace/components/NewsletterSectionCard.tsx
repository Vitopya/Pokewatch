import { GripVertical, Trash2 } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import type { NewsletterSection } from '../types'
import { EventTagBadge } from './EventTagBadge'
import { NewsletterItemCard } from './NewsletterItemCard'

export interface NewsletterSectionCardProps {
  section: NewsletterSection
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
  isDragging?: boolean
  onEditSectionTitle?: (title: string) => void
  onDeleteSection?: () => void
  onEditItemTitle?: (itemId: string, title: string) => void
  onEditItemDescription?: (itemId: string, description: string) => void
  onEditItemBullet?: (itemId: string, bulletIndex: number, value: string) => void
  onAddItemBullet?: (itemId: string) => void
  onRemoveItemBullet?: (itemId: string, bulletIndex: number) => void
  onReplaceItemImage?: (itemId: string, imageUrl: string) => void
  onRemoveItemImage?: (itemId: string) => void
}

export function NewsletterSectionCard({
  section,
  dragHandleProps,
  isDragging = false,
  onEditSectionTitle,
  onDeleteSection,
  onEditItemTitle,
  onEditItemDescription,
  onEditItemBullet,
  onAddItemBullet,
  onRemoveItemBullet,
  onReplaceItemImage,
  onRemoveItemImage,
}: NewsletterSectionCardProps) {
  return (
    <section className={`group/section ${isDragging ? 'opacity-60' : ''}`}>
      <header className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <button
            type="button"
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-ink-4 hover:text-ink dark:text-night-text-3 dark:hover:text-night-text transition-colors opacity-0 group-hover/section:opacity-100 touch-none"
            aria-label="Réordonner section (drag)"
            title="Glisser pour réordonner"
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
          </button>
          <EventTagBadge tag={section.tag} />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3">
            {String(section.items.length).padStart(2, '0')}
          </span>
          <span className="flex-1 h-px bg-ink dark:bg-night-text" aria-hidden="true" />
          <button
            type="button"
            onClick={onDeleteSection}
            className="cursor-pointer inline-flex h-5 w-5 items-center justify-center text-ink-4 hover:bg-vermillion hover:text-paper dark:text-night-text-3 dark:hover:bg-vermillion dark:hover:text-paper transition-colors opacity-0 group-hover/section:opacity-100 focus:opacity-100"
            aria-label="Supprimer la section"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
          </button>
        </div>

        <input
          type="text"
          defaultValue={section.title}
          onBlur={(event) => {
            const next = event.currentTarget.value.trim()
            if (next && next !== section.title) onEditSectionTitle?.(next)
          }}
          className="w-full bg-transparent font-display text-[24px] md:text-[30px] leading-[1] font-black tracking-tighter text-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 focus:ring-offset-bone dark:focus:ring-offset-night px-1 -mx-1"
          aria-label="Titre de section"
        />
        <div aria-hidden="true" className="mt-2 h-0.5 bg-ink dark:bg-night-text" />
      </header>

      <div className="space-y-4">
        {section.items.map((item, index) => (
          <NewsletterItemCard
            key={item.id}
            item={item}
            index={index}
            isLead={index === 0}
            onEditTitle={(title) => onEditItemTitle?.(item.id, title)}
            onEditDescription={(description) => onEditItemDescription?.(item.id, description)}
            onEditBullet={(idx, value) => onEditItemBullet?.(item.id, idx, value)}
            onAddBullet={() => onAddItemBullet?.(item.id)}
            onRemoveBullet={(idx) => onRemoveItemBullet?.(item.id, idx)}
            onReplaceImage={(url) => onReplaceItemImage?.(item.id, url)}
            onRemoveImage={() => onRemoveItemImage?.(item.id)}
          />
        ))}
      </div>
    </section>
  )
}
