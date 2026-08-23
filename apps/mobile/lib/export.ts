import {
  buildApkgExport,
  buildCsvExport,
  buildMarkdownExport,
  ExpoSQLiteAdapter,
  getExportableCards,
  type DatabaseAdapter,
  type ExpoSQLiteDatabase,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { defaultExportFileName, type SaveOutcome } from '@lingora/core'
import { File, Paths } from 'expo-file-system'
import { openDatabaseAsync } from 'expo-sqlite'
import JSZip from 'jszip'
import { exportBackupToFile } from './backup'
import { expoFileStorage } from './save-file'

export { defaultExportFileName } from '@lingora/core'

const log = logger.child({ feature: 'export', component: 'export' })

export type ExportFormat = 'csv' | 'markdown' | 'apkg' | 'lin'

export interface ExportOptions {
  /** Narrows to one deck's cards; omit for the whole library. */
  deckId?: string
  /** Used for the file name (when `fileName` isn't given) and (apkg/markdown) the deck/title label. */
  deckName?: string
  /** Base file name (no extension) — from the export-name prompt the caller shows before running
   * the export. Falls back to `defaultExportFileName(deckName)` when omitted (e.g. a caller that
   * hasn't been wired up to the prompt yet). */
  fileName?: string
}

/** Exports to CSV — the same columns `csv-import.ts` reads, so the file re-imports with zero remapping. */
export async function exportCsvToFile(db: DatabaseAdapter, options: ExportOptions = {}): Promise<{ itemCount: number; outcome: SaveOutcome }> {
  const csv = await buildCsvExport(db, { ...(options.deckId && { deckId: options.deckId }) })
  const itemCount = csv.trim().split('\r\n').length - 1

  const outcome = await expoFileStorage.saveFile({
    fileName: `${options.fileName ?? defaultExportFileName(options.deckName)}.csv`,
    mimeType: 'text/csv',
    content: { kind: 'utf8', text: csv },
    dialogTitle: 'Save CSV export',
  })
  log.info('export.csv_exported', { message: `CSV export ${outcome === 'device' ? 'saved to device' : 'shared'}`, metadata: { itemCount } })
  return { itemCount, outcome }
}

/** Exports to a single Markdown file — one heading per card, not meant to round-trip. */
export async function exportMarkdownToFile(db: DatabaseAdapter, options: ExportOptions = {}): Promise<{ itemCount: number; outcome: SaveOutcome }> {
  const markdown = await buildMarkdownExport(db, {
    ...(options.deckId && { deckId: options.deckId }),
    title: options.deckName ?? 'Lemmory vocabulary',
  })
  const itemCount = (markdown.match(/^### /gm) ?? []).length

  const outcome = await expoFileStorage.saveFile({
    fileName: `${options.fileName ?? defaultExportFileName(options.deckName)}.md`,
    mimeType: 'text/markdown',
    content: { kind: 'utf8', text: markdown },
    dialogTitle: 'Save Markdown export',
  })
  log.info('export.markdown_exported', {
    message: `Markdown export ${outcome === 'device' ? 'saved to device' : 'shared'}`,
    metadata: { itemCount },
  })
  return { itemCount, outcome }
}

/**
 * Exports to a real Anki `.apkg`: builds a legacy-schema collection database
 * on-device (`buildApkgExport`, into a real temp SQLite file — same
 * `openDatabaseAsync` + real-file pattern `lib/apkg.ts`'s importer uses,
 * for the same reason: a deserialized in-memory database can't back the
 * disk-spilled temp b-trees a multi-table write like this needs), then
 * zips it with an empty `media` manifest (`{}` — Lemmory doesn't export
 * audio/images) into a `.apkg` file and saves it (`expoFileStorage.saveFile`
 * — a real folder picker on Android, the share sheet elsewhere).
 */
export async function exportApkgToFile(db: DatabaseAdapter, options: ExportOptions = {}): Promise<{ itemCount: number; outcome: SaveOutcome }> {
  const cards = await getExportableCards(db, { ...(options.deckId && { deckId: options.deckId }) })
  const deckName = options.deckName ?? 'Lemmory vocabulary'

  const tempDbName = `anki-export-${Date.now()}.db`
  const tempFile = new File(Paths.cache, tempDbName)
  if (tempFile.exists) tempFile.delete()
  const cacheDirPath = Paths.cache.uri.replace(/^file:\/\//, '')

  let ankiDb: Awaited<ReturnType<typeof openDatabaseAsync>> | null = null
  try {
    ankiDb = await openDatabaseAsync(tempDbName, undefined, cacheDirPath)
    const adapter = new ExpoSQLiteAdapter(ankiDb as unknown as ExpoSQLiteDatabase)
    await buildApkgExport(adapter, cards, { deckName })
    await ankiDb.closeAsync()
    ankiDb = null

    const collectionBytes = await tempFile.bytes()
    const zip = new JSZip()
    zip.file('collection.anki2', collectionBytes)
    zip.file('media', '{}')
    const zipBytes = await zip.generateAsync({ type: 'uint8array' })

    const outcome = await expoFileStorage.saveFile({
      fileName: `${options.fileName ?? defaultExportFileName(deckName)}.apkg`,
      mimeType: 'application/octet-stream',
      content: { kind: 'bytes', data: zipBytes },
      dialogTitle: 'Save Anki export',
    })
    log.info('export.apkg_exported', {
      message: `Anki .apkg export ${outcome === 'device' ? 'saved to device' : 'shared'}`,
      metadata: { itemCount: cards.length },
    })
    return { itemCount: cards.length, outcome }
  } finally {
    await ankiDb?.closeAsync()
    if (tempFile.exists) tempFile.delete()
  }
}

export async function runExport(db: DatabaseAdapter, format: ExportFormat, options: ExportOptions = {}): Promise<{ itemCount: number; outcome: SaveOutcome }> {
  if (format === 'csv') return exportCsvToFile(db, options)
  if (format === 'markdown') return exportMarkdownToFile(db, options)
  if (format === 'lin') return exportBackupToFile(db, options)
  return exportApkgToFile(db, options)
}
