export type { DatabaseAdapter } from './adapter'
export { buildFTSQuery, FTS_TABLES, FTS5_SETUP_SQL, FTS5_TEARDOWN_SQL } from './fts'
export * from './schema'

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

export { BetterSQLiteAdapter } from './adapters/better-sqlite'
export { ExpoSQLiteAdapter, type ExpoSQLiteDatabase } from './adapters/expo'

export { seedDatabase } from './seed_dummy_data'
