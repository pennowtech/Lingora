# ⛏️ Sentence Mining & Capture Queue

**Sentence mining** is the practice of capturing natural, real-world sentences from books, articles, videos, and conversations in your target language, and turning them into rich flashcards.

The **Mining Queue** in Lemmory acts as a smart staging holding area where captured text is curated and reviewed before any AI generation or card creation takes place.

---

## 🚀 Screen Architecture & Key Components

```
┌────────────────────────────────────────────────────────┐
│  Mining Queue                                     [ + ]│  (Header & Add Button)
├────────────────────────────────────────────────────────┤
│  HOLDING AREA                               3 Captures │
│                                                        │
│  ☑️ "Wir schlendern am Nachmittag durch den Park."     │
│     📰 Article · 2 hours ago                    [ 🗑️ ] │
│                                                        │
│  ☑️ "Das Unternehmen möchte neue Mitarbeiter..."      │
│     📋 Clipboard · 5 hours ago                  [ 🗑️ ] │
│                                                        │
│  ◻️ "Wegen des Sturms musste die Bahn..."              │
│     ✏️ Manual · Yesterday                       [ 🗑️ ] │
├────────────────────────────────────────────────────────┤
│  [ ✨ Generate Cards from Selected (2) ] (Sticky Bottom)
└────────────────────────────────────────────────────────┘
```

---

## 📍 How to Open the Mining Queue

You can open the Mining Queue in two ways:
1. **From the Home Dashboard**: Tap the **Mining queue** action tile right below the daily load banner.
2. **From the Bottom Tab Bar**: Tap the **Mine** tab.

---

## 🔍 Detailed Component Breakdown

### 1. The Staging Holding Area
- **No Immediate AI Costs**: Sentences captured into the queue are stored locally on your device as raw text. AI is only called when you explicitly choose to generate cards.
- **Source Badges & Timestamps**: Every captured sentence clearly displays where it came from:
  - 📰 **Article** (Web reader or news)
  - 🎥 **Video** (YouTube / Netflix)
  - 📋 **Clipboard** (Copied text)
  - ✏️ **Manual** (Hand-typed)
  - 📤 **Share Sheet** (Shared from external apps)
- **Selection Checkboxes**: All items are selected by default. Tap any row to check or uncheck it for batch processing.
- **Delete Button (🗑️)**: Remove unwanted sentences with a single tap.

---

### 2. 📥 Three Ways to Capture Sentences

#### A. One-Tap Clipboard Paste
- If you copy any foreign sentence on your phone (e.g. from an eBook or messaging app), opening the Mining Queue automatically detects the clipboard text and lets you add it with a single tap.

#### B. System Share Sheet & Android Process Text
- **Share Sheet**: In any browser or app, highlight a sentence $\rightarrow$ tap **Share** $\rightarrow$ select **Lemmory**. The sentence is placed directly into your Mining Queue in the background.
- **Android Process Text**: Highlight text $\rightarrow$ tap the system three dots $\rightarrow$ tap **"Share to Lemmory"**.

#### C. Manual Add Button (`+`)
- Tap the **+** button in the header to type or paste a custom sentence manually.

---

### 3. ✨ Batch AI Card Generation

When you are ready to turn your collected sentences into study cards:

1. Tap **Generate cards** at the bottom of the screen.
2. A **Deck Picker** appears — select the destination study deck where these cards should be saved.
3. Lemmory's automated AI pipeline processes your selected captures:
   - **Lemma Extraction**: Identifies the primary vocabulary word and its part of speech.
   - **Translations & Explanations**: Generates accurate translations and concise usage notes in your native language.
   - **Interactive Cloze Creation**: Automatically creates fill-in-the-blank blanks (`[...]`) centered around the captured sentence.
4. The newly created cards appear directly in your study deck, ready for daily review!

---

## 💡 Common Workflows

1. **Daily Reading Sentence Mining**:
   - While reading news or books online in your target language, copy interesting or unfamiliar sentences.
   - Paste or share them into Lemmory's Mining Queue throughout the day.
   - At the end of the day, open the Mining Queue, review your captures, and tap **Generate cards** to convert your entire day's reading into fresh flashcards at once.
2. **Selective Batching**:
   - If you captured 10 sentences but only want to study 3 today, uncheck the other 7.
   - Tap **Generate cards** — only the 3 checked sentences will be turned into cards, while the remaining 7 stay safely in the queue for another day.

---

## ❓ Frequently Asked Questions

> [!TIP]
> **Can I edit a sentence before generating a card?**
> Yes! You can discard any sentence you don't like, or edit the generated flashcard directly in your deck after creation.

> [!NOTE]
> **Do captured sentences expire?**
> No. Sentences stay in your local Mining Queue indefinitely until you generate them into cards or delete them.
