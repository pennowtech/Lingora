# Changelog

All notable changes to Lemony since tagged release `v0.1.0-internal.4`.

## [v0.3.0] - 2026-09-03

### ⛏️ Mining Studio Rework
- **Passage-Based Capture**: Captures whole passages (up to 1000 characters) instead of single sentences for batch generation.
- **Study & Mine Analysis**: One tap analyzes a passage into translation, CEFR-tailored grammar, and extracted vocabulary.
- **Whole-Card Tap & Bulk Cleanup**: Tap any passage to open it; select and clear multiple captures at once.

### 📚 Help Hub
- **New Help Hub**: Searchable in-app documentation with a chapter directory and a 2-minute video tour.
- **Fixed Disappearing Video Controls**: Fullscreen minimize/close buttons now reliably reappear on tap, not stuck invisible.
- **Fixed Wrong Video Playing**: Each chapter's video link now plays its own video, not always the same one.

### 🔔 Word of the Day Fixes
- **Daily Refresh That Actually Refreshes**: Regenerates on every app foreground, not just once per cold start.
- **Verified, Not Just Requested**: Retries automatically if the AI repeats a word already shown before.
- **Notification Opens the Right Popup**: Tapping the daily notification now opens the same summary card as Home.

### 💬 Feedback & Support
- **Public Email Warning**: Warns before submitting if your email will be visible in a public GitHub issue.
- **Fixed "Ask in Support" Link**: Was silently landing on the About page instead of the feedback form.

### 🤖 Redesigned AI Providers Screen
- **Card-Based Provider List**: Every provider now shows as its own card with clear Active/Enabled status.
- **Curated Model Profiles**: Pick from a curated model list per provider, each tagged with a speed/quality hint.
- **One-Tap Key Setup**: A "Get key" link opens each provider's developer portal directly, with cost guidance.
- **Enhanced Help**: Expanded help sections explain getting a key, and how Active/fallback provider selection works.
- **Reliable Activation**: Activating a provider now consistently enables it and simplifies how key presence is checked.

### 🎯 Review Mode Accuracy
- **Honest Review-Mode Badges**: Decks now show only the review formats they actually support, not always all five.
- **Cleaner Search Previews**: Removed review-mode badges from read-only Search previews where no saved card exists yet.
- **Shared Fallback Logic**: Deck review-mode defaults now come from one shared place across mobile and desktop.

### 🛠 AI Card Reliability
- **Visible Enrichment Failures**: A failed "Generate with AI" attempt now tells you it didn't complete.
- **Fixed Dead-End Retry Loops**: "Ask AI" and "More Info" no longer trap you in an unwinnable retry loop.
- **Smarter Edit Visibility**: Edit visibility is now tied to live generation state, not a one-time flag.

### 🧹 Review & Settings Cleanup
- **Decluttered Review Header**: Removed the estimated time-remaining pill and redundant review-mode badges from the review screen.
- **Removed Duplicate Audio Settings**: Deleted a duplicate "Audio Settings" entry that already existed elsewhere in Settings.
- **Card-Add Flows That Actually Close**: Adding a card now closes and shows a toast instead of stalling open.

### 🎴 Decks Screen Polish
- **Study-Progress Hero Link**: Decks hero now shows 30-day retention and links directly to Stats.
- **New Groq Model**: Added GPT-OSS 20B as a new curated option in the Groq model list.

### 🛠 Stability & Tooling
- **Fixed Cold-Boot Crash**: Installed a missing dependency that crashed every app launch on Expo SDK 57.
- **Expo SDK Alignment**: Synced all Expo package versions and dependencies to their SDK-57-matched releases.
- **Development Client Build Profile**: Added a dedicated EAS build profile for the Expo development client.
- **EAS Build Changelog Gate**: New confirmation prompt before every build, verifying changelog and version were updated.

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
