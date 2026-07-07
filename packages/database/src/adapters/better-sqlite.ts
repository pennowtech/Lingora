import Database from 'better-sqlite3'
import type { DatabaseAdapter } from '../adapter'

/**
 * Desktop Database Adapter
 *
 * This adapter uses better-sqlite3 to provide a synchronous API for SQLite. We wrap the synchronous API in a
 * async (Promise-based) interface to conform to the DatabaseAdapter interface, which is async because the
 * ExpoSQLiteAdapter is async. This allows us to use the same interface for both desktop and mobile, even
 * though the underlying implementations are different.
 *
 * better-sqlite3 is synchronous by design, which makes it faster and simpler to use than the async API provided by
 * expo-sqlite. However it is not compatible with React Native or Expo, which is why we have a separate adapter for mobile.
 *
 * The BetterSQLiteAdapter is intended for use in desktop applications (e.g. Electron) where better-sqlite3 can be used.
 */
export class BetterSQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)

    // Enforce foreign key constraints.
    // SQLite doesn't enforce them by default — you have
    // to opt in per connection. Without this pragma,
    // cascade deletes and referential integrity don't work.
    this.db.pragma('foreign_keys = ON')

    // Enable WAL mode — Write-Ahead Logging.
    // Makes reads and writes non-blocking and
    // significantly improves concurrent performance.
    this.db.pragma('journal_mode = WAL')

    // Note: schema creation (tables, indexes, FTS5) is NOT done here.
    // Call migrate(adapter) from the migrations module after constructing
    // the adapter — the migration runner owns the schema.
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await Promise.resolve(this.db.prepare(sql).run(...(params ?? [])))
  }

  // db.exec runs a multi-statement script without parameter binding —
  // exactly what the migration runner needs for DDL.
  async executeScript(sql: string): Promise<void> {
    await Promise.resolve(this.db.exec(sql))
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    return await Promise.resolve(this.db.prepare(sql).all(params ?? []) as T[])
  }

  async querySingle<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const result = this.db.prepare(sql).get(params ?? [])
    return await Promise.resolve(result as T | undefined)
  }

  /**
   * Run multiple operations inside one SQLite transaction.
   *
   * better-sqlite3's transaction helper is synchronous and cannot safely wrap an async callback.
   * Explicit BEGIN / COMMIT / ROLLBACK keeps the shared async DatabaseAdapter contract while using the same connection.
   */
  async transaction<T>(fn: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN')
    try {
      const result = await fn(this)
      this.db.exec('COMMIT')
      return result
    } catch (error) {
      this.db.exec('ROLLBACK')
      console.error('Transaction failed:', error)
      throw error
    }
  }

  //close the database connection when the adapter is no longer needed. This is important to free up resources and avoid memory leaks.
  close(): void {
    this.db.close()
  }
}
