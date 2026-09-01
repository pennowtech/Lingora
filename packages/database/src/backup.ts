import { z } from 'zod'
import { logger } from '@lingora/observability'
import type { DatabaseAdapter } from './adapter'

const exportLog = logger.child({ feature: 'export', component: 'backup' })
const importLog = logger.child({ feature: 'import', component: 'backup' })

/**
 * JSON backup / restore.
 *
 * A full raw dump-and-reload of every user-owned table — not a repository-
 * level export — so it round-trips exactly what's on disk (including FSRS
 * card state and review history) without re-deriving anything. API keys live
 * in SecureStore, never in the database, so they can never end up in a
 * backup file by construction.
 *
 * Restore policy is full replace: every table below is cleared and reloaded
 * from the backup inside one transaction. This is the simplest conflict
 * policy that's still safe and easy to explain to a user ("restoring
 * replaces what's on this device"); a merge policy is not implemented.
 */

export const BACKUP_FORMAT_VERSION = 1

/**
 * Every column of every backed-up table, used both to build restore INSERTs
 * and to reject a backup file that carries unrecognized columns. Order
 * matters: FK-safe, parents before children. ai_cache (regenerable) and
 * sync_queue (Phase 7 internal) are deliberately excluded — neither is user
 * data.
 */
export const TABLE_COLUMNS = {
  lemmas: ['id', 'form', 'language', 'gender', 'plural', 'part_of_speech', 'created_at', 'updated_at'],
  inflections: ['id', 'form', 'lemma_id', 'features', 'created_at', 'updated_at'],
  decks: ['id', 'name', 'parent_id', 'created_at', 'updated_at', 'emoji', 'enabled_question_types', 'target_language', 'native_language'],
  meaning_clusters: ['id', 'label', 'description', 'lemma_id', 'cefr_level', 'order_index', 'more_info'],
  cards: ['id', 'lemma_id', 'deck_id', 'type', 'primary_meaning_id', 'created_at', 'updated_at', 'suspended_at', 'source', 'native_language'],
  meanings: [
    'id',
    'card_id',
    'meaning_cluster_id',
    'translation',
    'explanation',
    'usage',
    'is_primary',
    'cefr_level',
    'order_index',
  ],
  examples: [
    'id',
    'card_id',
    'meaning_cluster_id',
    'sentence',
    'translation',
    'is_selected',
    'generation_meta_data_id',
    'grammar_tags',
    'context_tags',
    'cefr_level',
  ],
  synonyms: ['id', 'card_id', 'meaning_cluster_id', 'synonym', 'nuance', 'cefr_level', 'formality_level'],
  phrases: ['id', 'card_id', 'expression', 'meaning', 'example_sentence', 'example_translation', 'cefr_level'],
  cloze_cards: ['id', 'card_id', 'sentence', 'cloze', 'translation', 'difficulty', 'cefr_level'],
  audio: ['id', 'card_id', 'file_path', 'accent', 'duration_ms', 'created_at'],
  deck_cards: ['id', 'deck_id', 'card_id', 'added_at'],
  tags: ['id', 'name'],
  card_tags: ['id', 'card_id', 'tag_id'],
  templates: [
    'id',
    'name',
    'type',
    'front_template',
    'back_template',
    'styles',
    'is_default',
    'created_at',
    'updated_at',
  ],
  prompt_versions: ['id', 'name', 'version', 'template', 'created_at', 'deprecated'],
  generation_metadata: [
    'id',
    'card_id',
    'provider',
    'model',
    'prompt_version',
    'generated_at',
    'tokens_used',
    'latency_ms',
  ],
  card_states: [
    'card_id',
    'state',
    'stability',
    'difficulty',
    'retrievability',
    'lapses',
    'last_reviewed_at',
    'next_review_date',
    'reps',
    'learning_steps',
  ],
  cloze_states: [
    'card_id',
    'state',
    'stability',
    'difficulty',
    'retrievability',
    'lapses',
    'last_reviewed_at',
    'next_review_date',
    'reps',
    'learning_steps',
  ],
  review_events: ['id', 'card_id', 'review_date', 'rating', 'duration_ms', 'question_type'],
  sentence_mining_queue: [
    'id',
    'raw_text',
    'source_title',
    'source_type',
    'source_url',
    'status',
    'captured_at',
    'processed',
    'card_id',
  ],
  evaluations: ['id', 'target_type', 'target_id', 'rating', 'reason', 'note', 'created_at'],
  card_chat_messages: ['id', 'card_id', 'role', 'content', 'created_at'],
} as const

