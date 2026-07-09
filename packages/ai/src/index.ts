// Provider slots and their contracts
export type {
  AIProvider,
  AIResult,
  ClusterRef,
  DictionaryProvider,
  GeneratedClusterOutline,
  GenerationContext,
  ProviderUsage,
  WordPackageResult,
} from './providers/types'

// Concrete providers
export { OpenAIProvider, type OpenAIProviderConfig } from './providers/openai'

// Pipeline
export { createAIPipeline, type AIPipeline, type AIPipelineOptions } from './pipeline/create'
export type { LookupOptions, LookupOutcome } from './pipeline/lookup-or-generate'

// Errors — switch on error.code: 'provider' | 'parse' | 'validation'
export {
  AIError,
  AIProviderError,
  AIResponseParseError,
  AIValidationError,
  type AIErrorCode,
} from './errors'

// Schemas, for consumers that validate externally (import zod themselves)
export {
  generatedClusterSchema,
  generatedClozeSchema,
  generatedExampleSchema,
  generatedMeaningSchema,
  generatedPhraseSchema,
  generatedSynonymSchema,
  salvagePartial,
  wordGenerationSchema,
  type PartialWordGeneration,
} from './schemas/generation'

// Prompt registry (templates are versioned application logic)
export { PROMPTS, renderPrompt, type PromptName, type PromptTemplate } from './prompts/templates'
export { ensurePromptVersions } from './prompts/seed'
