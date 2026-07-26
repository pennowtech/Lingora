export interface LogFileInfo {
  name: string
  size: number
  modifiedAt: number
}
export interface RetentionPolicy {
  maxFiles: number
  maxTotalBytes: number
  retentionMs: number
  nowMs: number
}

export function selectLogFilesToDelete(files: LogFileInfo[], policy: RetentionPolicy): string[] {
  const deleted = new Set<string>()
  let kept = [...files].sort((a, b) => a.modifiedAt - b.modifiedAt)
  kept.forEach((file) => {
    if (policy.nowMs - file.modifiedAt > policy.retentionMs) deleted.add(file.name)
  })
  kept = kept.filter((file) => !deleted.has(file.name))
  while (kept.length > policy.maxFiles) deleted.add(kept.shift()!.name)
  let total = kept.reduce((sum, file) => sum + file.size, 0)
  while (total > policy.maxTotalBytes && kept.length > 1) {
    const file = kept.shift()!
    deleted.add(file.name)
    total -= file.size
  }
  return [...deleted]
}
