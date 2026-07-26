/** Standard severity ladder — maps cleanly onto log aggregators (Datadog, Sentry, CloudWatch, ...)
 * that filter/alert by level name. `fatal` is for unrecoverable errors (crashes, corrupted state
 * the app can't continue from); ordinary caught/handled errors are `error`. */
export const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
} as const

export type LogLevel = keyof typeof logLevels

export const productionMinimumLevel: LogLevel = 'info'
export const developmentMinimumLevel: LogLevel = 'debug'