export type BackupTableName = keyof typeof TABLE_COLUMNS

/** Insert order (FK-safe: parents before children); restore deletes in the reverse order. */
export const TABLE_ORDER: readonly BackupTableName[] = [
  'lemmas',
  'inflections',
  'decks',
  'meaning_clusters',
  'cards',
  'meanings',
  'examples',
  'synonyms',
  'phrases',
  'cloze_cards',
  'audio',
  'deck_cards',
  'tags',
  'card_tags',
  'templates',
  'prompt_versions',
  'generation_metadata',
  'card_states',
  'cloze_states',
  'review_events',
  'sentence_mining_queue',
  'evaluations',
  'card_chat_messages',
]

/** Non-secret preferences worth restoring — never an API key (those stay in SecureStore only). */
export interface BackupSettings {
  defaultCefr?: string
  translationProvider?: string
  generationProvider?: string
}

export interface BackupPayload {
  formatVersion: number
  exportedAt: number
  appVersion: string
  settings: BackupSettings
  tables: Partial<Record<BackupTableName, Record<string, unknown>[]>>
}

const backupRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))

const backupSchema = z.object({
  formatVersion: z.number(),
  exportedAt: z.number(),
  appVersion: z.string(),
  settings: z.object({
    defaultCefr: z.string().optional(),
    translationProvider: z.string().optional(),
    generationProvider: z.string().optional(),
  }),
  tables: z.record(z.string(), z.array(backupRowSchema)),
})

export class BackupValidationError extends Error {
  constructor(
    message: string,
    readonly issues: readonly string[],
  ) {
    super(message)
    this.name = 'BackupValidationError'
  }
}

/**
 * Parses and validates a backup file's contents before anything touches the
 * database. Rejects unparseable JSON, an unsupported format version, unknown
 * tables, and unrecognized columns — the last two catch a hand-edited or
 * corrupted file without needing a full per-row schema for every table.
 */
export function parseBackup(raw: string): BackupPayload {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    importLog.warn('import.restore_validation_failed', { message: 'Backup file was not valid JSON' })
    throw new BackupValidationError('This file is not valid JSON.', [])
  }

  const result = backupSchema.safeParse(json)
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    importLog.warn('import.restore_validation_failed', {
      message: 'Backup file did not match the expected schema',
      metadata: { itemCount: issues.length },
    })
    throw new BackupValidationError('This file does not match the Lingora backup format.', issues.slice(0, 20))
  }

  const data = result.data
  if (data.formatVersion !== BACKUP_FORMAT_VERSION) {
    importLog.warn('import.restore_validation_failed', {
      message: 'Backup file has an unsupported format version',
      metadata: { schemaVersion: String(data.formatVersion) },
    })
    throw new BackupValidationError(
      `This backup was made with a newer or older app version (format ${data.formatVersion}); this app supports format ${BACKUP_FORMAT_VERSION}.`,
      [],
    )
  }

  const issues: string[] = []
  for (const [tableName, rows] of Object.entries(data.tables)) {
    if (!isBackupTableName(tableName)) {
      issues.push(`Unknown table "${tableName}".`)
      continue
    }
    const allowedColumns = new Set<string>(TABLE_COLUMNS[tableName])
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!allowedColumns.has(key)) issues.push(`Unexpected column "${key}" in table "${tableName}".`)
      }
    }
  }
  if (issues.length > 0) {
    importLog.warn('import.restore_validation_failed', {
      message: 'Backup file contains unrecognized tables or columns',
      metadata: { itemCount: issues.length },
    })
    throw new BackupValidationError('This backup file contains data this app version does not recognize.', issues.slice(0, 20))
  }

  return data as BackupPayload
}

