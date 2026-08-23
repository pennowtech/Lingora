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
  recordReview,
  getLemmaById,
  getMeaningsForCard,
  getExamplesForCard,
  getClozesForCard,
  getSynonymsForCard,
  getPhrasesForCard,
  getCardState,
  getClozeState,
  getCardsDueForReview,
  getClozeCardsDueForReview,
  getDefaultTemplate,
  createCloze
} from '@lingora/database';
import { schedule, createInitialCardState } from '@lingora/srs';
import { buildCardContext, renderCardHtml, SEPARABLE_PREFIXES } from './templates';
import type { LanguageCode, CefrLevel } from '@lingora/types';
import {
  OpenAIProvider,
  MistralProvider,
  GeminiProvider,
  AnthropicProvider,
  DeepSeekProvider,
  GroqProvider,
  createAIPipeline,
  validateOpenAIKey,
  validateMistralKey,
  validateGeminiKey,
  validateClaudeKey,
  validateDeepSeekKey,
  validateGroqKey,
  validateDeepLKey
} from '@lingora/ai';
import { DEFAULT_MODELS, GENERATION_PROVIDERS, PROVIDER_META_DATA, type GenerationProviderName } from '@lingora/core';
import { getDesktopDatabase } from './database';
import { desktopFetch } from './desktopFetch';

// Reuses @lingora/core's GenerationProviderName instead of a separately hand-maintained literal
// union, so a new generation provider (see GENERATION_PROVIDERS) doesn't silently drift out of
// sync here the way the model-list/default-model duplication did before it was wired to core.
export type ProviderName = GenerationProviderName;
export type TranslationProvider = 'google' | 'deepl' | GenerationProviderName;

const PROVIDER_ORDER: ProviderName[] = [...GENERATION_PROVIDERS];

/** Active requires a validated key (see SettingsScreen.tsx's AI Providers grid) — when the
 * currently-Active provider's key fails or is cleared, there's no keyless generation provider to
 * fall back to (unlike Pronunciation's "device"), so this picks the next-best option: another
 * already-validated provider first, then another provider with a key at all (unvalidated but worth
 * trying over one with no key), else leaves `excluding` as the least-bad choice — the UI simply
 * won't show it as Active again until something gets validated. */
