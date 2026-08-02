import type { CefrLevel, GrammaticalGender, LanguageCode, Lemma, PartOfSpeech } from '@lingora/types'
import type { DatabaseAdapter } from './adapter'
import { createCluster, createMeaning } from './repositories/clusters'
import { createCloze } from './repositories/cloze'
import { createExample } from './repositories/examples'
import { createInflections, createLemma, getLemmaByForm } from './repositories/lemmas'
import { createPhrase } from './repositories/phrases'
import { createSynonym } from './repositories/synonyms'

/**
 * Manual card creation — the deck menu's "Add card manually" flow. Deliberately separate from
 * persistWordGeneration (AI) and importRow (CSV/Anki bulk import, which carries merge/duplicate
 * policy machinery this doesn't need): this always creates exactly one new card from
 * hand-typed fields, reusing an existing lemma of the same form/language if one exists rather
 * than failing on the UNIQUE constraint.
 */

export interface ManualWordCardInput {
  word: string
  partOfSpeech: PartOfSpeech
  gender?: GrammaticalGender | null
  meaning: string
  explanation?: string
  usage?: string
  example?: string
  exampleTranslation?: string
  /** Plain words, one Synonym row each — formality/nuance aren't collected manually. */
  synonyms?: string[]
  phraseExpression?: string
  phraseMeaning?: string
  cefrLevel: CefrLevel
}

export interface ManualClozeCardInput {
  /** Must contain the literal gap marker "[...]" — same convention AI-generated clozes use (see
   * CLOZE_BLANK_TOKEN in apps/mobile/lib/templates.ts). */
  sentence: string
  answer: string
  translation?: string
  cefrLevel: CefrLevel
}

export interface ManualCardResult {
  lemma: Lemma
  cardId: string
}

/** Reuses an existing lemma of the same form/language, or creates a fresh one + its inflection. */
async function resolveLemma(
  tx: DatabaseAdapter,
  form: string,
  language: LanguageCode,
  partOfSpeech: PartOfSpeech,
  gender: GrammaticalGender | null | undefined,
  now: number,
): Promise<Lemma> {
  const existing = await getLemmaByForm(tx, form, language)
  if (existing) return existing

  const lemma: Lemma = {
    id: crypto.randomUUID(),
    form,
    language,
    partOfSpeech,
    ...(gender != null && { gender }),
    createdAt: now,
    updatedAt: now,
  }
  await createLemma(tx, lemma)
  await createInflections(tx, lemma.id, [form])
  return lemma
}

/** Creates a new `basic` card with a single meaning/cluster, from hand-typed fields. */
export async function createManualWordCard(
  db: DatabaseAdapter,
  deckId: string,
  language: LanguageCode,
  input: ManualWordCardInput,
): Promise<ManualCardResult> {
  return db.transaction(async (tx) => {
    const now = Date.now()
    const lemma = await resolveLemma(tx, input.word.trim(), language, input.partOfSpeech, input.gender, now)

    const cardId = crypto.randomUUID()
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source)
       VALUES (?, ?, ?, 'basic', NULL, ?, ?, NULL, 'manual')`,
      [cardId, lemma.id, deckId, now, now],
    )
    await tx.execute(
      `INSERT INTO card_states (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
       VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
      [cardId, now],
    )
    await tx.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      crypto.randomUUID(),
      deckId,
      cardId,
      now,
    ])

    const clusterId = crypto.randomUUID()
    await createCluster(tx, {
      id: clusterId,
      lemmaId: lemma.id,
      label: 'General',
      description: 'Manually added',
      cefrLevel: input.cefrLevel,
      orderIndex: 0,
    })

    const meaningId = crypto.randomUUID()
    await createMeaning(tx, {
      id: meaningId,
      cardId,
      clusterId,
      translation: input.meaning.trim(),
      explanation: input.explanation?.trim() ?? '',
      ...(input.usage?.trim() && { usage: input.usage.trim() }),
      cefrLevel: input.cefrLevel,
      isPrimary: true,
      orderIndex: 0,
    })
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
      meaningId,
      now,
      cardId,
    ])

    if (input.example?.trim()) {
      await createExample(tx, {
        id: crypto.randomUUID(),
        cardId,
        clusterId,
        sentence: input.example.trim(),
        translation: input.exampleTranslation?.trim() ?? '',
        context: 'casual',
        cefrLevel: input.cefrLevel,
        isSelected: true,
      })
    }

    for (const word of input.synonyms ?? []) {
      await createSynonym(tx, {
        id: crypto.randomUUID(),
        cardId,
        clusterId,
        word,
        cefrLevel: input.cefrLevel,
        formality: 'neutral',
      })
    }

    if (input.phraseExpression?.trim() && input.phraseMeaning?.trim()) {
      await createPhrase(tx, {
        id: crypto.randomUUID(),
        cardId,
        expression: input.phraseExpression.trim(),
        meaning: input.phraseMeaning.trim(),
        exampleSentence: '',
        exampleTranslation: '',
        cefrLevel: input.cefrLevel,
      })
    }

    return { lemma, cardId }
  })
}

