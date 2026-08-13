import React, { useState } from 'react';
import { Search, Volume2, Sparkles, Plus, Layers, BookOpen, Check, Layers2, FileText, CheckCircle2 } from 'lucide-react';
import type { WordLemma, Deck } from '../mockData';
import { DeckPickerModal } from '../components/DeckPickerModal';
import { GrammarInsightsView } from '../components/GrammarInsightsView';

interface SearchLookupScreenProps {
  words: WordLemma[];
  decks: Deck[];
  onAddCard: (wordForm: string, context: string, deckTitle: string, cardType: string) => void;
}

export const SearchLookupScreen: React.FC<SearchLookupScreenProps> = ({ words, decks, onAddCard }) => {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<WordLemma>(words[0]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'clusters' | 'grammar' | 'builder'>('clusters');

  // Selected Cluster for Card Review
  const [selectedClusterId, setSelectedClusterId] = useState<string>(selectedWord.clusters[0]?.id || '');
  const [selectedCardType, setSelectedCardType] = useState<'cloze' | 'basic' | 'phrase' | 'reverse'>('cloze');

  // Deck Picker Modal State
  const [isDeckPickerOpen, setIsDeckPickerOpen] = useState(false);

  const filteredWords = words.filter(w => 
    w.form.toLowerCase().includes(query.toLowerCase()) ||
    w.surfaceForms.some(sf => sf.toLowerCase().includes(query.toLowerCase())) ||
    w.clusters.some(c => c.translation.toLowerCase().includes(query.toLowerCase()) || c.context.toLowerCase().includes(query.toLowerCase()))
  );

  const activeCluster = selectedWord.clusters.find(c => c.id === selectedClusterId) || selectedWord.clusters[0];

  const handleOpenDeckPicker = () => {
    setIsDeckPickerOpen(true);
  };

  const handleConfirmDeckAdd = (deckId: string, deckTitle: string) => {
    onAddCard(selectedWord.form, activeCluster?.context || 'General', deckTitle, selectedCardType.toUpperCase());
  };

  return (
    <div className="page-container" style={{ padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Search Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '12px 18px'
        }}>
          <Search size={20} color="#818cf8" />
          <input
            type="text"
            placeholder="Search words, surface forms ('ging aus'), translations, or contexts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: '12px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Split Inspector View */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', minHeight: 0 }}>
        {/* Left List of Matches */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', paddingBottom: '8px' }}>
            Results ({filteredWords.length})
          </div>

          {filteredWords.map(word => {
            const isSelected = selectedWord.id === word.id;
            return (
              <div
                key={word.id}
                onClick={() => {
                  setSelectedWord(word);
                  setSelectedClusterId(word.clusters[0]?.id || '');
                }}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#a5b4fc' : '#f3f4f6' }}>
                    {word.form}
                  </span>
                  <span className="badge badge-indigo">{word.cefr}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {word.clusters[0]?.translation}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                  {word.clusters.length} semantic cluster{word.clusters.length > 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Word Detail Inspector */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>
                  {selectedWord.gender ? `${selectedWord.gender} ` : ''}{selectedWord.form}
                </h2>
                <button className="btn btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
                  <Volume2 size={20} color="#818cf8" />
                </button>
                <span className="badge badge-sky">{selectedWord.pos}</span>
                <span className="badge badge-emerald">{selectedWord.cefr}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                Frequency Rank: <strong style={{ color: '#d1d5db' }}>#{selectedWord.frequency}</strong> in modern German corpus
              </div>
            </div>

            {/* Target Deck Action */}
            <button 
              onClick={handleOpenDeckPicker}
              className="btn btn-primary"
              style={{ padding: '10px 18px' }}
            >
              <Plus size={16} />
              <span>Add to Deck...</span>
            </button>
          </div>

          {/* Morphological Surface Forms */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Inflected Surface Forms (Lemma Normalization)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedWord.surfaceForms.map(form => (
                <span 
                  key={form}
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {form}
                </span>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
            <button
              onClick={() => setActiveTab('clusters')}
              className={`btn ${activeTab === 'clusters' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <Layers2 size={15} />
              <span>Semantic Context Clusters ({selectedWord.clusters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('grammar')}
              className={`btn ${activeTab === 'grammar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <FileText size={15} />
              <span>Advanced Grammar Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <Sparkles size={15} color="#10b981" />
              <span>Card Generator & Cloze Selection</span>
            </button>
          </div>

          {/* Tab 1: Semantic Clusters & Cluster Selector */}
          {activeTab === 'clusters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Select a cluster below to configure context scoping for your review deck:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedWord.clusters.map((cluster) => {
                  const isSelected = cluster.id === (selectedClusterId || selectedWord.clusters[0]?.id);
                  return (
                    <div 
                      key={cluster.id}
                      onClick={() => setSelectedClusterId(cluster.id)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-amber">{cluster.context}</span>
                          {isSelected && <span className="badge badge-emerald">Selected for Review</span>}
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#818cf8' }}>{cluster.translation}</span>
                      </div>

                      <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '14px', fontStyle: 'italic' }}>
                        "{cluster.definition}"
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cluster.examples.map((ex, exIdx) => (
                          <div 
                            key={exIdx}
                            style={{
                              fontSize: '13px',
                              padding: '10px 14px',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '8px',
                              borderLeft: '3px solid #6366f1'
                            }}
                          >
                            <div style={{ color: '#f3f4f6', fontWeight: 600, marginBottom: '2px' }}>{ex.de}</div>
                            <div style={{ color: '#9ca3af', fontSize: '12px' }}>{ex.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Advanced Grammar Insights */}
          {activeTab === 'grammar' && (
            <GrammarInsightsView word={selectedWord} />
          )}

          {/* Tab 3: Card Builder & Cloze Selection */}
          {activeTab === 'builder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.15s ease-out' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>1. Select Target Cluster</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedWord.clusters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClusterId(c.id)}
                      className={`btn ${selectedClusterId === c.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      {c.context}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>2. Select Card Type</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'cloze', label: 'Cloze Deletion', desc: 'Fill-in the blank' },
                    { id: 'basic', label: 'Basic Front/Back', desc: 'Target word & translation' },
                    { id: 'phrase', label: 'Phrase Context', desc: 'Idiom or sentence' },
                    { id: 'reverse', label: 'Reverse Card', desc: 'English → German' }
                  ].map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setSelectedCardType(type.id as any)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: selectedCardType === type.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        border: selectedCardType === type.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{type.label}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{type.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', marginBottom: '6px' }}>
                  LIVE CARD PREVIEW ({selectedCardType.toUpperCase()})
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  {selectedCardType === 'cloze' 
                    ? `Wir gehen davon [...], dass das Ergebnis korrekt ist.` 
                    : selectedWord.form}
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  Context: {activeCluster?.context} → {activeCluster?.translation}
                </div>
              </div>

              <button onClick={handleOpenDeckPicker} className="btn btn-primary" style={{ padding: '12px' }}>
                <Plus size={16} />
                <span>Save Card to Deck...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Target Deck Picker Modal */}
      <DeckPickerModal
        isOpen={isDeckPickerOpen}
        onClose={() => setIsDeckPickerOpen(false)}
        decks={decks}
        wordForm={selectedWord.form}
        clusterContext={activeCluster?.context || 'General'}
        cardType={selectedCardType.toUpperCase()}
        onConfirmAdd={handleConfirmDeckAdd}
      />
    </div>
  );
};