function isBackupTableName(value: string): value is BackupTableName {
  return Object.prototype.hasOwnProperty.call(TABLE_COLUMNS, value)
}

/** Reads every backed-up table plus the non-secret settings the caller supplies. */
export async function createBackup(
  db: DatabaseAdapter,
  settings: BackupSettings,
  appVersion: string,
): Promise<BackupPayload> {
  const startedAt = Date.now()
  exportLog.info('export.backup_started', { message: 'JSON backup export started' })

  const tables: BackupPayload['tables'] = {}
  let rowCount = 0
  for (const tableName of TABLE_ORDER) {
    const rows = await db.query<Record<string, unknown>>(`SELECT * FROM ${tableName}`)
    tables[tableName] = rows
    rowCount += rows.length
  }

  exportLog.info('export.backup_completed', {
    message: 'JSON backup export completed',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { itemCount: rowCount },
  })

  return { formatVersion: BACKUP_FORMAT_VERSION, exportedAt: Date.now(), appVersion, settings, tables }
}

/** `IN (?, ?, ...)` for a non-empty array, or `IN (NULL)` (matches nothing) for an empty one — SQL doesn't allow a literal empty `IN ()`. */
function inClause(values: readonly string[]): { sql: string; params: string[] } {
  if (values.length === 0) return { sql: '(NULL)', params: [] }
  return { sql: `(${values.map(() => '?').join(', ')})`, params: [...values] }
}

/**
 * Same `.lem` payload shape as `createBackup`, but filtered down to one
 * deck's own data — a "share this deck" file, not a full-library backup.
 * Export-only by design: `restoreBackup`'s full-replace policy has no
 * matching partial-restore mode, so a deck `.lem` isn't meant to be
 * restored back through this app (it's for sharing/inspection, same
 * audience as the CSV/Markdown/Anki exports).
 *
 * `templates` and `prompt_versions` are small reference tables included in
 * full regardless of deck (a deck file is more useful with its rendering
 * template attached); `sentence_mining_queue` and `evaluations` are omitted
 * entirely (neither is deck-scoped data — mining queue entries predate
 * having a card at all, and evaluation history isn't essential to a shared
 * deck).
 *
 * Every card in the deck exports with its full content regardless of `cards.source` — an earlier
 * version of this function stripped meanings/examples/synonyms/phrases down to a bare reference
 * for word-guide-sourced cards (the idea being that dictionary content installed locally shouldn't
 * be redistributed), but for a deck built mostly or entirely from word-guide lookups that produced
 * a `.lem` file with empty content tables — a badly broken result for the file's actual purpose
 * (sharing/inspection). Reverted; full content export is simpler and actually useful.
 */
