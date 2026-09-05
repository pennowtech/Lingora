# 📥 Importing and Exporting Cards

The **Import/Export** tools move vocabulary in and out of Lemony without retyping anything: bring
in a spreadsheet, an existing Anki collection, or a deck someone shared from their own Lemony app -
and send any deck back out the same way, whether that's for backup, sharing, or studying in Anki
on a desktop computer.

![The Import/Export flow, showing the pick file, map fields, and preview steps](import-export-wizard)

---

## 🔍 Detailed Component Breakdown

### 1. The Three Import Formats
- **CSV**: A plain spreadsheet you control completely - column headers you map yourself. Best for
  word lists you've built in Excel/Google Sheets, or exported from a textbook/course.
- **Anki (.apkg)**: Reads an actual exported Anki/AnkiDroid/AnkiMobile collection file. Brings an
  existing Anki deck's words into Lemony's own spaced-repetition engine.
- **Lemony (.lem)**: Lemony's own native format. The only one that carries a card's **full study
  progress** (FSRS state and complete review history) along with it - used when someone shares a
  deck from their own Lemony app, or when you move one of your own decks to a new device.

### 2. The Import Wizard (CSV & Anki)
Both formats share the same four-step wizard:
1. **Pick file**: Choose a `.csv` or `.apkg` file from your device.
2. **Map fields & choose card type**: Assign your file's columns (CSV) or note fields (Anki) onto
   Word / Meaning / Cloze sentence / Example / Example translation / Synonyms, and choose whether
   this pass creates **Regular (word/meaning)** or **Cloze (fill-in-the-blank)** cards. Also pick
   (or create) the destination deck here.
3. **Preview**: Every row is checked and shown as **OK**, **Duplicate** (the word already exists
   somewhere in your library), or **Error** (missing required content - unchecked and unimportable
   until fixed). Uncheck anything you don't want.
4. **Import**: Confirm, and every checked row becomes a real card, with a progress readout and a
   final imported/skipped/failed summary.

> [!NOTE]
> Anki's own deck structure is not recreated - every note lands in the **one** Lemony deck you
> picked in step 2, regardless of which Anki deck it came from. Anki deck names only appear as a
> label in the preview so you can see where each note originated.

### 3. Regular vs. Cloze Cards - One Choice Per Pass
The Regular/Cloze choice in step 2 applies to the **whole file, every row, for that one import** -
there's no per-row toggle and no automatic guessing (Anki note types vary too widely for that to
be reliable). Choosing Cloze requires real `{{c1::word}}` markup somewhere in a mapped column, or
the row is flagged as an Error.

**Want both a Regular and a Cloze card for the same words?** Import the same file twice: once as
Regular, once as Cloze, picking **Keep both** as the duplicate policy on the second pass (see
[section 5](#5-duplicate-handling)). Each word ends up with two independent cards sharing the same
vocabulary entry, each on its own review schedule.

### 4. The Lemony (.lem) Import Wizard
A shorter flow, since the file already contains real structured Lemony data:
1. **Pick file**.
2. **Pick the source deck** (only shown if the file bundles more than one deck).
3. **Pick the target deck** (existing or new).
4. **Preview**, then **Import**.

There's no field mapping and no card-type choice - `.lem` import brings across every meaning,
example, synonym, phrase, and Cloze variant a card already had, **plus its full FSRS state and
review history**. It's the only import format that does.

### 5. Duplicate Handling
When an imported word already exists anywhere in your library, you choose one policy for the whole
import:
- **Skip** (default): leave the existing word untouched.
- **Keep both**: add a second, independent card for the same word.

Individual duplicate rows can still be unchecked in the preview to make a one-off exception to
whichever policy you picked.

### 6. How Imported Cards Fit Your Deck's Review Modes
A deck's review modes (Vocab, Reverse, Cloze, Multiple Choice, True/False) and what you actually
imported don't always line up perfectly - and that's handled gracefully, never as a dead end:
- **Cloze-enabled deck, Regular cards imported**: those cards are simply tested as Vocab instead,
  automatically, since there's no blanked sentence to show.
- **Vocab-only deck, Cloze cards imported**: no gap at all - Cloze import always creates a real
  translation too, so those cards work as Vocab cards with zero extra step.
- **Multiple Choice / True-False**: nothing to import for these at all - they're built live at
  review time from the card's own translation plus other cards' translations as wrong answers.
  They switch on automatically the moment your deck has enough other cards (3 for Multiple Choice,
  1 for True/False).

> [!TIP]
> The import screen now warns you **before you import** whenever the card type you picked doesn't
> match what the destination deck's review modes expect - right where you choose the deck and card
> type in step 2.

### 7. Exporting a Deck
From any deck's **⋮** menu, **Export** offers:
- **CSV**: A re-importable spreadsheet - word, meaning, example, and more.
- **Anki (.apkg)**: A standard Anki deck file, openable in Anki on PC/Mac or AnkiDroid/AnkiMobile.
  Cards start fresh there - Anki has no concept of Lemony's FSRS state.
- **Markdown**: A readable word - meaning - example list, for sharing or printing. Not
  re-importable.
- **Lemony (.lem)**: The full-fidelity format - every meaning, example, Cloze variant, tag, and
  the deck's complete FSRS/review history, in one file. Export-only for a single deck at a time.

---

## 💡 Common Workflows

1. **Getting both Regular and Cloze cards from one file**:
   - Import the file as **Regular** into your deck.
   - Import the *same file again*, this time as **Cloze**, choosing **Keep both** for the
     duplicate policy.
   - Every word now has two independently-scheduled cards.
2. **Moving a deck (with your progress) to a new phone**:
   - On the old device: **⋮** $\rightarrow$ **Export** $\rightarrow$ **Lemony (.lem)**.
   - On the new device: **Import** $\rightarrow$ **Lemony (.lem)** $\rightarrow$ pick the file.
   - Your review history and FSRS scheduling come across exactly as they were.
3. **Bringing an existing Anki deck into Lemony**:
   - Export your Anki collection as `.apkg` from Anki Desktop (or share it from AnkiDroid/
     AnkiMobile).
   - **Import** $\rightarrow$ **Anki (.apkg)** $\rightarrow$ map your note's fields $\rightarrow$
     pick a Lemony deck.
   - Every note starts fresh in Lemony's own FSRS scheduler.

---

## ❓ Frequently Asked Questions

> [!NOTE]
> **Does importing an Anki deck bring over how well I already knew those words?**
> No. Anki's own scheduling data has no reliable translation into Lemony's FSRS algorithm, so
> every CSV- or Anki-imported card starts brand new. Only `.lem` import carries real study
> progress across, because it's Lemony's own native format.

> [!TIP]
> **My deck's review modes are Cloze-only, but I only have a plain word/meaning spreadsheet - do I
> have to build Cloze content before I can use this deck?**
> No. Import as Regular; those cards are simply tested as Vocab-style cards instead of
> fill-in-the-blank until Cloze content exists for them too (a second import pass, or a
> hand-written Cloze from the word's own detail screen later).

> [!NOTE]
> **Can I mix CSV, Anki, and Lemony imports into the same deck?**
> Yes - a deck doesn't remember or care which import format created any particular card.
