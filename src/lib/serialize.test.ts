import { describe, expect, it } from 'vitest'
import { newsletterToHtml, newsletterToMarkdown } from './serialize'
import type { Newsletter } from '../sections/workspace/types'

const newsletter: Newsletter = {
  id: 'nl',
  title: 'Gazette — Édition test',
  generatedAt: '2026-04-25T08:30:00Z',
  status: 'ready',
  format: 'markdown',
  sections: [
    {
      id: 'section-events',
      title: 'Événements',
      tag: 'event',
      items: [
        {
          id: 'item-1',
          sourceArticleId: 'a-1',
          title: 'Lancement produit',
          description: 'Une nouveauté à suivre.',
          imageUrl: 'https://img.example/cover.jpg',
          sourceUrl: 'https://src.example/post',
          sourceName: 'Source Officielle',
          bullets: ['Date : 10 mai', 'Format : keynote 60 min'],
        },
      ],
    },
  ],
}

describe('newsletterToMarkdown', () => {
  it('produces a deterministic markdown structure', () => {
    const md = newsletterToMarkdown(newsletter)
    expect(md).toContain('# Gazette — Édition test')
    expect(md).toContain('## Événements')
    expect(md).toContain('### Lancement produit')
    expect(md).toContain('Une nouveauté à suivre.')
    expect(md).toContain('- Date : 10 mai')
    expect(md).toContain('- Format : keynote 60 min')
    expect(md).toContain('![](https://img.example/cover.jpg)')
    expect(md).toContain('Source : [Source Officielle](https://src.example/post)')
  })

  it('skips empty bullets', () => {
    const trimmed: Newsletter = {
      ...newsletter,
      sections: [
        {
          ...newsletter.sections[0],
          items: [{ ...newsletter.sections[0].items[0], bullets: ['', 'kept', '   '] }],
        },
      ],
    }
    const md = newsletterToMarkdown(trimmed)
    expect(md).toContain('- kept')
    expect(md).not.toMatch(/^-\s*$/m)
  })
})

describe('newsletterToHtml', () => {
  it('produces inline-styled HTML with title, sections, bullets, and source link', () => {
    const html = newsletterToHtml(newsletter)
    expect(html).toContain('<h1')
    expect(html).toContain('Gazette — Édition test')
    expect(html).toContain('<h2')
    expect(html).toContain('Événements')
    expect(html).toContain('<h3')
    expect(html).toContain('Lancement produit')
    expect(html).toContain('<img src="https://img.example/cover.jpg"')
    expect(html).toContain('<li')
    expect(html).toContain('Date : 10 mai')
    expect(html).toContain('href="https://src.example/post"')
  })

  it('escapes HTML-sensitive characters', () => {
    const dangerous: Newsletter = {
      ...newsletter,
      title: '<script>alert(1)</script>',
    }
    const html = newsletterToHtml(dangerous)
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
