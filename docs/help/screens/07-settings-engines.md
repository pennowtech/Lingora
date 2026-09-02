# ⚙️ Settings & Configuration

The **Settings** screen is your control center in Lemmory. It allows you to tailor everything to your learning style — from themes and text sizing to Bring-Your-Own-Key (BYOK) AI engines, high-fidelity neural voices, FSRS spaced repetition algorithms, card template styling, and cross-device cloud sync.

---

## 🚀 Screen Architecture & Key Sections

```
┌────────────────────────────────────────────────────────┐
│  Settings                                              │
├────────────────────────────────────────────────────────┤
│  🔍 Search settings... (e.g. "tts", "gemini", "dark")  │
├────────────────────────────────────────────────────────┤
│  STUDY & SPEECH                                        │
│  🔊 Audio & Pronunciation            (ElevenLabs · 1.0x)│
│  🎓 Language & Level                 (German · B1 · FSRS)│
├────────────────────────────────────────────────────────┤
│  AI & TRANSLATION                                      │
│  ✨ AI Providers & Models            (Gemini 2.0 Flash) │
│  🌐 Translation Services             (Google Translate) │
├────────────────────────────────────────────────────────┤
│  LIBRARY & CONTENT                                     │
│  📦 Import & Export                  (Anki, CSV, .lem)  │
│  🎨 Card Templates                   (Default Liquid)   │
│  📚 Local Dictionaries               (3 Offline Packs)  │
├────────────────────────────────────────────────────────┤
│  SYSTEM & ACCOUNT                                      │
│  🔄 Cloud Sync                       (Google Drive Sync)│
│  🎛️ General & Appearance             (Dark OLED · Auto) │
│  💬 Send Feedback                    (GitHub Issues)    │
│  ℹ️ About Lemmory                    (v1.2.0 · What's New)
└────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Settings Breakdown

### 🔎 Fast Settings Search Bar
At the top of the Settings screen, an instant search bar indexes every setting and keyword across the app:
- Type **"voice"**, **"tts"**, or **"speed"** $\rightarrow$ jumps directly to Audio & Pronunciation.
- Type **"anki"**, **"apkg"**, or **"csv"** $\rightarrow$ jumps to Import & Export wizards.
- Type **"gemini"**, **"claude"**, or **"api key"** $\rightarrow$ jumps to AI Providers.
- Type **"dark mode"** or **"theme"** $\rightarrow$ jumps to General & Appearance.

---

## 1. 🎓 Study & Speech

### A. 🔊 Audio & Pronunciation
Configure how vocabulary words, phrases, and example sentences are spoken aloud throughout the app.

- **Synthesizer Engines**:
  - **On-Device (Native OS)**: High-speed, 100% offline text-to-speech provided directly by iOS or Android. Free, reliable, and requires no API key or internet connection.
  - **OpenAI Audio TTS**: Ultra-natural neural voices powered by `gpt-4o-mini-tts`, featuring newest high-fidelity voices (`marin` ★, `cedar` ★) alongside classics (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`).
  - **ElevenLabs**: Human-like expressive voices (`eleven_multilingual_v2`). Choose from your personal ElevenLabs voice library or manually paste any cloned voice ID.
  - **Deepgram**: Ultra-low-latency, real-time voice synthesizer powered by **Aura-2** models tailored for English, German, Spanish, French, and multilingual speech.
  - **Google Cloud TTS**: High-fidelity WaveNet and Neural2 global voice catalog.
