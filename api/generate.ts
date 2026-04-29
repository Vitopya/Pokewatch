import type { IncomingMessage, ServerResponse } from 'http'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

type AiProvider = 'gemini' | 'anthropic' | 'openai' | 'custom'

interface IncomingArticle {
  id: string
  title: string
  description?: string
  url: string
  publishedAt?: string
  imageUrl?: string | null
  sourceName?: string
}

interface RequestBody {
  articles: IncomingArticle[]
  newsletterTitle?: string
  provider?: AiProvider
}

const SYSTEM_PROMPT = `Tu es la voix éditoriale d'une newsletter générée par Gazette — un magazine compact, dense, qui s'adresse à ses lecteurs sans détour. Tu transformes des articles RSS bruts en édition structurée, lisible, avec un peu de personnalité.

# Ton de voix

- Direct, complice, légèrement enlevé. On parle entre lecteurs avertis, pas entre journalistes corporates.
- Phrases qui percutent : sujet-verbe-impact. Pas de remplissage.
- Petits clins d'œil bienvenus quand le sujet s'y prête, jamais lourds. Une touche par item, pas trois.
- Tutoiement implicite ("à ne pas rater", "garde du temps libre", "prépare le terrain"). Pas de "vous".
- Bannis les superlatifs creux ("incroyable", "exceptionnel", "à couper le souffle", "fantastique") et les formules vides ("ne manquez pas", "bonne nouvelle").
- Garde les noms propres et chiffres exacts. Aucune invention de fait.
- Adapte-toi au domaine : si les articles parlent de tech, sois précis sur la tech ; s'ils parlent de finance, sois précis sur les chiffres ; etc. Ne plaque pas un univers qui n'est pas dans la source.

# Ce que tu produis

Pour chaque article reçu :

1. **title** — un titre cinglant (5–10 mots), centré sur l'enjeu, jamais le titre brut de la source.
2. **description** — UNE phrase qui pose le contexte ET pourquoi le lecteur devrait s'y intéresser. Pas un résumé plat.
3. **bullets** — 4 à 6 puces, chacune dense en infos concrètes :
   - Dates précises (jour, plage horaire, durée)
   - Acteurs / produits / entités impliqués
   - Chiffres clés (montants, pourcentages, tailles, durées)
   - Mécaniques ou conditions importantes
   - Conseil actionnable (ce que le lecteur doit préparer / surveiller)
   - Si certaines infos ne sont pas dans la source, ne les invente pas — produit moins de bullets mais utiles.
4. **imageUrl, sourceUrl, sourceName, sourceArticleId** — recopiés tels quels depuis l'article source. Si imageUrl est absent, mets null.

# Catégorisation (EventTag)

Classe chaque article dans UNE catégorie générique, en t'adaptant au domaine :

- "event"     : événement daté, lancement, conférence, sortie programmée
- "raid"      : opération ponctuelle ou ciblée (campagne, opération coup de poing, action limitée dans le temps)
- "update"    : mise à jour produit, patch, changement de version, évolution de fonctionnement
- "community" : communauté, contributions, échanges, social
- "research"  : recherche, étude, analyse de fond, rapport
- "spotlight" : focus court, mise en lumière d'un acteur ou d'un sujet
- "misc"      : tout le reste (rumeurs, opinions, brèves, éditos…)

Regroupe les items par tag en sections. Ordre des sections (si présentes) :
event, raid, community, spotlight, research, update, misc.

# Titres de section (en français, légèrement enlevés, adapte au contenu)

- event → "À l'agenda"
- raid → "Opérations en cours"
- community → "Côté communauté"
- spotlight → "Sous les projecteurs"
- research → "Études & analyses"
- update → "Mises à jour"
- misc → "En bref"

# Format de sortie

Réponds UNIQUEMENT avec un objet JSON valide respectant ce schéma :

{
  "title": "Gazette — Édition du <DD MMM YYYY>",
  "sections": [
    {
      "title": "<titre de section>",
      "tag": "event|raid|update|community|research|spotlight|misc",
      "items": [
        {
          "title": "<titre cinglant 5-10 mots>",
          "description": "<une phrase contexte + intérêt>",
          "bullets": ["<info dense>", "<info dense>", "<info dense>", "<info dense>"],
          "imageUrl": "<URL ou null>",
          "sourceUrl": "<URL>",
          "sourceName": "<nom de la source>",
          "sourceArticleId": "<id de l'article source>"
        }
      ]
    }
  ]
}

Aucun texte hors du JSON. Aucun bloc \`\`\`json. JSON pur uniquement.`

