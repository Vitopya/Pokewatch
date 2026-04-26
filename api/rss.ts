import type { IncomingMessage, ServerResponse } from 'http'
import { XMLParser } from 'fast-xml-parser'

interface ParsedArticle {
  id: string
  feedId: string
  title: string
  description: string
  url: string
  publishedAt: string
  imageUrl: string | null
  sourceName: string
  isSelected: boolean
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
  parseTagValue: false,
  cdataPropName: '__cdata',
})

function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function pickText(node: unknown): string {
  if (node == null) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(pickText).join(' ')
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if ('__cdata' in obj) return pickText(obj['__cdata'])
    if ('#text' in obj) return pickText(obj['#text'])
  }
  return ''
}

function pickAttr(node: unknown, attr: string): string | null {
  if (!node || typeof node !== 'object') return null
  const obj = node as Record<string, unknown>
  const value = obj[`@_${attr}`]
  return typeof value === 'string' ? value : null
}

function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

function extractImage(item: Record<string, unknown>, contentHtml: string): string | null {
  const mediaContent = item['media:content']
  if (mediaContent) {
    const url = pickAttr(Array.isArray(mediaContent) ? mediaContent[0] : mediaContent, 'url')
    if (url) return url
  }
  const mediaThumbnail = item['media:thumbnail']
  if (mediaThumbnail) {
    const url = pickAttr(
      Array.isArray(mediaThumbnail) ? mediaThumbnail[0] : mediaThumbnail,
      'url',
    )
    if (url) return url
  }
  const enclosure = item['enclosure']
  if (enclosure) {
    const node = Array.isArray(enclosure) ? enclosure[0] : enclosure
    const type = pickAttr(node, 'type') ?? ''
    if (type.startsWith('image')) {
      const url = pickAttr(node, 'url')
      if (url) return url
    }
  }
  return extractFirstImage(contentHtml)
}

function toIsoDate(input: string): string {
  if (!input) return new Date().toISOString()
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function hashId(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

function pickMetaContent(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Gazette/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('html')) return null
    const html = (await response.text()).slice(0, 200_000)
    return pickMetaContent(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
    ])
  } catch {
    return null
  }
}

async function backfillImages(articles: ParsedArticle[]): Promise<void> {
  const targets = articles.filter((a) => !a.imageUrl && a.url)
  if (targets.length === 0) return
  const concurrency = 5
  let cursor = 0
  async function worker() {
    while (cursor < targets.length) {
      const index = cursor++
      const article = targets[index]
      const found = await fetchOgImage(article.url)
      if (found) article.imageUrl = found
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, targets.length) }, worker)
  await Promise.all(workers)
}

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string> },
  res: ServerResponse,
) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const url = new URL(req.url ?? '', 'http://local')
  const feedUrl = url.searchParams.get('url')
  const feedId = url.searchParams.get('feedId') ?? ''
  const sourceName = url.searchParams.get('sourceName') ?? ''

  if (!feedUrl) {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing url query param' }))
    return
  }

  try {
    const upstream = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Gazette/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8',
      },
    })

    if (!upstream.ok) {
      res.statusCode = 502
      res.setHeader('content-type', 'application/json')
      res.end(
        JSON.stringify({
          error: `Upstream feed responded ${upstream.status}`,
          status: upstream.status,
        }),
      )
      return
    }

    const xml = await upstream.text()
    const parsed = parser.parse(xml) as Record<string, unknown>

    const channel =
      ((parsed.rss as Record<string, unknown> | undefined)?.channel as
        | Record<string, unknown>
        | undefined) ?? (parsed.feed as Record<string, unknown> | undefined)

    if (!channel) {
      res.statusCode = 422
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'Could not parse feed (no channel/feed root)' }))
      return
    }

    const channelTitle = pickText(channel.title) || sourceName || feedUrl
    const isAtom = Boolean(parsed.feed)
    const rawItems = isAtom ? channel.entry : channel.item
    const items = (Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []) as Array<
      Record<string, unknown>
    >

    const articles: ParsedArticle[] = items.map((item) => {
      const title = pickText(item.title)
      const link = isAtom
        ? pickAttr(
            Array.isArray(item.link) ? (item.link as unknown[])[0] : item.link,
            'href',
          ) ?? pickText(item.link)
        : pickText(item.link)
      const descRaw =
        pickText(item.description) ||
        pickText(item['content:encoded']) ||
        pickText(item.summary) ||
        pickText(item.content)
      const description = stripHtml(descRaw).slice(0, 600)
      const publishedRaw =
        pickText(item.pubDate) || pickText(item.published) || pickText(item.updated) || ''
      const publishedAt = toIsoDate(publishedRaw)
      const imageUrl = extractImage(item, descRaw)
      const id = hashId(`${feedId || feedUrl}::${link || title}`)

      return {
        id: `article-${id}`,
        feedId: feedId || hashId(feedUrl),
        title: title || '(sans titre)',
        description,
        url: link || feedUrl,
        publishedAt,
        imageUrl,
        sourceName: sourceName || channelTitle,
        isSelected: true,
      }
    })

    await backfillImages(articles)

    res.statusCode = 200
    res.setHeader('content-type', 'application/json')
    res.setHeader('cache-control', 'public, max-age=300')
    res.end(JSON.stringify({ articles }))
  } catch (error) {
    res.statusCode = 500
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: String((error as Error).message ?? error) }))
  }
}
