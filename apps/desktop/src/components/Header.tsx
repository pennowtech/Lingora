import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Command, ShieldCheck, Sparkles } from 'lucide-react';
import { useBreakpoint } from '../lib/useBreakpoint';

interface HeaderProps {
  onOpenQuickLookup: () => void;
  onOpenMiningModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickLookup, onOpenMiningModal }) => {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  const narrow = breakpoint === 'narrow';

  return (
    <header style={{
      minHeight: '64px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '10px',
      padding: '10px 32px'
    }}>
      {/* Global Search Bar Simulator - fluid width instead of a fixed 320px, so it shrinks with
          the window instead of forcing the header to overflow. */}
      <div
        onClick={onOpenQuickLookup}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '8px 14px',
          width: '100%',
          maxWidth: narrow ? '100%' : '320px',
          minWidth: '180px',
          flex: '1 1 220px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-active)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        <Search size={16} color="var(--text-secondary)" />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('Search word, lemma, or context...')}</span>
        {!narrow && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'var(--bg-surface-hover)',
            padding: '2px 6px',
            borderRadius: '4px',
            color: 'var(--text-secondary)'
          }}>
            <Command size={10} /> K
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={onOpenMiningModal}
          className="btn btn-secondary"
          style={{ fontSize: '13px', padding: '8px 14px' }}
        >
          <Sparkles size={15} color="var(--success)" />
          <span>{t('Mine Sentence')}</span>
        </button>

        <button
          onClick={onOpenQuickLookup}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '8px 14px' }}
        >
          <Search size={15} />
          <span>{t('Search & Lookup')}</span>
        </button>

        {!narrow && <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />}

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
          <ShieldCheck size={16} />
          <span>{t('Sync Active')}</span>
        </div>
      </div>
    </header>
  );
};
