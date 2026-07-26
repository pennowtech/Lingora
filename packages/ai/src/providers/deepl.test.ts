import { describe, expect, it, vi } from 'vitest'
import { DeepLProvider } from './deepl'

/** Fetch stub replaying the given bodies (or errors) in sequence. */
function fetchReturning(
  ...results: ({ status?: number; payload?: unknown } | Error)[]
): typeof fetch & { calls: { url: string; body: Record<string, unknown> }[] } {
  let call = 0
  const calls: { url: string; body: Record<string, unknown> }[] = []
  const fn = vi.fn((url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, unknown> })
    const result = results[Math.min(call++, results.length - 1)]!
    if (result instanceof Error) return Promise.reject(result)
    return Promise.resolve(
      new Response(JSON.stringify(result.payload ?? null), { status: result.status ?? 200 }),
    )
  }) as unknown as typeof fetch & { calls: typeof calls }
  ;(fn as { calls: typeof calls }).calls = calls
  return fn
}

describe('DeepLProvider host selection', () => {
  it('uses the free-tier host for a key ending in :fx', async () => {
    const fetchFn = fetchReturning({ payload: { translations: [{ text: 'house' }] } })
    const provider = new DeepLProvider({ apiKey: 'abc123:fx', fetchFn })
    await provider.translate('Haus', 'de', 'en')
    expect(fetchFn.calls[0]!.url).toContain('api-free.deepl.com')
  })

  it('uses the pro host for a key without the :fx suffix', async () => {
    const fetchFn = fetchReturning({ payload: { translations: [{ text: 'house' }] } })
    const provider = new DeepLProvider({ apiKey: 'abc123', fetchFn })
    await provider.translate('Haus', 'de', 'en')
    expect(fetchFn.calls[0]!.url).toContain('api.deepl.com')
  })
})

describe('DeepLProvider.translate', () => {
  it('sends the mapped language codes and auth header', async () => {
    const fetchFn = fetchReturning({ payload: { translations: [{ text: 'house' }] } })
    const provider = new DeepLProvider({ apiKey: 'sk-test:fx', fetchFn })

    const result = await provider.translate('Haus', 'de', 'en')

    expect(result.data).toBe('house')
    expect(result.usage.tokensUsed).toBe(0)
    const { body } = fetchFn.calls[0]!
    expect(body['text']).toEqual(['Haus'])
    expect(body['source_lang']).toBe('DE')
    expect(body['target_lang']).toBe('EN-US') // English needs a region on the target side
  })

  it('rejects an empty translations array as non-retryable', async () => {
    const fetchFn = fetchReturning({ payload: { translations: [] } })
    const provider = new DeepLProvider({ apiKey: 'sk-test', fetchFn })

    await expect(provider.translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
    })
  })

  it('429 → retryable AIProviderError with the status', async () => {
    const fetchFn = fetchReturning({ status: 429, payload: { message: 'rate limited' } })
    const provider = new DeepLProvider({ apiKey: 'sk-test', fetchFn })

    await expect(provider.translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: true,
      status: 429,
    })
  })

  it('403 (bad key) → non-retryable AIProviderError', async () => {
    const fetchFn = fetchReturning({ status: 403, payload: { message: 'Authorization failed' } })
    const provider = new DeepLProvider({ apiKey: 'bad-key', fetchFn })

    await expect(provider.translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
      status: 403,
    })
  })

  it('network failure → retryable AIProviderError', async () => {
    const fetchFn = fetchReturning(new TypeError('fetch failed'))
    const provider = new DeepLProvider({ apiKey: 'sk-test', fetchFn })

    await expect(provider.translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: true,
    })
  })
})

describe('DeepLProvider.detectLanguage', () => {
  it('reads detected_source_language and maps it back to a LanguageCode', async () => {
    const fetchFn = fetchReturning({
      payload: { translations: [{ text: 'house', detected_source_language: 'DE' }] },
    })
    const provider = new DeepLProvider({ apiKey: 'sk-test', fetchFn })

    const result = await provider.detectLanguage('Haus')
    expect(result.data).toBe('de')

    const { body } = fetchFn.calls[0]!
    expect(body['source_lang']).toBeUndefined() // no source — let DeepL auto-detect
  })

  it('rejects a detected language outside the supported set', async () => {
    const fetchFn = fetchReturning({
      payload: { translations: [{ text: 'buongiorno', detected_source_language: 'IT' }] },
    })
    const provider = new DeepLProvider({ apiKey: 'sk-test', fetchFn })

    await expect(provider.detectLanguage('buongiorno')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
    })
  })
})

describe('DeepLProvider as the pipeline dictionary slot', () => {
  it('satisfies DictionaryProvider structurally', async () => {
    const fetchFn = fetchReturning({ payload: { translations: [{ text: 'house' }] } })
    const provider = new DeepLProvider({ apiKey: 'sk-test', fetchFn })

    const hint = await provider.translate('Haus', 'de', 'en')
    expect(hint.data).toBe('house')
    expect(provider.name).toBe('deepl')
  })
})
