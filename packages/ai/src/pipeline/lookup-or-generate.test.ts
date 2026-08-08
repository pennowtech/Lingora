import type { LanguageCode, WordGenerationPayload } from '@lingora/types'
import { migrate } from '@lingora/database'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AIProviderError } from '../errors'
import { salvagePartial } from '../schemas/generation'
import { validPayload } from '../testing/fixtures'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'
import type {
  AIProvider,
  AIResult,
  DictionaryProvider,
  WordPackageResult,
} from '../providers/types'
import { createAIPipeline } from './create'

const DECK_ID = 'deck-test'

/** Mock AIProvider whose generateWordPackage plays back scripted results. */
function mockProvider(results: (WordPackageResult | Error)[]): AIProvider & {
  packageCalls: number
} {
  let call = 0
  const provider = {
    name: 'openai' as const,
    model: 'gpt-test',
    packageCalls: 0,
    generateWordPackage(): Promise<WordPackageResult> {
      provider.packageCalls += 1
      const result = results[Math.min(call++, results.length - 1)]!
      if (result instanceof Error) return Promise.reject(result)
      return Promise.resolve(result)
    },
    generateClusters: vi.fn(),
    generateMeaning: vi.fn(),
    generateExamples: vi.fn(),
    generateSynonyms: vi.fn(),
    generatePhrases: vi.fn(),
    generateCloze: vi.fn(),
    translate: vi.fn(),
  }
  return provider as unknown as AIProvider & { packageCalls: number }
}

function complete(payload: WordGenerationPayload = validPayload()): WordPackageResult {
  return { kind: 'complete', data: payload, usage: { tokensUsed: 100, latencyMs: 500 } }
}

