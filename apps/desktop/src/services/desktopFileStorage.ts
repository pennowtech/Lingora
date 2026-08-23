import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, readTextFile, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { FileStorage, PickedFile, SaveFileOptions, SaveOutcome } from '@lingora/core';

/**
 * The Tauri implementation of @lingora/core's FileStorage interface — see that package's own doc
 * comment on why picking/saving a file has no shared cross-platform implementation, only a shared
 * contract (apps/mobile/lib/save-file.ts is the Expo counterpart). Both the native dialog and the
 * actual disk read/write happen in Rust (plugin-dialog + plugin-fs, registered in
 * src-tauri/src/lib.rs, permission-granted in src-tauri/capabilities/default.json) rather than any
 * browser file API — nothing here is subject to the WebView's usual sandboxing around local files.
 *
 * Unlike mobile, there's no MIME-type filter applied to the open dialog: Tauri's dialog filters
 * work by file extension, and the loose MIME-type lists callers pass (e.g. '.lin' backups have no
 * registered system MIME type at all) don't translate cleanly - showing every file, same as
 * mobile's own reasoning for its equally-loose wildcard fallback, is safer than hiding the file
 * the user is actually looking for.
 */

async function pickFile(): Promise<PickedFile | null> {
  const path = await open({ multiple: false, directory: false });
  if (!path || Array.isArray(path)) return null;
  const name = path.split(/[\\/]/).pop() ?? path;
  return {
    name,
    text: () => readTextFile(path),
    bytes: () => readFile(path),
  };
}

/** Desktop's "Save As" dialog gives back a full destination path in one step (no separate
 * folder-then-filename dance like mobile's Android Storage Access Framework needs, and no share
 * sheet - a cancelled dialog is the only non-'device' outcome here). */
async function saveFile(options: SaveFileOptions): Promise<SaveOutcome> {
  const path = await save({ defaultPath: options.fileName });
  if (!path) return 'cancelled';
  if (options.content.kind === 'utf8') {
    await writeTextFile(path, options.content.text);
  } else {
    await writeFile(path, options.content.data);
  }
  return 'device';
}

export const desktopFileStorage: FileStorage = { pickFile, saveFile };
