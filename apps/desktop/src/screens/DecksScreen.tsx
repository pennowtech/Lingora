import React, { useState, useEffect } from 'react';
import { Layers, Plus, BookOpen, MoreVertical, Zap } from 'lucide-react';
import type { Deck } from '../mockData';
import { useDesktopServices } from '../services/desktopServices';

interface DecksScreenProps {
  decks: Deck[];
  onStartReview: (deckId: string, cardId?: string) => void;
}

export const DecksScreen: React.FC<DecksScreenProps> = ({ decks, onStartReview }) => {
  const { db, addNewDeck } = useDesktopServices();
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Create Deck Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckType, setNewDeckType] = useState('BASIC');

  // Fetch cards inside the selected deck dynamically
  useEffect(() => {
    const fetchDeckCards = async () => {
      if (!db || !selectedDeck) {
        setDeckCards([]);
        return;
      }
      setLoadingCards(true);
      try {
        const rows = await db.query<any>(
          `SELECT c.id, c.type, l.form AS word, l.part_of_speech AS pos,
                  COALESCE(m.cefr_level, (SELECT cefr_level FROM meanings WHERE card_id = c.id LIMIT 1), 'B2') AS cefr,
                  COALESCE(m.explanation, (SELECT explanation FROM meanings WHERE card_id = c.id LIMIT 1), 'General') AS context,
                  l.form AS front,
                  COALESCE(m.translation, (SELECT translation FROM meanings WHERE card_id = c.id LIMIT 1), 'Translation') AS back,
                  cz.sentence AS clozeSentence,
                  cz.translation AS clozeTranslation,
                  cz.cefr_level AS clozeCefr
           FROM cards c
           JOIN lemmas l ON l.id = c.lemma_id
           JOIN deck_cards dc ON dc.card_id = c.id
           LEFT JOIN meanings m ON m.id = c.primary_meaning_id
           LEFT JOIN cloze_cards cz ON cz.card_id = c.id
           WHERE dc.deck_id = ?`,
          [selectedDeck.id]
        );
        const mapped = (rows || []).map((row: any) => {
          if (row.type === 'cloze' && row.clozeSentence) {
            return {
              id: row.id,
              display: `${row.clozeSentence} (${row.word}) → ${row.clozeTranslation || ''}`,
              badge: `${row.clozeCefr || row.cefr} · Cloze`
            };
          } else {
            return {
              id: row.id,
              display: `${row.word} → ${row.back}`,
              badge: `${row.cefr} · Basic`
            };
          }
        });
        setDeckCards(mapped);
      } catch (err) {
        console.error('Error fetching deck cards:', err);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchDeckCards();
  }, [db, selectedDeck]);

  const handleCreateDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeckTitle.trim();
    if (!trimmed) {
      alert('Deck name cannot be empty.');
      return;
    }
    if (decks.some(d => d.title.toLowerCase() === trimmed.toLowerCase())) {
      alert('A deck with this name already exists.');
      return;
    }
    try {
      await addNewDeck(trimmed, newDeckType);
      setIsCreateModalOpen(false);
      setNewDeckTitle('');
      setNewDeckType('BASIC');
    } catch (err: any) {
      alert('Error creating deck: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Decks & SRS Schedule</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Manage your custom study decks and review due vocabulary</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Create New Deck</span>
        </button>
      </div>

      {/* Grid of Decks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {decks.map((deck) => (
          <div 
            key={deck.id}
            onClick={() => setSelectedDeck(deck)}
            className="glass-card interactive"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '220px',
              border: selectedDeck?.id === deck.id ? `1px solid ${deck.color}` : '1px solid var(--bg-surface-hover)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: `${deck.color}20`,
                  border: `1px solid ${deck.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={20} color={deck.color} />
                </div>
                <button className="btn btn-ghost" style={{ padding: '4px' }}>
                  <MoreVertical size={16} color="var(--text-secondary)" />
                </button>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{deck.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineClamp: 2 }}>{deck.description}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bg-surface-hover)', paddingTop: '14px' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{deck.totalCards}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>cards</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-indigo">{deck.dueToday} due</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartReview(deck.id);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  <Zap size={13} />
                  <span>Review</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Deck Card List Drawer */}
      {selectedDeck && (
        <div className="glass-card" style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Deck Inspector: <span style={{ color: 'var(--accent-primary)' }}>{selectedDeck.title}</span>
            </h3>
            <span className="badge badge-emerald">{selectedDeck.retention}% Retention Score</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingCards ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading cards...</div>
            ) : deckCards.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No cards in this deck. Add some via Search!</div>
            ) : (
              deckCards.map((card) => (
                <div 
                  key={card.id}
                  onClick={() => onStartReview(selectedDeck.id, card.id)}
                  className="interactive"
                  style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--bg-glass)', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{card.display}</span>
                  <span className="badge badge-sky">{card.badge}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create New Deck Modal */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '400px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Create New Study Deck</h3>
            <form onSubmit={handleCreateDeckSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>DECK TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. German Verbs"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>DECK TYPE</label>
                <select
                  value={newDeckType}
                  onChange={(e) => setNewDeckType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="BASIC">Basic Card Deck</option>
                  <option value="CLOZE">Cloze Card Deck</option>
                  <option value="PHRASE">Phrase Card Deck</option>
                </select>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Only cards matching this type can be saved into this deck.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  Create Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
