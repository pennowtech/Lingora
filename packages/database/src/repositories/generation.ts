import type {
  Card,
  GenerationMetadata,
  GenerationUsage,
  Lemma,
  WordGenerationPayload,
} from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'
import { createCluster, createMeaning } from './clusters'
import { createCloze } from './cloze'
import { createExample } from './examples'
import { createInflections, createLemma, getLemmaByForm } from './lemmas'
import { createPhrase } from './phrases'
import { createSynonym } from './synonyms'

/**
 * Generation metadata: a record of exactly what produced each AI-generated
 * card — provider, model, prompt version, cost. This is what makes generated
 * content reproducible and lets a bad prompt version be found and regenerated.
 */

const GENERATION_METADATA_COLUMNS = `id, card_id AS cardId, provider, model, prompt_version AS promptVersion, generated_at AS generatedAt, tokens_used AS tokensUsed, latency_ms AS latencyMs`

/**
 * Record what produced a generated card.
 */
export async function createGenerationMetadata(
  db: DatabaseAdapter,
  meta: GenerationMetadata,
): Promise<void> {
  await db.execute(
    `INSERT INTO generation_metadata
     (id, card_id, provider, model, prompt_version, generated_at, tokens_used, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meta.id,
      meta.cardId,
      meta.provider,
      meta.model,
      meta.promptVersion,
      meta.generatedAt,
      meta.tokensUsed,
      meta.latencyMs,
    ],
  )
}

/**
 * Get the generation history of a card, newest first.
 */
export async function getGenerationMetadataForCard(
  db: DatabaseAdapter,
  cardId: string,
): Promise<GenerationMetadata[]> {
  return db.query<GenerationMetadata>(
    `SELECT ${GENERATION_METADATA_COLUMNS} FROM generation_metadata
     WHERE card_id = ? ORDER BY generated_at DESC`,
    [cardId],
  )
}

/** What persistWordGeneration hands back so the caller can navigate to the new card. */
export interface PersistedWordGeneration {
  lemma: Lemma
  cardId: string
  generationMetadataId: string
}

/**
 * Persist one validated AI generation for a new word — the last step of the
 * lookup → generation pipeline.
 *
 * Everything lands in a single transaction: lemma, inflections, card with its
 * FSRS state and deck membership, generation metadata, every cluster with its
 * meanings/examples/synonyms, phrases, and cloze variants. If any insert
 * fails, no trace of the word remains and the lookup can simply be retried.
 *
 * Invariants preserved:
 * - The first meaning of the first cluster becomes the card's primary meaning
 *   (exactly one is_primary per card).
 * - The first example of the first cluster is the selected one (exactly one
 *   is_selected per card).
 * - Every example links back to the generation_metadata row that produced it.
 *
 * Note: the card + card_states + deck_cards inserts are inlined rather than
 * delegated to createCardWithState, because that helper opens its own
 * transaction and SQLite transactions don't nest.
 *
 * @throws If the lemma already exists — callers check findLemmaBySurfaceForm
 *         first; regeneration of existing words is a separate flow.
 */
export async function persistWordGeneration(
  db: DatabaseAdapter,
  payload: WordGenerationPayload,
  usage: GenerationUsage,
  deckId: string,
): Promise<PersistedWordGeneration> {
  return db.transaction(async (tx) => {
    const now = Date.now()

    const existing = await getLemmaByForm(tx, payload.lemma.form, payload.lemma.language)
    if (existing) {
      throw new Error(
        `Lemma '${payload.lemma.form}' (${payload.lemma.language}) already exists — ` +
          `look it up instead of regenerating it`,
      )
    }

    const lemma: Lemma = {
      id: crypto.randomUUID(),
      form: payload.lemma.form,
      language: payload.lemma.language,
      partOfSpeech: payload.lemma.partOfSpeech,
      ...(payload.lemma.gender !== null && { gender: payload.lemma.gender }),
      ...(payload.lemma.plural !== null && { plural: payload.lemma.plural }),
      createdAt: now,
      updatedAt: now,
    }
    await createLemma(tx, lemma)

    // The lemma's own form must resolve in surface-form lookups too.
    await createInflections(tx, lemma.id, [payload.lemma.form, ...payload.inflections])

    const card: Card = {
      id: crypto.randomUUID(),
      lemmaId: lemma.id,
      deckId,
      type: 'basic',
      createdAt: now,
      updatedAt: now,
    }
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL)`,
      [card.id, card.lemmaId, card.deckId, card.type, card.createdAt, card.updatedAt],
    )
    await tx.execute(
      `INSERT INTO card_states
       (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
       VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
      [card.id, now],
    )
    await tx.execute(
      `INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), deckId, card.id, now],
    )

    const generationMetadataId = crypto.randomUUID()
    await createGenerationMetadata(tx, {
      id: generationMetadataId,
      cardId: card.id,
      provider: usage.provider,
      model: usage.model,
      promptVersion: usage.promptVersionId,
      generatedAt: usage.generatedAt,
      tokensUsed: usage.tokensUsed,
      latencyMs: usage.latencyMs,
    })

    let primaryMeaningId: string | null = null

    for (const [clusterIndex, generated] of payload.clusters.entries()) {
      const clusterId = crypto.randomUUID()
      await createCluster(tx, {
        id: clusterId,
        lemmaId: lemma.id,
        label: generated.label,
        description: generated.description,
        cefrLevel: generated.cefrLevel,
        orderIndex: clusterIndex,
      })

      for (const [meaningIndex, meaning] of generated.meanings.entries()) {
        const meaningId = crypto.randomUUID()
        const isPrimary = clusterIndex === 0 && meaningIndex === 0
        if (isPrimary) primaryMeaningId = meaningId
        await createMeaning(tx, {
          id: meaningId,
          cardId: card.id,
          clusterId,
          translation: meaning.translation,
          explanation: meaning.explanation,
          cefrLevel: meaning.cefrLevel,
          isPrimary,
          orderIndex: meaningIndex,
        })
      }

      for (const [exampleIndex, example] of generated.examples.entries()) {
        await createExample(tx, {
          id: crypto.randomUUID(),
          cardId: card.id,
          clusterId,
          sentence: example.sentence,
          translation: example.translation,
          context: example.context,
          cefrLevel: example.cefrLevel,
          isSelected: clusterIndex === 0 && exampleIndex === 0,
          generationMetadataId,
        })
      }

      for (const synonym of generated.synonyms) {
        await createSynonym(tx, {
          id: crypto.randomUUID(),
          cardId: card.id,
          clusterId,
          word: synonym.word,
          cefrLevel: synonym.cefrLevel,
          formality: synonym.formality,
          ...(synonym.nuance !== null && { nuance: synonym.nuance }),
        })
      }
    }

    for (const phrase of payload.phrases) {
      await createPhrase(tx, {
        id: crypto.randomUUID(),
        cardId: card.id,
        expression: phrase.expression,
        meaning: phrase.meaning,
        exampleSentence: phrase.exampleSentence,
        exampleTranslation: phrase.exampleTranslation,
        cefrLevel: phrase.cefrLevel,
      })
    }

    for (const cloze of payload.clozes) {
      await createCloze(tx, {
        id: crypto.randomUUID(),
        cardId: card.id,
        sentence: cloze.sentence,
        answer: cloze.answer,
        translation: cloze.translation,
        difficulty: cloze.difficulty,
        cefrLevel: cloze.cefrLevel,
      })
    }

    // The payload schema guarantees ≥1 cluster with ≥1 meaning, so this is
    // a genuine corruption guard, not a reachable branch.
    if (primaryMeaningId === null) {
      throw new Error('WordGenerationPayload had no meanings — nothing to make primary')
    }
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
      primaryMeaningId,
      now,
      card.id,
    ])

    return { lemma, cardId: card.id, generationMetadataId }
  })
}
