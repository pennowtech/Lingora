// Provider slots and their contracts
export type {
  AIProvider,
  AIResult,
  ClusterRef,
  DictionaryProvider,
  ExampleGenerationOptions,
  GeneratedClusterOutline,
  GenerationContext,
  ProviderUsage,
  WordPackageResult,
} from './providers/types'

// Concrete providers
export { OpenAIProvider, type OpenAIProviderConfig } from './providers/openai'
export { MistralProvider, type MistralProviderConfig } from './providers/mistral'
export { GeminiProvider, type GeminiProviderConfig } from './providers/gemini'
export { AnthropicProvider, type AnthropicProviderConfig } from './providers/anthropic'
export {
  GoogleTranslateProvider,
  type GoogleTranslateProviderConfig,
} from './providers/google-translate'
export { DeepLProvider, type DeepLProviderConfig } from './providers/deepl'

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
  wordGenerationSchemaForLanguage,
  type PartialWordGeneration,
} from './schemas/generation'

// Prompt registry (templates are versioned application logic)
export { LANGUAGE_NAMES, PROMPTS, renderPrompt, type PromptName, type PromptTemplate } from './prompts/templates'
export { ensurePromptVersions } from './prompts/seed'
