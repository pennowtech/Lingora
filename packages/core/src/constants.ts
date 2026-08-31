import type { LanguageCode } from '@lingora/types'

/**
 * App-wide constants shared between apps/mobile's services.tsx bootstrap and the desktop app's
 * own service wiring — provider names, default models, storage key names, supported languages.
 * Kept as plain data with no I/O: each app still owns its own key/value store (SecureStore on
 * mobile, localStorage on desktop) and reads/writes it under these shared key names, so a
 * preference set on one platform is named consistently even though nothing syncs between them yet.
 */

/** The provider slots that can fill AIProvider (word-package generation). Array order is also the
 * fallback-selection order both apps use when picking a default provider (the first
 * enabled+keyed+validated entry wins) — see apps/mobile/lib/services.tsx and
 * apps/desktop/src/services/desktopServices.tsx's PROVIDER_ORDER. */
export const GENERATION_PROVIDERS = ['openai', 'groq', 'mistral', 'gemini', 'anthropic', 'deepseek'] as const
export type GenerationProviderName = (typeof GENERATION_PROVIDERS)[number]

/** Everything the dictionary (translation) slot can be filled by. */
export const TRANSLATION_PROVIDERS = ['google', 'deepl', 'openai', 'groq', 'mistral', 'gemini', 'anthropic', 'deepseek'] as const
export type TranslationProviderName = (typeof TRANSLATION_PROVIDERS)[number]

export const DEFAULT_MODELS: Record<GenerationProviderName, string> = {
  openai: 'gpt-4.1-mini',
  mistral: 'mistral-small-latest',
  gemini: 'gemini-2.5-flash',
  anthropic: 'claude-haiku-4-5-20251001',
  deepseek: 'deepseek-v4-flash',
  groq: 'openai/gpt-oss-20b',
}

/** Key/value store keys — the only place API keys and preferences are persisted. Shared naming
 * only; each app is responsible for its own actual storage mechanism. */
export const STORE_KEYS = {
  openaiKey: 'lingora.openai_key',
  openaiModel: 'lingora.openai_model',
  openaiEnabled: 'lingora.openai_enabled',
  openaiValidatedKey: 'lingora.openai_validated_key',
  mistralKey: 'lingora.mistral_key',
  mistralModel: 'lingora.mistral_model',
  mistralEnabled: 'lingora.mistral_enabled',
  mistralValidatedKey: 'lingora.mistral_validated_key',
  geminiKey: 'lingora.gemini_key',
  geminiModel: 'lingora.gemini_model',
  geminiEnabled: 'lingora.gemini_enabled',
  geminiValidatedKey: 'lingora.gemini_validated_key',
  claudeKey: 'lingora.claude_key',
  claudeModel: 'lingora.claude_model',
  claudeEnabled: 'lingora.claude_enabled',
  claudeValidatedKey: 'lingora.claude_validated_key',
  deepseekKey: 'lingora.deepseek_key',
  deepseekModel: 'lingora.deepseek_model',
  deepseekEnabled: 'lingora.deepseek_enabled',
  deepseekValidatedKey: 'lingora.deepseek_validated_key',
  groqKey: 'lingora.groq_key',
  groqModel: 'lingora.groq_model',
  groqEnabled: 'lingora.groq_enabled',
  groqValidatedKey: 'lingora.groq_validated_key',
  deeplKey: 'lingora.deepl_key',
  deeplEnabled: 'lingora.deepl_enabled',
  deeplValidatedKey: 'lingora.deepl_validated_key',
  translationProvider: 'lingora.translation_provider',
  generationProvider: 'lingora.generation_provider',
  defaultCefr: 'lingora.default_cefr',
  nativeLanguage: 'lingora.native_language',
  targetLanguage: 'lingora.target_language',
  ttsPitch: 'lingora.tts_pitch',
  ttsRate: 'lingora.tts_rate',
  hasSeeded: 'lingora.has_seeded',
  reviewQuestionTypes: 'lingora.review_question_types',
  sessionCardLimit: 'lingora.session_card_limit',
} as const

export const DEFAULT_DECK_ID = 'deck-default'

/** Not a real deck id — a review-screen route param meaning "every deck, unfiltered" (see the
 * due-card repository queries, which already treat an omitted deckId that way). Used by review
 * shortcuts so the deck they open always matches the due-count they're showing, instead of
 * pointing at one hardcoded deck that may not even exist any more. */
export const ALL_DECKS_ID = 'all'

/** Every language the dictionary/generation providers know how to handle (see LanguageCode). */
export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['de', 'en', 'ja', 'es', 'fr', 'vi', 'hi']

/** The subset of SUPPORTED_LANGUAGES with real generation/dictionary/word-guide content today —
 * gates the native/target language pickers, and the app-language <-> native-language cross-prompt
 * (offering to switch a language the native-language picker would then reject makes no sense).
 * Japanese/Spanish/Vietnamese still show up in the pickers themselves but warn instead of
 * applying. */
export const FULLY_SUPPORTED_VOCAB_LANGUAGES: readonly LanguageCode[] = ['en', 'de', 'fr', 'hi']

/** Flag emoji per vocabulary language — purely decorative/iconographic, never translated, so
 * (unlike a screen's own translated language-name label maps) this one lives in one shared place
 * instead of being duplicated per screen/app. */
export const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  hi: '🇮🇳',
  ja: '🇯🇵',
  vi: '🇻🇳',
}

/** Preserves the app's original hardcoded German->English behavior for users who never open the setting. */
export const DEFAULT_NATIVE_LANGUAGE: LanguageCode = 'en'
export const DEFAULT_TARGET_LANGUAGE: LanguageCode = 'de'