- **Voice Selection & Custom Mode**: Pick preferred male or female voices tailored to your target language, or switch to manual entry to paste custom voice IDs.
- **Speed & Pitch Controls**: Adjust speech playback rate (from 0.5x slow beginner pronunciation up to 2.0x) and fine-tune voice pitch.
- **Real-Time Usage Tracking**: Monitor character consumption and request counts per provider, with a single-tap reset.
- **Sample Audio Preview**: Tap **Test this provider** or **Test active engine** to hear your target language sample phrase before applying changes.
- **Automatic Fallback to Device**: If a cloud provider is unreachable or runs out of credits, Lemmory automatically falls back to the device voice so your flashcard study is never interrupted by silence.
- **Audio Cache Management**: Caches generated pronunciations on your device to minimize latency and bandwidth consumption. Tap **Clear Audio Cache** to free up local storage anytime.

---

### B. 🎓 Language & Level
Define your active learning pair, default difficulty level, review session sizes, and daily study reminders.

- **Language Pair Configuration**:
  - **"I speak" (Native Language)**: The language used for definitions, translations, grammar breakdowns, etymology notes, and AI tutor explanations (e.g. English, German, Spanish, French, Hindi, Vietnamese, Japanese).
  - **"I'm learning" (Target Language)**: The language you are actively studying. All dictionary lookups, generated example sentences, cloze blanks, and text-to-speech audio automatically use this language.
  - **Smart App Language Sync**: When you change your native language, Lemmory offers a one-tap option to update the entire app's interface language to match. But that's not required. You can set your app interface to any language. For example, you can have your app language set to English while having explanations in Hindi and learning German.
- **Default CEFR Proficiency Level**: Choose your baseline difficulty (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`):
  - **A1–A2 (Beginner)**: AI generates short, simple sentences with foundational vocabulary and common daily verbs.
  - **B1–B2 (Intermediate)**: AI introduces compound sentences, subordinate clauses, and situational idioms.
  - **C1–C2 (Advanced)**: AI crafts sophisticated literary contexts, specialized terminology, and subtle semantic nuances.
- **Cards Per Session (Session Limit)**:
  - Caps how many due cards are pulled into a single review session (e.g. 10, 20, 30, 50, or No Limit), prioritizing the most overdue cards first.
  - Prevents study burnout while allowing you to tap **Practice more** for another focused round right away.
- **Word of the Day Daily Notification**:
  - Schedule an hourly reminder (6:00 AM – 10:00 PM) to deliver your curated daily vocabulary word right when you prefer to study.
- **Spaced Repetition Algorithm**:
  - **FSRS (Free Spaced Repetition Scheduler)** *(Recommended)*: State-of-the-art modern algorithm based on memory stability and retrievability, resulting in significantly fewer daily reviews with higher long-term recall.
  - **SM-2**: The classic 4-button spaced repetition algorithm used by traditional flashcard apps.
  - **Target Retention**: Customize your desired memory recall rate (e.g. 90%).

---

## 2. 🤖 AI & Translation

### A. ✨ AI Providers & Models (Bring-Your-Own-Key)
Connect personal API keys from leading AI providers. Lemmory processes generations directly from your device to the AI provider with zero middleman servers.

> **Privacy Notice**: Pick your active AI engine to generate word definitions, and for smart card creation. Be aware that third-party AI services might train on prompts under certain plans (especially on free tiers and select paid accounts). Have questions? You can reach out directly via the in-app feedback form (**Settings > About & Support > Send Feedback**).

```
┌────────────────────────────────────────────────────────┐
│  Active Generation Provider                            │
│  Pick your active AI engine to generate word           │
│  definitions, and for smart card creation...           │
│  [ Contact us → ]                                      │
├────────────────────────────────────────────────────────┤
│  Google Gemini                          [ Active ✓ ]   │
│  Gemini 3.5 Flash Lite · Ultra-Light (Default)         │
│  [ Validated Key: ••••••••••••abcd ]                   │
│  [ Profile: Gemini 3.5 Flash Lite ▾ ]                  │
├────────────────────────────────────────────────────────┤
│  OpenAI                                                │
│  GPT-4o Mini · Balanced Generation                     │
│  [ Get key from OpenAI ↗ ]                             │
├────────────────────────────────────────────────────────┤
│  Groq                                                  │
│  Llama 3.3 70B · Ultra-Fast LPUs                       │
│  [ Get key from Groq ↗ ]                               │
└────────────────────────────────────────────────────────┘
```

- **Supported AI Providers**:
  - **Google Gemini**: Generous free-tier limits via Google AI Studio (`gemini-3.5-flash-lite`, `gemini-2.5-flash`).
  - **Groq**: Ultra-low latency open models running on LPU chips (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`).
  - **OpenAI**: Industry-standard structured linguistic output (`gpt-4o-mini`, `gpt-4.1-mini`, `gpt-4o`, `gpt-3.5-turbo`).
  - **Mistral**: European-hosted, privacy-conscious models (`mistral-small-latest`, `mistral-medium-latest`).
  - **Claude (Anthropic)**: Exceptional linguistic reasoning and natural idiom explanations (`claude-haiku-4-5-20251001`, `claude-sonnet-5`).
  - **DeepSeek**: High capability and economical pricing (`deepseek-chat`, `deepseek-reasoner`).
