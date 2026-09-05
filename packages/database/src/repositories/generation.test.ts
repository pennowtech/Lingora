import type { GenerationUsage, WordGenerationPayload } from '@lingora/types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../migrations'
import { createCardWithState } from './cards'
import { createCluster, createMeaning, getMeaningsForCard } from './clusters'
import { createDeck } from './decks'
import { createExample, getExamplesForCard } from './examples'
import { regenerateWordPackage } from './generation'
import { createLemma, getInflectionsForLemma, getLemmaById } from './lemmas'
import { getCardState, recordReview } from './reviews'
import { createSynonym, getSynonymsForCard } from './synonyms'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'

function initialState(cardId: string) {
  return {
    cardId,
    stability: 1,
    difficulty: 5,
    retrievability: 1,
    nextReviewAt: Date.now(),
    lapses: 0,
    state: 'new' as const,
    reps: 0,
    learningSteps: 0,
  }
}

describe('regenerateWordPackage', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it("upgrading one card in place never touches another card's meanings/examples/synonyms sharing the same lemma", async () => {
    const now = Date.now()
    const deckA = 'deck-a'
    const deckB = 'deck-b'
    await createDeck(db, { id: deckA, name: 'Deck A', createdAt: now, updatedAt: now })
    await createDeck(db, { id: deckB, name: 'Deck B', createdAt: now, updatedAt: now })

    await db.execute(
      `INSERT INTO prompt_versions (id, name, version, template, created_at, deprecated)
       VALUES ('v1', 'word_package', 1, 'test template', ?, 0)`,
      [now],
    )

    const lemmaId = crypto.randomUUID()
    await createLemma(db, {
      id: lemmaId,
      form: 'laufen',
      language: 'de',
      partOfSpeech: 'verb',
      createdAt: now,
      updatedAt: now,
    })

    // Two cards sharing the same lemma — the documented "a lemma is shared across native
    // languages, but its cards aren't" case (or a second sense card from createCardForSense).
    const cardAId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: cardAId, lemmaId, deckId: deckA, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'en', source: 'openai' },
      initialState(cardAId),
    )
    const cardBId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: cardBId, lemmaId, deckId: deckB, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'en' },
      initialState(cardBId),
    )

    // Card A's own pre-existing content — this is what must survive regenerating card B.
    const clusterAId = crypto.randomUUID()
    await createCluster(db, { id: clusterAId, lemmaId, label: 'movement', description: 'to run', orderIndex: 0 })
    const meaningAId = crypto.randomUUID()
    await createMeaning(db, {
      id: meaningAId,
      cardId: cardAId,
      clusterId: clusterAId,
      translation: 'to run',
      explanation: 'to move fast on foot',
      cefrLevel: 'A1',
      isPrimary: true,
      orderIndex: 0,
    })
    await createExample(db, {
      id: crypto.randomUUID(),
      cardId: cardAId,
      clusterId: clusterAId,
      sentence: 'Er lauft schnell.',
      translation: 'He runs fast.',
      context: 'casual',
      cefrLevel: 'A1',
      isSelected: true,
    })
    await createSynonym(db, {
      id: crypto.randomUUID(),
      cardId: cardAId,
      clusterId: clusterAId,
      word: 'rennen',
      cefrLevel: 'A2',
      formality: 'neutral',
    })

    // Card B is the dictionary-only stub being upgraded to a full AI card.
    const payload: WordGenerationPayload = {
      lemma: { form: 'laufen', language: 'de', partOfSpeech: 'verb', gender: null, plural: null },
      inflections: ['lauft', 'lief', 'gelaufen'],
      clusters: [
        {
          label: 'movement',
          description: 'to walk or run',
          cefrLevel: 'A1',
          meanings: [
            { translation: 'to walk', explanation: 'to move on foot', usage: null, cefrLevel: 'A1' },
          ],
          examples: [
            {
              sentence: 'Ich laufe zur Schule.',
              translation: 'I walk to school.',
              context: 'casual',
              cefrLevel: 'A1',
              grammarTags: null,
            },
          ],
          synonyms: [{ word: 'gehen', cefrLevel: 'A1', formality: 'neutral', nuance: null }],
        },
      ],
    }
    const usage: GenerationUsage = {
      provider: 'openai',
      model: 'gpt-test',
      promptVersionId: 'v1',
      generatedAt: now,
      tokensUsed: 10,
      latencyMs: 5,
    }

    await regenerateWordPackage(db, lemmaId, cardBId, payload, usage)

    // Card A, in a different deck, sharing only the lemma: untouched.
    const cardAMeanings = await getMeaningsForCard(db, cardAId)
    const cardAExamples = await getExamplesForCard(db, cardAId)
    const cardASynonyms = await getSynonymsForCard(db, cardAId)
    expect(cardAMeanings).toHaveLength(1)
    expect(cardAMeanings[0]?.translation).toBe('to run')
    expect(cardAExamples).toHaveLength(1)
    expect(cardAExamples[0]?.sentence).toBe('Er lauft schnell.')
    expect(cardASynonyms).toHaveLength(1)
    expect(cardASynonyms[0]?.word).toBe('rennen')

    // Card B got the new content.
    const cardBMeanings = await getMeaningsForCard(db, cardBId)
    expect(cardBMeanings).toHaveLength(1)
    expect(cardBMeanings[0]?.translation).toBe('to walk')
  })

  it('allows upgrading an inflected lemma when the surface form is listed in inflections', async () => {
    const now = Date.now()
    const deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'Vocab', createdAt: now, updatedAt: now })
    await db.execute(
      `INSERT INTO prompt_versions (id, name, version, template, created_at, deprecated)
       VALUES ('v1', 'word_package', 1, 'test template', ?, 0)`,
      [now],
    )

    // Lemma was created as an optimistic card for inflected "vertraue"
    const lemmaId = crypto.randomUUID()
    await createLemma(db, {
      id: lemmaId,
      form: 'vertraue',
      language: 'de',
      partOfSpeech: 'verb',
      createdAt: now,
      updatedAt: now,
    })

    const cardId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: cardId, lemmaId, deckId, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'en' },
      initialState(cardId),
    )

    // AI returns canonical headword "vertrauen", with "vertraue" in inflections
    const payload: WordGenerationPayload = {
      lemma: { form: 'vertrauen', language: 'de', partOfSpeech: 'verb', gender: null, plural: null },
      inflections: ['vertraue', 'vertraust', 'vertraut', 'vertraute'],
      clusters: [
        {
          label: 'trust',
          description: 'to trust or rely on',
          cefrLevel: 'B1',
          meanings: [
            { translation: 'to trust', explanation: 'to rely on someone', usage: null, cefrLevel: 'B1' },
          ],
          examples: [
            {
              sentence: 'Ich vertraue dir.',
              translation: 'I trust you.',
              context: 'casual',
              cefrLevel: 'B1',
              grammarTags: null,
            },
          ],
          synonyms: [],
        },
      ],
    }

    const usage: GenerationUsage = {
      provider: 'openai',
      model: 'gpt-test',
      promptVersionId: 'v1',
      generatedAt: now,
      tokensUsed: 10,
      latencyMs: 5,
    }

    const result = await regenerateWordPackage(db, lemmaId, cardId, payload, usage)
    expect(result.cardId).toBe(cardId)

    // The lemma was canonicalized to "vertrauen"
    const updatedLemma = await getLemmaById(db, lemmaId)
    expect(updatedLemma?.form).toBe('vertrauen')

    // Both "vertrauen" and the original surface form "vertraue" exist as inflections
    const inflections = await getInflectionsForLemma(db, lemmaId)
    const forms = inflections.map((i) => i.surface)
    expect(forms).toContain('vertrauen')
    expect(forms).toContain('vertraue')

    // Card meanings were populated
    const meanings = await getMeaningsForCard(db, cardId)
    expect(meanings).toHaveLength(1)
    expect(meanings[0]?.translation).toBe('to trust')
  })

  it('rejects an unrelated word mismatch to prevent accidental corruption', async () => {
    const now = Date.now()
    const deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'Vocab', createdAt: now, updatedAt: now })

    const lemmaId = crypto.randomUUID()
    await createLemma(db, {
      id: lemmaId,
      form: 'Hund',
      language: 'de',
      partOfSpeech: 'noun',
      createdAt: now,
      updatedAt: now,
    })

    const cardId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: cardId, lemmaId, deckId, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'en' },
      initialState(cardId),
    )

    const payload: WordGenerationPayload = {
      lemma: { form: 'Katze', language: 'de', partOfSpeech: 'noun', gender: 'feminine', plural: 'Katzen' },
      inflections: ['Katzen'],
      clusters: [
        {
          label: 'cat',
          description: 'feline animal',
          cefrLevel: 'A1',
          meanings: [{ translation: 'cat', explanation: 'feline animal', usage: null, cefrLevel: 'A1' }],
          examples: [],
          synonyms: [],
        },
      ],
    }

    const usage: GenerationUsage = {
      provider: 'openai',
      model: 'gpt-test',
      promptVersionId: 'v1',
      generatedAt: now,
      tokensUsed: 10,
      latencyMs: 5,
    }

    await expect(regenerateWordPackage(db, lemmaId, cardId, payload, usage)).rejects.toThrow(
      "Regenerated payload's headword 'Katze' doesn't match the existing lemma 'Hund'",
    )
  })

  it('merges an inflected lemma onto a pre-existing canonical lemma when no card claims it yet', async () => {
    const now = Date.now()
    const deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'Vocab', createdAt: now, updatedAt: now })
    await db.execute(
      `INSERT INTO prompt_versions (id, name, version, template, created_at, deprecated)
       VALUES ('v1', 'word_package', 1, 'test template', ?, 0)`,
      [now],
    )

    // The canonical lemma "vertrauen" already exists (e.g. mined separately earlier), but has no
    // card for the 'en' native language yet — only a French-learner's card.
    const canonicalLemmaId = crypto.randomUUID()
    await createLemma(db, {
      id: canonicalLemmaId,
      form: 'vertrauen',
      language: 'de',
      partOfSpeech: 'verb',
      createdAt: now,
      updatedAt: now,
    })
    const frenchCardId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: frenchCardId, lemmaId: canonicalLemmaId, deckId, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'fr' },
      initialState(frenchCardId),
    )

    // A separate, mis-lemmatized "vertraue" lemma with an 'en' card that's being regenerated.
    const staleLemmaId = crypto.randomUUID()
    await createLemma(db, {
      id: staleLemmaId,
      form: 'vertraue',
      language: 'de',
      partOfSpeech: 'verb',
      createdAt: now,
      updatedAt: now,
    })
    const cardId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: cardId, lemmaId: staleLemmaId, deckId, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'en' },
      initialState(cardId),
    )

    const payload: WordGenerationPayload = {
      lemma: { form: 'vertrauen', language: 'de', partOfSpeech: 'verb', gender: null, plural: null },
      inflections: ['vertraue', 'vertraust', 'vertraut'],
      clusters: [
        {
          label: 'trust',
          description: 'to trust or rely on',
          cefrLevel: 'B1',
          meanings: [
            { translation: 'to trust', explanation: 'to rely on someone', usage: null, cefrLevel: 'B1' },
          ],
          examples: [],
          synonyms: [],
        },
      ],
    }
    const usage: GenerationUsage = {
      provider: 'openai',
      model: 'gpt-test',
      promptVersionId: 'v1',
      generatedAt: now,
      tokensUsed: 10,
      latencyMs: 5,
    }

    const result = await regenerateWordPackage(db, staleLemmaId, cardId, payload, usage)

    // The card was re-pointed onto the pre-existing canonical lemma, not left on a renamed
    // duplicate.
    expect(result.lemmaId).toBe(canonicalLemmaId)
    const movedCard = await db.querySingle<{ lemmaId: string }>(
      `SELECT lemma_id AS lemmaId FROM cards WHERE id = ?`,
      [cardId],
    )
    expect(movedCard?.lemmaId).toBe(canonicalLemmaId)

    // The old, now-orphaned "vertraue" lemma was cleaned up.
    expect(await getLemmaById(db, staleLemmaId)).toBeNull()

    // The canonical lemma's inflections now include the original surface form.
    const inflections = await getInflectionsForLemma(db, canonicalLemmaId)
    expect(inflections.map((i) => i.surface)).toContain('vertraue')

    // The French learner's card on the canonical lemma is completely untouched.
    const frenchCard = await db.querySingle<{ lemmaId: string }>(
      `SELECT lemma_id AS lemmaId FROM cards WHERE id = ?`,
      [frenchCardId],
    )
    expect(frenchCard?.lemmaId).toBe(canonicalLemmaId)
  })

  it('refuses to merge — and never deletes a card — when the canonical lemma already has a card for the same native language', async () => {
    const now = Date.now()
    const deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'Vocab', createdAt: now, updatedAt: now })
    await db.execute(
      `INSERT INTO prompt_versions (id, name, version, template, created_at, deprecated)
       VALUES ('v1', 'word_package', 1, 'test template', ?, 0)`,
      [now],
    )

    // The canonical lemma "vertrauen" already has its OWN 'en' card.
    const canonicalLemmaId = crypto.randomUUID()
    await createLemma(db, {
      id: canonicalLemmaId,
      form: 'vertrauen',
      language: 'de',
      partOfSpeech: 'verb',
      createdAt: now,
      updatedAt: now,
    })
    const canonicalCardId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: canonicalCardId, lemmaId: canonicalLemmaId, deckId, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'en' },
      initialState(canonicalCardId),
    )

    // A separate, mis-lemmatized "vertraue" lemma with its OWN 'en' card, which has real review
    // history — this is exactly what must never be silently destroyed by a merge attempt.
    const staleLemmaId = crypto.randomUUID()
    await createLemma(db, {
      id: staleLemmaId,
      form: 'vertraue',
      language: 'de',
      partOfSpeech: 'verb',
      createdAt: now,
      updatedAt: now,
    })
    const cardId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: cardId, lemmaId: staleLemmaId, deckId, type: 'basic', createdAt: now, updatedAt: now, nativeLanguage: 'en' },
      initialState(cardId),
    )
    await recordReview(
      db,
      { id: crypto.randomUUID(), cardId, rating: 'good', reviewedAt: now, durationMs: 1200 },
      { ...initialState(cardId), reps: 1, state: 'review', stability: 3 },
    )

    const payload: WordGenerationPayload = {
      lemma: { form: 'vertrauen', language: 'de', partOfSpeech: 'verb', gender: null, plural: null },
      inflections: ['vertraue', 'vertraust', 'vertraut'],
      clusters: [
        {
          label: 'trust',
          description: 'to trust or rely on',
          cefrLevel: 'B1',
          meanings: [
            { translation: 'to trust (refreshed)', explanation: 'to rely on someone', usage: null, cefrLevel: 'B1' },
          ],
          examples: [],
          synonyms: [],
        },
      ],
    }
    const usage: GenerationUsage = {
      provider: 'openai',
      model: 'gpt-test',
      promptVersionId: 'v1',
      generatedAt: now,
      tokensUsed: 10,
      latencyMs: 5,
    }

    const result = await regenerateWordPackage(db, staleLemmaId, cardId, payload, usage)

    // No merge happened — the card stayed on its original (unrenamed) lemma.
    expect(result.lemmaId).toBe(staleLemmaId)
    const staleLemma = await getLemmaById(db, staleLemmaId)
    expect(staleLemma?.form).toBe('vertraue')

    // Neither card was deleted, and the canonical card is untouched.
    const movedCard = await db.querySingle<{ lemmaId: string }>(
      `SELECT lemma_id AS lemmaId FROM cards WHERE id = ?`,
      [cardId],
    )
    expect(movedCard?.lemmaId).toBe(staleLemmaId)
    const canonicalCard = await db.querySingle<{ id: string }>(`SELECT id FROM cards WHERE id = ?`, [
      canonicalCardId,
    ])
    expect(canonicalCard?.id).toBe(canonicalCardId)

    // The regenerated card's content was still refreshed...
    const meanings = await getMeaningsForCard(db, cardId)
    expect(meanings[0]?.translation).toBe('to trust (refreshed)')

    // ...and its real review history survived completely untouched.
    const state = await getCardState(db, cardId)
    expect(state?.reps).toBe(1)
    expect(state?.state).toBe('review')
  })
})
