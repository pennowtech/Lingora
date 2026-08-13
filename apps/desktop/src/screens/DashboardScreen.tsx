import React from 'react';
import { 
  Zap, 
  Flame, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  BookOpen, 
  Sparkles,
  Clock
} from 'lucide-react';
import type { Deck, MiningItem, WordLemma } from '../mockData';

interface DashboardScreenProps {
  decks: Deck[];
  miningQueue: MiningItem[];
  recentWords: WordLemma[];
  onStartReview: () => void;
  onSelectScreen: (screen: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  decks,
  miningQueue,
  recentWords,
  onStartReview,
  onSelectScreen
}) => {
  const totalDue = decks.reduce((acc, d) => acc + d.dueToday, 0);

  return (
    <div className="page-container">
      {/* Hero Welcome Banner */}
      <div style={{
        background: 'var(--accent-secondary)',
        border: '1px solid var(--accent-primary)',
        borderRadius: '16px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-glow)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-indigo">Guten Tag!</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>German (B2 Level)</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Ready for your daily review?
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            You have <strong style={{ color: 'var(--accent-primary)' }}>{totalDue} cards</strong> due for optimal retention according to the FSRS spaced repetition algorithm.
          </p>
        </div>

        <button 
          onClick={onStartReview}
          className="btn btn-primary"
          style={{ padding: '14px 28px', fontSize: '15px', borderRadius: '12px' }}
        >
          <Zap size={18} />
          <span>Start Review ({totalDue} Due)</span>
        </button>
      </div>

      {/* Grid of Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Daily Streak</span>
            <Flame size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)' }}>14 Days</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Top 5% consistency</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Retention Rate</span>
            <TrendingUp size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>91.8%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Target: 90% FSRS score</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Mastered Words</span>
            <Target size={18} color="var(--info)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--info)' }}>717 Words</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>+24 words this week</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Mined Sentences</span>
            <Sparkles size={18} color="var(--info)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--info)' }}>{miningQueue.length} Pending</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Ready for AI generation</div>
        </div>
      </div>

      {/* Main Split Section: Decks Overview & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Decks Progress */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Active Study Decks</h3>
            <button 
              onClick={() => onSelectScreen('decks')}
              className="btn btn-ghost"
              style={{ fontSize: '13px' }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {decks.map(deck => (
              <div 
                key={deck.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{deck.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{deck.totalCards} cards · {deck.retention}% retention</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className="badge badge-indigo">{deck.dueToday} due</span>
                  <button 
                    onClick={onStartReview}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Study
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Added Vocabulary */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Vocabulary</h3>
            <button onClick={() => onSelectScreen('search')} className="btn btn-ghost" style={{ fontSize: '13px' }}>
              Explore
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentWords.map(word => (
              <div 
                key={word.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-glass)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-primary)' }}>{word.form}</span>
                  <span className="badge badge-sky">{word.cefr}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {word.clusters[0]?.translation}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Context: <span style={{ color: 'var(--text-primary)' }}>{word.clusters[0]?.context}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
