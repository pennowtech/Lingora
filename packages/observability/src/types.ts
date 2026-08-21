import type { LogLevel } from './levels'

export type LogResult = 'success' | 'failure' | 'cancelled' | 'timeout' | 'degraded'
export type AppPlatform = 'android' | 'ios' | 'web' | 'desktop' | 'server'
export type AppEnvironment = 'development' | 'staging' | 'production'
export type LogMetadataValue = string | number | boolean | null

export interface SafeLogMetadata {
  source?: LogMetadataValue
  sourceLanguage?: LogMetadataValue
  targetLanguage?: LogMetadataValue
  /** CEFR level (A1..C2) — a closed enum, never user-authored text. */
  cefrLevel?: LogMetadataValue
  provider?: LogMetadataValue
  providerCategory?: LogMetadataValue
  modelAlias?: LogMetadataValue
  promptVersion?: LogMetadataValue
  schemaVersion?: LogMetadataValue
  retryCount?: LogMetadataValue
  cacheHit?: LogMetadataValue
  fallbackUsed?: LogMetadataValue
  statusCode?: LogMetadataValue
  routeTemplate?: LogMetadataValue
  method?: LogMetadataValue
  networkType?: LogMetadataValue
  inputLengthBucket?: LogMetadataValue
  outputLengthBucket?: LogMetadataValue
  tokenCountBucket?: LogMetadataValue
  responseSizeBucket?: LogMetadataValue
  databaseVersion?: LogMetadataValue
  migrationVersion?: LogMetadataValue
  queueSize?: LogMetadataValue
  itemCount?: LogMetadataValue
  conflictCount?: LogMetadataValue
  settingGroup?: LogMetadataValue
  settingKey?: LogMetadataValue
  occurrenceCount?: LogMetadataValue
  windowMs?: LogMetadataValue
  recordId?: LogMetadataValue
  dictHintDurationMs?: LogMetadataValue
  llmDurationMs?: LogMetadataValue
  dbPersistDurationMs?: LogMetadataValue
  morphologyDurationMs?: LogMetadataValue
  cacheCheckDurationMs?: LogMetadataValue
  detectDurationMs?: LogMetadataValue
  reverseTranslateDurationMs?: LogMetadataValue
  pipelineDurationMs?: LogMetadataValue
  totalFlowDurationMs?: LogMetadataValue
  navPrepareDurationMs?: LogMetadataValue
}

export type LingoraFeature =
  | 'app'
  | 'database'
  | 'ai'
  | 'dictionary'
  | 'search'
  | 'vocabulary'
  | 'deck'
  | 'mining'
  | 'srs'
  | 'settings'
  | 'sync'
  | 'import'
  | 'export'
  | 'network'
  | 'diagnostics'

export interface LogContext {
  feature: LingoraFeature
  screen?: string
  component?: string
  operation?: string
  sessionId: string
  operationId?: string
  requestId?: string
  traceId?: string
  /** Pseudonymous internal identifier only; never an email, provider subject, or token. */
  userInternalId?: string
  /** Stable per-install identifier (survives across sessions) — pairs with the per-launch
   * `sessionId` so a bug report can be traced across a device's whole history, not just one run. */
  deviceId?: string
  appVersion: string
  buildNumber: string
  platform: AppPlatform
  environment: AppEnvironment
  expoUpdateId?: string
  runtimeVersion?: string
  diagnosticSessionId?: string
}

export interface SafeLogPayload {
  /** Compulsory, static developer-readable text — never user or vocabulary content. Every log line
   * must be understandable on its own in a log viewer, without cross-referencing the source for
   * what the event name means. */
  message: string
  /** Only meaningful for an operation that could have failed — omit entirely for a plain info log
   * that just records something happened; `result: 'success'` on every line is noise. */
  result?: LogResult
  durationMs?: number
  errorCode?: string
  metadata?: SafeLogMetadata
}

export interface NormalizedLogError {
  name: string
  message: string
  code?: string
  stack?: string
  cause?: NormalizedLogError
}

export interface StructuredLogEvent {
  timestamp: string
  level: LogLevel
  event: string
  message?: string
  context: LogContext
  result?: LogResult
  durationMs?: number
  errorCode?: string
  error?: NormalizedLogError
  metadata?: SafeLogMetadata
}

export interface LingoraLogger {
  debug(event: string, payload: SafeLogPayload): void
  info(event: string, payload: SafeLogPayload): void
  warn(event: string, payload: SafeLogPayload): void
  error(event: string, error: unknown, payload: SafeLogPayload): void
  /** Unrecoverable errors only — the app can't continue from this state (vs. `error`, for handled
   * failures the app recovers from). */
  fatal(event: string, error: unknown, payload: SafeLogPayload): void
  child(context: Partial<LogContext>): LingoraLogger
}

/** Internal transport contract. Feature code receives only LingoraLogger. */
export interface ObservabilitySink {
  write(event: StructuredLogEvent): void
}

export interface FlushableObservabilitySink extends ObservabilitySink {
  flush(): Promise<void>
}

export interface ObservabilityConfig {
  context: Omit<LogContext, 'sessionId'> & { sessionId?: string }
  enabled?: boolean
  additionalSinks?: ObservabilitySink[]
  now?: () => Date
  maxEventsPerMinute?: number
  duplicateWindowMs?: number
}

export interface DiagnosticSession {
  id: string
  startedAt: string
  expiresAt: string
}
