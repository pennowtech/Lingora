# ✨ Word of the Day

> [!IMPORTANT]
> **This feature requires an AI provider.** Word of the Day only runs when at least one AI provider key is configured and validated in **Settings → AI Providers** (`tier === 'full'`). On the free/offline tier (dictionary lookups only, no AI key), the Home screen shows an **Offline Mode** card instead, and no daily notification is ever scheduled — there is nothing to opt out of, it simply never starts.

**Word of the Day** picks one word or short phrase a day — genuinely new to you, pitched at your CEFR level — and surfaces it two ways: a card on the Home dashboard, and a local daily notification, so you see something worth learning even on a day you don't open the app.

---

## 🚀 How It Fits Together

```
┌────────────────────────────────────────────────────────┐
│  Home                                                   │
├────────────────────────────────────────────────────────┤
│  WORD OF THE DAY                         ✨ AI Discovery│
│  schlendern ➔                                           │
│  To stroll or walk in a leisurely, relaxed manner.      │
└────────────────────────────────────────────────────────┘
                          │ tap
                          ▼
┌────────────────────────────────────────────────────────┐
│  ✨ Word of the Day                                 [X] │
│  schlendern                                        🔊   │
│  To stroll or walk in a leisurely, relaxed manner.      │
│  "Wir schlendern am Nachmittag durch den Park."          │
│  "We stroll through the park in the afternoon."          │
│  [ Explore Full Details ➔ ]                              │
└────────────────────────────────────────────────────────┘

Daily local notification (device clock, default 9:00 AM):
┌────────────────────────────────────────────────────────┐
│  ✨ Word of the Day: schlendern                         │
│  To stroll or walk in a leisurely, relaxed manner.      │
└────────────────────────────────────────────────────────┘
                          │ tap
                          ▼
          opens the exact same popup shown above
```

---

## 🔍 Detailed Component Breakdown

### 1. Picking the word

- **CEFR-tailored**: the AI is asked for a word appropriate to your current default level (Settings → Learning), so a Word of the Day at A2 looks nothing like one at C1.
- **Never a word you already have**: every lemma already in your library, plus a rolling 60-word history of previously-shown Words of the Day, is sent to the AI as an explicit exclude list — the prompt is told never to pick one of them or an obvious variant.
- **Verified, not just asked nicely**: the app checks the returned word against that same exclude list itself. If the AI ignores the instruction and repeats something anyway, it's retried automatically (up to 3 attempts, with the rejected word added to the exclude list each time) before falling back to accepting the last result.
- Comes with a short (≤30-word) explanation in your native language, plus one example sentence with its translation.

### 2. When it refreshes

- Regeneration is checked **every time the app comes to the foreground** — cold launch, switching back from another app, or resuming from the background — not just the first time you open the app that day. A stale local-calendar-date (`YYYY-MM-DD`, device clock) is what triggers a new word; once today's word already exists, the check is an instant no-op, so this costs nothing extra.
- Changing your CEFR level or your target/native language pair in Settings also immediately triggers a fresh word at the new level — you're never shown an old word tagged with a level you've since moved away from.
- Nothing is generated more than once per calendar day, no matter how many times the app is opened.

### 3. The daily notification

- A **local, on-device notification** (no server/push infrastructure involved) fires once a day at a fixed time — **9:00 AM by default**, changeable in **Settings → Learning → Word of the Day reminder** (hourly options, 6:00 AM–10:00 PM).
- It's a genuinely repeating daily alarm, so it still fires on a day you never open the app — with whichever word was last generated, since nothing can regenerate content without the app running. The very next time you do open the app, the word refreshes and the *next* day's notification is rescheduled with fresh content (the stale one is cancelled first, so you're never left with two pending at once).
- Requires notification permission — you're prompted for it once, the first time a word is ready to schedule; if you deny it, the Home card and popup still work, you just won't get the daily nudge.
- **Tapping the notification opens the same summary popup** described above (not straight to the full word detail screen) — from there, **Explore Full Details** is one more tap away if you want it.

### 4. The Home card & popup

- **With AI configured**: a compact card with the word, a one-line teaser, and an "AI Discovery" badge. Tapping it opens the popup — headword with audio pronunciation, the full explanation, an example sentence with its translation, and **Explore Full Details** to open the real Word Detail screen and add it to a deck.
- **Without AI configured**: an "Offline Mode" card instead. Tapping it opens the AI setup flow (add a key, e.g. Gemini's free tier, or install offline dictionaries) rather than any word content, since there's nothing to show yet.

### 5. Storage & privacy

- Today's word, the notification's own id (so a refresh can cancel the old one cleanly), and the 60-word history all live in on-device SecureStore only — nothing about which words you've seen leaves the device except the generation request itself, sent to whichever AI provider you've configured.

---

## 💡 Common Workflows

1. **Morning routine**: the notification arrives at your chosen time → tap it → read the popup → tap **Explore Full Details** if it's worth adding to a deck, or just close it and move on.
2. **Changing when it arrives**: Settings → Learning → **Word of the Day reminder** → pick a new hour. If today's word already exists, the standing notification is rescheduled to the new time immediately.
3. **Turning it into a real flashcard**: from the popup, **Explore Full Details** takes you to the full Word Detail screen, where the word behaves like any other lookup — add it to a deck from there.

---

## ❓ Frequently Asked Questions

> [!NOTE]
> **Why does my Word of the Day card say "Offline Mode"?**
> No AI provider is configured yet. Add a key in **Settings → AI Providers** (Google Gemini has a free tier) — the card switches over automatically once one is validated.

> [!TIP]
> **I saw the same word for several days in a row even though the notification kept firing — is that a bug?**
> It was — a stale word could persist for days if the app was simply resumed from the background rather than fully relaunched, since the regeneration check used to only run once per app session. It now re-checks every time the app comes to the foreground, so this shouldn't happen anymore; if it does, force-quitting and reopening the app will always regenerate it immediately.

> [!NOTE]
> **Does the daily notification cost extra AI usage beyond what I already see in-app?**
> No. The notification only ever displays whatever was last generated during a normal in-app refresh — it never triggers a generation by itself.
