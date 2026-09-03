# 🏠 Home & Daily Study Hub

The **Home Dashboard** is the daily starting point in Lemmory. It gives you a real-time overview of your spaced repetition review load, current study streak, curated Word of the Day discovery, and instant shortcuts to dictionary lookup and sentence mining.

---

## 🚀 Screen Architecture & Key Components

```
┌────────────────────────────────────────────────────────┐
│  [🇬🇧 EN ➔ 🇩🇪 DE]  (Floating Language Pair Pill)        │
│                                                        │
│  Good morning! 👋                     🔥 12 days       │
│  Nice to see you back.                                 │
├────────────────────────────────────────────────────────┤
│  DAILY LOAD HERO                                       │
│  42 cards due across all decks           ( 94% )       │
│  [ ▶ Start Review Session ]            Retention       │
├────────────────────────────────────────────────────────┤
│  ACTION TILES                                          │
│  [ 🔍 Look up a word ]     [ 📥 Mining queue ]         │
│    Dictionary & AI           Sentence holding          │
├────────────────────────────────────────────────────────┤
│  WORD OF THE DAY                         ✨ AI Discovery│
│  schlendern ➔                                          │
│  To stroll or walk in a leisurely, relaxed manner.     │
├────────────────────────────────────────────────────────┤
│  RECENTLY SEARCHED                           See all ➔ │
│  • schlendern  — to stroll               [Cloze] [B1]  │
│  • Gemütlichkeit — coziness                      [B2]  │
└────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Component Breakdown

### 1. Floating Language Pair Badge
- **Location**: Top safe area inset above the dashboard.
- **Functionality**: Displays the current native-to-target language pair (e.g. 🇬🇧 `EN` $\rightarrow$ 🇩🇪 `DE`).
- **Interactive Action**: Tapping this badge directly opens **Settings $\rightarrow$ Learning** (`/settings/learning`), where you can switch your active target language or native language pair.

### 2. Time-Aware Greeting & Study Streak
- **Clock-Aware Greeting**: Automatically renders `Good morning!`, `Good afternoon!`, or `Good evening!` based on your device clock.
- **Contextual Subtitle**:
  - `Nice to see you back.` (when cards are due)
  - `All caught up - nothing due right now.` (when 0 cards are due)
  - `Let's find your first word.` (for brand-new accounts)
- **Streak Pill**: Displays 🔥 `X days`, tracking consecutive days with at least one completed review session.

---

### 3. Hero Section: Adaptive States

#### A. Active Learning State: Daily Load Hero
- **Due Counter**: Prominently shows the total number of cards across all decks ready for review right now based on the FSRS scheduling engine.
- **30-Day Retention Ring**: Displays your 30-day memory retention percentage (percentage of reviews rated above *Again*). Tapping the ring navigates to the full **Statistics** screen (`/stats`).
- **Start Review Button**:
  - When cards are due: Launches an all-decks review session (`/review/all-decks`).
  - When 0 cards are due: Displays **All caught up** and is disabled.

#### B. Brand-New User State: Getting Started Banner
If you have 0 cards in your library, the dashboard automatically swaps the due-count card for a 3-step onboarding guide:
1. **Search a word**: Look up words in your target language.
2. **Generate a card**: Turn definitions and examples into flashcards.
3. **Review**: Study using spaced repetition.
- **Primary CTA**: **Search your first word** (opens `/search`).

---

### 4. Two-Button Action Row
- **🔍 Look up a word**: Opens the **Search & Instant Dictionary** (`/search`) with direct keyboard focus.
- **📥 Mining queue**: Opens the **Mine / Sentence Holding Queue** (`/mine`) to view captured sentences and words ready to be converted into cards.

---

### 5. Word of the Day (WOTD)

> [!NOTE]
> Full details — how the word is picked and never repeated, when it refreshes, and how the daily notification works — live in the dedicated **[Word of the Day Guide](file:///Users/sukhdeep.singh/Mine/Lingora/docs/help/screens/09-word-of-the-day.md)**. This section covers only the Home-screen card itself.

#### When an AI Provider is Configured (`tier === 'full'`):
- **Bento Card**: Displays the word, a 2-line explanation, and the ✨ `AI Discovery` badge.
- **Interactive Popup Modal**: Tapping the card opens the full discovery dialog:
  - **Headword & Audio**: Instant native pronunciation playback via the `Volume2` button.
  - **Meaning & Explanation**: Formatted markdown explanation of the word and its nuances.
  - **Example in Context**: Natural bilingual example sentence with translations.
  - **Explore Full Details ↗**: Opens the comprehensive **Word Detail** screen (`/word/[form]`) to add it to your decks.

#### When Offline / No AI Provider Configured (`tier === 'offline'`):
- **Offline Bento Card**: Displays an ℹ️ `Offline Mode` badge.
- **Action**: Tapping the card opens the **AI Setup Modal** with instructions on connecting a free or paid AI key or downloading local offline dictionaries.

---

### 6. Recently Searched
- **Recent List**: Displays the last 3 searched words with their translations, CEFR levels (e.g. `A1`, `B2`), and cloze indicator badges.
- **Navigation**:
  - Tapping a word row navigates directly to its full **Word Detail** screen.
  - Tapping **See all** opens the complete **Recently Searched** history screen.
- **Empty State**: Renders an empty state prompt when no words have been looked up yet.

---

### 7. App Updates & In-App Help
- **What's New Modal**: Automatically pops up once per release when a new version of Lemmory is launched, summarizing newly introduced features.
- **Home Help Accordion**: Accessible via the header question mark icon, providing quick answers about daily due counts, retention stats, Word of the Day, and shortcuts.

---

## 💡 Common Workflows

1. **Daily Morning Review**:
   - Check the **Daily Load** number.
   - Tap **Start Review Session** to clear all due cards across all your decks in one continuous study flow.
2. **Learning Today's Word of the Day**:
   - Tap the **Word of the Day** card.
   - Listen to the audio pronunciation and read the context sentence.
   - Tap **Explore Full Details ↗** to add it to your study deck.
3. **Changing Target Languages**:
   - Tap the **Language Pair Pill** (e.g. 🇬🇧 EN $\rightarrow$ 🇩🇪 DE) at the top of the screen.
   - Select a different language pair in Settings.

---

## ❓ Frequently Asked Questions

> [!NOTE]
> **Why does the Word of the Day say "Offline Mode"?**
> Word of the Day requires an AI provider — it's inert without one. Add an API key (such as Google Gemini's free tier or OpenAI) in **Settings $\rightarrow$ AI Providers** and the card switches over automatically. See the **[Word of the Day Guide](file:///Users/sukhdeep.singh/Mine/Lingora/docs/help/screens/09-word-of-the-day.md)** for how the word itself is chosen and refreshed.

> [!TIP]
> **How is the retention rate calculated?**
> The retention percentage on the hero card calculates the proportion of successful reviews (grades *Hard*, *Good*, or *Easy*) over the past 30 days across all your decks.
