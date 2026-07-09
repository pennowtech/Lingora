/**
 * Error taxonomy for the AI layer.
 *
 * Everything thrown by @lingora/ai extends AIError and carries a literal
 * `code`, so callers can switch on `error.code` instead of instanceof chains
 * (which survive bundling less reliably).
 *
 * Validation failure after the retry is NOT an error — the pipeline returns a
 * partial result as a value (see LookupOutcome), because the UI has to render
 * it, not catch it.
 */

export type AIErrorCode = 'provider' | 'parse' | 'validation'

export abstract class AIError extends Error {
  abstract readonly code: AIErrorCode

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/**
 * The provider call itself failed: network error, timeout, bad key, rate
 * limit, 5xx. `retryable` tells the caller whether trying again can help.
 */
export class AIProviderError extends AIError {
  readonly code = 'provider'

  constructor(
    message: string,
    readonly providerName: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message)
  }
}

/**
 * The response text was not JSON even after repair. Carries the raw text so
 * bad outputs can be logged and turned into prompt fixes.
 */
export class AIResponseParseError extends AIError {
  readonly code = 'parse'

  constructor(
    message: string,
    readonly raw: string,
  ) {
    super(message)
  }
}

/**
 * The response parsed as JSON but failed schema validation.
 * Thrown internally to drive the retry; what escapes the pipeline after a
 * failed retry is a partial-result value, not this error.
 */
export class AIValidationError extends AIError {
  readonly code = 'validation'

  constructor(
    message: string,
    readonly issues: readonly string[],
    readonly raw: string,
  ) {
    super(message)
  }
}
