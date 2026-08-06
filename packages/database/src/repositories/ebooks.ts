import type { DatabaseAdapter } from '../adapter'

export interface Ebook {
  id: string
  title: string
  author?: string | null
  filePath: string
  coverUri?: string | null
  currentCfi?: string | null
  progressPercent: number
  createdAt: number
  lastReadAt: number
}

const EBOOK_COLUMNS = `id, title, author, file_path AS filePath, cover_uri AS coverUri, current_cfi AS currentCfi, progress_percent AS progressPercent, created_at AS createdAt, last_read_at AS lastReadAt`

/**
 * Get all imported eBooks, ordered by last read timestamp (most recently read first).
 */
export async function getAllEbooks(db: DatabaseAdapter): Promise<Ebook[]> {
  return db.query<Ebook>(
    `SELECT ${EBOOK_COLUMNS} FROM ebooks ORDER BY last_read_at DESC`,
  )
}

/**
 * Get a single eBook by ID.
 */
export async function getEbookById(db: DatabaseAdapter, id: string): Promise<Ebook | null> {
  const result = await db.querySingle<Ebook>(
    `SELECT ${EBOOK_COLUMNS} FROM ebooks WHERE id = ?`,
    [id],
  )
  return result ?? null
}

/**
 * Save a newly imported eBook.
 */
export async function saveEbook(db: DatabaseAdapter, ebook: Ebook): Promise<void> {
  await db.execute(
    `INSERT INTO ebooks (id, title, author, file_path, cover_uri, current_cfi, progress_percent, created_at, last_read_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ebook.id,
      ebook.title,
      ebook.author ?? null,
      ebook.filePath,
      ebook.coverUri ?? null,
      ebook.currentCfi ?? null,
      ebook.progressPercent,
      ebook.createdAt,
      ebook.lastReadAt,
    ],
  )
}

/**
 * Update current reading position (CFI) and completion percentage.
 */
export async function updateEbookProgress(
  db: DatabaseAdapter,
  id: string,
  currentCfi: string,
  progressPercent: number,
): Promise<void> {
  await db.execute(
    `UPDATE ebooks SET current_cfi = ?, progress_percent = ?, last_read_at = ? WHERE id = ?`,
    [currentCfi, progressPercent, Date.now(), id],
  )
}

/**
 * Delete an eBook entry from the library.
 */
export async function deleteEbook(db: DatabaseAdapter, id: string): Promise<void> {
  await db.execute(`DELETE FROM ebooks WHERE id = ?`, [id])
}
