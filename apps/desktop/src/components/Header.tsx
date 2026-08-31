import React from 'react';
import { Search, Command, Volume2, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenQuickLookup: () => void;
  onOpenMiningModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickLookup, onOpenMiningModal }) => {
  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px'
    }}>
      {/* Global Search Bar Simulator */}
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
          width: '320px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-active)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        <Search size={16} color="var(--text-secondary)" />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', flex: 1 }}>Search word, lemma, or context...</span>
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
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button 
          onClick={onOpenMiningModal}
          className="btn btn-secondary"
          style={{ fontSize: '13px', padding: '8px 14px' }}
        >
          <Sparkles size={15} color="var(--success)" />
          <span>Mine Sentence</span>
        </button>

        <button
          onClick={onOpenQuickLookup}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '8px 14px' }}
        >
          <Search size={15} />
          <span>Search & Lookup</span>
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
          <ShieldCheck size={16} />
          <span>Sync Active</span>
        </div>
      </div>
    </header>
  );
};
