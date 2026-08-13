import { SqlJsAdapter } from './adapter';
import { migrate, seedDatabase, type DatabaseAdapter } from '@lingora/database';

let dbInstance: DatabaseAdapter | null = null;

export async function getDesktopDatabase(): Promise<DatabaseAdapter> {
  if (dbInstance) return dbInstance;

  console.log('[Desktop DB] Initializing SQLite database adapter...');
  const adapter = await SqlJsAdapter.create();

  console.log('[Desktop DB] Running schema migrations (0001 - 0015)...');
  await migrate(adapter);

  console.log('[Desktop DB] Seeding database with sample German vocabulary...');
  await seedDatabase(adapter);

  dbInstance = adapter;
  return dbInstance;
}