function formatArticlesForUser(articles: IncomingArticle[]): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const lines = articles.map((article, index) => {
    return [
      `## Article ${index + 1}`,
      `id: ${article.id}`,
      `source: ${article.sourceName ?? '?'}`,
      `url: ${article.url}`,
      `publishedAt: ${article.publishedAt ?? '?'}`,
      `imageUrl: ${article.imageUrl ?? 'null'}`,
      `title: ${article.title}`,
      `description: ${article.description ?? ''}`,
    ].join('\n')
  })
  return [
    `Date d'aujourd'hui : ${today}.`,
    '',
    `Voici ${articles.length} article${articles.length > 1 ? 's' : ''} à synthétiser dans la newsletter :`,
    '',
    lines.join('\n\n'),
    '',
    'Produis maintenant la newsletter au format JSON demandé.',
  ].join('\n')
}

function extractJsonBlock(text: string): string | null {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match?.[1]) return match[1].trim()
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null
  return text.slice(firstBrace, lastBrace + 1).trim()
}

interface GeneratedItem {
  title: string
  description: string
  bullets: string[]
  imageUrl: string | null
  sourceUrl: string
  sourceName: string
  sourceArticleId: string
}

interface GeneratedSection {
  title: string
  tag: string
  items: GeneratedItem[]
}

interface GeneratedPayload {
  title: string
  sections: GeneratedSection[]
}

const VALID_TAGS = new Set([
  'event',
  'raid',
  'update',
  'community',
  'research',
  'spotlight',
  'misc',
])

function buildNewsletter(payload: GeneratedPayload) {
  const generatedAt = new Date().toISOString()
  const newsletterId = `newsletter-${Date.now().toString(36)}`
  return {
    id: newsletterId,
    title: payload.title,
    generatedAt,
    status: 'ready' as const,
    format: 'markdown' as const,
    sections: payload.sections.map((section, sectionIndex) => ({
      id: `section-${sectionIndex}-${section.tag}`,
      title: section.title,
      tag: VALID_TAGS.has(section.tag) ? section.tag : 'misc',
      items: section.items.map((item, itemIndex) => ({
        id: `item-${sectionIndex}-${itemIndex}`,
        sourceArticleId: item.sourceArticleId,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl ?? null,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
        bullets: Array.isArray(item.bullets) ? item.bullets : [],
      })),
    })),
  }
}

interface UsageMeta {
  promptTokens: number
  outputTokens: number
  totalTokens: number
}

interface ProviderResult {
  text: string
  usage: UsageMeta
  modelUsed: string
}

interface ProviderConfig {
  id: AiProvider
  envVar: string
  models: string[]
  run: (model: string, userPrompt: string, onChunk: (chars: number) => void) => Promise<ProviderResult>
}

