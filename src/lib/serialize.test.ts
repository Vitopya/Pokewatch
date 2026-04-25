import { describe, expect, it } from 'vitest'
import { newsletterToHtml, newsletterToMarkdown } from './serialize'
import type { Newsletter } from '../sections/workspace/types'

const newsletter: Newsletter = {
  id: 'nl',
  title: 'PokeWatch — Hebdo test',
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
          title: 'Community Day',
          description: 'Tepig en vedette.',
          imageUrl: 'https://img.example/tepig.jpg',
          sourceUrl: 'https://src.example/tepig',
          sourceName: 'Pokémon GO Hub',
          bullets: ['Date : 10 mai', 'Bonus : poussière x3'],
        },
      ],
    },
  ],
}

describe('newsletterToMarkdown', () => {
  it('produces a deterministic markdown structure', () => {
    const md = newsletterToMarkdown(newsletter)
    expect(md).toContain('# PokeWatch — Hebdo test')
    expect(md).toContain('## Événements')
    expect(md).toContain('### Community Day')
    expect(md).toContain('Tepig en vedette.')
    expect(md).toContain('- Date : 10 mai')
    expect(md).toContain('- Bonus : poussière x3')
    expect(md).toContain('![](https://img.example/tepig.jpg)')
    expect(md).toContain('Source : [Pokémon GO Hub](https://src.example/tepig)')
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
    expect(html).toContain('PokeWatch — Hebdo test')
    expect(html).toContain('<h2')
    expect(html).toContain('Événements')
    expect(html).toContain('<h3')
    expect(html).toContain('Community Day')
    expect(html).toContain('<img src="https://img.example/tepig.jpg"')
    expect(html).toContain('<li')
    expect(html).toContain('Date : 10 mai')
    expect(html).toContain('href="https://src.example/tepig"')
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
