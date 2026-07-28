import type {
  CardState,
  CefrLevel,
  ClozeDifficulty,
  ExampleContext,
  FormalityLevel,
  GrammaticalGender,
  LanguageCode,
  PartOfSpeech,
} from '@lingora/types'
import { logger } from '@lingora/observability'
import type { DatabaseAdapter } from './adapter'
import { type BackupPayload, parseBackup } from './backup'
import { updateCardPrimaryMeaning } from './repositories/cards'
import { createCluster, createMeaning } from './repositories/clusters'
import { createExample } from './repositories/examples'
import { createCloze } from './repositories/cloze'
import { createInflections, createLemma, getLemmaByForm } from './repositories/lemmas'
import { createPhrase } from './repositories/phrases'
import { createSynonym } from './repositories/synonyms'
import { addTagToCard, getOrCreateTag } from './repositories/tags'

export { BackupValidationError } from './backup'

/**
 * Deck-scoped `.lin` **import** — the counterpart to `createDeckBackup`.
 * Unlike `restoreBackup` (whole-library, full-replace), this is additive: it
 * never deletes anything already on this device, always creates fresh IDs
 * for the rows it writes, and — like the CSV/Anki importers — treats a word
 * that already exists locally (same lemma form) as a conflict the caller
 * resolves via `DuplicatePolicy` ('skip' or 'duplicate', reusing the exact
 * semantics `import-shared.ts` already established: `lemmas.form` is
 * globally UNIQUE, so "keep both" means a second card under the *existing*
 * local lemma, never a second lemma).
 *
 * Three phases, mirroring the CSV/Anki import wizard shape:
 * 1. `parseLinImportFile` / `getDecksInPayload` — parse and validate the
 *    file, and list which deck(s) it contains (a deck-scoped `.lin` always
 *    has exactly one; a whole-library `.lin` used as an import source may
 *    have several — the caller lets the user pick).
 * 2. `buildLinImportPreview` — one row per lemma in the chosen source deck,
 *    with its cards' types/translations for display and a
 *    'ok' | 'duplicate' status — without writing anything.
 * 3. `importLinDeck` — imports every non-skipped lemma's full subgraph
 *    (inflections, clusters, meanings, examples, synonyms, phrases, cloze
 *    variants, FSRS state, review history, tags) into the target deck, all
 *    in one transaction.
 *
 * Deliberately NOT carried over: `audio` (file paths point at the source
 * device's filesystem, meaningless on this one), `generation_metadata`
 * (provenance only — dropped rather than left dangling once `audio` and
 * cross-device prompt-version bookkeeping are out of scope), and
 * `templates`/`prompt_versions`/`sentence_mining_queue`/`evaluations`
 * (global or not deck-scoped — importing one deck shouldn't change this
 * device's template list or mining queue).
 */

const importLog = logger.child({ feature: 'import', component: 'lin-import' })

export type LinDuplicatePolicy = 'skip' | 'duplicate'

/** Parses and validates a `.lin` file — same format as the JSON backup, see `backup.ts#parseBackup`. */
export function parseLinImportFile(raw: string): BackupPayload {
  return parseBackup(raw)
}

export interface LinDeckOption {
  id: string
  name: string
  cardCount: number
}

/** The deck(s) present in a `.lin` file, for the user to pick an import source from. */
export function getDecksInPayload(payload: BackupPayload): LinDeckOption[] {
  const decks = payload.tables.decks ?? []
  const deckCards = payload.tables.deck_cards ?? []
  return decks.map((deck) => ({
    id: String(deck.id),
    name: String(deck.name),
    cardCount: deckCards.filter((dc) => dc.deck_id === deck.id).length,
  }))
}

export interface LinCardPreview {
  type: string
  translation: string | null
}

export interface LinLemmaPreview {
  /** The lemma's id *in the file* — only used to re-look-up its subgraph during import, never written as-is. */
  sourceLemmaId: string
  form: string
  cards: LinCardPreview[]
  status: 'ok' | 'duplicate'
  /** Set when `status === 'duplicate'` — the local lemma a 'duplicate' (keep-both) import attaches new cards to. */
  existingLemmaId: string | null
}

/**
 * One row per lemma in the file's chosen deck, flagged against this
 * device's existing lemmas by form — the same duplicate-detection
 * `getLemmaByForm` the CSV/Anki importers use. Nothing is written yet.
 */
