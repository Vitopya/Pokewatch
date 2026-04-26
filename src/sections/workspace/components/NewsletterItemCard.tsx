import { useState } from 'react'
import { ImageOff, ImagePlus, Plus, X } from 'lucide-react'
import type { NewsletterItem } from '../types'
import { RichTextEditor } from '../../../components/RichTextEditor'

export interface NewsletterItemCardProps {
  item: NewsletterItem
  index?: number
  isLead?: boolean
  onEditTitle?: (title: string) => void
  onEditDescription?: (description: string) => void
  onEditBullet?: (bulletIndex: number, value: string) => void
  onAddBullet?: () => void
  onRemoveBullet?: (bulletIndex: number) => void
  onReplaceImage?: (imageUrl: string) => void
  onRemoveImage?: () => void
}

export function NewsletterItemCard({
  item,
  index = 0,
  isLead = false,
  onEditTitle,
  onEditDescription,
  onEditBullet,
  onAddBullet,
  onRemoveBullet,
  onReplaceImage,
  onRemoveImage,
}: NewsletterItemCardProps) {
  const [showImageMenu, setShowImageMenu] = useState(false)

  function handleReplaceImage() {
    setShowImageMenu(false)
    const next = window.prompt("URL de l'image", item.imageUrl ?? '')
    if (next && next !== item.imageUrl) {
      onReplaceImage?.(next)
    }
  }

  return (
    <article
      className={[
        'group relative bg-paper dark:bg-night-paper border-2 border-ink dark:border-night-text transition-all',
        'hover:shadow-[4px_4px_0_0_rgba(14,14,12,1)] dark:hover:shadow-[4px_4px_0_0_rgba(232,226,212,0.4)] hover:-translate-x-[1px] hover:-translate-y-[1px]',
      ].join(' ')}
    >
      <div className={`flex flex-col ${isLead ? 'md:flex-col' : 'md:flex-row'} gap-0`}>
        <div
          className={[
            'relative shrink-0 overflow-hidden bg-bone-2 dark:bg-night-2 border-ink dark:border-night-text',
            isLead
              ? 'h-40 md:h-52 w-full border-b-2'
              : 'h-32 md:h-auto md:w-36 border-b-2 md:border-b-0 md:border-r-2',
          ].join(' ')}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-4 dark:text-night-text-3">
              <ImageOff className="h-6 w-6" aria-hidden="true" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute top-1.5 left-1.5 inline-flex items-center px-1.5 py-0.5 bg-paper dark:bg-night-paper border border-ink dark:border-night-text font-mono text-[9px] uppercase tracking-[0.16em] text-ink dark:text-night-text">
            {isLead ? 'À la une' : `№${String(index + 1).padStart(2, '0')}`}
          </div>
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setShowImageMenu((prev) => !prev)}
              className="cursor-pointer inline-flex h-6 w-6 items-center justify-center bg-ink text-paper border border-ink hover:bg-vermillion hover:border-vermillion focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion"
              aria-label="Options de l'image"
            >
              <ImagePlus className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
            </button>
          </div>
          {showImageMenu && (
            <div className="absolute bottom-9 right-1.5 z-10 border-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper shadow-[3px_3px_0_0_rgba(14,14,12,1)] overflow-hidden">
              <button
                type="button"
                onClick={handleReplaceImage}
                className="cursor-pointer block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:bg-ink hover:text-paper dark:text-night-text dark:hover:bg-night-text dark:hover:text-night transition-colors"
              >
                Remplacer
              </button>
              {item.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setShowImageMenu(false)
                    onRemoveImage?.()
                  }}
                  className="cursor-pointer block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-vermillion hover:bg-vermillion hover:text-paper border-t border-ink dark:border-night-text transition-colors"
                >
                  Retirer
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3">
            <span className="font-bold text-vermillion">№{String(index + 1).padStart(2, '0')}</span>
            <span className="h-px flex-1 bg-rule dark:bg-night-rule" aria-hidden="true" />
            <span className="truncate">Source · {item.sourceName}</span>
          </div>

          <input
            type="text"
            defaultValue={item.title}
            onBlur={(event) => {
              const next = event.currentTarget.value.trim()
              if (next && next !== item.title) onEditTitle?.(next)
            }}
            className={[
              'w-full bg-transparent font-display font-bold tracking-tight leading-tight text-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 focus:ring-offset-paper dark:focus:ring-offset-night-paper px-1 -mx-1',
              isLead ? 'text-xl md:text-2xl' : 'text-lg md:text-xl',
            ].join(' ')}
            aria-label="Titre de l'item"
          />

          <div className="mt-2 -mx-1 rounded-sm px-1 focus-within:ring-2 focus-within:ring-vermillion focus-within:ring-offset-2 focus-within:ring-offset-paper dark:focus-within:ring-offset-night-paper">
            <RichTextEditor
              defaultText={item.description}
              onSave={(next) => onEditDescription?.(next)}
              placeholder="Décris le sujet…"
              ariaLabel="Description de l'item"
              className={[
                'text-[14px] leading-[1.5] text-ink-2 dark:text-night-text-2 min-h-[1.25rem]',
                isLead ? 'drop-cap font-display' : '',
              ].join(' ')}
            />
          </div>

          <ul className="mt-3 space-y-1 border-l-2 border-ink dark:border-night-text pl-3">
            {item.bullets.map((bullet, bulletIndex) => (
              <li key={bulletIndex} className="group/bullet flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 bg-vermillion"
                />
                <div className="flex-1 -mx-1 rounded-sm px-1 focus-within:ring-2 focus-within:ring-vermillion focus-within:ring-offset-2 focus-within:ring-offset-paper dark:focus-within:ring-offset-night-paper">
                  <RichTextEditor
                    defaultText={bullet}
                    onSave={(next) => onEditBullet?.(bulletIndex, next)}
                    placeholder="Détail clé…"
                    ariaLabel={`Bullet ${bulletIndex + 1}`}
                    className="text-sm text-ink-2 dark:text-night-text-2"
                    singleLine
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveBullet?.(bulletIndex)}
                  className="cursor-pointer inline-flex h-4 w-4 items-center justify-center text-ink-4 hover:bg-vermillion hover:text-paper dark:text-night-text-3 transition-colors opacity-0 group-hover/bullet:opacity-100"
                  aria-label={`Supprimer bullet ${bulletIndex + 1}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={onAddBullet}
                className="cursor-pointer inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 hover:text-vermillion dark:text-night-text-3 dark:hover:text-vermillion transition-colors"
              >
                <Plus className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                Ajouter
              </button>
            </li>
          </ul>

          <div className="mt-3 pt-2 border-t border-rule dark:border-night-rule flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-4 dark:text-night-text-3">
            <span>↪ Lire</span>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-ink dark:text-night-text underline-offset-4 underline decoration-vermillion decoration-2 hover:text-vermillion truncate"
            >
              {item.sourceName}
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
