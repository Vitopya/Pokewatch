import { describe, expect, it } from 'vitest'
import { workspaceReducer, type WorkspaceState } from './workspace-reducer'
import {
  buildEmptyNewsletter,
  buildInitialFilters,
  buildInitialSetup,
  DEFAULT_FEEDS,
  INITIAL_UI,
} from './initial-state'
import type { Article, Newsletter, RssFeed } from '../sections/workspace/types'

const seedFeed: RssFeed = {
  id: 'feed-test',
  title: 'Test Feed',
  url: 'https://example.com/feed.xml',
  isActive: true,
  accentColor: 'sky',
  lastSyncedAt: null,
}

function makeBaseState(): WorkspaceState {
  return {
    feeds: [...DEFAULT_FEEDS, seedFeed],
    filters: { ...buildInitialFilters(), activeFeedIds: [seedFeed.id] },
    articles: [],
    newsletter: buildEmptyNewsletter(),
    setup: buildInitialSetup(),
    ui: { ...INITIAL_UI },
  }
}

const sampleArticle: Article = {
  id: 'article-1',
  feedId: seedFeed.id,
  title: 'Test article',
  description: 'Description',
  url: 'https://example.com/a',
  publishedAt: new Date().toISOString(),
  imageUrl: null,
  sourceName: 'Test Source',
  isSelected: true,
}

const sampleNewsletter: Newsletter = {
  id: 'nl-1',
  title: 'Test Newsletter',
  generatedAt: new Date().toISOString(),
  status: 'ready',
  format: 'markdown',
  sections: [
    {
      id: 'section-a',
      title: 'Section A',
      tag: 'event',
      items: [
        {
          id: 'item-1',
          sourceArticleId: 'article-1',
          title: 'Item 1',
          description: 'desc',
          imageUrl: null,
          sourceUrl: 'https://example.com/a',
          sourceName: 'Test Source',
          bullets: ['bullet 1', 'bullet 2'],
        },
      ],
    },
    {
      id: 'section-b',
      title: 'Section B',
      tag: 'raid',
      items: [],
    },
  ],
}

