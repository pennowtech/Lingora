import {
  createBackup,
  createDeckBackup,
  parseBackup,
  restoreBackup,
  type BackupPayload,
  type BackupSettings,
  type RestoreResult,
} from '@lingora/database'
import type { DatabaseAdapter } from '@lingora/database'
import { logger } from '@lingora/observability'
import Constants from 'expo-constants'
import { File } from 'expo-file-system'
import * as SecureStore from 'expo-secure-store'
import { defaultExportFileName, saveExportFile, type SaveOutcome } from './save-file'
import { STORE_KEYS } from './services'

const log = logger.child({ feature: 'export', screen: 'ImportExportScreen' })

/** Everything backed up from Settings — never an API key, only preferences. */
async function readBackupSettings(): Promise<BackupSettings> {
  const [defaultCefr, translationProvider, generationProvider] = await Promise.all([
    SecureStore.getItemAsync(STORE_KEYS.defaultCefr),
    SecureStore.getItemAsync(STORE_KEYS.translationProvider),
    SecureStore.getItemAsync(STORE_KEYS.generationProvider),
  ])
  return {
    ...(defaultCefr ? { defaultCefr } : {}),
    ...(translationProvider ? { translationProvider } : {}),
    ...(generationProvider ? { generationProvider } : {}),
  }
}

async function applyBackupSettings(settings: BackupSettings): Promise<void> {
  await Promise.all([
    settings.defaultCefr ? SecureStore.setItemAsync(STORE_KEYS.defaultCefr, settings.defaultCefr) : null,
    settings.translationProvider
      ? SecureStore.setItemAsync(STORE_KEYS.translationProvider, settings.translationProvider)
      : null,
    settings.generationProvider
      ? SecureStore.setItemAsync(STORE_KEYS.generationProvider, settings.generationProvider)
      : null,
  ])
}

/**
 * Builds the backup — the whole library, or (with `deckId`) just one deck's
 * own cards via `createDeckBackup`, export-only (a deck `.lin` has no
 * matching restore path, see `createDeckBackup`'s doc comment) — and saves
 * it (`saveExportFile` — a real folder picker on Android, the share sheet
 * elsewhere). `.lin` — the Lemmory backup format's own extension. The
 * content is still plain JSON (`BackupPayload`, unchanged) — this is a
 * naming/branding decision (a backup is "a Lemmory file", not "a JSON
 * file" to the user), not a new serialization. `.lin` has no registered
 * system MIME type, so the share sheet and file picker below use
 * `application/octet-stream` rather than `application/json`.
 */
export async function exportBackupToFile(
  db: DatabaseAdapter,
  options: { deckId?: string; deckName?: string; fileName?: string } = {},
): Promise<{ itemCount: number; outcome: SaveOutcome }> {
  const settings = await readBackupSettings()
  const appVersion = Constants.expoConfig?.version ?? 'unknown'
  const backup = options.deckId
    ? await createDeckBackup(db, options.deckId, settings, appVersion)
    : await createBackup(db, settings, appVersion)
  const json = JSON.stringify(backup, null, 2)
  // Cards, not a sum across every table — a card with 2 meanings, 3
  // examples, and 40 review-history rows should still read as "1 card
  // exported," matching what CSV/Markdown/Anki export already report, not
  // a much larger number that reads as "this exported more than my deck
  // has" (real user-reported confusion: a 49-card deck with review history
  // showed "417 cards exported").
  const itemCount = backup.tables.cards?.length ?? 0

  const outcome = await saveExportFile({
    fileName: `${options.fileName ?? defaultExportFileName(options.deckName)}.lin`,
    mimeType: 'application/octet-stream',
    content: { kind: 'utf8', text: json },
    dialogTitle: 'Save Lemmory backup',
  })
  log.info('export.backup_shared', {
    message: `Backup file ${outcome === 'device' ? 'saved to device' : 'shared'}`,
    metadata: { itemCount },
  })
  return { itemCount, outcome }
}

export interface PickedBackup {
  payload: BackupPayload
  fileName: string
}

/** Opens the native file picker and validates the chosen file — throws BackupValidationError on a bad file. */
export async function pickAndParseBackupFile(): Promise<PickedBackup | null> {
  // '*/*' rather than a specific MIME type: '.lin' has no registered system
  // MIME type, and Android's picker resolves unknown extensions to
  // 'application/octet-stream' inconsistently across OEMs — filtering by a
  // specific type risks hiding the very file the user is looking for.
  const picked = await File.pickFileAsync({ mimeTypes: ['application/octet-stream', 'application/json', 'text/plain', '*/*'] })
  if (picked.canceled) return null

  const raw = await picked.result.text()
  const payload = parseBackup(raw)
  return { payload, fileName: picked.result.name }
}

export interface RestoreOutcome {
  result: RestoreResult
}

/** Restores a validated backup transactionally, then applies its non-secret settings. */
export async function applyBackupRestore(db: DatabaseAdapter, payload: BackupPayload): Promise<RestoreOutcome> {
  const result = await restoreBackup(db, payload)
  await applyBackupSettings(payload.settings)
  return { result }
}
