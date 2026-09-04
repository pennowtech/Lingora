import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DatabaseAdapter } from '@lingora/database';
import {
  getAllDecks,
  getDeckById,
  setDeckQuestionTypes,
  getLemmaByForm,
  getClustersForLemma,
  addCardToDeck,
  createCardForSense,
  createDeck,
  getCardById,
  getCardsByLemma,
  recordReview,
  recordClozeReview,
  getExamplesForCard,
  getClozesForCard,
  getCardState,
  getClozeState,
  getCardsDueForReview,
  getClozeCardsDueForReview,
  getDefaultTemplate,
  loadCardView,
  createCloze,
  setCloze
} from '@lingora/database';
import { schedule, createInitialCardState } from '@lingora/srs';
import { renderCardHtml, SEPARABLE_PREFIXES } from './templates';
import type { Card, LanguageCode, CefrLevel, QuestionType } from '@lingora/types';
import {
  OpenAIProvider,
  MistralProvider,
  GeminiProvider,
  AnthropicProvider,
  DeepSeekProvider,
  GroqProvider,
  GoogleTranslateProvider,
  DeepLProvider,
  createAIPipeline,
  validateOpenAIKey,
  validateMistralKey,
  validateGeminiKey,
  validateClaudeKey,
  validateDeepSeekKey,
  validateGroqKey,
  validateDeepLKey,
  type AIProvider,
  type DictionaryProvider
} from '@lingora/ai';
import { DEFAULT_ENABLED_QUESTION_TYPES, DEFAULT_MODELS, GENERATION_PROVIDERS, PROVIDER_META_DATA, type GenerationProviderName } from '@lingora/core';
import { getDesktopDatabase } from './database';
import { desktopFetch } from './desktopFetch';

// Reuses @lingora/core's GenerationProviderName instead of a separately hand-maintained literal
// union, so a new generation provider (see GENERATION_PROVIDERS) doesn't silently drift out of
// sync here the way the model-list/default-model duplication did before it was wired to core.
export type ProviderName = GenerationProviderName;
export type TranslationProvider = 'google' | 'deepl' | GenerationProviderName;

const PROVIDER_ORDER: ProviderName[] = [...GENERATION_PROVIDERS];

/** OpenAI, Mistral, Gemini, Claude, DeepSeek, and Groq all implement both provider slots — same
 * helper as apps/mobile's lib/services.tsx, reused here for both `generateWithGemini` and the
 * `dictionary` slot below so the six-provider if/else chain isn't duplicated. */
