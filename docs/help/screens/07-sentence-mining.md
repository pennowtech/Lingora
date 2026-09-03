# ⛏️ Mining Studio & Passage Mining

**Mining Studio** is where real text you've read — an article, a message, a subtitle — turns into study material. Capture a passage, then one tap gets you its **translation**, its **grammar** explained at your level, and ready-made **flashcards** for the words worth learning. No manual lookup, no dictionary-hopping.

![The Mining Studio passage library, showing a captured passage and one already-mined passage](mining-studio-passage-library)

---

## 🚀 Screen Architecture & Key Components

The feature is two screens: the **Mining Studio** list (captured passages) and **Study & Mine** (one passage's analysis).

---

## 📍 How to Open Mining Studio

1. **From the Home Dashboard**: Tap the **Mining queue** action tile below the daily load banner (still its label on Home, even though the screen itself is now "Mining Studio").
2. **From the Bottom Tab Bar**: Tap the **Mine** tab.

---

## 🔍 Detailed Component Breakdown

### 1. Mining Studio — the passage library

A passage stays here after it's been mined, so you can always revisit it. But you can always clear them by pressing **Clear All** in the top right corner.

Various components of this screen are as follows:

- **No immediate AI cost on capture**: a passage is stored locally as raw text; AI is only called once you open it in Study & Mine.
- **Source badges & timestamps**: every capture shows where it came from — 📰 Article, 📋 Clipboard, ✏️ Manual, 📤 Share Sheet, ⌨️ Process Text (Android "Share to Lemory"), plus extension and PDF sources.
- **Character count**: each passage shows its length; capture is capped at **1000 characters**.
- **Mined indicator**: a passage with a *tinted green background* and a **Mined** badge already had at least one card mined from it — that state updates immediately once you add a word, without needing to leave and reopen the screen.
- **Tap anywhere to open**: tapping the card body (not its checkbox or delete icon) opens **Study & Mine** for that passage. There's no separate "Study & Mine" button to hunt for — the whole card is the button.
- **Overview card**: when the library is empty, a centered "What is Mining Studio?" card explains the feature — it disappears the moment you have a captured passage.

---

### 2. 📥 Capturing a passage

#### A. One-Tap Clipboard Paste
Tap the **+** button, then **Paste from clipboard** — copied text (from an eBook, a message, anywhere) is pulled in and truncated to 1000 characters if longer.

#### B. System Share Sheet & Android Process Text
- **Share Sheet**: highlight text in any app → **Share** → **Lemory**.
- **Android Process Text**: highlight text → the system's three-dot menu → **Share to Lemory**.

#### C. Manual Add (`+`)
Tap **+** in the corner, type or paste a passage or sentence directly, and **Save Passage**. The composer shows a live character counter against the 1000-character cap.

---

### 3. 🧹 Clearing passages

- **Select and delete**: tap the checkbox on any passage to select it, then **Delete Selected** to remove just those.
- **Clear All**: removes every captured passage at once.
- **Cards are never touched**: deleting a passage only removes the capture record. Any cards you already mined from it stay exactly where they are, in your decks.

---

### 4. ✨ Study & Mine — analyzing one passage

Opening a passage calls the AI once to produce three things together:

1. **Fluent Translation** — a natural translation of the whole passage into your native language.
2. **Grammar Breakdown** — 2–4 explanations calibrated to *your CEFR level* (from Settings): word order and cases at A1–A2, subordinate clauses and passive voice at B1–B2, nominal style and fixed collocations at C1–C2. Each point can include a short rule/pattern chip alongside the explanation.
3. **Key Vocabulary** — a shortlist of words worth learning from the passage, each with its part of speech, contextual meaning, and the exact sentence it appeared in.

![Study & Mine, showing the captured passage and its fluent translation](mining-studio-study-and-mine-1)

![Study & Mine, showing the grammar breakdown and the extracted key vocabulary](mining-studio-study-and-mine-2)

The CEFR badge next to the passage (and next to the grammar section) uses the same green → amber → purple level ramp as the rest of the app — it's not a fixed color.

**Caching**: once analyzed, a passage's translation/grammar/vocabulary is kept in memory for the rest of the app session, so reopening it doesn't re-bill the AI provider. That cache is cleared the next time the app is fully closed and relaunched (not just backgrounded) — a deliberate choice so a long-running session stays fast, but a fresh app start doesn't hold stale analyses forever. Tap the **refresh icon** next to the passage at any time to force a fresh analysis — useful if the first pass missed something, or after you change your CEFR level.

---

### 5. Adding words to your decks

Select any of the extracted vocabulary words (all are selected by default; **Select All / Deselect All** toggles the whole list) and tap **Add N Words to Deck**. This opens the same `DeckPickerModal` used throughout the app (pick an existing deck or create a new one with its own review modes).

While the words are being added, a progress overlay shows ("Adding N words to your deck..."); the deck picker itself closes immediately so the overlay isn't hidden behind it.

Every outcome is one of three, and the closing toast names exactly which words landed where:

- **Added** — a brand-new flashcard was generated, with the passage's own sentence saved as the example.
- **Already in deck** — you already had a card for that word *and* it was already in this deck; nothing changes. This is reported as "already present," never as a failure.
- **Failed** — a genuine error (e.g. a network issue) prevented that one word from being processed.

Adding is always additive: a word that already exists elsewhere gets appended to the new deck (never duplicated, never overwritten), and a word already sitting in the target deck is simply left alone. Even an inflected form the app hasn't seen before (a past participle, a rare conjugation) that the AI resolves back to a word you already have is recognized as "already present" rather than misreported as a failure.

---

### 6. Help Accordions

Tapping the **❓** icon in either screen's header opens that screen's own help sheet (both are titled "Mining Studio Help," but their content is specific to the screen you opened them from):

- **On the Mining Studio list**: what the studio is for, how the Mined badge/highlight works, and how to clear passages.
- **On Study & Mine**: how passage analysis works, how adding words to decks reports its results, and how re-analyzing a passage works.

---

## 💡 Common Workflows

1. **Reading-session mining**:
   - While reading an article or book in your target language, copy a paragraph you found interesting or difficult.
   - Paste it into Mining Studio via the **+** button.
   - Open it in **Study & Mine**, read the translation and grammar notes, then add the vocabulary worth keeping to a deck.
2. **Revisiting a passage for more words**:
   - Open a passage that already shows the **Mined** badge — its translation and grammar are still there (from cache, or regenerated instantly if the session was restarted).
   - Select any words you skipped the first time and add them; already-mined words are reported as "already present," so there's no risk of duplicating anything.
3. **Cleaning up the library**:
   - Select a batch of passages you've fully mined and no longer need to revisit, and **Delete Selected** — the cards they produced stay in your decks untouched.

---

## ❓ Frequently Asked Questions

> [!TIP]
> **Does deleting a passage delete the flashcards I made from it?**
> No. Deleting only removes the captured passage text from Mining Studio. Cards already added to a deck are completely independent and stay put.

> [!NOTE]
> **Why didn't my second analysis of the same passage cost another AI call?**
> Mining Studio caches a passage's analysis for the rest of the current app session. Reopening it reads from that cache instead of calling the AI again — force a fresh one anytime with the refresh icon next to the passage.

> [!NOTE]
> **A word I added shows as "already present" instead of being added — is that a bug?**
> No. It means you already have a flashcard for that word in the selected deck, so nothing needed to change. It's reported separately from a genuine failure so you always know exactly what happened to each word.
