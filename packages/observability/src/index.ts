// Note: the expo-file-system transport is a separate entry point
// (`@lingora/observability/expo`), not re-exported here. Node-only consumers
// (packages/ai, packages/database, their vitest suites) import only this
// index, which must stay free of any `expo-file-system` import — that
// package isn't installed outside apps/mobile, and a static import here
// would break their module resolution even if the export were unused.
export { configureObservability, logger } from './logger'
export { createJsonLinesSink } from './json-lines.transport'
export {
  enableDiagnosticMode,
  disableDiagnosticMode,
  getDiagnosticSession,
  subscribeDiagnosticMode,
  DIAGNOSTIC_MODE_MAX_DURATION_MS,
} from './diagnostic-mode'
export { EventGate } from './event-gate'
export { selectLogFilesToDelete } from './retention'
export { logLevels } from './levels'
export { ALLOWED_METADATA_KEYS, LINGORA_FEATURES, isValidEventName } from './policy'
export { normalizeError, sanitizeMetadata, sanitizeText, sanitizeUnknown } from './sanitizer'
export { createOperationId, createRequestId, createSessionId, createTraceId } from './correlation'
export type { LogLevel } from './levels'
export type {
  AppEnvironment,
  DiagnosticSession,
  AppPlatform,
  FlushableObservabilitySink,
  LingoraFeature,
  LingoraLogger,
  LogContext,
  LogMetadataValue,
  LogResult,
  NormalizedLogError,
  ObservabilityConfig,
  SafeLogPayload,
  SafeLogMetadata,
  StructuredLogEvent,
} from './types'
export type { JsonLinesWriter } from './json-lines.transport'
