import type { LanguageCode, WordGuideEntry, WordGuideExample, WordGuideSynonym } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Word guides: a bulk-installed, pre-generated reference dictionary — see
 * LingoraDocs/6_word_guides_plan.md. Deliberately unrelated to
 * lemmas/cards/decks/FSRS; the explain-flow (word/[form].tsx,
 * review/[deckId].tsx) consults this as a free fallback before a live AI
 * call, never as study material of its own.
 */

interface WordGuideRow {
  headword: string
  language: LanguageCode
  chunkId: number
  partOfSpeech: string | null
  gender: string | null
  usage: string | null
  intro: string
  synonyms: string
  examples: string
}

const WORD_GUIDE_COLUMNS = `headword, language, chunk_id AS chunkId, part_of_speech AS partOfSpeech, gender, usage_note AS usage, intro, synonyms, examples`

function toEntry(row: WordGuideRow): WordGuideEntry {
  return {
    headword: row.headword,
    language: row.language,
    chunkId: row.chunkId,
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
         (id, headword, language, chunk_id, part_of_speech, gender, usage_note, intro, synonyms, examples)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          entry.headword,
          language,
          chunkId,
          entry.partOfSpeech ?? null,
          entry.gender ?? null,
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
