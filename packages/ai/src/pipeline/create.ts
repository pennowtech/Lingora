import type { DatabaseAdapter } from '@lingora/database'
import { GenerationCache } from '../cache/cache'
import { ensurePromptVersions } from '../prompts/seed'
import type { AIProvider, DictionaryProvider } from '../providers/types'
import { lookupOrGenerate, type LookupOptions, type LookupOutcome } from './lookup-or-generate'

export interface AIPipelineOptions {
  db: DatabaseAdapter
  ai: AIProvider
  /** Optional translator for the baseline hint (DeepL later). Absent → generation runs without a hint. */
  dictionary?: DictionaryProvider
  maxMemoryCacheEntries?: number
}

export interface AIPipeline {
  lookupOrGenerate(word: string, opts: LookupOptions): Promise<LookupOutcome>
  /** Active cache cleanup after a prompt bump (new keys already miss old rows). */
  invalidateCacheForPromptVersion(promptVersionId: string): Promise<void>
}

/**
 * Wire the pipeline: seeds prompt_versions (idempotent, hence async) and
 * builds the two-level cache. Construct once at startup, after migrate().
 */
export async function createAIPipeline(options: AIPipelineOptions): Promise<AIPipeline> {
  const prompts = await ensurePromptVersions(options.db)
  const wordPackagePrompt = prompts.get('wordPackage')
  if (!wordPackagePrompt) {
    throw new Error('prompt seeding did not produce the word_package prompt')
  }

  const cache = new GenerationCache(options.db, options.maxMemoryCacheEntries ?? 100)
  const deps = {
    db: options.db,
    ai: options.ai,
    dictionary: options.dictionary,
    cache,
    wordPackagePrompt,
  }

  return {
    lookupOrGenerate: (word, opts) => lookupOrGenerate(deps, word, opts),
    invalidateCacheForPromptVersion: (promptVersionId) =>
      cache.invalidatePromptVersion(promptVersionId),
  }
}
