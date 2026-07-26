import { ALLOWED_METADATA_KEYS } from './policy'
import type { LogMetadataValue, NormalizedLogError, SafeLogMetadata } from './types'

const MAX_TEXT_LENGTH = 500
const MAX_STACK_LENGTH = 2_000
const MAX_CAUSE_DEPTH = 2

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi
const secretAssignmentPattern =
  /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi
const urlPattern = /https?:\/\/[^\s)\]}]+/gi
const windowsPathPattern = /\b[A-Za-z]:\\(?:[^\s\\]+\\)*[^\s\\]+/g
const unixPathPattern = /(?:^|\s)\/(?:Users|home|data|storage|var|tmp)\/[^\s]+/g
const forbiddenObjectKeys =
  /^(?:password|apiKey|token|authorization|email|word|translation|prompt|completion|responseBody|requestBody|headers|cookie)$/i

function sanitizeUrl(value: string): string {
  try {
    const parsed = new URL(value)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return '[URL_REDACTED]'
  }
}

export function sanitizeText(value: string, maxLength = MAX_TEXT_LENGTH): string {
  const sanitized = value
    .replace(emailPattern, '[EMAIL_REDACTED]')
    .replace(bearerPattern, 'Bearer [REDACTED]')
    .replace(secretAssignmentPattern, '$1=[REDACTED]')
    .replace(urlPattern, sanitizeUrl)
    .replace(windowsPathPattern, '[PATH_REDACTED]')
    .replace(unixPathPattern, ' [PATH_REDACTED]')
    .trim()
  return sanitized.length <= maxLength ? sanitized : `${sanitized.slice(0, maxLength - 1)}…`
}

export function sanitizeMetadata(metadata: SafeLogMetadata | undefined): SafeLogMetadata | undefined {
  if (!metadata) return undefined
  const safe: Record<string, string | number | boolean | null> = {}
  const entries = Object.entries(metadata) as [string, LogMetadataValue | undefined][]
  for (const [key, value] of entries) {
    if (Object.keys(safe).length >= 20) break
    if (!ALLOWED_METADATA_KEYS.has(key)) continue
    if (typeof value === 'string') {
      const sanitized = sanitizeText(value, 120)
      safe[key] = key === 'routeTemplate' ? (sanitized.split(/[?#]/, 1)[0] ?? sanitized) : sanitized
    } else {
      safe[key] = value ?? null
    }
  }
  return Object.keys(safe).length > 0 ? (safe as SafeLogMetadata) : undefined
}

/** Defensive boundary for future export/remote pipelines that receive unknown nested input. */
export function sanitizeUnknown(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (depth > 8) return '[DEPTH_LIMIT]'
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'string') return sanitizeText(value)
  if (typeof value !== 'object') return undefined
  if (seen.has(value)) return '[CIRCULAR]'
  seen.add(value)
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeUnknown(item, seen, depth + 1))
  const safe: Record<string, unknown> = {}
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenObjectKeys.test(key)) continue
    const sanitized = sanitizeUnknown(nested, seen, depth + 1)
    if (sanitized !== undefined) safe[key] = sanitized
  }
  return safe
}

export function normalizeError(value: unknown, depth = 0): NormalizedLogError {
  if (depth > MAX_CAUSE_DEPTH) return { name: 'Error', message: 'Nested cause omitted' }
  if (!(value instanceof Error)) {
    return { name: 'NonErrorThrown', message: sanitizeText(String(value)) }
  }
  const candidate = value as Error & { code?: unknown; cause?: unknown }
  return {
    name: sanitizeText(value.name || 'Error', 80),
    message: sanitizeText(value.message || 'Unknown error'),
    ...(typeof candidate.code === 'string' ? { code: sanitizeText(candidate.code, 120) } : {}),
    ...(value.stack ? { stack: sanitizeText(value.stack, MAX_STACK_LENGTH) } : {}),
    ...(candidate.cause !== undefined ? { cause: normalizeError(candidate.cause, depth + 1) } : {}),
  }
}
