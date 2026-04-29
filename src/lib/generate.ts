import { streamSse } from './sse'
import type { AiProvider, Article, Newsletter } from '../sections/workspace/types'

export type GenerateErrorCode =
  | 'overloaded'
  | 'rate-limited'
  | 'auth-failed'
  | 'missing-key'
  | 'parse-failed'
  | 'provider-error'
  | 'unknown'

export interface GenerateProgressEvent {
  type: 'start' | 'progress' | 'attempt' | 'complete' | 'error'
  data: unknown
}

export class GenerateError extends Error {
  code: GenerateErrorCode
  provider?: AiProvider
  status?: number
  raw?: string

  constructor(opts: {
    code: GenerateErrorCode
    message: string
    provider?: AiProvider
    status?: number
    raw?: string
  }) {
    super(opts.message)
    this.name = 'GenerateError'
    this.code = opts.code
    this.provider = opts.provider
    this.status = opts.status
    this.raw = opts.raw
  }
}

export interface GenerateOptions {
  selectedArticles: Article[]
  provider?: AiProvider
  signal?: AbortSignal
  onProgress?: (event: GenerateProgressEvent) => void
}

export interface GenerateResult {
  newsletter: Newsletter
  usage?: Record<string, number>
  provider?: AiProvider
  modelUsed?: string
}

export function friendlyMessage(code: GenerateErrorCode, provider?: AiProvider): string {
  const providerLabel = provider
    ? { gemini: 'Gemini', anthropic: 'Anthropic', openai: 'OpenAI', custom: 'le provider' }[provider]
    : 'le provider'
  switch (code) {
    case 'overloaded':
      return `${providerLabel} est saturé pour l'instant. Réessaie dans 30 à 60 secondes, ou bascule sur un autre moteur dans les Réglages.`
    case 'rate-limited':
      return `Tu as dépassé la limite de requêtes ${providerLabel}. Patiente une minute, puis relance.`
    case 'auth-failed':
      return `Clé API ${providerLabel} invalide ou refusée. Vérifie la variable d'environnement côté serveur.`
    case 'missing-key':
      return `Clé API ${providerLabel} non configurée côté serveur. Renseigne-la dans tes variables d'environnement.`
    case 'parse-failed':
      return "Le moteur a renvoyé une réponse non lisible. Réessaie : c'est rare et souvent ponctuel."
    case 'provider-error':
      return `Erreur côté ${providerLabel}. Réessaie ou bascule sur un autre moteur.`
    default:
      return 'Erreur inconnue. Réessaie.'
  }
}

export async function generateNewsletter(options: GenerateOptions): Promise<GenerateResult> {
  const { selectedArticles, provider, signal, onProgress } = options

  interface ErrorPayload {
    code?: GenerateErrorCode
    message?: string
    provider?: AiProvider
    status?: number
    raw?: string
  }

  const sink: {
    newsletter: Newsletter | null
    usage?: Record<string, number>
    modelUsed?: string
    providerUsed?: AiProvider
    error: ErrorPayload | null
  } = { newsletter: null, error: null }

  await streamSse(
    '/api/generate',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ articles: selectedArticles, provider }),
    },
    (event, data) => {
      onProgress?.({ type: event as GenerateProgressEvent['type'], data })
      if (event === 'complete') {
        const payload = data as {
          newsletter: Newsletter
          usage?: Record<string, number>
          provider?: AiProvider
          modelUsed?: string
        }
        sink.newsletter = payload.newsletter
        sink.usage = payload.usage
        sink.modelUsed = payload.modelUsed
        sink.providerUsed = payload.provider
      } else if (event === 'error') {
        sink.error = data as ErrorPayload
      }
    },
    signal,
  )

  if (sink.error) {
    const code = (sink.error.code ?? 'unknown') as GenerateErrorCode
    throw new GenerateError({
      code,
      message: friendlyMessage(code, sink.error.provider),
      provider: sink.error.provider,
      status: sink.error.status,
      raw: sink.error.raw,
    })
  }
  if (!sink.newsletter) {
    throw new GenerateError({
      code: 'unknown',
      message: 'Stream ended without a complete event',
    })
  }
  return {
    newsletter: sink.newsletter,
    usage: sink.usage,
    provider: sink.providerUsed,
    modelUsed: sink.modelUsed,
  }
}
