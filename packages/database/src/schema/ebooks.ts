import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * EBOOKS
 *
 * Stores imported EPUB ebooks and their reading progress (CFI position, completion percentage).
 */
export const ebooks = sqliteTable('ebooks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author'),
  filePath: text('file_path').notNull(),
  coverUri: text('cover_uri'),
  currentCfi: text('current_cfi'),
  progressPercent: integer('progress_percent').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  lastReadAt: integer('last_read_at').notNull(),
})
