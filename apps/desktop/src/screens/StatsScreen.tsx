import React from 'react';
import { BarChart3, TrendingUp, Calendar, Target, Award, Brain } from 'lucide-react';

export const StatsScreen: React.FC = () => {
  // Generate dummy activity heatmap grid (7 rows x 20 cols)
  const heatmapCells = Array.from({ length: 140 }, (_, i) => {
    const value = Math.floor(Math.random() * 5);
    return value;
  });

  const getHeatmapColor = (val: number) => {
    if (val === 0) return 'rgba(255, 255, 255, 0.05)';
    if (val === 1) return 'rgba(99, 102, 241, 0.25)';
    if (val === 2) return 'rgba(99, 102, 241, 0.5)';
    if (val === 3) return 'rgba(99, 102, 241, 0.75)';
    return '#6366f1';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>Learning Analytics & FSRS Memory Score</h2>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>Detailed metrics on memory retention, review consistency, and vocabulary growth.</p>
      </div>

      {/* Grid of Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#818cf8' }}>
            <Brain size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>FSRS Stability Index</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>18.4 Days</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Average memory half-life score</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#10b981' }}>
            <TrendingUp size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>True Retention</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981' }}>92.4%</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Passed vs total reviews</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#f59e0b' }}>
            <Target size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Total Reviews</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fbbf24' }}>1,842</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Cards reviewed all time</div>
        </div>
      </div>

      {/* Heatmap Activity */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Review Consistency Heatmap</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Last 20 Weeks</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateRows: 'repeat(7, 14px)',
          gridAutoFlow: 'column',
          gridAutoColumns: '14px',
          gap: '5px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {heatmapCells.map((val, idx) => (
            <div
              key={idx}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                backgroundColor: getHeatmapColor(val),
                transition: 'transform 0.1s ease'
              }}
              title={`Level ${val} review activity`}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(v => (
            <div key={v} style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getHeatmapColor(v) }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* CEFR Mastery Breakdown */}
      <div className="glass-card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          CEFR Level Vocabulary Distribution
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { level: 'A1 / A2 Beginner', count: 210, total: 300, color: '#10b981' },
            { level: 'B1 Intermediate', count: 340, total: 400, color: '#0ea5e9' },
            { level: 'B2 Upper Intermediate', count: 180, total: 300, color: '#6366f1' },
            { level: 'C1 Advanced', count: 45, total: 150, color: '#8b5cf6' }
          ].map(item => (
            <div key={item.level} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.level}</span>
                <span style={{ color: '#9ca3af' }}>{item.count} / {item.total} mastered</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${(item.count / item.total) * 100}%`, height: '100%', backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
