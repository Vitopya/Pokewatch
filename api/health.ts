import type { IncomingMessage, ServerResponse } from 'http'

type AiProvider = 'gemini' | 'anthropic' | 'openai' | 'custom'

const PROVIDER_KEYS: Record<AiProvider, string> = {
  gemini: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  custom: 'CUSTOM_API_KEY',
}

const PROVIDER_MODELS: Record<AiProvider, string> = {
  gemini: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  anthropic: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
  openai: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  custom: process.env.CUSTOM_MODEL ?? 'gpt-4o-mini',
}

function isProvider(value: string | undefined): value is AiProvider {
  return value === 'gemini' || value === 'anthropic' || value === 'openai' || value === 'custom'
}

function parseQuery(url: string | undefined): URLSearchParams {
  if (!url) return new URLSearchParams()
  const idx = url.indexOf('?')
  if (idx === -1) return new URLSearchParams()
  return new URLSearchParams(url.slice(idx + 1))
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const params = parseQuery(req.url)
  const requested = params.get('provider') ?? undefined
  const provider: AiProvider = isProvider(requested) ? requested : 'gemini'

  const envVar = PROVIDER_KEYS[provider]
  const hasKey = Boolean(process.env[envVar])
  const customBaseOk = provider === 'custom' ? Boolean(process.env.CUSTOM_BASE_URL) : true
  const ready = hasKey && customBaseOk

  const allKeys: Record<AiProvider, boolean> = {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    custom: Boolean(process.env.CUSTOM_API_KEY) && Boolean(process.env.CUSTOM_BASE_URL),
  }

  res.statusCode = ready ? 200 : 503
  res.setHeader('content-type', 'application/json')
  res.end(
    JSON.stringify({
      status: ready ? 'ok' : 'missing-key',
      provider,
      model: PROVIDER_MODELS[provider],
      envVar,
      hasGeminiKey: allKeys.gemini,
      hasAnthropicKey: allKeys.anthropic,
      hasOpenAiKey: allKeys.openai,
      hasCustomKey: allKeys.custom,
      providers: allKeys,
    }),
  )
}
