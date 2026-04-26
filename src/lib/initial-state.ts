import type {
  Article,
  Newsletter,
  RssFeed,
  SearchFilters,
  SetupState,
  WorkspaceUiState,
} from '../sections/workspace/types'

/**
 * White-label by default: no preset feeds. The user adds their own at first launch
 * via the setup wizard, or later via the Settings drawer.
 */
export const DEFAULT_FEEDS: RssFeed[] = []

export function buildInitialFilters(): SearchFilters {
  const now = new Date()
  const past = new Date(now)
  past.setDate(now.getDate() - 7)
  return {
    dateFrom: past.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
    activeFeedIds: [],
    keyword: '',
    limit: 25,
  }
}

export const INITIAL_ARTICLES: Article[] = []

export function buildEmptyNewsletter(): Newsletter {
  return {
    id: 'newsletter-draft',
    title: 'Nouvelle édition',
    generatedAt: null,
    status: 'draft',
    format: 'markdown',
    sections: [],
  }
}

export function buildInitialSetup(): SetupState {
  return {
    splashSeen: false,
    tourSeen: false,
    wizardSeen: false,
    provider: 'gemini',
  }
}

export const INITIAL_UI: WorkspaceUiState = {
  activePanel: 'rss',
  isFetching: false,
  isGenerating: false,
  isSettingsOpen: false,
  lastCopyFormat: null,
}
