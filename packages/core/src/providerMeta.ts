import { DEFAULT_MODELS, STORE_KEYS, type GenerationProviderName } from './constants'

/**
 * Static per-generation-provider display info shared between apps/mobile's Settings screens and
 * (once wired in) the desktop app's own — one place instead of two copies drifting apart. Icon and
 * accent color are deliberately NOT here: they're tied to each app's own icon library
 * (Ionicons on mobile, lucide-react on desktop) and theme, so each app supplies those itself
 * alongside this shared data.
 */
export interface ProviderMetaData {
  label: string
  models: readonly string[]
  usageUrl: string
  description: string
}

export const PROVIDER_META_DATA: Record<GenerationProviderName, ProviderMetaData> = {
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    usageUrl: 'https://platform.openai.com/usage',
    description: 'Meanings, examples, clusters, phrases, and cloze - the default generation provider.',
  },
  mistral: {
    label: 'Mistral',
    models: ['mistral-small-latest', 'mistral-medium-latest'],
    usageUrl: 'https://console.mistral.ai/usage',
    description: 'BYOK alternative for card generation and translation.',
  },
  gemini: {
    label: 'Gemini',
    models: ['gemini-3.5-flash-lite', 'gemini-2.5-flash'],
    usageUrl: 'https://aistudio.google.com/usage',
    description: 'Google Gemini BYOK for card generation and translation.',
  },
  anthropic: {
    label: 'Claude',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-5'],
    usageUrl: 'https://platform.claude.com/settings/usage',
    description: 'Claude BYOK for card generation and translation.',
  },
  deepseek: {
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    usageUrl: 'https://platform.deepseek.com/usage',
    description: 'BYOK alternative for card generation and translation.',
  },
  groq: {
    label: 'Groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    usageUrl: 'https://console.groq.com/home',
    description: 'Fast inference BYOK for card generation and translation.',
  },
}

/** Storage key names per provider — shared naming only, see constants.ts's own doc comment. */
export const PROVIDER_STORE_KEYS: Record<GenerationProviderName, { key: string; enabled: string; model: string; validatedKey: string }> = {
  openai: { key: STORE_KEYS.openaiKey, enabled: STORE_KEYS.openaiEnabled, model: STORE_KEYS.openaiModel, validatedKey: STORE_KEYS.openaiValidatedKey },
  mistral: { key: STORE_KEYS.mistralKey, enabled: STORE_KEYS.mistralEnabled, model: STORE_KEYS.mistralModel, validatedKey: STORE_KEYS.mistralValidatedKey },
  gemini: { key: STORE_KEYS.geminiKey, enabled: STORE_KEYS.geminiEnabled, model: STORE_KEYS.geminiModel, validatedKey: STORE_KEYS.geminiValidatedKey },
  anthropic: { key: STORE_KEYS.claudeKey, enabled: STORE_KEYS.claudeEnabled, model: STORE_KEYS.claudeModel, validatedKey: STORE_KEYS.claudeValidatedKey },
  deepseek: { key: STORE_KEYS.deepseekKey, enabled: STORE_KEYS.deepseekEnabled, model: STORE_KEYS.deepseekModel, validatedKey: STORE_KEYS.deepseekValidatedKey },
  groq: { key: STORE_KEYS.groqKey, enabled: STORE_KEYS.groqEnabled, model: STORE_KEYS.groqModel, validatedKey: STORE_KEYS.groqValidatedKey },
}

export interface ProviderFormState {
  apiKey: string
  model: string
  enabled: boolean
}

export const emptyProviderState = (name: GenerationProviderName): ProviderFormState => ({
  apiKey: '',
  model: DEFAULT_MODELS[name],
  enabled: true,
})

export const DEEPL_USAGE_URL = 'https://www.deepl.com/en/your-account/usage'
