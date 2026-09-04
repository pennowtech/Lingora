import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Calendar, Target, Flame, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  getDifficultWords,
  getRetentionRate,
  getReviewCountsByDay,
  getReviewedDayIndexes,
  getReviewForecast,
  getTotalCardCount,
  getVocabularyGrowth,
  type DatabaseAdapter,
  type DifficultWord,
  type ReviewForecastDay,
  type WeeklyGrowth,
} from '@lingora/database';
import { buildHeatmap, streakFromDayIndexes } from '@lingora/core';
import type { LanguageCode } from '@lingora/types';
import { useDesktopServices } from '../services/desktopServices';
import { useBreakpoint } from '../lib/useBreakpoint';

const HEAT_COLORS = ['rgba(255, 255, 255, 0.05)', 'rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.5)', 'rgba(99, 102, 241, 0.75)', 'var(--accent-primary)'];

interface StatsData {
  retention30d: number;
  streakDays: number;
  totalCards: number;
  newThisWeek: number;
  heatmap: number[][];
  growth: WeeklyGrowth[];
  difficultWords: DifficultWord[];
  forecast: ReviewForecastDay[];
}

async function loadStats(db: DatabaseAdapter, targetLanguage?: LanguageCode, nativeLanguage?: LanguageCode): Promise<StatsData> {
  const [retention30d, totalCards, days, reviewCounts, growth, difficultWords, forecast] = await Promise.all([
    getRetentionRate(db, 30, targetLanguage, nativeLanguage),
    getTotalCardCount(db, targetLanguage, nativeLanguage),
    getReviewedDayIndexes(db, 366, targetLanguage, nativeLanguage),
    getReviewCountsByDay(db, 35, targetLanguage, nativeLanguage),
    getVocabularyGrowth(db, 7, targetLanguage, nativeLanguage),
    getDifficultWords(db, 10, targetLanguage, nativeLanguage),
    getReviewForecast(db, 7, targetLanguage, nativeLanguage),
  ]);
  return {
    retention30d,
    totalCards,
    streakDays: streakFromDayIndexes(days),
    newThisWeek: growth[growth.length - 1]?.count ?? 0,
    heatmap: buildHeatmap(reviewCounts),
    growth,
    difficultWords,
    forecast,
  };
}

interface StatsScreenProps {
  onSelectScreen?: (screen: any) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onSelectScreen }) => {
  const { t, i18n } = useTranslation();
  const breakpoint = useBreakpoint();
  const narrow = breakpoint === 'narrow';
  const { db, targetLanguage, nativeLanguage } = useDesktopServices();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadStats(db, targetLanguage, nativeLanguage)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.error('[StatsScreen] Failed to load stats:', err);
        if (!cancelled) setError(err?.message || String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db, targetLanguage, nativeLanguage]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{t('Loading statistics...')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <span style={{ color: 'var(--danger)' }}>{t('Failed to load statistics: {{error}}', { error })}</span>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalCards === 0) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <BarChart3 size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{t('No stats yet')}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('Add and review some words to see your learning statistics here.')}</div>
        </div>
      </div>
    );
  }

  const maxGrowth = Math.max(1, ...stats.growth.map((w) => w.count));
  const maxForecast = Math.max(1, ...stats.forecast.map((f) => f.dueCount));
  const keyStatsColumns = narrow ? 'repeat(auto-fit, minmax(160px, 1fr))' : 'repeat(4, 1fr)';
  const splitColumns = narrow ? '1fr' : '1fr 1fr';

  return (
    <div className="page-container">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{t('Learning Statistics')}</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('Retention, review activity, vocabulary growth, and the words giving you the most trouble.')}</p>
      </div>

      {/* Grid of Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: keyStatsColumns, gap: '16px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--success)' }}>
            <TrendingUp size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{t('Retention (30d)')}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success)' }}>{Math.round(stats.retention30d * 100)}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('Remembered on first review')}</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--warning)' }}>
            <Flame size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{t('Day Streak')}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--warning)' }}>{stats.streakDays}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('Consecutive study days')}</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--accent-primary)' }}>
            <Target size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{t('Total Cards')}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalCards}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('Saved across all decks')}</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--info)' }}>
            <BarChart3 size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{t('New This Week')}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--info)' }}>+{stats.newThisWeek}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('Words added in the last 7 days')}</div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Review Activity')}</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('Last 5 Weeks')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {stats.heatmap.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', gap: '5px' }}>
              {row.map((intensity, colIndex) => (
                <div
                  key={colIndex}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '3px',
                    backgroundColor: HEAT_COLORS[intensity] ?? HEAT_COLORS[0],
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px' }}>
          <span>{t('Less')}</span>
          {HEAT_COLORS.map((c) => (
            <div key={c} style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: c }} />
          ))}
          <span>{t('More')}</span>
        </div>
      </div>

      {/* 7-Day Review Forecast + Vocabulary Growth, side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: splitColumns, gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{t('Upcoming Review Forecast')}</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px' }}>
            {stats.forecast.map((day, i) => (
              <div key={day.dateMs} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{day.dueCount}</span>
                <div style={{ width: '18px', borderRadius: '4px', backgroundColor: 'var(--accent-primary)', height: Math.max(8, (day.dueCount / maxForecast) * 80) }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {i === 0 ? t('Today') : new Date(day.dateMs).toLocaleDateString(i18n.language, { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>{t('Projected due cards for the next 7 days')}</p>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{t('Vocabulary Growth')}</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px' }}>
            {stats.growth.map((week, i) => (
              <div key={week.weekStart} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '18px', borderRadius: '4px', backgroundColor: 'var(--info)', height: Math.max(8, (week.count / maxGrowth) * 96) }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>W{i + 1}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>{t('New words per week')}</p>
        </div>
      </div>

      {/* Difficult Words / Leeches */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Difficult Words')}</h3>
          </div>
          {onSelectScreen && (
            <button onClick={() => onSelectScreen('search')} className="btn btn-ghost" style={{ fontSize: '13px' }}>
              {t('Practice')} <ArrowRight size={14} />
            </button>
          )}
        </div>

        {stats.difficultWords.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>{t('No lapses yet - nothing difficult to show.')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.difficultWords.map((word, i) => (
              <div
                key={word.form}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 4px',
                  borderTop: i > 0 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{word.form}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--danger)',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  {t('{{count}} lapses', { count: word.lapses })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
