import { DatabaseSync } from 'node:sqlite'
import type { DatabaseAdapter } from '@lingora/database'

/**
 * Test-only DatabaseAdapter over Node's built-in `node:sqlite`.
 *
 * better-sqlite3's native build is blocked in this workspace
 * (pnpm-workspace.yaml `allowBuilds: false`), so tests run against an
 * in-memory node:sqlite database instead. Mirrors BetterSQLiteAdapter:
 * synchronous driver wrapped in the async DatabaseAdapter contract, explicit
 * BEGIN/COMMIT/ROLLBACK transactions on the shared connection.
 *
 * Not exported from the package barrel — tests import it directly.
 */
export class NodeSqliteAdapter implements DatabaseAdapter {
  private db: DatabaseSync

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path)
    this.db.exec('PRAGMA foreign_keys = ON')
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await Promise.resolve(this.db.prepare(sql).run(...toSqliteParams(params)))
  }

  async executeScript(sql: string): Promise<void> {
    await Promise.resolve(this.db.exec(sql))
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    return await Promise.resolve(this.db.prepare(sql).all(...toSqliteParams(params)) as T[])
  }

  async querySingle<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const result = this.db.prepare(sql).get(...toSqliteParams(params))
    return await Promise.resolve(result as T | undefined)
  }

  async transaction<T>(fn: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN')
    try {
      const result = await fn(this)
      this.db.exec('COMMIT')
      return result
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }

  close(): void {
    this.db.close()
  }
}

type SqliteValue = string | number | bigint | Uint8Array | null

/** node:sqlite rejects undefined and booleans — normalize like a driver would. */
function toSqliteParams(params?: unknown[]): SqliteValue[] {
  return (params ?? []).map((value) => {
    if (value === undefined) return null
    if (typeof value === 'boolean') return value ? 1 : 0
    return value as SqliteValue
  })
}
