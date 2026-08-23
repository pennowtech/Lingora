import { describe, expect, it, vi } from 'vitest'
import { GoogleTranslateProvider } from './google-translate'

/** Fetch stub replaying the given bodies (or errors) in sequence. */
function fetchReturning(
  ...results: ({ status?: number; payload?: unknown } | Error)[]
): typeof fetch & { calls: string[] } {
  let call = 0
  const calls: string[] = []
  const fn = vi.fn((url: unknown) => {
    calls.push(String(url))
    const result = results[Math.min(call++, results.length - 1)]!
    if (result instanceof Error) return Promise.reject(result)
    return Promise.resolve(
      new Response(JSON.stringify(result.payload ?? null), { status: result.status ?? 200 }),
    )
  }) as unknown as typeof fetch & { calls: string[] }
  ;(fn as { calls: string[] }).calls = calls
  return fn
}

// The shape translate.google.com actually returns for de→en 'Haus'.
const HAUS_RESPONSE = [[['house', 'Haus', null, null, 1]], null, 'de']

describe('GoogleTranslateProvider.translate', () => {
  it('requests the free endpoint with the right parameters', async () => {
    const fetchFn = fetchReturning({ payload: HAUS_RESPONSE })
    const provider = new GoogleTranslateProvider({ fetchFn })

    const result = await provider.translate('Haus', 'de', 'en')

    expect(result.data).toBe('house')
    expect(result.usage.tokensUsed).toBe(0) // no tokens on this endpoint
    expect(result.usage.latencyMs).toBeGreaterThanOrEqual(0)

    const url = new URL(fetchFn.calls[0]!)
    expect(url.origin).toBe('https://translate.googleapis.com')
    expect(url.pathname).toBe('/translate_a/single')
    expect(url.searchParams.get('client')).toBe('gtx')
    expect(url.searchParams.get('sl')).toBe('de')
    expect(url.searchParams.get('tl')).toBe('en')
    expect(url.searchParams.get('q')).toBe('Haus')
    expect(url.searchParams.getAll('dt')).toEqual(['t', 'bd'])
  })

  it('concatenates multi-segment translations', async () => {
    const fetchFn = fetchReturning({
      payload: [
        [
          ['We are going out tonight. ', 'Wir gehen heute Abend aus. ', null, null, 1],
          ['Are you coming along?', 'Kommst du mit?', null, null, 1],
        ],
        null,
        'de',
      ],
    })
    const provider = new GoogleTranslateProvider({ fetchFn })

    const result = await provider.translate('Wir gehen heute Abend aus. Kommst du mit?', 'de', 'en')
    expect(result.data).toBe('We are going out tonight. Are you coming along?')
  })

  it('rejects an empty or unexpected response shape as non-retryable', async () => {
    const fetchFn = fetchReturning({ payload: { totally: 'different' } })
    const provider = new GoogleTranslateProvider({ fetchFn })

    await expect(provider.translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
    })
  })

  it('429 → retryable AIProviderError with the status', async () => {
    const fetchFn = fetchReturning({ status: 429 })
    const provider = new GoogleTranslateProvider({ fetchFn })

    await expect(provider.translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: true,
      status: 429,
    })
  })

  it('network failure → retryable AIProviderError', async () => {
    const fetchFn = fetchReturning(new TypeError('fetch failed'))
    const provider = new GoogleTranslateProvider({ fetchFn })

    await expect(provider.translate('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: true,
    })
  })
})

// The shape translate.googleapis.com returns for en→de 'foundation' with dt=t&dt=bd.
const FOUNDATION_RESPONSE = [
  [['Stiftung', 'foundation', null, null, 10]],
  [
    [
      'noun',
      ['Stiftung', 'Grundlage', 'Gründung', 'Fundament', 'Basis', 'Grund', 'Begründung', 'Grundstock', 'Sockel'],
      [],
      'foundation',
      1,
    ],
  ],
  'en',
]

