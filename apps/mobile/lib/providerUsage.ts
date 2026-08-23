import * as SecureStore from 'expo-secure-store'
import { withUsageTracking as withUsageTrackingCore, ZERO_USAGE, type UsageLike, type UsageSnapshot } from '@lingora/core'

export type { UsageSnapshot }

/**
 * Device-observed usage counters per provider — request count + tokens,
 * persisted in SecureStore alongside the keys. Not a substitute for a
 * provider's own billing dashboard (see the "Open usage ↗" links in
 * Settings): this is only what this installation has actually sent.
 *
 * The generic Proxy-wrapping logic lives in @lingora/core (withUsageTracking) so the desktop app
 * can reuse it too, with its own SecureStore-equivalent persistence — this file only supplies the
 * mobile-specific storage.
 */

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

async function recordUsage(providerName: string, usage: UsageLike): Promise<void> {
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

export function withUsageTracking<T extends object>(provider: T, providerName: string): T {
  return withUsageTrackingCore(provider, (usage) => {
    void recordUsage(providerName, usage)
  })
}
