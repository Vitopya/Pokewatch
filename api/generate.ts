import type { IncomingMessage, ServerResponse } from 'http'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server')
  }
  return new GoogleGenerativeAI(apiKey)
}

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

  try {
    const genAI = getGeminiClient()
    const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 16000,
        responseMimeType: 'application/json',
      },
    })

    send('start', { model: modelName, articleCount: body.articles.length })

    const userPrompt = formatArticlesForUser(body.articles)
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    })

    let fullText = ''
    let charsSinceLastFlush = 0

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (!text) continue
      fullText += text
      charsSinceLastFlush += text.length
      if (charsSinceLastFlush >= 32) {
        send('progress', { chars: fullText.length })
        charsSinceLastFlush = 0
      }
    }

    const finalResponse = await result.response
    const jsonRaw = extractJsonBlock(fullText)
    if (!jsonRaw) {
      send('error', {
        message: 'Could not extract JSON from Gemini output',
        raw: fullText.slice(0, 500),
      })
      res.end()
      return
    }

    let parsed: GeneratedPayload
    try {
      parsed = JSON.parse(jsonRaw)
    } catch (e) {
      send('error', {
        message: `JSON parse failed: ${(e as Error).message}`,
        raw: jsonRaw.slice(0, 500),
      })
      res.end()
      return
    }

    const newsletter = buildNewsletter(parsed)
    const usageMeta = finalResponse.usageMetadata

    send('complete', {
      newsletter,
      usage: {
        promptTokens: usageMeta?.promptTokenCount ?? 0,
        outputTokens: usageMeta?.candidatesTokenCount ?? 0,
        totalTokens: usageMeta?.totalTokenCount ?? 0,
      },
    })
    res.end()
  } catch (error) {
    send('error', { message: String((error as Error).message ?? error) })
    res.end()
  }
}
