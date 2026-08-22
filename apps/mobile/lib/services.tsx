import type { CefrLevel, LanguageCode } from '@lingora/types'
import {
  AnthropicProvider,
  createAIPipeline,
  DeepLProvider,
  GeminiProvider,
  GoogleTranslateProvider,
  MistralProvider,
  OpenAIProvider,
  type AIPipeline,
  type AIProvider,
  type DictionaryProvider,
} from '@lingora/ai'
import { configureObservability, logger } from '@lingora/observability'
import { createExpoJsonLinesSink } from '@lingora/observability/expo'
import { applyStoredLanguagePreference } from './i18n'
import { withUsageTracking } from './providerUsage'
import { warmUpSpeechEngine } from './speech'
import {
  ExpoSQLiteAdapter,
  migrate,
  seedDatabase,
  type DatabaseAdapter,
  type ExpoSQLiteDatabase,
} from '@lingora/database'
import { openDatabaseAsync } from 'expo-sqlite'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react'

/**
 * Wires the structured-logging facade before anything else boots: console sink always on, plus a
 * rotating on-device JSON-lines file (`@lingora/observability/expo`) so a bug report can be traced
 * from a shipped diagnostics file, not just a live Metro session. Called once at module load —
 * `logger.child(...)` below and in every screen/package resolves against whatever this configured,
 * even though those children are frequently constructed before this line runs (see logger.ts).
 */
configureObservability({
  context: {
    feature: 'app',
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    buildNumber: String(
      Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber ?? 'unknown',
    ),
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    environment: __DEV__ ? 'development' : 'production',
  },
  additionalSinks: [createExpoJsonLinesSink()],
})

const bootLog = logger.child({ feature: 'app', component: 'services', operation: 'bootstrap' })
const dbLog = logger.child({ feature: 'database', component: 'services' })
const aiLog = logger.child({ feature: 'ai', component: 'services' })

/**
 * App services: the SQLite database, the AI pipeline built from the user's
 * stored keys, and the resulting feature tier.
 *
 * - 'translation': no generation provider key — dictionary translation still
 *   works (Google free tier is keyless), card generation is locked.
 * - 'full': at least one generation provider (OpenAI, Mistral, Gemini,
 *   Claude) is configured and enabled.
 */
export type FeatureTier = 'translation' | 'full'

/** The provider slots that can fill AIProvider (word-package generation). */
export const GENERATION_PROVIDERS = ['openai', 'mistral', 'gemini', 'anthropic'] as const
export type GenerationProviderName = (typeof GENERATION_PROVIDERS)[number]

/** Everything the dictionary (translation) slot can be filled by. */
export const TRANSLATION_PROVIDERS = ['google', 'deepl', 'openai', 'mistral', 'gemini', 'anthropic'] as const
export type TranslationProviderName = (typeof TRANSLATION_PROVIDERS)[number]

export const DEFAULT_MODELS: Record<GenerationProviderName, string> = {
  openai: 'gpt-4.1-mini',
  mistral: 'mistral-small-latest',
  gemini: 'gemini-2.5-flash',
  anthropic: 'claude-haiku-4-5-20251001',
}

/** SecureStore keys — the only place API keys and preferences are persisted. */
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
} as const

export const DEFAULT_DECK_ID = 'deck-default'

/** Not a real deck id — a review-screen route param meaning "every deck, unfiltered" (see the
 * due-card repository queries, which already treat an omitted deckId that way). Used by Home's
 * review shortcuts so the deck they open always matches the due-count they're showing, instead
 * of pointing at one hardcoded deck that may not even exist any more. */
export const ALL_DECKS_ID = 'all'

/** Every language the dictionary/generation providers know how to handle (see LanguageCode). */
export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['de', 'en', 'ja', 'es', 'fr', 'vi', 'hi']

/** The subset of SUPPORTED_LANGUAGES with real generation/dictionary/word-guide content today —
 * shared by settings/learning.tsx (gates the native/target pickers) and settings/general.tsx
 * (gates the app-language ↔ native-language cross-prompt: offering to switch a language the
 * native-language picker would then reject makes no sense). Japanese/Spanish/Vietnamese still
 * show up in the pickers themselves but warn instead of applying — see learning.tsx's own
 * warnUnsupportedLanguage. */
export const FULLY_SUPPORTED_VOCAB_LANGUAGES: readonly LanguageCode[] = ['en', 'de', 'fr', 'hi']

