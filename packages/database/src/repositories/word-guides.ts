import type {
  Card,
  CardSource,
  CefrLevel,
  Lemma,
  LanguageCode,
  PartOfSpeech,
  WordGuideEntry,
  WordGuideExample,
  WordGuideSynonym,
} from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'
import { createCluster, createMeaning } from './clusters'
import { createExample } from './examples'
import { createInflections, createLemma, getLemmaByForm } from './lemmas'
import { createSynonym } from './synonyms'

/**
 * Word guides: a bulk-installed, pre-generated reference dictionary — see
 * LingoraDocs/6_word_guides_plan.md. Deliberately unrelated to
 * lemmas/cards/decks/FSRS; the explain-flow (word/[form].tsx,
 * review/[deckId].tsx) consults this as a free fallback before a live AI
 * call, never as study material of its own. `persistWordGuideAsCard` below
 * is the one deliberate exception — the user explicitly opting in to turn
 * one entry into a real card, not something installing/looking up a guide
 * does on its own.
 */

interface WordGuideRow {
  headword: string
  language: LanguageCode
  chunkId: number
  partOfSpeech: string | null
  gender: string | null
  translation: string
  usage: string | null
  intro: string
  synonyms: string
  examples: string
}

const WORD_GUIDE_COLUMNS = `headword, language, chunk_id AS chunkId, part_of_speech AS partOfSpeech, gender, translation, usage_note AS usage, intro, synonyms, examples`

function toEntry(row: WordGuideRow): WordGuideEntry {
  return {
    headword: row.headword,
    language: row.language,
    chunkId: row.chunkId,
    translation: row.translation,
    intro: row.intro,
    synonyms: JSON.parse(row.synonyms) as WordGuideSynonym[],
    examples: JSON.parse(row.examples) as WordGuideExample[],
    ...(row.partOfSpeech !== null && { partOfSpeech: row.partOfSpeech }),
    ...(row.gender !== null && { gender: row.gender }),
    ...(row.usage !== null && { usage: row.usage }),
  }
}

/**
 * Look up one word in the installed dictionary — the explain-flow's actual
 * read path. Returns null if the word isn't installed (either that chunk
 * was never installed, or the word isn't in the source list at all).
 */
export async function getWordGuide(
  db: DatabaseAdapter,
  headword: string,
  language: LanguageCode,
): Promise<WordGuideEntry | null> {
  const row = await db.querySingle<WordGuideRow>(
    `SELECT ${WORD_GUIDE_COLUMNS} FROM word_guides WHERE headword = ? COLLATE NOCASE AND language = ?`,
    [headword, language],
  )
  return row ? toEntry(row) : null
}

/**
 * Bulk-installs one chunk's worth of entries, transactionally — either the
 * whole chunk lands or none of it does. `INSERT OR REPLACE` so re-installing
 * an already-installed chunk (e.g. after a content update) overwrites
 * cleanly rather than erroring on the unique (headword, language) index.
 */
