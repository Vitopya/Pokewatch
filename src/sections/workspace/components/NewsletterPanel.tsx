import { Check, Code2, Copy, FileDown, RefreshCw } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type {
  Newsletter,
  NewsletterFormat,
  NewsletterSection,
  WorkspaceUiState,
} from '../types'
import { NewsletterSectionCard } from './NewsletterSectionCard'
import { NewsletterSkeleton } from './NewsletterSkeleton'

export interface NewsletterPanelProps {
  newsletter: Newsletter
  ui: WorkspaceUiState
  onCopyMarkdown?: () => void
  onCopyHtml?: () => void
  onRegenerate?: () => void
  onReorderSections?: (orderedSectionIds: string[]) => void
  onEditSectionTitle?: (sectionId: string, title: string) => void
  onDeleteSection?: (sectionId: string) => void
  onEditItemTitle?: (itemId: string, title: string) => void
  onEditItemDescription?: (itemId: string, description: string) => void
  onEditItemBullet?: (itemId: string, bulletIndex: number, value: string) => void
  onAddItemBullet?: (itemId: string) => void
  onRemoveItemBullet?: (itemId: string, bulletIndex: number) => void
  onReplaceItemImage?: (itemId: string, imageUrl: string) => void
  onRemoveItemImage?: (itemId: string) => void
}

function formatGeneratedDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso)
    .toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .toUpperCase()
}

const STATUS_LABEL: Record<Newsletter['status'], string> = {
  draft: 'Brouillon',
  generating: "À l'impression",
  ready: 'Bouclée',
  error: 'Avarie',
}

function CopyButton({
  format,
  label,
  icon: Icon,
  isLastCopied,
  onClick,
}: {
  format: NewsletterFormat
  label: string
  icon: typeof Copy
  isLastCopied: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'cursor-pointer inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion',
        isLastCopied
          ? 'bg-moss text-paper border-ink dark:border-night-text'
          : 'bg-paper text-ink border-ink hover:bg-ink hover:text-paper dark:bg-night-paper dark:text-night-text dark:border-night-text dark:hover:bg-night-text dark:hover:text-night',
      ].join(' ')}
      aria-label={`Copier en ${label}`}
    >
      {isLastCopied ? <Check className="h-3 w-3" aria-hidden="true" strokeWidth={3} /> : <Icon className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />}
      <span className="hidden sm:inline">{format === 'markdown' ? 'MD' : 'HTML'}</span>
    </button>
  )
}

interface SortableSectionProps {
  section: NewsletterSection
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

function SortableSection({ section, ...props }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <NewsletterSectionCard
        section={section}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        {...props}
      />
    </div>
  )
}

