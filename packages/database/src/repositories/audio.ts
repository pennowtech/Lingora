import type { AudioAsset } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Pronunciation audio metadata. The audio file itself lives on the device
 * file system; these rows only store the path and recording metadata.
 */

const AUDIO_COLUMNS = `id, card_id AS cardId, file_path AS filePath, accent, duration_ms AS durationMs, created_at AS createdAt`

/**
 * Get all audio recordings of a card (one per accent, eventually).
 */
export async function getAudioForCard(db: DatabaseAdapter, cardId: string): Promise<AudioAsset[]> {
  return db.query<AudioAsset>(`SELECT ${AUDIO_COLUMNS} FROM audio WHERE card_id = ?`, [cardId])
}

/**
 * Create an audio metadata row after the file has been saved to disk.
 */
export async function createAudio(db: DatabaseAdapter, asset: AudioAsset): Promise<void> {
  await db.execute(
    `INSERT INTO audio (id, card_id, file_path, accent, duration_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      asset.id,
      asset.cardId,
      asset.filePath,
      asset.accent ?? null,
      asset.durationMs ?? null,
      asset.createdAt,
    ],
  )
}

/**
 * Delete an audio metadata row. The caller is responsible for
 * deleting the file itself from the device.
 */
export async function deleteAudio(db: DatabaseAdapter, audioId: string): Promise<void> {
  await db.execute(`DELETE FROM audio WHERE id = ?`, [audioId])
}
