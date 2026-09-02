# 🔍 Instant Search & Multi-Engine Dictionary

The **Search & Dictionary** screen is Lemmory's lookup engine. It allows you to search words in either your target or native language, providing instant offline FTS5 database matches, bilingual dictionary translations, Word Guide previews, and one-tap AI flashcard generation.

---

## 🚀 Screen Architecture & Key Components

```
┌────────────────────────────────────────────────────────┐
│  Search                                             ❓ │  (Header with Help)
├────────────────────────────────────────────────────────┤
│  [ 🔍 Type a German or English word...            ✖ ] │  (Debounced FTS5)
├────────────────────────────────────────────────────────┤
│  NEW WORD PREVIEWS (If word not in library yet)        │
│                                                        │
│  📖 WORD GUIDE PREVIEW                                 │
│  schlendern  ·  Verb                           🔊 📖  │
│  to stroll, to saunter                                 │
│  [ + Add to deck ]   [ 📖 More info ]                  │
│                                                        │
│  🌐 TRANSLATION PREVIEW (Google Translate / DeepL)     │
│  schlendern  DE > EN                           🔊 🌐  │
│  to stroll, saunter, amble                             │
│  [ + Add to deck ]                                     │
│                                                        │
│  ✨ AI INSIGHTS & GENERATION (When AI configured)      │
│  schlendern                               AI Insights  │
│  Describes a relaxed, aimless walk. Often used in...   │
│  [ Explore Full AI Flashcard ➔ ]                       │
├────────────────────────────────────────────────────────┤
│  MATCHING RESULTS IN YOUR LIBRARY                      │
│  • schlendern — to stroll              🌐 ✓ [ Details ]│
│  • Schlenderer — stroller              📖   [ Details ]│
├────────────────────────────────────────────────────────┤
│  💬 Can't find a word or need help? Send feedback      │
└────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Component Breakdown

### 1. Dual-Language Search Bar
- **Bilingual Auto-Detection**: Type in your **target language** (e.g. German *schlendern*) or your **native language** (e.g. English *stroll*).
- **Fast FTS5 Search**: Uses SQLite Full-Text Search (FTS5) with a fast 250ms debounce to query your library and installed vocabulary dictionaries as you type.
- **Conjugation & Inflection Support**: Recognizes conjugated verb forms (e.g., *ging* $\rightarrow$ *gehen*) and inflected nouns/adjectives.
- **Session-Preserved Query**: The search query is remembered during tab switching, so you don't lose your place when switching between Decks and Search.

---

### 2. Multi-Tiered New Word Discovery Pipeline
When you search for a word that does not yet have an exact match in your library, Lemmory automatically populates up to three interactive discovery cards above the search results:

#### A. 📖 Word Guide Preview (Offline Dictionary)
- **Source**: Free, offline installed linguistic dictionary database.
- **Details**: Shows the canonical headword, part of speech (noun/verb/adj), grammatical gender, native audio pronunciation (🔊), and a concise usage intro.
- **Actions**:
  - **Add to deck**: Opens the **Deck Picker Modal** to turn the entry into a flashcard (with optional cloze sentence extraction).
  - **More info**: Opens the full **Word Guide Modal** featuring complete declension/conjugation tables and example sentences.

#### B. 🌐 Quick Translation Preview (Google Translate / DeepL)
- **Source**: Live translation engine configured in **Settings $\rightarrow$ Translation** (Google Translate, DeepL, or AI).
- **Bilingual Resolution**: Automatically translates towards the opposite language of the pair (target $\leftrightarrow$ native).
- **Synonyms & Alternatives**: When using Google Translate, displays primary translations plus alternative synonym clusters.
- **Status Indicator**: If the word is already saved in your library, displays a green **Already in your library** badge; otherwise, provides a direct **Add to deck** button.

#### C. ✨ AI Insights & One-Tap Flashcard Generation
- **When AI Provider is Configured (`tier === 'full'`)**:
  - **AI Insights Preview**: Generates a fast, concise (~50-word) linguistic summary explaining the word's nuanced usage, tone, and register.
  - **Generate Full AI Flashcard**: Tapping the card triggers an optimistic card creation that builds definitions, example sentences, synonyms, collocations, and cloze blanks, instantly navigating to the **Word Detail** view (`/word/[form]`).
- **When in Offline Mode (`tier === 'offline'`)**:
  - Displays a **Limited Mode** card prompting you to connect an API key in Settings for AI generation, or to install offline dictionaries.

---

### 3. Matching Library Results List
- **Prefix & Exact Matching**: Lists all cards and dictionary lemmas that match the search query.
- **Card Metadata**:
  - Canonical form and translation.
  - Source icon (Offline Word Guide 📖, Translation Engine 🌐, or AI Provider ✨).
  - Green checkmark (**✓**) if the card is already in one of your decks.
  - **Details** chip: Directly opens the detailed linguistic card view.

---

### 4. Deck Picker & Review Mode Integration
- **Deck Selection**: When tapping **Add to deck** on a translation or Word Guide entry, the `DeckPickerModal` opens.
- **Review Mode Badges**: Each deck displays icons representing the study modes it practices:
  - **Vocab** (⇄): Word-to-translation recall.
  - **Reverse** (⮌): Translation-to-word recall.
  - **Cloze** (T): Fill-in-the-blank practice inside context sentences.
  - **Multiple Choice** (☰): Fast quiz practice with distractors.
  - **True / False** (✓): Rapid verification.
- **Create New Deck**: Allows creating a new deck with custom question type configurations directly from the picker.

---

### 5. Search from Anywhere (System Share & Process Text)
- **Android Process Text**: Highlight any word in a web browser, ebook, or messaging app, tap the three dots $\rightarrow$ **"Search in Lemmory"** to jump directly into Search with that word preloaded.
- **System Share Sheet**: Share text or phrases from external apps straight to Lemmory.

---

### 6. Search Help Accordion
- Tapping the **CircleQuestionMark** (❓) icon in the native header opens the **Search Help Sheet** explaining:
  - Instant lookup rules and bilingual detection.
  - How new-word dictionary cards work.
  - Deck review mode icon meanings.
  - How to search from outside apps.

---

## 💡 Common Workflows

1. **Looking Up an Unfamiliar Word**:
   - Type the word in the search bar (e.g. *schlendern*).
   - Review the **Word Guide** definition and audio pronunciation.
   - Tap **Add to deck** $\rightarrow$ select your target deck (e.g. *German B1*) $\rightarrow$ card is saved immediately.
2. **Reverse Lookup from Native Language**:
   - Type an English word (e.g. *coziness*).
   - The Quick Translation preview detects English and resolves the German target lemma (*Gemütlichkeit*).
   - Tap **Generate Full AI Flashcard** to build a complete bilingual flashcard.
3. **Exploring Grammar & Conjugation**:
   - Look up an irregular verb (e.g. *sprechen*).
   - Tap **More info** on the Word Guide card to inspect full tense tables (Präsens, Präteritum, Perfekt) in the modal.

---

## ❓ Frequently Asked Questions

> [!TIP]
> **Can I search when I don't have an internet connection?**
> Yes! The local SQLite search and installed **Word Guides** work completely offline without needing Wi-Fi or mobile data.

> [!NOTE]
> **Why do I see Google Translate above words that already exist in my library?**
> Google Translate is kept as a persistent quick reference so you can instantly verify a quick meaning without having to open the full card.
