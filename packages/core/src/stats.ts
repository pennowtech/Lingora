/** The minimal per-day shape buildHeatmap needs — a structural subset of @lingora/database's
 * DayReviewCount, kept separate so this package doesn't depend on the database package (which
 * itself depends on @lingora/core — a real dependency back here would be circular). */
export interface DayCount {
  count: number
}

/** Consecutive reviewed days counting back from today (or yesterday, so an unfinished today doesn't break it). */
export function streakFromDayIndexes(days: number[]): number {
  if (days.length === 0) return 0
  const today = Math.floor(Date.now() / 86_400_000)
  let expected = days[0] === today || days[0] === today - 1 ? days[0] : -1
  if (expected === -1) return 0
  let streak = 0
  for (const day of days) {
    if (day !== expected) break
    streak += 1
    expected -= 1
  }
  return streak
}

/**
 * Buckets daily review counts into 0-4 intensity levels for the heatmap,
 * relative to the busiest day in the range (so the scale adapts to how
 * active this particular user is, rather than fixed absolute thresholds).
 * Returns rows of `columns` days, oldest first, matching `counts`' order.
 */
export function buildHeatmap(counts: DayCount[], columns = 7): number[][] {
  const max = Math.max(0, ...counts.map((c) => c.count))
  const intensity = (count: number): number => {
    if (count === 0 || max === 0) return 0
    return Math.min(4, Math.ceil((count / max) * 4))
  }
  const rows: number[][] = []
  for (let i = 0; i < counts.length; i += columns) {
    rows.push(counts.slice(i, i + columns).map((c) => intensity(c.count)))
  }
  return rows
}
