import React, { useState } from 'react';
import { X, Layers, Plus, BookOpen, Check, FolderPlus, ArrowLeft } from 'lucide-react';
import type { Deck } from '../mockData';

interface DeckPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  wordForm: string;
  clusterContext: string;
  cardType: string;
  onConfirmAdd: (deckId: string, deckTitle: string, isNew?: boolean) => void;
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
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckTitleError, setNewDeckTitleError] = useState('');

  if (!isOpen) return null;

  const handleConfirmExisting = () => {
    const targetDeck = decks.find(d => d.id === selectedDeckId) || decks[0];
    if (!targetDeck) return;
    onConfirmAdd(targetDeck.id, targetDeck.title);
    onClose();
  };

  const handleConfirmNew = () => {
    const trimmed = newDeckTitle.trim();
    if (!trimmed) {
      setNewDeckTitleError('Deck name cannot be empty.');
      return;
    }
    if (decks.some(d => d.title.toLowerCase() === trimmed.toLowerCase())) {
      setNewDeckTitleError('A deck with this name already exists.');
      return;
    }
    onConfirmAdd(`new-deck-${Date.now()}`, trimmed, true);
    onClose();
  };

  const handleStartCreating = () => {
    setIsCreatingNew(true);
    setNewDeckTitle('');
    setNewDeckTitleError('');
  };

  const handleBackToList = () => {
    setIsCreatingNew(false);
    setNewDeckTitleError('');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isCreatingNew && (
              <button onClick={handleBackToList} className="btn btn-ghost" style={{ padding: '4px' }}>
                <ArrowLeft size={16} color="var(--text-secondary)" />
              </button>
            )}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isCreatingNew ? 'Create New Deck' : 'Select Target Deck'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Adding card for <strong style={{ color: 'var(--accent-primary)' }}>"{wordForm}"</strong> ({clusterContext})
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {isCreatingNew ? (
          /* ── Create New Deck View ── */
          <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                backgroundColor: 'var(--accent-secondary)',
                border: '1px solid var(--accent-primary)40',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FolderPlus size={24} color="var(--accent-primary)" />
              </div>
            </div>

            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Deck Name
              </label>
              <input
                autoFocus
                type="text"
                value={newDeckTitle}
                onChange={(e) => {
                  setNewDeckTitle(e.target.value);
                  setNewDeckTitleError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmNew()}
                placeholder="e.g. German B2 Verbs, Travel Vocabulary..."
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: newDeckTitleError ? '1px solid var(--danger)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'var(--font-primary)'
                }}
              />
              {newDeckTitleError && (
                <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{newDeckTitleError}</span>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                The deck will be created and <strong>"{wordForm}"</strong> will be added immediately.
              </span>
            </div>
          </div>
        ) : (
          /* ── Existing Decks List View ── */
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
            {/* Create new deck option at top */}
            <div
              onClick={handleStartCreating}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-secondary)',
                border: '1px dashed var(--accent-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                backgroundColor: 'var(--accent-primary)20',
                border: '1px solid var(--accent-primary)40',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FolderPlus size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>Create New Deck</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Create a new deck and add this card to it</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' }}>
              Existing Decks ({decks.length})
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
                      width: '36px', height: '36px', borderRadius: '8px',
                      backgroundColor: `${deck.color}20`,
                      border: `1px solid ${deck.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <BookOpen size={18} color={deck.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{deck.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {deck.totalCards} cards · {deck.dueToday} due today
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Check size={14} color="white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
            <button onClick={isCreatingNew ? handleBackToList : onClose} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              {isCreatingNew ? 'Back' : 'Cancel'}
            </button>
            <button
              onClick={isCreatingNew ? handleConfirmNew : handleConfirmExisting}
              disabled={isCreatingNew && !newDeckTitle.trim()}
              className="btn btn-primary"
              style={{ fontSize: '13px' }}
            >
              <Plus size={15} />
              <span>{isCreatingNew ? 'Create & Add' : 'Add to Deck'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


