import { createSessionId } from './correlation'
import type { DiagnosticSession } from './types'

export const DIAGNOSTIC_MODE_MAX_DURATION_MS = 30 * 60 * 1000
let session: DiagnosticSession | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<(value: DiagnosticSession | null) => void>()

function notify(): void {
  listeners.forEach((listener) => listener(session))
}

export function enableDiagnosticMode(
  now = new Date(),
  durationMs = DIAGNOSTIC_MODE_MAX_DURATION_MS,
): DiagnosticSession {
  const duration = Math.max(1, Math.min(durationMs, DIAGNOSTIC_MODE_MAX_DURATION_MS))
  session = {
    id: createSessionId(),
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + duration).toISOString(),
  }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    session = null
    timer = undefined
    notify()
  }, duration)
  ;(timer as { unref?: () => void }).unref?.()
  notify()
  return session
}

export function disableDiagnosticMode(): void {
  if (timer) clearTimeout(timer)
  timer = undefined
  session = null
  notify()
}

export function getDiagnosticSession(now = new Date()): DiagnosticSession | null {
  if (session && Date.parse(session.expiresAt) <= now.getTime()) disableDiagnosticMode()
  return session
}

export function subscribeDiagnosticMode(listener: (value: DiagnosticSession | null) => void): () => void {
  listeners.add(listener)
  listener(getDiagnosticSession())
  return () => {
    listeners.delete(listener)
  }
}
