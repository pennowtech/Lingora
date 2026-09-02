# Changelog

All notable changes to Lemmory since tagged release `v0.1.0-internal.4`.

## [v0.3.0] - 2026-09-02

### 🤖 Redesigned AI Providers Screen
- **Card-Based Provider List**: Every provider (OpenAI, Groq, Mistral, Gemini, Claude, DeepSeek) now shows as its own card with clear Active/Enabled status, instead of a flat settings list.
- **Curated Model Profiles**: Pick from a short, labeled list of real models per provider - each tagged with a speed/quality hint (e.g. Recommended, Fastest, Deep Nuance) and a one-line description, instead of typing a raw model name.
- **One-Tap Key Setup**: A "Get key from..." link on every card opens that provider's developer portal directly, plus new in-app guidance on free-tier vs pay-as-you-go options and roughly what a generated card costs.
- **Enhanced Help**: Expanded help sections explain how to get a key, and how the Active provider and automatic fallback between validated providers actually works.
- **Note**: this redesign was built alongside v0.2.0 but missed that release's actual build cut - this is its first real release.

### 🎯 Review Mode Accuracy
- **Honest Review-Mode Badges**: Decks now show only the review formats they actually support instead of always showing all five, even for older decks created before per-deck review modes existed.
- **Cleaner Search Previews**: Removed review-mode badges from read-only Search previews (Google Translate, Word Guide) where a saved card - and its review modes - doesn't exist yet.
- **Shared Fallback Logic**: Deck review-mode defaults are now computed in one shared place across mobile and desktop, so the two can no longer drift out of sync.

### 🛠 AI Card Reliability
- **Visible Enrichment Failures**: A "Generate with AI" attempt that fails partway now tells you it didn't complete, instead of silently leaving the card looking stuck with no explanation.
- **Fixed Dead-End Retry Loops**: "Ask AI" and "More Info" no longer open into an unwinnable retry loop on a card with no real meaning content yet - both now explain what's missing and point at Regenerate, on the word page and during Review alike.
- **Smarter Edit Visibility**: The Edit action on an AI-intended card is now tied to live generation state rather than a one-time navigation flag, so it no longer reappears unpredictably after a failed background enrichment.

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
- **Modernized Backup Format**: Seamless `.lem` export and import format for deck backups.
