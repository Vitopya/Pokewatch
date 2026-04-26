import { LayoutPanelLeft, ListChecks } from 'lucide-react'
import type { ActivePanel, WorkspaceProps } from '../types'
import { NewsletterPanel } from './NewsletterPanel'
import { RssPanel } from './RssPanel'

export function Workspace({
  feeds,
  filters,
  articles,
  newsletter,
  ui,
  onOpenSettings,
  onChangeActivePanel,
  onAddFeed: _onAddFeed,
  onRemoveFeed,
  onToggleFeedActive,
  onUpdateFilters,
  onFetchArticles,
  onToggleArticleSelection,
  onSelectAllArticles,
  onDeselectAllArticles,
  onGenerateNewsletter,
  onRegenerateNewsletter,
  onEditSectionTitle,
  onReorderSections,
  onDeleteSection,
  onDeleteItem,
  onReorderItems,
  onEditItemTitle,
  onEditItemDescription,
  onEditItemBullet,
  onAddItemBullet,
  onRemoveItemBullet,
  onReorderItemBullets: _onReorderItemBullets,
  onReplaceItemImage,
  onRemoveItemImage,
  onCopyMarkdown,
  onCopyHtml,
}: WorkspaceProps) {
  const showRss = ui.activePanel === 'rss'
  const showNewsletter = ui.activePanel === 'newsletter'

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <h1 className="sr-only">Gazette — atelier de newsletter</h1>
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(320px,36%)_1fr]">
        <div
          data-tour="rss-panel"
          className={`min-h-0 ${showRss ? 'flex' : 'hidden'} md:flex flex-col border-r-0 md:border-r-2 border-ink dark:border-night-text`}
        >
          <RssPanel
            feeds={feeds}
            filters={filters}
            articles={articles}
            isFetching={ui.isFetching}
            isGenerating={ui.isGenerating}
            onOpenSettings={onOpenSettings}
            onUpdateFilters={onUpdateFilters}
            onToggleFeedActive={onToggleFeedActive}
            onRemoveFeed={onRemoveFeed}
            onFetchArticles={onFetchArticles}
            onToggleArticleSelection={onToggleArticleSelection}
            onSelectAllArticles={onSelectAllArticles}
            onDeselectAllArticles={onDeselectAllArticles}
            onGenerateNewsletter={onGenerateNewsletter}
          />
        </div>
        <div
          data-tour="newsletter-panel"
          className={`min-h-0 ${showNewsletter ? 'flex' : 'hidden'} md:flex flex-col`}
        >
          <NewsletterPanel
            newsletter={newsletter}
            ui={ui}
            onCopyMarkdown={onCopyMarkdown}
            onCopyHtml={onCopyHtml}
            onRegenerate={onRegenerateNewsletter}
            onReorderSections={onReorderSections}
            onEditSectionTitle={onEditSectionTitle}
            onDeleteSection={onDeleteSection}
            onDeleteItem={onDeleteItem}
            onReorderItems={onReorderItems}
            onEditItemTitle={onEditItemTitle}
            onEditItemDescription={onEditItemDescription}
            onEditItemBullet={onEditItemBullet}
            onAddItemBullet={onAddItemBullet}
            onRemoveItemBullet={onRemoveItemBullet}
            onReplaceItemImage={onReplaceItemImage}
            onRemoveItemImage={onRemoveItemImage}
          />
        </div>
      </div>

      <MobilePanelToggle activePanel={ui.activePanel} onChange={onChangeActivePanel} />
    </div>
  )
}

interface MobilePanelToggleProps {
  activePanel: ActivePanel
  onChange?: (panel: ActivePanel) => void
}

function MobilePanelToggle({ activePanel, onChange }: MobilePanelToggleProps) {
  return (
    <div
      className="md:hidden sticky bottom-0 z-20 shrink-0 border-t-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper grid grid-cols-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <button
        type="button"
        onClick={() => onChange?.('rss')}
        className={[
          'cursor-pointer inline-flex items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] border-r-2 border-ink dark:border-night-text transition-colors',
          activePanel === 'rss'
            ? 'bg-ink text-bone dark:bg-night-text dark:text-night'
            : 'text-ink dark:text-night-text hover:bg-bone-2 dark:hover:bg-night-2',
        ].join(' ')}
        aria-pressed={activePanel === 'rss'}
      >
        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
        Sources
      </button>
      <button
        type="button"
        onClick={() => onChange?.('newsletter')}
        className={[
          'cursor-pointer inline-flex items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors',
          activePanel === 'newsletter'
            ? 'bg-vermillion text-paper'
            : 'text-ink dark:text-night-text hover:bg-bone-2 dark:hover:bg-night-2',
        ].join(' ')}
        aria-pressed={activePanel === 'newsletter'}
      >
        <LayoutPanelLeft className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
        Édition
      </button>
    </div>
  )
}
