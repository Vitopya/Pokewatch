import type {
  ActivePanel,
  AiProvider,
  Article,
  DetailLevel,
  Newsletter,
  NewsletterFormat,
  NewsletterStatus,
  RssFeed,
  SearchFilters,
  SetupState,
  WorkspaceUiState,
} from '../sections/workspace/types'

export interface WorkspaceState {
  feeds: RssFeed[]
  filters: SearchFilters
  articles: Article[]
  newsletter: Newsletter
  setup: SetupState
  ui: WorkspaceUiState
}

export type WorkspaceAction =
  | { type: 'feed/add'; feed: RssFeed }
  | { type: 'feed/remove'; feedId: string }
  | { type: 'feed/toggle-active'; feedId: string; isActive: boolean }
  | { type: 'feed/update'; feedId: string; patch: Partial<RssFeed> }
  | { type: 'filters/update'; patch: Partial<SearchFilters> }
  | { type: 'articles/set'; articles: Article[] }
  | { type: 'articles/toggle-selection'; articleId: string; isSelected: boolean }
  | { type: 'articles/select-all' }
  | { type: 'articles/deselect-all' }
  | { type: 'newsletter/set'; newsletter: Newsletter }
  | { type: 'newsletter/status'; status: NewsletterStatus }
  | { type: 'section/edit-title'; sectionId: string; title: string }
  | { type: 'section/reorder'; orderedIds: string[] }
  | { type: 'section/delete'; sectionId: string }
  | { type: 'item/edit-title'; itemId: string; title: string }
  | { type: 'item/edit-description'; itemId: string; description: string }
  | { type: 'item/edit-bullet'; itemId: string; bulletIndex: number; value: string }
  | { type: 'item/add-bullet'; itemId: string }
  | { type: 'item/remove-bullet'; itemId: string; bulletIndex: number }
  | { type: 'item/reorder-bullets'; itemId: string; orderedBullets: string[] }
  | { type: 'item/replace-image'; itemId: string; imageUrl: string }
  | { type: 'item/remove-image'; itemId: string }
  | { type: 'item/delete'; itemId: string }
  | { type: 'item/reorder'; sectionId: string; orderedItemIds: string[] }
  | { type: 'ui/set-fetching'; value: boolean }
  | { type: 'ui/set-generating'; value: boolean }
  | { type: 'ui/set-settings-open'; value: boolean }
  | { type: 'ui/set-active-panel'; panel: ActivePanel }
  | { type: 'ui/set-last-copy-format'; format: NewsletterFormat | null }
  | { type: 'setup/patch'; patch: Partial<SetupState> }
  | { type: 'setup/set-provider'; provider: AiProvider }
  | { type: 'setup/set-detail-level'; detailLevel: DetailLevel }
  | { type: 'state/reset'; next: WorkspaceState }

