/**
 * File picking/saving — the shared contract, not a shared implementation. Picking a file and
 * writing it to a user-chosen location has no cross-platform API at all (Expo's `File.pickFileAsync`
 * + Storage Access Framework/share sheet vs Tauri's plugin-dialog + plugin-fs are structurally
 * different), so each platform supplies its own object satisfying this interface -
 * apps/mobile/lib/save-file.ts (Expo) and apps/desktop/src/services/desktopFileStorage.ts (Tauri).
 * What *is* shared is everything that calls a FileStorage rather than a concrete platform API:
 * packages/database's createBackup/parseBackup/restoreBackup/buildCsvExport/etc. already only need
 * a DatabaseAdapter and plain strings/bytes - this interface is the last missing piece to let that
 * logic run unchanged on either platform.
 */

export interface PickedFile {
  name: string
  text(): Promise<string>
  bytes(): Promise<Uint8Array>
}

export type SaveContent = { kind: 'utf8'; text: string } | { kind: 'bytes'; data: Uint8Array }

export interface SaveFileOptions {
  fileName: string
  mimeType: string
  content: SaveContent
  /** Shown as the fallback share-sheet's dialog title (mobile/iOS only - desktop's native "Save As"
   * dialog has no equivalent and ignores this). */
  dialogTitle?: string
}

/** 'device' - saved directly to a location the user chose (a real folder picker / native "Save As"
 * dialog). 'share' - handed to the OS share sheet instead (mobile-only fallback, no desktop
 * equivalent - desktop's saveFile never returns this). 'cancelled' - the user backed out of the
 * picker/dialog without saving. */
export type SaveOutcome = 'device' | 'share' | 'cancelled'

export interface FileStorage {
  /** Opens a native file picker restricted to `mimeTypes` (best-effort - a platform may ignore
   * filters it can't express exactly). Returns null if the user cancels. */
  pickFile(options: { mimeTypes: string[] }): Promise<PickedFile | null>
  saveFile(options: SaveFileOptions): Promise<SaveOutcome>
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'lemony'
  )
}

/** `YYYY-MM-DD_HHmm` in local time — filesystem-safe (no colons) and sorts chronologically. */
function timestampForFileName(date: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}`
  )
}

/** `deckname_YYYY-MM-DD_HHmm` — the default name offered in an export-name prompt, editable before
 * the export actually runs. */
export function defaultExportFileName(deckName?: string): string {
  return `${slug(deckName ?? 'lemony')}_${timestampForFileName()}`
}
