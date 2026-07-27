import {
  ExpoSQLiteAdapter,
  readAnkiCollection,
  type AnkiDeckInfo,
  type AnkiNote,
  type AnkiNoteType,
  type ExpoSQLiteDatabase,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { decompress } from 'fzstd'
import { File, Paths } from 'expo-file-system'
import { openDatabaseAsync } from 'expo-sqlite'
import JSZip from 'jszip'

const log = logger.child({ feature: 'import', screen: 'ApkgImportScreen' })

export interface PickedApkg {
  fileName: string
  notes: AnkiNote[]
  decks: AnkiDeckInfo[]
  noteTypes: AnkiNoteType[]
}

/**
 * Opens the native file picker, unzips the chosen `.apkg`, and reads its
 * embedded Anki collection. Returns null if the user canceled.
 *
 * Anki 2.1.50+ (the default for years now) packages the real collection as
 * `collection.anki21b`, a zstd-compressed SQLite database — the plain
 * `collection.anki21`/`collection.anki2` files, when present at all, are a
 * near-empty legacy shell kept only for backward compatibility. `anki21b`
 * is tried first and decompressed with `fzstd` (pure JS, no native module —
 * no dev-client rebuild needed) so a modern export's actual notes get read
 * instead of silently importing almost nothing from the shell database.
 *
 * The decompressed bytes are written to a real temp file (in the app's
 * cache directory, `Paths.cache` — the same pattern `lib/backup.ts` already
 * uses successfully) and opened with `openDatabaseAsync` rather than
 * `deserializeDatabaseAsync`/`:memory:` — a deserialized in-memory database
 * has no real file to back WAL's `-wal`/`-shm` sidecar files or a
 * disk-spilled temp b-tree, both of which this collection (thousands of
 * notes) needs, and both fail with "unable to open database file" on a
 * deserialized handle. `Paths.cache.uri` is a `file://` URI (what the
 * expo-file-system `File` API needs); `openDatabaseAsync`'s `directory`
 * argument needs the bare filesystem path instead (what expo-sqlite's own
 * `defaultDatabaseDirectory` returns), hence stripping the `file://`
 * prefix below rather than reusing the URI as-is. The temp file is deleted
 * in `finally`, whether or not parsing succeeds.
 */
export async function pickAndParseApkgFile(): Promise<PickedApkg | null> {
  const picked = await File.pickFileAsync({
    mimeTypes: ['application/zip', 'application/octet-stream', '*/*'],
  })
  if (picked.canceled) return null

  log.info('import.apkg_file_picked', { message: 'User picked an .apkg file' })

  const zipBytes = await picked.result.bytes()
  const zip = await JSZip.loadAsync(zipBytes)

  const modernEntry = zip.file('collection.anki21b')
  const legacyEntry = zip.file('collection.anki21') ?? zip.file('collection.anki2')
  if (!modernEntry && !legacyEntry) {
    throw new Error("This file doesn't look like an Anki .apkg export (no collection database found).")
  }

  const collectionBytes = modernEntry
    ? decompress(await modernEntry.async('uint8array'))
    : await (legacyEntry as NonNullable<typeof legacyEntry>).async('uint8array')

  const tempDbName = `anki-import-${Date.now()}.db`
  const tempFile = new File(Paths.cache, tempDbName)
  tempFile.create()
  tempFile.write(collectionBytes)
  const cacheDirPath = Paths.cache.uri.replace(/^file:\/\//, '')

  let ankiDb: Awaited<ReturnType<typeof openDatabaseAsync>> | null = null
  try {
    ankiDb = await openDatabaseAsync(tempDbName, undefined, cacheDirPath)
    // No ExpoSQLiteAdapter.create() — its WAL pragma is for the main app
    // database's concurrent read/write access pattern; this is a
    // throwaway, single-read handle, so the plain constructor (no
    // pragmas) is correct here, not a workaround.
    const adapter = new ExpoSQLiteAdapter(ankiDb as unknown as ExpoSQLiteDatabase)
    const { notes, decks, noteTypes } = await readAnkiCollection(adapter)
    log.info('import.apkg_file_parsed', {
      message: 'Anki collection parsed',
      metadata: { itemCount: notes.length },
    })
    return { fileName: picked.result.name, notes, decks, noteTypes }
  } finally {
    await ankiDb?.closeAsync()
    if (tempFile.exists) tempFile.delete()
  }
}
