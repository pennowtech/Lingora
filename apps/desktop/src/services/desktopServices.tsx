import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DatabaseAdapter } from '@lingora/database';
import { 
  getAllDecks, 
  getLemmaByForm,
  getClustersForLemma,
  addCardToDeck,
  createCardForSense,
  createDeck,
  getCardsByLemma,
  recordReview
} from '@lingora/database';
import { schedule, createInitialCardState } from '@lingora/srs';
import type { LanguageCode, CefrLevel } from '@lingora/types';
import { getDesktopDatabase } from './database';
import { DesktopAIPipeline } from './aiPipeline';

export type ProviderName = 'openai' | 'mistral' | 'gemini' | 'anthropic';
export type TranslationProvider = 'google' | 'deepl' | 'openai' | 'mistral' | 'gemini' | 'anthropic';

export interface ProviderConfig {
  key: string;
  model: string;
  enabled: boolean;
  validated: boolean;
  validating: boolean;
  showKey: boolean;
  requestsCount: number;
  tokensUsed: number;
  error?: string;
}

interface DesktopServicesContextType {
  db: DatabaseAdapter | null;
  isLoading: boolean;
  decks: any[];
  dueCards: any[];
  miningQueue: any[];
  cefrLevel: CefrLevel;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  theme: string;
  setTheme: (themeKey: string) => void;
  setLearningConfig: (cefr: CefrLevel, nativeLang: LanguageCode, targetLang: LanguageCode) => void;
  refreshData: () => Promise<void>;
  rateCard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
  addNewDeck: (title: string, description?: string) => Promise<void>;
  addNewCard: (lemmaForm: string, clusterId: string, deckId: string, cardType: string) => Promise<void>;
  translateText: (text: string, source?: LanguageCode, target?: LanguageCode) => Promise<string>;
  generateWithGemini: (surfaceForm: string) => Promise<any>;
  selectedGenerationProvider: ProviderName;
  setSelectedGenerationProvider: (provider: ProviderName) => void;
  selectedTranslationProvider: TranslationProvider;
  setSelectedTranslationProvider: (provider: TranslationProvider) => void;
  providers: Record<ProviderName, ProviderConfig>;
  setProviders: React.Dispatch<React.SetStateAction<Record<ProviderName, ProviderConfig>>>;
  deeplKey: string;
  setDeeplKey: (key: string) => void;
  deeplValidated: boolean;
  deeplValidating: boolean;
  deeplError?: string;
  validateProviderKey: (name: ProviderName) => Promise<void>;
  validateDeeplKey: () => Promise<void>;
}

const DesktopServicesContext = createContext<DesktopServicesContextType | null>(null);

