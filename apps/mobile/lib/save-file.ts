import { logger } from '@lingora/observability'
import { defaultExportFileName, type FileStorage, type PickedFile, type SaveContent, type SaveFileOptions, type SaveOutcome } from '@lingora/core'
import { fromByteArray } from 'base64-js'
import { File, Paths } from 'expo-file-system'
import { EncodingType, StorageAccessFramework } from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'

export { defaultExportFileName, type SaveContent, type SaveFileOptions, type SaveOutcome }

const log = logger.child({ feature: 'export', component: 'save-file' })

/** Opens Expo's native file picker. Consolidated here (previously duplicated ad hoc in
 * backup.ts/apkg.ts, each with its own inline `File.pickFileAsync` call) as the mobile
 * implementation of @lingora/core's FileStorage#pickFile. */
async function pickFile(options: { mimeTypes: string[] }): Promise<PickedFile | null> {
  const picked = await File.pickFileAsync({ mimeTypes: options.mimeTypes })
  if (picked.canceled) return null
  return {
    name: picked.result.name,
    text: () => picked.result.text(),
    bytes: () => picked.result.bytes(),
  }
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
    await Sharing.shareAsync(file.uri, { mimeType: options.mimeType, ...(options.dialogTitle && { dialogTitle: options.dialogTitle }) })
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
async function saveFile(options: SaveFileOptions): Promise<SaveOutcome> {
  if (Platform.OS !== 'android') {
    return saveViaShareSheet(options)
  }

  const result = await StorageAccessFramework.requestDirectoryPermissionsAsync()
  if (!result.granted) {
    log.info('export.save_folder_declined', { message: 'User did not grant a save folder - falling back to the share sheet' })
    return saveViaShareSheet(options)
  }

  const fileUri = await StorageAccessFramework.createFileAsync(result.directoryUri, options.fileName, options.mimeType)
  await writeContent(fileUri, options.content)
  log.info('export.saved_to_device', { message: 'Export saved directly to a user-chosen folder' })
  return 'device'
}

/** The Expo implementation of @lingora/core's FileStorage interface — see that package's doc
 * comment on why picking/saving a file has no shared cross-platform implementation, only a shared
 * contract (apps/desktop/src/services/desktopFileStorage.ts is the Tauri counterpart). */
export const expoFileStorage: FileStorage = { pickFile, saveFile }
