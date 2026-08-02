import { logger } from '@lingora/observability'
import { fromByteArray } from 'base64-js'
import { File, Paths } from 'expo-file-system'
import { EncodingType, StorageAccessFramework } from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'

const log = logger.child({ feature: 'export', component: 'save-file' })

export type SaveContent = { kind: 'utf8'; text: string } | { kind: 'bytes'; data: Uint8Array }

export interface SaveFileOptions {
  fileName: string
  mimeType: string
  content: SaveContent
  /** Only used for the share-sheet fallback path (its dialog title). */
  dialogTitle: string
}

export type SaveOutcome = 'device' | 'share'

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lingora'
}

/** `YYYY-MM-DD_HHmm` in local time — filesystem-safe (no colons) and sorts chronologically. */
function timestampForFileName(date: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}`
  )
}

/** `deckname_YYYY-MM-DD_HHmm` — the default name offered in the export-name prompt (see
 * ExportNameModal), editable before the export actually runs. */
export function defaultExportFileName(deckName?: string): string {
  return `${slug(deckName ?? 'lingora')}_${timestampForFileName()}`
}

/** SAF's writeAsStringAsync only takes a string — bytes go through base64 (no Hermes atob/btoa dependency). */
async function writeContent(fileUri: string, content: SaveContent): Promise<void> {
  if (content.kind === 'utf8') {
    await StorageAccessFramework.writeAsStringAsync(fileUri, content.text, { encoding: EncodingType.UTF8 })
  } else {
    await StorageAccessFramework.writeAsStringAsync(fileUri, fromByteArray(content.data), { encoding: EncodingType.Base64 })
  }
}

/** Writes to the app's cache dir and opens the OS share sheet — the previous (and still iOS/fallback) behavior. */
async function saveViaShareSheet(options: SaveFileOptions): Promise<SaveOutcome> {
  const file = new File(Paths.cache, options.fileName)
  if (file.exists) file.delete()
  file.create()
  if (options.content.kind === 'utf8') {
    file.write(options.content.text)
  } else {
    file.write(options.content.data)
  }

  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(file.uri, { mimeType: options.mimeType, dialogTitle: options.dialogTitle })
  }
  return 'share'
}

/**
 * Saves an export directly to a user-chosen folder via Android's Storage Access Framework (a real
 * native "browse and pick a folder" dialog — what "export this deck" is expected to feel like,
 * not a share-to-an-app picker), falling back to the OS share sheet on iOS (no SAF there — the
 * share sheet's own "Save to Files" is the iOS equivalent) or if the user declines the folder
 * permission prompt. Deliberately re-prompts for a folder on every single export rather than
 * reusing a previously granted one — the file name is already chosen fresh per export (see
 * ExportNameModal/defaultExportFileName), and the location should be too.
 */
export async function saveExportFile(options: SaveFileOptions): Promise<SaveOutcome> {
  if (Platform.OS !== 'android') {
    return saveViaShareSheet(options)
  }

  const result = await StorageAccessFramework.requestDirectoryPermissionsAsync()
  if (!result.granted) {
    log.info('export.save_folder_declined', { message: 'User did not grant a save folder — falling back to the share sheet' })
    return saveViaShareSheet(options)
  }

  const fileUri = await StorageAccessFramework.createFileAsync(result.directoryUri, options.fileName, options.mimeType)
  await writeContent(fileUri, options.content)
  log.info('export.saved_to_device', { message: 'Export saved directly to a user-chosen folder' })
  return 'device'
}