describe('GoogleTranslateProvider.translateAlternatives', () => {
  it('flattens the bilingual-dictionary section into a deduped, capped list', async () => {
    const fetchFn = fetchReturning({ payload: FOUNDATION_RESPONSE })
    const provider = new GoogleTranslateProvider({ fetchFn })

    const result = await provider.translateAlternatives('foundation', 'en', 'de')

    expect(result.data).toEqual([
      'Stiftung',
      'Grundlage',
      'Gründung',
      'Fundament',
      'Basis',
      'Grund',
      'Begründung',
      'Grundstock',
    ])
    expect(result.data.length).toBeLessThanOrEqual(8)
  })

  it('rejects when the response carries no dictionary section', async () => {
    const fetchFn = fetchReturning({ payload: [[['house', 'Haus', null, null, 1]], null, 'de'] })
    const provider = new GoogleTranslateProvider({ fetchFn })

    await expect(provider.translateAlternatives('Haus', 'de', 'en')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
    })
  })
})

describe('GoogleTranslateProvider request dedupe', () => {
  // A search screen calls translate() and translateAlternatives() back-to-back for the same
  // (text, source, target) — both read different parts of the identical dt=t+dt=bd response, so
  // this free, keyless, aggressively-rate-limited endpoint (see the class doc comment) shouldn't
  // be hit twice for one search.
  it('shares one in-flight fetch between concurrent translate() and translateAlternatives() calls', async () => {
    const fetchFn = fetchReturning({ payload: FOUNDATION_RESPONSE })
    const provider = new GoogleTranslateProvider({ fetchFn })

    const [translated, alternatives] = await Promise.all([
      provider.translate('foundation', 'en', 'de'),
      provider.translateAlternatives('foundation', 'en', 'de'),
    ])

    expect(translated.data).toBeTruthy()
    expect(alternatives.data.length).toBeGreaterThan(0)
    expect(fetchFn.calls.length).toBe(1)
  })

  it('reuses a just-completed response for a repeat call instead of fetching again', async () => {
    const fetchFn = fetchReturning({ payload: FOUNDATION_RESPONSE })
    const provider = new GoogleTranslateProvider({ fetchFn })

    await provider.translate('foundation', 'en', 'de')
    await provider.translateAlternatives('foundation', 'en', 'de')

    expect(fetchFn.calls.length).toBe(1)
  })

  it('still fetches separately for a different word', async () => {
    const fetchFn = fetchReturning({ payload: FOUNDATION_RESPONSE }, { payload: HAUS_RESPONSE })
    const provider = new GoogleTranslateProvider({ fetchFn })

    await provider.translate('foundation', 'en', 'de')
    await provider.translate('Haus', 'de', 'en')

    expect(fetchFn.calls.length).toBe(2)
  })
})

describe('GoogleTranslateProvider.detectLanguage', () => {
  it('reads the detected language and asks the endpoint to auto-detect', async () => {
    const fetchFn = fetchReturning({ payload: HAUS_RESPONSE })
    const provider = new GoogleTranslateProvider({ fetchFn })

    const result = await provider.detectLanguage('Haus')
    expect(result.data).toBe('de')

    const url = new URL(fetchFn.calls[0]!)
    expect(url.searchParams.get('sl')).toBe('auto')
  })

  it('rejects a language outside the supported set', async () => {
    const fetchFn = fetchReturning({ payload: [[['bonjour', 'buongiorno', null, null, 1]], null, 'it'] })
    const provider = new GoogleTranslateProvider({ fetchFn })

    await expect(provider.detectLanguage('buongiorno')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
    })
  })
})

describe('GoogleTranslateProvider as the pipeline dictionary slot', () => {
  it('satisfies DictionaryProvider structurally', async () => {
    const fetchFn = fetchReturning({ payload: HAUS_RESPONSE })
    const provider = new GoogleTranslateProvider({ fetchFn })

    // What lookupOrGenerate does with the slot: baseline-translation hint.
    const hint = await provider.translate('Haus', 'de', 'en')
    expect(hint.data).toBe('house')
    expect(provider.name).toBe('google-translate')
  })
})
