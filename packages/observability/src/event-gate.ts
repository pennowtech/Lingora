import { getDiagnosticSession } from './diagnostic-mode'
import { logLevels, type LogLevel } from './levels'
import type { AppEnvironment, StructuredLogEvent } from './types'

interface Duplicate {
  event: StructuredLogEvent
  count: number
  firstMs: number
  lastMs: number
}

/**
 * Central severity/rate/duplicate policy — every sink sees the output of this, so filtering logic
 * lives in exactly one place instead of being re-implemented per transport.
 */
export class EventGate {
  private minute: number[] = []
  private duplicates = new Map<string, Duplicate>()

  constructor(
    private readonly environment: AppEnvironment,
    private readonly now: () => Date = () => new Date(),
    private readonly maxPerMinute = 300,
    private readonly duplicateWindowMs = 60_000,
  ) {}

  filter(event: StructuredLogEvent): StructuredLogEvent[] {
    const now = this.now()
    const nowMs = now.getTime()
    const output = this.expiredSummaries(nowMs)
    const minimum: LogLevel =
      this.environment === 'development' ? 'debug' : getDiagnosticSession(now) ? 'debug' : 'info'
    if (logLevels[event.level] < logLevels[minimum]) return output
    this.minute = this.minute.filter((time) => nowMs - time < 60_000)
    if (this.minute.length >= this.maxPerMinute) return output
    this.minute.push(nowMs)
    if (event.level === 'warn' || event.level === 'error' || event.level === 'fatal') {
      const key = `${event.level}:${event.event}:${event.errorCode ?? ''}`
      const duplicate = this.duplicates.get(key)
      if (duplicate && nowMs - duplicate.firstMs < this.duplicateWindowMs) {
        duplicate.count += 1
        duplicate.lastMs = nowMs
        return output
      }
      this.duplicates.set(key, { event, count: 1, firstMs: nowMs, lastMs: nowMs })
    }
    output.push(event)
    return output
  }

  private expiredSummaries(nowMs: number): StructuredLogEvent[] {
    const output: StructuredLogEvent[] = []
    for (const [key, duplicate] of this.duplicates) {
      if (nowMs - duplicate.firstMs < this.duplicateWindowMs) continue
      this.duplicates.delete(key)
      if (duplicate.count > 1) {
        output.push({
          ...duplicate.event,
          timestamp: new Date(nowMs).toISOString(),
          event: 'diagnostics.duplicate_summary',
          message: 'Repeated warning or error suppressed',
          metadata: { occurrenceCount: duplicate.count, windowMs: duplicate.lastMs - duplicate.firstMs },
        })
      }
    }
    return output
  }
}