export function pickFallbackGenerationProvider(providers: Record<ProviderName, ProviderConfig>, excluding: ProviderName): ProviderName {
  const candidates = PROVIDER_ORDER.filter((n) => n !== excluding);
  return (
    candidates.find((n) => providers[n].validated) ??
    candidates.find((n) => providers[n].key.trim() !== '') ??
    excluding
  );
}

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
  addNewDeck: (title: string, type?: string) => Promise<string>;
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
  loadReviewQueue: (deckId?: string, clozeOnly?: boolean, cardId?: string) => Promise<any[]>;
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
    // Default models come from @lingora/core's DEFAULT_MODELS — the same values apps/mobile's
    // Settings > AI Providers uses — instead of a second hardcoded copy that silently drifts.
    const defaults: Record<ProviderName, ProviderConfig> = {
      openai: { key: '', model: DEFAULT_MODELS.openai, enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      mistral: { key: '', model: DEFAULT_MODELS.mistral, enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      gemini: { key: '', model: DEFAULT_MODELS.gemini, enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      anthropic: { key: '', model: DEFAULT_MODELS.anthropic, enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      deepseek: { key: '', model: DEFAULT_MODELS.deepseek, enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 },
      groq: { key: '', model: DEFAULT_MODELS.groq, enabled: true, validated: false, validating: false, showKey: false, requestsCount: 0, tokensUsed: 0 }
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

  // Validation Logic — delegates to @lingora/ai's shared validators (also used by apps/mobile),
  // which give a real reachability pre-check and friendly, specific error messages (bad key vs.
  // quota vs. rate limit vs. server error vs. offline) instead of a single generic fallback string.
  const validateProviderKey = async (name: ProviderName) => {
    setProviders(prev => ({ ...prev, [name]: { ...prev[name], validating: true, validated: false, error: undefined } }));
    const p = providers[name];

    const VALIDATORS: Record<ProviderName, () => Promise<{ ok: boolean; message: string }>> = {
      openai: () => validateOpenAIKey(p.key, p.model, desktopFetch),
      mistral: () => validateMistralKey(p.key, p.model, desktopFetch),
      gemini: () => validateGeminiKey(p.key, p.model, desktopFetch),
      anthropic: () => validateClaudeKey(p.key, p.model, desktopFetch),
      deepseek: () => validateDeepSeekKey(p.key, p.model, desktopFetch),
      groq: () => validateGroqKey(p.key, p.model, desktopFetch),
    };
    const result = await VALIDATORS[name]();

    const updatedProviders: Record<ProviderName, ProviderConfig> = {
      ...providers,
      [name]: { ...providers[name], validating: false, validated: result.ok, error: result.ok ? undefined : result.message }
    };
    setProviders(updatedProviders);

    // Active requires a validated key — a provider that just failed validation can't stay Active.
    if (!result.ok && selectedGenerationProvider === name) {
      const fallback = pickFallbackGenerationProvider(updatedProviders, name);
      if (fallback !== name) setSelectedGenerationProvider(fallback);
    }
  };

  const validateDeeplKey = async () => {
    setDeeplValidating(true);
    setDeeplError(undefined);
    const result = await validateDeepLKey(deeplKey, desktopFetch);

    setDeeplValidating(false);
    setDeeplValidatedState(result.ok);
    setDeeplError(result.ok ? undefined : result.message);
    localStorage.setItem('lingora.deepl_validated', result.ok.toString());
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

      // Augment each deck with totalCards and dueToday counts
      const now = Date.now();
      const enrichedDecks = await Promise.all((allDecks || []).map(async (deck: any) => {
        try {
          const countRow = await adapter.querySingle<{ total: number }>(
            `SELECT COUNT(*) AS total FROM deck_cards WHERE deck_id = ?`, [deck.id]
          );
          const dueRow = await adapter.querySingle<{ due: number }>(
            `SELECT COUNT(*) AS due FROM deck_cards dc
             JOIN card_states cs ON cs.card_id = dc.card_id
             WHERE dc.deck_id = ? AND cs.next_review_date <= ?`,
            [deck.id, now]
          );
          return { ...deck, totalCards: countRow?.total ?? 0, dueToday: dueRow?.due ?? 0 };
        } catch {
          return { ...deck, totalCards: 0, dueToday: 0 };
        }
      }));

      setDecks(enrichedDecks);

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

  const addNewDeck = async (title: string, type?: string) => {
    if (!db) return '';
    const deckId = `deck-${Date.now()}`;
    const newDeck = {
      id: deckId,
      name: title,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await createDeck(db, newDeck);

    // Save the deck type in localStorage (default to BASIC)
    const deckTypes = JSON.parse(localStorage.getItem('lingora.deck_types') || '{}');
    deckTypes[deckId] = type ? type.toUpperCase() : 'BASIC';
    localStorage.setItem('lingora.deck_types', JSON.stringify(deckTypes));

    await refreshData();
    return deckId;
  };

  const addNewCard = async (lemmaForm: string, clusterId: string, deckId: string, cardType: string) => {
    if (!db) return;
    try {
      // Validate that the card type matches the deck type
      const deckTypes = JSON.parse(localStorage.getItem('lingora.deck_types') || '{}');
      const deckType = deckTypes[deckId] || 'BASIC'; // default to BASIC
      if (cardType.toUpperCase() !== deckType.toUpperCase()) {
        throw new Error(`Cannot add a ${cardType.toUpperCase()} card to a ${deckType.toUpperCase()} deck.`);
      }

      let lemma = await getLemmaByForm(db, lemmaForm);
      
      // If the lemma doesn't exist (e.g. from AI generation), create a basic one
      if (!lemma) {
        const lemmaId = `lemma-${Date.now()}`;
        const now = Date.now();
        await db.execute(
          `INSERT INTO lemmas (id, form, language, part_of_speech, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [lemmaId, lemmaForm, targetLanguage, 'noun', now, now]
        );
        await db.execute(
          `INSERT INTO inflections (lemma_id, form) VALUES (?, ?)`,
          [lemmaId, lemmaForm]
        );
        lemma = { id: lemmaId } as any;
      }

      let targetCardId = '';

      if (lemma) {
        // Check if a card already exists for this lemma in the cards table
        const existingCard = await db.querySingle<any>(
          `SELECT id FROM cards WHERE lemma_id = ? LIMIT 1`,
          [lemma.id]
        );

        if (existingCard) {
          targetCardId = existingCard.id;
          // Update the deck_id and type on the existing card
          await db.execute(
            `UPDATE cards SET deck_id = ?, type = ? WHERE id = ?`,
            [deckId, cardType.toLowerCase(), targetCardId]
          );
          // Link it to the deck
          await addCardToDeck(db, deckId, targetCardId);
        } else {
          targetCardId = `card-${Date.now()}`;
          const now = Date.now();
          
          await db.execute(
            `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source, native_language)
             VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, 'manual', ?)`,
            [targetCardId, lemma.id, deckId, cardType.toLowerCase(), now, now, nativeLanguage]
          );

          const initialState = createInitialCardState(targetCardId);
          await db.execute(
            `INSERT OR IGNORE INTO card_states (card_id, stability, difficulty, retrievability, next_review_date, lapses, state, reps, learning_steps)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [targetCardId, initialState.stability, initialState.difficulty, initialState.retrievability, initialState.nextReviewAt, initialState.lapses, initialState.state, initialState.reps, initialState.learningSteps]
          );

          await addCardToDeck(db, deckId, targetCardId);
        }

        // If card type is cloze, ensure cloze_cards has a valid row
        if (cardType.toUpperCase() === 'CLOZE') {
          const clozes = await getClozesForCard(db, targetCardId);
          if (clozes.length === 0) {
            const examples = await getExamplesForCard(db, targetCardId);
            const example = examples.find((e) => e.isSelected) ?? examples[0];
            let sentence = example?.sentence || `Ich lerne ${lemmaForm}.`;
            let translation = example?.translation || `I am learning ${lemmaForm}.`;
            let answer = lemmaForm;

            // Attempt to blank out the word in the sentence
            const forms = new Set<string>([lemmaForm]);
            const lower = lemmaForm.toLowerCase();
            const prefix = SEPARABLE_PREFIXES.find((p) => lower.startsWith(p) && lemmaForm.length - p.length >= 3);
            if (prefix) {
              const stem = lemmaForm.slice(prefix.length);
              forms.add(prefix);
              forms.add(stem.length > 4 && stem.toLowerCase().endsWith('en') ? stem.slice(0, -2) : stem);
            }

            let bestMatch = '';
            const lowerSentence = sentence.toLowerCase();
            for (const form of forms) {
              const lowerForm = form.toLowerCase();
              if (lowerSentence.includes(lowerForm) && form.length > bestMatch.length) {
                bestMatch = form;
              }
            }

            if (bestMatch) {
              const regex = new RegExp(bestMatch, 'i');
              const match = sentence.match(regex);
              if (match) {
                sentence = sentence.replace(regex, '[...]');
                answer = match[0];
              }
            } else {
              const regex = new RegExp(lemmaForm, 'i');
              if (regex.test(sentence)) {
                sentence = sentence.replace(regex, '[...]');
              } else {
                sentence = `${sentence} (${lemmaForm} -> [...])`;
              }
            }

            await createCloze(db, {
              id: `cloze-${Date.now()}`,
              cardId: targetCardId,
              sentence,
              answer,
              translation,
              difficulty: 'easy',
              cefrLevel: example?.cefrLevel || 'B2'
            });
          }
        }
      }
      await refreshData();
    } catch (err: any) {
      console.error('[Desktop Services] Error adding card:', err);
      alert(err.message || 'Error adding card');
      throw err; // Re-throw to prevent caller from showing success popup!
    }
  };

  const translateText = async (text: string, source?: LanguageCode, target?: LanguageCode): Promise<string> => {
    const srcLang = source || targetLanguage;
    const tgtLang = target || nativeLanguage;
    try {
      const params = new URLSearchParams({
        client: 'gtx',
        sl: srcLang,
        tl: tgtLang,
        dt: 't',
        q: text,
      });
      const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('[TranslateText] HTTP error:', response.status);
        return text;
      }
      const json = await response.json();
      // Response structure: [[[translatedText, origText, ...], ...], null, detectedLang, ...]
      let translation = '';
      if (Array.isArray(json) && Array.isArray(json[0])) {
        for (const segment of json[0]) {
          if (Array.isArray(segment) && typeof segment[0] === 'string') {
            translation += segment[0];
          }
        }
      }
      console.log('[TranslateText]', { text, srcLang, tgtLang, translation: translation.trim() || '(empty)' });
      return translation.trim() || text;
    } catch (err) {
      console.error('[TranslateText] Failed:', err);
      return text;
    }
  };

  const loadWordLemmaFromDb = async (adapter: DatabaseAdapter, lemmaId: string): Promise<any | null> => {
    const lemma = await adapter.querySingle<any>(
      `SELECT id, form, language, part_of_speech AS pos, gender, plural FROM lemmas WHERE id = ?`,
      [lemmaId]
    );
    if (!lemma) return null;

    const clusters = await adapter.query<any>(
      `SELECT id, label AS context, description AS definition, cefr_level AS cefr FROM meaning_clusters WHERE lemma_id = ? ORDER BY order_index ASC`,
      [lemmaId]
    );

    const enrichedClusters = await Promise.all(clusters.map(async (c: any) => {
      // Get translation from meanings table
      const meanings = await adapter.query<any>(
        `SELECT translation, explanation FROM meanings WHERE meaning_cluster_id = ? ORDER BY order_index ASC`,
        [c.id]
      );
      // Get examples
      const examples = await adapter.query<any>(
        `SELECT sentence AS de, translation AS en FROM examples WHERE meaning_cluster_id = ?`,
        [c.id]
      );

      return {
        id: c.id,
        context: c.context,
        translation: meanings[0]?.translation || lemma.form,
        definition: meanings[0]?.explanation || c.definition || '',
        cefr: c.cefr || 'B2',
        examples: examples.map((ex: any) => ({
          de: ex.de || '',
          en: ex.en || ''
        }))
      };
    }));

    // Get grammar tags / info (fallback to defaults if missing)
    const guideRow = await adapter.querySingle<any>(
      `SELECT usage_note, intro FROM word_guides WHERE headword = ? AND language = ? LIMIT 1`,
      [lemma.form, lemma.language]
    );

    return {
      id: lemma.id,
      form: lemma.form,
      pos: lemma.pos || 'noun',
      cefr: guideRow?.cefr_level || enrichedClusters[0]?.cefr || 'B2',
      gender: lemma.gender,
      frequency: 0,
      grammar: {
        partOfSpeech: lemma.pos || 'noun',
        cefrNotes: guideRow?.usage_note || guideRow?.intro || ''
      },
      clusters: enrichedClusters,
      surfaceForms: [lemma.form]
    };
  };

  const generateWithGemini = async (surfaceForm: string): Promise<any> => {
    const active = providers[selectedGenerationProvider];
    if (!active?.key?.trim()) {
      // PROVIDER_META_DATA's label, not a local ternary — a provider with no branch here used to
      // silently display as "Anthropic" instead of throwing a type error, the same class of bug as
      // SettingsScreen.tsx's now-fixed label ternaries.
      throw new Error(`No API key configured for ${PROVIDER_META_DATA[selectedGenerationProvider].label}. Please add your key in Settings → AI Providers.`);
    }

    if (!db) throw new Error("Database not loaded.");

    // desktopFetch routes through Tauri's HTTP plugin (Rust-side, no page origin) instead of the
    // WebView's own fetch — none of these providers send Access-Control-Allow-Origin for a page
    // origin, so a plain WebView request would be blocked by CORS. See desktopFetch.ts.
    let aiProviderInstance: any;
    if (selectedGenerationProvider === 'openai') {
      aiProviderInstance = new OpenAIProvider({ apiKey: active.key, model: active.model || DEFAULT_MODELS.openai, fetchFn: desktopFetch });
    } else if (selectedGenerationProvider === 'mistral') {
      aiProviderInstance = new MistralProvider({ apiKey: active.key, model: active.model || DEFAULT_MODELS.mistral, fetchFn: desktopFetch });
    } else if (selectedGenerationProvider === 'gemini') {
      aiProviderInstance = new GeminiProvider({ apiKey: active.key, model: active.model || DEFAULT_MODELS.gemini, fetchFn: desktopFetch });
    } else if (selectedGenerationProvider === 'anthropic') {
      aiProviderInstance = new AnthropicProvider({ apiKey: active.key, model: active.model || DEFAULT_MODELS.anthropic, fetchFn: desktopFetch });
    } else if (selectedGenerationProvider === 'deepseek') {
      aiProviderInstance = new DeepSeekProvider({ apiKey: active.key, model: active.model || DEFAULT_MODELS.deepseek, fetchFn: desktopFetch });
    } else if (selectedGenerationProvider === 'groq') {
      aiProviderInstance = new GroqProvider({ apiKey: active.key, model: active.model || DEFAULT_MODELS.groq, fetchFn: desktopFetch });
    }

    const pipeline = await createAIPipeline({
      db,
      ai: aiProviderInstance
    });

    const outcome = await pipeline.lookupOrGenerate(surfaceForm, {
      cefrLevel,
      deckId: 'deck-default', // Fallback, not used when addToDeck is false
      language: targetLanguage,
      nativeLanguage,
      addToDeck: false
    });

    if (outcome.kind === 'existing' || outcome.kind === 'generated') {
      const loaded = await loadWordLemmaFromDb(db, outcome.lemma.id);
      // Make sure counts / UI updates
      await refreshData();
      return loaded;
    } else if (outcome.kind === 'partial') {
      throw new Error("AI generation returned partial/validation issues: " + (outcome.issues || []).join(', '));
    }
  };

  const loadReviewQueue = async (deckId?: string, clozeOnly: boolean = false, cardId?: string): Promise<any[]> => {
    if (!db) return [];

    let finalCards: any[] = [];
    if (cardId) {
      const card = await db.querySingle<any>(`SELECT * FROM cards WHERE id = ?`, [cardId]);
      if (card) finalCards = [card];
    } else {
      const scopeDeckId = deckId === 'all' ? undefined : deckId;
      const cards = clozeOnly
        ? await getClozeCardsDueForReview(db, scopeDeckId)
        : await getCardsDueForReview(db, scopeDeckId);

      finalCards = cards;
      if (finalCards.length === 0) {
        if (scopeDeckId) {
          finalCards = await db.query<any>(
            `SELECT * FROM cards WHERE deck_id = ?`,
            [scopeDeckId]
          );
        } else {
          finalCards = await db.query<any>(
            `SELECT * FROM cards`
          );
        }
      }
    }

    const template = await getDefaultTemplate(db, clozeOnly ? 'cloze' : 'vocab');
    const frontTemplate = template?.frontTemplate || '';
    const backTemplate = template?.backTemplate || '';
    const styles = template?.styles || '';

    const views: any[] = [];
    for (const card of finalCards) {
      const lemma = await getLemmaById(db, card.lemmaId);
      if (!lemma) continue;

      const [meanings, examples, clozes, synonyms, phrases, cardState] = await Promise.all([
        getMeaningsForCard(db, card.id),
        getExamplesForCard(db, card.id),
        getClozesForCard(db, card.id),
        getSynonymsForCard(db, card.id),
        getPhrasesForCard(db, card.id),
        clozeOnly ? getClozeState(db, card.id) : getCardState(db, card.id),
      ]);

      const cloze = clozes[0];
      const primaryMeaning = meanings.find((m) => m.isPrimary) ?? meanings[0];
      const selectedExample = examples.find((e) => e.isSelected) ?? examples[0];

      const templateContext = buildCardContext({
        lemma,
        meanings,
        examples,
        synonyms,
        phrases,
        cloze,
        mode: clozeOnly ? 'cloze' : 'vocab',
      });

      const frontHtml = renderCardHtml(frontTemplate, styles, templateContext, 'front');
      const backHtml = renderCardHtml(backTemplate, styles, templateContext, 'back');

      views.push({
        id: card.id,
        front: lemma.form,
        back: primaryMeaning?.translation || '',
        pos: lemma.partOfSpeech || 'noun',
        cefr: primaryMeaning?.cefrLevel || 'B2',
        context: primaryMeaning ? 'General' : '',
        exampleDe: selectedExample?.sentence || '',
        exampleEn: selectedExample?.translation || '',
        frontHtml,
        backHtml,
        cardState: cardState || createInitialCardState(card.id),
      });
    }

    return views;
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
      validateDeeplKey,
      loadReviewQueue
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
