import type { Ionicons } from '@expo/vector-icons'
import { colors } from './theme'
import { DEFAULT_MODELS, STORE_KEYS, type GenerationProviderName } from './services'
import {
  validateClaudeKey,
  validateGeminiKey,
  validateMistralKey,
  validateOpenAIKey,
  type ValidationResult,
} from './providerValidation'
import type { UsageSnapshot } from './providerUsage'

/**
 * Static per-provider display info + the SecureStore keys/validators each provider uses. Shared
 * between the Settings menu (summary subtitle), settings/ai-providers.tsx (the full config UI),
 * and settings/translation.tsx (which reuses a generation provider's key for translation) — one
 * place instead of three copies drifting apart.
 */
export interface ProviderMeta {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  models: readonly string[]
  usageUrl: string
  description: string
}

export const PROVIDER_META: Record<GenerationProviderName, ProviderMeta> = {
  openai: {
    label: 'OpenAI',
    icon: 'sparkles-outline',
    color: colors.primary,
    models: ['gpt-4.1-mini', 'gpt-4.1'],
    usageUrl: 'https://platform.openai.com/usage',
    description: 'Meanings, examples, clusters, phrases, and cloze — the default generation provider.',
  },
  mistral: {
    label: 'Mistral',
    icon: 'flash-outline',
    color: '#F97316',
    models: ['mistral-small-latest', 'mistral-medium-latest'],
    usageUrl: 'https://console.mistral.ai/usage',
    description: 'BYOK alternative for card generation and translation.',
  },
  gemini: {
    label: 'Gemini',
    icon: 'logo-google',
    color: '#4285F4',
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    usageUrl: 'https://aistudio.google.com/usage',
    description: 'Google Gemini BYOK for card generation and translation.',
  },
  anthropic: {
    label: 'Claude',
    icon: 'chatbubble-ellipses-outline',
    color: '#D97757',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-5'],
    usageUrl: 'https://platform.claude.com/settings/usage',
    description: 'Claude BYOK for card generation and translation.',
  },
}

export const PROVIDER_STORE_KEYS: Record<GenerationProviderName, { key: string; enabled: string; model: string }> = {
  openai: { key: STORE_KEYS.openaiKey, enabled: STORE_KEYS.openaiEnabled, model: STORE_KEYS.openaiModel },
  mistral: { key: STORE_KEYS.mistralKey, enabled: STORE_KEYS.mistralEnabled, model: STORE_KEYS.mistralModel },
  gemini: { key: STORE_KEYS.geminiKey, enabled: STORE_KEYS.geminiEnabled, model: STORE_KEYS.geminiModel },
  anthropic: { key: STORE_KEYS.claudeKey, enabled: STORE_KEYS.claudeEnabled, model: STORE_KEYS.claudeModel },
}

export const VALIDATORS: Record<GenerationProviderName, (key: string, model: string) => Promise<ValidationResult>> = {
  openai: validateOpenAIKey,
  mistral: validateMistralKey,
  gemini: validateGeminiKey,
  anthropic: validateClaudeKey,
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

export const ZERO_USAGE: UsageSnapshot = { requests: 0, tokensUsed: 0 }

export const DEEPL_USAGE_URL = 'https://www.deepl.com/en/your-account/usage'