describe('workspaceReducer', () => {
  describe('feed actions', () => {
    it('adds a new feed and includes it in active filter ids when active', () => {
      const state = makeBaseState()
      const next = workspaceReducer(state, {
        type: 'feed/add',
        feed: {
          id: 'new-feed',
          title: 'New',
          url: 'https://new.example/feed',
          isActive: true,
          accentColor: 'amber',
          lastSyncedAt: null,
        },
      })
      expect(next.feeds.find((f) => f.id === 'new-feed')).toBeDefined()
      expect(next.filters.activeFeedIds).toContain('new-feed')
    })

    it('does not duplicate a feed with the same url', () => {
      const state = makeBaseState()
      const dup = state.feeds[0]
      const next = workspaceReducer(state, { type: 'feed/add', feed: dup })
      expect(next).toBe(state)
    })

    it('removes a feed and cleans up filters and articles', () => {
      const target = seedFeed
      const state: WorkspaceState = {
        ...makeBaseState(),
        articles: [{ ...sampleArticle, feedId: target.id }],
      }
      const next = workspaceReducer(state, { type: 'feed/remove', feedId: target.id })
      expect(next.feeds.find((f) => f.id === target.id)).toBeUndefined()
      expect(next.filters.activeFeedIds).not.toContain(target.id)
      expect(next.articles).toHaveLength(0)
    })

    it('toggles feed active syncs filter membership', () => {
      const target = seedFeed
      const state = makeBaseState()
      const off = workspaceReducer(state, {
        type: 'feed/toggle-active',
        feedId: target.id,
        isActive: false,
      })
      expect(off.filters.activeFeedIds).not.toContain(target.id)

      const on = workspaceReducer(off, {
        type: 'feed/toggle-active',
        feedId: target.id,
        isActive: true,
      })
      expect(on.filters.activeFeedIds).toContain(target.id)
    })
  })

  describe('article selection', () => {
    it('toggles a single article', () => {
      const state: WorkspaceState = {
        ...makeBaseState(),
        articles: [sampleArticle],
      }
      const next = workspaceReducer(state, {
        type: 'articles/toggle-selection',
        articleId: sampleArticle.id,
        isSelected: false,
      })
      expect(next.articles[0].isSelected).toBe(false)
    })

    it('select-all and deselect-all flip every flag', () => {
      const state: WorkspaceState = {
        ...makeBaseState(),
        articles: [
          { ...sampleArticle, id: 'a', isSelected: false },
          { ...sampleArticle, id: 'b', isSelected: false },
        ],
      }
      const allOn = workspaceReducer(state, { type: 'articles/select-all' })
      expect(allOn.articles.every((a) => a.isSelected)).toBe(true)
      const allOff = workspaceReducer(allOn, { type: 'articles/deselect-all' })
      expect(allOff.articles.every((a) => !a.isSelected)).toBe(true)
    })
  })

  describe('newsletter editing', () => {
    it('edits a section title', () => {
      const state: WorkspaceState = { ...makeBaseState(), newsletter: sampleNewsletter }
      const next = workspaceReducer(state, {
        type: 'section/edit-title',
        sectionId: 'section-a',
        title: 'Renamed',
      })
      expect(next.newsletter.sections[0].title).toBe('Renamed')
    })

    it('reorders sections', () => {
      const state: WorkspaceState = { ...makeBaseState(), newsletter: sampleNewsletter }
      const next = workspaceReducer(state, {
        type: 'section/reorder',
        orderedIds: ['section-b', 'section-a'],
      })
      expect(next.newsletter.sections.map((s) => s.id)).toEqual(['section-b', 'section-a'])
    })

    it('deletes a section', () => {
      const state: WorkspaceState = { ...makeBaseState(), newsletter: sampleNewsletter }
      const next = workspaceReducer(state, { type: 'section/delete', sectionId: 'section-b' })
      expect(next.newsletter.sections.map((s) => s.id)).toEqual(['section-a'])
    })

    it('edits an item title', () => {
      const state: WorkspaceState = { ...makeBaseState(), newsletter: sampleNewsletter }
      const next = workspaceReducer(state, {
        type: 'item/edit-title',
        itemId: 'item-1',
        title: 'Renamed item',
      })
      expect(next.newsletter.sections[0].items[0].title).toBe('Renamed item')
    })

    it('adds and removes bullets', () => {
      const state: WorkspaceState = { ...makeBaseState(), newsletter: sampleNewsletter }
      const added = workspaceReducer(state, { type: 'item/add-bullet', itemId: 'item-1' })
      expect(added.newsletter.sections[0].items[0].bullets).toHaveLength(3)
      const removed = workspaceReducer(added, {
        type: 'item/remove-bullet',
        itemId: 'item-1',
        bulletIndex: 0,
      })
      expect(removed.newsletter.sections[0].items[0].bullets).toEqual(['bullet 2', ''])
    })

    it('replaces and removes an item image', () => {
      const state: WorkspaceState = { ...makeBaseState(), newsletter: sampleNewsletter }
      const replaced = workspaceReducer(state, {
        type: 'item/replace-image',
        itemId: 'item-1',
        imageUrl: 'https://img.example/x.jpg',
      })
      expect(replaced.newsletter.sections[0].items[0].imageUrl).toBe('https://img.example/x.jpg')
      const removed = workspaceReducer(replaced, {
        type: 'item/remove-image',
        itemId: 'item-1',
      })
      expect(removed.newsletter.sections[0].items[0].imageUrl).toBeNull()
    })
  })

  describe('setup', () => {
    it('patches setup flags', () => {
      const state = makeBaseState()
      const next = workspaceReducer(state, {
        type: 'setup/patch',
        patch: { splashSeen: true, tourSeen: true },
      })
      expect(next.setup.splashSeen).toBe(true)
      expect(next.setup.tourSeen).toBe(true)
      expect(next.setup.wizardSeen).toBe(false)
    })

    it('switches provider', () => {
      const state = makeBaseState()
      const next = workspaceReducer(state, { type: 'setup/set-provider', provider: 'anthropic' })
      expect(next.setup.provider).toBe('anthropic')
    })
  })

  describe('ui flags', () => {
    it('sets generating flag and updates newsletter status', () => {
      const state = makeBaseState()
      const generating = workspaceReducer(state, { type: 'ui/set-generating', value: true })
      expect(generating.ui.isGenerating).toBe(true)
      expect(generating.newsletter.status).toBe('generating')
      const idle = workspaceReducer(generating, { type: 'ui/set-generating', value: false })
      expect(idle.ui.isGenerating).toBe(false)
    })
  })
})