/** Flag emoji per vocabulary language — purely decorative/iconographic, never translated, so
 * (unlike the per-screen VOCAB_LANGUAGE_LABELS text maps) this one lives in one shared place
 * instead of being duplicated per screen. Used by components/LanguagePairBadge.tsx. */
export const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  hi: '🇮🇳',
  ja: '🇯🇵',
  vi: '🇻🇳',
}

/** Preserves today's hardcoded German→English behavior for users who never open the setting. */
export const DEFAULT_NATIVE_LANGUAGE: LanguageCode = 'en'
export const DEFAULT_TARGET_LANGUAGE: LanguageCode = 'de'

export interface Services {
  db: DatabaseAdapter
  /** The generation provider, for per-section calls (generateExamples). Null without an OpenAI key. */
  ai: AIProvider | null
  /** The lookup pipeline. Null without an OpenAI key (generation locked). */
  pipeline: AIPipeline | null
  /**
   * The active translation-only provider (Google Translate by default, or
   * DeepL/a generation provider if picked in Settings → Translation) —
   * exposed directly so screens can show a plain dictionary lookup without
   * going through the full `pipeline` (word-package generation, which needs
   * a generation-tier key and writes to the database).
   */
  dictionary: DictionaryProvider
  tier: FeatureTier
  defaultCefr: CefrLevel
  /** The learner's own language — explanations/UI copy target this (word/[form].tsx header, etc.). */
  nativeLanguage: LanguageCode
  /** The language being learned — new words/generation default here (search.tsx). */
  targetLanguage: LanguageCode
  /** Re-read keys/preferences and rebuild the pipeline — call after settings change. */
  reloadServices: () => Promise<void>
}

interface BootState {
  status: 'loading' | 'ready' | 'error'
  services: Services | null
  error: string | null
}

// Module-level singleton: expo-sqlite auto-closes a database's existing
// native connection when openDatabaseAsync is called again for the same
// name. If React re-invokes this effect (observed even without explicit
// StrictMode), a second open call while migrate()/seedDatabase() are still
// running on the first connection closes it out from under them — a native
// SIGABRT deep in expo-sqlite's C library, not a JS-catchable error. Caching
// the in-flight/resolved promise guarantees openDatabaseAsync runs exactly
// once for the lifetime of the JS module, however many times the effect fires.
let dbPromise: Promise<DatabaseAdapter> | null = null

async function openDatabase(): Promise<DatabaseAdapter> {
  if (dbPromise) return dbPromise

  dbPromise = (async () => {
    const startedAt = Date.now()
    dbLog.info('database.open_started', { message: 'Opening lingora.db' })
    try {
      // expo-sqlite's automatic statement cleanup double-finalizes statements
      // owned by FTS5 while closing the connection, which aborts Android in
      // libexpo-sqlite. FTS5 manages those statements itself.
      const raw = await openDatabaseAsync('lingora.db', {
        finalizeUnusedStatementsBeforeClosing: false,
      })
      // The adapter's structural type uses unknown[] params so the shared
      // package compiles without Expo; the real SQLiteDatabase narrows them,
      // which strict variance rejects — runtime-compatible, so bridge the
      // nominal gap here.
      const db = await ExpoSQLiteAdapter.create(raw as unknown as ExpoSQLiteDatabase)
      await migrate(db)
      dbLog.info('database.migrations_applied', { message: 'Pending schema migrations applied', result: 'success' })
      // Demo seed (fixed ids, INSERT OR IGNORE) — gives a brand-new install some content to look
      // at. Gated behind a one-time SecureStore flag, not just seedDatabase's own idempotency:
      // INSERT OR IGNORE only no-ops while the deck-default row still exists, so re-running it
      // unconditionally on every launch silently resurrected the demo deck/card the instant a user
      // deleted it (deleteDeck really does remove the row) — deleting "My Vocabulary" looked
      // permanent but came back on the next app open.
      const alreadySeeded = (await SecureStore.getItemAsync(STORE_KEYS.hasSeeded)) === 'true'
      if (!alreadySeeded) {
        await seedDatabase(db)
        await SecureStore.setItemAsync(STORE_KEYS.hasSeeded, 'true')
      }
      dbLog.info('database.open_completed', {
        message: 'Database ready',
        result: 'success',
        durationMs: Date.now() - startedAt,
      })
      return db
    } catch (error) {
      dbLog.fatal('database.open_failed', error, {
        message: 'Database bootstrap failed',
        durationMs: Date.now() - startedAt,
      })
      throw error
    }
  })()

  return dbPromise
}

