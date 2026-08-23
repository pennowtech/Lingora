/** The minimal per-call usage shape withUsageTracking needs — a structural subset of
 * @lingora/ai's ProviderUsage, kept separate so this package doesn't depend on @lingora/ai (which
 * itself depends on @lingora/database, which depends on @lingora/core — a dependency back here
 * would be circular). */
export interface UsageLike {
  tokensUsed: number
}

/** Device-observed usage counters per provider — request count + tokens. Not a substitute for a
 * provider's own billing dashboard: this is only what this installation has actually sent. */
export interface UsageSnapshot {
  requests: number
  tokensUsed: number
}

export const ZERO_USAGE: UsageSnapshot = { requests: 0, tokensUsed: 0 }

/**
 * Wrap a provider so every successful call reports its usage via `onUsage` — every
 * AIProvider/DictionaryProvider method resolves to a value with a `.usage` field (AIResult,
 * WordPackageResult), so one Proxy over the method table captures all of it, no per-call-site
 * bookkeeping needed in every screen that calls the pipeline.
 *
 * Persistence is deliberately not baked in here (unlike a single-app version might do) — each app
 * owns its own key/value store (SecureStore on mobile, localStorage on desktop); `onUsage` is
 * where a caller plugs that in.
 */
export function withUsageTracking<T extends object>(provider: T, onUsage: (usage: UsageLike) => void): T {
  return new Proxy(provider, {
    get(target, prop, receiver: unknown) {
      const value: unknown = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value
      return async (...args: unknown[]): Promise<unknown> => {
        const result: unknown = await (value as (...a: unknown[]) => unknown).apply(target, args)
        const usage = (result as { usage?: UsageLike } | null)?.usage
        if (usage) onUsage(usage)
        return result
      }
    },
  })
}
