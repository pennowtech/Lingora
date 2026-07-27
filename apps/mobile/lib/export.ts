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
import { File, Paths } from 'expo-file-system'
import { openDatabaseAsync } from 'expo-sqlite'
import * as Sharing from 'expo-sharing'
import JSZip from 'jszip'

const log = logger.child({ feature: 'export', component: 'export' })

export type ExportFormat = 'csv' | 'markdown' | 'apkg'

export interface ExportOptions {
  /** Narrows to one deck's cards; omit for the whole library. */
  deckId?: string
  /** Used for the file name and (apkg/markdown) the deck/title label. */
  deckName?: string
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lingora'
}

async function shareFile(file: InstanceType<typeof File>, mimeType: string, dialogTitle: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle })
  }
}

/** Exports to CSV — the same columns `csv-import.ts` reads, so the file re-imports with zero remapping. */
export async function exportCsvToFile(db: DatabaseAdapter, options: ExportOptions = {}): Promise<{ itemCount: number }> {
  const csv = await buildCsvExport(db, { ...(options.deckId && { deckId: options.deckId }) })
  const itemCount = csv.trim().split('\r\n').length - 1

  const file = new File(Paths.cache, `${slug(options.deckName ?? 'lingora')}-${Date.now()}.csv`)
  if (file.exists) file.delete()
  file.create()
  file.write(csv)

  await shareFile(file, 'text/csv', 'Save CSV export')
  log.info('export.csv_exported', { message: 'CSV export written and share sheet opened', metadata: { itemCount } })
  return { itemCount }
}

/** Exports to a single Markdown file — one heading per card, not meant to round-trip. */
export async function exportMarkdownToFile(db: DatabaseAdapter, options: ExportOptions = {}): Promise<{ itemCount: number }> {
  const markdown = await buildMarkdownExport(db, {
    ...(options.deckId && { deckId: options.deckId }),
    title: options.deckName ?? 'Lingora vocabulary',
  })
  const itemCount = (markdown.match(/^### /gm) ?? []).length

  const file = new File(Paths.cache, `${slug(options.deckName ?? 'lingora')}-${Date.now()}.md`)
  if (file.exists) file.delete()
  file.create()
  file.write(markdown)

  await shareFile(file, 'text/markdown', 'Save Markdown export')
  log.info('export.markdown_exported', { message: 'Markdown export written and share sheet opened', metadata: { itemCount } })
  return { itemCount }
}

/**
 * Exports to a real Anki `.apkg`: builds a legacy-schema collection database
 * on-device (`buildApkgExport`, into a real temp SQLite file — same
 * `openDatabaseAsync` + real-file pattern `lib/apkg.ts`'s importer uses,
 * for the same reason: a deserialized in-memory database can't back the
 * disk-spilled temp b-trees a multi-table write like this needs), then
 * zips it with an empty `media` manifest (`{}` — Lingora doesn't export
 * audio/images) into a `.apkg` file and opens the share sheet.
 */
export async function exportApkgToFile(db: DatabaseAdapter, options: ExportOptions = {}): Promise<{ itemCount: number }> {
  const cards = await getExportableCards(db, { ...(options.deckId && { deckId: options.deckId }) })
  const deckName = options.deckName ?? 'Lingora vocabulary'

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

    const apkgFile = new File(Paths.cache, `${slug(deckName)}-${Date.now()}.apkg`)
    if (apkgFile.exists) apkgFile.delete()
    apkgFile.create()
    apkgFile.write(zipBytes)

    await shareFile(apkgFile, 'application/octet-stream', 'Save Anki export')
    log.info('export.apkg_exported', {
      message: 'Anki .apkg export written and share sheet opened',
      metadata: { itemCount: cards.length },
    })
    return { itemCount: cards.length }
  } finally {
    await ankiDb?.closeAsync()
    if (tempFile.exists) tempFile.delete()
  }
}

export async function runExport(db: DatabaseAdapter, format: ExportFormat, options: ExportOptions = {}): Promise<{ itemCount: number }> {
  if (format === 'csv') return exportCsvToFile(db, options)
  if (format === 'markdown') return exportMarkdownToFile(db, options)
  return exportApkgToFile(db, options)
}
