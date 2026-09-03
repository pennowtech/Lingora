import type { LanguageCode, WordGenerationPayload } from '@lingora/types'
import { migrate, persistTranslationAsCard } from '@lingora/database'
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

  it('reconciles a not-yet-seen inflection the AI still normalizes to an existing lemma, instead of throwing', async () => {
    const ai = mockProvider([complete(), complete()])
    const pipeline = await createAIPipeline({ db, ai })

    await pipeline.lookupOrGenerate('ausgehen', { cefrLevel: 'B1', deckId: DECK_ID })

    // "ausgehend" was never recorded as an inflection of "ausgehen" (validPayload's own list is
    // ['geht aus', 'ging aus', 'ausgegangen']), so the pre-generation morphology check misses it
    // and the provider actually gets called - but the mocked reply still normalizes back to the
    // same lemma already persisted above. Without reconciling against that, persistWordGeneration's
    // "lemma already exists" guard would throw here instead of resolving to 'existing'.
    const outcome = await pipeline.lookupOrGenerate('ausgehend', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
    })

    expect(ai.packageCalls).toBe(2)
    expect(outcome.kind).toBe('existing')
    if (outcome.kind === 'existing') expect(outcome.lemma.form).toBe('ausgehen')
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

  it('upgrades an existing dictionary card in place instead of creating a second, orphaned one', async () => {
    // The exact shape search.tsx's "Generate with AI" button creates before navigating: a minimal,
    // one-cluster dictionary card via persistTranslationAsCard — then autoEnrichMutation calls
    // lookupOrGenerate with forceGenerate to fill it in with real AI content in the background.
    const { cardId: dictionaryCardId } = await persistTranslationAsCard(
      db,
      { form: 'ausgehen', language: 'de', translation: 'to go out', provider: 'google' },
      DECK_ID,
      'en',
    )

    const ai = mockProvider([complete()])
    const pipeline = await createAIPipeline({ db, ai })
    const outcome = await pipeline.lookupOrGenerate('ausgehen', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
      forceGenerate: true,
    })

    expect(outcome.kind).toBe('generated')
    if (outcome.kind !== 'generated') return

    // Same card, upgraded — not a second card that loadWord()'s unordered `.find()` would never
    // surface, leaving the dictionary-only content stuck on screen forever (the reported bug).
    expect(outcome.cardId).toBe(dictionaryCardId)
    const cards = await db.query<{ id: string }>(
      `SELECT id FROM cards WHERE lemma_id = (SELECT id FROM lemmas WHERE form = 'ausgehen')`,
    )
    expect(cards).toHaveLength(1)

    // The card now reports as a real AI card (source updated, not stuck on 'google').
    const card = await db.querySingle<{ source: string }>(`SELECT source FROM cards WHERE id = ?`, [
      dictionaryCardId,
    ])
    expect(card?.source).toBe('openai')

    // Real generated content replaced the one-meaning dictionary stub, and deck membership (added
    // by persistTranslationAsCard) survived the upgrade untouched.
    const meanings = await db.query(`SELECT id FROM meanings WHERE card_id = ?`, [dictionaryCardId])
    expect(meanings.length).toBeGreaterThan(0)
    const examples = await db.query(`SELECT id FROM examples WHERE card_id = ?`, [dictionaryCardId])
    expect(examples.length).toBeGreaterThan(0)
    const membership = await db.query(`SELECT id FROM deck_cards WHERE card_id = ?`, [dictionaryCardId])
    expect(membership).toHaveLength(1)
  })

  it('upgrades in place even when the AI corrects the dictionary card\'s casing', async () => {
    // A dictionary card is created from whatever casing the user typed/searched — often lowercase
    // ("vorteil") — while the AI always returns the grammatically correct capitalization for
    // German nouns ("Vorteil"). That's still the same word, not a different one: regression test
    // for a real bug found via a live OpenAI generation, where the upgrade path's exact-match
    // guard rejected this as "a different word" and threw instead of upgrading.
    const { cardId: dictionaryCardId } = await persistTranslationAsCard(
      db,
      { form: 'vorteil', language: 'de', translation: 'advantage', provider: 'google' },
      DECK_ID,
      'en',
    )

    const aiPayload: WordGenerationPayload = { ...validPayload(), lemma: { ...validPayload().lemma, form: 'Vorteil' } }
    const ai = mockProvider([complete(aiPayload)])
    const pipeline = await createAIPipeline({ db, ai })
    const outcome = await pipeline.lookupOrGenerate('vorteil', {
      cefrLevel: 'B1',
      deckId: DECK_ID,
      forceGenerate: true,
    })

    expect(outcome.kind).toBe('generated')
    if (outcome.kind !== 'generated') return
    expect(outcome.cardId).toBe(dictionaryCardId)
    expect(outcome.lemma.form).toBe('Vorteil') // the corrected casing, not the stale 'vorteil'

    const lemma = await db.querySingle<{ form: string }>(`SELECT form FROM lemmas WHERE id = ?`, [
      outcome.lemma.id,
    ])
    expect(lemma?.form).toBe('Vorteil')
    const cards = await db.query<{ id: string }>(`SELECT id FROM cards WHERE lemma_id = ?`, [outcome.lemma.id])
    expect(cards).toHaveLength(1) // no second card left behind under the old casing
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
