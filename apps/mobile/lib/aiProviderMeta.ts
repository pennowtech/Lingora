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
  validateGeminiKey,
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
}

export const PROVIDER_META: Record<GenerationProviderName, ProviderMeta> = {
  openai: { ...PROVIDER_META_DATA.openai, ...ICON_COLOR_BY_PROVIDER.openai },
  mistral: { ...PROVIDER_META_DATA.mistral, ...ICON_COLOR_BY_PROVIDER.mistral },
  gemini: { ...PROVIDER_META_DATA.gemini, ...ICON_COLOR_BY_PROVIDER.gemini },
  anthropic: { ...PROVIDER_META_DATA.anthropic, ...ICON_COLOR_BY_PROVIDER.anthropic },
}

export const VALIDATORS: Record<GenerationProviderName, (key: string, model: string) => Promise<ValidationResult>> = {
  openai: validateOpenAIKey,
  mistral: validateMistralKey,
  gemini: validateGeminiKey,
  anthropic: validateClaudeKey,
}
