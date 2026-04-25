import type { IncomingMessage, ServerResponse } from 'http'

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  const hasKey = Boolean(process.env.GEMINI_API_KEY)
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

  res.statusCode = hasKey ? 200 : 503
  res.setHeader('content-type', 'application/json')
  res.end(
    JSON.stringify({
      status: hasKey ? 'ok' : 'missing-key',
      provider: 'gemini',
      model,
      hasGeminiKey: hasKey,
    }),
  )
}
