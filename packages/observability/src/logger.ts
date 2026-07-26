import { createConsoleSink } from './console.transport'
import { createSessionId } from './correlation'
import type { LogLevel } from './levels'
import { EventGate } from './event-gate'
import { getDiagnosticSession } from './diagnostic-mode'
import { isValidEventName, LINGORA_FEATURES } from './policy'
import { normalizeError, sanitizeMetadata, sanitizeText } from './sanitizer'
import type {
  LingoraLogger,
  LogContext,
  ObservabilityConfig,
  ObservabilitySink,
  SafeLogPayload,
  StructuredLogEvent,
} from './types'

class StructuredLogger implements LingoraLogger {
  constructor(
    private readonly context: LogContext,
    private readonly sinks: ObservabilitySink[],
    private readonly now: () => Date,
    private readonly gate: EventGate,
  ) {}

  private emit(level: LogLevel, event: string, payload: SafeLogPayload, error?: unknown): void {
    if (!isValidEventName(event, this.context.feature)) return
    const diagnosticSessionId = getDiagnosticSession(this.now())?.id
    const metadata = sanitizeMetadata(payload.metadata)
    const entry: StructuredLogEvent = {
      timestamp: this.now().toISOString(),
      level,
      event,
      context: { ...this.context, ...(diagnosticSessionId !== undefined ? { diagnosticSessionId } : {}) },
      message: sanitizeText(payload.message),
      ...(payload.result !== undefined ? { result: payload.result } : {}),
      ...(payload.durationMs !== undefined ? { durationMs: payload.durationMs } : {}),
      ...(payload.errorCode ? { errorCode: sanitizeText(payload.errorCode, 120) } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
      ...(error !== undefined ? { error: normalizeError(error) } : {}),
    }
    this.gate.filter(entry).forEach((accepted) =>
      this.sinks.forEach((sink) => {
        try {
          sink.write(accepted)
        } catch {
          // Observability must never break an application workflow.
        }
      }),
    )
  }

  debug(event: string, payload: SafeLogPayload): void {
    this.emit('debug', event, payload)
  }
  info(event: string, payload: SafeLogPayload): void {
    this.emit('info', event, payload)
  }
  warn(event: string, payload: SafeLogPayload): void {
    this.emit('warn', event, payload)
  }
  error(event: string, error: unknown, payload: SafeLogPayload): void {
    this.emit('error', event, payload, error)
  }
  fatal(event: string, error: unknown, payload: SafeLogPayload): void {
    this.emit('fatal', event, payload, error)
  }

  child(context: Partial<LogContext>): LingoraLogger {
    const feature =
      context.feature && LINGORA_FEATURES.includes(context.feature) ? context.feature : this.context.feature
    return new StructuredLogger({ ...this.context, ...context, feature }, this.sinks, this.now, this.gate)
  }
}

const unconfiguredContext: LogContext = {
  feature: 'app',
  sessionId: createSessionId(),
  appVersion: 'unknown',
  buildNumber: 'unknown',
  platform: 'android',
  environment: 'development',
}

let activeLogger: LingoraLogger = new StructuredLogger(
  unconfiguredContext,
  [],
  () => new Date(),
  new EventGate('development'),
)

/**
 * Lazily resolves against whatever `activeLogger` is live at the moment a log method actually
 * fires, rather than capturing `activeLogger`'s sinks once. Needed because `logger.child(...)` is
 * routinely called at MODULE LOAD time (e.g. `const searchLog = logger.child(...)` at the top of a
 * screen file) — module evaluation order can easily run before `configureObservability()` executes
 * during app bootstrap. `StructuredLogger.child()` copies its sinks array by value, so a child built
 * from the pre-configuration logger (sinks: []) would silently drop every log forever, even after
 * `configureObservability` later swaps `activeLogger` out for a fully wired instance.
 */
function createChildLogger(context: Partial<LogContext>): LingoraLogger {
  return {
    debug: (event, payload) => activeLogger.child(context).debug(event, payload),
    info: (event, payload) => activeLogger.child(context).info(event, payload),
    warn: (event, payload) => activeLogger.child(context).warn(event, payload),
    error: (event, error, payload) => activeLogger.child(context).error(event, error, payload),
    fatal: (event, error, payload) => activeLogger.child(context).fatal(event, error, payload),
    child: (nested) => createChildLogger({ ...context, ...nested }),
  }
}

/** Stable facade: imports remain valid when transports are configured during app bootstrap. */
export const logger: LingoraLogger = {
  debug: (event, payload) => activeLogger.debug(event, payload),
  info: (event, payload) => activeLogger.info(event, payload),
  warn: (event, payload) => activeLogger.warn(event, payload),
  error: (event, error, payload) => activeLogger.error(event, error, payload),
  fatal: (event, error, payload) => activeLogger.fatal(event, error, payload),
  child: (context) => createChildLogger(context),
}

export function configureObservability(config: ObservabilityConfig): LingoraLogger {
  const context: LogContext = {
    ...config.context,
    sessionId: config.context.sessionId ?? createSessionId(),
  }
  const sinks: ObservabilitySink[] = [
    createConsoleSink({ enabled: config.enabled ?? true }),
    ...(config.additionalSinks ?? []),
  ]
  const now = config.now ?? (() => new Date())
  activeLogger = new StructuredLogger(
    context,
    sinks,
    now,
    new EventGate(context.environment, now, config.maxEventsPerMinute, config.duplicateWindowMs),
  )
  return logger
}
