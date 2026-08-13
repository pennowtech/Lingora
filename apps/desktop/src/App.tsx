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
import { QuickLookupOverlay } from './components/QuickLookupOverlay';

import { MOCK_DECKS, MOCK_WORDS, MOCK_CARDS_QUEUE, MOCK_MINING_QUEUE } from './mockData';

export const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [decks, setDecks] = useState(MOCK_DECKS);
  const [words, setWords] = useState(MOCK_WORDS);
  const [cardsQueue, setCardsQueue] = useState(MOCK_CARDS_QUEUE);
  const [miningQueue, setMiningQueue] = useState(MOCK_MINING_QUEUE);

  const [isQuickLookupOpen, setIsQuickLookupOpen] = useState(false);

  const totalDueCards = decks.reduce((sum, d) => sum + d.dueToday, 0);

  const handleAddCard = (wordForm: string, context: string, deckTitle: string, cardType: string) => {
    alert(`Card for "${wordForm}" (${context} — ${cardType}) added to deck "${deckTitle}"!`);
  };

  const handleProcessMiningItem = (id: string) => {
    setMiningQueue(prev => prev.filter(item => item.id !== id));
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
          onOpenQuickLookup={() => setIsQuickLookupOpen(true)}
          onOpenMiningModal={() => setActiveScreen('mining')}
        />

        {activeScreen === 'dashboard' && (
          <DashboardScreen
            decks={decks}
            miningQueue={miningQueue}
            recentWords={words}
            onStartReview={() => setActiveScreen('review')}
            onSelectScreen={setActiveScreen}
          />
        )}

        {activeScreen === 'search' && (
          <SearchLookupScreen
            words={words}
            decks={decks}
            onAddCard={handleAddCard}
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
            onStartReview={() => setActiveScreen('review')}
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
          <SettingsScreen />
        )}
      </div>

      {/* Global Quick Lookup Floating Overlay */}
      <QuickLookupOverlay
        isOpen={isQuickLookupOpen}
        onClose={() => setIsQuickLookupOpen(false)}
      />
    </div>
  );
};
