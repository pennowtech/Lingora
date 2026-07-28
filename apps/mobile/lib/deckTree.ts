import type { Deck } from '@lingora/types'

/**
 * Every deck nested under `rootId`, at any depth — moving or merging a deck
 * into its own descendant would create a cycle (or, for merge, try to
 * re-parent the target onto itself), so both pickers exclude these.
 */
export function collectDescendantIds(decks: Deck[], rootId: string): Set<string> {
  const childrenByParent = new Map<string, string[]>()
  for (const d of decks) {
    if (!d.parentId) continue
    childrenByParent.set(d.parentId, [...(childrenByParent.get(d.parentId) ?? []), d.id])
  }
  const descendants = new Set<string>()
  const stack = [rootId]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const childId of childrenByParent.get(current) ?? []) {
      if (!descendants.has(childId)) {
        descendants.add(childId)
        stack.push(childId)
      }
    }
  }
  return descendants
}
