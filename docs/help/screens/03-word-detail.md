# 📖 Word Detail & Card Creator

The **Word Detail** screen is the core linguistic deep-dive in Lemmory. It breaks down any word into multiple semantic senses, audio pronunciations, contextual example sentences, targeted grammar exercises, AI synonym nuances, idioms, and cloze flashcards.

![The Word Detail screen for "laufen", showing its semantic contexts and examples](word-detail-card-creator)

---

## 🔍 Detailed Component Breakdown

### 1. Linguistic Header & Grammar Info
- **Headword & Source Badge**: Displays the canonical lemma with an icon indicating its origin (Offline Word Guide 📖, Translation Engine 🌐, or active AI Provider ✨).
- **Audio Synthesizer (🔊)**: Instant native text-to-speech audio pronunciation in the target language.
- **Collapsible Grammar Info (`formsToggle`)**: Tap to expand or collapse part of speech, grammatical gender, plural forms, and all known inflected/conjugated variations (e.g. *schlendert*, *schlenderte*, *geschlendert*).
- **Background AI Auto-Enrichment**: When opening a newly created word, a subtle non-blocking badge (*✨ AI enriching meanings & examples...*) indicates that the AI is generating full sentences and synonyms in the background.

---

### 2. Semantic Contexts (Sense Switcher)

Many words have multiple completely different meanings (for example, the German verb **einstellen** can mean *to hire*, *to adjust*, or *to stop*). Instead of cramming all unrelated definitions onto one confusing card, **Lemmory** automatically splits them into separate **Semantic Contexts (Senses)**.

#### Why Sense Segmentation Matters
- **Avoids Memory Interference**: Trying to memorize that a single word means both "to hire someone" and "to adjust a machine" on the same flashcard creates confusion and slows down recall.
- **Isolated Contexts**: Every sense operates as a standalone linguistic unit. When you tap a sense capsule, the entire screen dynamically updates to reflect only that specific meaning:
  - **Definitions & Explanations**: Tailored directly to that usage.
  - **Example Sentences**: Generated specifically for that situation.
  - **Synonyms & Nuances**: Relevant only to that particular sense.
  - **CEFR Difficulty Badge**: Evaluated independently (e.g. basic physical sense at `A2` vs. idiomatic or business sense at `B2`).

---

#### 📌 Concrete Example: German Verb *"einstellen"*

Consider the German verb **"einstellen"**, which has several completely different real-world meanings:

| Sense Capsule | Meaning & Nuance | Example Sentence | Synonyms (AI Nuance) | Target Deck |
| :--- | :--- | :--- | :--- | :--- |
| **Sense 1: Employment** `[B1]` | *To hire, recruit, or employ staff.* | *"Das Unternehmen möchte neue Mitarbeiter **einstellen**."* (*The company wants to hire new employees.*) | *anstellen*, *beschäftigen*, *rekrutieren* | 💼 *Business German* |
| **Sense 2: Adjustment / Settings** `[A2]` | *To adjust, configure, or tune a device.* | *"Kannst du bitte die Lautstärke am Radio **einstellen**?"* (*Can you please adjust the volume on the radio?*) | *anpassen*, *justieren*, *regulieren* | 🏠 *Everyday German* |
| **Sense 3: Cessation / Termination** `[B2]` | *To cease, discontinue, or stop an activity.* | *"Wegen des Sturms musste die Bahn den Betrieb **einstellen**."* (*Due to the storm, the train had to halt operations.*) | *beenden*, *aufhören*, *stoppen* | 📰 *Advanced Reading* |

---

#### 🎯 Multi-Deck Sense Assignment (`createCardForSense`)
- **No Overwrites**: If you add **Sense 1 (*to hire*)** to your *Business German* deck, and later add **Sense 2 (*to adjust*)** to your *Everyday German* deck, Lemmory creates two clean, independent flashcards.
- Each deck practices the exact sense, translation, audio, and example sentence relevant to its learning goals, while both remain linked to the same underlying word lemma.

---

### 3. Meaning Card & Card Action Toolbar

#### Primary Meaning Card
- Displays the canonical translation in your native language.
- Inline explanation on AI cards detailing *how*, *when*, and *in what tone* the word is used.

#### Action Toolbar (`CardActionBar`)
- **ℹ️ More info / Explain**:
  - On AI cards: Opens the **AI Explanation Sheet** with deep etymology, usage nuances, and tone breakdowns.
  - On dictionary cards: Opens the rich **Word Guide Modal** with full conjugation/declension tables.
- **💬 Ask AI**: Opens the interactive **Word Chat Sheet** (`WordChatSheet`) — an AI language tutor dedicated to this word where you can ask custom questions (e.g. *"What is the difference between schlendern and bummeln?"*).
- **✨ Regenerate**: Triggers a complete AI regeneration of the card's definitions, examples, synonyms, and collocations with confirmation safeguards.
- **✏️ Edit**: Opens an inline editor to manually adjust translations and sentences, with an integrated **Generate with AI** button.
- **🗑️ Delete**: Permanently removes the word, card, and associated review history from your library.
- **🌐 Search Web**: One-tap shortcut to look up the word on Google.

