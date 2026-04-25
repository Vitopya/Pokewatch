import type { Newsletter } from '../sections/workspace/types'

export function newsletterToMarkdown(newsletter: Newsletter): string {
  const lines: string[] = []
  lines.push(`# ${newsletter.title}`)
  lines.push('')

  for (const section of newsletter.sections) {
    lines.push(`## ${section.title}`)
    lines.push('')
    for (const item of section.items) {
      lines.push(`### ${item.title}`)
      lines.push('')
      if (item.imageUrl) {
        lines.push(`![](${item.imageUrl})`)
        lines.push('')
      }
      if (item.description) {
        lines.push(item.description)
        lines.push('')
      }
      const bullets = item.bullets.filter((b) => b.trim().length > 0)
      if (bullets.length > 0) {
        for (const bullet of bullets) {
          lines.push(`- ${bullet}`)
        }
        lines.push('')
      }
      lines.push(`Source : [${item.sourceName}](${item.sourceUrl})`)
      lines.push('')
      lines.push('---')
      lines.push('')
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Produit du HTML simple, sémantique, sans inline-styles agressifs.
 * Optimisé pour collage dans Microsoft Teams, Slack, Outlook, Gmail, Notion :
 * ces clients normalisent fortement le HTML, donc on s'appuie uniquement sur
 * les balises sémantiques (h1/h2/h3, p, ul/li, img, a) qu'ils savent rendre.
 */
export function newsletterToHtml(newsletter: Newsletter): string {
  const blocks: string[] = []

  blocks.push(`<h1>${escapeHtml(newsletter.title)}</h1>`)

  for (const section of newsletter.sections) {
    blocks.push(`<h2>${escapeHtml(section.title)}</h2>`)

    for (const item of section.items) {
      blocks.push(`<h3>${escapeHtml(item.title)}</h3>`)
      if (item.imageUrl) {
        blocks.push(
          `<p><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" width="480" /></p>`,
        )
      }
      if (item.description) {
        blocks.push(`<p>${escapeHtml(item.description)}</p>`)
      }
      const bullets = item.bullets.filter((b) => b.trim().length > 0)
      if (bullets.length > 0) {
        blocks.push('<ul>')
        for (const bullet of bullets) {
          blocks.push(`<li>${escapeHtml(bullet)}</li>`)
        }
        blocks.push('</ul>')
      }
      blocks.push(
        `<p><em>Source : <a href="${escapeHtml(item.sourceUrl)}">${escapeHtml(item.sourceName)}</a></em></p>`,
      )
      blocks.push('<hr />')
    }
  }

  return blocks.join('\n')
}

export async function copyMarkdownToClipboard(newsletter: Newsletter): Promise<void> {
  const markdown = newsletterToMarkdown(newsletter)
  await navigator.clipboard.writeText(markdown)
}

export async function copyHtmlToClipboard(newsletter: Newsletter): Promise<void> {
  const html = newsletterToHtml(newsletter)
  const markdown = newsletterToMarkdown(newsletter)
  if (typeof window !== 'undefined' && 'ClipboardItem' in window) {
    const item = new window.ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([markdown], { type: 'text/plain' }),
    })
    await navigator.clipboard.write([item])
    return
  }
  await navigator.clipboard.writeText(html)
}
