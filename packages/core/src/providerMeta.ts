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

/** Richer per-model display info (label/speedTag/description/isDefault) for the model-picker UI
 * in both apps' Settings screens - the single source of truth for which models each provider
 * offers. `PROVIDER_META_DATA[name].models` below is derived from this, not hand-maintained
 * separately, so adding/removing a model here is enough for it to show up on both platforms. */
export interface ModelInfo {
  id: string
  label: string
  speedTag?: string
  description?: string
  isDefault?: boolean
}

export const PROVIDER_MODEL_PROFILES: Record<GenerationProviderName, ModelInfo[]> = {
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', speedTag: '🌟 Recommended', description: 'Fast, accurate & cost-effective ($0.0001/card)', isDefault: true },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', speedTag: '⚡ Fast', description: 'Next-gen lightweight model' },
    { id: 'gpt-4o', label: 'GPT-4o (Omni)', speedTag: '🧠 Deep Quality', description: 'Highest quality reasoning & nuance' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', speedTag: 'Legacy', description: 'Classic lightweight model' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', speedTag: 'Legacy', description: 'Previous-generation flagship model' },
  ],
  groq: [
    { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', speedTag: '🌟 Recommended', description: 'OpenAI\'s open-weight model, fast on Groq LPUs', isDefault: true },
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', speedTag: '⚡ Fastest', description: 'Ultra-low latency (~200ms) on Groq LPUs' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', speedTag: '⚡ Instant', description: 'Lightweight ultra-fast model' },
    { id: 'llama3-70b-8192', label: 'Llama 3 70B', speedTag: 'Legacy', description: 'Previous-generation Llama model' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', speedTag: '🌐 Multilingual', description: 'Strong multilingual translation & grammar' },
    { id: 'gemma2-9b-it', label: 'Gemma 2 9B', speedTag: 'Lightweight', description: 'Small, efficient Google open model' },
  ],
  gemini: [
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', speedTag: '⚡ Ultra-Light', description: 'Fastest next-gen lightweight Gemini model', isDefault: true },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', speedTag: '🆓 Free Tier / Fast', description: 'High speed, generous free quota limits' },
  ],
  anthropic: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude 3.5 Haiku', speedTag: '⚡ Fast & Smart', description: 'Rapid responses with Anthropic precision', isDefault: true },
    { id: 'claude-sonnet-5', label: 'Claude 3.5 Sonnet', speedTag: '🧠 Best Nuance', description: 'Gold standard for example sentences & idioms' },
  ],
  mistral: [
    { id: 'mistral-small-latest', label: 'Mistral Small', speedTag: '🌟 Recommended', description: 'Fast, cost-efficient European hosting', isDefault: true },
    { id: 'labs-leanstral-1-5-1', label: 'Leanstral 1.5.1', description: 'Lightweight Mistral Labs variant' },
    { id: 'mistral-medium-latest', label: 'Mistral Medium', speedTag: '🧠 Deep Grammar', description: 'Higher capacity for advanced linguistic queries' },
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek V3 (Chat)', speedTag: '🌟 Recommended', description: 'Very low cost with capable language generation', isDefault: true },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', speedTag: '⚡ Fast', description: 'Lightweight, low-latency variant' },
    { id: 'deepseek-reasoner', label: 'DeepSeek R1 (Reasoner)', speedTag: '🧠 Deep Reasoning', description: 'Chain-of-thought analysis for complex grammar' },
  ],
}

function metaFor(name: GenerationProviderName, usageUrl: string, description: string): ProviderMetaData {
  return {
    label: PROVIDER_LABELS[name],
    models: PROVIDER_MODEL_PROFILES[name].map((m) => m.id),
    usageUrl,
    description,
  }
}

const PROVIDER_LABELS: Record<GenerationProviderName, string> = {
  openai: 'OpenAI',
  mistral: 'Mistral',
  gemini: 'Gemini',
  anthropic: 'Claude',
  deepseek: 'DeepSeek',
  groq: 'Groq',
}

export const PROVIDER_META_DATA: Record<GenerationProviderName, ProviderMetaData> = {
  openai: metaFor('openai', 'https://platform.openai.com/usage', 'Meanings, examples, clusters, phrases, and cloze - the default generation provider.'),
  mistral: metaFor('mistral', 'https://console.mistral.ai/usage', 'BYOK alternative for card generation and translation.'),
  gemini: metaFor('gemini', 'https://aistudio.google.com/usage', 'Google Gemini BYOK for card generation and translation.'),
  anthropic: metaFor('anthropic', 'https://platform.claude.com/settings/usage', 'Claude BYOK for card generation and translation.'),
  deepseek: metaFor('deepseek', 'https://platform.deepseek.com/usage', 'BYOK alternative for card generation and translation.'),
  groq: metaFor('groq', 'https://console.groq.com/home', 'Fast inference BYOK for card generation and translation.'),
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
