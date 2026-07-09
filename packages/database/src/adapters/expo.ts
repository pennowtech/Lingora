import type { DatabaseAdapter } from '../adapter'

/**
 * The subset of expo-sqlite's SQLiteDatabase that this adapter needs.
 *
 * Declared structurally instead of importing from 'expo-sqlite' so this shared
 * package compiles without Expo installed — expo-sqlite is a peerDependency
 * that only apps/mobile actually provides. The real SQLiteDatabase returned by
 * openDatabaseAsync() satisfies this shape as-is.
 */
export interface ExpoSQLiteDatabase {
  execAsync(source: string): Promise<void>
  runAsync(source: string, params: unknown[]): Promise<unknown>
  getAllAsync<T>(source: string, params: unknown[]): Promise<T[]>
  getFirstAsync<T>(source: string, params: unknown[]): Promise<T | null>
  withExclusiveTransactionAsync<T>(task: (txn: ExpoSQLiteDatabase) => Promise<T>): Promise<T>
}

/**
 * Mobile Database Adapter
 *
 * Wraps expo-sqlite's async API in the shared DatabaseAdapter interface.
 *
 * Usage in apps/mobile:
 *
 *   import { openDatabaseAsync } from 'expo-sqlite'
 *   import { ExpoSQLiteAdapter, migrate } from '@lingora/database'
 *
 *   const db = await ExpoSQLiteAdapter.create(await openDatabaseAsync('lingora.db'))
 *   await migrate(db)
 */
export class ExpoSQLiteAdapter implements DatabaseAdapter {
  private readonly db: ExpoSQLiteDatabase

  constructor(db: ExpoSQLiteDatabase) {
    this.db = db
  }

  /**
   * Preferred way to construct the adapter: applies the connection pragmas
   * (which are async in expo-sqlite, so they can't run in the constructor).
   *
   * - foreign_keys: SQLite doesn't enforce foreign keys by default — without
   *   this, cascade deletes and referential integrity silently don't work.
   * - WAL: makes reads and writes non-blocking.
   */
  static async create(db: ExpoSQLiteDatabase): Promise<ExpoSQLiteAdapter> {
    await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')
    return new ExpoSQLiteAdapter(db)
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await this.db.runAsync(sql, params ?? [])
  }

  // execAsync runs a multi-statement script without parameter binding —
  // exactly what the migration runner needs for DDL.
  async executeScript(sql: string): Promise<void> {
    await this.db.execAsync(sql)
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.db.getAllAsync<T>(sql, params ?? [])
  }

  async querySingle<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    return (await this.db.getFirstAsync<T>(sql, params ?? [])) ?? undefined
  }

  /**
   * Run multiple operations inside one exclusive SQLite transaction.
   *
   * expo-sqlite hands the callback a transaction-scoped connection; statements
   * run inside the callback through that connection are committed together or
   * rolled back together if the callback throws.
   */
  async transaction<T>(fn: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    return this.db.withExclusiveTransactionAsync(async (txn) => fn(new ExpoSQLiteAdapter(txn)))
  }
}
