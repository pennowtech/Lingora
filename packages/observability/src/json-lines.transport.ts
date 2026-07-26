import { formatLogEvent } from './format'
import type { FlushableObservabilitySink, StructuredLogEvent } from './types'

export interface JsonLinesWriter {
  append(line: string, event: StructuredLogEvent): Promise<void>
}

/**
 * Serializes every append through one promise chain so concurrent feature logs cannot interleave or
 * overwrite one another. Rejections are contained and the queue continues with the next event.
 *
 * `line` is the shared, formatted shape (see `formatLogEvent`) — same as what the console sink
 * prints — so a shipped diagnostics file reads identically to `adb logcat` output. The raw `event`
 * (with its internal `timestamp` field) is still passed to the writer separately, since
 * `expo-file-system.transport.ts` uses it for file-rotation bookkeeping, not just serialization.
 */
export function createJsonLinesSink(writer: JsonLinesWriter): FlushableObservabilitySink {
  let queue = Promise.resolve()
  return {
    write(event) {
      const line = `${JSON.stringify(formatLogEvent(event))}\n`
      queue = queue.then(() => writer.append(line, event)).catch(() => undefined)
    },
    async flush() {
      await queue
    },
  }
}
