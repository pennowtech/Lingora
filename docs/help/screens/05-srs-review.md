# 🧠 Spaced Repetition (SRS) Review Engine

The **Review Screen** is where memory consolidation happens. Lemmory uses modern cognitive science algorithms (FSRS and SM-2) to present cards just as you are about to forget them, maximizing long-term retention with minimal study time.

---

## 🚀 Key Features

### 1. Advanced Scheduling Engines (FSRS & SM-2)
- **FSRS (Free Spaced Repetition Scheduler)**: State-of-the-art machine learning-based interval calculation that adapts to card difficulty and your personal retention rate target (80%–95%).
- **SM-2 (Classic SuperMemo)**: Proven classic interval algorithm for users familiar with traditional Anki workflows.

### 2. Multi-Modal Review Modes
- **Standard Flip Mode**: View question/prompt $\rightarrow$ Tap to reveal answer $\rightarrow$ Rate recall:
  - **Again**: Complete lapse, card repeats soon.
  - **Hard**: Difficult recall, interval grows slightly.
  - **Good**: Normal recall, optimal interval calculated.
  - **Easy**: Effortless recall, interval increases significantly.
- **Cloze Fill-in-the-Blank**: Hidden words are revealed on tap or typing.
- **Audio-First Mode**: Hear the native sentence/word pronunciation before revealing the written text.
- **Multiple Choice Mode**: Fast recognition test with generated distractors.

### 3. Gesture Controls & Keybindings
- **Mobile Gestures**:
  - Swipe Left $\rightarrow$ **Again**
  - Swipe Right $\rightarrow$ **Good**
  - Swipe Up $\rightarrow$ **Easy**
- **Desktop & Keyboard Shortcuts**:
  - `Space` / `Enter` $\rightarrow$ Reveal Answer
  - `1` $\rightarrow$ Again | `2` $\rightarrow$ Hard | `3` $\rightarrow$ Good | `4` $\rightarrow$ Easy
  - `Z` / `Cmd+Z` $\rightarrow$ Undo last rating

### 4. Review Safety & Undo
- Tapping **Undo** reverts the last review rating, restores the previous interval, and lets you re-grade the card immediately.

### 5. Session Summary & Analytics
- Post-session report displaying cards studied, retention percentage, time elapsed, and next review schedule forecast.

---

## 💡 How to Use

1. **Launching a Study Session**:
   - Tap **Start Daily Review** on Home to study all due cards, or tap **Review** on a specific deck.
2. **Grading Your Recall Honestly**:
   - Look at the front prompt. Try to recall the meaning, gender, and pronunciation before tapping.
   - Tap **Show Answer** to reveal the definition, audio, and example sentences.
   - Choose the grade that reflects your true effort (**Again**, **Hard**, **Good**, **Easy**).
3. **Using Audio Autoplay**:
   - Configure in Settings whether pronunciation audio plays automatically upon revealing the answer.

---

## ❓ Frequently Asked Questions

> [!IMPORTANT]
> **What should I grade if I got the meaning right but the grammatical gender wrong?**
> In gendered languages (like German or French), it is best to grade **Again** or **Hard** so you review the article sooner.

> [!TIP]
> **How does FSRS differ from SM-2?**
> FSRS models memory retrievability and stability dynamically, resulting in up to 30% fewer reviews while maintaining your target retention percentage.
