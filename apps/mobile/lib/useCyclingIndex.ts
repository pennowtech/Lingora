import { useEffect, useState } from 'react'

/**
 * Cycles a 0-based index through `count` slots every `intervalMs` while `active` is true — the
 * caller indexes its own (freshly rendered, so always up to date) array of messages with it. Used
 * to turn an otherwise static "Generating…" wait into a rotating status line without claiming any
 * real progress signal — the underlying AI call doesn't report partial progress, this is purely
 * about making the wait feel legible rather than dead air.
 *
 * Takes `count` rather than the messages themselves so the effect's dependency array only ever
 * compares a stable primitive — an inline `[msg1, msg2, msg3]` array literal gets a new identity
 * every render (e.g. because one message interpolates a translated word), which would otherwise
 * restart the interval on every render instead of running it once per activation.
 *
 * Resets to 0 whenever `active` transitions to false, so the next activation always starts at the
 * first message rather than resuming wherever it left off.
 */
export function useCyclingIndex(active: boolean, count: number, intervalMs = 2200): number {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active || count <= 1) {
      setIndex(0)
      return
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, intervalMs)
    return () => clearInterval(id)
  }, [active, count, intervalMs])

  return index
}
