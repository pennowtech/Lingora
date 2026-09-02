import type { DatabaseAdapter } from '../adapter'
import { splitSqlStatements } from './sql-split'

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
function sanitizeParams(params?: unknown[]): unknown[] {
  if (!params || !Array.isArray(params)) return []
  return params.map((p) => (p === undefined ? null : p))
}

export class ExpoSQLiteAdapter implements DatabaseAdapter {
  private readonly db: ExpoSQLiteDatabase

  // Serializes every call through this adapter instance. React Query fires
  // many screens' queries concurrently once the app is ready (Promise.all in
  // loadHomeStats, the tab-bar mine-queue badge, etc.) — without this queue,
  // overlapping runAsync/getAllAsync/execAsync calls on the same underlying
  // SQLite connection corrupt native memory (observed as a Scudo "invalid
  // chunk state" SIGABRT deep inside expo-sqlite's C library on Android).
  // A transaction occupies one queue slot for its whole duration, so calls
  // made through the nested adapter it receives never race anything else.
  private queue: Promise<unknown> = Promise.resolve()

  constructor(db: ExpoSQLiteDatabase) {
    this.db = db
  }

  private enqueue<T>(run: () => Promise<T>): Promise<T> {
    const result = this.queue.then(run, run)
    this.queue = result.then(
      () => undefined,
      () => undefined,
    )
    return result
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
    const trimmed = typeof sql === 'string' ? sql.trim() : ''
    if (!trimmed) return
    const safeParams = sanitizeParams(params)
    await this.enqueue(() => this.db.runAsync(trimmed, safeParams))
  }

  // Split and run one statement at a time via runAsync rather than handing
  // the whole script to execAsync — see sql-split.ts for why.
  async executeScript(sql: string): Promise<void> {
    if (!sql || typeof sql !== 'string' || !sql.trim()) return
    const statements = splitSqlStatements(sql)
    await this.enqueue(async () => {
      for (const statement of statements) {
        const trimmed = statement.trim()
        if (trimmed && trimmed !== ';') {
          await this.db.runAsync(trimmed, [])
        }
      }
    })
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const trimmed = typeof sql === 'string' ? sql.trim() : ''
    if (!trimmed) return []
    const safeParams = sanitizeParams(params)
    return this.enqueue(() => this.db.getAllAsync<T>(trimmed, safeParams))
  }

  async querySingle<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const trimmed = typeof sql === 'string' ? sql.trim() : ''
    if (!trimmed) return undefined
    const safeParams = sanitizeParams(params)
    const result = await this.enqueue(() => this.db.getFirstAsync<T>(trimmed, safeParams))
    return result ?? undefined
  }

  /**
   * Run multiple operations inside one exclusive SQLite transaction.
   *
   * expo-sqlite hands the callback a transaction-scoped connection; statements
   * run inside the callback through that connection are committed together or
   * rolled back together if the callback throws.
   *
   * expo-sqlite's own `withExclusiveTransactionAsync` awaits its task but
   * discards whatever it returns and always resolves `undefined` (confirmed
   * against its runtime source, not just its .d.ts) — every caller here that
   * relies on `transaction()`'s return value (persistWordGeneration,
   * persistWordGuideAsCard, ...) would silently get `undefined` on a real
   * device without this. Captured via a closure variable instead of relying
   * on expo-sqlite to forward it.
   */
  async transaction<T>(fn: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      let result: T
      await this.db.withExclusiveTransactionAsync(async (txn) => {
        result = await fn(new ExpoSQLiteAdapter(txn))
      })
      return result!
    })
  }
}
