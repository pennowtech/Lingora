import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Flame,
  Target,
  ArrowRight,
  BookOpen,
  Sparkles,
  Search,
  Download,
  Check,
  BarChart3,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { CardListItem, DayReviewCount, DifficultWord } from '@lingora/database';
import type { LanguageCode } from '@lingora/types';
import type { SentenceMineEntry } from '@lingora/types';
import type { Deck } from '../mockData';
import { useDesktopServices } from '../services/desktopServices';
import { useBreakpoint } from '../lib/useBreakpoint';
import type { WordOfTheDay } from '../lib/wordOfTheDay';
import { WordOfTheDayModal } from '../components/WordOfTheDayModal';

interface DashboardScreenProps {
  decks: Deck[];
  miningQueue: SentenceMineEntry[];
  recentWords: CardListItem[];
  retention30d: number;
  streakDays: number;
  dailyActivity: DayReviewCount[];
  difficultWords: DifficultWord[];
  wordOfTheDay: WordOfTheDay | null;
  wordOfTheDayLoading: boolean;
  onStartReview: () => void;
  onSelectScreen: (screen: any) => void;
  /** Jumps to Settings' Learning tab - the language-pair badge's tap target, mirroring
   * apps/mobile's floating badge (tap -> /settings/learning). */
  onOpenLanguageSettings: () => void;
  /** Jumps to Settings' AI Providers tab - the Word of the Day offline-mode card's tap target. */
  onNavigateToAiProviderSettings: () => void;
  /** Word of the Day's "Explore Full Details" action - see App.tsx's navigateToWordSearch. */
  onExploreWord: (word: string) => void;
}

/** Flag + short code per language, for the language-pair badge - same set/flags as
 * SettingsScreen.tsx's own VOCAB_LANGUAGES, duplicated locally rather than shared (that array
 * isn't exported, and this screen only needs the flag/code, not the full label). */