function isRetryableError(err: unknown): boolean {
  const e = err as { status?: number; message?: string }
  const msg = String(e?.message ?? '').toLowerCase()
  if (e?.status === 429 || e?.status === 500 || e?.status === 502 || e?.status === 503 || e?.status === 504) {
    return true
  }
  return (
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('rate limit') ||
    msg.includes('high demand') ||
    msg.includes('service unavailable') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset')
  )
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildGeminiProvider(): ProviderConfig {
  const envVar = 'GEMINI_API_KEY'
  const apiKey = process.env[envVar]
  if (!apiKey) throw new Error(`${envVar} is not configured on the server`)
  const client = new GoogleGenerativeAI(apiKey)

  const defaultModels = [
    process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.5-pro',
  ]
  const models = Array.from(new Set(defaultModels))

  return {
    id: 'gemini',
    envVar,
    models,
    run: async (model, userPrompt, onChunk) => {
      const m = client.getGenerativeModel({
        model,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16000,
          responseMimeType: 'application/json',
        },
      })
      const result = await m.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      })
      let fullText = ''
      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (!text) continue
        fullText += text
        onChunk(fullText.length)
      }
      const finalResponse = await result.response
      const usage = finalResponse.usageMetadata
      return {
        text: fullText,
        usage: {
          promptTokens: usage?.promptTokenCount ?? 0,
          outputTokens: usage?.candidatesTokenCount ?? 0,
          totalTokens: usage?.totalTokenCount ?? 0,
        },
        modelUsed: model,
      }
    },
  }
}

function buildAnthropicProvider(): ProviderConfig {
  const envVar = 'ANTHROPIC_API_KEY'
  const apiKey = process.env[envVar]
  if (!apiKey) throw new Error(`${envVar} is not configured on the server`)
  const client = new Anthropic({ apiKey })

  const models = [
    process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
    'claude-haiku-4-5',
  ]
  const dedup = Array.from(new Set(models))

  return {
    id: 'anthropic',
    envVar,
    models: dedup,
    run: async (model, userPrompt, onChunk) => {
      let fullText = ''
      let promptTokens = 0
      let outputTokens = 0
      const stream = client.messages.stream({
        model,
        max_tokens: 16000,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      })
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text
          onChunk(fullText.length)
        } else if (event.type === 'message_start') {
          promptTokens = event.message.usage.input_tokens ?? 0
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage?.output_tokens ?? outputTokens
        }
      }
      return {
        text: fullText,
        usage: {
          promptTokens,
          outputTokens,
          totalTokens: promptTokens + outputTokens,
        },
        modelUsed: model,
      }
    },
  }
}

function buildOpenAiProvider(custom = false): ProviderConfig {
  const envVar = custom ? 'CUSTOM_API_KEY' : 'OPENAI_API_KEY'
  const apiKey = process.env[envVar]
  if (!apiKey) throw new Error(`${envVar} is not configured on the server`)
  const baseURL = custom ? process.env.CUSTOM_BASE_URL : undefined
  if (custom && !baseURL) {
    throw new Error('CUSTOM_BASE_URL is required for the custom provider')
  }
  const client = new OpenAI({ apiKey, baseURL })

  const defaultModel = custom
    ? process.env.CUSTOM_MODEL ?? 'gpt-4o-mini'
    : process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const models = custom ? [defaultModel] : [defaultModel, 'gpt-4o', 'gpt-4-turbo']
  const dedup = Array.from(new Set(models))

  return {
    id: custom ? 'custom' : 'openai',
    envVar,
    models: dedup,
    run: async (model, userPrompt, onChunk) => {
      let fullText = ''
      let promptTokens = 0
      let outputTokens = 0
      const stream = await client.chat.completions.create({
        model,
        temperature: 0.7,
        max_tokens: 16000,
        stream: true,
        stream_options: { include_usage: true },
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      })
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content
        if (delta) {
          fullText += delta
          onChunk(fullText.length)
        }
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens ?? 0
          outputTokens = chunk.usage.completion_tokens ?? 0
        }
      }
      return {
        text: fullText,
        usage: {
          promptTokens,
          outputTokens,
          totalTokens: promptTokens + outputTokens,
        },
        modelUsed: model,
      }
    },
  }
}