function instantiateGenerationProvider(name: ProviderName, key: string, model: string): AIProvider & DictionaryProvider {
  switch (name) {
    case 'openai':
      return new OpenAIProvider({ apiKey: key, model, fetchFn: desktopFetch });
    case 'mistral':
      return new MistralProvider({ apiKey: key, model, fetchFn: desktopFetch });
    case 'gemini':
      return new GeminiProvider({ apiKey: key, model, fetchFn: desktopFetch });
    case 'anthropic':
      return new AnthropicProvider({ apiKey: key, model, fetchFn: desktopFetch });
    case 'deepseek':
      return new DeepSeekProvider({ apiKey: key, model, fetchFn: desktopFetch });
    case 'groq':
      return new GroqProvider({ apiKey: key, model, fetchFn: desktopFetch });
  }
}

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
  rateCard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy', isCloze?: boolean) => Promise<void>;
  addNewDeck: (title: string, questionTypes?: QuestionType[]) => Promise<string>;
  addNewCard: (lemmaForm: string, clusterId: string, deckId: string, cardType: string, clozeOverride?: { sentence: string; answer: string; translation: string }) => Promise<void>;
  translateText: (text: string, source?: LanguageCode, target?: LanguageCode) => Promise<string>;
  dictionary: DictionaryProvider;
  activeAiProvider: AIProvider | null;
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
  validateProviderKey: (name: ProviderName, activateOnSuccess?: boolean) => Promise<void>;
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

  // The dictionary slot — same idea as apps/mobile's lib/services.tsx#buildAIServices: Google's
  // free tier needs no key and is the default; DeepL or any configured-and-validated generation
  // provider can also serve translation/language-detection, per Settings → Translation. Recomputed
  // whenever the relevant state changes rather than rebuilt once at boot (desktop has no async
  // "reloadServices" step the way mobile's SecureStore-backed bootstrap does).
  const dictionary = useMemo<DictionaryProvider>(() => {
    if (selectedTranslationProvider === 'deepl' && deeplValidated && deeplKey.trim() !== '') {
      return new DeepLProvider({ apiKey: deeplKey.trim(), fetchFn: desktopFetch });
    }
    if (
      selectedTranslationProvider !== 'google' &&
      selectedTranslationProvider !== 'deepl' &&
      providers[selectedTranslationProvider]?.validated
    ) {
      const cfg = providers[selectedTranslationProvider];
      return instantiateGenerationProvider(selectedTranslationProvider, cfg.key, cfg.model);
    }
    return new GoogleTranslateProvider({ fetchFn: desktopFetch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTranslationProvider, deeplKey, deeplValidated, providers]);

  // A ready-to-use AIProvider instance for the currently Active generation provider — null when it
  // has no validated key. Distinct from `generateWithGemini` (which always runs the whole
  // lookupOrGenerate pipeline and persists a card): this is for cheaper one-off calls like the
  // Search screen's quick-explain preview, mirroring apps/mobile's `ai` from useServices().
  const activeAiProvider = useMemo<AIProvider | null>(() => {
    const cfg = providers[selectedGenerationProvider];
    if (!cfg?.validated || cfg.key.trim() === '') return null;
    return instantiateGenerationProvider(selectedGenerationProvider, cfg.key, cfg.model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenerationProvider, providers]);

  useEffect(() => {
    localStorage.setItem('lingora.providers', JSON.stringify(providers));
  }, [providers]);

  // Validation Logic — delegates to @lingora/ai's shared validators (also used by apps/mobile),
  // which give a real reachability pre-check and friendly, specific error messages (bad key vs.
  // quota vs. rate limit vs. server error vs. offline) instead of a single generic fallback string.
  //
  // activateOnSuccess: used by the provider grid's "click to make this the active provider" flow
  // (SettingsScreen.tsx) - a key can expire, get revoked, or have its previously-selected model
  // removed/renamed on the provider's side well after it was last checked, so switching Active
  // needs a real live check here, not just trusting whatever `validated` said from that last
  // check. The explicit "Validate" button inside a provider's own expanded panel leaves this
  // false - re-checking a key shouldn't silently steal Active away from a different provider the
  // learner is deliberately keeping active while just poking at this one's settings.
  const validateProviderKey = async (name: ProviderName, activateOnSuccess = false) => {
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

    if (result.ok) {
      if (activateOnSuccess) setSelectedGenerationProvider(name);
    } else if (selectedGenerationProvider === name) {
      // Active requires a validated key — a provider that just failed validation can't stay Active.
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

  // isCloze picks which schedule/table gets updated - card_states (recordReview) for a plain/
  // reverse-mode card or cloze_states (recordClozeReview) for one reviewed in Cloze form, matching
  // loadReviewQueue's own per-card `isCloze` flag (see above) so a rating always lands in the same
  // FSRS schedule the due-card query pulled it from, instead of always writing card_states
  // regardless of mode.
  const rateCard = async (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy', isCloze: boolean = false) => {
    if (!db) return;
    try {
      const currentState = (isCloze ? await getClozeState(db, cardId) : await getCardState(db, cardId)) ?? createInitialCardState(cardId);
      const newState = schedule(currentState, rating, Date.now());

      const recordFn = isCloze ? recordClozeReview : recordReview;
      await recordFn(db, {
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

  const addNewDeck = async (title: string, questionTypes?: QuestionType[]) => {
    if (!db) return '';
    const deckId = `deck-${Date.now()}`;
    // Which review formats this deck practices with - same five as apps/mobile's Mixed practice
    // (Settings -> Learning), picked once at deck-creation time here rather than one global
    // preference - the real decks.enabled_question_types column (migration 0022), shared with
    // mobile's own equivalent deck-creation UI. `type` (the legacy BASIC/CLOZE/PHRASE
    // card-content-type label) is no longer stored or enforced at all - see addNewCard's doc
    // comment below for why.
    const newDeck = {
      id: deckId,
      name: title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...(questionTypes && questionTypes.length > 0 && { enabledQuestionTypes: questionTypes }),
    };
    await createDeck(db, newDeck);

    await refreshData();
    return deckId;
  };

  const addNewCard = async (lemmaForm: string, clusterId: string, deckId: string, cardType: string, clozeOverride?: { sentence: string; answer: string; translation: string }) => {
    if (!db) return;
    try {
      // A deck no longer restricts which card content type (cloze/basic/phrase) can be saved
      // into it - that used to be enforced here via the deck's own BASIC/CLOZE/PHRASE type
      // (lingora.deck_types), but decks now have no such type: review modes (see
      // components/ReviewModesGrid.tsx) govern how a deck is reviewed, not what content type its
      // cards hold, matching apps/mobile (a deck there is just a card collection too).
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
        const targetDeck = await getDeckById(db, deckId);
        const deckQuestionTypes = targetDeck?.enabledQuestionTypes || [...DEFAULT_ENABLED_QUESTION_TYPES];

        // cards.type = 'cloze' makes getCardsDueForReview (vocab/reverse review) skip the card
        // entirely (see that function's own doc comment: a cloze card has no example/translation
        // to render as a plain flip card). A deck whose review modes are Cloze-only really does
        // want that; a deck that ALSO reviews vocab/reverse needs the same card eligible for
        // both, which only works if it stays 'basic' - the cloze content underneath (cloze_cards,
        // created below) is what actually makes it reviewable as Cloze too, independent of this
        // column. Only "CLOZE and nothing else enabled" ever persists type = 'cloze'.
        const wantsClozeOnly = cardType.toUpperCase() === 'CLOZE' && deckQuestionTypes.every((t) => t === 'cloze');
        const persistedType = wantsClozeOnly ? 'cloze' : (cardType.toUpperCase() === 'CLOZE' ? 'basic' : cardType.toLowerCase());

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
            [deckId, persistedType, targetCardId]
          );
          // Link it to the deck
          await addCardToDeck(db, deckId, targetCardId);
        } else {
          targetCardId = `card-${Date.now()}`;
          const now = Date.now();

          await db.execute(
            `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source, native_language)
             VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, 'manual', ?)`,
            [targetCardId, lemma.id, deckId, persistedType, now, now, nativeLanguage]
          );

          const initialState = createInitialCardState(targetCardId);
          await db.execute(
            `INSERT OR IGNORE INTO card_states (card_id, stability, difficulty, retrievability, next_review_date, lapses, state, reps, learning_steps)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [targetCardId, initialState.stability, initialState.difficulty, initialState.retrievability, initialState.nextReviewAt, initialState.lapses, initialState.state, initialState.reps, initialState.learningSteps]
          );

          await addCardToDeck(db, deckId, targetCardId);
        }

        // A cloze-type card saved into a deck whose review modes don't include Cloze would be
        // unreviewable in that format even though it was just explicitly generated as one - the
        // deck's review modes are extended to cover it rather than silently rejecting the card
        // or leaving a mismatch the learner never asked for.
        if (cardType.toUpperCase() === 'CLOZE') {
          const current = deckQuestionTypes;
          if (!current.includes('cloze')) {
            await setDeckQuestionTypes(db, deckId, [...current, 'cloze']);
          }
        }

        // If card type is cloze, ensure cloze_cards has a valid row
        if (cardType.toUpperCase() === 'CLOZE') {
          if (clozeOverride) {
            // The learner picked the blank(s) themselves (components/DeckPickerModal.tsx's "Edit
            // the Blank" wizard step) - always replace whatever's there (setCloze deletes first),
            // never gated on "only if none exists yet" like the auto-guess below. An explicit
            // edit must win even when a card already had an older, auto-guessed cloze - the
            // clozes.length === 0 guard that used to wrap this whole block was silently dropping
            // every override on a card that had already been added once before.
            const examples = await getExamplesForCard(db, targetCardId);
            const example = examples.find((e) => e.isSelected) ?? examples[0];
            await setCloze(db, targetCardId, {
              sentence: clozeOverride.sentence,
              answer: clozeOverride.answer,
              translation: clozeOverride.translation,
              difficulty: 'easy',
              cefrLevel: example?.cefrLevel || 'B2'
            });
          } else {
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
      }
      await refreshData();
    } catch (err: any) {
      console.error('[Desktop Services] Error adding card:', err);
      alert(err.message || 'Error adding card');
      throw err; // Re-throw to prevent caller from showing success popup!
    }
  };

  // Routes through the `dictionary` slot above instead of a hardcoded Google Translate fetch —
  // honors whichever provider is selected under Settings → Translation (Google/DeepL/an AI
  // provider), same as apps/mobile's quick-translate. Callers that just want "some translation" can
  // keep using this; SearchLookupScreen also calls `dictionary`/`detectSearchLanguage` directly
  // where it needs language-direction detection, which this signature doesn't expose.
  const translateText = async (text: string, source?: LanguageCode, target?: LanguageCode): Promise<string> => {
    const srcLang = source || targetLanguage;
    const tgtLang = target || nativeLanguage;
    try {
      const result = await dictionary.translate(text, srcLang, tgtLang);
      return result.data.trim() || text;
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
      `SELECT id, label AS context, description AS definition, cefr_level AS cefr, more_info AS moreInfoJson FROM meaning_clusters WHERE lemma_id = ? ORDER BY order_index ASC`,
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
        `SELECT id, sentence AS de, translation AS en, is_selected AS isSelected, generation_meta_data_id AS generationMetadataId
         FROM examples WHERE meaning_cluster_id = ? ORDER BY is_selected DESC LIMIT 10`,
        [c.id]
      );

      return {
        id: c.id,
        context: c.context,
        translation: meanings[0]?.translation || lemma.form,
        definition: meanings[0]?.explanation || c.definition || '',
        rawDescription: c.definition,
        moreInfo: (() => { try { return c.moreInfoJson ? JSON.parse(c.moreInfoJson) : null; } catch { return null; } })(),
        cefr: c.cefr || 'B2',
        examples: examples.map((ex: any) => ({
          id: ex.id,
          de: ex.de || '',
          en: ex.en || '',
          isSelected: !!ex.isSelected,
          generationMetadataId: ex.generationMetadataId
        }))
      };
    }));

    // Get grammar tags / info (fallback to defaults if missing)
    const guideRow = await adapter.querySingle<any>(
      `SELECT usage_note, intro FROM word_guides WHERE headword = ? AND language = ? LIMIT 1`,
      [lemma.form, lemma.language]
    );
    const cardRow = await adapter.querySingle<{ id: string }>(`SELECT id FROM cards WHERE lemma_id = ? LIMIT 1`, [lemmaId]);

    return {
      id: lemma.id,
      form: lemma.form,
      pos: lemma.pos || 'noun',
      cefr: guideRow?.cefr_level || enrichedClusters[0]?.cefr || 'B2',
      gender: lemma.gender,
      cardId: cardRow?.id,
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
    const aiProviderInstance = instantiateGenerationProvider(selectedGenerationProvider, active.key, active.model || DEFAULT_MODELS[selectedGenerationProvider]);

    const pipeline = await createAIPipeline({
      db,
      ai: aiProviderInstance,
      dictionary
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

  // The per-card content assembly (meanings/examples/clozes/synonyms/phrases/cardState ->
  // templateContext) is @lingora/database's shared loadCardView (packages/database/src/
  // repositories/reviewQueue.ts) - the exact same code mobile's review session uses, so a bug
  // fixed there (e.g. hasClozeVariant vs card.type) never has to be fixed twice. What stays
  // desktop-specific is due-card *selection*: desktop has one Review button per deck instead of
  // mobile's three (Practice/Cloze/Reverse), so a plain (non-clozeOnly) session here still merges
  // both due queues rather than only the basic one - without a dedicated Cloze entry point, a
  // cloze-only deck would otherwise never show up as reviewable at all.
  const loadReviewQueue = async (deckId?: string, clozeOnly: boolean = false, cardId?: string): Promise<any[]> => {
    if (!db) return [];

    let finalCards: Card[] = [];
    if (cardId) {
      const card = await getCardById(db, cardId);
      if (card) finalCards = [card];
    } else {
      const scopeDeckId = deckId === 'all' ? undefined : deckId;
      if (clozeOnly) {
        finalCards = await getClozeCardsDueForReview(db, scopeDeckId);
      } else {
        // A plain review session mixes both card types that can actually be due - basic (via
        // card_states) and cloze (via cloze_states) - rather than only ever the basic ones.
        // getCardsDueForReview alone filters c.type = 'basic', so a deck holding only cloze cards
        // (or a card generated as Cloze via the Card Generator/Add to Deck flow) would otherwise
        // never turn up here at all, reporting the deck as empty even with real cards in it.
        const [basicDue, clozeDue] = await Promise.all([
          getCardsDueForReview(db, scopeDeckId),
          getClozeCardsDueForReview(db, scopeDeckId),
        ]);
        finalCards = [...basicDue, ...clozeDue];
      }

      if (finalCards.length === 0) {
        // Real deck membership is deck_cards (many-to-many - a card can be linked to more than
        // one deck), not cards.deck_id (a single-owner column that only ever reflects whichever
        // deck last created/re-typed the card - see addNewCard). Querying deck_id directly here
        // silently hid every card whose deck_id pointed at an earlier deck even though
        // deck_cards correctly listed it in this one, making a deck with real cards report as
        // empty on Review. Columns are aliased to Card's camelCase shape (matching
        // getCardById/getCardsDueForReview) - a bare `SELECT *`/`c.*` here previously returned raw
        // snake_case rows, so card.lemmaId was silently undefined and every card got skipped.
        finalCards = scopeDeckId
          ? await db.query<Card>(
              `SELECT c.id, c.lemma_id AS lemmaId, c.deck_id AS deckId, c.type, c.primary_meaning_id AS primaryMeaningId, c.created_at AS createdAt, c.updated_at AS updatedAt, c.suspended_at AS suspendedAt, c.source, c.native_language AS nativeLanguage
               FROM cards c INNER JOIN deck_cards dc ON dc.card_id = c.id WHERE dc.deck_id = ?`,
              [scopeDeckId]
            )
          : await db.query<Card>(
              `SELECT id, lemma_id AS lemmaId, deck_id AS deckId, type, primary_meaning_id AS primaryMeaningId, created_at AS createdAt, updated_at AS updatedAt, suspended_at AS suspendedAt, source, native_language AS nativeLanguage
               FROM cards`
            );
        if (clozeOnly) finalCards = finalCards.filter((c) => c.type === 'cloze');
      }
    }

    // Both templates are fetched once, up front, regardless of clozeOnly - a mixed plain-review
    // queue needs both (see the per-card `isCardCloze` branch below); the dedicated Cloze
    // Practice screen only ever hits the cloze branch, so fetching vocab too there is harmless.
    const [vocabTemplate, clozeTemplate] = await Promise.all([
      getDefaultTemplate(db, 'vocab'),
      getDefaultTemplate(db, 'cloze'),
    ]);

    const views: any[] = [];
    for (const card of finalCards) {
      try {
        const isCardCloze = clozeOnly || card.type === 'cloze';
        const view = await loadCardView(db, card, isCardCloze);
        if (!view) continue;

        const template = isCardCloze ? clozeTemplate : vocabTemplate;
        const frontHtml = renderCardHtml(template?.frontTemplate || '', template?.styles || '', view.templateContext, 'front');
        const backHtml = renderCardHtml(template?.backTemplate || '', template?.styles || '', view.templateContext, 'back');

        views.push({
          id: card.id,
          front: view.form,
          back: isCardCloze ? (view.clozeAnswer || view.meaning || '') : (view.meaning || ''),
          pos: view.partOfSpeech || 'noun',
          cefr: view.cefrLevel || 'B2',
          context: view.meaning ? 'General' : '',
          exampleDe: isCardCloze ? (view.clozeSentence || '') : (view.example || ''),
          exampleEn: isCardCloze ? (view.clozeTranslation || '') : (view.exampleTranslation || ''),
          frontHtml,
          backHtml,
          cardState: view.cardState,
          isCloze: isCardCloze,
        });
      } catch (err) {
        // One card with malformed/missing data (a stale reference, a partial delete) must not
        // sink the whole review session - skip it and keep going, same as loadCardView's own
        // `!lemma` guard does for a missing lemma specifically.
        console.warn('[loadReviewQueue] Skipping card that failed to build a review view:', card.id, err);
      }
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
      dictionary,
      activeAiProvider,
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
