import type { CardSource, CefrLevel, Inflection, LanguageCode, Lemma } from '@lingora/types'
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
 * Get a lemma by its ID. Used when the caller already has a foreign key
 * (e.g. `Card.lemmaId` in the review session) rather than a surface form.
 */
export async function getLemmaById(db: DatabaseAdapter, lemmaId: string): Promise<Lemma | null> {
  return (
    (await db.querySingle<Lemma>(`SELECT ${lemmaColumns()} FROM lemmas WHERE id = ?`, [lemmaId])) ??
    null
  )
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
 * Every lemma form already in the user's library for one language — used to tell "Word of the
 * Day" (see apps/mobile/lib/wordOfTheDay.ts) which words NOT to suggest again. Deliberately just
 * the bare forms, not full Lemma rows — this is passed straight into an AI prompt as a plain
 * exclude-list, nothing else about the lemma is needed.
 */
export async function getAllLemmaFormsForLanguage(db: DatabaseAdapter, language: LanguageCode): Promise<string[]> {
  const rows = await db.query<{ form: string }>(`SELECT form FROM lemmas WHERE language = ?`, [language])
  return rows.map((row) => row.form)
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
export async function searchLemmas(
  db: DatabaseAdapter,
  input: string,
  language: LanguageCode,
): Promise<Lemma[]> {
  const query = buildFTSQuery(input)
  if (!query) return []

  return db.query<Lemma>(
    `SELECT id, form, language, partOfSpeech, gender, plural, createdAt, updatedAt
     FROM (
       SELECT ${lemmaColumns('l')}, fts_lemmas.rank AS rank
       FROM fts_lemmas
       JOIN lemmas l ON l.rowid = fts_lemmas.rowid
       WHERE fts_lemmas MATCH ? AND l.language = ?

       UNION ALL

       SELECT ${lemmaColumns('l')}, fts_meanings.rank AS rank
       FROM fts_meanings
       JOIN meanings m ON m.rowid = fts_meanings.rowid
       JOIN cards c ON c.id = m.card_id
       JOIN lemmas l ON l.id = c.lemma_id
       WHERE fts_meanings MATCH ? AND l.language = ?
     )
     GROUP BY id
     ORDER BY MIN(rank)
     LIMIT 20`,
    [query, language, query, language],
  )
}

/** One search row as the search screen renders it: lemma + preview fields. */
export interface LemmaSearchPreview {
  lemma: Lemma
  /** Primary meaning translation of the lemma's first card, if any. */
  translation: string | null
  cefrLevel: CefrLevel | null
  /** Whether any card of this lemma is already in a deck. */
  inDeck: boolean
  /**
   * Whether this lemma has more than a bare translation — a non-empty
   * explanation, or any examples/synonyms — so the result row can offer a
   * "Details" chip only when there's actually more to see (an AI-generated
   * or word-guide-added card typically does; a plain quick-translate add
   * typically doesn't).
   */
  hasDetail: boolean
  /** How the lemma's card was created — drives the small source icon in the result row. */
  source: CardSource | null
}

/**
 * FTS5 search enriched with what the result list shows per row.
 *
 * Runs one preview lookup per hit — searchLemmas caps at 20 rows and this is
 * on-device SQLite, so the loop is cheaper than the join complexity it avoids.
 */
export async function searchLemmasWithPreview(
  db: DatabaseAdapter,
  input: string,
  language: LanguageCode,
  nativeLanguage: LanguageCode,
): Promise<LemmaSearchPreview[]> {
  const lemmas = await searchLemmas(db, input, language)
  const previews: LemmaSearchPreview[] = []

  for (const lemma of lemmas) {
    const meaning = await db.querySingle<{
      translation: string
      cefrLevel: CefrLevel
      explanation: string
      source: CardSource | null
    }>(
      `SELECT m.translation, m.cefr_level AS cefrLevel, m.explanation, c.source
       FROM meanings m
       JOIN cards c ON c.id = m.card_id
       WHERE c.lemma_id = ? AND c.native_language = ? AND m.is_primary = 1
       LIMIT 1`,
      [lemma.id, nativeLanguage],
    )
    const membership = await db.querySingle<{ n: number }>(
      `SELECT COUNT(*) AS n
       FROM deck_cards dc
       JOIN cards c ON c.id = dc.card_id
       WHERE c.lemma_id = ? AND c.native_language = ?`,
      [lemma.id, nativeLanguage],
    )
    const extras = await db.querySingle<{ n: number }>(
      `SELECT
         (SELECT COUNT(*) FROM examples ex JOIN cards c ON c.id = ex.card_id WHERE c.lemma_id = ? AND c.native_language = ?) +
         (SELECT COUNT(*) FROM synonyms sy JOIN cards c ON c.id = sy.card_id WHERE c.lemma_id = ? AND c.native_language = ?) AS n`,
      [lemma.id, nativeLanguage, lemma.id, nativeLanguage],
    )
    previews.push({
      lemma,
      translation: meaning?.translation ?? null,
      cefrLevel: meaning?.cefrLevel ?? null,
      inDeck: (membership?.n ?? 0) > 0,
      hasDetail: (meaning?.explanation.trim() ?? '') !== '' || (extras?.n ?? 0) > 0,
      source: meaning?.source ?? null,
    })
  }

  return previews
}

/**
 * All stored surface forms of a lemma, for the word-detail inflection chips.
 */
export async function getInflectionsForLemma(
  db: DatabaseAdapter,
  lemmaId: string,
): Promise<Inflection[]> {
  return db.query<Inflection>(
    `SELECT id, form AS surface, lemma_id AS lemmaId FROM inflections WHERE lemma_id = ? ORDER BY form ASC`,
    [lemmaId],
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