function buildProvider(provider: AiProvider): ProviderConfig {
  switch (provider) {
    case 'gemini':
      return buildGeminiProvider()
    case 'anthropic':
      return buildAnthropicProvider()
    case 'openai':
      return buildOpenAiProvider(false)
    case 'custom':
      return buildOpenAiProvider(true)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

function pickProvider(requested?: AiProvider): AiProvider {
  if (requested) return requested
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.CUSTOM_API_KEY && process.env.CUSTOM_BASE_URL) return 'custom'
  return 'gemini'
}

const RETRY_DELAYS_MS = [1000, 3000, 8000]

async function runWithRetry(
  config: ProviderConfig,
  userPrompt: string,
  onProgress: (chars: number, model: string) => void,
  onAttempt: (info: { model: string; attempt: number; error?: string }) => void,
): Promise<ProviderResult> {
  let lastError: unknown
  for (const model of config.models) {
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
      try {
        onAttempt({ model, attempt })
        return await config.run(model, userPrompt, (chars) => onProgress(chars, model))
      } catch (err) {
        lastError = err
        const retryable = isRetryableError(err)
        const errMsg = String((err as Error).message ?? err)
        onAttempt({ model, attempt, error: errMsg })
        if (!retryable) break
        if (attempt < RETRY_DELAYS_MS.length) {
          await delay(RETRY_DELAYS_MS[attempt])
        }
      }
    }
  }
  throw lastError ?? new Error('All retry attempts failed')
}

export default async function handler(
  req: IncomingMessage & { body: unknown },
  res: ServerResponse,
) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const body = req.body as RequestBody | undefined
  if (!body || !Array.isArray(body.articles) || body.articles.length === 0) {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: 'Body must include a non-empty articles array' }))
    return
  }

  res.statusCode = 200
  res.setHeader('content-type', 'text/event-stream')
  res.setHeader('cache-control', 'no-cache')
  res.setHeader('connection', 'keep-alive')
  ;(res as { flushHeaders?: () => void }).flushHeaders?.()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const providerId = pickProvider(body.provider)

  let config: ProviderConfig
  try {
    config = buildProvider(providerId)
  } catch (error) {
    send('error', {
      code: 'missing-key',
      provider: providerId,
      message: String((error as Error).message ?? error),
    })
    res.end()
    return
  }

  send('start', {
    provider: providerId,
    primaryModel: config.models[0],
    fallbackModels: config.models.slice(1),
    articleCount: body.articles.length,
  })

  const userPrompt = formatArticlesForUser(body.articles)
  let lastReportedChars = 0

  try {
    const result = await runWithRetry(
      config,
      userPrompt,
      (chars, model) => {
        if (chars - lastReportedChars >= 32) {
          send('progress', { chars, model })
          lastReportedChars = chars
        }
      },
      (info) => {
        send('attempt', info)
      },
    )

    const jsonRaw = extractJsonBlock(result.text)
    if (!jsonRaw) {
      send('error', {
        code: 'parse-failed',
        provider: providerId,
        message: 'Could not extract JSON from model output',
        raw: result.text.slice(0, 500),
      })
      res.end()
      return
    }

    let parsed: GeneratedPayload
    try {
      parsed = JSON.parse(jsonRaw)
    } catch (e) {
      send('error', {
        code: 'parse-failed',
        provider: providerId,
        message: `JSON parse failed: ${(e as Error).message}`,
        raw: jsonRaw.slice(0, 500),
      })
      res.end()
      return
    }

    const newsletter = buildNewsletter(parsed)

    send('complete', {
      newsletter,
      provider: providerId,
      modelUsed: result.modelUsed,
      usage: result.usage,
    })
    res.end()
  } catch (error) {
    const e = error as { status?: number; message?: string }
    const status = e?.status
    const message = String(e?.message ?? error)
    let code: string = 'provider-error'
    if (status === 503 || /overloaded|high demand|service unavailable|503/i.test(message)) {
      code = 'overloaded'
    } else if (status === 429 || /rate limit|too many requests|429/i.test(message)) {
      code = 'rate-limited'
    } else if (status === 401 || status === 403 || /invalid api key|unauthorized|forbidden/i.test(message)) {
      code = 'auth-failed'
    }
    send('error', { code, provider: providerId, status, message })
    res.end()
  }
}