const LANGUAGE_BADGE_META: Record<string, { flag: string; code: string }> = {
  en: { flag: '🇬🇧', code: 'EN' },
  de: { flag: '🇩🇪', code: 'DE' },
  es: { flag: '🇪🇸', code: 'ES' },
  fr: { flag: '🇫🇷', code: 'FR' },
  ja: { flag: '🇯🇵', code: 'JA' },
  vi: { flag: '🇻🇳', code: 'VI' },
  hi: { flag: '🇮🇳', code: 'HI' },
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  decks,
  miningQueue,
  recentWords,
  retention30d,
  streakDays,
  dailyActivity,
  difficultWords,
  wordOfTheDay,
  wordOfTheDayLoading,
  onStartReview,
  onSelectScreen,
  onOpenLanguageSettings,
  onNavigateToAiProviderSettings,
  onExploreWord
}) => {
  const { t, i18n } = useTranslation();
  const { nativeLanguage, targetLanguage } = useDesktopServices();
  const breakpoint = useBreakpoint();
  const narrow = breakpoint === 'narrow';
  const [wotdModalOpen, setWotdModalOpen] = useState(false);
  const totalDue = decks.reduce((acc, d) => acc + d.dueToday, 0);
  const totalCards = decks.reduce((acc, d) => acc + d.totalCards, 0);
  const isNewUser = totalCards === 0;
  const maxDailyCount = Math.max(1, ...dailyActivity.map((d) => d.count));
  const nativeMeta = LANGUAGE_BADGE_META[nativeLanguage as LanguageCode] ?? { flag: '🏳️', code: (nativeLanguage as string).toUpperCase() };
  const targetMeta = LANGUAGE_BADGE_META[targetLanguage as LanguageCode] ?? { flag: '🏳️', code: (targetLanguage as string).toUpperCase() };

  function timeAwareGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return t('Good morning!');
    if (hour < 18) return t('Good afternoon!');
    return t('Good evening!');
  }

  // Matches apps/mobile Home's three contextual subtitles exactly - see
  // docs/help/screens/01-home-dashboard.md's "Time-Aware Greeting & Study Streak" section.
  const subtitle = isNewUser
    ? t("Let's find your first word.")
    : totalDue > 0
      ? t('Nice to see you back.')
      : t('All caught up - nothing due right now.');

  // Two-column splits (deck list/recent words, chart/leeches) collapse to one column below the
  // narrow breakpoint - a real column-count change (not just resizing), so this needs the JS
  // breakpoint hook rather than a pure-CSS fix, same reasoning as Sidebar's collapse.
  const splitColumns = narrow ? '1fr' : '1.6fr 1fr';
  const metricsColumns = narrow ? '1fr' : 'repeat(2, 1fr)';
  const actionTileColumns = narrow ? '1fr' : '1fr 1fr';

  return (
    <div className="page-container">
      {/* Floating language-pair badge - tap to open Settings -> Learning */}
      <button
        onClick={onOpenLanguageSettings}
        className="badge badge-indigo"
        style={{
          alignSelf: 'flex-start',
          cursor: 'pointer',
          border: 'none',
          fontSize: '13px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
        }}
      >
        <span>{nativeMeta.flag} {nativeMeta.code}</span>
        <ArrowRight size={12} />
        <span>{targetMeta.flag} {targetMeta.code}</span>
      </button>

      {/* Hero: either the daily-load review card, or (0 cards) a getting-started guide */}
      {isNewUser ? (
        <div style={{
          background: 'var(--accent-secondary)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '16px',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{timeAwareGreeting()}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{subtitle}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[t('Select languages'), t('Search a word and add to deck'), t('Review your deck')].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  backgroundColor: i === 0 ? 'var(--success)' : 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {i === 0 ? <Check size={13} color="#fff" /> : <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{step}</span>
              </div>
            ))}
          </div>

          <button onClick={() => onSelectScreen('search')} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '10px' }}>
            <Search size={16} />
            <span>{t('Search your first word')}</span>
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--accent-secondary)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* 30-day retention ring - tap to open Statistics, same as apps/mobile's hero ring */}
            <button
              onClick={() => onSelectScreen('stats')}
              title={t('Open Statistics')}
              style={{
                width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
                background: `conic-gradient(var(--success) ${Math.round(retention30d * 360)}deg, rgba(255,255,255,0.12) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(retention30d * 100)}%</span>
              </div>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{timeAwareGreeting()}</h2>
                {streakDays > 0 && (
                  <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={12} /> {t('{{count}} days', { count: streakDays })}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{subtitle}</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {t('{{count}} cards due for review right now.', { count: totalDue })}
              </p>
            </div>
          </div>

          <button
            onClick={onStartReview}
            className="btn btn-primary"
            disabled={totalDue === 0}
            style={{ padding: '14px 28px', fontSize: '15px', borderRadius: '12px', opacity: totalDue === 0 ? 0.6 : 1 }}
          >
            <Zap size={18} />
            <span>{totalDue === 0 ? t('All caught up') : t('Start Review ({{count}} Due)', { count: totalDue })}</span>
          </button>
        </div>
      )}

      {/* Two-button action row - direct shortcuts, mirroring apps/mobile Home's action tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: actionTileColumns, gap: '16px' }}>
        <button
          onClick={() => onSelectScreen('search')}
          className="glass-card interactive"
          style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left', border: 'none' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Search size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Look up a word')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('Dictionary & AI')}</div>
          </div>
        </button>

        <button
          onClick={() => onSelectScreen('mining')}
          className="glass-card interactive"
          style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left', border: 'none' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Download size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Mining queue')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('Sentence holding')}</div>
          </div>
        </button>
      </div>

      {/* Word of the Day - same source priority and three-state UI as apps/mobile's Home
          equivalent (loaded / loading / offline nudge), see desktopServices.tsx's own
          refreshWordOfTheDayIfNeeded effect for the AI -> local-dictionary selection logic. */}
      {wordOfTheDay || wordOfTheDayLoading ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Word of the Day')}</h3>
            {wordOfTheDay?.source === 'dictionary' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', padding: '3px 10px', borderRadius: '999px' }}>
                <BookOpen size={12} /> {t('Dictionary')}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'var(--warning)', backgroundColor: 'var(--warning-bg)', padding: '3px 10px', borderRadius: '999px' }}>
                <Sparkles size={12} /> {t('AI Discovery')}
              </span>
            )}
          </div>
          <button
            onClick={() => wordOfTheDay && setWotdModalOpen(true)}
            disabled={!wordOfTheDay}
            className="glass-card interactive"
            style={{ width: '100%', textAlign: 'left', border: 'none', display: 'flex', flexDirection: 'column', gap: '6px', cursor: wordOfTheDay ? 'pointer' : 'default' }}
          >
            {wordOfTheDay ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{wordOfTheDay.word}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--warning)', flexShrink: 0 }}>
                    {t('Explore')} <ArrowRight size={13} />
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {wordOfTheDay.explanation}
                </p>
              </>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t("Finding today's word...")}</span>
            )}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Word of the Day')}</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', padding: '3px 10px', borderRadius: '999px' }}>
              <Info size={12} /> {t('Offline Mode')}
            </span>
          </div>
          <button
            onClick={onNavigateToAiProviderSettings}
            className="glass-card interactive"
            style={{ width: '100%', textAlign: 'left', border: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{t('Daily Word Discovery')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--warning)', flexShrink: 0 }}>
                {t('More info')} <ArrowRight size={13} />
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t('Configure an AI provider in Settings to get daily curated words, or install local dictionaries for offline use.')}
            </p>
          </button>
        </div>
      )}

      {wotdModalOpen && wordOfTheDay ? (
        <WordOfTheDayModal
          word={wordOfTheDay}
          targetLanguage={targetLanguage}
          onClose={() => setWotdModalOpen(false)}
          onExplore={onExploreWord}
        />
      ) : null}

      {/* Supplementary metrics - streak & retention already live in the hero above (pill + ring),
          so this row only covers what isn't shown there yet, matching desktop's own extra grid
          density on top of apps/mobile's leaner Home. */}
      <div style={{ display: 'grid', gridTemplateColumns: metricsColumns, gap: '16px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('Total Cards')}</span>
            <Target size={18} color="var(--info)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--info)' }}>{totalCards}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('Saved across all decks')}</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('Mined Sentences')}</span>
            <Sparkles size={18} color="var(--info)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--info)' }}>{t('{{count}} Pending', { count: miningQueue.length })}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('Ready for AI generation')}</div>
        </div>
      </div>

      {/* Daily Practice chart & Difficult Words - both real, see @lingora/database's
          getReviewCountsByDay / getDifficultWords (same queries StatsScreen.tsx uses). */}
      <div style={{ display: 'grid', gridTemplateColumns: splitColumns, gap: '24px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <BarChart3 size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t("This Week's Practice")}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '10px' }}>
            {dailyActivity.map((day) => {
              const date = new Date(day.day * 86_400_000);
              const isToday = day.day === Math.floor(Date.now() / 86_400_000);
              return (
                <div key={day.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{day.count > 0 ? day.count : ''}</span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '32px',
                      borderRadius: '6px 6px 3px 3px',
                      height: Math.max(6, (day.count / maxDailyCount) * 84),
                      background: isToday
                        ? 'linear-gradient(180deg, var(--accent-primary), var(--accent-secondary))'
                        : 'linear-gradient(180deg, rgba(99,102,241,0.55), rgba(99,102,241,0.2))',
                    }}
                  />
                  {/* Locale-aware weekday abbreviation (Intl, via the browser's own formatting for
                      the active app language) instead of a hardcoded English array + more
                      translation keys - correctly reflects each locale's real weekday names. */}
                  <span style={{ fontSize: '11px', color: isToday ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>
                    {date.toLocaleDateString(i18n.language, { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>{t('Words reviewed per day, last 7 days')}</p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Difficult Words')}</h3>
          </div>
          {difficultWords.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>{t('No lapses yet - nothing difficult to show.')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {difficultWords.map((word, i) => (
                <div
                  key={word.form}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 2px',
                    borderTop: i > 0 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{word.form}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--danger)',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {word.lapses}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Split Section: Decks Overview & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: splitColumns, gap: '24px' }}>
        {/* Decks Progress */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Active Study Decks')}</h3>
            <button
              onClick={() => onSelectScreen('decks')}
              className="btn btn-ghost"
              style={{ fontSize: '13px' }}
            >
              {t('View All')} <ArrowRight size={14} />
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
                  flexWrap: 'wrap',
                  gap: '10px',
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
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('{{count}} cards · {{retention}}% retention', { count: deck.totalCards, retention: deck.retention })}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className="badge badge-indigo">{t('{{count}} due', { count: deck.dueToday })}</span>
                  <button
                    onClick={onStartReview}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    {t('Study')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Searched - see apps/mobile Home's own section of the same name. The
            underlying data is the same "recently added cards" query mobile itself uses for
            this list (adding a card is how a search here resolves), just surfaced under the
            name learners actually recognize this as. */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Recently Searched')}</h3>
            <button onClick={() => onSelectScreen('search')} className="btn btn-ghost" style={{ fontSize: '13px' }}>
              {t('See all')}
            </button>
          </div>

          {recentWords.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              {t('Words you look up will show up here.')}
            </p>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentWords.map(word => (
              <button
                key={word.cardId}
                onClick={() => onSelectScreen('search')}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-glass)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-primary)' }}>{word.form}</span>
                  {word.cefrLevel && <span className="badge badge-sky">{word.cefrLevel}</span>}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {word.translation}
                </div>
              </button>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
