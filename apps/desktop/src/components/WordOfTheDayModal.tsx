import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, X, Sparkles } from 'lucide-react';
import type { LanguageCode } from '@lingora/types';
import type { WordOfTheDay } from '../lib/wordOfTheDay';
import { speak } from '../services/desktopSpeech';
import { InlineMarkdown } from './InlineMarkdown';

/**
 * Desktop's counterpart to apps/mobile's Home screen "Word of the Day" popup (app/(tabs)/index.tsx
 * wotdDialog) - same fields (headword + speaker, explanation, optional example-in-context) and
 * the same single action, "Explore Full Details", which here jumps to Search & Lookup with the
 * word searched immediately instead of navigating to a dedicated word/[form] route (desktop has
 * none - Search & Lookup's split view already serves that role).
 */
export const WordOfTheDayModal: React.FC<{
  word: WordOfTheDay;
  targetLanguage: LanguageCode;
  onClose: () => void;
  onExplore: (word: string) => void;
}> = ({ word, targetLanguage, onClose, onExplore }) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '28px 30px',
          width: '440px',
          maxWidth: '92vw',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>{word.word}</h2>
              <button
                onClick={() => speak(word.word, targetLanguage)}
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: '50%' }}
                aria-label={t('Listen to pronunciation')}
              >
                <Volume2 size={18} color="var(--accent-primary)" />
              </button>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {t('Daily Discovery')}
            </span>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px', borderRadius: '50%' }} aria-label={t('Close')}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            {t('Meaning & Explanation')}
          </div>
          <InlineMarkdown
            text={word.explanation}
            style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}
            boldStyle={{ fontWeight: 800 }}
            italicStyle={{ fontStyle: 'italic' }}
            codeStyle={{ fontFamily: 'var(--font-mono)', backgroundColor: 'var(--bg-card)', padding: '1px 5px', borderRadius: '4px', color: 'var(--accent-primary)' }}
          />
        </div>

        {word.exampleSentence ? (
          <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
              {t('Example in Context')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>&bdquo;{word.exampleSentence}&rdquo;</div>
            {word.exampleTranslation ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>&quot;{word.exampleTranslation}&quot;</div>
            ) : null}
          </div>
        ) : null}

        <button
          onClick={() => {
            onClose();
            onExplore(word.word);
          }}
          className="btn btn-primary"
          style={{ fontSize: '14px', padding: '12px 18px', justifyContent: 'center' }}
        >
          <Sparkles size={16} />
          <span>{t('Explore Full Details ↗')}</span>
        </button>
      </div>
    </div>
  );
};
