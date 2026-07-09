import type { DatabaseAdapter } from '../adapter'
import { initialSchema } from './0001_initial_schema'
import { fts5Search } from './0002_fts5_search'
import { aiCache } from './0003_ai_cache'
import type { Migration } from './types'

export type { Migration } from './types'

/**
 * Every migration, in order. New migrations are appended here with the next
 * consecutive version number.
 */
export const ALL_MIGRATIONS: readonly Migration[] = [initialSchema, fts5Search, aiCache]

/**
 * The bookkeeping table. One row per applied migration, so we always know
 * exactly which schema version a database is on — on any device, after any
 * app update.
 */
const MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
`

/**
 * The schema version this database is currently on (0 = fresh database).
 */
export async function getCurrentSchemaVersion(db: DatabaseAdapter): Promise<number> {
  await db.executeScript(MIGRATIONS_TABLE_SQL)
  const row = await db.querySingle<{ version: number | null }>(
    `SELECT MAX(version) AS version FROM schema_migrations`,
  )
  return row?.version ?? 0
}

/**
 * Apply every migration that hasn't been applied yet, oldest first.
 *
 * Each migration runs inside its own transaction together with its bookkeeping
 * row: either the schema change AND the version record both land, or neither
 * does. A failed migration therefore leaves the database on the last good
 * version, and the next call retries from there.
 *
 * Call this once at app startup, right after opening the database.
 *
 * @returns The versions that were applied in this run (empty if up to date).
 */
export async function migrate(db: DatabaseAdapter): Promise<number[]> {
  const currentVersion = await getCurrentSchemaVersion(db)
  const pending = ALL_MIGRATIONS.filter((m) => m.version > currentVersion)
  const applied: number[] = []

  for (const migration of pending) {
    await db.transaction(async (tx) => {
      await tx.executeScript(migration.up)
      await tx.execute(
        `INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)`,
        [migration.version, migration.name, Date.now()],
      )
    })
    applied.push(migration.version)
  }

  return applied
}

/**
 * Roll back the most recent migrations, newest first.
 *
 * Like migrate(), each rollback runs in a transaction with its bookkeeping
 * delete. Mainly a development tool — production schema fixes should be new
 * forward migrations, not rollbacks.
 *
 * @param steps How many migrations to undo (default 1).
 * @returns The versions that were rolled back in this run.
 */
export async function rollback(db: DatabaseAdapter, steps = 1): Promise<number[]> {
  const currentVersion = await getCurrentSchemaVersion(db)
  const toRollBack = ALL_MIGRATIONS.filter((m) => m.version <= currentVersion)
    .sort((a, b) => b.version - a.version)
    .slice(0, steps)
  const rolledBack: number[] = []

  for (const migration of toRollBack) {
    await db.transaction(async (tx) => {
      await tx.executeScript(migration.down)
      await tx.execute(`DELETE FROM schema_migrations WHERE version = ?`, [migration.version])
    })
    rolledBack.push(migration.version)
  }

  return rolledBack
}
