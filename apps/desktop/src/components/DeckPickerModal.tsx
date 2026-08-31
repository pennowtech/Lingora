import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Check, FolderPlus, ArrowLeft, Type } from 'lucide-react';
import type { Deck } from '../mockData';
import { DEFAULT_ENABLED_QUESTION_TYPES } from '@lingora/core';
import type { QuestionType } from '@lingora/types';
import { ReviewModesGrid, toggleQuestionType, getDeckQuestionTypes } from './ReviewModesGrid';

/** A word/whitespace tokenization of a sentence - whitespace tokens render as literal gaps,
 * word tokens are individually clickable in the cloze-edit step. Trailing punctuation stays
 * attached to its word so "Park." reconstructs correctly either way. */
function tokenizeSentence(sentence: string): string[] {
  return sentence.split(/(\s+)/).filter((t) => t.length > 0);
}

/** Best-guess starting blank - the token that best matches the headword, same "longest match
 * wins" idea as the auto-guess this replaces (services/desktopServices.tsx#addNewCard), just
 * picking a token index instead of running the regex substitution itself. Falls back to the
 * first real word token when nothing matches, never to a whitespace token. Returns a single
 * starting index - the learner can add more blanks from there. */
function guessBlankIndex(tokens: string[], wordForm: string): number {
  const lowerForm = wordForm.toLowerCase();
  let bestIndex = -1;
  let bestLength = 0;
  tokens.forEach((token, i) => {
    if (/^\s+$/.test(token)) return;
    const core = token.replace(/[.,!?;:"'()]+$/, '').replace(/^[.,!?;:"'()]+/, '');
    if (core.length === 0) return;
    if (bestIndex === -1) bestIndex = i; // first real word, as the ultimate fallback
    if ((lowerForm.includes(core.toLowerCase()) || core.toLowerCase().includes(lowerForm)) && core.length > bestLength) {
      bestIndex = i;
      bestLength = core.length;
    }
  });
  return bestIndex;
}

/** Splits a token into its clickable "core" and any trailing punctuation, so the punctuation
 * stays outside the blank/answer ("im [...]." not "im [....]"). */
function splitTrailingPunctuation(token: string): { core: string; trailing: string } {
  const match = token.match(/^(.*?)([.,!?;:"')]*)$/);
  return { core: match?.[1] ?? token, trailing: match?.[2] ?? '' };
}

interface DeckPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  wordForm: string;
  clusterContext: string;
  cardType: string;
  /** The selected (or first) example sentence for the active cluster, in the target language -
   * what the cloze-edit step blanks a word out of. Undefined when there's no example to draw
   * from yet, which simply skips the cloze-edit step entirely (same as a non-Cloze deck). */
  exampleSentence?: string;
  exampleTranslation?: string;
  onConfirmAdd: (
    deckId: string,
    deckTitle: string,
    isNew?: boolean,
    finalCardType?: string,
    questionTypes?: QuestionType[],
    clozeOverride?: { sentence: string; answer: string; translation: string },
  ) => void;
}

export const DeckPickerModal: React.FC<DeckPickerModalProps> = ({
  isOpen,
  onClose,
  decks,
  wordForm,
  clusterContext,
  cardType,
  exampleSentence,
  exampleTranslation,
  onConfirmAdd
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');
  // Three screens in one modal: the deck list (default), creating a brand-new deck, and - only
  // when the resulting deck supports Cloze and this card is one - a wizard step to edit which
  // word gets blanked before the card is actually saved.
  const [view, setView] = useState<'list' | 'create' | 'cloze'>('list');
  const [newDeckTitle, setNewDeckTitle] = useState('');
  // Which review formats this new deck practices - same five as apps/mobile's Mixed practice
  // (Settings -> Learning), just picked once per deck here instead of one global preference.
  // Starts on the same default apps/mobile ships with (plain Word -> Meaning only).
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([...DEFAULT_ENABLED_QUESTION_TYPES]);
  // Which finalize action the cloze-edit step's own "Add to Deck" button should run - set right
  // before switching into that view, read only from there.
  const [pendingConfirm, setPendingConfirm] = useState<'existing' | 'new' | null>(null);
  const [clozeTokens, setClozeTokens] = useState<string[]>([]);
  // More than one word can be blanked - a Set of token indices, in click order doesn't matter
  // since the sentence itself always reconstructs in original order.
  const [clozeBlankIndices, setClozeBlankIndices] = useState<Set<number>>(new Set());

  const isCloze = cardType.toUpperCase() === 'CLOZE' && !!exampleSentence;

  useEffect(() => {
    if (decks.length > 0) {
      setSelectedDeckId(prev => (decks.some(d => d.id === prev) ? prev : decks[0].id));
    } else {
      setSelectedDeckId('');
    }
  }, [decks]);

  if (!isOpen) return null;

  const openClozeEditor = (confirmTarget: 'existing' | 'new') => {
    const tokens = tokenizeSentence(exampleSentence!);
    setClozeTokens(tokens);
    setClozeBlankIndices(new Set([guessBlankIndex(tokens, wordForm)]));
    setPendingConfirm(confirmTarget);
    setView('cloze');
  };

  const toggleClozeBlank = (index: number) => {
    setClozeBlankIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        // At least one blank must stay picked - a cloze card with nothing hidden isn't one.
        if (next.size === 1) return next;
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectExistingDeck = (deck: Deck) => {
    setSelectedDeckId(deck.id);
    if (isCloze && getDeckQuestionTypes(deck).includes('cloze')) {
      openClozeEditor('existing');
    }
  };

  const handleConfirmExisting = () => {
    const targetDeck = decks.find(d => d.id === selectedDeckId) || decks[0];
    if (!targetDeck) return;
    onConfirmAdd(targetDeck.id, targetDeck.title, false, cardType);
    onClose();
  };

  const handleConfirmNew = () => {
    const trimmed = newDeckTitle.trim();
    if (!trimmed) {
      alert('Deck name cannot be empty.');
      return;
    }
    if (decks.some(d => d.title.toLowerCase() === trimmed.toLowerCase())) {
      alert('A deck with this name already exists.');
      return;
    }
    if (isCloze && selectedQuestionTypes.includes('cloze')) {
      openClozeEditor('new');
      return;
    }
    onConfirmAdd(`new-deck-${Date.now()}`, trimmed, true, cardType, selectedQuestionTypes);
    onClose();
  };

  const handleConfirmCloze = () => {
    if (clozeBlankIndices.size === 0) return;
    // Sentence order, not click order - "laufe" then "Park" reads naturally as "laufe / Park"
    // even if Park was clicked first (the .map below walks clozeTokens in original order).
    const answers: string[] = [];
    const sentence = clozeTokens
      .map((token, i) => {
        if (!clozeBlankIndices.has(i)) return token;
        const { core, trailing } = splitTrailingPunctuation(token);
        answers.push(core);
        return `[...]${trailing}`;
      })
      .join('');

    const clozeOverride = { sentence, answer: answers.join(' / '), translation: exampleTranslation || '' };

    if (pendingConfirm === 'new') {
      const trimmed = newDeckTitle.trim();
      onConfirmAdd(`new-deck-${Date.now()}`, trimmed, true, cardType, selectedQuestionTypes, clozeOverride);
    } else {
      const targetDeck = decks.find(d => d.id === selectedDeckId) || decks[0];
      if (!targetDeck) return;
      onConfirmAdd(targetDeck.id, targetDeck.title, false, cardType, undefined, clozeOverride);
    }
    onClose();
  };

  const handleToggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) => toggleQuestionType(prev, type));
  };

  const handleStartCreating = () => {
    setView('create');
    setNewDeckTitle('');
    setSelectedQuestionTypes([...DEFAULT_ENABLED_QUESTION_TYPES]);
  };

  const handleBack = () => {
    if (view === 'cloze') {
      setView(pendingConfirm === 'new' ? 'create' : 'list');
      setPendingConfirm(null);
    } else {
      setView('list');
    }
  };

  const headerTitle = view === 'create' ? 'Create New Deck' : view === 'cloze' ? 'Edit the Blank' : 'Select Target Deck';

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
            {view !== 'list' && (
              <button onClick={handleBack} className="btn btn-ghost" style={{ padding: '4px' }}>
                <ArrowLeft size={16} color="var(--text-secondary)" />
              </button>
            )}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {headerTitle}
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

        {view === 'cloze' ? (
          /* ── Edit the Blank View — a wizard step, not an inline addition to the list/create
              screens: same distinct-screen pattern as Create New Deck, reached automatically
              once a Cloze-capable deck is chosen (or created), not an extra click to open. ── */
          <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                backgroundColor: 'var(--accent-secondary)',
                border: '1px solid var(--accent-primary)40',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Type size={24} color="var(--accent-primary)" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="badge badge-indigo" style={{ fontSize: '11px' }}>
                This deck reviews Cloze (fill in the blanks)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Which word(s) should be hidden?
              </label>
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                  {clozeTokens.map((token, i) => {
                    if (/^\s+$/.test(token)) return <React.Fragment key={i}>{token}</React.Fragment>;
                    const isBlank = clozeBlankIndices.has(i);
                    return (
                      <span
                        key={i}
                        onClick={() => toggleClozeBlank(i)}
                        style={{
                          display: 'inline-block',
                          padding: isBlank ? '2px 8px' : '2px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: isBlank ? 800 : 400,
                          backgroundColor: isBlank ? 'var(--accent-primary)' : 'transparent',
                          color: isBlank ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                        }}
                      >
                        {token}
                      </span>
                    );
                  })}
                </div>
                {exampleTranslation && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>{exampleTranslation}</div>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Tap a word to hide it, tap it again to un-hide it - you can pick more than one.{' '}
                {clozeBlankIndices.size > 0 && (
                  <>
                    Hiding:{' '}
                    <strong>
                      {clozeTokens
                        .map((t, i) => (clozeBlankIndices.has(i) ? splitTrailingPunctuation(t).core : null))
                        .filter(Boolean)
                        .join(', ')}
                    </strong>
                    .
                  </>
                )}
              </span>
            </div>
          </div>
        ) : view === 'create' ? (
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
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmNew()}
                placeholder="e.g. German B2 Verbs, Travel Vocabulary..."
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'var(--font-primary)'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                The deck will be created and <strong>"{wordForm}"</strong> will be added immediately.
              </span>
            </div>

            {/* Review modes - which of the five formats (matching apps/mobile's Mixed practice)
                this deck reviews cards with. A 3x2 icon-card grid, same visual language as this
                app's existing card-type picker (Cloze/Basic/Phrase/Reverse), so it reads as a
                familiar pattern rather than a new one. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Review Modes
              </label>
              <ReviewModesGrid value={selectedQuestionTypes} onToggle={handleToggleQuestionType} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Only cards matching these types can be saved into this deck.
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
                  onClick={() => handleSelectExistingDeck(deck)}
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
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={view === 'list' ? onClose : handleBack} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              {view === 'list' ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={view === 'cloze' ? handleConfirmCloze : view === 'create' ? handleConfirmNew : handleConfirmExisting}
              disabled={view === 'create' && !newDeckTitle.trim()}
              className="btn btn-primary"
              style={{ fontSize: '13px' }}
            >
              <Plus size={15} />
              <span>{view === 'create' ? 'Create & Add' : 'Add to Deck'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
