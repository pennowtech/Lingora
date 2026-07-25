import { describe, expect, it, vi } from 'vitest'
import { AIProviderError, AIResponseParseError } from '../errors'
import { validPayload } from '../testing/fixtures'
import { OpenAIProvider } from './openai'

/** Build a fetch stub returning the given bodies (or throwing) in sequence. */
function fetchReturning(
  ...results: ({ status?: number; content?: string; raw?: unknown } | Error)[]
): typeof fetch & { calls: { url: string; body: Record<string, unknown> }[] } {
  let call = 0
  const calls: { url: string; body: Record<string, unknown> }[] = []
  const fn = vi.fn((url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, unknown> })
    const result = results[Math.min(call++, results.length - 1)]!
    if (result instanceof Error) return Promise.reject(result)
    const status = result.status ?? 200
    const payload =
      result.raw !== undefined
        ? result.raw
        : { choices: [{ message: { content: result.content ?? '' } }], usage: { total_tokens: 42 } }
    return Promise.resolve(new Response(JSON.stringify(payload), { status }))
  }) as unknown as typeof fetch & { calls: typeof calls }
  ;(fn as { calls: typeof calls }).calls = calls
  return fn
}

const ctx = { cefrLevel: 'B1', language: 'de' } as const

function provider(fetchFn: typeof fetch): OpenAIProvider {
  return new OpenAIProvider({ apiKey: 'sk-test', fetchFn })
}

describe('OpenAIProvider request shape', () => {
  it('sends a strict json_schema request with the word and CEFR level in the prompt', async () => {
    const fetchFn = fetchReturning({ content: JSON.stringify(validPayload()) })
    await provider(fetchFn).generateWordPackage('ausgehen', ctx)

    const { url, body } = fetchFn.calls[0]!
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect(body['model']).toBe('gpt-4.1-mini')

    const responseFormat = body['response_format'] as {
      type: string
      json_schema: { strict: boolean; schema: { additionalProperties?: boolean } }
    }
    expect(responseFormat.type).toBe('json_schema')
    expect(responseFormat.json_schema.strict).toBe(true)
    expect(responseFormat.json_schema.schema.additionalProperties).toBe(false)
    // unsupported keywords must be stripped for strict mode
    expect(JSON.stringify(responseFormat.json_schema.schema)).not.toContain('minLength')

    const messages = body['messages'] as { role: string; content: string }[]
    expect(messages[0]!.content).toContain('ausgehen')
    expect(messages[0]!.content).toContain('B1')
  })

  it('pins cluster-scoped calls to the cluster context', async () => {
    const fetchFn = fetchReturning({
      content: JSON.stringify({ examples: validPayload().clusters[0]!.examples }),
    })
    await provider(fetchFn).generateExamples(
      'ausgehen',
      { label: 'social', description: 'going out socially' },
      ctx,
    )

    const messages = fetchFn.calls[0]!.body['messages'] as { content: string }[]
    expect(messages[0]!.content).toContain('social')
    expect(messages[0]!.content).toContain('going out socially')
  })
})

describe('OpenAIProvider usage capture', () => {
  it('reports token usage and a positive latency', async () => {
    const fetchFn = fetchReturning({ content: JSON.stringify(validPayload()) })
    const result = await provider(fetchFn).generateWordPackage('ausgehen', ctx)

    expect(result.kind).toBe('complete')
    expect(result.usage.tokensUsed).toBe(42)
    expect(result.usage.latencyMs).toBeGreaterThanOrEqual(0)
  })
})

describe('OpenAIProvider error handling', () => {
  it('429 → retryable AIProviderError with the status', async () => {
    const fetchFn = fetchReturning({ status: 429, raw: { error: { message: 'rate limited' } } })
    try {
      await provider(fetchFn).translate('Haus', 'de', 'en')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(AIProviderError)
      const providerError = error as AIProviderError
      expect(providerError.retryable).toBe(true)
      expect(providerError.status).toBe(429)
    }
  })

  it('400 → non-retryable AIProviderError', async () => {
    const fetchFn = fetchReturning({ status: 400, raw: { error: { message: 'bad request' } } })
    await expect(provider(fetchFn).translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
    })
  })

  it('network failure → retryable AIProviderError', async () => {
    const fetchFn = fetchReturning(new TypeError('fetch failed'))
    await expect(provider(fetchFn).translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: true,
    })
  })

  it('model refusal → non-retryable AIProviderError', async () => {
    const fetchFn = fetchReturning({
      raw: { choices: [{ message: { content: null, refusal: 'I cannot do that' } }] },
    })
    await expect(provider(fetchFn).translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
    })
  })
})

describe('OpenAIProvider repair and retry', () => {
  it('repairs a fenced, trailing-comma response without a retry call', async () => {
    const fenced = '```json\n' + JSON.stringify(validPayload()).replace(/}$/, ',}') + '\n```'
    const fetchFn = fetchReturning({ content: fenced })
    const result = await provider(fetchFn).generateWordPackage('ausgehen', ctx)

    expect(result.kind).toBe('complete')
    expect(fetchFn.calls).toHaveLength(1)
  })

  it('retries once with the failed response in the conversation', async () => {
    const invalid = { ...validPayload(), clusters: [] } // fails min(1)
    const fetchFn = fetchReturning(
      { content: JSON.stringify(invalid) },
      { content: JSON.stringify(validPayload()) },
    )
    const result = await provider(fetchFn).generateWordPackage('ausgehen', ctx)

    expect(result.kind).toBe('complete')
    expect(fetchFn.calls).toHaveLength(2)

    const retryMessages = fetchFn.calls[1]!.body['messages'] as { role: string; content: string }[]
    expect(retryMessages).toHaveLength(3)
    expect(retryMessages[1]!.role).toBe('assistant')
    expect(retryMessages[2]!.content).toContain('failed validation')
    expect(retryMessages[2]!.content).toContain('clusters')
  })

  it('falls back to a partial when the retry also fails validation', async () => {
    const invalid = { ...validPayload(), lemma: { form: 'ausgehen' } } // broken lemma
    const fetchFn = fetchReturning({ content: JSON.stringify(invalid) })
    const result = await provider(fetchFn).generateWordPackage('ausgehen', ctx)

    expect(result.kind).toBe('partial')
    if (result.kind === 'partial') {
      expect(result.partial.lemma).toBeNull()
      expect(result.partial.clusters).toHaveLength(1) // clusters were fine — salvaged
      expect(result.issues.length).toBeGreaterThan(0)
    }
  })

  it('throws AIResponseParseError when both responses are hopeless', async () => {
    const fetchFn = fetchReturning({ content: 'I am sorry, I cannot produce JSON today.' })
    await expect(provider(fetchFn).generateWordPackage('ausgehen', ctx)).rejects.toBeInstanceOf(
      AIResponseParseError,
    )
  })
})
