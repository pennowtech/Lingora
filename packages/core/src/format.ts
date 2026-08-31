/** 'just now' · '5 min ago' · '3 h ago' · '2 d ago' — mining queue and similar relative timestamps. */
export function timeAgo(timestamp: number): string {
  const elapsed = Date.now() - timestamp
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return `${days} d ago`
}
