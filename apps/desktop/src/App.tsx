import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import type { ScreenId } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardScreen } from './screens/DashboardScreen';
import { SearchLookupScreen } from './screens/SearchLookupScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { DecksScreen } from './screens/DecksScreen';
import { SentenceMiningScreen } from './screens/SentenceMiningScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

import { DesktopServicesProvider, useDesktopServices } from './services/desktopServices';
import { MOCK_DECKS, MOCK_WORDS, MOCK_CARDS_QUEUE, MOCK_MINING_QUEUE } from './mockData';

const AppContent: React.FC = () => {
  const { db, decks: dbDecks, isLoading, dueCards, addNewCard, loadReviewQueue } = useDesktopServices();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [words, setWords] = useState(MOCK_WORDS);
  const [cardsQueue, setCardsQueue] = useState(MOCK_CARDS_QUEUE);
  const [miningQueue, setMiningQueue] = useState(MOCK_MINING_QUEUE);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'learning' | 'ai' | 'translation' | 'audio' | 'srs' | 'desktop' | undefined>(undefined);

  // Search & Lookup's "no AI provider configured" prompt jumps straight to the AI Providers tab,
  // rather than landing on Settings' own default tab and making the user find it themselves.
  const navigateToAiProviderSettings = () => {
    setSettingsInitialTab('ai');
    setActiveScreen('settings');
  };

  // Map DB deck shape { id, name, ... } → UI Deck shape { id, title, totalCards, ... }
  // While DB is loading, show mock decks as placeholders
  const decks = isLoading
    ? MOCK_DECKS
    : dbDecks.map((d: any, idx: number) => {
        const deckTypes = JSON.parse(localStorage.getItem('lingora.deck_types') || '{}');
        const deckType = deckTypes[d.id] || 'BASIC';
        return {
          id: d.id,
          title: d.name,
          description: `${deckType} Study Deck`,
          totalCards: d.totalCards ?? 0,
          dueToday: d.dueToday ?? 0,
          newToday: d.newToday ?? 0,
          retention: d.retention ?? 0,
          icon: d.emoji || 'BookOpen',
          color: ['var(--accent-primary)', 'var(--success)', 'var(--info)', 'var(--warning)', 'var(--danger)'][idx % 5]
        };
      });

  const totalDueCards = dueCards.length;

  const handleAddCard = async (wordForm: string, context: string, deckId: string, cardType: string, deckTitle?: string) => {
    try {
      await addNewCard(wordForm, context, deckId, cardType);
      // Find deck title for the popup message
      const resolvedTitle = deckTitle || decks.find(d => d.id === deckId)?.title || 'Deck';
      alert(`Successfully added card "${wordForm}" to "${resolvedTitle}" as a ${cardType} card!`);
    } catch (err) {
      // addNewCard handles error popups internally
    }
  };

  const handleProcessMiningItem = (id: string) => {
    setMiningQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleStartReview = async (deckId?: string, cardId?: string) => {
    if (!db) {
      alert("Database not loaded yet!");
      return;
    }

    try {
      const queue = await loadReviewQueue(deckId, false, cardId);
      if (!queue || queue.length === 0) {
        alert(deckId ? "This deck is currently empty! Add some cards to it first." : "No cards due for review today! Excellent job.");
        return;
      }
      setCardsQueue(queue);
      setActiveScreen('review');
    } catch (err: any) {
      console.error('[StartReview] Error preparing review session:', err);
      alert('Error preparing review session: ' + err.message);
    }
  };


  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        dueCardsCount={totalDueCards}
        miningCount={miningQueue.length}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          onOpenQuickLookup={() => setActiveScreen('search')}
          onOpenMiningModal={() => setActiveScreen('mining')}
        />

        {activeScreen === 'dashboard' && (
          <DashboardScreen
            decks={decks}
            miningQueue={miningQueue}
            recentWords={words}
            onStartReview={handleStartReview}
            onSelectScreen={setActiveScreen}
          />
        )}

        {activeScreen === 'search' && (
          <SearchLookupScreen
            words={words}
            decks={decks}
            onAddCard={handleAddCard}
            onNavigateToAiProviderSettings={navigateToAiProviderSettings}
          />
        )}

        {activeScreen === 'review' && (
          <ReviewScreen
            cards={cardsQueue}
            onFinishReview={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'decks' && (
          <DecksScreen
            decks={decks}
            onStartReview={handleStartReview}
          />
        )}

        {activeScreen === 'mining' && (
          <SentenceMiningScreen
            queue={miningQueue}
            onProcessItem={handleProcessMiningItem}
          />
        )}

        {activeScreen === 'stats' && (
          <StatsScreen />
        )}

        {activeScreen === 'settings' && (
          <SettingsScreen initialTab={settingsInitialTab} />
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DesktopServicesProvider>
      <AppContent />
    </DesktopServicesProvider>
  );
};
