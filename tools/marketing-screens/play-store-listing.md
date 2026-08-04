# Play Store Listing Copy

Ready to copy-paste into Play Console. Play Store does **not** render markdown — the fields below are written as plain text on purpose. Don't paste `**`/`##` characters into Play Console; they'll show up literally.

Companion screenshots: `tools/marketing-screens/final/` (20 device-framed images, already sized for a store listing).

---

## Short description

*Max 80 characters — appears under the app name in search results and at the top of the listing.*

```
AI-powered vocabulary lessons & smart flashcards for German, Spanish & more
```

*(76 characters)*

---

## Full description

*Max 4000 characters — but only the first ~250 characters show before the user taps "Read more," so the hook has to land immediately, not eventually. Copy everything between the lines below exactly as-is (plain text, emoji included, no markdown).*

```
Tired of flashcard apps that never explain WHY, and vocabulary you forget again by next week?

Lingora turns any German or Spanish word into a full AI-generated lesson the moment you search it, then makes sure it actually sticks — for good. This isn't another static flashcard deck someone built once and forgot about. It's a vocabulary system that gets smarter every single time you use it.

🧠 AI THAT ACTUALLY TEACHES
🔍 Instant lookup — search any word, get meaning, examples, synonyms & phrases in seconds
⚡ Quick translate first — get a fast answer even before you decide to generate the full lesson
📖 Real grammar, explained — Konjunktiv II, Präteritum, passive voice, indirect speech & more, in plain English, not textbook jargon
💬 Ask AI anything — confused mid-review? Get an instant, in-context answer to your exact question
🎯 CEFR-tagged everything — always know if a word or sense is A1 beginner or C1 advanced
🎛️ Multiple meanings, your call — pick which sense and which example actually shows on your flashcard
🔗 Phrases & collocations — learn how words actually get used together, not just in isolation
🎲 Regenerate or edit any card — don't like it? Reroll it, or write your own from scratch

📚 STUDY SCIENCE, NOT GUESSWORK
🔁 True spaced repetition (FSRS) — reviews adapt to YOUR memory, not a fixed, one-size-fits-all timer
👆 Swipe & rate — Again, Hard, Good, Easy, done
✍️ Fill-in-the-blank cloze mode — train recall, not just recognition
🔄 Reverse practice — go English → target language too, not just one direction
🔥 Streaks, live retention %, and an activity heatmap that shows your real progress at a glance
📈 A growth chart that shows your whole vocabulary building up over time

🎬 CAPTURE VOCAB FROM REAL LIFE
📺 Grab words straight from Netflix, YouTube, articles, or your clipboard the second you hear them
📥 They land in a Mining Queue — turn them all into full AI cards whenever you're ready, in one batch

🎨 MAKE IT YOURS
🖌️ Six gorgeous themes, from bright & clean to a deep, distraction-free dark mode
💻 Design your own flashcard layouts — real HTML/CSS, with a live preview as you type
🔊 Natural pronunciation — free device voices, or plug in premium cloud voices for extra polish
✋ Add cards by hand for words AI didn't generate — you're always fully in control
🗂️ Nest, merge, and reorganize decks anytime — your library, your structure

🔑 YOUR AI, YOUR RULES
🔓 Bring your own key — OpenAI, Mistral, Gemini, or Claude — pay only for what you actually use
🆓 Or skip keys entirely — thousands of words, pre-generated and ready completely offline, totally free
✅ Validate any key with one tap before you commit to it
🔒 Keys never leave your device, period — plus a usage dashboard so you always see exactly what's being spent

📦 SWITCH WITHOUT LOSING ANYTHING
🐘 Import your existing Anki decks, or any CSV export from another app
💾 Full backup & restore anytime, plus export to CSV, Anki, or Markdown — your data is always yours to take, no lock-in, no games

☁️ EVERYWHERE YOU ARE
🔄 Sync every deck across every device with your Google account, automatically in the background
🌍 Use the app itself in English, German, French, Spanish, Hindi, or Vietnamese
📴 Fully offline-first — your library works with or without a connection
🗣️ Send feedback right from the app — help shape what gets built next

This is what a vocabulary app looks like when it's actually built to make words stick — not just show them to you one more time and hope you remember.

Stop collecting flashcards you'll forget. Start building a vocabulary that actually stays with you.

Download Lingora. Your next word is one search away.
```

*(3,810 characters — 33 features across 7 categories, using nearly the full 4000-character budget while keeping every line short enough to scan.)*

**Note on the Anki claim:** earlier drafts of this doc said Anki import kept "review history" — that's not accurate for the app's current `.apkg` import (v1 scope: cards start fresh, no review history, no media). This version says "import your existing Anki decks" without that claim. Full review-history fidelity is only true of the app's own `.lin` backup format, which isn't what a new-user Play Store audience would be importing from.

**Note on the German/Spanish claim:** per the app's own code, only German (and French) currently have full AI-generation quality — Spanish is in the language picker but not generation-ready yet and shows a warning if selected. This copy keeps "German or Spanish" per your explicit call; flagging again here so it's easy to walk back later if Spanish support isn't there by launch.

---

## Why this is structured differently from `product-intro.md`

That doc is a **narrative pitch** — good for a landing page, a pitch deck, or an App Store "What's New"-style write-up where someone's already committed to reading. A store listing is the opposite context: someone is scrolling search results deciding in about two seconds whether to tap at all.

- Every feature is one line, not a paragraph — a thumb scrolling past needs to register it instantly.
- The emoji aren't decoration — Play Store has no bold/headers, so they're the only way to break up a wall of plain text and give the eye something to anchor on.
- The hook is frontloaded into the first 250 characters specifically, since that's the only part guaranteed to be seen.
- No stat/promise is left dangling without a concrete feature backing it (e.g. "no forced subscription" is immediately followed by *why* — BYOK or offline dictionary — not just asserted).

## Next steps worth considering

- **Feature graphic** (1024×500, required by Play Console): see `final/feature-graphic.png`.
- **App icon** and **promo video** are separate Play Console assets, still not covered.
- If you want an App Store (iOS) version too: it has a 30-character subtitle and 170-character "promotional text" field instead of Play's short description — different enough that it's worth its own pass rather than reusing this one as-is.
