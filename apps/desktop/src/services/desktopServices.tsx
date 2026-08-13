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
import { getDesktopDatabase } from './database';

interface DesktopServicesContextType {
  db: DatabaseAdapter | null;
  isLoading: boolean;
  decks: any[];
  dueCards: any[];
  miningQueue: any[];
  refreshData: () => Promise<void>;
  rateCard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
  addNewDeck: (title: string, description?: string) => Promise<void>;
  addNewCard: (lemmaForm: string, clusterId: string, deckId: string, cardType: string) => Promise<void>;
}

const DesktopServicesContext = createContext<DesktopServicesContextType | null>(null);

export const DesktopServicesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseAdapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [miningQueue, setMiningQueue] = useState<any[]>([]);

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
         LIMIT 50`,
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
      const currentStateRow = await db.querySingle<any>(
        `SELECT stability, difficulty, retrievability, next_review_date AS nextReviewAt, lapses, state, reps, learning_steps AS learningSteps, last_review_date AS lastReviewAt
         FROM card_states WHERE card_id = ?`,
        [cardId]
      );

      const currentState = currentStateRow || createInitialCardState(cardId);
      const newState = schedule(currentState, rating, Date.now());

      const reviewEvent = {
        id: `rev-${Date.now()}`,
        cardId,
        rating,
        reviewedAt: Date.now(),
        durationMs: 1500
      };

      await recordReview(db, reviewEvent, newState);
      await refreshData();
    } catch (err) {
      console.error('[Desktop Services] Error rating card:', err);
    }
  };

  const addNewDeck = async (title: string, description?: string) => {
    if (!db) return;
    try {
      const now = Date.now();
      await createDeck(db, {
        id: `deck-${now}`,
        name: title,
        parentId: undefined,
        emoji: '📚',
        createdAt: now,
        updatedAt: now
      });
      await refreshData();
    } catch (err) {
      console.error('[Desktop Services] Error creating deck:', err);
    }
  };

  const addNewCard = async (lemmaForm: string, clusterId: string, deckId: string, cardType: string) => {
    if (!db) return;
    try {
      const lemma = await getLemmaByForm(db, lemmaForm);
      if (lemma) {
        const cardId = `card-${Date.now()}`;
        await db.execute(
          `INSERT OR IGNORE INTO cards (id, lemma_id, type, source, created_at, updated_at)
           VALUES (?, ?, ?, 'manual', ?, ?)`,
          [cardId, lemma.id, cardType.toLowerCase(), Date.now(), Date.now()]
        );

        // Create initial FSRS state
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

  return (
    <DesktopServicesContext.Provider value={{
      db,
      isLoading,
      decks,
      dueCards,
      miningQueue,
      refreshData,
      rateCard,
      addNewDeck,
      addNewCard
    }}>
      {children}
    </DesktopServicesContext.Provider>
  );
};

export const useDesktopServices = () => {
  const context = useContext(DesktopServicesContext);
  if (!context) {
    throw new Error('useDesktopServices must be used within DesktopServicesProvider');
  }
  return context;
};
