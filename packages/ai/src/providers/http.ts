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
}

export function startRequestTimeout(timeoutMs: number): RequestTimeout {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    clear: () => clearTimeout(timer),
  }
}