function mapItems(
  newsletter: Newsletter,
  itemId: string,
  updater: (item: Newsletter['sections'][number]['items'][number]) => Newsletter['sections'][number]['items'][number],
): Newsletter {
  return {
    ...newsletter,
    sections: newsletter.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => (item.id === itemId ? updater(item) : item)),
    })),
  }
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'feed/add':
      if (state.feeds.some((f) => f.id === action.feed.id || f.url === action.feed.url)) {
        return state
      }
      return {
        ...state,
        feeds: [...state.feeds, action.feed],
        filters: action.feed.isActive
          ? {
              ...state.filters,
              activeFeedIds: [...state.filters.activeFeedIds, action.feed.id],
            }
          : state.filters,
      }

    case 'feed/remove':
      return {
        ...state,
        feeds: state.feeds.filter((f) => f.id !== action.feedId),
        filters: {
          ...state.filters,
          activeFeedIds: state.filters.activeFeedIds.filter((id) => id !== action.feedId),
        },
        articles: state.articles.filter((a) => a.feedId !== action.feedId),
      }

    case 'feed/toggle-active': {
      const feeds = state.feeds.map((f) =>
        f.id === action.feedId ? { ...f, isActive: action.isActive } : f,
      )
      const activeFeedIds = action.isActive
        ? Array.from(new Set([...state.filters.activeFeedIds, action.feedId]))
        : state.filters.activeFeedIds.filter((id) => id !== action.feedId)
      return { ...state, feeds, filters: { ...state.filters, activeFeedIds } }
    }

    case 'feed/update':
      return {
        ...state,
        feeds: state.feeds.map((f) =>
          f.id === action.feedId ? { ...f, ...action.patch } : f,
        ),
      }

    case 'filters/update':
      return { ...state, filters: { ...state.filters, ...action.patch } }

    case 'articles/set':
      return { ...state, articles: action.articles }

    case 'articles/toggle-selection':
      return {
        ...state,
        articles: state.articles.map((a) =>
          a.id === action.articleId ? { ...a, isSelected: action.isSelected } : a,
        ),
      }

    case 'articles/select-all':
      return {
        ...state,
        articles: state.articles.map((a) => ({ ...a, isSelected: true })),
      }

    case 'articles/deselect-all':
      return {
        ...state,
        articles: state.articles.map((a) => ({ ...a, isSelected: false })),
      }

    case 'newsletter/set':
      return { ...state, newsletter: action.newsletter }

    case 'newsletter/status':
      return {
        ...state,
        newsletter: { ...state.newsletter, status: action.status },
      }

    case 'section/edit-title':
      return {
        ...state,
        newsletter: {
          ...state.newsletter,
          sections: state.newsletter.sections.map((section) =>
            section.id === action.sectionId ? { ...section, title: action.title } : section,
          ),
        },
      }

    case 'section/reorder': {
      const byId = new Map(state.newsletter.sections.map((s) => [s.id, s]))
      const reordered = action.orderedIds
        .map((id) => byId.get(id))
        .filter((s): s is Newsletter['sections'][number] => Boolean(s))
      const remaining = state.newsletter.sections.filter(
        (s) => !action.orderedIds.includes(s.id),
      )
      return {
        ...state,
        newsletter: {
          ...state.newsletter,
          sections: [...reordered, ...remaining],
        },
      }
    }

    case 'section/delete':
      return {
        ...state,
        newsletter: {
          ...state.newsletter,
          sections: state.newsletter.sections.filter((s) => s.id !== action.sectionId),
        },
      }

    case 'item/edit-title':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          title: action.title,
        })),
      }

    case 'item/edit-description':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          description: action.description,
        })),
      }

    case 'item/edit-bullet':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          bullets: item.bullets.map((b, i) => (i === action.bulletIndex ? action.value : b)),
        })),
      }

    case 'item/add-bullet':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          bullets: [...item.bullets, ''],
        })),
      }

    case 'item/remove-bullet':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          bullets: item.bullets.filter((_, i) => i !== action.bulletIndex),
        })),
      }

    case 'item/reorder-bullets':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          bullets: action.orderedBullets,
        })),
      }

    case 'item/replace-image':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          imageUrl: action.imageUrl,
        })),
      }

    case 'item/remove-image':
      return {
        ...state,
        newsletter: mapItems(state.newsletter, action.itemId, (item) => ({
          ...item,
          imageUrl: null,
        })),
      }

    case 'item/delete':
      return {
        ...state,
        newsletter: {
          ...state.newsletter,
          sections: state.newsletter.sections
            .map((s) => ({ ...s, items: s.items.filter((i) => i.id !== action.itemId) }))
            .filter((s) => s.items.length > 0),
        },
      }

    case 'item/reorder': {
      return {
        ...state,
        newsletter: {
          ...state.newsletter,
          sections: state.newsletter.sections.map((section) => {
            if (section.id !== action.sectionId) return section
            const byId = new Map(section.items.map((i) => [i.id, i]))
            const reordered = action.orderedItemIds
              .map((id) => byId.get(id))
              .filter((i): i is typeof section.items[number] => Boolean(i))
            const remaining = section.items.filter((i) => !action.orderedItemIds.includes(i.id))
            return { ...section, items: [...reordered, ...remaining] }
          }),
        },
      }
    }

    case 'ui/set-fetching':
      return { ...state, ui: { ...state.ui, isFetching: action.value } }

    case 'ui/set-generating':
      return {
        ...state,
        ui: { ...state.ui, isGenerating: action.value },
        newsletter: action.value
          ? { ...state.newsletter, status: 'generating' }
          : state.newsletter,
      }

    case 'ui/set-settings-open':
      return { ...state, ui: { ...state.ui, isSettingsOpen: action.value } }

    case 'ui/set-active-panel':
      return { ...state, ui: { ...state.ui, activePanel: action.panel } }

    case 'ui/set-last-copy-format':
      return { ...state, ui: { ...state.ui, lastCopyFormat: action.format } }

    case 'setup/patch':
      return { ...state, setup: { ...state.setup, ...action.patch } }

    case 'setup/set-provider':
      return { ...state, setup: { ...state.setup, provider: action.provider } }

    case 'setup/set-detail-level':
      return { ...state, setup: { ...state.setup, detailLevel: action.detailLevel } }

    case 'state/reset':
      return action.next

    default:
      return state
  }
}