export async function buildLinImportPreview(
  db: DatabaseAdapter,
  payload: BackupPayload,
  sourceDeckId: string,
  language: LanguageCode,
): Promise<LinLemmaPreview[]> {
  const cardIdsInDeck = new Set(
    (payload.tables.deck_cards ?? [])
      .filter((row) => row.deck_id === sourceDeckId)
      .map((row) => String(row.card_id)),
  )
  const cards = (payload.tables.cards ?? []).filter((c) => cardIdsInDeck.has(String(c.id)))
  const meanings = payload.tables.meanings ?? []
  const lemmaIds = new Set(cards.map((c) => String(c.lemma_id)))
  const lemmas = (payload.tables.lemmas ?? []).filter((l) => lemmaIds.has(String(l.id)))

  const previews: LinLemmaPreview[] = []
  for (const lemma of lemmas) {
    const sourceLemmaId = String(lemma.id)
    const lemmaCards = cards.filter((c) => String(c.lemma_id) === sourceLemmaId)
    const cardPreviews: LinCardPreview[] = lemmaCards.map((c) => {
      const primaryMeaning = meanings.find((m) => m.id === c.primary_meaning_id)
      return {
        type: String(c.type),
        translation: primaryMeaning ? String(primaryMeaning.translation) : null,
      }
    })
    const existing = await getLemmaByForm(db, String(lemma.form), language)
    previews.push({
      sourceLemmaId,
      form: String(lemma.form),
      cards: cardPreviews,
      status: existing ? 'duplicate' : 'ok',
      existingLemmaId: existing?.id ?? null,
    })
  }
  return previews.sort((a, b) => a.form.localeCompare(b.form))
}

export interface LinImportResult {
  imported: number
  skipped: number
  cardsImported: number
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value)
}