- **Curated Model Profiles**: Select preset profiles tagged by performance (e.g. *⚡ Ultra-Light*, *🌟 Recommended*, *🧠 Deep Quality*).
- **Custom Model Override**: Advanced users can type any custom model identifier string supported by the provider.
- **Draft Model Selection**: Selecting a new model in the drawer acts as a non-destructive draft. Your existing active connection continues running uninterrupted until you tap **`Test & Switch Model`**.
- **Direct Portal Links (`Get key from... ↗`)**: One-tap shortcut opens the provider's developer portal in your browser to generate a key. Once a key is validated, the setup link automatically collapses into an advanced drawer.
- **Security & Privacy**: API keys are stored solely inside your device's native hardware-backed secure storage (**Apple Keychain** on iOS, **Android Keystore** on Android).
- **Delete All AI Keys**: A dedicated one-tap safety button to securely wipe all stored API keys from device storage.

---

### B. 🌐 Translation Services
Choose which engine powers instant translations when looking up new words in Search:
- **Google Translate**: Fast, free bilingual translation engine with broad language support.
- **DeepL**: Renowned for natural European language phrasing. Supports custom DeepL Free and DeepL Pro API keys.
- **AI Translation**: Uses your active AI provider for context-aware translations.

---

## 3. 📦 Library & Content

### A. 📦 Import & Export
Seamlessly transfer your vocabulary decks between apps, spreadsheets, and devices.

```
┌────────────────────────────────────────────────────────┐
│  IMPORT                                                │
│  📥 Anki Package (.apkg)          ➔                    │
│  📥 Spreadsheet (CSV / TSV)       ➔                    │
│  📥 Lemmory Package (.lem)        ➔                    │
├────────────────────────────────────────────────────────┤
│  EXPORT                                                │
│  📤 Export All Decks as .lem      ➔                    │
│  📤 Export Complete Collection    ➔                    │
└────────────────────────────────────────────────────────┘
```

- **Anki (.apkg) Import Wizard**:
  - Imports Anki decks with full preservation of front/back text, media, custom tags, and deck structure.
  - Automatic duplicate detection prevents cluttering your collection with existing words.
  - Interactive preview table lets you review imported cards before finalizing.
- **CSV / Spreadsheet Import Wizard**:
  - Import vocabulary lists from Excel, Google Sheets, or CSV files.
  - **Visual Column Mapper**: Easily map your spreadsheet columns (e.g. *Column A $\rightarrow$ Word*, *Column B $\rightarrow$ Translation*, *Column C $\rightarrow$ Example*).
  - Preview data grid verifies correct alignment before import.
- **Lemmory Package (.lem) Export & Import**:
  - The native backup format for Lemmory.
  - Exports complete decks, custom notes, cloze blanks, and spaced repetition (FSRS) learning histories for lossless backup and cross-device sharing.

---

