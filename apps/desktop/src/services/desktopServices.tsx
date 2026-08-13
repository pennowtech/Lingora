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
  generateWithGemini: (surfaceForm: string, geminiKey: string) => Promise<any>;
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

  const generateWithGemini = async (surfaceForm: string, geminiKey: string): Promise<any> => {
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
      generateWithGemini
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
