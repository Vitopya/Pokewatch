import { useEffect, useReducer, useRef } from 'react'
import {
  buildEmptyNewsletter,
  buildInitialFilters,
  buildInitialSetup,
  DEFAULT_FEEDS,
  INITIAL_ARTICLES,
  INITIAL_UI,
} from './initial-state'
import { readStorage, writeStorage } from './storage'
import { workspaceReducer, type WorkspaceState } from './workspace-reducer'
import type {
  ActivePanel,
  Newsletter,
  RssFeed,
  SearchFilters,
  SetupState,
} from '../sections/workspace/types'

function buildInitialState(): WorkspaceState {
  return {
    feeds: readStorage<RssFeed[]>('feeds') ?? DEFAULT_FEEDS,
    filters: readStorage<SearchFilters>('filters') ?? buildInitialFilters(),
    articles: INITIAL_ARTICLES,
    newsletter: readStorage<Newsletter>('newsletter') ?? buildEmptyNewsletter(),
    setup: { ...buildInitialSetup(), ...(readStorage<SetupState>('setup') ?? {}) },
    ui: {
      ...INITIAL_UI,
      activePanel: readStorage<ActivePanel>('uiPanel') ?? INITIAL_UI.activePanel,
    },
  }
}

export function useWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, buildInitialState)
  const isMountedRef = useRef(false)

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    writeStorage('feeds', state.feeds)
  }, [state.feeds])

  useEffect(() => {
    writeStorage('filters', state.filters)
  }, [state.filters])

  useEffect(() => {
    if (state.newsletter.sections.length > 0) {
      writeStorage('newsletter', state.newsletter)
    }
  }, [state.newsletter])

  useEffect(() => {
    writeStorage('setup', state.setup)
  }, [state.setup])

  useEffect(() => {
    writeStorage('uiPanel', state.ui.activePanel)
  }, [state.ui.activePanel])

  return { state, dispatch }
}
