import type { Migration } from './types'

export const ebooks: Migration = {
  version: 16,
  name: 'ebooks',
  up: async (db) => {
    await db.executeScript(`
      CREATE TABLE IF NOT EXISTS ebooks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        file_path TEXT NOT NULL,
        cover_uri TEXT,
        current_cfi TEXT,
        progress_percent INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        last_read_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS ebooks_last_read_idx ON ebooks(last_read_at);
    `)
  },
  down: async (db) => {
    await db.executeScript(`
      DROP INDEX IF EXISTS ebooks_last_read_idx;
      DROP TABLE IF EXISTS ebooks;
    `)
  },
}
