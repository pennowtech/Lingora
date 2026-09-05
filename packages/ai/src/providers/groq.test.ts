import { describe, expect, it, vi } from 'vitest'
import { AIProviderError, AIResponseParseError } from '../errors'
import { validPayload } from '../testing/fixtures'
import { GroqProvider, compactSchema } from './groq'
import { toOpenAIJsonSchema } from './json-schema'
import { wordPackageOutlineSchema } from '../schemas/generation'

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

const ctx = { cefrLevel: 'B1', language: 'de', nativeLanguage: 'en' } as const

function provider(fetchFn: typeof fetch, opts?: { useJsonSchema?: boolean; maxTokens?: number }): GroqProvider {
  return new GroqProvider({ apiKey: 'gsk-test', fetchFn, ...opts })
}

describe('compactSchema helper', () => {
  it('substantially shortens JSON schema representation', () => {
    const fullSchema = toOpenAIJsonSchema(wordPackageOutlineSchema)
    const fullJson = JSON.stringify(fullSchema)
    const compact = compactSchema(fullSchema)

    expect(compact.length).toBeLessThan(fullJson.length / 2)
    expect(compact).toContain('lemma:')
    expect(compact).toContain('inflections: [string]')
    expect(compact).toContain('clusters:')
    expect(compact).toContain('"A1" | "A2" | "B1" | "B2" | "C1" | "C2"')
  })
})

describe('GroqProvider request shape', () => {
  it('sends default max_tokens and json_object response_format with compact schema in prompt', async () => {
    const fetchFn = fetchReturning({
      content: JSON.stringify({ translation: 'to go out' }),
    })
    await provider(fetchFn).translate('ausgehen', 'de', 'en')

    expect(fetchFn.calls).toHaveLength(1)
    const { url, body } = fetchFn.calls[0]!
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect(body['model']).toBe('openai/gpt-oss-20b')
    expect(body['max_tokens']).toBe(8192)
    expect(body['response_format']).toEqual({ type: 'json_object' })

    const messages = body['messages'] as { role: string; content: string }[]
    expect(messages[0]!.content).toContain('Respond with valid JSON only, matching this structure:')
    expect(messages[0]!.content).toContain('{ translation: string }')
  })

  it('supports strict json_schema mode when useJsonSchema is true', async () => {
    const fetchFn = fetchReturning({
      content: JSON.stringify({ translation: 'to go out' }),
    })
    await provider(fetchFn, { useJsonSchema: true, maxTokens: 4096 }).translate('ausgehen', 'de', 'en')

    expect(fetchFn.calls).toHaveLength(1)
    const { body } = fetchFn.calls[0]!
    expect(body['max_tokens']).toBe(4096)
    expect(body['response_format']).toEqual({
      type: 'json_schema',
      json_schema: {
        name: 'translation',
        schema: expect.objectContaining({ type: 'object' }),
        strict: true,
      },
    })

    const messages = body['messages'] as { role: string; content: string }[]
    expect(messages[0]!.content).not.toContain('Respond with valid JSON only, matching this structure:')
  })
})

describe('GroqProvider generateWordPackage two-step pipeline', () => {
  it('makes exactly two fetch calls and merges results into a complete word package', async () => {
    const payload = validPayload()
    const outline = {
      lemma: payload.lemma,
      inflections: payload.inflections,
      clusters: payload.clusters.map((c) => ({
        label: c.label,
        description: c.description,
        cefrLevel: c.cefrLevel,
      })),
    }
    const batchEnrichment = {
      clusters: payload.clusters.map((c) => ({
        meanings: c.meanings,
        examples: c.examples,
        synonyms: c.synonyms,
      })),
    }

    const fetchFn = fetchReturning(
      { content: JSON.stringify(outline) },
      { content: JSON.stringify(batchEnrichment) },
    )

    const result = await provider(fetchFn).generateWordPackage('ausgehen', ctx)

    expect(fetchFn.calls).toHaveLength(2)
    expect(result.kind).toBe('complete')
    if (result.kind === 'complete') {
      expect(result.data.lemma.form).toBe('ausgehen')
      expect(result.data.clusters).toHaveLength(payload.clusters.length)
      expect(result.data.clusters[0]!.meanings).toEqual(payload.clusters[0]!.meanings)
      expect(result.data.clusters[0]!.examples).toEqual(payload.clusters[0]!.examples)
      expect(result.data.clusters[0]!.synonyms).toEqual(payload.clusters[0]!.synonyms)
      expect(result.usage.tokensUsed).toBe(84) // 42 + 42
    }
  })

  it('salvages partial result when Step 2 batch enrichment fails', async () => {
    const payload = validPayload()
    const outline = {
      lemma: payload.lemma,
      inflections: payload.inflections,
      clusters: payload.clusters.map((c) => ({
        label: c.label,
        description: c.description,
        cefrLevel: c.cefrLevel,
      })),
    }

    // Call 1 succeeds (outline)
    // Call 2 fails twice (batch enrichment fails validation)
    const fetchFn = fetchReturning(
      { content: JSON.stringify(outline) },
      { content: '{"clusters": []}' },
      { content: '{"clusters": []}' },
    )

    const result = await provider(fetchFn).generateWordPackage('ausgehen', ctx)

    expect(result.kind).toBe('partial')
    if (result.kind === 'partial') {
      expect(result.partial.lemma?.form).toBe('ausgehen')
      expect(result.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('GroqProvider error handling', () => {
  it('retries when Groq returns json_validate_failed', async () => {
    const fetchFn = fetchReturning(
      {
        status: 400,
        raw: { error: { code: 'json_validate_failed', message: 'Failed to generate JSON' } },
      },
      {
        content: JSON.stringify({ translation: 'to go out' }),
      },
    )

    const result = await provider(fetchFn).translate('ausgehen', 'de', 'en')
    expect(result.data).toBe('to go out')
    expect(fetchFn.calls).toHaveLength(2)
  })

  it('throws AIProviderError on non-recoverable error', async () => {
    const fetchFn = fetchReturning({ status: 500, raw: { error: { message: 'Server down' } } })
    await expect(provider(fetchFn).translate('ausgehen', 'de', 'en')).rejects.toThrow(AIProviderError)
  })
})
