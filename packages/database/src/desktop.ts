/**
 * Desktop-only entry point: `import { BetterSQLiteAdapter } from '@lingora/database/desktop'`.
 *
 * Kept OUT of the main barrel on purpose — better-sqlite3 requires Node's
 * standard library ('fs', 'path'), so exporting it from the main entry makes
 * Metro fail to bundle the mobile app. Node consumers (the Tauri desktop app,
 * scripts) import this subpath instead.
 */
export { BetterSQLiteAdapter } from './adapters/better-sqlite'