export async function createDeckBackup(
  db: DatabaseAdapter,
  deckId: string,
  settings: BackupSettings,
  appVersion: string,
): Promise<BackupPayload> {
  const startedAt = Date.now()
  exportLog.info('export.deck_backup_started', { message: 'Deck-scoped .lem export started' })

  const cardRows = await db.query<{ id: string }>(`SELECT card_id AS id FROM deck_cards WHERE deck_id = ?`, [deckId])
  const cardIds = cardRows.map((r) => r.id)
  const cardIn = inClause(cardIds)

  const lemmaRows =
    cardIds.length > 0
      ? await db.query<{ id: string }>(`SELECT DISTINCT lemma_id AS id FROM cards WHERE id IN ${cardIn.sql}`, cardIn.params)
      : []
  const lemmaIn = inClause(lemmaRows.map((r) => r.id))

  const tagRows =
    cardIds.length > 0
      ? await db.query<{ id: string }>(`SELECT DISTINCT tag_id AS id FROM card_tags WHERE card_id IN ${cardIn.sql}`, cardIn.params)
      : []
  const tagIn = inClause(tagRows.map((r) => r.id))

  const FILTERS: Partial<Record<BackupTableName, { where: string; params: string[] }>> = {
    lemmas: { where: `id IN ${lemmaIn.sql}`, params: lemmaIn.params },
    inflections: { where: `lemma_id IN ${lemmaIn.sql}`, params: lemmaIn.params },
    decks: { where: `id = ?`, params: [deckId] },
    meaning_clusters: { where: `lemma_id IN ${lemmaIn.sql}`, params: lemmaIn.params },
    cards: { where: `id IN ${cardIn.sql}`, params: cardIn.params },
    meanings: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    examples: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    synonyms: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    phrases: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    cloze_cards: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    audio: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    deck_cards: { where: `deck_id = ?`, params: [deckId] },
    tags: { where: `id IN ${tagIn.sql}`, params: tagIn.params },
    card_tags: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    generation_metadata: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    card_states: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    cloze_states: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
    review_events: { where: `card_id IN ${cardIn.sql}`, params: cardIn.params },
  }
  // Included in full, not filtered — see the doc comment above.
  const INCLUDE_ALL: readonly BackupTableName[] = ['templates', 'prompt_versions']
  // Not deck-scoped data at all — omitted entirely from a deck export. card_chat_messages is
  // additionally personal (a learner's own private conversation about a word) — never something to
  // hand to whoever a deck gets shared with, even though it's included in a full personal backup.
  const OMIT: readonly BackupTableName[] = ['sentence_mining_queue', 'evaluations', 'card_chat_messages']

  const tables: BackupPayload['tables'] = {}
  let rowCount = 0
  for (const tableName of TABLE_ORDER) {
    if (OMIT.includes(tableName)) continue
    const filter = FILTERS[tableName]
    const rows = INCLUDE_ALL.includes(tableName)
      ? await db.query<Record<string, unknown>>(`SELECT * FROM ${tableName}`)
      : filter
        ? await db.query<Record<string, unknown>>(`SELECT * FROM ${tableName} WHERE ${filter.where}`, filter.params)
        : []
    tables[tableName] = rows
    rowCount += rows.length
  }

  exportLog.info('export.deck_backup_completed', {
    message: 'Deck-scoped .lem export completed',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { itemCount: rowCount },
  })

  return { formatVersion: BACKUP_FORMAT_VERSION, exportedAt: Date.now(), appVersion, settings, tables }
}

export interface RestoreResult {
  tableCounts: Partial<Record<BackupTableName, number>>
}

/**
 * Replaces every backed-up table's contents with the backup's, in one
 * transaction — either the whole restore lands or none of it does. Deletes
 * run child-to-parent (reverse of TABLE_ORDER) and inserts run parent-to-
 * child, both to satisfy foreign keys.
 */
export async function restoreBackup(db: DatabaseAdapter, payload: BackupPayload): Promise<RestoreResult> {
  const startedAt = Date.now()
  importLog.info('import.restore_started', { message: 'JSON backup restore started' })

  const tableCounts: RestoreResult['tableCounts'] = {}
  try {
    await db.transaction(async (tx) => {
      for (const tableName of [...TABLE_ORDER].reverse()) {
        await tx.execute(`DELETE FROM ${tableName}`)
      }
      for (const tableName of TABLE_ORDER) {
        const rows = payload.tables[tableName] ?? []
        const columns = TABLE_COLUMNS[tableName]
        const placeholders = columns.map(() => '?').join(', ')
        for (const row of rows) {
          const values = columns.map((column) => (column in row ? row[column] : null))
          await tx.execute(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`, values)
        }
        tableCounts[tableName] = rows.length
      }
    })
  } catch (error) {
    importLog.error('import.restore_failed', error, {
      message: 'JSON backup restore failed and was rolled back',
      durationMs: Date.now() - startedAt,
    })
    throw error
  }

  const totalRows = Object.values(tableCounts).reduce((sum, count) => sum + (count ?? 0), 0)
  importLog.info('import.restore_completed', {
    message: 'JSON backup restore completed',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { itemCount: totalRows },
  })

  return { tableCounts }
}
