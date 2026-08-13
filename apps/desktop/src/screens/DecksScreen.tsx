import React, { useState } from 'react';
import { Layers, Plus, BookOpen, MoreVertical, Zap, CheckCircle2, Search } from 'lucide-react';
import type { Deck } from '../mockData';

interface DecksScreenProps {
  decks: Deck[];
  onStartReview: () => void;
}

export const DecksScreen: React.FC<DecksScreenProps> = ({ decks, onStartReview }) => {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Your Vocabulary Decks</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage and organize your custom decks and mined vocabulary</p>
        </div>

        <button className="btn btn-primary">
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
                    onStartReview();
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
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-glass)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Guten Tag → Hello / Good Day</span>
              <span className="badge badge-sky">B1 · Basic Card</span>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-glass)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Wir gehen davon aus, dass... → We assume that...</span>
              <span className="badge badge-sky">B2 · Cloze Card</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
