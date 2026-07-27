import { logger } from '@lingora/observability'
import { fromByteArray } from 'base64-js'
import { File, Paths } from 'expo-file-system'
import { EncodingType, StorageAccessFramework } from 'expo-file-system/legacy'
import * as SecureStore from 'expo-secure-store'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import { STORE_KEYS } from './services'

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

/**
 * Gets a directory the app can write into via Android's Storage Access
 * Framework, prompting the user to pick one (a real native folder browser —
 * "Save As", not a share sheet) the first time and reusing the granted URI
 * afterward. `forcePrompt` re-asks even if a URI is already stored, for
 * when a previously granted directory's permission has been revoked (e.g.
 * the user uninstalled/reinstalled, or manually revoked it in Android
 * settings) and a write against the stale URI just failed.
 */
async function getExportDirectoryUri(forcePrompt: boolean): Promise<string | null> {
  if (!forcePrompt) {
    const stored = await SecureStore.getItemAsync(STORE_KEYS.exportDirectoryUri)
    if (stored) return stored
  }
  const result = await StorageAccessFramework.requestDirectoryPermissionsAsync()
  if (!result.granted) return null
  await SecureStore.setItemAsync(STORE_KEYS.exportDirectoryUri, result.directoryUri)
  return result.directoryUri
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
 * Saves an export directly to a user-chosen folder via Android's Storage
 * Access Framework (a real native "browse and pick a folder" dialog — what
 * "export this deck" is expected to feel like, not a share-to-an-app
 * picker), falling back to the OS share sheet on iOS (no SAF there — the
 * share sheet's own "Save to Files" is the iOS equivalent) or if the user
 * declines the one-time Android folder permission prompt.
 */
export async function saveExportFile(options: SaveFileOptions): Promise<SaveOutcome> {
  if (Platform.OS !== 'android') {
    return saveViaShareSheet(options)
  }

  let directoryUri = await getExportDirectoryUri(false)
  if (!directoryUri) {
    log.info('export.save_folder_declined', { message: 'User did not grant a save folder — falling back to the share sheet' })
    return saveViaShareSheet(options)
  }

  try {
    const fileUri = await StorageAccessFramework.createFileAsync(directoryUri, options.fileName, options.mimeType)
    await writeContent(fileUri, options.content)
    log.info('export.saved_to_device', { message: 'Export saved directly to a user-chosen folder' })
    return 'device'
  } catch (error) {
    log.warn('export.save_retry_with_new_folder', {
      message: 'Writing to the previously granted folder failed — re-prompting for a folder',
    })
    void error
    directoryUri = await getExportDirectoryUri(true)
    if (!directoryUri) return saveViaShareSheet(options)
    const fileUri = await StorageAccessFramework.createFileAsync(directoryUri, options.fileName, options.mimeType)
    await writeContent(fileUri, options.content)
    return 'device'
  }
}
