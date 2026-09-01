import type { IconName } from '../components/Icon'

export interface ParsedChangelogSection {
  id: string
  title: string
  subtitle: string
  details: string[]
  icon: IconName
  iconColor: string
  iconBg: string
  badge?: string
}

export interface ParsedRelease {
  version: string
  date: string
  sections: ParsedChangelogSection[]
}

/**
 * Embedded raw changelog markdown content.
 * Kept in sync with root CHANGELOG.md for offline bundled access in React Native.
 */
export const RAW_CHANGELOG_MD = `# Changelog

## [v0.2.0] - 2026-09-01

### 🌟 Word of the Day & Daily Discovery
- **Daily Curated Vocabulary**: Fresh curated words delivered every morning tailored to your CEFR level (A1–C2).
- **Native Audio & Context**: One-tap pronunciation, contextual example sentences, and immediate flashcard deck mining.
- **Two-Tier Architecture**: Full AI word exploration with offline dictionary fallback for unconfigured modes.

### 🔍 Smart Lookup & AI Word Generation
- **Live Dictionary Search**: Instant offline SQLite FTS5 lookup across comprehensive German dictionary packs.
- **AI Flashcard Generation**: Generate rich translations, grammar tables, and CEFR-assessed definitions on demand.
- **One-Tap Setup Helper**: Contextual AI & dictionary configuration modal accessible directly from the Search tab.

### 💬 In-App Feedback Hub
- **Interactive Dropdown Selector**: Submit Help & Support, Bug Reports, Feature Requests, and General Feedback directly in Settings.
- **Direct GitHub Issue Integration**: Issues are automatically formatted, categorized, and tagged via secure backend proxy.
- **Optional Diagnostic Attachment**: App version, platform, and feature tier context to help reproduce and resolve issues quickly.

### ⚡ Enhanced Cloze & Mixed Practice Reviews
- **Interactive Question Types**: Review cards with True/False, Multiple-Choice, and headword Cloze deletion questions.
- **Per-Deck Review Modes**: Configure specific review preferences and active modes per deck.
- **Shared SRS Queue Engine**: Fast, unified spaced repetition scheduling powered by the FSRS algorithm.

### 🎴 Spacious Decks & Unified Badges
- **Spacious Card Layouts**: Increased double-padding and clean visual hierarchy across all deck cards.
- **Unified Language Badges**: Centered flag chips and language-pair indicators.
- **Action Tiles**: Direct shortcuts for Flashcards, Cloze Quiz, and Mixed Practice sessions.

### 🤖 Expanded AI Providers & Cloud Audio
- **New AI Providers**: Added full support for DeepSeek and Groq alongside OpenAI, Claude, Gemini, and Mistral.
- **Google Cloud TTS**: High-fidelity neural voice synthesis with adjustable speech rates and pitch.
- **Robust Error Recovery**: Automatic request deduplication and rate-limit cooldown backoff.

### 🎨 Visual Themes & Internationalization
- **Theme Polish**: Enhanced contrast and dark mode optimization across Midnight Indigo, Carbon Noir, and Warm Sand.
- **Unified Lucide Icons**: Modern, crisp iconography consistent across mobile and desktop.
- **Multi-Language Support**: 100% translation coverage for English, German, French, Spanish, Hindi, and Vietnamese.
- **Modernized Backup Format**: Seamless .lem export and import format for deck backups.
`

function resolveIconAndColors(title: string): {
  icon: IconName
  iconColor: string
  iconBg: string
  badge?: string
} {
  const lower = title.toLowerCase()

  if (lower.includes('word of the day') || lower.includes('wotd')) {
    return { icon: 'Sparkles', iconColor: '#d97706', iconBg: '#fef3c7', badge: 'New' }
  }
  if (lower.includes('search') || lower.includes('lookup')) {
    return { icon: 'Search', iconColor: '#7c3aed', iconBg: '#f3e8ff' }
  }
  if (lower.includes('feedback') || lower.includes('support')) {
    return { icon: 'MessagesSquare', iconColor: '#0284c7', iconBg: '#e0f2fe' }
  }
  if (lower.includes('cloze') || lower.includes('practice') || lower.includes('review')) {
    return { icon: 'CheckCheck', iconColor: '#4f46e5', iconBg: '#e0e7ff' }
  }
  if (lower.includes('deck') || lower.includes('card')) {
    return { icon: 'Layers', iconColor: '#16a34a', iconBg: '#dcfce7' }
  }
  if (lower.includes('ai') || lower.includes('audio') || lower.includes('tts')) {
    return { icon: 'Volume2', iconColor: '#059669', iconBg: '#d1fae5' }
  }
  if (lower.includes('theme') || lower.includes('i18n') || lower.includes('icon')) {
    return { icon: 'Palette', iconColor: '#ea580c', iconBg: '#ffedd5' }
  }

  return { icon: 'Sparkles', iconColor: '#6366f1', iconBg: '#eef2ff' }
}

/**
 * Parses markdown changelog text into structured sections.
 */
export function parseChangelogMarkdown(markdown = RAW_CHANGELOG_MD): ParsedRelease {
  const lines = markdown.split('\n')
  let currentVersion = '0.2.0'
  let currentDate = ''
  const sections: ParsedChangelogSection[] = []

  let currentSection: ParsedChangelogSection | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Detect version header: e.g. ## [v0.2.0] - 2026-09-01 or ## v0.2.0
    const versionMatch = line.match(/^##\s+\[?(v?[\d\w.-]+)\]?\s*[-–]?\s*(.*)$/)
    if (versionMatch) {
      currentVersion = versionMatch[1] ?? '0.2.0'
      currentDate = versionMatch[2] ?? ''
      continue
    }

    // Detect feature section header: e.g. ### 🌟 Word of the Day & Daily Discovery
    const sectionMatch = line.match(/^###\s+(.*)$/)
    if (sectionMatch && sectionMatch[1]) {
      if (currentSection) {
        sections.push(currentSection)
      }

      const rawTitle = sectionMatch[1].replace(/^[^\w\s]+/, '').trim()
      const { icon, iconColor, iconBg, badge } = resolveIconAndColors(rawTitle)
      const id = rawTitle.toLowerCase().replace(/[^\w]+/g, '-')

      currentSection = {
        id,
        title: rawTitle,
        subtitle: '',
        details: [],
        icon,
        iconColor,
        iconBg,
        ...(badge ? { badge } : {}),
      }
      continue
    }

    // Detect bullet points: e.g. - **Title**: Description or - Description
    if (line.startsWith('-') || line.startsWith('*')) {
      const bulletText = line.replace(/^[-*]\s+/, '').trim()
      if (currentSection) {
        currentSection.details.push(bulletText)
        if (!currentSection.subtitle && bulletText) {
          // Use first bullet bold title as subtitle
          const boldMatch = bulletText.match(/\*\*([^*]+)\*\*/)
          if (boldMatch && boldMatch[1]) {
            currentSection.subtitle = boldMatch[1]
          }
        }
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return {
    version: currentVersion.replace(/^v/, ''),
    date: currentDate,
    sections,
  }
}