---

### 4. Contextual Example Sentences

- **Context Tone Filter**: Filter example sentences by situation using the dropdown:
  - **All Examples**
  - **Casual** (☕)
  - **Formal** (🎖️)
  - **Business** (💼)
  - **Travel** (✈️)
  - **Daily Life** (🏠)
  - **Slang** (✨)
- **Sentence Audio (🔊)**: Listen to full example sentences spoken in natural cadence.
- **`+` (Add Card to Deck)**: Directly turns this specific example sentence into a dedicated flashcard in any deck.
- **`⋯` (Three-Dots Menu)**:
  - **⭐ Use on Flashcard**: Designate which example sentence appears as the primary context on your flashcard.
  - **Quality Rating (👍 / 👎)**: Rate example naturalness to calibrate future AI generations.

---

### 5. Advanced Grammar Options Modal
- Accessible via the **Advanced grammar options** button below examples.
- **Grammar Structure Selector**: Pick specific grammar rules to practice in your sentences (e.g., *Past Perfect*, *Passive Voice*, *Subjunctive II / Konjunktiv II*, *Subordinate Clauses with 'weil/obwohl'*).
- **Custom Grammar Rule**: Type your own prompt rule (e.g., *"Use with two dative pronouns"*) and tap `+`.
- **Generate Targeted Examples**: AI generates fresh sentences strictly adhering to your selected grammar patterns, marked with highlighted badges.

---

### 6. Synonyms & On-Demand AI Nuance
- **Synonym List**: Related words in the same semantic context.
- **✨ AI Usage & Nuance**: Tap the sparkle icon next to any synonym to fetch an instant AI breakdown explaining:
  - How it differs in formality, nuance, and connotation from the headword.
  - Formality tags (e.g. *formal*, *colloquial*, *literary*).
- **↗ Open Flashcard**: Tap the external link icon to jump directly to that synonym's full Word Detail screen.

---

### 7. Phrases & Idiomatic Collocations
- Common idiomatic expressions, compound sayings, and collocations using the word.
- Displays expression, meaning, and a complete bilingual context sentence with CEFR level tags.
- **Explore with AI / Load more with AI**: Generates additional natural phrases on demand.

---

### 8. Cloze Deletion Preview & Editor
- Displays active fill-in-the-blank cards with target words obscured (`[...]`).
- Integrated with the **Cloze Editor Sheet** to customize sentences, answers, and context clues.

---

### 9. Sticky Bottom Action Bar & Deck Picker
- **Add to deck**: Prominent sticky button at the bottom of the screen.
- **DeckPickerModal Integration**:
  - Displays all decks with green checkmarks (**✓**) for decks already containing this card.
  - Displays deck **Review Mode Badges** (⇄ Vocab, ⮌ Reverse, T Cloze, ☰ Quiz, ✓ True/False).
  - **Interactive Cloze Setup**: If the chosen deck has Cloze practice enabled, a blank selector appears right away in the next screen after selecting the deck. Tap any word in the sentence to turn it into a blank (tap again to undo). You can mark multiple blanks in the same sentence.
  - **Create New Deck**: Finally, tpping on **Create New Deck** button creates a new deck on the fly without leaving the word page.

---

### 10. Word Detail In-App Help (❓)
- Accessible via the question mark icon in the top header (`HELP_SECTIONS`):
  - **Meaning & sense switching**
  - **Example sentence actions & flashcard selection**
  - **Advanced grammar options & custom rule prompts**
  - **Toolbar actions (Explain, Ask AI, Regenerate, Edit)**
  - **Synonyms & AI nuance**
  - **Cloze cards and review modes**
  - **Multi-deck assignment**

---

## 💡 Common Workflows

1. **Creating a Custom Cloze Card**:
   - Open the word detail screen.
   - Tap **Add to deck** $\rightarrow$ choose a Cloze-enabled deck $\rightarrow$ tap words in the sentence to set blanks $\rightarrow$ Save.
2. **Practicing Specific Grammar Structures**:
   - Tap **Advanced grammar options**.
   - Select *Subjunctive II* and *Subordinate Clauses*.
   - Tap **Generate targeted examples**.
   - Pick your favorite sentence and tap `+` to add it to your *Grammar Practice* deck.
3. **Chatting with AI About Nuances**:
   - Tap **💬 Ask AI** in the action bar.
   - Ask: *"Can I use this word in a formal job interview?"*
   - Receive immediate, context-aware advice from your personal AI tutor.

---

## ❓ Frequently Asked Questions

> [!TIP]
> **What happens when I select "Use on Flashcard"?**
> Setting an example as primary ensures that specific sentence and translation appear on your main spaced repetition flashcard during daily review.

> [!NOTE]
> **Can I edit AI-generated cards if I want to tweak a sentence?**
> Yes! Tap the **✏️ Edit** button on the action bar to adjust translations, sentences, or generate alternative phrases.
