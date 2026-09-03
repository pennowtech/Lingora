import type { GenerationUsage, WordGenerationPayload } from '@lingora/types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../migrations'
import { createCardWithState } from './cards'
import { createCluster, createMeaning, getMeaningsForCard } from './clusters'
import { createDeck } from './decks'
import { createExample, getExamplesForCard } from './examples'
import { regenerateWordPackage } from './generation'
import { createLemma } from './lemmas'
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
})
