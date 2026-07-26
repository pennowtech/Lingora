import {
  createBackup,
  parseBackup,
  restoreBackup,
  type BackupPayload,
  type BackupSettings,
  type RestoreResult,
} from '@lingora/database'
import type { DatabaseAdapter } from '@lingora/database'
import { logger } from '@lingora/observability'
import Constants from 'expo-constants'
import { File, Paths } from 'expo-file-system'
import * as SecureStore from 'expo-secure-store'
import * as Sharing from 'expo-sharing'
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

function backupFileName(exportedAt: number): string {
  return `lingora-backup-${new Date(exportedAt).toISOString().slice(0, 10)}.json`
}

/** Builds the backup, writes it to cache, and opens the native share sheet to save/send it. */
export async function exportBackupToFile(db: DatabaseAdapter): Promise<{ itemCount: number }> {
  const settings = await readBackupSettings()
  const appVersion = Constants.expoConfig?.version ?? 'unknown'
  const backup = await createBackup(db, settings, appVersion)
  const json = JSON.stringify(backup, null, 2)
  const itemCount = Object.values(backup.tables).reduce((sum, rows) => sum + (rows?.length ?? 0), 0)

  const file = new File(Paths.cache, backupFileName(backup.exportedAt))
  if (file.exists) file.delete()
  file.create()
  file.write(json)

  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save Lingora backup' })
  }
  log.info('export.backup_shared', {
    message: canShare ? 'Backup file written and share sheet opened' : 'Backup file written; sharing unavailable',
    metadata: { itemCount },
  })
  return { itemCount }
}

export interface PickedBackup {
  payload: BackupPayload
  fileName: string
}

/** Opens the native file picker and validates the chosen file — throws BackupValidationError on a bad file. */
export async function pickAndParseBackupFile(): Promise<PickedBackup | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain'] })
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
