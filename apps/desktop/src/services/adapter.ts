import type { DatabaseAdapter } from '@lingora/database';
import initSqlJs, { Database } from 'sql.js';

export class SqlJsAdapter implements DatabaseAdapter {
  private db: Database;

  private constructor(db: Database) {
    this.db = db;
    // Enable foreign key pragma
    try {
      this.db.run('PRAGMA foreign_keys = ON;');
    } catch (err) {
      console.warn('Pragma foreign_keys setup:', err);
    }
  }

  static async create(): Promise<SqlJsAdapter> {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });
    const db = new SQL.Database();
    return new SqlJsAdapter(db);
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    this.db.run(sql, (params ?? []) as any[]);
  }

  async executeScript(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params as any[]);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  async querySingle<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows[0];
  }

  async transaction<T>(fn: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = await fn(this);
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }
}
