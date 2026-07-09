import type { Lemma } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'
import { buildFTSQuery } from '../fts'

/**
 * The columns of a lemma row, aliased to the camelCase names of the Lemma type.
 * Every SELECT in this file uses this list so rows come back already shaped
 * like the shared type — no mapping layer needed.
 *
 * @param prefix Table alias to qualify the columns with, e.g. 'l' in a JOIN.
 */
function lemmaColumns(prefix = ''): string {
  const p = prefix === '' ? '' : `${prefix}.`
  return `${p}id, ${p}form, ${p}language, ${p}part_of_speech AS partOfSpeech, ${p}gender, ${p}plural, ${p}created_at AS createdAt, ${p}updated_at AS updatedAt`
}

/**
 * Find a lemma by looking up its surface form in inflections.
 *
 * This is the entry point for every word lookup. The flow is:
 * - User enters a word in the search bar. e.g. 'ging aus'
 * - We look up the surface form in the inflections table.
 * - If we find a match, we get the lemma_id.
 * - We then load the full lemma from the lemmas table using the lemma_id.
 * - If we find a lemma, we return it. If not, we return null. That means the word is new and we need AI generation.
 *
 * INNER JOIN only returns a result when both a matching inflection and its lemma exist.
 * If either is missing, we return null.
 *
 * COLLATE NOCASE instead of lowercasing the input: German nouns are stored
 * capitalized ('Haus'), so lowercasing the input would never match them.
 *
 * @param db The database adapter to use for the query.
 * @param surfaceForm The surface form to look up. e.g. 'ging aus'
 * @returns The lemma if found, otherwise null.
 */
export async function findLemmaBySurfaceForm(
  db: DatabaseAdapter,
  surfaceForm: string,
): Promise<Lemma | null> {
  return (
    (await db.querySingle<Lemma>(
      `SELECT ${lemmaColumns('l')}
       FROM lemmas l
       JOIN inflections i ON l.id = i.lemma_id
       WHERE i.form = ? COLLATE NOCASE`,
      [surfaceForm.trim()],
    )) ?? null
  )
}

/**
 * Find a lemma by its exact root form.
 * Used when we already know the base form.
 */
export async function getLemmaByForm(
  db: DatabaseAdapter,
  form: string,
  language = 'de',
): Promise<Lemma | null> {
  return (
    (await db.querySingle<Lemma>(
      `SELECT ${lemmaColumns()} FROM lemmas WHERE form = ? COLLATE NOCASE AND language = ?`,
      [form.trim(), language],
    )) ?? null
  )
}

/**
 * Full-text search across lemma forms AND meaning translations.
 * Called on every keystroke in the search bar, so a user finds
 * 'ausgehen' whether they type "ausgeh" (German) or "go out" (English).
 *
 * Both branches use FTS5's external-content rowid to join back to the
 * source row. rank is FTS5's built-in BM25 relevance score — lower is
 * better, so ORDER BY MIN(rank) puts the best match first. GROUP BY
 * deduplicates a lemma that matches on both its form and a translation.
 *
 * Returns up to 20 results ordered by relevance.
 */
export async function searchLemmas(db: DatabaseAdapter, input: string): Promise<Lemma[]> {
  const query = buildFTSQuery(input)
  if (!query) return []

  return db.query<Lemma>(
    `SELECT id, form, language, partOfSpeech, gender, plural, createdAt, updatedAt
     FROM (
       SELECT ${lemmaColumns('l')}, fts_lemmas.rank AS rank
       FROM fts_lemmas
       JOIN lemmas l ON l.rowid = fts_lemmas.rowid
       WHERE fts_lemmas MATCH ?

       UNION ALL

       SELECT ${lemmaColumns('l')}, fts_meanings.rank AS rank
       FROM fts_meanings
       JOIN meanings m ON m.rowid = fts_meanings.rowid
       JOIN cards c ON c.id = m.card_id
       JOIN lemmas l ON l.id = c.lemma_id
       WHERE fts_meanings MATCH ?
     )
     GROUP BY id
     ORDER BY MIN(rank)
     LIMIT 20`,
    [query, query],
  )
}

/**
 * Save a new lemma.
 * Called after AI generation for a word not yet in the database.
 */
export async function createLemma(db: DatabaseAdapter, lemma: Lemma): Promise<void> {
  await db.execute(
    `INSERT INTO lemmas (id, form, language, part_of_speech, gender, plural, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lemma.id,
      lemma.form,
      lemma.language,
      lemma.partOfSpeech,
      lemma.gender ?? null,
      lemma.plural ?? null,
      lemma.createdAt,
      lemma.updatedAt,
    ],
  )
}

/**
 * Save inflections for a lemma.
 * Called together with createLemma after AI generation.
 *
 * Uses INSERT OR IGNORE to safely handle the case where
 * an inflection was already stored from a previous lookup
 * (inflections.form is UNIQUE).
 */
export async function createInflections(
  db: DatabaseAdapter,
  lemmaId: string,
  surfaces: string[],
): Promise<void> {
  const now = Date.now()
  for (const surface of surfaces) {
    await db.execute(
      `INSERT OR IGNORE INTO inflections (id, form, lemma_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), surface.trim(), lemmaId, now, now],
    )
  }
}

/** @deprecated Use createLemma — kept as an alias so existing call sites keep working. */
export const saveLemma = createLemma

/** @deprecated Use createInflections — kept as an alias so existing call sites keep working. */
export const saveInflections = createInflections
