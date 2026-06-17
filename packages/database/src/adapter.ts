/**
 * Database adapter.
 *
 * The contract that every database adapter must fulfill.
 * Two concrete implementations are provided:
 * - BetterSQLiteAdapter: desktop, uses better-sqlite3
 * - ExpoSQLiteAdapter: mobile, uses expo-sqlite
 *
 * Rest of the app only ever import this interface, and never the concrete implementations directly. This allows us
 * to swap out the database implementation without affecting the rest of the app.
 */

export interface DatabaseAdapter {
  // Run a SQL statement that does not return any rows (e.g. CREATE TABLE, INSERT, UPDATE, DELETE)
  execute: (sql: string, params?: unknown[]) => Promise<void>

  // Run a SQL statement that returns rows (e.g. SELECT)
  //The generic type T is the type of the rows returned by the query. The caller is
  // responsible for ensuring that the query returns rows of the expected type.
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>

  // Run a SQL statement that returns a single row (e.g. SELECT with LIMIT 1)
  querySingle: <T = unknown>(sql: string, params?: unknown[]) => Promise<T | undefined>

  //Run multiple operations atomaically. If any operation fails, the entire transaction is rolled back.
  //This will be used whenever writing to multiple tables that must succeed or fail together. For example, when
  // inserting a new card, we must also insert its examples and synonyms. If any of these inserts fail,
  // we must roll back the entire transaction to maintain data integrity.
  transaction: <T>(fn: (adapter: DatabaseAdapter) => Promise<T>) => Promise<T>
}
