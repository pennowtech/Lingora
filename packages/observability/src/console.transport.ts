import { formatLogEvent } from './format'
import type { LogLevel } from './levels'
import type { ObservabilitySink, StructuredLogEvent } from './types'

// `error` deliberately maps to console.warn, not console.error - per LingoraLogger's own doc
// comment, `error` is for "handled failures the app recovers from" (e.g. a provider request that
// failed and already has a friendly in-app message), while `fatal` is for the unrecoverable case.
// React Native's LogBox doesn't know that distinction: it pops an intrusive full-screen red overlay
// for ANY console.error call, in every dev build, regardless of whether the app already caught and
// handled it. Every AIProvider logs every request failure at `error` level (see e.g.
// packages/ai/src/providers/groq.ts's `ai.provider_request_failed`) even for routine, expected,
// already-handled failures - a bad key, a rate limit, a provider rejecting malformed structured
// output - so without this mapping, tapping something as ordinary as "Regenerate" and hitting a
// transient provider error meant LogBox taking over the whole screen instead of the calm in-app
// error modal the app already shows. Reserving console.error for `fatal` (the one level the color
// scheme below calls "the one that should be unmissable") keeps LogBox for genuinely unrecoverable
// states only. Desktop's browser/Tauri console has no such overlay, so this is mobile-only upside
// with no real downside there - `error` vs `warn` in a browser devtools console is cosmetic only.
const consoleMethodForLevel: Record<LogLevel, 'debug' | 'log' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'log',
  warn: 'warn',
  error: 'warn',
  fatal: 'error',
}

// Plain ANSI escapes — no library needed. Metro's terminal and `adb logcat` (in a color-capable
// terminal) both render these; a plain-text log viewer or file redirect just shows the raw escape
// codes around otherwise-valid JSON, so this never breaks parseability, only the color bonus.
const ANSI_RESET = '\x1b[0m'
const levelColor: Record<LogLevel, string> = {
  debug: '\x1b[90m', // gray
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  fatal: '\x1b[97;41m', // white on red — the one level that should be unmissable
}

/**
 * Emits one color-coded JSON line per event via console.debug/log/warn/error. Severity filtering
 * already happens once, centrally, in EventGate before any sink sees the event — a sink-local filter
 * here would just be a second copy of that same decision, so this only checks the on/off switch.
 */
export function createConsoleSink(options: { enabled: boolean }): ObservabilitySink {
  return {
    write(event: StructuredLogEvent) {
      if (!options.enabled) return
      const method = consoleMethodForLevel[event.level]
      const line = JSON.stringify(formatLogEvent(event))
      // eslint-disable-next-line no-console
      console[method](`${levelColor[event.level]}${line}${ANSI_RESET}`)
    },
  }
}
