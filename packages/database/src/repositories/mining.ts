import type { MiningStatus, SentenceMineEntry } from '@lingora/types'
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

const MINE_COLUMNS = `id, raw_text AS rawText, source_type AS sourceType, source_url AS sourceUrl, source_title AS sourceTitle, status, captured_at AS capturedAt, processed, card_id AS cardId`

/** SQLite stores booleans as 0/1 — convert so callers get a real boolean. */
function toEntry(row: MineRow): SentenceMineEntry {
  return { ...row, processed: row.processed !== 0 }
}

/**
 * Get the unprocessed queue, oldest capture first — the mining review screen.
 */
export async function getPendingMineEntries(db: DatabaseAdapter): Promise<SentenceMineEntry[]> {
  const rows = await db.query<MineRow>(
    `SELECT ${MINE_COLUMNS} FROM sentence_mining_queue
     WHERE processed = 0
     ORDER BY captured_at ASC`,
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
    `INSERT INTO sentence_mining_queue (id, raw_text, source_type, source_url, source_title, status, captured_at, processed, card_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