export function NewsletterPanel({
  newsletter,
  ui,
  onCopyMarkdown,
  onCopyHtml,
  onRegenerate,
  onReorderSections,
  onEditSectionTitle,
  onDeleteSection,
  onEditItemTitle,
  onEditItemDescription,
  onEditItemBullet,
  onAddItemBullet,
  onRemoveItemBullet,
  onReplaceItemImage,
  onRemoveItemImage,
}: NewsletterPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = newsletter.sections.findIndex((s) => s.id === active.id)
    const newIndex = newsletter.sections.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const ordered = arrayMove(newsletter.sections, oldIndex, newIndex).map((s) => s.id)
    onReorderSections?.(ordered)
  }

  const isGenerating = ui.isGenerating || newsletter.status === 'generating'
  const totalItems = newsletter.sections.reduce((sum, section) => sum + section.items.length, 0)
  const hasContent = newsletter.sections.length > 0

  return (
    <section
      aria-label="Newsletter générée"
      className="paper-grain relative flex h-full min-h-0 flex-col bg-paper dark:bg-night-paper"
    >
      <header className="shrink-0 px-4 py-2.5 border-b-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion shrink-0">
            B · Édition
          </p>
          <span aria-hidden="true" className="text-rule dark:text-night-rule">/</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3 truncate">
            <span className={`inline-block h-1.5 w-1.5 shrink-0 ${newsletter.status === 'ready' ? 'bg-moss' : isGenerating ? 'bg-vermillion animate-pulse' : 'bg-ink-4 dark:bg-night-text-3'}`} aria-hidden="true" />
            {STATUS_LABEL[newsletter.status]}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton
            format="markdown"
            label="markdown"
            icon={FileDown}
            isLastCopied={ui.lastCopyFormat === 'markdown'}
            onClick={onCopyMarkdown}
          />
          <CopyButton
            format="html"
            label="HTML"
            icon={Code2}
            isLastCopied={ui.lastCopyFormat === 'html'}
            onClick={onCopyHtml}
          />
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-ink text-paper dark:bg-night-text dark:text-night font-mono text-[10px] uppercase tracking-[0.16em] border-2 border-ink dark:border-night-text hover:bg-vermillion hover:border-vermillion dark:hover:bg-vermillion dark:hover:text-paper dark:hover:border-vermillion transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Régénérer la newsletter"
            title="Régénérer"
          >
            <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} aria-hidden="true" strokeWidth={2.25} />
            <span className="hidden sm:inline">Recomposer</span>
          </button>
        </div>
      </header>

      <div className="relative flex-1 min-h-0 overflow-y-auto bg-bone dark:bg-night">
        {isGenerating ? (
          <div className="px-4 py-5 md:px-8 md:py-7 max-w-3xl">
            <NewsletterSkeleton />
          </div>
        ) : hasContent ? (
          <>
            <div className="px-4 pt-5 pb-3 md:px-8 md:pt-7 md:pb-4 border-b-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper">
              <div className="max-w-3xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion mb-1.5">
                  Édition · {formatGeneratedDate(newsletter.generatedAt)}
                </p>
                <h1 className="font-display font-black tracking-[-0.04em] leading-[0.92] text-ink dark:text-night-text text-[28px] sm:text-[36px] md:text-[44px]">
                  {newsletter.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3">
                  <span>{String(totalItems).padStart(2, '0')} sujet{totalItems > 1 ? 's' : ''}</span>
                  <span aria-hidden="true" className="text-rule dark:text-night-rule">·</span>
                  <span>{String(newsletter.sections.length).padStart(2, '0')} rubrique{newsletter.sections.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={newsletter.sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-10">
                    {newsletter.sections.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        onEditSectionTitle={(title) => onEditSectionTitle?.(section.id, title)}
                        onDeleteSection={() => onDeleteSection?.(section.id)}
                        onEditItemTitle={onEditItemTitle}
                        onEditItemDescription={onEditItemDescription}
                        onEditItemBullet={onEditItemBullet}
                        onAddItemBullet={onAddItemBullet}
                        onRemoveItemBullet={onRemoveItemBullet}
                        onReplaceItemImage={onReplaceItemImage}
                        onRemoveItemImage={onRemoveItemImage}
                      />
                    ))}
                    <div aria-hidden="true" className="pt-4 border-t-2 border-ink dark:border-night-text text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 dark:text-night-text-3">
                      — Fin de l'édition —
                    </div>
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-5 py-8">
            <div className="text-center max-w-sm">
              <div
                aria-hidden="true"
                className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center bg-paper dark:bg-night-paper border-2 border-ink dark:border-night-text text-vermillion shadow-[3px_3px_0_0_rgba(14,14,12,1)] dark:shadow-[3px_3px_0_0_rgba(232,226,212,0.5)]"
              >
                <FileDown className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion mb-1.5">
                Page blanche
              </p>
              <h3 className="font-display text-2xl font-black tracking-tighter text-ink dark:text-night-text leading-tight">
                L'édition n'est pas encore composée.
              </h3>
              <p className="mt-2 font-display italic text-sm text-ink-3 dark:text-night-text-3">
                Sélectionne tes dépêches dans le panneau Sources, puis lance la composition.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
