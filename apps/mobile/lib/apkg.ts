import {
  ExpoSQLiteAdapter,
  readAnkiCollection,
  type AnkiDeckInfo,
  type AnkiNote,
  type ExpoSQLiteDatabase,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { File } from 'expo-file-system'
import { deserializeDatabaseAsync } from 'expo-sqlite'
import JSZip from 'jszip'

const log = logger.child({ feature: 'import', screen: 'ApkgImportScreen' })

export interface PickedApkg {
  fileName: string
  notes: AnkiNote[]
  decks: AnkiDeckInfo[]
}

/**
 * Opens the native file picker, unzips the chosen `.apkg`, and reads its
 * embedded Anki collection — entirely in memory via SQLite's deserialize
 * API, no temp file needed. Returns null if the user canceled.
 */
export async function pickAndParseApkgFile(): Promise<PickedApkg | null> {
  const picked = await File.pickFileAsync({
    mimeTypes: ['application/zip', 'application/octet-stream', '*/*'],
  })
  if (picked.canceled) return null

  log.info('import.apkg_file_picked', { message: 'User picked an .apkg file' })

  const zipBytes = await picked.result.bytes()
  const zip = await JSZip.loadAsync(zipBytes)
  const collectionEntry = zip.file('collection.anki21') ?? zip.file('collection.anki2')
  if (!collectionEntry) {
    throw new Error("This file doesn't look like an Anki .apkg export (no collection database found).")
  }

  const collectionBytes = await collectionEntry.async('uint8array')
  const ankiDb = await deserializeDatabaseAsync(collectionBytes)
  try {
    const adapter = await ExpoSQLiteAdapter.create(ankiDb as unknown as ExpoSQLiteDatabase)
    const { notes, decks } = await readAnkiCollection(adapter)
    log.info('import.apkg_file_parsed', {
      message: 'Anki collection parsed',
      metadata: { itemCount: notes.length },
    })
    return { fileName: picked.result.name, notes, decks }
  } finally {
    await ankiDb.closeAsync()
  }
}
