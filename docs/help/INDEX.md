# Lemony Help & Feature Documentation

Welcome to the comprehensive help and feature documentation for **Lemony** — the modern, privacy-focused, AI-accelerated language learning and spaced repetition system.

> [!TIP]
> 🎬 **Watch the 2-Minute Video Overview**: [Watch on YouTube](https://youtu.be/ZmxOaj0c7Zc) to see the full workflow from instant search to sentence mining and FSRS spaced repetition review.

---

## 📚 Feature Directory & Screen Guides

Below is the complete, concise list of all supported screens and features across the Lemony platform. Each section links to its dedicated, in-depth guide covering what it is, how to use it, why it works, and troubleshooting tips.

---

### 1. 🏠 Home & Daily Study Hub
*Main entry point for daily learning sessions, streaks, and quick lookups.*
- **[Home Dashboard Guide](01-home-dashboard.md)**
  - **Floating Language Pair Badge**: Visual native-to-target indicator (e.g. 🇬🇧 EN ➔ 🇩🇪 DE) with one-tap navigation to language settings.
  - **Time-Aware Greeting & Streak**: Dynamic clock greetings, contextual subtitles, and consecutive-day streak tracking.
  - **Daily Load Hero**: Real-time due card counter, 30-day retention ring, and single-tap review session launcher (with 3-step getting started banner for new users).
  - **Action Tiles**: Direct shortcuts to *Look up a word* (Dictionary & AI) and *Mining queue* (Sentence holding).
  - **Word of the Day**: Curated daily discovery card with interactive pronunciation, markdown explanation, and context examples.
  - **Recently Searched**: History list of recently inspected words with CEFR levels and cloze badges.

---

### 2. 🔍 Instant Search & Multi-Engine Dictionary
*Instant bilingual dictionary powered by indexed offline data, translation engines, and live AI enrichment.*
- **[Search & Dictionary Guide](02-search-dictionary.md)**
  - **Bilingual Debounced Search**: Fast FTS5 local database lookup supporting target and native language input, stem resolution, and inflected forms.
  - **Word Guide Previews**: Free offline linguistic glosses with grammatical gender, part of speech, audio pronunciation, and detailed grammar tables.
  - **Quick Translation Previews**: Dual-direction Google Translate / DeepL translations with alternative synonyms and audio playback.
  - **AI Insights & One-Tap Generation**: Fast ~50-word contextual AI previews and complete flashcard generation with automatic enrichment.
  - **Deck Picker & Review Mode Badges**: Direct deck assignment displaying enabled review study modes (Vocab, Reverse, Cloze, Multiple Choice, True/False).
  - **Search from Anywhere**: Android Process Text and system Share Sheet integration to look up words directly from external apps.

---

### 3. 📖 Word Detail & Card Creator
*Deep linguistic breakdown, semantic sense switching, contextual examples, grammar targeting, and AI tutoring.*
- **[Word Detail & Creation Guide](03-word-detail.md)**
  - **Linguistic Header & Grammar Info**: Headword, audio pronunciation (🔊), and collapsible grammar metadata (part of speech, gender, inflections/conjugations).
  - **Semantic Contexts / Senses**: Horizontal segmented switcher for multiple word senses with independent CEFR badges, meanings, examples, and synonyms.
  - **Card Action Bar**: Tools to view detailed etymology/usage (*More info*), chat with a dedicated AI tutor (*Ask AI*), regenerate cards (*Regenerate*), edit definitions, delete, or search the web.
  - **Contextual Examples**: Filter by situation (Casual, Formal, Business, Travel, Daily Life, Slang), audio playback, single-tap sentence flashcard creation (`+`), and `Use on Flashcard` designation.
  - **Advanced Grammar Options**: Targeted AI sentence generation for specific tenses, conjunctions, subordinate clauses, or custom grammar prompt rules.
  - **Synonyms & AI Nuance**: On-demand AI explanations (`✨`) detailing formality and usage differences, with direct flashcard jumping.
  - **Phrases, Clozes & Sticky Deck Bar**: Idiomatic collocations, cloze deletion previews, and sticky `Add to deck` modal with review mode badges.

---

### 4. 🗂️ Study Progress and Decks
*Hierarchical sub-decks, custom review modes, deck management menus, table data grid, and card creator.*
- **[Study Progress and Decks Guide](04-decks-management.md)**
  - **Study Progress & Hierarchy**: Visual retention progress, quick access to Statistics (📊 Stats ↗), due counts, and nested sub-deck trees.
  - **Per-Deck Review Modes**: Configure which exercises each deck tests (Vocab ⇄, Reverse ⮌, Cloze T, Multiple Choice ☰, True/False ✓).
  - **Quick Action Drawer ("⋮" Menu)**: One-tap access to Add Card, Open Deck, Import (Anki/CSV/.lem), Export, Rename, Move (nesting), Merge, Reset Progress, and Delete.
  - **Deck Inspection & Card Preview**: Header stats, single-tap study preview mode, and long-press multi-select bulk removal.
  - **Spreadsheet Table View**: Dedicated data grid with Word and Cloze tabs for auditing vocabulary, sentences, and tags in bulk.
  - **Manual Card Creator**: Compose Basic flashcards (with AI sentence generation) or interactive Cloze deletion cards from scratch.

---

### 5. 🧠 Review Engine
*Scientifically optimized memory retention powered by FSRS and SM-2 algorithms.*
- **[Spaced Repetition Review Guide](05-srs-review.md)**
  - **FSRS & SM-2 Scheduling**: Modern Free Spaced Repetition Scheduler (FSRS) with adjustable target retention (80%–95%).
  - **Multi-Modal Review Styles**:
    - Standard Flip Mode (Question $\rightarrow$ Reveal $\rightarrow$ Rate: Again / Hard / Good / Easy)
    - Cloze Typing & Tap-to-Reveal
    - Audio-First Listening Mode (hear audio before seeing text)
    - Multiple Choice / Quick Recognition
  - **Intuitive Gestures & Keybindings**: Swipe left/right/up or use numeric keyboard shortcuts (1, 2, 3, 4, Space).
  - **Review Safety**: One-step undo review button for accidental ratings.
  - **Post-Session Analytics**: Immediate performance summary, retention rates, and future review projections.

---

### 6. 📊 Learning Statistics & Analytics
*Memory retention analytics, FSRS review forecasts, activity heatmaps, and difficult word drills.*
- **[Learning Statistics Guide](06-learning-statistics.md)**
  - **Memory & Retention Analytics**: 30-day recall rate, consecutive study streak, total saved cards, and weekly new card volume.
  - **Study Activity Heatmap**: 5-week visual calendar grid tracking daily review consistency.
  - **7-Day Review Forecast**: Interactive FSRS workload bar chart projecting upcoming daily review volumes.
  - **Difficult Words (Top 10)**: Frequently lapsed words with single-tap targeted practice shortcuts.

---

### 7. ⛏️ Mining Studio & Passage Mining
*Capture whole passages from reading and media, and mine each one individually for translation, grammar, and vocabulary.*
- **[Mining Studio Guide](07-sentence-mining.md)**
  - **Passage Library**: Captured passages (up to 1000 characters) persist as a library, not a disposable queue — a "Mined" badge shows which ones already produced cards.
  - **Flexible Capture Methods**: Manual typing, one-tap clipboard paste, and system share sheet / Android Process Text integration.
  - **Study & Mine Analysis**: One tap per passage produces a fluent translation, a CEFR-calibrated grammar breakdown, and extracted key vocabulary.
  - **Accurate Deck Additions**: Adding words reports exactly what was added, already present, or failed — never a silent duplicate or overwrite.

---

### 8. ✨ Word of the Day
*A daily AI-curated word, tailored to your level, delivered on the Home screen and as a local notification.*
- **[Word of the Day Guide](08-word-of-the-day.md)**
  - **Requires an AI provider**: inert on the free/offline tier — the Home card shows "Offline Mode" instead until a key is configured.
  - **CEFR-tailored & never repeated**: excludes your existing library plus a rolling history, verified after generation rather than trusted on the prompt alone.
  - **Refreshes on every foreground**: not just once per app session, so the word and its notification stay in sync with the calendar day.
  - **Daily local notification**: configurable time in Settings → Learning, opens the same summary popup as the Home card.

---

### 9. ⚙️ Settings & AI Engines
*Full customization of themes, BYOK AI engines, voice synthesizers, FSRS algorithms, and data import/export.*
- **[Settings & Configuration Guide](09-settings-engines.md)**
  - **Fast Search Bar**: Search settings by keyword (*tts*, *gemini*, *anki*, *dark mode*) for instant navigation.
  - **Study & Speech**: High-speed on-device audio, OpenAI Audio, ElevenLabs, Deepgram (Aura-2), and Google Cloud TTS voices; language pair & CEFR level picker; FSRS vs SM-2 algorithm scheduler.
  - **AI & Translation**: Bring-Your-Own-Key management for Google Gemini (free tier), Groq, OpenAI, Mistral, Claude, and DeepSeek with curated profiles, custom model overrides, and automatic fallback pools; DeepL and Google Translate services.
  - **Library & Content**: Anki (`.apkg`) and CSV/Spreadsheet visual import wizards, Lemony package (`.lem`) backups, Liquid card template designer, and offline dictionary packs.
  - **System & Account**: Google Cloud Sync across mobile and desktop, Dark/Light/OLED Black themes, font scaling, GitHub feedback portal, and version release notes.

---

### 10. 📥 Importing and Exporting Cards
*Bring vocabulary in from CSV, Anki, or a shared Lemony deck - and send any deck back out the same way.*
- **[Import/Export Guide](10-import-export.md)**
  - **Three Import Formats**: CSV (map your own columns), Anki `.apkg` (bring an existing collection), and Lemony `.lem` (full fidelity, including review history).
  - **Regular vs. Cloze, One Choice Per Pass**: Each import creates one card type for the whole file; get both by importing the same file twice with "Keep both" as the duplicate policy.
  - **Review-Mode Fallback**: Imported cards that don't match a deck's enabled review modes are never lost - they're tested in whichever format actually has content, with a warning shown before you import if there's a mismatch.
  - **Four Export Formats**: CSV, Anki `.apkg`, Markdown (read-only), and Lemony `.lem` - the only one that carries a deck's full FSRS state and review history.

---

## 🗺️ Screen & Feature Directory

| Screen / Feature | Description |
| :--- | :--- |
| **[Home Dashboard](01-home-dashboard.md)** | Daily study hub, streaks, retention ring, Word of the Day, quick search & mining queue |
| **[Search & Dictionary](02-search-dictionary.md)** | Instant bilingual search, offline Word Guide, Google/DeepL translations, and AI card previews |
| **[Word Detail & Card Creator](03-word-detail.md)** | Polysemous sense switching, AI tutor chat, grammar targeting, and cloze generation |
| **[Study Progress and Decks](04-decks-management.md)** | Sub-deck hierarchies, review modes, study card previews, spreadsheet table view, and manual card builder |
| **[Spaced Repetition Review](05-srs-review.md)** | Active study sessions, FSRS cognitive scheduling, multi-format review exercises, and keyboard/touch shortcuts |
| **[Learning Statistics](06-learning-statistics.md)** | 30-day retention rate, 5-week study heatmap, 7-day FSRS forecast, and difficult word drills |
| **[Mining Studio](07-sentence-mining.md)** | Passage capture library, per-passage translation/grammar/vocabulary analysis, and accurate deck additions |
| **[Word of the Day](08-word-of-the-day.md)** | AI-curated daily word (requires an AI provider), CEFR-tailored, never repeated, with a daily notification |
| **[Settings & Configuration](09-settings-engines.md)** | Bring-Your-Own-Key AI engines, neural TTS voices, FSRS parameters, cloud sync, and card templates |
| **[Importing and Exporting Cards](10-import-export.md)** | CSV/Anki/Lemony import wizards, Regular vs. Cloze card types, review-mode fallback, and four export formats |