function parseJsonStringArray(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function buildCardState(cardId: string, row: Record<string, unknown> | undefined, now: number): CardState {
  if (!row) {
    return { cardId, stability: 0, difficulty: 0, retrievability: 0, nextReviewAt: now, lapses: 0, state: 'new', reps: 0, learningSteps: 0 }
  }
  const lastReviewedAt = row.last_reviewed_at
  return {
    cardId,
    stability: Number(row.stability),
    difficulty: Number(row.difficulty),
    retrievability: Number(row.retrievability),
    nextReviewAt: Number(row.next_review_date),
    lapses: Number(row.lapses),
    state: String(row.state) as CardState['state'],
    reps: Number(row.reps),
    learningSteps: Number(row.learning_steps),
    ...(lastReviewedAt !== null && lastReviewedAt !== undefined && { lastReviewAt: Number(lastReviewedAt) }),
  }
}

/**
 * Imports every non-skipped lemma from `previews` — each lemma's full
 * subgraph (inflections/clusters/meanings/examples/synonyms/phrases/cloze
 * variants/FSRS state/review history/tags), with brand-new IDs throughout —
 * into `targetDeckId`, all in one transaction.
 */
export async function importLinDeck(
  db: DatabaseAdapter,
  payload: BackupPayload,
  sourceDeckId: string,
  targetDeckId: string,
  language: LanguageCode,
  previews: readonly LinLemmaPreview[],
  duplicatePolicy: LinDuplicatePolicy = 'skip',
): Promise<LinImportResult> {
  const startedAt = Date.now()
  importLog.info('import.lin_deck_import_started', {
    message: 'Deck-scoped .lin import started',
    metadata: { itemCount: previews.length },
  })

  const t = payload.tables
  const lemmasAll = t.lemmas ?? []
  const inflectionsAll = t.inflections ?? []
  const clustersAll = t.meaning_clusters ?? []
  const meaningsAll = t.meanings ?? []
  const examplesAll = t.examples ?? []
  const synonymsAll = t.synonyms ?? []
  const phrasesAll = t.phrases ?? []
  const clozesAll = t.cloze_cards ?? []
  const cardStatesAll = t.card_states ?? []
  const reviewEventsAll = t.review_events ?? []
  const tagsAll = t.tags ?? []
  const cardTagsAll = t.card_tags ?? []
  const cardIdsInDeck = new Set(
    (t.deck_cards ?? []).filter((row) => row.deck_id === sourceDeckId).map((row) => String(row.card_id)),
  )
  const cardsInDeck = (t.cards ?? []).filter((c) => cardIdsInDeck.has(String(c.id)))

  let imported = 0
  let skipped = 0
  let cardsImported = 0
  const now = Date.now()
  const tagIdMap = new Map<string, string>()

  await db.transaction(async (tx) => {
    for (const preview of previews) {
      if (preview.status === 'duplicate' && duplicatePolicy === 'skip') {
        skipped += 1
        continue
      }

      const isDuplicate = preview.status === 'duplicate'
      const lemmaId = isDuplicate ? preview.existingLemmaId! : crypto.randomUUID()

      if (!isDuplicate) {
        const srcLemma = lemmasAll.find((l) => l.id === preview.sourceLemmaId)
        if (!srcLemma) continue
        await createLemma(tx, {
          id: lemmaId,
          form: preview.form,
          language,
          partOfSpeech: String(srcLemma.part_of_speech) as PartOfSpeech,
          createdAt: now,
          updatedAt: now,
          ...(nullableString(srcLemma.gender) !== null && {
            gender: srcLemma.gender as GrammaticalGender,
          }),
          ...(nullableString(srcLemma.plural) !== null && { plural: String(srcLemma.plural) }),
        })
        const forms = inflectionsAll
          .filter((i) => i.lemma_id === preview.sourceLemmaId)
          .map((i) => String(i.form))
        await createInflections(tx, lemmaId, forms.length > 0 ? forms : [preview.form])
      }

      const srcClusters = clustersAll.filter((c) => c.lemma_id === preview.sourceLemmaId)
      const clusterIdMap = new Map<string, string>()
      for (const c of srcClusters) {
        const newClusterId = crypto.randomUUID()
        clusterIdMap.set(String(c.id), newClusterId)
        await createCluster(tx, {
          id: newClusterId,
          lemmaId,
          label: String(c.label),
          description: nullableString(c.description) ?? '',
          cefrLevel: String(c.cefr_level) as CefrLevel,
          orderIndex: Number(c.order_index),
        })
      }
      const fallbackClusterId: string | undefined = clusterIdMap.values().next().value

      const srcCards = cardsInDeck.filter((c) => c.lemma_id === preview.sourceLemmaId)
      const cardIdMap = new Map<string, string>()
      for (const c of srcCards) cardIdMap.set(String(c.id), crypto.randomUUID())

      // Cards are created first (state + deck membership, primary meaning
      // still unset) so meanings/examples/synonyms/phrases/cloze rows below
      // can satisfy their `card_id` foreign key — same insert order
      // `persistWordGeneration` uses, see "cards.primary_meaning_id is
      // nullable by design" in CLAUDE.md. Written directly with `tx.execute`
      // rather than `createCardWithState` — that helper opens its own
      // transaction, and this whole import already runs inside one.
      for (const c of srcCards) {
        const newCardId = cardIdMap.get(String(c.id))!
        const srcState = cardStatesAll.find((s) => s.card_id === c.id)
        const state = buildCardState(newCardId, srcState, now)
        const suspendedAt = nullableString(c.suspended_at)

        await tx.execute(
          `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
          [newCardId, lemmaId, targetDeckId, String(c.type), now, now, suspendedAt !== null ? Number(suspendedAt) : null],
        )
        await tx.execute(
          `INSERT INTO card_states
           (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date, reps, learning_steps)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            state.cardId,
            state.state,
            state.stability,
            state.difficulty,
            state.retrievability,
            state.lapses,
            state.lastReviewAt ?? null,
            state.nextReviewAt,
            state.reps,
            state.learningSteps,
          ],
        )
        await tx.execute(
          `INSERT OR IGNORE INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`,
          [crypto.randomUUID(), targetDeckId, newCardId, now],
        )
      }

      const meaningIdMap = new Map<string, string>()
      for (const m of meaningsAll.filter((m) => cardIdMap.has(String(m.card_id)))) {
        const newMeaningId = crypto.randomUUID()
        meaningIdMap.set(String(m.id), newMeaningId)
        const clusterId = clusterIdMap.get(String(m.meaning_cluster_id)) ?? fallbackClusterId
        if (!clusterId) continue
        await createMeaning(tx, {
          id: newMeaningId,
          cardId: cardIdMap.get(String(m.card_id))!,
          clusterId,
          translation: String(m.translation),
          explanation: nullableString(m.explanation) ?? '',
          isPrimary: Boolean(m.is_primary),
          cefrLevel: String(m.cefr_level) as CefrLevel,
          orderIndex: Number(m.order_index),
        })
      }

      for (const ex of examplesAll.filter((e) => cardIdMap.has(String(e.card_id)))) {
        const clusterId = clusterIdMap.get(String(ex.meaning_cluster_id)) ?? fallbackClusterId
        if (!clusterId) continue
        const grammarTags = parseJsonStringArray(ex.grammar_tags)
        await createExample(tx, {
          id: crypto.randomUUID(),
          cardId: cardIdMap.get(String(ex.card_id))!,
          clusterId,
          sentence: String(ex.sentence),
          translation: nullableString(ex.translation) ?? '',
          context: (nullableString(ex.context_tags) ?? 'casual') as ExampleContext,
          cefrLevel: String(ex.cefr_level) as CefrLevel,
          isSelected: Boolean(ex.is_selected),
          ...(grammarTags.length > 0 && { grammarTags }),
        })
      }

      for (const syn of synonymsAll.filter((s) => cardIdMap.has(String(s.card_id)))) {
        const clusterId = clusterIdMap.get(String(syn.meaning_cluster_id)) ?? fallbackClusterId
        if (!clusterId) continue
        const nuance = nullableString(syn.nuance)
        await createSynonym(tx, {
          id: crypto.randomUUID(),
          cardId: cardIdMap.get(String(syn.card_id))!,
          clusterId,
          word: String(syn.synonym),
          cefrLevel: String(syn.cefr_level) as CefrLevel,
          formality: (nullableString(syn.formality_level) ?? 'neutral') as FormalityLevel,
          ...(nuance !== null && { nuance }),
        })
      }

      for (const p of phrasesAll.filter((p) => cardIdMap.has(String(p.card_id)))) {
        await createPhrase(tx, {
          id: crypto.randomUUID(),
          cardId: cardIdMap.get(String(p.card_id))!,
          expression: String(p.expression),
          meaning: String(p.meaning),
          exampleSentence: nullableString(p.example_sentence) ?? '',
          exampleTranslation: nullableString(p.example_translation) ?? '',
          cefrLevel: String(p.cefr_level) as CefrLevel,
        })
      }

      for (const cz of clozesAll.filter((cz) => cardIdMap.has(String(cz.card_id)))) {
        await createCloze(tx, {
          id: crypto.randomUUID(),
          cardId: cardIdMap.get(String(cz.card_id))!,
          sentence: String(cz.sentence),
          answer: String(cz.cloze),
          translation: String(cz.translation),
          difficulty: (nullableString(cz.difficulty) ?? 'easy') as ClozeDifficulty,
          cefrLevel: String(cz.cefr_level) as CefrLevel,
        })
      }

      for (const c of srcCards) {
        const newCardId = cardIdMap.get(String(c.id))!

        const srcPrimaryMeaningId = nullableString(c.primary_meaning_id)
        const newPrimaryMeaningId = srcPrimaryMeaningId ? meaningIdMap.get(srcPrimaryMeaningId) : undefined
        if (newPrimaryMeaningId) await updateCardPrimaryMeaning(tx, newCardId, newPrimaryMeaningId)

        for (const ev of reviewEventsAll.filter((e) => e.card_id === c.id)) {
          await tx.execute(
            `INSERT INTO review_events (id, card_id, review_date, rating, duration_ms) VALUES (?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), newCardId, Number(ev.review_date), String(ev.rating), Number(ev.duration_ms)],
          )
        }

        for (const ct of cardTagsAll.filter((ct) => ct.card_id === c.id)) {
          const srcTagId = String(ct.tag_id)
          let localTagId = tagIdMap.get(srcTagId)
          if (!localTagId) {
            const srcTag = tagsAll.find((tg) => tg.id === ct.tag_id)
            const tag = await getOrCreateTag(tx, srcTag ? String(srcTag.name) : srcTagId)
            localTagId = tag.id
            tagIdMap.set(srcTagId, localTagId)
          }
          await addTagToCard(tx, newCardId, localTagId)
        }

        cardsImported += 1
      }

      imported += 1
    }
  })

  importLog.info('import.lin_deck_import_completed', {
    message: 'Deck-scoped .lin import completed',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { itemCount: imported },
  })

  return { imported, skipped, cardsImported }
}
