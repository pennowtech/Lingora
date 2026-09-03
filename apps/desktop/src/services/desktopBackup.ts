import {
  createBackup,
  createDeckBackup,
  parseBackup,
  restoreBackup,
  type BackupPayload,
  type BackupSettings,
  type DatabaseAdapter,
  type RestoreResult,
} from '@lingora/database';
import { defaultExportFileName, type SaveOutcome } from '@lingora/core';
import { desktopFileStorage } from './desktopFileStorage';

/**
 * Desktop's counterpart to apps/mobile/lib/backup.ts — same public shape
 * (exportBackupToFile/pickAndParseBackupFile/applyBackupRestore), same createBackup/parseBackup/
 * restoreBackup engine from @lingora/database (100% platform-agnostic already, see that package's
 * own backup.ts), only the storage half differs: desktopFileStorage (Tauri dialog+fs) instead of
 * Expo's file picker/Storage Access Framework/share sheet, and localStorage instead of
 * SecureStore for the handful of non-secret settings a backup carries. Uses desktop's own existing
 * localStorage key names (see desktopServices.tsx) rather than @lingora/core's STORE_KEYS, which
 * mobile uses under different key strings for some of these — reconciling that naming is a
 * separate concern from wiring up backup/restore itself.
 */

const DESKTOP_STORE_KEYS = {
  defaultCefr: 'lingora.cefr',
  translationProvider: 'lingora.translation_provider',
  generationProvider: 'lingora.generation_provider',
} as const;

/** Everything backed up from Settings — never an API key, only preferences. */
function readBackupSettings(): BackupSettings {
  const defaultCefr = localStorage.getItem(DESKTOP_STORE_KEYS.defaultCefr);
  const translationProvider = localStorage.getItem(DESKTOP_STORE_KEYS.translationProvider);
  const generationProvider = localStorage.getItem(DESKTOP_STORE_KEYS.generationProvider);
  return {
    ...(defaultCefr ? { defaultCefr } : {}),
    ...(translationProvider ? { translationProvider } : {}),
    ...(generationProvider ? { generationProvider } : {}),
  };
}

function applyBackupSettings(settings: BackupSettings): void {
  if (settings.defaultCefr) localStorage.setItem(DESKTOP_STORE_KEYS.defaultCefr, settings.defaultCefr);
  if (settings.translationProvider) localStorage.setItem(DESKTOP_STORE_KEYS.translationProvider, settings.translationProvider);
  if (settings.generationProvider) localStorage.setItem(DESKTOP_STORE_KEYS.generationProvider, settings.generationProvider);
}

/** Builds the backup — the whole library, or (with `deckId`) just one deck's own cards via
 * createDeckBackup — and saves it via desktopFileStorage (a native "Save As" dialog). '.lem' - the
 * Lemory backup format's own extension, still plain JSON underneath (see createBackup's own doc
 * comment in @lingora/database). */
export async function exportBackupToFile(
  db: DatabaseAdapter,
  options: { deckId?: string; deckName?: string; fileName?: string } = {},
): Promise<{ itemCount: number; outcome: SaveOutcome }> {
  const settings = readBackupSettings();
  const appVersion = '0.1.0';
  const backup = options.deckId
    ? await createDeckBackup(db, options.deckId, settings, appVersion)
    : await createBackup(db, settings, appVersion);
  const json = JSON.stringify(backup, null, 2);
  const itemCount = backup.tables.cards?.length ?? 0;

  const outcome = await desktopFileStorage.saveFile({
    fileName: `${options.fileName ?? defaultExportFileName(options.deckName)}.lem`,
    mimeType: 'application/octet-stream',
    content: { kind: 'utf8', text: json },
    dialogTitle: 'Save Lemory backup',
  });
  return { itemCount, outcome };
}

export interface PickedBackup {
  payload: BackupPayload;
  fileName: string;
}

/** Opens the native file picker and validates the chosen file — throws BackupValidationError on a bad file. */
export async function pickAndParseBackupFile(): Promise<PickedBackup | null> {
  const picked = await desktopFileStorage.pickFile({ mimeTypes: ['application/octet-stream', 'application/json', 'text/plain'] });
  if (!picked) return null;

  const raw = await picked.text();
  const payload = parseBackup(raw);
  return { payload, fileName: picked.name };
}

export interface RestoreOutcome {
  result: RestoreResult;
}

/** Restores a validated backup transactionally, then applies its non-secret settings. */
export async function applyBackupRestore(db: DatabaseAdapter, payload: BackupPayload): Promise<RestoreOutcome> {
  const result = await restoreBackup(db, payload);
  applyBackupSettings(payload.settings);
  return { result };
}
