export type { DatabaseAdapter } from './adapter'
export { buildFTSQuery, FTS_TABLES, FTS5_SETUP_SQL, FTS5_TEARDOWN_SQL } from './fts'
export * from './schema'

export {
  BACKUP_FORMAT_VERSION,
  BackupValidationError,
  createBackup,
  parseBackup,
  restoreBackup,
  type BackupPayload,
  type BackupSettings,
  type BackupTableName,
  type RestoreResult,
} from './backup'

export {
  ALL_MIGRATIONS,
  getCurrentSchemaVersion,
  migrate,
  rollback,
  type Migration,
} from './migrations'

export * from './repositories/ai-cache'
export * from './repositories/audio'
export * from './repositories/cards'
export * from './repositories/cloze'
export * from './repositories/clusters'
export * from './repositories/decks'
export * from './repositories/evaluations'
export * from './repositories/examples'
export * from './repositories/generation'
export * from './repositories/lemmas'
export * from './repositories/mining'
export * from './repositories/phrases'
export * from './repositories/prompts'
export * from './repositories/reviews'
export * from './repositories/synonyms'
export * from './repositories/tags'
export * from './repositories/templates'

// BetterSQLiteAdapter is deliberately NOT exported here: it pulls in Node's
// 'fs'/'path', which breaks Metro bundling for the mobile app. Desktop/Node
// consumers import it from '@lingora/database/desktop'.
export { ExpoSQLiteAdapter, type ExpoSQLiteDatabase } from './adapters/expo'
export { splitSqlStatements } from './adapters/sql-split'

export { seedDatabase } from './seed_dummy_data'
