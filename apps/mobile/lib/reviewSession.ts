import { logger } from '@lingora/observability'
import * as SecureStore from 'expo-secure-store'
import { STORE_KEYS } from './services'

const log = logger.child({ feature: 'srs', component: 'reviewSession' })

/** How many due cards a single review session pulls in, before expanding into per-format entries
 * (Mixed practice) — applies to every review mode (plain, cloze, reverse, mixed), not just Mixed.
 * A big deck coming due all at once (fresh import, first day back after a break) would otherwise
 * dump its entire due queue into one sitting; capping it and letting the learner start another
 * session immediately once they finish (see "Practice more" in review/[deckId].tsx) keeps a single
 * sitting a manageable size without making the rest wait until the cards' next natural due date. */
export const SESSION_CARD_LIMIT_OPTIONS: readonly number[] = [10, 20, 30, 50, 100]

/** 0 means "no limit" — pulls every due card into one session, the pre-cap behavior. */
export const NO_SESSION_LIMIT = 0
export const DEFAULT_SESSION_CARD_LIMIT = 20

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
