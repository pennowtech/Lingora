import { SqlJsAdapter } from './adapter';
import { migrate, seedDatabase, type DatabaseAdapter } from '@lingora/database';

let dbInstance: DatabaseAdapter | null = null;

export async function getDesktopDatabase(): Promise<DatabaseAdapter> {
  if (dbInstance) return dbInstance;

  try {
    console.log('[Desktop DB] Initializing SQLite database adapter...');
    const adapter = await SqlJsAdapter.create();
    let isFresh = !adapter.loadedFromIndexedDb;

    // Verify if loaded database has tables; if not (corrupted state), treat as fresh
    if (!isFresh) {
      try {
        const lemmasTableExists = await adapter.querySingle<any>(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='lemmas'`
        );
        if (!lemmasTableExists) {
          console.warn('[Desktop DB] lemmas table missing from loaded database cache. Forcing fresh migration...');
          isFresh = true;
        }
      } catch (e) {
        isFresh = true;
      }
    }

    // Disable database persistence during migrations and seeding for performance and safety
    adapter.persistEnabled = false;

    console.log('[Desktop DB] Running schema migrations (0001 - 0015)...');
    await migrate(adapter);

    if (isFresh) {
      console.log('[Desktop DB] Seeding database with sample German vocabulary...');
      await seedDatabase(adapter);
    } else {
      console.log('[Desktop DB] Database loaded successfully from IndexedDB cache.');
    }

    // Re-enable persistence and save the initial setup state
    adapter.persistEnabled = true;
    await adapter.persist();

    dbInstance = adapter;
    return dbInstance;
  } catch (err) {
    console.error('[Desktop DB] Error initializing database. Clearing IndexedDB cache and starting fresh...', err);
    
    // Clear IndexedDB cache database
    try {
      indexedDB.deleteDatabase('LingoraOfflineDb');
    } catch (e) {}

    // Retry with a fresh in-memory database configuration (skip loading IndexedDB cache)
    const adapter = await SqlJsAdapter.create(true);
    adapter.persistEnabled = false;
    
    await migrate(adapter);
    await seedDatabase(adapter);
    
    adapter.persistEnabled = true;
    await adapter.persist();

    dbInstance = adapter;
    return dbInstance;
  }
}
