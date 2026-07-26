import type { StructuredLogEvent } from './types'

/** Most specific subsystem label available — `component` (e.g. "SettingsScreen") beats the
 * broader `screen`, which beats the broadest `feature` — so log lines are filterable by the actual
 * module that emitted them, not just their top-level category. */
export function resolveComponent(event: StructuredLogEvent): string {
  return event.context.component ?? event.context.screen ?? event.context.feature
}

/**
 * The one shape every sink emits — console and the on-device JSON-lines file both call this, so a
 * line looks the same whether you're scanning `adb logcat` or a shipped diagnostics file. Promotes
 * `component` and uses upper-case level names + `ts` to match common log-aggregator conventions
 * (Datadog, CloudWatch, ...), and keeps `context` as a nested object rather than splicing every
 * correlation field into the top level.
 */
export function formatLogEvent(event: StructuredLogEvent): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ts: event.timestamp,
    level: event.level.toUpperCase(),
    component: resolveComponent(event),
    event: event.event,
  }
  if (event.message) out.message = event.message
  out.context = event.context
  if (event.result) out.result = event.result
  if (event.durationMs !== undefined) out.durationMs = event.durationMs
  if (event.errorCode) out.errorCode = event.errorCode
  if (event.metadata) out.metadata = event.metadata
  if (event.error) out.error = event.error
  return out
}