describe('lookupOrGenerate', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    await db.execute(`INSERT INTO decks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`, [
      DECK_ID,
      'Test deck',
      Date.now(),
      Date.now(),
    ])
  })

  afterEach(() => {
    db.close()
  })

  it('short-circuits on an existing lemma without touching the provider', async () => {
    const ai = mockProvider([complete()])
    const pipeline = await createAIPipeline({ db, ai })

    // First lookup generates and persists…
    await pipeline.lookupOrGenerate('ausgehen', { cefrLevel: 'B1', deckId: DECK_ID })
    // …an inflected form of the now-known word must not generate again.
    const outcome = await pipeline.lookupOrGenerate('ging aus', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
    })

    expect(outcome.kind).toBe('existing')
    if (outcome.kind === 'existing') expect(outcome.lemma.form).toBe('ausgehen')
    expect(ai.packageCalls).toBe(1)
  })

  it('regenerates under a different native language instead of returning the stale existing card', async () => {
    const ai = mockProvider([complete(), complete()])
    const pipeline = await createAIPipeline({ db, ai })

    // First lookup: native=en (the default).
    const first = await pipeline.lookupOrGenerate('ausgehen', { cefrLevel: 'B1', deckId: DECK_ID })
    expect(first.kind).toBe('generated')

    // Same word, different native language: must regenerate, not short-circuit to 'existing'.
    const second = await pipeline.lookupOrGenerate('ausgehen', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
      nativeLanguage: 'hi',
    })
    expect(second.kind).toBe('generated')
    if (first.kind === 'generated' && second.kind === 'generated') {
      expect(second.cardId).not.toBe(first.cardId)
      expect(second.lemma.id).toBe(first.lemma.id) // same lemma, reused
    }
    expect(ai.packageCalls).toBe(2)

    // The two cards are both real, distinct rows scoped to their own native language.
    const cards = await db.query<{ id: string; native_language: string }>(
      `SELECT id, native_language FROM cards WHERE lemma_id = (SELECT id FROM lemmas WHERE form = 'ausgehen')`,
    )
    expect(cards).toHaveLength(2)
    expect(cards.map((c) => c.native_language).sort()).toEqual(['en', 'hi'])

    // Re-querying native=en again still resolves to the original card — no third generation.
    const third = await pipeline.lookupOrGenerate('ausgehen', { cefrLevel: 'B1', deckId: DECK_ID })
    expect(third.kind).toBe('existing')
    expect(ai.packageCalls).toBe(2)
  })

  it('generates, persists and reports usage on the happy path', async () => {
    const ai = mockProvider([complete()])
    const pipeline = await createAIPipeline({ db, ai })

    const outcome = await pipeline.lookupOrGenerate('ausgehen', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
    })

    expect(outcome.kind).toBe('generated')
    if (outcome.kind === 'generated') {
      expect(outcome.lemma.form).toBe('ausgehen')
      expect(outcome.fromCache).toBe(false)

      const meta = await db.querySingle<{ tokens_used: number; provider: string }>(
        `SELECT tokens_used, provider FROM generation_metadata WHERE card_id = ?`,
        [outcome.cardId],
      )
      expect(meta?.tokens_used).toBe(100)
      expect(meta?.provider).toBe('openai')
    }
  })

  it('serves the second generation of the same word from cache', async () => {
    const ai = mockProvider([complete()])
    const pipeline = await createAIPipeline({ db, ai })

    const first = await pipeline.lookupOrGenerate('ausgehen', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
    })
    expect(first.kind).toBe('generated')

    // Delete the word (user removes the card+lemma) — the cache survives.
    await db.execute(`DELETE FROM lemmas`)
    await db.execute(`DELETE FROM cards`)

    const second = await pipeline.lookupOrGenerate('ausgehen', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
    })

    expect(second.kind).toBe('generated')
    if (second.kind === 'generated') expect(second.fromCache).toBe(true)
    expect(ai.packageCalls).toBe(1) // no second API call
  })

  it('passes the dictionary translation as a hint and degrades on failure', async () => {
    const hints: (string | undefined)[] = []
    const ai = {
      ...mockProvider([]),
      packageCalls: 0,
      generateWordPackage(
        _word: string,
        _ctx: unknown,
        hint?: { baselineTranslation: string },
      ): Promise<WordPackageResult> {
        hints.push(hint?.baselineTranslation)
        return Promise.resolve(complete())
      },
    } as unknown as AIProvider

    const workingDictionary: DictionaryProvider = {
      name: 'test-dict',
      translate: (): Promise<AIResult<string>> =>
        Promise.resolve({ data: 'to go out', usage: { tokensUsed: 5, latencyMs: 50 } }),
      detectLanguage: (): Promise<AIResult<LanguageCode>> =>
        Promise.resolve({ data: 'de', usage: { tokensUsed: 5, latencyMs: 50 } }),
    }
    const failingDictionary: DictionaryProvider = {
      name: 'test-dict',
      translate: () => Promise.reject(new AIProviderError('dictionary down', 'test-dict', true)),
      detectLanguage: () =>
        Promise.reject(new AIProviderError('dictionary down', 'test-dict', true)),
    }

    const withDict = await createAIPipeline({ db, ai, dictionary: workingDictionary })
    await withDict.lookupOrGenerate('ausgehen', { cefrLevel: 'B1', deckId: DECK_ID })
    expect(hints[0]).toBe('to go out')

    await db.execute(`DELETE FROM lemmas`)
    await db.execute(`DELETE FROM ai_cache`)

    const withBrokenDict = await createAIPipeline({ db, ai, dictionary: failingDictionary })
    await withBrokenDict.lookupOrGenerate('ausgehen', { cefrLevel: 'B1', deckId: DECK_ID })
    expect(hints[1]).toBeUndefined() // degraded to no hint, generation still ran
  })

  it('returns a partial outcome without persisting anything', async () => {
    const broken = { ...(validPayload() as unknown as Record<string, unknown>), lemma: null }
    const ai = mockProvider([
      {
        kind: 'partial',
        partial: salvagePartial(broken),
        issues: ['lemma: expected object'],
        usage: { tokensUsed: 80, latencyMs: 400 },
      },
    ])
    const pipeline = await createAIPipeline({ db, ai })

    const outcome = await pipeline.lookupOrGenerate('ausgehen', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
    })

    expect(outcome.kind).toBe('partial')
    if (outcome.kind === 'partial') {
      expect(outcome.partial.clusters).toHaveLength(1)
      expect(outcome.issues).toContain('lemma: expected object')
    }

    const lemmas = await db.query(`SELECT id FROM lemmas`)
    const cacheRows = await db.query(`SELECT cache_key FROM ai_cache`)
    expect(lemmas).toHaveLength(0) // never persisted
    expect(cacheRows).toHaveLength(0) // never cached
  })

  it('propagates provider errors', async () => {
    const ai = mockProvider([new AIProviderError('rate limited', 'openai', true, 429)])
    const pipeline = await createAIPipeline({ db, ai })

    await expect(
      pipeline.lookupOrGenerate('ausgehen', { cefrLevel: 'B1', deckId: DECK_ID }),
    ).rejects.toMatchObject({ code: 'provider', status: 429 })
  })
})

describe('lookupOrGenerate with addToDeck: false', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    await db.execute(`INSERT INTO decks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`, [
      DECK_ID,
      'Test deck',
      Date.now(),
      Date.now(),
    ])
  })

  afterEach(() => {
    db.close()
  })

  it('fully generates and persists the word, but skips the deck_cards membership row', async () => {
    const ai = mockProvider([complete()])
    const pipeline = await createAIPipeline({ db, ai })

    const outcome = await pipeline.lookupOrGenerate('ausgehen', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
      addToDeck: false,
    })

    expect(outcome.kind).toBe('generated')
    if (outcome.kind !== 'generated') return

    // The card exists, with everything generated, and still carries the deckId as its "home"...
    const card = await db.querySingle<{ deck_id: string }>(`SELECT deck_id FROM cards WHERE id = ?`, [
      outcome.cardId,
    ])
    expect(card?.deck_id).toBe(DECK_ID)
    const meanings = await db.query(`SELECT id FROM meanings`)
    expect(meanings.length).toBeGreaterThan(0)

    // ...but it's not actually a member of that deck (or any deck) yet — no due count, no
    // showing up in the deck's card list — until a later explicit addCardToDeck.
    const membership = await db.query(`SELECT id FROM deck_cards WHERE card_id = ?`, [outcome.cardId])
    expect(membership).toHaveLength(0)
  })
})
