import type { ProviderUsage } from '@lingora/ai'
import * as SecureStore from 'expo-secure-store'

/**
 * Device-observed usage counters per provider — request count + tokens,
 * persisted in SecureStore alongside the keys. Not a substitute for a
 * provider's own billing dashboard (see the "Open usage ↗" links in
 * Settings): this is only what this installation has actually sent.
 */
export interface UsageSnapshot {
  requests: number
  tokensUsed: number
}

const ZERO_USAGE: UsageSnapshot = { requests: 0, tokensUsed: 0 }

function usageKey(providerName: string): string {
  return `lingora.usage.${providerName}`
}

export async function getUsage(providerName: string): Promise<UsageSnapshot> {
  const raw = await SecureStore.getItemAsync(usageKey(providerName))
  if (raw === null) return ZERO_USAGE
  try {
    const parsed = JSON.parse(raw) as Partial<UsageSnapshot>
    return { requests: parsed.requests ?? 0, tokensUsed: parsed.tokensUsed ?? 0 }
  } catch {
    return ZERO_USAGE
  }
}

async function recordUsage(providerName: string, usage: ProviderUsage): Promise<void> {
  const current = await getUsage(providerName)
  const next: UsageSnapshot = {
    requests: current.requests + 1,
    tokensUsed: current.tokensUsed + usage.tokensUsed,
  }
  await SecureStore.setItemAsync(usageKey(providerName), JSON.stringify(next))
}

export async function clearUsage(providerName: string): Promise<void> {
  await SecureStore.deleteItemAsync(usageKey(providerName))
}

/**
 * Wrap a provider so every successful call records its usage. Every
 * AIProvider/DictionaryProvider method resolves to a value with a `.usage`
 * field (AIResult, WordPackageResult), so one Proxy over the method table
 * captures all of it — no per-call-site bookkeeping in every screen that
 * calls the pipeline.
 */
export function withUsageTracking<T extends object>(provider: T, providerName: string): T {
  return new Proxy(provider, {
    get(target, prop, receiver: unknown) {
      const value: unknown = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value
      return async (...args: unknown[]): Promise<unknown> => {
        const result: unknown = await (value as (...a: unknown[]) => unknown).apply(target, args)
        const usage = (result as { usage?: ProviderUsage } | null)?.usage
        if (usage) void recordUsage(providerName, usage)
        return result
      }
    },
  })
}
