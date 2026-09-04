import type { LanguageCode, MiningStatus, SentenceMineEntry } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * The sentence mining queue.
 *
 * Captured text lands here BEFORE any AI call. The user reviews the queue,
 * discards what they don't want, and only then triggers generation — so no
 * API call is ever wasted on text the user didn't ask to process.
 */

/** Raw queue row as it comes back from SQLite (booleans are 0/1). */
interface MineRow extends Omit<SentenceMineEntry, 'processed'> {
  processed: number
}

const MINE_COLUMNS = `id, raw_text AS rawText, source_type AS sourceType, source_url AS sourceUrl, source_title AS sourceTitle, status, captured_at AS capturedAt, processed, card_id AS cardId, target_language AS targetLanguage`

/** SQLite stores booleans as 0/1 — convert so callers get a real boolean. */
function toEntry(row: MineRow): SentenceMineEntry {
  return { ...row, processed: row.processed !== 0 }
}

/**
 * Get all captured passages, newest first — the mining studio passage list. Scoped to
 * targetLanguage when given, the same way getAllDecks scopes by language pair - omit it only for
 * cross-language contexts (there currently aren't any; every real caller passes the active
 * target language).
 */
export async function getAllMineEntries(db: DatabaseAdapter, targetLanguage?: LanguageCode): Promise<SentenceMineEntry[]> {
  const whereClause = targetLanguage ? ` WHERE target_language = ?` : ''
  const rows = await db.query<MineRow>(
    `SELECT ${MINE_COLUMNS} FROM sentence_mining_queue${whereClause}
     ORDER BY captured_at DESC`,
    targetLanguage ? [targetLanguage] : [],
  )
  return rows.map(toEntry)
}

/**
 * Get the unprocessed queue, oldest capture first — the mining review screen and the bottom tab
 * bar's badge count. Scoped to targetLanguage when given, same as getAllMineEntries above.
 */
export async function getPendingMineEntries(db: DatabaseAdapter, targetLanguage?: LanguageCode): Promise<SentenceMineEntry[]> {
  const conditions = ['processed = 0']
  const params: unknown[] = []
  if (targetLanguage) {
    conditions.push('target_language = ?')
    params.push(targetLanguage)
  }
  const rows = await db.query<MineRow>(
    `SELECT ${MINE_COLUMNS} FROM sentence_mining_queue
     WHERE ${conditions.join(' AND ')}
     ORDER BY captured_at ASC`,
    params,
  )
  return rows.map(toEntry)
}

/**
 * Capture a sentence into the queue. Called from clipboard capture,
 * the mobile share sheet, and later the browser extension.
 */
export async function createMineEntry(
  db: DatabaseAdapter,
  entry: SentenceMineEntry,
): Promise<void> {
  await db.execute(
    `INSERT INTO sentence_mining_queue (id, raw_text, source_type, source_url, source_title, status, captured_at, processed, card_id, target_language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.rawText,
      entry.sourceType,
      entry.sourceUrl ?? null,
      entry.sourceTitle ?? null,
      entry.status,
      entry.capturedAt,
      entry.processed ? 1 : 0,
      entry.cardId ?? null,
      entry.targetLanguage,
    ],
  )
}

/**
 * Move an entry through the processing pipeline:
 * pending → processing → done | error.
 */
export async function updateMineEntryStatus(
  db: DatabaseAdapter,
  entryId: string,
  status: MiningStatus,
): Promise<void> {
  await db.execute(`UPDATE sentence_mining_queue SET status = ? WHERE id = ?`, [status, entryId])
}

/**
 * Mark an entry processed and link it to the card that came out of it.
 */
export async function updateMineEntryProcessed(
  db: DatabaseAdapter,
  entryId: string,
  cardId: string,
): Promise<void> {
  await db.execute(
    `UPDATE sentence_mining_queue SET processed = 1, status = 'done', card_id = ? WHERE id = ?`,
    [cardId, entryId],
  )
}

/**
 * Discard a capture the user doesn't want processed.
 */
export async function deleteMineEntry(db: DatabaseAdapter, entryId: string): Promise<void> {
  await db.execute(`DELETE FROM sentence_mining_queue WHERE id = ?`, [entryId])
}

/**
 * Discard a batch of captures at once - the Mining Studio's "clear selected" action.
 */
export async function deleteMineEntries(db: DatabaseAdapter, entryIds: string[]): Promise<void> {
  if (entryIds.length === 0) return
  await db.transaction(async (tx) => {
    for (const id of entryIds) {
      await tx.execute(`DELETE FROM sentence_mining_queue WHERE id = ?`, [id])
    }
  })
}

/**
 * Discard every captured passage - the Mining Studio's "clear all" action. Scoped to
 * targetLanguage when given, so "Clear All" while viewing one language pair's passage list only
 * clears what's actually visible, not every passage captured under every other pair too.
 */
export async function deleteAllMineEntries(db: DatabaseAdapter, targetLanguage?: LanguageCode): Promise<void> {
  if (targetLanguage) {
    await db.execute(`DELETE FROM sentence_mining_queue WHERE target_language = ?`, [targetLanguage])
  } else {
    await db.execute(`DELETE FROM sentence_mining_queue`)
  }
}
