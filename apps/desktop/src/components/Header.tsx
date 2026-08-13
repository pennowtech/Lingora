import React from 'react';
import { Search, Command, Plus, Volume2, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenQuickLookup: () => void;
  onOpenMiningModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickLookup, onOpenMiningModal }) => {
  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      backgroundColor: 'rgba(9, 13, 22, 0.7)',
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
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '8px 14px',
          width: '320px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
      >
        <Search size={16} color="#9ca3af" />
        <span style={{ fontSize: '13px', color: '#6b7280', flex: 1 }}>Search word, lemma, or context...</span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          padding: '2px 6px',
          borderRadius: '4px',
          color: '#9ca3af'
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
          <Sparkles size={15} color="#10b981" />
          <span>Mine Sentence</span>
        </button>

        <button 
          onClick={onOpenQuickLookup}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '8px 14px' }}
        >
          <Plus size={15} />
          <span>Quick Lookup</span>
        </button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
          <ShieldCheck size={16} />
          <span>Sync Active</span>
        </div>
      </div>
    </header>
  );
};
