import { formatLogEvent } from './format'
import type { LogLevel } from './levels'
import type { ObservabilitySink, StructuredLogEvent } from './types'

const consoleMethodForLevel: Record<LogLevel, 'debug' | 'log' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'log',
  warn: 'warn',
  error: 'error',
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