export const DesktopServicesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseAdapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [miningQueue, setMiningQueue] = useState<any[]>([]);

  // Persistent Language & CEFR Settings
  const [cefrLevel, setCefrLevelState] = useState<CefrLevel>(
    (localStorage.getItem('lingora.cefr') as CefrLevel) || 'B2'
  );
  const [nativeLanguage, setNativeLanguageState] = useState<LanguageCode>(
    (localStorage.getItem('lingora.native_lang') as LanguageCode) || 'en'
  );
  const [targetLanguage, setTargetLanguageState] = useState<LanguageCode>(
    (localStorage.getItem('lingora.target_lang') as LanguageCode) || 'de'
  );

  // App Theme State
  const [theme, setThemeState] = useState<string>(
    localStorage.getItem('lingora.theme') || 'midnight'
  );

  const setTheme = (themeKey: string) => {
    setThemeState(themeKey);
    localStorage.setItem('lingora.theme', themeKey);
  };

  // API Providers State
  const [selectedGenerationProvider, setSelectedGenerationProviderState] = useState<ProviderName>(
    (localStorage.getItem('lingora.generation_provider') as ProviderName) || 'openai'
  );
  
  const setSelectedGenerationProvider = (provider: ProviderName) => {
    setSelectedGenerationProviderState(provider);
    localStorage.setItem('lingora.generation_provider', provider);
  };

  const [selectedTranslationProvider, setSelectedTranslationProviderState] = useState<TranslationProvider>(
    (localStorage.getItem('lingora.translation_provider') as TranslationProvider) || 'google'
  );

  const setSelectedTranslationProvider = (provider: TranslationProvider) => {
    setSelectedTranslationProviderState(provider);
    localStorage.setItem('lingora.translation_provider', provider);
  };

  const loadSavedProviders = (): Record<ProviderName, ProviderConfig> => {
    const saved = localStorage.getItem('lingora.providers');
    const defaults: Record<ProviderName, ProviderConfig> = {
      openai: { key: '', model: 'gpt-4o-mini', enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      mistral: { key: '', model: 'mistral-small-latest', enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      gemini: { key: '', model: 'gemini-2.5-flash', enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      anthropic: { key: '', model: 'claude-3-5-haiku-latest', enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge defaults to ensure no missing fields
        for (const k of Object.keys(defaults)) {
          if (parsed[k]) {
            parsed[k].validating = false; // Reset validating state on load
            parsed[k].showKey = false;
            defaults[k as ProviderName] = { ...defaults[k as ProviderName], ...parsed[k] };
          }
        }
      } catch(e){}
    }
    return defaults;
  };

  const [providers, setProviders] = useState<Record<ProviderName, ProviderConfig>>(loadSavedProviders());

  // DeepL State
  const [deeplKey, setDeeplKeyState] = useState<string>(localStorage.getItem('lingora.deepl_key') || '');
  const [deeplValidated, setDeeplValidatedState] = useState<boolean>(localStorage.getItem('lingora.deepl_validated') === 'true');
  const [deeplValidating, setDeeplValidating] = useState(false);
  const [deeplError, setDeeplError] = useState<string | undefined>();

  const setDeeplKey = (key: string) => {
    setDeeplKeyState(key);
    setDeeplError(undefined);
    localStorage.setItem('lingora.deepl_key', key);
    if (!key) {
      setDeeplValidatedState(false);
      localStorage.removeItem('lingora.deepl_validated');
    }
  };

  useEffect(() => {
    localStorage.setItem('lingora.providers', JSON.stringify(providers));
  }, [providers]);

  // Validation Logic
  const validateProviderKey = async (name: ProviderName) => {
    setProviders(prev => ({ ...prev, [name]: { ...prev[name], validating: true, validated: false, error: undefined } }));
    const p = providers[name];
    let isValid = false;
    let errorMsg = undefined;

    try {
      if (name === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${p.key}` }
        });
        isValid = res.ok;
      } else if (name === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${p.key}`);
        isValid = res.ok;
      } else if (name === 'mistral') {
        const res = await fetch('https://api.mistral.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${p.key}` }
        });
        isValid = res.ok;
      } else if (name === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': p.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: p.model, max_tokens: 1, messages: [{ role: 'user', content: 'hello' }] })
        });
        isValid = res.ok || res.status === 400; // 400 means valid key, bad request structure, 401 is bad key
      }
    } catch(err: any) {
      isValid = false;
      errorMsg = err.message || 'Network error occurred';
    }

    if (!isValid && !errorMsg) {
      errorMsg = 'Invalid API key or authentication failed.';
    }

    setProviders(prev => ({ ...prev, [name]: { ...prev[name], validating: false, validated: isValid, error: errorMsg } }));
  };

  const validateDeeplKey = async () => {
    setDeeplValidating(true);
    setDeeplError(undefined);
    let isValid = false;
    let errorMsg = undefined;
    try {
      const isPro = deeplKey.endsWith(':fx') ? false : true;
      const endpoint = isPro ? 'https://api.deepl.com/v2/usage' : 'https://api-free.deepl.com/v2/usage';
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `DeepL-Auth-Key ${deeplKey}` }
      });
      isValid = res.ok;
    } catch (e: any) {
      isValid = false;
      errorMsg = e.message || 'Network error occurred';
    }
    
    if (!isValid && !errorMsg) {
      errorMsg = 'Invalid DeepL API key or authorization failed.';
    }

    setDeeplValidating(false);
    setDeeplValidatedState(isValid);
    setDeeplError(errorMsg);
    localStorage.setItem('lingora.deepl_validated', isValid.toString());
  };

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const setLearningConfig = (cefr: CefrLevel, nativeLang: LanguageCode, targetLang: LanguageCode) => {
    setCefrLevelState(cefr);
    setNativeLanguageState(nativeLang);
    setTargetLanguageState(targetLang);

    localStorage.setItem('lingora.cefr', cefr);
    localStorage.setItem('lingora.native_lang', nativeLang);
    localStorage.setItem('lingora.target_lang', targetLang);
  };

  const loadDatabase = async () => {
    try {
      setIsLoading(true);
      const adapter = await getDesktopDatabase();
      setDb(adapter);

      await refreshDataInternal(adapter);
    } catch (err) {
      console.error('[Desktop Services] Error loading database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDataInternal = async (adapter: DatabaseAdapter) => {
    try {
      const allDecks = await getAllDecks(adapter);
      setDecks(allDecks || []);

      // Query due cards from card_states table
      const dueRows = await adapter.query(
        `SELECT c.id, c.lemma_id, c.type, cs.stability, cs.difficulty, cs.state
         FROM cards c
         JOIN card_states cs ON cs.card_id = c.id
         WHERE cs.next_review_date <= ?
         LIMIT 20`,
        [Date.now()]
      );
      setDueCards(dueRows || []);
    } catch (err) {
      console.error('[Desktop Services] Error refreshing data:', err);
    }
  };

  const refreshData = async () => {
    if (db) await refreshDataInternal(db);
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const rateCard = async (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!db) return;
    try {
      const cardStateRow = await db.querySingle<any>(
        `SELECT stability, difficulty, retrievability, next_review_date AS nextReviewAt, lapses, state, reps, learning_steps AS learningSteps
         FROM card_states WHERE card_id = ?`,
        [cardId]
      );

      const currentState = cardStateRow || createInitialCardState(cardId);
      const newState = schedule(currentState, rating, Date.now());

      await recordReview(db, {
        id: `rev-${Date.now()}`,
        cardId,
        rating,
        reviewedAt: Date.now(),
        durationMs: 1500
      }, newState);

      await refreshData();
    } catch (err) {
      console.error('[Desktop Services] Error recording review:', err);
    }
  };

  const addNewDeck = async (title: string, description?: string) => {
    if (!db) return;
    const newDeck = {
      id: `deck-${Date.now()}`,
      name: title,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await createDeck(db, newDeck);
    await refreshData();
  };

  const addNewCard = async (lemmaForm: string, clusterId: string, deckTitle: string, cardType: string) => {
    if (!db) return;
    try {
      let deck = decks.find(d => d.name.toLowerCase() === deckTitle.toLowerCase());
      let deckId = deck?.id;
      if (!deckId) {
        deckId = `deck-${Date.now()}`;
        await createDeck(db, { id: deckId, name: deckTitle, createdAt: Date.now(), updatedAt: Date.now() });
      }

      const lemma = await getLemmaByForm(db, lemmaForm);
      if (lemma) {
        const cardId = `card-${Date.now()}`;
        const initialState = createInitialCardState(cardId);
        await db.execute(
          `INSERT OR IGNORE INTO card_states (card_id, stability, difficulty, retrievability, next_review_date, lapses, state, reps, learning_steps)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cardId, initialState.stability, initialState.difficulty, initialState.retrievability, initialState.nextReviewAt, initialState.lapses, initialState.state, initialState.reps, initialState.learningSteps]
        );

        if (deckId) {
          await addCardToDeck(db, cardId, deckId);
        }
      }
      await refreshData();
    } catch (err) {
      console.error('[Desktop Services] Error adding card:', err);
    }
  };

  const translateText = async (text: string, source?: LanguageCode, target?: LanguageCode): Promise<string> => {
    const pipeline = new DesktopAIPipeline();
    const srcLang = source || targetLanguage;
    const tgtLang = target || nativeLanguage;
    return pipeline.translateWithGoogle(text, srcLang, tgtLang);
  };

  const generateWithGemini = async (surfaceForm: string): Promise<any> => {
    const geminiKey = providers.gemini.key;
    if (!geminiKey) {
      throw new Error('Please configure a Gemini API key in Settings first.');
    }
    const pipeline = new DesktopAIPipeline(geminiKey);
    return pipeline.generateWordPackageWithGemini(surfaceForm, cefrLevel, targetLanguage, nativeLanguage);
  };

  return (
    <DesktopServicesContext.Provider value={{
      db,
      isLoading,
      decks,
      dueCards,
      miningQueue,
      theme,
      cefrLevel,
      nativeLanguage,
      targetLanguage,
      setTheme,
      setLearningConfig,
      refreshData,
      rateCard,
      addNewDeck,
      addNewCard,
      translateText,
      generateWithGemini,
      selectedGenerationProvider,
      setSelectedGenerationProvider,
      selectedTranslationProvider,
      setSelectedTranslationProvider,
      providers,
      setProviders,
      deeplKey,
      setDeeplKey,
      deeplValidated,
      deeplValidating,
      deeplError,
      validateProviderKey,
      validateDeeplKey
    }}>
      {children}
    </DesktopServicesContext.Provider>
  );
};

export const useDesktopServices = () => {
  const context = useContext(DesktopServicesContext);
  if (!context) {
    throw new Error('useDesktopServices must be used within a DesktopServicesProvider');
  }
  return context;
};