const VALID_CEFR: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface ProviderConfig {
  key: string
  enabled: boolean
  model: string
  validated: boolean
}

async function readProviderConfig(
  keyStoreKey: string,
  enabledStoreKey: string,
  modelStoreKey: string,
  validatedStoreKey: string,
  defaultModel: string,
): Promise<ProviderConfig> {
  const [key, enabledRaw, model, validatedKeyRaw] = await Promise.all([
    SecureStore.getItemAsync(keyStoreKey),
    SecureStore.getItemAsync(enabledStoreKey),
    SecureStore.getItemAsync(modelStoreKey),
    SecureStore.getItemAsync(validatedStoreKey),
  ])
  const k = (key ?? '').trim()
  const m = model ?? defaultModel
  const validated = k !== '' && validatedKeyRaw !== 'invalid'
  return { key: k, enabled: enabledRaw !== 'false', model: m, validated }
}

/** OpenAI, Mistral, Gemini, and Claude all implement both provider slots. */
function instantiateGenerationProvider(
  name: GenerationProviderName,
  key: string,
  model: string,
): AIProvider & DictionaryProvider {
  switch (name) {
    case 'openai':
      return new OpenAIProvider({ apiKey: key, model })
    case 'mistral':
      return new MistralProvider({ apiKey: key, model })
    case 'gemini':
      return new GeminiProvider({ apiKey: key, model })
    case 'anthropic':
      return new AnthropicProvider({ apiKey: key, model })
  }
}

async function buildAIServices(
  db: DatabaseAdapter,
): Promise<
  Pick<Services, 'ai' | 'pipeline' | 'tier' | 'defaultCefr' | 'dictionary' | 'nativeLanguage' | 'targetLanguage'>
> {
  const [
    openai,
    mistral,
    gemini,
    claude,
    deeplKey,
    deeplEnabledRaw,
    storedTranslationProvider,
    storedGenerationProvider,
    storedCefr,
    storedNativeLanguage,
    storedTargetLanguage,
  ] = await Promise.all([
    readProviderConfig(
      STORE_KEYS.openaiKey,
      STORE_KEYS.openaiEnabled,
      STORE_KEYS.openaiModel,
      STORE_KEYS.openaiValidatedKey,
      DEFAULT_MODELS.openai,
    ),
    readProviderConfig(
      STORE_KEYS.mistralKey,
      STORE_KEYS.mistralEnabled,
      STORE_KEYS.mistralModel,
      STORE_KEYS.mistralValidatedKey,
      DEFAULT_MODELS.mistral,
    ),
    readProviderConfig(
      STORE_KEYS.geminiKey,
      STORE_KEYS.geminiEnabled,
      STORE_KEYS.geminiModel,
      STORE_KEYS.geminiValidatedKey,
      DEFAULT_MODELS.gemini,
    ),
    readProviderConfig(
      STORE_KEYS.claudeKey,
      STORE_KEYS.claudeEnabled,
      STORE_KEYS.claudeModel,
      STORE_KEYS.claudeValidatedKey,
      DEFAULT_MODELS.anthropic,
    ),
    SecureStore.getItemAsync(STORE_KEYS.deeplKey),
    SecureStore.getItemAsync(STORE_KEYS.deeplEnabled),
    SecureStore.getItemAsync(STORE_KEYS.translationProvider),
    SecureStore.getItemAsync(STORE_KEYS.generationProvider),
    SecureStore.getItemAsync(STORE_KEYS.defaultCefr),
    SecureStore.getItemAsync(STORE_KEYS.nativeLanguage),
    SecureStore.getItemAsync(STORE_KEYS.targetLanguage),
  ])

  const defaultCefr: CefrLevel = (VALID_CEFR as readonly string[]).includes(storedCefr ?? '')
    ? (storedCefr as CefrLevel)
    : 'B1'
  const nativeLanguage: LanguageCode = (SUPPORTED_LANGUAGES as readonly string[]).includes(
    storedNativeLanguage ?? '',
  )
    ? (storedNativeLanguage as LanguageCode)
    : DEFAULT_NATIVE_LANGUAGE
  const targetLanguage: LanguageCode = (SUPPORTED_LANGUAGES as readonly string[]).includes(
    storedTargetLanguage ?? '',
  )
    ? (storedTargetLanguage as LanguageCode)
    : DEFAULT_TARGET_LANGUAGE

  const configs: Record<GenerationProviderName, ProviderConfig> = { openai, mistral, gemini, anthropic: claude }
  const configured = GENERATION_PROVIDERS.filter(
    (name) => configs[name].enabled && configs[name].key !== '' && configs[name].validated,
  )
  const preferred = (GENERATION_PROVIDERS as readonly string[]).includes(storedGenerationProvider ?? '')
    ? (storedGenerationProvider as GenerationProviderName)
    : undefined
  const generationProviderName =
    preferred && configured.includes(preferred) ? preferred : configured[0]

  // The dictionary slot: Google's free tier needs no key and is the default;
  // DeepL and any configured generation provider can also serve translation.
  let dictionary: DictionaryProvider = new GoogleTranslateProvider()
  const translationProviderName = (TRANSLATION_PROVIDERS as readonly string[]).includes(
    storedTranslationProvider ?? '',
  )
    ? (storedTranslationProvider as TranslationProviderName)
    : 'google'
  const deeplEnabled = deeplEnabledRaw !== 'false' && (deeplKey ?? '').trim() !== ''
  if (translationProviderName === 'deepl' && deeplEnabled) {
    dictionary = withUsageTracking(new DeepLProvider({ apiKey: (deeplKey ?? '').trim() }), 'deepl')
  } else if (
    translationProviderName !== 'google' &&
    translationProviderName !== 'deepl' &&
    configured.includes(translationProviderName)
  ) {
    const cfg = configs[translationProviderName]
    dictionary = withUsageTracking(
      instantiateGenerationProvider(translationProviderName, cfg.key, cfg.model),
      translationProviderName,
    )
  }

  if (!generationProviderName) {
    aiLog.info('ai.pipeline_locked', {
      metadata: { itemCount: configured.length },
      message: 'No generation provider configured - tier is translation-only',
    })
    return { ai: null, pipeline: null, tier: 'translation', defaultCefr, dictionary, nativeLanguage, targetLanguage }
  }

  const chosen = configs[generationProviderName]
  const ai = withUsageTracking(
    instantiateGenerationProvider(generationProviderName, chosen.key, chosen.model),
    generationProviderName,
  )
  const pipeline = await createAIPipeline({ db, ai, dictionary })
  aiLog.info('ai.pipeline_built', {
    message: 'AI generation pipeline built from stored provider keys',
    result: 'success',
    metadata: { provider: generationProviderName, modelAlias: chosen.model, itemCount: configured.length },
  })
  return { ai, pipeline, tier: 'full', defaultCefr, dictionary, nativeLanguage, targetLanguage }
}

