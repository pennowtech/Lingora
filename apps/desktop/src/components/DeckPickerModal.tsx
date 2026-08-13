import React, { useState } from 'react';
import { X, Layers, Plus, BookOpen, Check, Sparkles } from 'lucide-react';
import type { Deck } from '../mockData';

interface DeckPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  wordForm: string;
  clusterContext: string;
  cardType: string;
  onConfirmAdd: (deckId: string, deckTitle: string) => void;
}

export const DeckPickerModal: React.FC<DeckPickerModalProps> = ({
  isOpen,
  onClose,
  decks,
  wordForm,
  clusterContext,
  cardType,
  onConfirmAdd
}) => {
  if (!isOpen) return null;

  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');

  const handleConfirm = () => {
    const targetDeck = decks.find(d => d.id === selectedDeckId) || decks[0];
    onConfirmAdd(targetDeck.id, targetDeck.title);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-active)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-glow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Select Target Deck</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Adding card for <strong style={{ color: 'var(--accent-primary)' }}>"{wordForm}"</strong> ({clusterContext})
            </span>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Deck List */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Available Decks ({decks.length})
          </div>

          {decks.map((deck) => {
            const isSelected = deck.id === selectedDeckId;
            return (
              <div
                key={deck.id}
                onClick={() => setSelectedDeckId(deck.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: `${deck.color}20`,
                    border: `1px solid ${deck.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={18} color={deck.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)' }}>
                      {deck.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {deck.totalCards} cards · {deck.dueToday} due today
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={14} color="var(--accent-primary)" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Card Type: <span className="badge badge-sky">{cardType}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              Cancel
            </button>
            <button onClick={handleConfirm} className="btn btn-primary" style={{ fontSize: '13px' }}>
              <Plus size={15} />
              <span>Add to Deck</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