/** Creates a new `cloze` card from hand-typed fields. No meaning/cluster — a cloze card's target
 * is the answer, not a translated sense (see createManualWordCard for that). */
export async function createManualClozeCard(
  db: DatabaseAdapter,
  deckId: string,
  language: LanguageCode,
  input: ManualClozeCardInput,
): Promise<ManualCardResult> {
  return db.transaction(async (tx) => {
    const now = Date.now()
    // No standalone "word" field for a cloze card — the answer is the closest equivalent (same
    // fallback importRow/resolveWordAndMeaning uses for an Anki Cloze note, which has no word
    // field either).
    const lemma = await resolveLemma(tx, input.answer.trim(), language, 'phrase', null, now)

    const cardId = crypto.randomUUID()
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source)
       VALUES (?, ?, ?, 'cloze', NULL, ?, ?, NULL, 'manual')`,
      [cardId, lemma.id, deckId, now, now],
    )
    await tx.execute(
      `INSERT INTO card_states (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
       VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
      [cardId, now],
    )
    await tx.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      crypto.randomUUID(),
      deckId,
      cardId,
      now,
    ])

    // createCloze also creates this card's cloze_states row (migration 0013) — cloze practice's
    // own independent FSRS schedule, separate from card_states above.
    await createCloze(tx, {
      id: crypto.randomUUID(),
      cardId,
      sentence: input.sentence.trim(),
      answer: input.answer.trim(),
      translation: input.translation?.trim() ?? '',
      difficulty: 'contextual',
      cefrLevel: input.cefrLevel,
    })

    return { lemma, cardId }
  })
}

export interface CardForSenseInput {
  lemmaId: string
  /** An existing cluster on this lemma (clusters are shared across a lemma's cards, not owned by
   * one — see meaning_clusters) — the sense the user picked via the word-detail screen's cluster
   * tabs. */
  clusterId: string
  meaning: { translation: string; explanation: string; cefrLevel: CefrLevel }
  example?: { sentence: string; translation: string; cefrLevel: CefrLevel } | null
}

/**
 * Adds a genuinely new `basic` card to `deckId` for a lemma that already has at least one card —
 * the word-detail screen's "Add to deck" flow uses this when the user picked a different sense
 * (cluster) than whatever's already primary on the lemma's existing card, instead of overwriting
 * that card's meaning/example (which would silently change what a card already sitting in some
 * other deck shows). Reuses the existing, shared cluster rather than creating a new one — only the
 * card + its own meaning/example rows are new, mirroring `DuplicatePolicy: 'duplicate'`'s "second
 * card under the same lemma" pattern from CSV/Anki import (import-shared.ts). No cloze — see
 * setCloze in repositories/cloze.ts, called separately once this card's id is known.
 */
export async function createCardForSense(
  db: DatabaseAdapter,
  deckId: string,
  input: CardForSenseInput,
): Promise<string> {
  return db.transaction(async (tx) => {
    const now = Date.now()
    const cardId = crypto.randomUUID()
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source)
       VALUES (?, ?, ?, 'basic', NULL, ?, ?, NULL, 'manual')`,
      [cardId, input.lemmaId, deckId, now, now],
    )
    await tx.execute(
      `INSERT INTO card_states (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
       VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
      [cardId, now],
    )
    await tx.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      crypto.randomUUID(),
      deckId,
      cardId,
      now,
    ])

    const meaningId = crypto.randomUUID()
    await createMeaning(tx, {
      id: meaningId,
      cardId,
      clusterId: input.clusterId,
      translation: input.meaning.translation,
      explanation: input.meaning.explanation,
      cefrLevel: input.meaning.cefrLevel,
      isPrimary: true,
      orderIndex: 0,
    })
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
      meaningId,
      now,
      cardId,
    ])

    if (input.example) {
      await createExample(tx, {
        id: crypto.randomUUID(),
        cardId,
        clusterId: input.clusterId,
        sentence: input.example.sentence,
        translation: input.example.translation,
        context: 'casual',
        cefrLevel: input.example.cefrLevel,
        isSelected: true,
      })
    }

    // No cloze is created here — the caller (word/[form].tsx) offers the manual cloze editor
    // separately, after this card exists, so it can attach setCloze's result to the real cardId.

    return cardId
  })
}