export async function installWordGuideChunk(
  db: DatabaseAdapter,
  chunkId: number,
  language: LanguageCode,
  entries: readonly Omit<WordGuideEntry, 'language' | 'chunkId'>[],
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const entry of entries) {
      await tx.execute(
        `INSERT OR REPLACE INTO word_guides
         (id, headword, language, chunk_id, part_of_speech, gender, translation, usage_note, intro, synonyms, examples)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          entry.headword,
          language,
          chunkId,
          entry.partOfSpeech ?? null,
          entry.gender ?? null,
          entry.translation,
          entry.usage ?? null,
          entry.intro,
          JSON.stringify(entry.synonyms),
          JSON.stringify(entry.examples),
        ],
      )
    }
  })
}

/**
 * Uninstalls one chunk. Since no other table ever references a
 * `word_guides` row, this is the entire uninstall story — there's nothing
 * else to clean up, unlike deck-scoped content which has to cascade through
 * cards/meanings/examples/etc.
 */
export async function uninstallWordGuideChunk(
  db: DatabaseAdapter,
  chunkId: number,
  language: LanguageCode,
): Promise<void> {
  await db.execute(`DELETE FROM word_guides WHERE chunk_id = ? AND language = ?`, [chunkId, language])
}

/** Which chunks are currently installed, for the Settings chunk browser. */
export async function getInstalledWordGuideChunkIds(
  db: DatabaseAdapter,
  language: LanguageCode,
): Promise<number[]> {
  const rows = await db.query<{ chunkId: number }>(
    `SELECT DISTINCT chunk_id AS chunkId FROM word_guides WHERE language = ? ORDER BY chunk_id ASC`,
    [language],
  )
  return rows.map((r) => r.chunkId)
}

/**
 * A word guide's `partOfSpeech` is free descriptive text ('article/pronoun',
 * 'verb (past participle)', ...) written for a human reading the entry, not
 * the closed `PartOfSpeech` union `Lemma.partOfSpeech` requires. Takes the
 * first recognizable tag, falling back to 'noun' for anything unrecognized
 * (headwords without a usable tag in the source data are capitalized nouns
 * in practice — see tools/word-guides/derive-word-list.mjs).
 */
function mapPartOfSpeech(raw: string | undefined): PartOfSpeech {
  const KNOWN: Record<string, PartOfSpeech> = {
    noun: 'noun',
    verb: 'verb',
    adjective: 'adjective',
    adverb: 'adverb',
    preposition: 'preposition',
    conjunction: 'conjunction',
    pronoun: 'pronoun',
    article: 'article',
    phrase: 'phrase',
    determiner: 'article',
    numeral: 'noun',
  }
  const firstTag = raw?.split(/[/\s(]/)[0]?.toLowerCase()
  return (firstTag ? KNOWN[firstTag] : undefined) ?? 'noun'
}

/**
 * Turns one installed dictionary entry into a real, reviewable card — the
 * user explicitly opting in from Search's "found in your installed
 * dictionary" preview (see LingoraDocs/6_word_guides_plan.md), not anything
 * install/lookup does automatically. Everything else about word_guides stays
 * untouched: this only reads the entry, never writes back to it.
 *
 * One cluster/meaning/example set, mirroring the shape persistWordGeneration
 * produces from an AI generation so the resulting card behaves identically
 * (explain-flow, FSRS review, evaluation bar, ...). `cefrLevel` has no
 * dictionary-native equivalent (word_guides entries aren't leveled), so the
 * caller supplies one — defaults to 'A1' since the installed word list is
 * frequency-ranked and today's only chunk is the 100 most frequent words.
 *
 * @throws If a lemma with this form/language already exists — callers
 *         should only reach this from a word that had zero search results.
 */
export async function persistWordGuideAsCard(
  db: DatabaseAdapter,
  entry: WordGuideEntry,
  deckId: string,
  nativeLanguage: LanguageCode,
  cefrLevel: CefrLevel = 'A1',
): Promise<{ lemma: Lemma; cardId: string }> {
  return db.transaction(async (tx) => {
    const existing = await getLemmaByForm(tx, entry.headword, entry.language)
    if (existing) {
      throw new Error(
        `Lemma '${entry.headword}' (${entry.language}) already exists — look it up instead of re-adding it`,
      )
    }

    const now = Date.now()
    const lemma: Lemma = {
      id: crypto.randomUUID(),
      form: entry.headword,
      language: entry.language,
      partOfSpeech: mapPartOfSpeech(entry.partOfSpeech),
      ...(entry.gender === 'masculine' || entry.gender === 'feminine' || entry.gender === 'neuter'
        ? { gender: entry.gender }
        : {}),
      createdAt: now,
      updatedAt: now,
    }
    await createLemma(tx, lemma)
    await createInflections(tx, lemma.id, [entry.headword])

    const card: Card = {
      id: crypto.randomUUID(),
      lemmaId: lemma.id,
      deckId,
      type: 'basic',
      createdAt: now,
      updatedAt: now,
      source: 'word_guide',
      nativeLanguage,
    }
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source, native_language)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?)`,
      [card.id, card.lemmaId, card.deckId, card.type, card.createdAt, card.updatedAt, card.source, card.nativeLanguage],
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

    const clusterId = crypto.randomUUID()
    await createCluster(tx, {
      id: clusterId,
      lemmaId: lemma.id,
      label: 'general',
      description: entry.intro,
      cefrLevel,
      orderIndex: 0,
    })

    const meaningId = crypto.randomUUID()
    await createMeaning(tx, {
      id: meaningId,
      cardId: card.id,
      clusterId,
      translation: entry.translation,
      explanation: entry.intro,
      cefrLevel,
      isPrimary: true,
      orderIndex: 0,
    })
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [meaningId, now, card.id])

    for (const [index, example] of entry.examples.entries()) {
      await createExample(tx, {
        id: crypto.randomUUID(),
        cardId: card.id,
        clusterId,
        sentence: example.sentence,
        translation: example.translation,
        context: 'daily_life',
        cefrLevel,
        isSelected: index === 0,
      })
    }

    for (const synonym of entry.synonyms) {
      await createSynonym(tx, {
        id: crypto.randomUUID(),
        cardId: card.id,
        clusterId,
        word: synonym.word,
        cefrLevel,
        formality: 'neutral',
        ...(synonym.gloss !== '' && { nuance: synonym.gloss }),
      })
    }

    return { lemma, cardId: card.id }
  })
}

