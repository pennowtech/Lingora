import type { MinedPassageAnalysis } from '@lingora/types'

/**
 * In-memory only, by design: a plain module-scope Map lives exactly as long as the JS
 * engine does. Backgrounding the app (home button, app switcher) never tears this down,
 * so a re-opened passage still reads its cached analysis. A real app close/relaunch
 * (or the OS reclaiming the process) restarts the JS engine and wipes the module fresh -
 * no explicit AppState listener needed to get "clear on close, keep across background".
 */
const analysisCache = new Map<string, MinedPassageAnalysis>()

export function getCachedAnalysis(key: string): MinedPassageAnalysis | undefined {
  return analysisCache.get(key)
}

export function setCachedAnalysis(key: string, analysis: MinedPassageAnalysis): void {
  analysisCache.set(key, analysis)
}

export function clearCachedAnalysis(key: string): void {
  analysisCache.delete(key)
}
