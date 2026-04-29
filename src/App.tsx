import { useCallback, useEffect, useRef, useState } from 'react'
import { AppShell } from './shell/components/AppShell'
import { Workspace } from './sections/workspace/components/Workspace'
import { Splashscreen } from './sections/workspace/components/Splashscreen'
import { AppTour } from './sections/workspace/components/AppTour'
import { SetupWizardModal } from './sections/workspace/components/SetupWizardModal'
import { SettingsDrawer, type HealthStatus } from './components/SettingsDrawer'
import { useAnnouncer } from './components/LiveAnnouncer'
import { useWorkspace } from './lib/useWorkspace'
import { fetchAllArticles } from './lib/rss-fetch'
import { generateNewsletter, GenerateError } from './lib/generate'
import { clearAllStorage } from './lib/storage'
import { copyHtmlToClipboard, copyMarkdownToClipboard } from './lib/serialize'
import {
  buildEmptyNewsletter,
  buildInitialFilters,
  buildInitialSetup,
  DEFAULT_FEEDS,
  INITIAL_UI,
} from './lib/initial-state'
import type { AiProvider, FeedAccentColor } from './sections/workspace/types'

const THEME_KEY = 'gazette:theme'

function readStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function newFeedId(): string {
  return `feed-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`
}

export default function App() {
  const { state, dispatch } = useWorkspace()
  const { announce } = useAnnouncer()
  const [theme, setTheme] = useState<'light' | 'dark'>(readStoredTheme)
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('unknown')
  const [healthModel, setHealthModel] = useState<string | undefined>()
  const [showSplash, setShowSplash] = useState<boolean>(!state.setup.splashSeen)
  const [showTour, setShowTour] = useState<boolean>(false)
  const [showWizard, setShowWizard] = useState<boolean>(false)
  const generationAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Dynamic page title based on app state
  useEffect(() => {
    const status = state.newsletter.status
    const sectionsCount = state.newsletter.sections.length
    let title = 'Gazette'
    if (state.ui.isGenerating) title = 'Composition… · Gazette'
    else if (status === 'ready' && sectionsCount > 0) title = `Newsletter prête (${sectionsCount} rubriques) · Gazette`
    else if (status === 'error') title = 'Erreur · Gazette'
    else if (state.articles.length > 0) title = `${state.articles.length} dépêches · Gazette`
    document.title = title
  }, [state.newsletter.status, state.newsletter.sections.length, state.ui.isGenerating, state.articles.length])

  const checkHealth = useCallback(async () => {
    setHealthStatus('checking')
    try {
      const response = await fetch(`/api/health?provider=${encodeURIComponent(state.setup.provider)}`)
      const data = (await response.json()) as { status: string; model?: string }
      setHealthModel(data.model)
      if (response.ok && data.status === 'ok') {
        setHealthStatus('ok')
      } else {
        setHealthStatus(data.status === 'missing-key' ? 'missing-key' : 'error')
      }
    } catch {
      setHealthStatus('error')
    }
  }, [state.setup.provider])

  useEffect(() => {
    void checkHealth()
  }, [checkHealth])

  const handleFetchArticles = useCallback(async () => {
    dispatch({ type: 'ui/set-fetching', value: true })
    announce('Récupération des articles en cours.')
    try {
      const result = await fetchAllArticles(state.feeds, state.filters)
      dispatch({ type: 'articles/set', articles: result.articles })
      announce(
        `${result.articles.length} article${result.articles.length > 1 ? 's' : ''} reçu${
          result.articles.length > 1 ? 's' : ''
        }.`,
      )
      if (result.errors.length > 0) {
        console.warn('RSS fetch errors:', result.errors)
      }
    } catch (error) {
      console.error('RSS fetch failed:', error)
      announce(`Erreur lors de la récupération des flux : ${(error as Error).message}`, {
        politeness: 'assertive',
      })
      window.alert(`Erreur lors de la récupération des flux : ${(error as Error).message}`)
    } finally {
      dispatch({ type: 'ui/set-fetching', value: false })
    }
  }, [announce, dispatch, state.feeds, state.filters])

  const handleGenerateNewsletter = useCallback(async () => {
    const selected = state.articles.filter((a) => a.isSelected)
    if (selected.length === 0) return

    generationAbortRef.current?.abort()
    const controller = new AbortController()
    generationAbortRef.current = controller

    dispatch({ type: 'ui/set-generating', value: true })
    announce('Composition de la newsletter en cours.')
    try {
      const { newsletter } = await generateNewsletter({
        selectedArticles: selected,
        provider: state.setup.provider,
        signal: controller.signal,
      })
      dispatch({ type: 'newsletter/set', newsletter })
      announce('Newsletter prête. Tu peux maintenant éditer chaque rubrique et la copier.')
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      console.error('Newsletter generation failed:', error)
      dispatch({ type: 'newsletter/status', status: 'error' })
      const message = (error as Error).message
      if (error instanceof GenerateError) {
        announce(message, { politeness: 'assertive' })
        window.alert(message)
      } else {
        announce(`Erreur lors de la génération : ${message}`, { politeness: 'assertive' })
        window.alert(`Erreur lors de la génération : ${message}`)
      }
    } finally {
      dispatch({ type: 'ui/set-generating', value: false })
    }
  }, [announce, dispatch, state.articles, state.setup.provider])

  const handleResetData = useCallback(() => {
    clearAllStorage()
    dispatch({
      type: 'state/reset',
      next: {
        feeds: DEFAULT_FEEDS,
        filters: buildInitialFilters(),
        articles: [],
        newsletter: buildEmptyNewsletter(),
        setup: buildInitialSetup(),
        ui: { ...INITIAL_UI, isSettingsOpen: false },
      },
    })
    setShowSplash(true)
  }, [dispatch])

  const handleAddFeed = useCallback(
    (input: { title: string; url: string; accentColor: FeedAccentColor }) => {
      dispatch({
        type: 'feed/add',
        feed: {
          id: newFeedId(),
          title: input.title,
          url: input.url,
          isActive: true,
          accentColor: input.accentColor,
          lastSyncedAt: null,
        },
      })
    },
    [dispatch],
  )

  const setSettingsOpen = useCallback(
    (open: boolean) => dispatch({ type: 'ui/set-settings-open', value: open }),
    [dispatch],
  )

  const copyResetTimeoutRef = useRef<number | null>(null)

  const triggerCopyFeedback = useCallback(
    (format: 'markdown' | 'html') => {
      dispatch({ type: 'ui/set-last-copy-format', format })
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        dispatch({ type: 'ui/set-last-copy-format', format: null })
        copyResetTimeoutRef.current = null
      }, 2500)
    },
    [dispatch],
  )

  const handleCopyMarkdown = useCallback(async () => {
    if (state.newsletter.sections.length === 0) return
    try {
      await copyMarkdownToClipboard(state.newsletter)
      triggerCopyFeedback('markdown')
      announce('Newsletter copiée au format Markdown.')
    } catch (error) {
      console.error('Copy markdown failed:', error)
      announce(`Erreur lors de la copie : ${(error as Error).message}`, { politeness: 'assertive' })
      window.alert(`Erreur lors de la copie : ${(error as Error).message}`)
    }
  }, [announce, state.newsletter, triggerCopyFeedback])

  const handleCopyHtml = useCallback(async () => {
    if (state.newsletter.sections.length === 0) return
    try {
      await copyHtmlToClipboard(state.newsletter)
      triggerCopyFeedback('html')
      announce('Newsletter copiée au format HTML.')
    } catch (error) {
      console.error('Copy HTML failed:', error)
      announce(`Erreur lors de la copie : ${(error as Error).message}`, { politeness: 'assertive' })
      window.alert(`Erreur lors de la copie : ${(error as Error).message}`)
    }
  }, [announce, state.newsletter, triggerCopyFeedback])

  // First-launch chain: splash → tour (if not seen) → wizard (if not seen)
  function handleSplashDone() {
    setShowSplash(false)
    dispatch({ type: 'setup/patch', patch: { splashSeen: true } })
    if (!state.setup.tourSeen) {
      setShowTour(true)
    } else if (!state.setup.wizardSeen) {
      setShowWizard(true)
    }
  }

  function handleTourClose() {
    setShowTour(false)
    dispatch({ type: 'setup/patch', patch: { tourSeen: true } })
  }

  function handleTourComplete() {
    setShowTour(false)
    dispatch({ type: 'setup/patch', patch: { tourSeen: true } })
    if (!state.setup.wizardSeen) {
      setShowWizard(true)
    }
  }

  function handleWizardClose() {
    setShowWizard(false)
    dispatch({ type: 'setup/patch', patch: { wizardSeen: true } })
  }

  function handleWizardComplete() {
    setShowWizard(false)
    dispatch({ type: 'setup/patch', patch: { wizardSeen: true } })
    // kick off first search if at least one feed exists
    setTimeout(() => {
      void handleFetchArticles()
    }, 50)
  }

  function handleProviderChange(provider: AiProvider) {
    dispatch({ type: 'setup/set-provider', provider })
  }

  function handleReplayTour() {
    setSettingsOpen(false)
    // Defer so the drawer fully unmounts before the tour mounts
    // (avoids dialog focus-scope and scroll-lock conflicts)
    window.setTimeout(() => setShowTour(true), 50)
  }

  function handleReopenWizard() {
    setSettingsOpen(false)
    window.setTimeout(() => setShowWizard(true), 50)
  }

  return (
    <>
      {showSplash && <Splashscreen onDone={handleSplashDone} />}

      <AppShell
        user={{ name: 'Utilisateur' }}
        theme={theme}
        onLogoClick={() => dispatch({ type: 'ui/set-active-panel', panel: 'rss' })}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onLogout={handleResetData}
      >
        <Workspace
          feeds={state.feeds}
          filters={state.filters}
          articles={state.articles}
          newsletter={state.newsletter}
          ui={state.ui}
          onOpenSettings={() => setSettingsOpen(true)}
          onChangeActivePanel={(panel) =>
            dispatch({ type: 'ui/set-active-panel', panel })
          }
          onAddFeed={(input) =>
            handleAddFeed({ title: input.title ?? 'Nouvelle source', url: input.url, accentColor: 'sky' })
          }
          onRemoveFeed={(feedId) => dispatch({ type: 'feed/remove', feedId })}
          onToggleFeedActive={(feedId, isActive) =>
            dispatch({ type: 'feed/toggle-active', feedId, isActive })
          }
          onUpdateFilters={(patch) => dispatch({ type: 'filters/update', patch })}
          onFetchArticles={handleFetchArticles}
          onToggleArticleSelection={(articleId, isSelected) =>
            dispatch({ type: 'articles/toggle-selection', articleId, isSelected })
          }
          onSelectAllArticles={() => dispatch({ type: 'articles/select-all' })}
          onDeselectAllArticles={() => dispatch({ type: 'articles/deselect-all' })}
          onGenerateNewsletter={handleGenerateNewsletter}
          onRegenerateNewsletter={handleGenerateNewsletter}
          onEditSectionTitle={(sectionId, title) =>
            dispatch({ type: 'section/edit-title', sectionId, title })
          }
          onReorderSections={(orderedIds) =>
            dispatch({ type: 'section/reorder', orderedIds })
          }
          onDeleteSection={(sectionId) => dispatch({ type: 'section/delete', sectionId })}
          onDeleteItem={(itemId) => dispatch({ type: 'item/delete', itemId })}
          onReorderItems={(sectionId, orderedItemIds) =>
            dispatch({ type: 'item/reorder', sectionId, orderedItemIds })
          }
          onEditItemTitle={(itemId, title) =>
            dispatch({ type: 'item/edit-title', itemId, title })
          }
          onEditItemDescription={(itemId, description) =>
            dispatch({ type: 'item/edit-description', itemId, description })
          }
          onEditItemBullet={(itemId, bulletIndex, value) =>
            dispatch({ type: 'item/edit-bullet', itemId, bulletIndex, value })
          }
          onAddItemBullet={(itemId) => dispatch({ type: 'item/add-bullet', itemId })}
          onRemoveItemBullet={(itemId, bulletIndex) =>
            dispatch({ type: 'item/remove-bullet', itemId, bulletIndex })
          }
          onReorderItemBullets={(itemId, orderedBullets) =>
            dispatch({ type: 'item/reorder-bullets', itemId, orderedBullets })
          }
          onReplaceItemImage={(itemId, imageUrl) =>
            dispatch({ type: 'item/replace-image', itemId, imageUrl })
          }
          onRemoveItemImage={(itemId) => dispatch({ type: 'item/remove-image', itemId })}
          onCopyMarkdown={handleCopyMarkdown}
          onCopyHtml={handleCopyHtml}
        />
      </AppShell>

      {showTour && !showSplash && (
        <AppTour onClose={handleTourClose} onComplete={handleTourComplete} />
      )}

      {showWizard && !showSplash && (
        <SetupWizardModal
          open={showWizard}
          initialProvider={state.setup.provider}
          existingFeeds={state.feeds}
          onProviderChange={handleProviderChange}
          onCommitFeeds={(drafts) => {
            for (const d of drafts) {
              handleAddFeed(d)
            }
          }}
          onClose={handleWizardClose}
          onComplete={handleWizardComplete}
        />
      )}

      <SettingsDrawer
        open={state.ui.isSettingsOpen}
        onOpenChange={setSettingsOpen}
        feeds={state.feeds}
        provider={state.setup.provider}
        healthStatus={healthStatus}
        healthModel={healthModel}
        onCheckHealth={checkHealth}
        onProviderChange={handleProviderChange}
        onAddFeed={handleAddFeed}
        onRemoveFeed={(feedId) => dispatch({ type: 'feed/remove', feedId })}
        onUpdateFeed={(feedId, patch) => dispatch({ type: 'feed/update', feedId, patch })}
        onResetData={handleResetData}
        onReplayTour={handleReplayTour}
        onReopenWizard={handleReopenWizard}
      />
    </>
  )
}
