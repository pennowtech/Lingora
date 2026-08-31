import { logger } from '@lingora/observability'
import * as SecureStore from 'expo-secure-store'
import { DEFAULT_SESSION_CARD_LIMIT, NO_SESSION_LIMIT, SESSION_CARD_LIMIT_OPTIONS } from '@lingora/core'
import { STORE_KEYS } from './services'

const log = logger.child({ feature: 'srs', component: 'reviewSession' })

export { DEFAULT_SESSION_CARD_LIMIT, NO_SESSION_LIMIT, SESSION_CARD_LIMIT_OPTIONS }

/** The user's session-size preference, SecureStore-backed like every other preference in this app
 * (see services.tsx STORE_KEYS). Falls back to the default on a missing/corrupt value. */
export async function getSessionCardLimit(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEYS.sessionCardLimit)
    if (!raw) return DEFAULT_SESSION_CARD_LIMIT
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_SESSION_CARD_LIMIT
    return parsed
  } catch (error) {
    log.error('srs.session_card_limit_load_failed', error, { message: 'Failed to load the session card limit' })
    return DEFAULT_SESSION_CARD_LIMIT
  }
}

export async function setSessionCardLimit(limit: number): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEYS.sessionCardLimit, String(limit))
}
