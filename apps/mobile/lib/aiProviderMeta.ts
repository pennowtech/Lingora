import type { IconName } from '../components/Icon'
import { colors } from './theme'
import {
  DEEPL_USAGE_URL,
  emptyProviderState,
  PROVIDER_META_DATA,
  PROVIDER_STORE_KEYS,
  ZERO_USAGE,
  type GenerationProviderName,
  type ProviderFormState,
} from '@lingora/core'
import {
  validateClaudeKey,
  validateDeepSeekKey,
  validateGeminiKey,
  validateGroqKey,
  validateMistralKey,
  validateOpenAIKey,
  type ValidationResult,
} from '@lingora/ai'

export { DEEPL_USAGE_URL, emptyProviderState, PROVIDER_STORE_KEYS, ZERO_USAGE, type ProviderFormState }

/**
 * Static per-provider display info + the SecureStore keys/validators each provider uses. Shared
 * between the Settings menu (summary subtitle), settings/ai-providers.tsx (the full config UI),
 * and settings/translation.tsx (which reuses a generation provider's key for translation) — one
 * place instead of three copies drifting apart.
 *
 * The label/models/usageUrl/description half is @lingora/core's PROVIDER_META_DATA, shared with
 * the desktop app; icon (a Lucide icon name, resolved via components/Icon.tsx) and color are
 * mobile-specific and merged in here.
 */
export interface ProviderMeta {
  label: string
  icon: IconName
  color: string
  models: readonly string[]
  usageUrl: string
  description: string
}

const ICON_COLOR_BY_PROVIDER: Record<GenerationProviderName, { icon: IconName; color: string }> = {
  openai: { icon: 'Sparkles', color: colors.primary },
  mistral: { icon: 'Zap', color: '#F97316' },
  gemini: { icon: 'Globe', color: '#4285F4' },
  anthropic: { icon: 'MessageCircle', color: '#D97757' },
  deepseek: { icon: 'DeepSeek', color: '#4D6BFE' },
  groq: { icon: 'Groq', color: '#F55036' },
}

export const PROVIDER_META: Record<GenerationProviderName, ProviderMeta> = {
  openai: { ...PROVIDER_META_DATA.openai, ...ICON_COLOR_BY_PROVIDER.openai },
  mistral: { ...PROVIDER_META_DATA.mistral, ...ICON_COLOR_BY_PROVIDER.mistral },
  gemini: { ...PROVIDER_META_DATA.gemini, ...ICON_COLOR_BY_PROVIDER.gemini },
  anthropic: { ...PROVIDER_META_DATA.anthropic, ...ICON_COLOR_BY_PROVIDER.anthropic },
  deepseek: { ...PROVIDER_META_DATA.deepseek, ...ICON_COLOR_BY_PROVIDER.deepseek },
  groq: { ...PROVIDER_META_DATA.groq, ...ICON_COLOR_BY_PROVIDER.groq },
}

export interface ModelInfo {
  id: string
  label: string
  speedTag?: string
  description?: string
  isDefault?: boolean
}

export const PROVIDER_PORTAL_URLS: Record<GenerationProviderName, { label: string; url: string }> = {
  openai: { label: 'platform.openai.com', url: 'https://platform.openai.com/api-keys' },
  groq: { label: 'console.groq.com', url: 'https://console.groq.com/keys' },
  mistral: { label: 'console.mistral.ai', url: 'https://console.mistral.ai/api-keys' },
  gemini: { label: 'aistudio.google.com', url: 'https://aistudio.google.com/app/apikey' },
  anthropic: { label: 'console.anthropic.com', url: 'https://console.anthropic.com/settings/keys' },
  deepseek: { label: 'platform.deepseek.com', url: 'https://platform.deepseek.com/api_keys' },
}

export const PROVIDER_MODEL_PROFILES: Record<GenerationProviderName, ModelInfo[]> = {
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', speedTag: '🌟 Recommended', description: 'Fast, accurate & cost-effective ($0.0001/card)', isDefault: true },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', speedTag: '⚡ Fast', description: 'Next-gen lightweight model' },
    { id: 'gpt-4o', label: 'GPT-4o (Omni)', speedTag: '🧠 Deep Quality', description: 'Highest quality reasoning & nuance' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', speedTag: 'Legacy', description: 'Classic lightweight model' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', speedTag: '⚡ Fastest', description: 'Ultra-low latency (~200ms) on Groq LPUs', isDefault: true },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', speedTag: '⚡ Instant', description: 'Lightweight ultra-fast model' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', speedTag: '🌐 Multilingual', description: 'Strong multilingual translation & grammar' },
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
    { id: 'mistral-medium-latest', label: 'Mistral Medium', speedTag: '🧠 Deep Grammar', description: 'Higher capacity for advanced linguistic queries' },
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek V3 (Chat)', speedTag: '🌟 Recommended', description: 'Very low cost with capable language generation', isDefault: true },
    { id: 'deepseek-reasoner', label: 'DeepSeek R1 (Reasoner)', speedTag: '🧠 Deep Reasoning', description: 'Chain-of-thought analysis for complex grammar' },
  ],
}

export const VALIDATORS: Record<GenerationProviderName, (key: string, model: string) => Promise<ValidationResult>> = {
  openai: validateOpenAIKey,
  mistral: validateMistralKey,
  gemini: validateGeminiKey,
  anthropic: validateClaudeKey,
  deepseek: validateDeepSeekKey,
  groq: validateGroqKey,
}
