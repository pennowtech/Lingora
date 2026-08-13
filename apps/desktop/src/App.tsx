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

import { DesktopServicesProvider, useDesktopServices } from './services/desktopServices';
import { MOCK_DECKS, MOCK_WORDS, MOCK_CARDS_QUEUE, MOCK_MINING_QUEUE } from './mockData';

const AppContent: React.FC = () => {
  const { decks: dbDecks, isLoading, dueCards, addNewCard } = useDesktopServices();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [words, setWords] = useState(MOCK_WORDS);
  const [cardsQueue, setCardsQueue] = useState(MOCK_CARDS_QUEUE);
  const [miningQueue, setMiningQueue] = useState(MOCK_MINING_QUEUE);

  const [isQuickLookupOpen, setIsQuickLookupOpen] = useState(false);

  // Map DB deck shape { id, name, ... } → UI Deck shape { id, title, totalCards, ... }
  // While DB is loading, show mock decks as placeholders
  const decks = isLoading
    ? MOCK_DECKS
    : dbDecks.map((d: any, idx: number) => ({
        id: d.id,
        title: d.name,
        description: d.description || '',
        totalCards: d.totalCards ?? 0,
        dueToday: d.dueToday ?? 0,
        newToday: d.newToday ?? 0,
        retention: d.retention ?? 0,
        icon: d.emoji || 'BookOpen',
        color: ['var(--accent-primary)', 'var(--success)', 'var(--info)', 'var(--warning)', 'var(--danger)'][idx % 5]
      }));

  const totalDueCards = dueCards.length;

  const handleAddCard = (wordForm: string, context: string, deckTitle: string, cardType: string) => {
    addNewCard(wordForm, context, deckTitle, cardType);
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

export const App: React.FC = () => {
  return (
    <DesktopServicesProvider>
      <AppContent />
    </DesktopServicesProvider>
  );
};