/**
 * Turns a plain dictionary-translation result (Google Translate/DeepL — see
 * Search's quickTranslate) into a minimal real card: one cluster, one
 * meaning, no examples/synonyms/explanation. `partOfSpeech` defaults to
 * 'noun' (a translate API gives no part-of-speech at all, unlike a word
 * guide entry's free-text tag), and the meaning's `explanation` is left
 * empty on purpose — the explain-flow's existing priority order (stored
 * explanation → installed dictionary → live AI) then does the right thing
 * automatically the first time the user taps the book icon on this card.
 *
 * @throws If a lemma with this form/language already exists.
 */
export async function persistTranslationAsCard(
  db: DatabaseAdapter,
  args: { form: string; language: LanguageCode; translation: string; explanation?: string; provider: Exclude<CardSource, 'word_guide'> },
  deckId: string,
  nativeLanguage: LanguageCode,
  cefrLevel: CefrLevel = 'unknown',
): Promise<{ lemma: Lemma; cardId: string }> {
  return db.transaction(async (tx) => {
    const existing = await getLemmaByForm(tx, args.form, args.language)
    if (existing) {
      throw new Error(
        `Lemma '${args.form}' (${args.language}) already exists — look it up instead of re-adding it`,
      )
    }

    const now = Date.now()
    const lemma: Lemma = {
      id: crypto.randomUUID(),
      form: args.form,
      language: args.language,
      partOfSpeech: 'noun',
      createdAt: now,
      updatedAt: now,
    }
    await createLemma(tx, lemma)
    await createInflections(tx, lemma.id, [args.form])

    const card: Card = {
      id: crypto.randomUUID(),
      lemmaId: lemma.id,
      deckId,
      type: 'basic',
      createdAt: now,
      updatedAt: now,
      source: args.provider,
      nativeLanguage,
    }
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source, native_language)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?)`,
      [card.id, card.lemmaId, card.deckId, card.type, card.createdAt, card.updatedAt, card.source, card.nativeLanguage],
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

    const clusterId = crypto.randomUUID()
    await createCluster(tx, {
      id: clusterId,
      lemmaId: lemma.id,
      label: 'general',
      description: args.translation,
      cefrLevel,
      orderIndex: 0,
    })

    const meaningId = crypto.randomUUID()
    await createMeaning(tx, {
      id: meaningId,
      cardId: card.id,
      clusterId,
      translation: args.translation,
      explanation: args.explanation ?? '',
      cefrLevel,
      isPrimary: true,
      orderIndex: 0,
    })
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [meaningId, now, card.id])

    return { lemma, cardId: card.id }
  })
}
