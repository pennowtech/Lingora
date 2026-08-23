/** The minimal per-deck shape collectDescendantIds needs — a structural subset of
 * @lingora/types's Deck, kept separate so this package doesn't depend on @lingora/types for
 * something this small (and so any caller with a locally-shaped deck object can use it too). */
export interface DeckTreeNode {
  id: string
  parentId?: string
}

/**
 * Every deck nested under `rootId`, at any depth — moving or merging a deck
 * into its own descendant would create a cycle (or, for merge, try to
 * re-parent the target onto itself), so both pickers exclude these.
 */
export function collectDescendantIds(decks: DeckTreeNode[], rootId: string): Set<string> {
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
