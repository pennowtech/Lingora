# 🗂️ Study Progress and Decks

The **Decks** tab is where you track overall study progress, organize vocabulary collections, customize review modes, and manage your flashcards. In Lemmory, decks are not just static folders — they are smart study collections that define which review modes you practice, track their own retention statistics, and support hierarchical nesting, spreadsheet table views, and bulk actions.

---

## 🚀 Screen Architecture & Key Components

```
┌────────────────────────────────────────────────────────┐
│  Decks                                      🔄  ❓     │  (Sync & Help in Header)
├────────────────────────────────────────────────────────┤
│  STUDY PROGRESS                           [ 📊 Stats ↗ ]│  (Open Analytics)
│  42 cards due across 4 study collections today         │
│  [████████████████████░░░░░░░░] 88% Retention          │
├────────────────────────────────────────────────────────┤
│  YOUR STUDY DECKS                                      │
│                                                        │
│  📁 German B1 Exam Prep                      84  · 12 ▾│
│     [ ⇄ ⮌ T ☰ ]  (Review Modes)             [ ⋮ Menu ]│
│                                                        │
│     └─ 📁 Sub-Deck: Verb Prefixes            24  ·  4  │
│        [ ⇄ T ]                               [ ⋮ Menu ]│
│                                                        │
│  📁 Daily Conversations                      45  ·  0  │
│     [ ⇄ ⮌ ]  (All caught up)                 [ ⋮ Menu ]│
├────────────────────────────────────────────────────────┤
│  [ + ] (Floating Action Button)                        │
└────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Component Breakdown

### 1. Decks Overview & Study Progress Banner
- **Study Progress Card**: Displays total due cards across all collections alongside a live 30-day memory retention progress bar.
- **Stats Action Button (📊 Stats ↗)**: Tap the stats button in the card header to jump directly into the full **Learning Statistics** screen (review heatmap, 7-day forecast, and difficult word drills).
- **Header Cloud Sync (🔄)**: Tap the refresh button to trigger an instant cloud sync across your mobile and desktop devices.
- **Header Help (❓)**: In-app guide explaining deck hierarchies, review modes, and menu options.

---

### 2. Deck Hierarchy & Sub-Decks (Nesting)
- **Sub-Deck Organization**: You can nest decks inside other decks (for example: *German $\rightarrow$ B1 Vocabulary $\rightarrow$ Subjunctive Verbs*).
- **Indented Visual Tree**: Child decks appear indented under their parent deck.
- **Aggregated Counts**: A parent deck automatically includes the card counts and due reviews of all its sub-decks.

---

### 3. Review Modes per Deck
When creating or editing a deck, you choose which **study formats** that deck uses during review sessions:
- **Vocab (⇄)**: Classic prompt-to-translation flashcards.
- **Reverse (⮌)**: Native translation prompt asking you to recall the target word.
- **Cloze (T)**: Fill-in-the-blank practice inside example sentences.
- **Multiple Choice (☰)**: Fast recognition quizzes with generated distractors.
- **True / False (✓)**: Rapid verification questions.

> [!NOTE]
> Automatic card generation in review automatically uses every enabled mode that a card supports!

---

### 4. Floating Action Button (`+` FAB)
Tapping the main **`+` FAB** at the bottom of the Decks screen opens a quick 3-option menu:
1. **➕ Add deck**: Opens the *Create New Study Deck* dialog to set a name and review modes.
2. **📝 Add card**: Opens a deck selector and takes you straight to the manual card creator.
3. **📥 Import file**: Choose a deck and import cards from **Anki (.apkg)**, **CSV/Spreadsheets**, or **Lemmory (.lem)** files.

---

### 5. The Deck Context Menu ("⋮" 3-Dots Menu)
Tapping the **⋮** menu on any deck row (or long-pressing the deck) opens a comprehensive management drawer:

```
┌────────────────────────────────────────────────────────┐
│  German B1 Exam Prep                                   │
├──────────────────────────┬─────────────────────────────┤
│  [ ➕ Add Card ]         │  [ 📂 Open Deck ]           │
├──────────────────────────┼─────────────────────────────┤
│  [ 📥 Import ]           │  [ 📤 Export ]              │
├──────────────────────────┴─────────────────────────────┤
│  ✏️  Rename deck                                     ➔ │
│  📂  Move deck (Nest as sub-deck)                    ➔ │
│  🔀  Merge into another deck                         ➔ │
│  🔄  Reset progress (Restart FSRS intervals)         ➔ │
│  🗑️  Delete deck                                     ➔ │
└────────────────────────────────────────────────────────┘
```

#### What Each Action Does:
- **➕ Add Card**: Jump directly into manual card creation for this deck.
- **📂 Open Deck**: Open the deck's full study overview.
- **📥 Import**: Import existing cards into this deck from Anki `.apkg`, CSV, or `.lem` files.
- **📤 Export**: Export this deck as a `.lem` package, Anki deck, or CSV spreadsheet with a custom filename.
- **✏️ Rename deck**: Change the deck's title.
- **📂 Move deck**: Select a new parent deck to nest this deck under, or move it back to the top level.
- **🔀 Merge into another deck**: Moves all cards from this deck into another target deck and removes the empty deck container.
- **🔄 Reset progress**: Resets spaced repetition (FSRS) intervals for all cards in this deck to treat them as brand-new cards.
- **🗑️ Delete deck**: Permanently deletes the deck container (requires confirmation).

---

### 6. Inside a Deck: Deck Detail Screen
When you tap on any deck in the list, you enter its study and inspection screen:

- **Deck Stats Row**:
  - **Cards**: Total vocabulary cards inside this deck.
  - **Due Now**: Cards ready for review right now.
  - **Retention**: Average 30-day recall rate.
- **▶ Review Button**: Launches your spaced repetition study session for this deck.
- **Interactive Card List**:
  - **Single-Tap on a Row (Card Preview)**: Tapping any card opens it in **Study Preview Mode** — you see the card exactly as it appears in review (tap to flip front/back and view cloze blanks), rather than an intimidating edit form.
  - **Long-Press (Multi-Select Mode)**: Long-pressing any card enters multi-select mode with checkboxes. Select multiple cards and tap **Remove {count}** (`Trash2`) to bulk-remove them from the deck.
  - **`+` FAB**: Add another manual card directly into this deck.

---

### 7. Spreadsheet Table View
Accessible from the deck menu, the **Table View** renders a spreadsheet-like data grid of every card in your collection:

- **Word Cards Tab**: Columns for Word, Meaning, Example Sentence, Translation, Synonyms, Tags, Part of Speech, and CEFR Level.
- **Cloze Cards Tab**: Columns for Word, Meaning, Cloze Markup (`[...]`), Translation, Synonyms, Tags, and CEFR Level.
- **Use Case**: Great for quickly auditing your vocabulary list, checking translations, or verifying tags across hundreds of cards at once.

---

### 8. Manual Card Creator
Allows creating custom flashcards from scratch without searching the dictionary:

- **Word Card Mode (Basic)**:
  - Enter the headword, grammatical gender (masculine, feminine, neuter), and meaning.
  - Add an example sentence and translation (or tap **✨ Generate with AI** to let the AI write a natural sentence for you!).
  - Add optional synonyms and idioms.
- **Cloze Card Mode (Fill-in-the-blank)**:
  - Compose a context sentence.
  - Tap on any word to turn it into a cloze deletion blank (`[...]`).

---

## 💡 Common Workflows

1. **Creating a Nested Sub-Deck**:
   - Tap **+** $\rightarrow$ **Add deck** $\rightarrow$ create *"Medical Verbs"*.
   - Tap **⋮** on *"Medical Verbs"* $\rightarrow$ tap **Move deck** $\rightarrow$ select *"German B2"*.
   - *"Medical Verbs"* now appears neatly nested under *"German B2"*.
2. **Previewing a Card Before Studying**:
   - Open a deck $\rightarrow$ tap any card row in the list.
   - The card opens in study preview mode so you can test yourself on its meaning and pronunciation before starting a formal review session.
3. **Merging Two Decks Together**:
   - Tap **⋮** on the deck you want to move $\rightarrow$ tap **Merge into another deck** $\rightarrow$ select the destination deck.
   - All cards are safely transferred without losing their review history.

---

## ❓ Frequently Asked Questions

> [!TIP]
> **What is the difference between deleting a deck and resetting progress?**
> Deleting removes the deck container entirely. Resetting progress keeps all cards in the deck but resets their FSRS review intervals to day 1 so you can re-learn them from scratch.

> [!NOTE]
> **Can I export a deck to study in Anki on desktop?**
> Yes! Tap **⋮** $\rightarrow$ **Export** $\rightarrow$ choose **Anki (.apkg)**. Lemmory will generate a standard Anki deck file you can open in Anki on PC or Mac.
