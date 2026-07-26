import { Directory, File, Paths } from 'expo-file-system'

import { createJsonLinesSink } from './json-lines.transport'
import { getDiagnosticSession } from './diagnostic-mode'
import { selectLogFilesToDelete } from './retention'
import type { FlushableObservabilitySink } from './types'

// Consuming apps (React Native/Hermes, and Node ≥18 for this package's own tests) all provide
// TextEncoder as a runtime global, but this package's tsconfig targets ESNext without the DOM lib
// (consumers like apps/mobile don't carry @types/node either) — so the global has no ambient type
// here. Declared locally rather than widening the whole program's lib just for one file.
declare const TextEncoder: { new (): { encode(input: string): Uint8Array } }

export interface ExpoJsonLinesOptions {
  directoryName?: string
  filePrefix?: string
  maxFileBytes?: number
  maxFiles?: number
  maxTotalBytes?: number
}

function datePart(timestamp: string): string {
  return timestamp.slice(0, 10)
}

/** On-device rotating JSON-lines log file, written via the new expo-file-system API (Directory/
 * File/Paths). Rotates per day (and by size within a day) and prunes by age/file-count/total-size
 * on every write — diagnostics never grow unbounded on a user's device. */
export function createExpoJsonLinesSink(options: ExpoJsonLinesOptions = {}): FlushableObservabilitySink {
  const directory = new Directory(Paths.document, options.directoryName ?? 'diagnostics')
  const prefix = options.filePrefix ?? 'lingora'
  const maxFileBytes = options.maxFileBytes ?? 3 * 1024 * 1024
  const maxFiles = options.maxFiles ?? 5
  const maxTotalBytes = options.maxTotalBytes ?? 15 * 1024 * 1024

  function logFiles(): File[] {
    return directory
      .list()
      .filter(
        (entry): entry is File =>
          entry instanceof File && entry.name.startsWith(`${prefix}-`) && entry.name.endsWith('.jsonl'),
      )
  }

  function cleanup(now: Date): void {
    const files = logFiles()
    const retentionMs = (getDiagnosticSession(now) ? 7 : 3) * 24 * 60 * 60 * 1000
    const selected = selectLogFilesToDelete(
      files.map((file) => ({ name: file.name, size: file.size ?? 0, modifiedAt: file.modificationTime ?? now.getTime() })),
      { maxFiles, maxTotalBytes, retentionMs, nowMs: now.getTime() },
    )
    selected.forEach((name) => {
      try {
        new File(directory, name).delete()
      } catch {
        /* Logging cleanup is best effort. */
      }
    })
  }

  function writableFile(timestamp: string, bytes: number): File {
    const stem = `${prefix}-${datePart(timestamp)}`
    for (let part = 1; ; part += 1) {
      const suffix = part === 1 ? '' : `-${part}`
      const file = new File(directory, `${stem}${suffix}.jsonl`)
      if (!file.exists || (file.size ?? 0) + bytes <= maxFileBytes) return file
    }
  }

  return createJsonLinesSink({
    // The interface returns a Promise so a future transport (e.g. streaming to a remote sink)
    // can be async; the on-device file API itself is synchronous.
    // eslint-disable-next-line @typescript-eslint/require-await
    async append(line, event) {
      if (!directory.exists) directory.create({ idempotent: true, intermediates: true })
      const now = new Date(event.timestamp)
      cleanup(now)
      const encoded = new TextEncoder().encode(line)
      const file = writableFile(event.timestamp, encoded.byteLength)
      if (!file.exists) file.create({ intermediates: true })
      const handle = file.open()
      try {
        handle.offset = handle.size ?? 0
        handle.writeBytes(encoded)
      } finally {
        handle.close()
      }
      cleanup(now)
    },
  })
}
