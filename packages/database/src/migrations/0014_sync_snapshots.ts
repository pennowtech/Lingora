import type { Migration } from './types'

/**
 * Migration 0014 — cloud sync's local "last synced" snapshot table.
 *
 * `packages/database/src/sync/` does a row-level sync (not per-field — most tables here have no
 * per-row `updated_at` to arbitrate a field-level merge on, unlike `lemmas`/`decks`/`cards`/
 * `templates`) against whichever `CloudSyncBackend` apps/mobile wires in. `sync_snapshots` holds
 * one row per (table, record) as of the last successful sync — the "base" a 3-way compare needs:
 * comparing current-local vs base tells us what changed locally since last sync; comparing
 * current-remote vs base tells us what changed remotely. A record present in the snapshot but
 * missing from the live table now is exactly a local delete since the last sync — no separate
 * tombstone table needed, the snapshot already remembers it existed.
 */
export const syncSnapshots: Migration = {
  version: 14,
  name: 'sync_snapshots',
  up: `
CREATE TABLE IF NOT EXISTS sync_snapshots (
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT NOT NULL,
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (table_name, record_id)
);
CREATE INDEX IF NOT EXISTS sync_snapshots_table_idx ON sync_snapshots(table_name);
`,
  down: `DROP TABLE IF EXISTS sync_snapshots;`,
}
