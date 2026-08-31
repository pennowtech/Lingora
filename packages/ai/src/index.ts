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
export { DeepSeekProvider, type DeepSeekProviderConfig } from './providers/deepseek'
export { GroqProvider, type GroqProviderConfig } from './providers/groq'
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

// Provider-key validation & user-friendly error formatting — shared between apps/mobile and the
// desktop app's Settings screens (lives here, not packages/core, to avoid a circular dependency —
// see validation.ts's own doc comment).
export {
  formatUserFriendlyProviderError,
  validateClaudeKey,
  validateDeepLKey,
  validateDeepSeekKey,
  validateGeminiKey,
  validateGroqKey,
  validateMistralKey,
  validateOpenAIKey,
  type TranslateFn,
  type ValidationResult,
} from './validation'

// Network-error classification and dictionary-language detection — same circular-dependency
// reason as validation.ts above.
export { isNetworkError, networkErrorMessage } from './networkError'
export { detectSearchLanguage } from './languageDetection'