const ServicesContext = createContext<Services | null>(null)

/**
 * Boot gate + context provider. Opens the database, runs migrations and the
 * dev seed, builds the AI pipeline from stored keys, then renders children.
 */
export function ServicesProvider({
  children,
  loading,
  renderError,
}: {
  children: ReactNode
  loading: ReactNode
  renderError: (message: string, retry: () => void) => ReactNode
}): JSX.Element {
  const [boot, setBoot] = useState<BootState>({ status: 'loading', services: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    const init = async (): Promise<void> => {
      try {
        warmUpSpeechEngine()
        await applyStoredLanguagePreference()
        const db = await openDatabase()
        const aiServices = await buildAIServices(db)
        if (cancelled) return
        bootLog.info('app.bootstrap_completed', {
          message: 'App services (database + AI pipeline) are ready',
          result: 'success',
          metadata: { itemCount: attempt },
        })
        setBoot({
          status: 'ready',
          error: null,
          services: {
            db,
            ...aiServices,
            reloadServices: async () => {
              const rebuilt = await buildAIServices(db)
              bootLog.info('app.services_reloaded', {
                message: 'AI services rebuilt after a settings change',
                result: 'success',
              })
              setBoot((prev) =>
                prev.services
                  ? { ...prev, services: { ...prev.services, ...rebuilt } }
                  : prev,
              )
            },
          },
        })
      } catch (error) {
        if (cancelled) return
        bootLog.fatal('app.bootstrap_failed', error, { message: 'App bootstrap failed' })
        setBoot({ status: 'error', services: null, error: String(error) })
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setBoot({ status: 'loading', services: null, error: null })
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo(() => boot.services, [boot.services])

  if (boot.status === 'loading') return <>{loading}</>
  if (boot.status === 'error' || !value) {
    return <>{renderError(boot.error ?? 'Failed to start', retry)}</>
  }
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
}

/** The app services. Only callable under ServicesProvider (i.e. everywhere below the root layout). */
export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (!services) {
    throw new Error('useServices must be used inside ServicesProvider')
  }
  return services
}
