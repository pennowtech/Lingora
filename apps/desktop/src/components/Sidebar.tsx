import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Layers, 
  Sparkles, 
  Flame, 
  BarChart3, 
  Settings, 
  Zap, 
  BookOpen 
} from 'lucide-react';

export type ScreenId = 'dashboard' | 'search' | 'review' | 'decks' | 'mining' | 'stats' | 'settings';

interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  dueCardsCount: number;
  miningCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  dueCardsCount,
  miningCount
}) => {
  const navItems = [
    { id: 'dashboard' as ScreenId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search' as ScreenId, label: 'Search & Lookup', icon: Search },
    { id: 'review' as ScreenId, label: 'Review Session', icon: Zap, badge: dueCardsCount > 0 ? dueCardsCount : null, badgeColor: 'bg-indigo-500' },
    { id: 'decks' as ScreenId, label: 'Decks', icon: Layers },
    { id: 'mining' as ScreenId, label: 'Sentence Mining', icon: Sparkles, badge: miningCount > 0 ? miningCount : null, badgeColor: 'bg-emerald-500' },
    { id: 'stats' as ScreenId, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as ScreenId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      height: '100%',
      backgroundColor: '#0c121e',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 10px 20px 10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
        }}>
          <BookOpen size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#f3f4f6' }}>Lingora</h1>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Desktop</span>
        </div>
      </div>

      {/* Daily Streak Card */}
      <div style={{
        margin: '18px 0',
        padding: '12px 14px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Flame size={22} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))' }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>14 Day Streak</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>18 cards due today</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                color: isActive ? '#f3f4f6' : '#9ca3af',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color={isActive ? '#818cf8' : '#6b7280'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: item.id === 'review' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                  color: item.id === 'review' ? '#a5b4fc' : '#6ee7b7'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{
        paddingTop: '14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <span>FSRS v4.5</span>
        <span className="badge badge-emerald">FTS5 Ready</span>
      </div>
    </aside>
  );
};
