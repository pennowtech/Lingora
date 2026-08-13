import React from 'react';
import { BookOpen, Sparkles, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';
import type { WordLemma } from '../mockData';

interface GrammarInsightsViewProps {
  word: WordLemma;
}

export const GrammarInsightsView: React.FC<GrammarInsightsViewProps> = ({ word }) => {
  const { grammar } = word;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.15s ease-out' }}>
      {/* Overview Badge Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'var(--accent-secondary)',
        border: '1px solid var(--accent-primary)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Grammar Classification
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {word.gender ? `${word.gender} ` : ''}{word.form}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {grammar.partOfSpeech}
          </div>
        </div>

        <span className="badge badge-emerald" style={{ fontSize: '13px', padding: '6px 12px' }}>
          CEFR {word.cefr} Level
        </span>
      </div>

      {/* Case Requirements & Prepositions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{
          padding: '14px 16px',
          backgroundColor: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            Grammatical Cases
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--info)' }}>
            {grammar.cases || 'Nominativ / Akkusativ'}
          </div>
        </div>

        <div style={{
          padding: '14px 16px',
          backgroundColor: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            Preposition Collocation
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {grammar.preposition || 'N/A'}
          </div>
        </div>
      </div>

      {/* Verb Conjugation Table (If Verb) */}
      {grammar.conjugation && (
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
            Verb Conjugation Patterns
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Präsens</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {grammar.conjugation.praesens}
              </div>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Präteritum</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {grammar.conjugation.praeteritum}
              </div>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Perfekt</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {grammar.conjugation.perfekt}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prefix Type */}
      {grammar.prefixType && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--warning-bg)',
          border: '1px solid var(--warning)',
          borderRadius: '10px',
          fontSize: '13px',
          color: 'var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="var(--warning)" />
          <span>{grammar.prefixType}</span>
        </div>
      )}

      {/* AI CEFR Grammar Notes */}
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--success)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--success)' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '13px', fontWeight: 700 }}>AI Grammar & Usage Breakdown</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {grammar.cefrNotes}
        </p>
      </div>
    </div>
  );
};
