/**
 * Request timeout via AbortController.
 *
 * Deliberately not AbortSignal.timeout(): this package also runs inside
 * React Native (Hermes), where the static isn't guaranteed — plain
 * AbortController + setTimeout works on every runtime the app targets.
 */
export interface RequestTimeout {
  signal: AbortSignal
  /** True once the timer fired — distinguishes timeout from network failure. */
  didTimeout: () => boolean
  /** Clear the timer once the request settles. */
  clear: () => void
  /**
   * Wrap a fetch call so it's GUARANTEED to settle once this timeout fires, even if the
   * underlying native fetch implementation never itself resolves/rejects. `signal.abort()` alone
   * is not enough on every runtime: observed in practice on Android/React Native, a connection
   * that stalls before any response arrives at all (a DNS/TCP/TLS-level hang, as opposed to a
   * slow-arriving response body) can leave the abort signal's cancellation unable to reach an
   * already-stuck native socket, so the awaited fetch() promise itself never settles — every
   * safeguard built purely on AbortSignal (including the caller's own try/catch around this same
   * call) never gets a chance to run, and the app is left showing a spinner indefinitely. This
   * closes that gap: the exact same timer that calls `signal`'s abort() also directly rejects
   * whatever's passed to `guard`, independent of whether the native layer cooperates.
   */
  guard: <T>(promise: Promise<T>) => Promise<T>
}

export function startRequestTimeout(timeoutMs: number): RequestTimeout {
  const controller = new AbortController()
  let timedOut = false
  let hardReject: ((reason: unknown) => void) | null = null
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
    hardReject?.(new Error(`Request timed out after ${timeoutMs}ms`))
  }, timeoutMs)

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    clear: () => clearTimeout(timer),
    guard: <T>(promise: Promise<T>) =>
      new Promise<T>((resolve, reject) => {
        hardReject = reject
        promise.then(resolve, reject)
      }),
  }
}

/** Coarse bucket for a log line — cardinality-friendly for aggregation, never the exact count of a
 * specific request (which would make a log line fingerprintable back to one user's word lookup). */
export function bucketTokenCount(tokens: number): string {
  if (tokens < 500) return '<500'
  if (tokens < 1500) return '500-1500'
  if (tokens < 3000) return '1500-3000'
  return '3000+'
}
