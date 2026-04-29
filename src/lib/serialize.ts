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

function formatGeneratedDateForTeams(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso)
    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

/**
 * Produit du HTML inline-stylé optimisé pour Microsoft Teams.
 * Teams supprime les classes CSS mais conserve les styles inline. On reproduit
 * donc l'identité visuelle (vermillon, Fraunces fallback Georgia, hiérarchie
 * éditoriale) via des inline styles que le composer Teams (RoosterJS) preserve.
 */
export function newsletterToTeamsHtml(newsletter: Newsletter): string {
  const VERMILLION = '#c2200f'
  const INK = '#0e0e0c'
  const INK_3 = '#4f4f48'
  const INK_2 = '#2a2a26'
  const RULE = '#c8c2b3'
  const FAM_DISPLAY = `'Fraunces', Georgia, 'Times New Roman', serif`
  const FAM_SANS = `'Inter Tight', 'Segoe UI', Arial, sans-serif`
  const FAM_MONO = `'JetBrains Mono', Consolas, 'Courier New', monospace`

  const blocks: string[] = []

  blocks.push(
    `<div style="font-family:${FAM_SANS};color:${INK};line-height:1.55;font-size:14px;max-width:720px;">`,
  )

  const dateLine = formatGeneratedDateForTeams(newsletter.generatedAt)
  blocks.push(
    `<div style="border-bottom:3px solid ${VERMILLION};padding-bottom:10px;margin-bottom:18px;">`,
  )
  if (dateLine) {
    blocks.push(
      `<div style="font-family:${FAM_MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${VERMILLION};margin-bottom:6px;">Édition · ${escapeHtml(dateLine)}</div>`,
    )
  }
  blocks.push(
    `<h1 style="font-family:${FAM_DISPLAY};font-weight:900;font-size:30px;line-height:1.05;margin:0;color:${INK};letter-spacing:-0.02em;">${escapeHtml(newsletter.title)}</h1>`,
  )
  blocks.push(`</div>`)

  for (const section of newsletter.sections) {
    blocks.push(
      `<h2 style="font-family:${FAM_DISPLAY};font-weight:800;font-size:20px;line-height:1.15;color:${INK};border-bottom:2px solid ${INK};padding-bottom:4px;margin:28px 0 14px 0;letter-spacing:-0.01em;">${escapeHtml(section.title)}</h2>`,
    )

    for (const item of section.items) {
      blocks.push(`<div style="margin:0 0 24px 0;padding:0 0 16px 0;border-bottom:1px solid ${RULE};">`)
      blocks.push(
        `<h3 style="font-family:${FAM_DISPLAY};font-weight:700;font-size:17px;line-height:1.25;color:${INK};margin:8px 0 8px 0;">${escapeHtml(item.title)}</h3>`,
      )
      if (item.imageUrl) {
        blocks.push(
          `<div style="margin:8px 0;"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" width="480" style="max-width:100%;height:auto;display:block;border:1px solid ${RULE};" /></div>`,
        )
      }
      if (item.description) {
        blocks.push(
          `<p style="margin:6px 0 10px 0;padding:2px 0 2px 12px;border-left:3px solid ${VERMILLION};font-style:italic;color:${INK_2};font-size:14px;">${escapeHtml(item.description)}</p>`,
        )
      }
      const bullets = item.bullets.filter((b) => b.trim().length > 0)
      if (bullets.length > 0) {
        blocks.push(`<ul style="margin:8px 0;padding-left:22px;color:${INK};">`)
        for (const bullet of bullets) {
          blocks.push(
            `<li style="margin:4px 0;line-height:1.5;">${escapeHtml(bullet)}</li>`,
          )
        }
        blocks.push(`</ul>`)
      }
      blocks.push(
        `<p style="margin:10px 0 0 0;font-family:${FAM_MONO};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${INK_3};">Source · <a href="${escapeHtml(item.sourceUrl)}" style="color:${VERMILLION};text-decoration:underline;">${escapeHtml(item.sourceName)}</a></p>`,
      )
      blocks.push(`</div>`)
    }
  }

  blocks.push(
    `<div style="margin-top:18px;padding-top:8px;border-top:2px solid ${INK};font-family:${FAM_MONO};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${INK_3};text-align:center;">— Fin de l'édition —</div>`,
  )
  blocks.push(`</div>`)

  return blocks.join('')
}

export async function copyTeamsHtmlToClipboard(newsletter: Newsletter): Promise<void> {
  const html = newsletterToTeamsHtml(newsletter)
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
