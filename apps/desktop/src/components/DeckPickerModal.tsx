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
          backgroundColor: '#0c121e',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.25)',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(17, 24, 39, 0.8)'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Select Target Deck</h3>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              Adding card for <strong style={{ color: '#818cf8' }}>"{wordForm}"</strong> ({clusterContext})
            </span>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        {/* Deck List */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
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
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.06)',
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
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#fff' : '#e5e7eb' }}>
                      {deck.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {deck.totalCards} cards · {deck.dueToday} due today
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={14} color="#fff" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
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
