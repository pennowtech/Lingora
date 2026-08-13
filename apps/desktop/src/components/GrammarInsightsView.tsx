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
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Grammar Classification
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
            {word.gender ? `${word.gender} ` : ''}{word.form}
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
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
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            Grammatical Cases
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
            {grammar.cases || 'Nominativ / Akkusativ'}
          </div>
        </div>

        <div style={{
          padding: '14px 16px',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            Preposition Collocation
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#a5b4fc' }}>
            {grammar.preposition || 'N/A'}
          </div>
        </div>
      </div>

      {/* Verb Conjugation Table (If Verb) */}
      {grammar.conjugation && (
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
            Verb Conjugation Patterns
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Präsens</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {grammar.conjugation.praesens}
              </div>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Präteritum</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {grammar.conjugation.praeteritum}
              </div>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Perfekt</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
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
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="#f59e0b" />
          <span>{grammar.prefixType}</span>
        </div>
      )}

      {/* AI CEFR Grammar Notes */}
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '13px', fontWeight: 700 }}>AI Grammar & Usage Breakdown</span>
        </div>
        <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.5' }}>
          {grammar.cefrNotes}
        </p>
      </div>
    </div>
  );
};
