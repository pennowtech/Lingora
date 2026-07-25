import type { CefrLevel } from '@lingora/types'
import {
  createAIPipeline,
  GoogleTranslateProvider,
  OpenAIProvider,
  type AIPipeline,
  type AIProvider,
  type DictionaryProvider,
} from '@lingora/ai'
import {
  ExpoSQLiteAdapter,
  migrate,
  seedDatabase,
  type DatabaseAdapter,
  type ExpoSQLiteDatabase,
} from '@lingora/database'
import { openDatabaseAsync } from 'expo-sqlite'
import * as SecureStore from 'expo-secure-store'
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
 * App services: the SQLite database, the AI pipeline built from the user's
 * stored keys, and the resulting feature tier.
 *
 * - 'translation': no OpenAI key — dictionary translation works (Google free
 *   tier is keyless), card generation is locked.
 * - 'full': OpenAI key configured — generation available.
 */
export type FeatureTier = 'translation' | 'full'

/** SecureStore keys — the only place API keys and preferences are persisted. */
export const STORE_KEYS = {
  openaiKey: 'lingora.openai_key',
  deeplKey: 'lingora.deepl_key',
  translationProvider: 'lingora.translation_provider',
  defaultCefr: 'lingora.default_cefr',
} as const

export const DEFAULT_DECK_ID = 'deck-default'

export interface Services {
  db: DatabaseAdapter
  /** The generation provider, for per-section calls (generateExamples). Null without an OpenAI key. */
  ai: AIProvider | null
  /** The lookup pipeline. Null without an OpenAI key (generation locked). */
  pipeline: AIPipeline | null
  tier: FeatureTier
  defaultCefr: CefrLevel
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
    // Development seed — idempotent (fixed ids, INSERT OR IGNORE), guarantees
    // deck-default exists and every screen has content on first launch.
    await seedDatabase(db)
    return db
  })()

  return dbPromise
}

const VALID_CEFR: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

async function buildAIServices(
  db: DatabaseAdapter,
): Promise<Pick<Services, 'ai' | 'pipeline' | 'tier' | 'defaultCefr'>> {
  const openaiKey = (await SecureStore.getItemAsync(STORE_KEYS.openaiKey)) ?? ''
  const storedCefr = (await SecureStore.getItemAsync(STORE_KEYS.defaultCefr)) ?? 'B1'
  const defaultCefr: CefrLevel = (VALID_CEFR as readonly string[]).includes(storedCefr)
    ? (storedCefr as CefrLevel)
    : 'B1'

  // The dictionary slot is always filled: Google's free tier needs no key.
  // TODO(phase4.1): instantiate DeepLProvider here when the adapter exists
  // and the user selected it in settings.
  const dictionary: DictionaryProvider = new GoogleTranslateProvider()

  if (openaiKey === '') {
    return { ai: null, pipeline: null, tier: 'translation', defaultCefr }
  }

  const ai = new OpenAIProvider({ apiKey: openaiKey })
  const pipeline = await createAIPipeline({ db, ai, dictionary })
  return { ai, pipeline, tier: 'full', defaultCefr }
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
        const db = await openDatabase()
        const aiServices = await buildAIServices(db)
        if (cancelled) return
        setBoot({
          status: 'ready',
          error: null,
          services: {
            db,
            ...aiServices,
            reloadServices: async () => {
              const rebuilt = await buildAIServices(db)
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
