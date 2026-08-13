import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, RotateCcw, Sparkles, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import type { CardReview } from '../mockData';

interface ReviewScreenProps {
  cards: CardReview[];
  onFinishReview: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ cards, onFinishReview }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNextCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setIsFlipped(false);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  // Keyboard Navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleNextCard('again');
        if (e.key === '2') handleNextCard('hard');
        if (e.key === '3') handleNextCard('good');
        if (e.key === '4') handleNextCard('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, completed, currentIndex]);

  if (completed) {
    return (
      <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={36} color="var(--success)" />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Review Session Completed!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Great job! You reviewed {cards.length} cards with FSRS scheduling updated.
          </p>

          <button onClick={onFinishReview} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 40px 0' }}>
      {/* Top Header Progress Bar */}
      <div style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>FSRS Card Review</span>
          <span>Card {currentIndex + 1} of {cards.length}</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${((currentIndex + 1) / cards.length) * 100}%`, 
              backgroundColor: 'var(--accent-primary)',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      </div>

      {/* Main Flashcard Container */}
      <div 
        onClick={() => setIsFlipped(prev => !prev)}
        className="glass-card interactive"
        style={{
          width: '100%',
          maxWidth: '720px',
          height: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px',
          position: 'relative',
          border: isFlipped ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-color)',
          boxShadow: isFlipped ? '0 0 30px rgba(99, 102, 241, 0.25)' : 'var(--shadow-md)'
        }}
      >
        <div style={{ position: 'absolute', top: '20px', left: '24px', display: 'flex', gap: '8px' }}>
          <span className="badge badge-sky">{currentCard.pos}</span>
          <span className="badge badge-indigo">{currentCard.cefr}</span>
          <span className="badge badge-amber">{currentCard.context}</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="btn btn-ghost"
          style={{ position: 'absolute', top: '20px', right: '24px', borderRadius: '50%', padding: '8px' }}
        >
          <Volume2 size={20} color="var(--accent-primary)" />
        </button>

        {/* Card Front Content */}
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.4' }}>
          {currentCard.front}
        </div>

        {/* Card Back Content (Revealed on Click or Space) */}
        {isFlipped ? (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '16px' }}>
              Target: {currentCard.back}
            </div>

            <div style={{
              backgroundColor: 'var(--bg-glass)',
              padding: '14px 20px',
              borderRadius: '10px',
              borderLeft: '4px solid #10b981',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{currentCard.exampleDe}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{currentCard.exampleEn}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '24px' }}>
            <Key size={14} /> Press <strong style={{ color: 'var(--text-secondary)' }}>Space</strong> or click card to flip answer
          </div>
        )}
      </div>

      {/* FSRS Rating Buttons */}
      <div style={{ width: '100%', maxWidth: '720px' }}>
        {isFlipped ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', animation: 'fadeIn 0.15s ease-out' }}>
            <button 
              onClick={() => handleNextCard('again')}
              className="btn"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px' }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>Again [1]</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>&lt;10 mins</div>
              </div>
            </button>

            <button 
              onClick={() => handleNextCard('hard')}
              className="btn"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '14px' }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>Hard [2]</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>1.2 days</div>
              </div>
            </button>

            <button 
              onClick={() => handleNextCard('good')}
              className="btn"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', border: '1px solid var(--accent-secondary)', padding: '14px' }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>Good [3]</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>3.5 days</div>
              </div>
            </button>

            <button 
              onClick={() => handleNextCard('easy')}
              className="btn"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px' }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>Easy [4]</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>7.0 days</div>
              </div>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsFlipped(true)}
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            Show Answer (Space)
          </button>
        )}
      </div>
    </div>
  );
};
