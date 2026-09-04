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
import { DEFAULT_ENABLED_QUESTION_TYPES, QUESTION_TYPE_META } from '@lingora/core';
import type { QuestionType } from '@lingora/types';

const AppContent: React.FC = () => {
  const {
    db,
    decks: dbDecks,
    isLoading,
    dueCards,
    addNewCard,
    loadReviewQueue,
    // Renamed on destructure - this is the real pending-mining-entries count (see
    // desktopServices.tsx's refreshDataInternal), kept separate from this component's own
    // `miningQueue` local state below, which still backs the Mining Studio screen's own
    // interactive (mock) queue - that screen's real backend is a separate, later phase.
    miningQueue: pendingMiningEntries,
    recentWords,
    retention30d,
    streakDays,
    dailyActivity,
    difficultWords,
  } = useDesktopServices();
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

  // Dashboard's language-pair badge, mirroring apps/mobile's Home - tapping it jumps straight to
  // Settings' Learning tab (native/target language pickers), same pattern as the AI-provider jump.
  const navigateToLanguageSettings = () => {
    setSettingsInitialTab('learning');
    setActiveScreen('settings');
  };

  // Map DB deck shape { id, name, ... } → UI Deck shape { id, title, totalCards, ... }
  // While DB is loading, show mock decks as placeholders
  const decks = isLoading
    ? MOCK_DECKS
    : dbDecks.map((d: any, idx: number) => {
        // The deck card's subtitle reflects which review formats this deck actually practices
        // with (the real decks.enabled_question_types column, migration 0022 - see
        // components/ReviewModesGrid.tsx), not the legacy BASIC/CLOZE/PHRASE card-type label,
        // which no longer has any UI to set it per deck.
        const questionTypes: QuestionType[] = d.enabledQuestionTypes || [...DEFAULT_ENABLED_QUESTION_TYPES];
        const description = questionTypes.map((t) => QUESTION_TYPE_META[t].label).join(', ');
        return {
          id: d.id,
          title: d.name,
          description,
          totalCards: d.totalCards ?? 0,
          dueToday: d.dueToday ?? 0,
          newToday: d.newToday ?? 0,
          retention: d.retention ?? 0,
          icon: d.emoji || 'BookOpen',
          color: ['var(--accent-primary)', 'var(--success)', 'var(--info)', 'var(--warning)', 'var(--danger)'][idx % 5],
          enabledQuestionTypes: questionTypes,
        };
      });

  const totalDueCards = dueCards.length;

  const handleAddCard = async (wordForm: string, context: string, deckId: string, cardType: string, deckTitle?: string, clozeOverride?: { sentence: string; answer: string; translation: string }) => {
    try {
      await addNewCard(wordForm, context, deckId, cardType, clozeOverride);
      // Find deck title for the popup message
      const resolvedTitle = deckTitle || decks.find(d => d.id === deckId)?.title || 'Deck';
      // Doesn't name the card's content type (cloze/basic/phrase) any more - a deck now supports
      // any mix of review modes, and calling out "CLOZE" read as if that were the deck's one
      // supported format, when it's just this one card's own rendering style.
      alert(`Successfully added card "${wordForm}" to "${resolvedTitle}"!`);
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
      alert('Error preparing review session: ' + (err?.message || String(err)));
    }
  };


  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        dueCardsCount={totalDueCards}
        miningCount={pendingMiningEntries.length}
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
            miningQueue={pendingMiningEntries}
            recentWords={recentWords}
            retention30d={retention30d}
            streakDays={streakDays}
            dailyActivity={dailyActivity}
            difficultWords={difficultWords}
            onStartReview={handleStartReview}
            onSelectScreen={setActiveScreen}
            onOpenLanguageSettings={navigateToLanguageSettings}
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
          <StatsScreen onSelectScreen={setActiveScreen} />
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