### B. 🎨 Card Templates
Customize how flashcards look and render during review:
- **Liquid Template Engine**: Flashcards use standard Liquid markup tags (`{{word}}`, `{{meaning}}`, `{{example}}`, `{{audio}}`, `{{synonyms}}`, `{{partOfSpeech}}`).
- **Front & Back Editor**: Independently customize the question and answer sides of your cards.
- **Live Preview Window**: See immediate visual feedback of your card layout as you edit template code.
- **Restore Defaults**: Safely reset to Lemmory's clean default card template anytime.

---

### C. 📚 Local Dictionaries (Word Guides)
- Manage and download offline linguistic databases and curated starter decks.
- Allows full dictionary searches, inflection tables, and grammatical gender lookup without requiring internet or AI API calls.

---

## 4. 🎛️ System & Account

### A. 🔄 Cloud Sync
Keep your study progress synchronized across your phone, tablet, and desktop:
- **Google Account Connection**: Sign in securely with Google to enable automatic cloud sync.
- **Continuous Syncing**: Automatically uploads new cards, deck modifications, and review ratings.
- **Manual Sync Button**: Tap **Sync Now** to force an instant reconciliation between your device and the cloud.
- **Conflict Resolution**: Smart merge logic ensures review history is never lost when studying offline across multiple devices.

---

### B. 🎛️ General & Appearance
- **Theme Selection**:
  - **Light Mode**: Crisp, high-contrast daytime interface.
  - **Dark Mode**: Sleek dark interface that reduces eye strain.
  - **System OLED Black**: Deep pitch-black theme optimized for OLED screens and battery conservation.
  - **Match System**: Automatically switches theme based on your device settings.
- **App Language**: Change the entire user interface language between English, German, Hindi, French, Spanish, and Vietnamese.
- **Display & Font Scaling**: Adjust text sizing for higher information density or larger, comfortable reading.

---

### C. 💬 Send Feedback & Diagnostics
- **Submit Feedback & Bug Reports**: Submit feature requests or report bugs directly to the open-source GitHub repository.
- **Diagnostic Log Bundling**: Automatically packages anonymized error logs and device specifications to help troubleshoot issues quickly.

---

### D. ℹ️ About Lemmory
- View the installed app version and build number.
- **What's New Modal**: View release notes and changelogs summarizing new features.
- Open-source licenses and GitHub repository links.

---

## 💡 Common Setup Workflows

1. **Free AI Setup (Google Gemini)**:
   - Go to **Settings $\rightarrow$ AI Providers & Models**.
   - Tap **Get key from Google Gemini ↗** $\rightarrow$ create a free key in Google AI Studio.
   - Paste the key in Lemmory and tap **Test & Save Key** $\rightarrow$ tap **Activate**.
   - You now have free AI word breakdowns, grammar targeting, and example sentences!
2. **Importing an Anki Deck**:
   - Go to **Settings $\rightarrow$ Import & Export $\rightarrow$ Anki Package (.apkg)**.
   - Select your `.apkg` file $\rightarrow$ select the destination deck $\rightarrow$ tap **Import Cards**.
3. **Switching to High-Fidelity Audio**:
   - Go to **Settings $\rightarrow$ Audio & Pronunciation**.
   - Switch engine from *On-Device* to *OpenAI Audio* or *ElevenLabs*.
   - Tap the speaker icon to test sample voices in your target language.

---

## ❓ Frequently Asked Questions

> [!NOTE]
> **Are my API keys sent to any third-party servers?**
> No. Lemmory is fully local and privacy-first. Your API keys are stored strictly inside your phone's hardware keychain and are transmitted only to the official AI endpoint (e.g. `api.openai.com` or `generativelanguage.googleapis.com`) when you request a word generation.

> [!TIP]
> **What should I do if my AI generations are slow?**
> Try switching your active AI provider to **Groq** or **Google Gemini Flash** for near-instant response times.
