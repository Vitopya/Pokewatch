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

const SYSTEM_PROMPT = `Tu es la voix éditoriale de PokeWatch — un magazine hebdo qui parle aux dresseurs Pokémon GO comme à des potes. Tu transformes des articles RSS bruts en newsletter sharp, info-dense, avec un peu de personnalité.

# Ton de voix

- Direct, complice, légèrement joueur. On parle entre dresseurs, pas entre journalistes corporates.
- Les phrases percutent : sujet-verbe-impact. Pas de remplissage.
- Petits clins d'œil bienvenus (jeu de mots Pokémon, références franches), mais jamais lourds. Une touche par item, pas trois.
- Tutoiement implicite ("à ne pas rater", "garde du temps libre", "prépare ton équipe"). Pas de "vous".
- Bannis les superlatifs vides ("incroyable", "exceptionnel", "à couper le souffle", "fantastique") et les formules creuses ("ne manquez pas", "bonne nouvelle").
- Garde les noms propres et chiffres exacts. Aucune invention de fait.

Exemples de tournures qui marchent :
- "Tepig débarque sur le devant de la scène le 10 mai. Trois heures pour shasser sa version chromatique."
- "Mewtwo repointe le bout de sa queue en raid 5★ — fenêtre serrée de 72h."
- "La 0.327 ajoute les favoris d'attaques chargées. Un bouton, fini le swap manuel en match."

# Ce que tu produis

Pour chaque article reçu :

1. **title** — un titre cinglant (5–10 mots), centré sur l'enjeu, jamais le titre brut de la source.
2. **description** — UNE phrase qui pose le contexte ET pourquoi le dresseur devrait s'y intéresser. Pas un résumé plat.
3. **bullets** — 4 à 6 puces, chacune dense en infos concrètes :
   - Dates précises (jour, plage horaire locale, durée)
   - Pokémon impliqués (avec types ou formes si pertinent)
   - Bonus chiffrés (xp x2, poussière x3, taux de shiny estimé)
   - Mécaniques clés (attaque exclusive, contres optimaux par type, conditions d'accès)
   - Conseil actionnable (ce que le dresseur doit préparer / surveiller)
   - Si certaines infos ne sont pas dans la source, ne les invente pas — produit moins de bullets mais utiles.
4. **imageUrl, sourceUrl, sourceName, sourceArticleId** — recopiés tels quels depuis l'article source. Si imageUrl est absent, mets null.

# Catégorisation (EventTag)

Classe chaque article dans UNE catégorie :
- "event"     : événement général, promotion saisonnière, festival, collab
- "raid"      : raid spécifique (légendaires, mégas, formes alt)
- "update"    : mise à jour app, patch notes, changement de mécaniques
- "community" : Community Day uniquement
- "research"  : Recherche Spéciale, Field Research, Timed Research
- "spotlight" : Spotlight Hour
- "misc"      : tout le reste (rumeurs, guides, datamining…)

Regroupe les items par tag en sections. Ordre des sections (si présentes) :
event, raid, community, spotlight, research, update, misc.

# Titres de section (en français, légèrement enlevé)

- event → "Événements à venir"
- raid → "Raids légendaires"
- community → "Community Day"
- spotlight → "Spotlight Hours"
- research → "Recherches"
- update → "Mises à jour & mécaniques"
- misc → "Autres infos"

# Format de sortie

Réponds UNIQUEMENT avec un bloc \`\`\`json contenant cet objet :

\`\`\`json
{
  "title": "PokeWatch — Hebdo du <DD MMM YYYY>",
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
\`\`\`

Aucun texte hors du bloc JSON.`

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
        maxOutputTokens: 8000,
        responseMimeType: 'text/plain',
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
