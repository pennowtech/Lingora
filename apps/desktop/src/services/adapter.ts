import type { DatabaseAdapter } from '@lingora/database';
import initSqlJs, { Database } from 'fts5-sql-bundle';
// @ts-ignore: Vite ?url import
import sqlWasmUrl from 'fts5-sql-bundle/dist/sql-wasm.wasm?url';

const DB_NAME = 'LingoraOfflineDb';
const STORE_NAME = 'sqlite_file';
const KEY_NAME = 'database_bytes';

function saveDbBytes(bytes: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(bytes, KEY_NAME);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function loadDbBytes(): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY_NAME);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export class SqlJsAdapter implements DatabaseAdapter {
  private db: Database;
  public loadedFromIndexedDb = false;
  public persistEnabled = false;
  private transactionLevel = 0;

  private constructor(db: Database) {
    this.db = db;
    // Enable foreign key pragma
    try {
      this.db.run('PRAGMA foreign_keys = ON;');
    } catch (err) {
      console.warn('Pragma foreign_keys setup:', err);
    }
  }

  static async create(skipLoad = false): Promise<SqlJsAdapter> {
    const SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl
    });
    const bytes = skipLoad ? null : await loadDbBytes();
    const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    const adapter = new SqlJsAdapter(db);
    adapter.loadedFromIndexedDb = !!bytes;
    return adapter;
  }

  public async persist(): Promise<void> {
    if (!this.persistEnabled) return;
    try {
      const bytes = this.db.export();
      await saveDbBytes(bytes);
    } catch (err) {
      console.warn('[SqlJsAdapter] Failed to persist database:', err);
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    this.db.run(sql, (params ?? []) as any[]);
    if (this.transactionLevel === 0) {
      await this.persist();
    }
  }

  async executeScript(sql: string): Promise<void> {
    this.db.exec(sql);
    if (this.transactionLevel === 0) {
      await this.persist();
    }
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
    const isOuter = this.transactionLevel === 0;
    if (isOuter) {
      this.db.exec('BEGIN TRANSACTION;');
    }
    this.transactionLevel++;
    try {
      const result = await fn(this);
      this.transactionLevel--;
      if (isOuter) {
        this.db.exec('COMMIT;');
        await this.persist();
      }
      return result;
    } catch (err) {
      this.transactionLevel--;
      if (isOuter) {
        try {
          this.db.exec('ROLLBACK;');
        } catch (rollbackErr) {
          console.warn('[SqlJsAdapter] Rollback failed:', rollbackErr);
        }
      }
      throw err;
    }
  }
}
