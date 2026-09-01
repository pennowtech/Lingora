/**
 * i18next resource maps. Every string is keyed by its own English text
 * (`keySeparator: false`/`nsSeparator: false` in `index.ts`) — a missing
 * translation falls back to English via `complete()` rather than showing a
 * raw key, so partial coverage is always safe to ship incrementally. Same
 * pattern the sibling Shelfie project's `i18n/resources.ts` already uses.
 *
 * Coverage: tab bar, common actions, and every screen's chrome (titles,
 * section headers, buttons, empty/error states, alerts, form labels).
 * Deliberately NOT translated: the Card Templates screen's long help-sheet
 * paragraphs (`HELP_SECTIONS` in `app/settings/templates.tsx`) and German
 * grammar terminology (Konjunktiv II, Präteritum, etc. in the word detail
 * screen's grammar panel) — both fall back to English via `complete()`.
 */

const ENGLISH_PHRASES = [
  // Tab bar
  'Home',
  'Search',
  'Decks',
  'Mine',
  'Settings',
  // Common actions
  'Cancel',
  'Save',
  'Delete',
  'Edit',
  'Done',
  'Continue',
  'Back',
  'Next',
  'Add',
  'Import',
  'Export',
  'Retry',
  'Send',
  'Undo',
  'Redo',
  'Close',
  'Install',
  'Uninstall',
  'Installed',
  // Settings — sections
  'Generation',
  'Translation',
  'Learning',
  'Data',
  'Privacy',
  'About',
  // Settings — labels
  'App Language',
  'Follow device',
  'System (Auto)',
  'Default CEFR level',
  'Examples and explanations are calibrated to this level.',
  'Word of the Day reminder',
  'When the daily notification for your Home screen word arrives.',
  'Import & export',
  'Anki, CSV, JSON backup',
  'Card templates',
  'Customize card layouts',
  'Pronunciation',
  'Voice, rate, pitch',
  'Local Dictionaries',
  'Free starter dictionary - no AI key needed',
  'Delete all API keys',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.',
  'English',
  'German',
  'French',
  'Spanish',
  'Hindi',

  // Home
  'Word of the Day',
  'Learn this word',
  "Finding today's word...",
  '✨ Word of the Day: {{word}}',
  'Nice to see you back.',
  '{{count}} days',
  "Some data on this screen couldn't load.",
  'cards due for review',
  'Start review',
  'Review',
  'reviewed today',
  'remembered',
  'Quick actions',
  'Look up a word',
  'Mining queue',
  'Practice cloze',
  'Statistics',
  'Recently added',
  'Recently searched',
  'Add to Deck',
  'Add to Cloze',
  'Listen',
  'Added to deck',
  'Added to cloze',
  'Deck options',
  'Rename deck',
  'Move deck',
  'Merge deck',
  'Merge into another deck',
  'Delete deck',
  'Good morning!',
  'Good afternoon!',
  'Good evening!',
  'Add Card',
  'Open Deck',
  'Reset progress',
  'eBook Library',
  'Import eBook',
  'No eBooks in your library yet',
  'Loading eBook...',
  'Table of Contents',
  'Reader Settings',
  'Font Size',
  'Theme',
  'Translate Inline',
  'Selected paragraph translation',
  'CEFR level set in settings',
  'Remove level',
  'Set manually',
  'Automatic (CEFR)',
  'See all',
  'No words yet',
  'Look up a word to add your first card.',
  'Search a {{target}} word',
  'Look up any {{target}} word and Lingora turns it into a flashcard with meanings, examples, and pronunciation.',
  'Paste or type a {{target}} sentence. It joins the queue below - nothing is sent to AI until you generate.',
  'Learn {{target}} the way it actually works - in context, at your level, with real examples.',
  'YOUR CURRENT {{target}} LEVEL',

  // Search
  'Type a German or English word...',
  'Instant lookup',
  'Search in German ("ausgeh...") or English ("go out").\nInflected forms like "ging aus" work too.',
  '"{{term}}" is new',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.",
  'Translating...',
  'Generating...',
  'Generate with AI',
  'Add your OpenAI key in Settings to generate new words',
  'Generation came back incomplete',
  'Nothing was saved - try again.',
  'From your installed dictionary - free, no AI needed.',

  // Decks / Deck detail
  'Give the deck a name.',
  'Could not delete deck',
  'Delete deck?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.',
  'No deck selected.',
  'Could not move deck',
  'Could not merge deck',
  'Merge into "{{name}}"?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.',
  'Export ready',
  'Exported {{count}} cards.',
  'Saved to the folder you chose.',
  'Choose where to save it.',
  'Export failed',
  'No decks yet',
  'Create your first deck with the + button.',
  'New deck',
  'Deck name',
  'Emoji (optional)',
  'Creating...',
  'Create deck',
  'Import into this deck',
  'Export this deck',
  'Rename deck',
  'Move to...',
  'Merge into...',
  'Delete deck',
  'Rename deck',
  'Saving...',
  'Save',
  'Top level (no parent)',
  'No other deck to nest this one under.',
  'No other deck to merge into.',
  'Import into "{{name}}"',
  'Export "{{name}}"',
  '{{due}} due/{{total}} cards',
  '{{count}} due',
  'Deck',
  'This deck no longer exists.',
  'cards',
  'due now',
  'Review {{count}} due cards',
  'Nothing due - study ahead',
  'Cards',
  'No cards yet - add words from Search.',
  'Move "{{name}}" to...',
  'Merge "{{name}}" into...',

  // Mine (mining queue)
  'Could not discard capture',
  'Could not save capture',
  'Clipboard is empty',
  'Copy some text first, then paste it here.',
  'Could not read clipboard',
  'Add your OpenAI key in Settings to generate cards.',
  'Add a sentence',
  'Paste or type a German sentence. It joins the queue below - nothing is sent to AI until you generate.',
  'Paste from clipboard',
  'Adding...',
  'Add to queue',
  'Queue is empty',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet - it lands here before any AI processing.',
  '{{done}} of {{total}} generated',
  '{{count}} failed',
  'see Decks.',
  "Review your captures. Discard what you don't need, then generate cards for the rest - no API call is wasted on text you didn't ask for.",
  'Generate {{count}} cards with AI',
  'Add your OpenAI key to generate cards',

  // Word detail
  'Explore Full AI Flashcard',
  'Generate Full AI Flashcard',
  'AI Insights',
  'Getting AI insights for "{{word}}"...',
  'Load more phrases with AI',
  'Explore idioms and collocations with AI',
  'Tap the sparkle above to explore idioms, expressions, and common word combinations.',
  'Could not load more info',
  'Add your AI provider key in Settings to generate more info.',
  'No additional info available yet.',
  'Generate more examples',
  'Generating more examples...',
  'Advanced Grammar Options',
  'Select grammar structures to exercise in your examples:',
  'Generate targeted examples',
  'Custom Grammar Rule',
  'e.g. Past perfect continuous, reported speech...',
  '✨ AI enriching meanings & examples...',
  'AI Enrichment Failed',
  'Selected model is not accessible with your {{providerName}} key/project. Try selecting a different model in Settings > AI Providers.',
  '{{providerName}} credit balance or quota exceeded. Please check your account plan and billing details.',
  '{{providerName}} rate limit reached. Please wait a few seconds and try again.',
  'Invalid {{providerName}} API key or permission denied. Please check your key in Settings > AI Providers.',
  "Couldn't reach {{providerName}} - check your device's internet connection and try again.",
  '{{providerName}} servers are temporarily unavailable ({{status}}). Please try again shortly.',
  'Add your OpenAI key in Settings to generate examples.',
  'This word has no card yet.',
  'Could not save your feedback',
  'Could not save your report',
  'Could not change the primary meaning',
  'Could not update the flashcard example',
  'This word has no meaning yet.',
  'Could not generate an explanation',
  'AI not configured',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.',
  'Could not look up an explanation',
  'Could not save your changes',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.',
  'No explanation yet.',
  'Make primary: {{translation}}',
  'Examples',
  'shown on flashcard',
  'use on flashcard',
  'Advanced grammar options',
  'Active: {{selection}}',
  'Generate examples',
  'Add your OpenAI key in Settings to generate targeted examples.',
  'Meanings in this word',
  'Grammar info',
  'Hide grammar info',
  'chat with your AI tutor',
  'Ask about "{{word}}"',
  'Chat with your AI tutor about this word - ask for more examples, nuance, or anything unclear.',
  "Couldn't load the explanation.",
  "Couldn't load additional info.",
  'Nothing to chat about yet',
  "This card has no meaning content yet, so there's nothing to discuss. Open it from the word's own page and try Regenerate there.",
  'Give me another example',
  "What's a synonym for this?",
  'When would I use this?',
  "Couldn't get a reply.",
  'Message your AI tutor...',
  'Synonyms',
  'Phrases & collocations',
  'Cloze card',
  'Cloze cards',
  'Added ✓ - add to another deck',
  'Add to deck',
  'Add "{{form}}" to...',
  'Edit this card',
  'Meaning',
  'Example sentence',
  'Example translation',
  'Cancel',
  'Save changes',
  "What's wrong with this?",
  'Optional details...',
  'Send report',
  'Sending...',
  'Inaccurate translation',
  'Unnatural phrasing',
  'Wrong CEFR level',
  'Grammar error',
  'Other',
  'Tense & mood',
  'Sentence structure',
  'Conjunctions',
  'Focus words',

  // Review session
  'GOOD',
  'AGAIN',
  'EASY',
  'HARD',
  'No card to rate.',
  'Could not save your rating',
  'No card to edit.',
  'Add your AI provider key in Settings to generate an explanation.',
  'Nothing due right now',
  'Session complete!',
  'This deck has no cards due for review. Add words or check back later.',
  'You reviewed {{count}} cards. Great work - come back when the next cards are due.',
  'Back to deck',
  'tap to reveal',
  'cloze',
  'Basic inline HTML works too - {{bold}}, {{italic}}, {{colored}}.',

  // Stats
  'No stats yet',
  'Add and review some words to see your learning statistics here.',
  'remembered (30 d)',
  'word correctly',
  'day streak',
  'total cards',
  'new this week',
  'Review activity',
  'less',
  'more',
  'Vocabulary growth',
  'new words per week',
  'Difficult words',
  'No lapses yet - nothing difficult to show.',
  '{{count}} lapses',

  // Import & export
  'Anki deck (.apkg)',
  "Bring your existing decks. Review history isn't imported - cards start fresh.",
  'Choose .apkg file',
  'CSV with column mapping',
  'From Quizlet, Memrise, or spreadsheets.',
  'Choose CSV file',
  'A shared deck (.lem)',
  "Add a deck someone shared with you - full fidelity, including review history. Doesn't touch anything else on this device.",
  'Choose .lem file',
  'Restore from Lemmory backup (.lem)',
  'Replaces everything on this device with a previously exported backup.',
  'Restoring...',
  'Choose backup file',
  'Lemmory backup (.lem)',
  'Your full library - decks, cards, review history. Your data is always yours. API keys are never included.',
  'Export everything',
  'CSV',
  'One row per card - the same columns CSV import reads, so this file re-imports as-is.',
  'Export as CSV',
  "Study your Lemmory vocabulary in Anki/AnkiDroid. Cards start fresh - review history isn't carried over.",
  'Export as .apkg',
  'Markdown',
  'A readable word - meaning - example list. Not meant to re-import.',
  'Export as Markdown',
  'Backup ready',
  'Restore from backup?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.',
  'Restore',
  'Restore complete',
  'Restored {{count}} rows.',
  'Restore failed',
  'Invalid backup file',
  'Could not read file',

  // CSV / Anki / .lem import wizards
  'Preview',
  'Will import',
  'Duplicates',
  'Errors',
  'Selected',
  'Back',
  'Import {{count}} rows',
  'Import {{count}} words',
  'Import from CSV',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.",
  '{{count}} rows detected. Map each column below.',
  'Sample data',
  'The first few rows, so you can see what each column actually holds.',
  'Column {{n}}',
  'Field mapping',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes - they're derived from the example's cloze markup and its translation.",
  'None',
  'Import into deck',
  '+ New deck',
  'If the word already exists',
  'Applies to every duplicate row you leave checked in the next step.',
  'Checking...',
  'Preview import',
  'Importing...',
  'Import complete',
  'Imported {{count}} words.',
  'Imported',
  'Skipped',
  'Failed',
  'Import another file',
  'New deck',
  'Create new deck',
  'Create New Study Deck',
  'DECK TITLE',
  'EMOJI / ICON (OPTIONAL)',
  'Only cards matching these types can be saved into this deck.',
  'e.g. German Verbs',
  'Total Cards',
  'Due Today',
  'Your Study Decks',
  'New Deck',
  'Up to date',
  'Decks & Schedule',
  'Manage study decks and review due vocabulary',
  'Mastery & Retention',
  'All caught up across {{decks}} study collections.',
  '{{due}} cards due across {{decks}} study collections today.',
  '{{count}} cards registered',
  'due',
  'Daily Load',
  'cards due today',
  'cards due across all decks',
  'Sentence holding',
  'Daily Discovery',
  'Meaning & Explanation',
  'Example in Context',
  'Beispielsatz wird geladen...',
  'Explore Full Details ↗',
  'Reviewed Today',
  'Explore',
  'Search',
  'Queue',
  'Stats',
  'Create & select',
  'Could not read this file',
  'Import failed',
  'This file has no rows to import.',
  'Word',
  'Example',
  'Status',
  'Issues',
  'Skip',
  "Don't touch the existing word.",
  'Merge',
  'Add this as another meaning on the existing card.',
  'Keep both',
  'Add a second, separate card for the same word.',

  'Import from Anki',
  "Choose a `.apkg` export. Review history isn't imported - every card starts fresh - and media (audio/images) is stripped rather than copied.",
  '{{notes}} notes across {{decks}} decks. Map each field below - it applies to every note, so a note type without that many fields just leaves it empty.',
  'The first few notes, so you can see what each field actually holds.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes - they're derived from the example's cloze markup and its translation.",
  'Field {{n}}',
  'This collection has no notes to import.',
  'Could not read this collection',
  '{{done}} of {{total}} notes',
  'Import canceled',
  'The rest were left untouched - you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).',
  'Tags',

  'Import from a .lem file',
  'Choose a Lemmory `.lem` file - a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.',
  'This file has more than one deck. Which one do you want to import?',
  'This file has no decks to import.',
  'Importing "{{name}}" ({{count}} cards).',
  "Don't touch the word already in your library.",
  'Imported {{words}} words ({{cards}} cards).',

  // Templates
  'Vocabulary',
  'Cloze',
  '+ New',
  'Front',
  'Back',
  'actual review card size on this device',
  'Rendered with a sample cloze sentence through the same engine the review session uses.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.',
  'Template name',
  'Fields',
  'Tap "Front" or "Back" to show a field on that side - a field can appear on both, or neither.',
  'Layout & style',
  'Reset to default',
  'Accent color',
  'Stored as a',
  'rule - reference it in your CSS below as',
  'CSS',
  'Applied to both sides in the real WebView renderer.',
  'Front (Liquid)',
  'Back (Liquid)',
  'Available template variables',
  'Conditional example',
  'Set default',
  'Deleting...',
  'Delete this template?',
  '"{{name}}" will be removed.',
  'Create template',
  'Template editor help',
  'Fields tab',
  'Style tab',
  'Preview tab',
  'Code tab',
  'HTML & CSS without extra elements',
  'Could not save template',
  'Could not set default template',
  'Could not delete template',
  'New template',
  'Reset to default layout & style?',
  'This replaces the front, back, and CSS in the editor - tap "Save changes" to keep it. Unsaved edits are lost.',
  'Reset',

  // TTS
  'Speaking rate',
  'Pitch',
  'Normal',
  'Voice (German)',
  'No German voices are installed on this device.',
  'Device default',
  'Enhanced',
  "Voices come from the device's own text-to-speech engine - install more from your phone's system settings if you don't see the one you want.",
  'Playing...',
  'Test',

  // Local Dictionaries
  'Could not install this chunk',
  'Could not remove this chunk',
  'Local Dictionaries installed',
  'Installed {{count}} new chunks.',
  'Could not install local dictionaries',
  '{{language}}-English Dictionary',
  '{{installed}} installed · {{available}} available to install',
  'Install all available',
  'Chunks',
  'Words {{start}}-{{end}}',
  '{{count}} words',
  'Uninstall all',
  'Uninstalling...',
  'Local Dictionaries uninstalled',
  'Removed {{count}} chunks.',
  'Could not uninstall local dictionaries',
  'Uninstall all local dictionaries?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.',
  'No translation to add.',
  'No dictionary entry to add.',
  'Details',
  'More info',
  'Hide details',
  'Understanding the {{language}} {{wordClass}} "{{headword}}"',
  'Context & Practical Usage',
  'Usage',
  'Examples of Usage',
  'Noun',
  'Verb',
  'Adjective',
  'Adverb',
  'Preposition',
  'Conjunction',
  'Pronoun',
  'Article',
  'Phrase',
  'Word',

  // Settings — provider chrome
  'Connected',
  'No internet connection',
  'DeepL validation failed',
  '{{provider}} validation failed',
  'Delete all API keys?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.',
  'Limited mode',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.',
  "Couldn't load saved settings",
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key - nothing is sent until you generate a card.',
  'Active provider',
  'Model',
  'Paste your {{provider}} API key...',
  'Hide {{provider}} API key',
  'Show {{provider}} API key',
  'Validate key',
  'Clear',
  'Device-observed usage',
  '{{count}} requests',
  '{{count}} tokens',
  'Open {{provider}} usage ↗',
  'Google Translate',
  'Free tier, no key needed',
  'Uses this provider\'s key above',
  'Add a key above to enable',
  'Active',
  'Best German↔English quality - bring your own key',
  'Hide DeepL settings',
  'Show DeepL settings',
  'Paste your DeepL API key...',
  'Enabled',
  'Open DeepL usage ↗',
  'v0.0.1 · offline-first · your data stays on device',
  'offline-first · your data stays on device',
  'Build',
  'Delete this card?',
  'This permanently deletes this card and all its meanings, examples, synonyms, phrases, and cloze variations. This cannot be undone.',
  'Could not delete this card',
  'Semantic Contexts',
  '{{count}} contexts',

  // Root layout titles
  'Opening your vocabulary...',
  'Import & Export',
  'Import CSV',
  'Import Anki deck',
  'Card Templates',

  // Newly added — capture-intent (share/select-text), help sheets, and general UI polish
  '"Add to deck" at the bottom is how you start reviewing this word - you can add it to more than one deck, or create a new one on the spot.',
  '"Ask AI" opens a small chat where you can type a follow-up question about this specific word.',
  '"Explain" (or "More info" on an AI-generated card) shows or expands a direct explanation of what the word means and where or why it\'s used.',
  '"Follow device" just matches whatever language your phone is already set to.',
  '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.',
  'The "AI Insights" preview gives a short, direct explanation of what the word means and where or why it\'s used - tap it any time to generate the full flashcard.',
  "\"Regenerate\" throws away this card's meanings, examples, synonyms, phrases, and cloze cards, and generates all of it fresh - useful if the current version isn't working for you. This can't be undone.",
  '"Test active engine" plays the Test phrase through whichever engine is marked Active - the same thing any real speaker button in the app does.',
  'A cloze card blanks out part of a sentence for you to fill in - a different way of practicing the same word.',
  'A green checkmark means the word is already in one of your decks.',
  'A short summary',
  'AI Providers',
  'AI-generated - explanations can be inaccurate. Check important details against a trusted reference.',
  'On an AI-generated card, the short explanation right below the translation states directly what the word means and where or why it\'s used - not a hint to figure out yourself.',
  'Accent color swatches write a custom property at the top of your CSS:',
  'Add "{{term}}" to...',
  'Add a key in AI Providers to enable',
  'Add a sentence by typing it, pasting it from your clipboard, or sharing text here from another app.',
  'Add card',
  'Add card manually',
  'Add to Lemmory',
  'Add to Mining queue',
  'Add your AI provider key in Settings to ask a follow-up.',
  'Add your AI provider key in Settings to regenerate this card.',
  'Adding from other apps',
  'Adding to a deck',
  'All caught up - nothing due right now.',
  'Alternatively, generate a new key from a project that already has it enabled (or the "Default project" if you have one).',
  'Always open Search, split between Search and the Mining queue depending on how much text it is, or ask you every time.',
  'Answer',
  'App version, platform, and feature tier - helps reproduce a bug.',
  'App {{version}} · {{platform}} · {{tier}}',
  'Applies across the app.',
  'Ask',
  'Ask AI',
  'Ask a follow-up question, maximum {{max}} characters',
  'Ask a short follow-up...',
  'Asking...',
  'At most every',
  'Audio Settings',
  'Audio Settings help',
  'Audio settings, app language',
  'Aura-2. Once your key is entered, choose from Deepgram\'s available models, or switch to manual entry to enter a model name directly (see Deepgram\'s docs for exact names).',
  'Automatic sync',
  'Choose a voice...',
  'Choose from your {{provider}} voices instead',
  'Choosing what to keep',
  'Cloud providers are bring-your-own-key - nothing is sent to them until you tap a speaker icon or press Test.',
  'Comma-separated',
  'Could not add card',
  'Could not create deck',
  'Could not generate an example',
  'Could not get an answer',
  'Could not regenerate this card',
  'Could not remove card',
  'Could not reset progress',
  'Could not sign in',
  'Create',
  'Create new deck',
  'Creating a GitHub issue needs a token with write access to the repo - that can never ship inside the app, since a compiled build can be decompiled and any embedded secret treated as public.',
  'Deepgram',
  'Default: {{voice}}',
  'Delete All AI Providers Keys',
  'Delete all AI provider keys?',
  'Depending on a setting in Settings, under "Share & Search," a shared sentence might land here right away, or you might get asked what to do with it first.',
  'Device (built-in)',
  'Display on Flashcard',
  'Each provider\'s own "Test this provider" button plays through that card\'s current key/voice/speed directly, regardless of which engine is Active - use it to check a setup before switching to it.',
  'Each row is one piece of card data. Tap "Front" or "Back" to show that field on that side - a field can appear on both, on neither, or on just one.',
  'ElevenLabs',
  'Email (Optional)',
  'Enter the word first.',
  'Every card in "{{name}}" goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.',
  'Every card in this deck goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.',
  'Every speaker button in the app uses whichever engine is marked Active below.',
  'Everything in the queue is selected by default. Tap a card to include or leave it out, or use the trash icon to remove it for good.',
  'Everything renders inside a real WebView, so standard CSS applies as on any web page - flexbox, custom fonts via @font-face, transitions, etc. all work; there is no special "app CSS" subset to learn beyond this.',
  'Example sentences',
  'Example sentences show the word used in context, with a translation underneath.',
  'Examples generated from a selected option get a highlighted background, so you can tell which ones came from your request.',
  'Explain, Ask AI & more',
  'Explanations and the "More info" follow-up use this language.',
  'Exporting...',
  'Expression',
  'Fields added via the toggles are never auto-wrapped in a <div> or <span> - {{ word }} renders as bare text directly inside the card body. That keeps generated templates minimal, but it means a rule like ".word { ... }" has nothing to match unless you add that class yourself.',
  "Found a sentence somewhere else, like an article or a message? Share it to Lemmory the same way you'd share it to any other app.",
  'Front and Back are raw Liquid templates - anything valid Liquid works here, not just what the Fields toggles generate.',
  "Front and Back are separate - the chip above the card switches which side is rendered, so you always know exactly which side you're looking at.",
  'Full',
  'Gender',
  'General',
  'General settings help',
  'Generated with AI - not from your installed dictionary.',
  'Generating your card...',
  'Generation came back incomplete - nothing was changed. Try again.',
  'Go to platform.openai.com > Settings > Projects > select the project this key belongs to > Models > enable gpt-4o-mini-tts for that project.',
  'Hide DeepL API key',
  'How Audio Settings works',
  'I speak',
  "I'm learning",
  'If Validate says a project doesn\'t have access to gpt-4o-mini-tts, but the model works fine on platform.openai.com, your API key is scoped to a specific OpenAI Project that hasn\'t enabled it.',
  'If a cloud key is invalid, the provider is unreachable, or a request fails, playback falls back to the device voice automatically - you\'re never left with silence.',
  "If a word isn't in your library yet, you may see a quick built-in dictionary entry and/or a translation preview - both are read-only until you choose to add one to a deck.",
  'If no model is picked, a default is chosen to match whatever language is set under Settings > Learning > "I\'m learning" (English, German, Spanish, or French) - other languages fall back to an English voice until you pick one manually.',
  'If no voice is picked, a known-good multilingual default voice is used automatically.',
  'If this word has more than one distinct sense - say, a casual meaning and a business one - you\'ll see small labeled capsules (like "social" or "formal") just above the translation. Tap one to switch; each keeps its own examples and synonyms.',
  'Import & export, templates, local dictionaries',
  'Include diagnostics',
  'Inflected or conjugated forms work too, not just the base/dictionary form of a word.',
  'Install more voices from your phone\'s system settings if the one you want isn\'t listed.',
  'Installing...',
  'Key validated',
  'Last synced: {{when}}',
  'List fields (Other meanings, Synonyms, Related phrases) already need a {% for %} loop to render at all - that loop is structurally required, not a styling choice. To style each item individually, wrap the item inside the loop:',
  'Long-press a word in any app and pick "Search in Lemmory" to look it up here right away.',
  'Long-press a word in any app - your browser, messages, anywhere - and pick "Search in Lemmory." It opens right here with that word ready to go.',
  'Message',
  'Mine help',
  'Mine is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.',
  'Never',
  'Never included: word content, translations, AI responses, or API keys.',
  'New deck name',
  'New words are looked up and generated in this language.',
  'No AI provider active - open Settings',
  'No AI provider is active - add and enable one in Settings to generate new words',
  'No AI provider is active - add and enable one to generate targeted examples.',
  'No AI provider is active.',
  'No AI provider is active. Add and enable one in Settings to generate cards.',
  'No AI provider is active. Add and enable one in Settings to generate examples.',
  'No AI provider is active. Add and enable one in Settings to generate words.',
  'No decks yet - create one above.',
  'No provider configured - AI generation disabled',
  'No settings match "{{query}}"',
  'No {{language}} voices are installed on this device.',
  'Not supported yet',
  'Match your native language too?',
  'You just set the app language to {{language}}. Also set "I speak" to match?',
  'Match the app language too?',
  'You just set "I speak" to {{language}}. Switch the app\'s own language to match?',
  'Yes, switch it',
  'No, keep it',
  'Nothing to add.',
  'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.',
  'Only bother with this if you want to be selective - otherwise everything gets turned into cards together.',
  'Only if you want a reply - also becomes public once posted.',
  'Open Settings',
  'OpenAI',
  'Or enter an ID manually',
  'Phrases show this word used in common expressions or word combinations.',
  'Pick a look for the whole app, from bright to dark and everything between.',
  'Picking a swatch again (or none) removes the line - it never conflicts with CSS you write by hand elsewhere in the box.',
  "Please don't include anything private in your message.",
  'Practice reverse',
  'Practice words',
  'Practice {{count}} cloze',
  'Reference it anywhere in your own CSS rules, e.g.:',
  'Regenerate',
  'Regenerate this card?',
  'Remove',
  'Remove {{count}}',
  'Remove {{count}} cards from this deck?',
  'Removing...',
  'Rendering goes through the exact same LiquidJS + WebView pipeline the review session uses, with one fixed sample word ("ausgehen") standing in for your real vocabulary.',
  'Report an issue or request a feature',
  'Reset progress',
  'Reset progress?',
  'Reset to default?',
  'Resetting...',
  "Review your captures. Discard what you don't need, then generate cards for the rest.",
  'Review {{count}} words',
  'Search from anywhere',
  'Search help',
  'Search in German ("ausgeh...") or English ("go out").\\nInflected forms like "ging aus" work too.',
  'Search settings',
  'Search this',
  'Select cards',
  'Selectors that work with zero extra markup (they target the card body itself or elements this app already emits):',
  'Send Feedback',
  'Send Feedback help',
  'Sentence (use [...] for the gap)',
  'Sentence translation',
  'Share & Search',
  'Show DeepL API key',
  'Shown on flashcard',
  'Sign in with Google',
  'Sign out',
  'Signing in...',
  'Speaking speed',
  'Speaking speed isn\'t configurable for this provider yet.',
  'Speech engine',
  "Submitting posts your message as a GitHub issue on Lemmory's public repository - anyone can read it, including your contact email if you provide one.",
  'Sync',
  'Sync decks, cards, and progress to a Google account',
  'Sync failed',
  'Sync not connected',
  'Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.',
  'Sync in the background whenever you leave the app, at most this often',
  'Sync now',
  'Sync your decks, cards, and review progress to a Google account so they carry over to another device. API keys are never synced.',
  'Synced',
  'Syncing...',
  'Synonyms & phrases',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. You can rate or flag one the same way as an example.',
  'Tap the star on any example to choose which one appears on your flashcard - only one shows at a time.',
  'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.',
  'Test active engine',
  'Test phrase',
  'Test this provider',
  'Testing a voice',
  'Text to speak when testing',
  'Thanks for the feedback',
  'The "Available template variables" card lists every field name you can reference, with a one-line description of what it holds.',
  'The CSS box applies to both the front and back - there is one stylesheet per template, not one per side.',
  'The button at the bottom turns your selected sentences into real vocabulary cards, one at a time.',
  'The card fills the available screen space exactly (no scrolling) and the caption above it shows its real, on-device measured width and height in points - the same size a card gets during an actual review session.',
  'The conditional example at the bottom is a worked, copy-pasteable snippet combining {% if %} and {% for ... limit %}.',
  'The dropdown above the examples ("all", "travel", "business", and so on) filters them down to a particular tone or situation, if you only want to see those.',
  'The pencil icon lets you edit the meaning or example text directly. The last icon opens a quick web search for the word, for a second opinion outside the app.',
  'The row of small icon buttons under the meaning gives you a few more ways to dig into this word.',
  'The sentence must contain "[...]" for the gap, and an answer is required.',
  'The toggles read the template text itself (no hidden markers) - they work reliably for templates built through the toggles. If you hand-write unusual formatting in the Code tab, a toggle may not detect it; edit the Code tab directly in that case.',
  'The translation at the top is what actually appears on your flashcard.',
  'The voice list follows whatever language is set under Settings > Learning > "I\'m learning".',
  'Theme',
  'Thinking...',
  'This becomes a public issue',
  'This card, explained',
  "This changes the language of the app itself - its buttons and menus - not the language you're learning.",
  'This collapsible panel below the examples lets you pick a specific grammar pattern - a tense, a sentence structure, a particular conjunction - that you want the next batch of examples to practice, instead of leaving it to chance.',
  "This is a preview of the feedback form - sending isn't connected yet, so nothing was sent anywhere. Once it is, this exact form will open a GitHub issue on your behalf.",
  'This is the one step that actually does the work - nothing before it does anything with your captured text.',
  'This only changes colors - nothing about how the app works.',
  'This only removes them from this deck - cards that live in other decks too stay there.',
  'This opens a separate screen for the voice that reads words out loud, and how fast it speaks.',
  'This removes every OpenAI/Mistral/Gemini/Claude key from this device. Vocabulary and progress are unaffected.',
  'This replaces the fields, layout, and style with the built-in default, and saves immediately. This cannot be undone.',
  'This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.',
  'This screen is a preview of the full flow; submitting just confirms locally for now. A small server-side function will handle real submission in a future update.',
  'This setting decides what happens next.',
  'Title',
  'To style one field on its own - e.g. make the word bigger than the rest - wrap just that field in your own element in the Code tab, then target the class you chose:',
  'Translation-only',
  "Turning a field on inserts the minimum Liquid needed for it at the end of that side's template: a plain field becomes {{ word }}; a list field (Other meanings, Synonyms, Related phrases) becomes a {% for %} loop, because a list can't be printed directly.",
  'Turning captures into cards',
  "Type a word in either language you've set up under Learning - your own vocabulary is searched instantly as you type.",
  "Underneath each example, thumbs up/down let you mark whether it's good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense.",
  'Unknown error',
  'Uses this provider\'s key from AI Providers',
  'Uses your phone\'s own text-to-speech engine - offline, free, no API key.',
  'Voice',
  'Voice ({{language}})',
  'Want it to work a bit differently? There\'s a setting for that in Settings, under "Share & Search."',
  'What diagnostics includes',
  'What happened, or what would you like to see?',
  'What kind of feedback?',
  'What this screen is for',
  'Whatever translation at this moment is selected/shown will be added to deck along with its relevant example.',
  'When a word is new to you',
  'Why nothing sends yet',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.',
  'Word and meaning are required.',
  'Word card',
  'You can add your cards to multiple decks even if it is added before.',
  "You can also share text from another app straight to Lemmory, the same way you'd share a link or a photo.",
  "You can also share text to Lemmory, the same way you'd share a link or a photo to any other app.",
  'ask a follow-up question',
  'e.g. Er lehnt das Angebot ab.',
  'e.g. He refuses the offer.',
  'e.g. We are going out tonight.',
  'e.g. Wir gehen heute Abend [...].',
  'e.g. ablehnen',
  'e.g. aus',
  'e.g. to refuse',
  'e.g. verweigern, zurückweisen',
  'eleven_multilingual_v2. Once your key is entered, choose from your own ElevenLabs voice library, or switch to manual entry to paste a voice ID directly.',
  'generate an explanation for this meaning',
  'gpt-4o-mini-tts. Marin and Cedar (★) are OpenAI\'s newest, most natural-sounding voices.',
  'regenerate this card',
  'reverse',
  'this deck',
  'you@example.com',
  '{{ variable }} prints a value. {% if gender %}...{% endif %} shows content only when a field has one - good for optional fields. {% for s in synonyms %}...{% endfor %} loops a list; add "limit:2" to cap it, and {% unless forloop.last %}...{% endunless %} to add a separator between items but not after the last one.',
  '{{cefr}} · {{native}} > {{target}}',
  '{{count}} of {{total}} configured',
  '{{count}} selected',
  '{{count}}h',
  '{{count}}m',
  "{{language}} isn't ready yet - English and German are the only languages Lemmory fully supports right now.",
  '{{provider}} playback failed',
  '{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted',

  // Newly added — theme names, provider descriptions, gender/rating labels, feedback categories
  'masculine',
  'feminine',
  'neuter',
  'Again',
  'Hard',
  'Good',
  'Easy',
  'Lemmory Light',
  'Midnight Indigo',
  'Carbon Noir',
  'Arctic Day',
  'Warm Sand',
  'Paperlight',
  'Meanings, examples, clusters, phrases, and cloze - the default generation provider.',
  'BYOK alternative for card generation and translation.',
  'Google Gemini BYOK for card generation and translation.',
  'Claude BYOK for card generation and translation.',
  'Your phone\'s own text-to-speech engine. Offline, no API key, no per-word cost.',
  'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.',
  'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.',
  'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).',
  'Bug / Issue',
  'Feature request',
  'General feedback',
  'Vietnamese',

  // Newly added — Queue rename (formerly Mine)
  'Queue',
  'Queue help',
  'Queue is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.',

  // Newly added — Queue rename (formerly Mine)
  'Generate {{count}} cards to...',

  // Newly added — Account & Data Deletion (Google Play 2026 mandate)
  'Delete account & sync data?',
  'This permanently erases everything you\'ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can\'t be undone.',
  'Delete everything',
  'Deletion failed',
  'Danger zone',
  'Permanently erase everything synced to this account and sign out. Your data on this device stays put.',
  'Delete account & sync data',

  // Newly added — Sync help section
  'Sync help',
  'How sync works',
  'Deleting your account & data',
  'What does this actually delete?',
  "Signing in with Google links this device to a private cloud copy of your decks, cards, and review progress - so if you get a new phone, or use Lemmory on two devices, you're not starting from zero on the second one.",
  'Tap "Sync now" any time to push your latest changes up and pull down anything from another device. Under the hood it merges rather than overwrites - if you added a card here and reviewed one on your other phone, both survive.',
  "Your AI provider API keys are never synced. They live only in this device's secure storage, so you'll need to re-enter them if you set up a new device.",
  'When this is on, Lemmory quietly syncs in the background whenever you leave the app - no need to remember to tap "Sync now" yourself.',
  "\"At most every\" is a cooldown, not a schedule - it won't sync more often than that, but it also won't force a sync if you haven't opened the app in the meantime.",
  "It runs over whatever connection you've got, Wi-Fi or mobile data - there's no Wi-Fi-only toggle.",
  "This is the one action here you genuinely can't undo - read this before you tap it.",
  'It permanently erases everything this account ever synced to the cloud, disconnects the Google account from Lemmory, and signs you out.',
  'Your decks, cards, and progress on THIS device are completely untouched - they stay right where they are, fully usable offline. Only the cloud copy (and the link to it) is gone.',
  'If you sign back in with the same Google account afterward, syncing starts fresh - nothing comes back automatically.',

  // Newly added — explicit either/or card type for CSV/Anki import
  'Card type for this import',
  'A row with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.',
  'A note with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.',
  'Regular (word/meaning)',
  'Cloze (fill-in-the-blank)',

  // Newly added — deck table view
  'View all cards (table)',
  '{{name}} - all cards',
  'All cards',
  'No cards yet',
  'Add words from Search or import a file to see them here.',
  'Type',
  'Part of speech',
  'CEFR',

  // Newly added — Mixed practice, question types, cards-per-session, and the AI Providers help
  // sheet/error-message hardening that went with them
  'Fill in the blank',
  'True or False',
  'Multiple choice',
  'mixed',
  'true/false',
  'multiple choice',
  'Mixed practice',
  'Practice more',
  'Practice question types',
  'Cards per session',
  'No limit',
  'You reviewed {{count}} cards. There are more cards due - keep going or come back later.',
  'Added to {{deck}}',
  'Cloze added',
  '"{{word}}" means "{{meaning}}"',
  'Not quite - "{{word}}" means "{{meaning}}".',
  'True',
  'False',
  'Correct!',
  'What does this mean?',
  'True or false?',
  'Language pair',
  '"I speak": explanations and the "More info" follow-up use this language.',
  '"I\'m learning": new words are looked up and generated in this language.',
  'Mixed practice presents due cards in a random mix of whichever formats are enabled here.',
  'Cloze here is scored separately from the dedicated Cloze Practice mode.',
  'Caps how many due cards a single review session pulls in - the most overdue cards first. Applies to every practice mode, not just Mixed.',
  'If more are due, finish the session and tap "Practice more" for another round right away, instead of waiting until they come due again.',
  'How AI Providers works',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled.',
  'Bring your own API key - nothing is sent to a provider until you generate a card.',
  "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.",
  '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.',
  '{{providerName}} could not generate a valid response for this word. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.',

  // Newly added — the cloze editor's default-blank-the-word behavior
  'The word is already blanked out below - select a different word or phrase and tap "Mark as cloze" to change it.',

  // Newly added — naming the deck in the "Cloze added" toast when it's unambiguous
  'Cloze added to {{deck}}',

  // Newly added — the rest of the manual cloze editor (ClozeMarkupEditor/ClozeEditorSheet) had no
  // i18n coverage at all before this, pre-existing gap closed while already in this file
  'Select a word or phrase in the sentence below, then tap "Mark as cloze" to blank it out.',
  'Sentence',
  'Mark as cloze',
  'Nothing to preview yet.',
  'English translation',
  'Add cloze card',
  'Save cloze card',

  // Newly added — word detail screen's help sheet was stale/incomplete against the actual UI
  // (missing Custom Grammar Rule, Delete, the synonym/phrase AI buttons, and cloze editing)
  'Underneath each example, thumbs up/down let you mark whether it\'s good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense - the same thing "Generate more examples" below the list does.',
  'Don\'t see the pattern you want? Type your own under "Custom Grammar Rule" and tap the + to add it to the selection - it\'s sent to the AI exactly as written, alongside any picked chips.',
  '"Generate targeted examples" replaces the current examples with fresh ones written to practice your selection. Examples generated this way get a highlighted background, so you can tell which ones came from your request.',
  'The pencil icon lets you edit the meaning or example text directly (dictionary-sourced cards only - an AI card uses Regenerate and the per-field AI tools instead). The trash icon deletes this card entirely, after confirming. The last icon opens a quick web search for the word, for a second opinion outside the app.',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. Tap the sparkle icon on one to fetch AI usage & nuance - how formal it is and what makes it different from the headword. The icon next to it opens that synonym as its own flashcard.',
  'Phrases show this word used in common expressions or word combinations, fetched on demand: tap "Explore with AI" the first time, or "Load more with AI" for another batch once you already have some.',
  '"Add to Cloze" (or "Edit Cloze" once one exists) at the bottom opens the editor pre-filled with the currently selected example. Select a word or phrase in the sentence and tap "Mark as cloze" to blank it out - it defaults to blanking the headword itself - then adjust the translation and save.',
  'Saving always replaces this card\'s cloze sentence rather than adding a second one - there\'s only ever one per card.',

  // Newly added — the redesigned AI Providers help sheet (grid + single detail panel, expanded
  // from a two-line summary into a full conversational guide) and its matching Audio Settings labels
  'Active Generation Provider',
  'Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.',
  'Key configured',
  'No key set',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.',
  'Always available',
  'Validated',
  '"Active" vs "Enabled" - what\'s the difference?',
  'Adding and validating a key',
  'Which provider should I pick?',
  'What the usage numbers mean',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.',
  '**Active** is the one provider actually doing the work right now - the engine that responds when you look up a word. Only one provider can be Active at a time, and tapping a validated provider\'s card here switches to it immediately.',
  '**Enabled** is a softer flag, tucked inside a provider\'s own settings panel. It controls whether that provider is allowed to be picked at all (including as a fallback, and as an option elsewhere in the app like Settings > Translation) - flip it off if you want to keep a key saved for later without it being usable right now.',
  'If a key gets cleared or fails validation while its provider is Active, Lingora quietly falls back to the next best option - whichever provider is both enabled and has a validated key - so you\'re never stuck without generation just because one key went stale.',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Validate** - this sends one small real request to confirm the key actually works before you rely on it for word generation.',
  'A provider only becomes eligible to be Active once its key has validated successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.',
  '**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device\'s secure storage - not in Lingora\'s own servers, not synced anywhere, unless you back up and restore it yourself.',
  '**OpenAI** is the default and a safe general-purpose choice - reliable structured output, widely used, easy to get a key for at `platform.openai.com`.',
  '**Groq** runs open models (like the gpt-oss family) on very fast custom hardware - if speed matters more to you than picking a specific model family, this is usually the quickest of the bunch to respond.',
  '**Mistral** is a solid European alternative with its own models, good if you\'d rather not depend on a US-based provider or just want a second option in the mix.',
  '**Gemini** (Google) tends to be generous on free-tier usage limits if you\'re just trying this out without committing to a paid key yet.',
  '**Claude** (Anthropic) is known for careful, well-reasoned output - a good pick if you find another provider\'s example sentences or meanings feel a little off and want to compare.',
  '**DeepSeek** is capable and inexpensive, but tends to run noticeably slower than the others for a full word generation - worth knowing going in so a longer wait doesn\'t feel like something\'s broken.',
  'Whichever you choose, the model picker under each provider lets you trade off speed, cost, and quality without needing to leave this screen.',
  'Each provider\'s panel shows a **device-observed usage** box - request and token counts this specific device has actually sent through that key. It\'s a convenience, not a bill: it only counts what happened here, so it won\'t match a key shared across multiple devices or apps.',
  'For the real, authoritative numbers - and anything to do with billing or rate limits - use the "Open usage" link, which takes you straight to that provider\'s own dashboard.',
] as const

type Phrase = (typeof ENGLISH_PHRASES)[number]
type PhraseMap = Record<string, string>

const english: PhraseMap = Object.fromEntries(ENGLISH_PHRASES.map((phrase) => [phrase, phrase]))

function complete(overrides: Partial<Record<Phrase, string>>): PhraseMap {
  return { ...english, ...overrides }
}

const de: Partial<Record<Phrase, string>> = {
  Home: 'Start',
  Search: 'Suche',
  Decks: 'Stapel',
  Mine: 'Meins',
  Settings: 'Einstellungen',
  Cancel: 'Abbrechen',
  Save: 'Speichern',
  Delete: 'Löschen',
  Edit: 'Bearbeiten',
  Done: 'Fertig',
  Continue: 'Weiter',
  Back: 'Zurück',
  Next: 'Weiter',
  Add: 'Hinzufügen',
  Import: 'Importieren',
  Export: 'Exportieren',
  Retry: 'Erneut versuchen',
  Send: 'Senden',
  Undo: 'Rückgängig',
  Redo: 'Wiederholen',
  Close: 'Schließen',
  Install: 'Installieren',
  Uninstall: 'Deinstallieren',
  Installed: 'Installiert',
  Generation: 'Generierung',
  Translation: 'Übersetzung',
  Learning: 'Lernen',
  Data: 'Daten',
  Privacy: 'Datenschutz',
  About: 'Über',
  'App Language': 'App-Sprache',
  'Follow device': 'Gerätesprache verwenden',
  'System (Auto)': 'System (Automatisch)',
  'Default CEFR level': 'Standard-Niveaustufe (GER)',
  'Examples and explanations are calibrated to this level.':
    'Beispiele und Erklärungen sind auf dieses Niveau abgestimmt.',
  'Word of the Day reminder': 'Erinnerung „Wort des Tages"',
  'When the daily notification for your Home screen word arrives.':
    'Wann die tägliche Benachrichtigung für dein Startbildschirm-Wort eintrifft.',
  'Import & export': 'Import & Export',
  'Anki, CSV, JSON backup': 'Anki, CSV, JSON-Sicherung',
  'Card templates': 'Kartenvorlagen',
  'Customize card layouts': 'Kartenlayouts anpassen',
  Pronunciation: 'Aussprache',
  'Voice, rate, pitch': 'Stimme, Geschwindigkeit, Tonhöhe',
  'Local Dictionaries': 'Lokale Wörterbücher',
  'Free starter dictionary - no AI key needed':
    'Kostenloses Starter-Wörterbuch - kein KI-Schlüssel nötig',
  'Delete all API keys': 'Alle API-Schlüssel löschen',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'API-Schlüssel verbleiben auf diesem Gerät (Expo SecureStore) und werden nie in Exporte oder Sicherungen aufgenommen.',
  English: 'Englisch',
  German: 'Deutsch',
  French: 'Französisch',
  Spanish: 'Spanisch',
  'Word of the Day': 'Wort des Tages',
  'Learn this word': 'Dieses Wort lernen',
  "Finding today's word...": 'Suche das heutige Wort...',
  '✨ Word of the Day: {{word}}': '✨ Wort des Tages: {{word}}',
  'Nice to see you back.': 'Schön, dass du wieder da bist.',
  '{{count}} days': '{{count}} Tage',
  "Some data on this screen couldn't load.":
    'Einige Daten auf diesem Bildschirm konnten nicht geladen werden.',
  'cards due for review': 'Karten zur Wiederholung fällig',
  'Start review': 'Wiederholung starten',
  Review: 'Wiederholen',
  'reviewed today': 'heute wiederholt',
  remembered: 'gemerkt',
  'Quick actions': 'Schnellzugriff',
  'Look up a word': 'Ein Wort nachschlagen',
  'Mining queue': 'Sammel-Warteschlange',
  'Practice cloze': 'Lückentext üben',
  Statistics: 'Statistiken',
  'Recently added': 'Kürzlich hinzugefügt',
  'Recently searched': 'Kürzlich gesucht',
  'Add to Deck': 'Zu Deck hinzufügen',
  'Add to Cloze': 'Als Lückentext hinzufügen',
  'Listen': 'Anhören',
  'Added to deck': 'Zum Deck hinzugefügt',
  'Added to cloze': 'Als Lückentext hinzugefügt',
  'Deck options': 'Deck-Optionen',
  'Move deck': 'Deck verschieben',
  'Merge deck': 'Deck zusammenführen',
  'Merge into another deck': 'In ein anderes Deck zusammenführen',
  'Good morning!': 'Guten Morgen!',
  'Good afternoon!': 'Guten Tag!',
  'Good evening!': 'Guten Abend!',
  'Add Card': 'Karte hinzufügen',
  'Open Deck': 'Deck öffnen',
  'eBook Library': 'eBook-Bibliothek',
  'Import eBook': 'eBook importieren',
  'No eBooks in your library yet': 'Noch keine eBooks in deiner Bibliothek',
  'Loading eBook...': 'eBook wird geladen...',
  'Table of Contents': 'Inhaltsverzeichnis',
  'Reader Settings': 'Leser-Einstellungen',
  'Font Size': 'Schriftgröße',
  'Translate Inline': 'Inline übersetzen',
  'Selected paragraph translation': 'Übersetzung des ausgewählten Absatzes',
  'CEFR level set in settings': 'CEFR-Stufe in den Einstellungen festgelegt',
  'Remove level': 'Stufe entfernen',
  'Set manually': 'Manuell festlegen',
  'Automatic (CEFR)': 'Automatisch (CEFR)',
  'See all': 'Alle anzeigen',
  'No words yet': 'Noch keine Wörter',
  'Look up a word to add your first card.':
    'Schlage ein Wort nach, um deine erste Karte zu erstellen.',
  'Type a German or English word...': 'Ein deutsches oder englisches Wort eingeben...',
  'Instant lookup': 'Sofortnachschlagen',
  'Search in German ("ausgeh...") or English ("go out").\nInflected forms like "ging aus" work too.':
    'Suche auf Deutsch ("ausgeh...") oder Englisch ("go out").\nGebeugte Formen wie "ging aus" funktionieren auch.',
  '"{{term}}" is new': '„{{term}}" ist neu',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    'Dieses Wort ist noch nicht in deiner Bibliothek. Erzeuge Bedeutungen, Beispiele und Synonyme mit KI.',
  'Translating...': 'Übersetze...',
  'Generating...': 'Erzeuge...',
  'Generate with AI': 'Mit KI erzeugen',
  'Add your OpenAI key in Settings to generate new words':
    'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um neue Wörter zu erzeugen',
  'Generation came back incomplete': 'Die Generierung kam unvollständig zurück',
  'From your installed dictionary - free, no AI needed.':
    'Aus deinem installierten Wörterbuch - kostenlos, keine KI nötig.',
  'Nothing was saved - try again.': 'Es wurde nichts gespeichert - versuche es erneut.',
  'Give the deck a name.': 'Gib dem Stapel einen Namen.',
  'Could not delete deck': 'Stapel konnte nicht gelöscht werden',
  'Delete deck?': 'Stapel löschen?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    'Karten, die nur in diesem Stapel sind, werden mit ihm gelöscht. Karten in anderen Stapeln bleiben erhalten.',
  'No deck selected.': 'Kein Stapel ausgewählt.',
  'Could not move deck': 'Stapel konnte nicht verschoben werden',
  'Could not merge deck': 'Stapel konnte nicht zusammengeführt werden',
  'Merge into "{{name}}"?': 'In „{{name}}" zusammenführen?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'Dies löscht „{{source}}" und verschiebt alle Karten nach „{{target}}". Dies kann nicht rückgängig gemacht werden.',
  'Export ready': 'Export bereit',
  'Exported {{count}} cards.': '{{count}} Karten exportiert.',
  'Saved to the folder you chose.': 'Im gewählten Ordner gespeichert.',
  'Choose where to save it.': 'Wähle, wo gespeichert werden soll.',
  'Export failed': 'Export fehlgeschlagen',
  'No decks yet': 'Noch keine Stapel',
  'Create your first deck with the + button.':
    'Erstelle deinen ersten Stapel mit der +-Schaltfläche.',
  'New deck': 'Neuer Stapel',
  'Deck name': 'Stapelname',
  'Creating...': 'Wird erstellt...',
  'Create deck': 'Stapel erstellen',
  'Import into this deck': 'In diesen Stapel importieren',
  'Export this deck': 'Diesen Stapel exportieren',
  'Rename deck': 'Stapel umbenennen',
  'Move to...': 'Verschieben nach...',
  'Merge into...': 'Zusammenführen mit...',
  'Delete deck': 'Stapel löschen',
  'Top level (no parent)': 'Oberste Ebene (kein übergeordneter Stapel)',
  'No other deck to nest this one under.':
    'Kein anderer Stapel, unter dem dieser eingeordnet werden könnte.',
  'No other deck to merge into.': 'Kein anderer Stapel, mit dem zusammengeführt werden könnte.',
  'Import into "{{name}}"': 'In „{{name}}" importieren',
  'Export "{{name}}"': '„{{name}}" exportieren',
  '{{due}} due/{{total}} cards': '{{due}} fällig/{{total}} Karten',
  '{{count}} due': '{{count}} fällig',
  Deck: 'Stapel',
  'This deck no longer exists.': 'Dieser Stapel existiert nicht mehr.',
  cards: 'Karten',
  'due now': 'jetzt fällig',
  'Review {{count}} due cards': '{{count}} fällige Karten wiederholen',
  'Nothing due - study ahead': 'Nichts fällig - im Voraus lernen',
  Cards: 'Karten',
  'No cards yet - add words from Search.': 'Noch keine Karten - füge Wörter über die Suche hinzu.',
  'Move "{{name}}" to...': '„{{name}}" verschieben nach...',
  'Merge "{{name}}" into...': '„{{name}}" zusammenführen mit...',
  'Could not discard capture': 'Erfassung konnte nicht verworfen werden',
  'Could not save capture': 'Erfassung konnte nicht gespeichert werden',
  'Clipboard is empty': 'Zwischenablage ist leer',
  'Copy some text first, then paste it here.':
    'Kopiere zuerst einen Text und füge ihn dann hier ein.',
  'Could not read clipboard': 'Zwischenablage konnte nicht gelesen werden',
  'Add your OpenAI key in Settings to generate cards.':
    'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um Karten zu erzeugen.',
  'Add a sentence': 'Einen Satz hinzufügen',
  'Paste or type a German sentence. It joins the queue below - nothing is sent to AI until you generate.':
    'Füge einen deutschen Satz ein oder tippe ihn. Er landet in der Warteschlange unten - nichts wird an die KI gesendet, bis du generierst.',
  'Paste from clipboard': 'Aus Zwischenablage einfügen',
  'Adding...': 'Wird hinzugefügt...',
  'Add to queue': 'Zur Warteschlange hinzufügen',
  'Queue is empty': 'Warteschlange ist leer',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet - it lands here before any AI processing.':
    'Füge einen Satz manuell hinzu, füge einen aus der Zwischenablage ein oder erfasse Text über das Teilen-Menü - er landet hier, bevor er von der KI verarbeitet wird.',
  '{{done}} of {{total}} generated': '{{done}} von {{total}} erzeugt',
  '{{count}} failed': '{{count}} fehlgeschlagen',
  'Explore Full AI Flashcard': 'Vollständige KI-Karte erkunden',
  'Generate Full AI Flashcard': 'Vollständige KI-Karte generieren',
  'AI Insights': 'KI-Einblicke',
  'Getting AI insights for "{{word}}"...': 'Holt KI-Einblicke für „{{word}}"...',
  'Load more phrases with AI': 'Weitere Wendungen mit KI laden',
  'Explore idioms and collocations with AI': 'Redewendungen mit KI entdecken',
  'Tap the sparkle above to explore idioms, expressions, and common word combinations.':
    'Tippe oben auf das Funkeln, um Redewendungen, Ausdrücke und gängige Wortkombinationen zu entdecken.',
  'Could not load more info': 'Weitere Infos konnten nicht geladen werden',
  'Add your AI provider key in Settings to generate more info.':
    'Füge deinen KI-Anbieter-Schlüssel in den Einstellungen hinzu, um weitere Infos zu generieren.',
  'No additional info available yet.': 'Noch keine weiteren Infos verfügbar.',
  'Generate more examples': 'Weitere Beispiele generieren',
  'Generating more examples...': 'Weitere Beispiele werden generiert...',
  'Advanced Grammar Options': 'Erweiterte Grammatikoptionen',
  'Select grammar structures to exercise in your examples:': 'Wähle Grammatikstrukturen für deine Beispiele aus:',
  'Generate targeted examples': 'Gezielte Beispiele generieren',
  'Custom Grammar Rule': 'Eigene Grammatikregel',
  'e.g. Past perfect continuous, reported speech...': 'z. B. Plusquamperfekt, indirekte Rede...',
  '✨ AI enriching meanings & examples...': '✨ KI ergänzt Bedeutungen & Beispiele...',
  'AI Enrichment Failed': 'KI-Anreicherung fehlgeschlagen',
  'Selected model is not accessible with your {{providerName}} key/project. Try selecting a different model in Settings > AI Providers.':
    'Das ausgewählte Modell ist mit Ihrem {{providerName}}-Schlüssel/Projekt nicht zugänglich. Versuchen Sie, ein anderes Modell in Einstellungen > KI-Anbieter auszuwählen.',
  '{{providerName}} credit balance or quota exceeded. Please check your account plan and billing details.':
    'Guthaben oder Kontingent von {{providerName}} überschritten. Bitte überprüfen Sie Ihren Tarif und Ihre Abrechnungsdaten.',
  '{{providerName}} rate limit reached. Please wait a few seconds and try again.':
    'Ratenlimit von {{providerName}} erreicht. Bitte warten Sie einige Sekunden und versuchen Sie es erneut.',
  'Invalid {{providerName}} API key or permission denied. Please check your key in Settings > AI Providers.':
    'Ungültiger {{providerName}}-API-Schlüssel oder Zugriff verweigert. Bitte überprüfen Sie Ihren Schlüssel in Einstellungen > KI-Anbieter.',
  "Couldn't reach {{providerName}} - check your device's internet connection and try again.":
    '{{providerName}} konnte nicht erreicht werden - überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
  '{{providerName}} servers are temporarily unavailable ({{status}}). Please try again shortly.':
    'Server von {{providerName}} sind vorübergehend nicht erreichbar ({{status}}). Bitte versuchen Sie es in Kürze erneut.',
  'see Decks.': 'siehe Stapel.',
  "Review your captures. Discard what you don't need, then generate cards for the rest - no API call is wasted on text you didn't ask for.":
    'Überprüfe deine Erfassungen. Verwirf, was du nicht brauchst, und erzeuge dann Karten für den Rest - kein API-Aufruf wird für Text verschwendet, den du nicht angefordert hast.',
  'Generate {{count}} cards with AI': '{{count}} Karten mit KI erzeugen',
  'Add your OpenAI key to generate cards':
    'Füge deinen OpenAI-Schlüssel hinzu, um Karten zu erzeugen',
  'Add your OpenAI key in Settings to generate examples.':
    'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um Beispiele zu erzeugen.',
  'This word has no card yet.': 'Dieses Wort hat noch keine Karte.',
  'Could not save your feedback': 'Dein Feedback konnte nicht gespeichert werden',
  'Could not save your report': 'Deine Meldung konnte nicht gespeichert werden',
  'Could not change the primary meaning': 'Die Hauptbedeutung konnte nicht geändert werden',
  'Could not update the flashcard example':
    'Das Karteikarten-Beispiel konnte nicht aktualisiert werden',
  'This word has no meaning yet.': 'Dieses Wort hat noch keine Bedeutung.',
  'Could not generate an explanation': 'Eine Erklärung konnte nicht erzeugt werden',
  'AI not configured': 'KI nicht konfiguriert',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'Füge einen OpenAI-, Mistral-, Gemini- oder Claude-Schlüssel in den Einstellungen hinzu, um eine Erklärung für diese Bedeutung zu erzeugen.',
  'Could not look up an explanation': 'Eine Erklärung konnte nicht nachgeschlagen werden',
  'Could not save your changes': 'Deine Änderungen konnten nicht gespeichert werden',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '„{{form}}" ist noch nicht in deiner Bibliothek. Schlage es über die Suche nach, um es zu erzeugen.',
  'No explanation yet.': 'Noch keine Erklärung.',
  'Make primary: {{translation}}': 'Als Hauptbedeutung festlegen: {{translation}}',
  Examples: 'Beispiele',
  'shown on flashcard': 'auf Karteikarte angezeigt',
  'use on flashcard': 'auf Karteikarte verwenden',
  'Advanced grammar options': 'Erweiterte Grammatikoptionen',
  'Active: {{selection}}': 'Aktiv: {{selection}}',
  'Generate examples': 'Beispiele erzeugen',
  'Add your OpenAI key in Settings to generate targeted examples.':
    'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um gezielte Beispiele zu erzeugen.',
  'Meanings in this word': 'Bedeutungen dieses Wortes',
  'Grammar info': 'Grammatikinfo',
  'Hide grammar info': 'Grammatikinfo ausblenden',
  'chat with your AI tutor': 'mit deinem KI-Tutor zu chatten',
  'Ask about "{{word}}"': 'Frag zu „{{word}}"',
  'Chat with your AI tutor about this word - ask for more examples, nuance, or anything unclear.':
    'Chatte mit deinem KI-Tutor über dieses Wort - frag nach weiteren Beispielen, Nuancen oder allem Unklaren.',
  "Couldn't load the explanation.": 'Die Erklärung konnte nicht geladen werden.',
  "Couldn't load additional info.": 'Zusätzliche Infos konnten nicht geladen werden.',
  'Nothing to chat about yet': 'Noch nichts zum Chatten',
  "This card has no meaning content yet, so there's nothing to discuss. Open it from the word's own page and try Regenerate there.":
    'Diese Karte hat noch keinen Bedeutungsinhalt, es gibt also nichts zu besprechen. Öffne sie auf der eigenen Wortseite und versuche es dort mit „Neu erzeugen".',
  'Give me another example': 'Gib mir ein weiteres Beispiel',
  "What's a synonym for this?": 'Was ist ein Synonym dafür?',
  'When would I use this?': 'Wann würde ich das benutzen?',
  "Couldn't get a reply.": 'Antwort konnte nicht abgerufen werden.',
  'Message your AI tutor...': 'Schreib deinem KI-Tutor...',
  Synonyms: 'Synonyme',
  'Phrases & collocations': 'Redewendungen & Kollokationen',
  'Cloze card': 'Lückentext-Karte',
  'Cloze cards': 'Lückentext-Karten',
  'Added ✓ - add to another deck': 'Hinzugefügt ✓ - zu einem weiteren Stapel hinzufügen',
  'Add to deck': 'Zu Stapel hinzufügen',
  'Add "{{form}}" to...': '„{{form}}" hinzufügen zu...',
  'Edit this card': 'Diese Karte bearbeiten',
  Meaning: 'Bedeutung',
  'Example sentence': 'Beispielsatz',
  'Example translation': 'Beispielübersetzung',
  'Save changes': 'Änderungen speichern',
  "What's wrong with this?": 'Was stimmt hier nicht?',
  'Optional details...': 'Optionale Details...',
  'Send report': 'Meldung senden',
  'Sending...': 'Wird gesendet...',
  'Inaccurate translation': 'Ungenaue Übersetzung',
  'Unnatural phrasing': 'Unnatürliche Formulierung',
  'Wrong CEFR level': 'Falsches GER-Niveau',
  'Grammar error': 'Grammatikfehler',
  Other: 'Sonstiges',
  'Tense & mood': 'Zeitform & Modus',
  'Sentence structure': 'Satzbau',
  Conjunctions: 'Konjunktionen',
  'Focus words': 'Fokuswörter',
  GOOD: 'GUT',
  AGAIN: 'NOCHMAL',
  EASY: 'LEICHT',
  HARD: 'SCHWER',
  'No card to rate.': 'Keine Karte zum Bewerten.',
  'Could not save your rating': 'Deine Bewertung konnte nicht gespeichert werden',
  'No card to edit.': 'Keine Karte zum Bearbeiten.',
  'Add your AI provider key in Settings to generate an explanation.':
    'Füge deinen KI-Anbieter-Schlüssel in den Einstellungen hinzu, um eine Erklärung zu erzeugen.',
  'Nothing due right now': 'Gerade nichts fällig',
  'Session complete!': 'Sitzung abgeschlossen!',
  'This deck has no cards due for review. Add words or check back later.':
    'Dieser Stapel hat keine fälligen Karten. Füge Wörter hinzu oder schau später wieder vorbei.',
  'You reviewed {{count}} cards. Great work - come back when the next cards are due.':
    'Du hast {{count}} Karten wiederholt. Gut gemacht - komm wieder, wenn die nächsten Karten fällig sind.',
  'Back to deck': 'Zurück zum Stapel',
  'tap to reveal': 'zum Aufdecken tippen',
  cloze: 'Lückentext',
  'Basic inline HTML works too - {{bold}}, {{italic}}, {{colored}}.':
    'Einfaches Inline-HTML funktioniert auch - {{bold}}, {{italic}}, {{colored}}.',
  'No stats yet': 'Noch keine Statistiken',
  'Add and review some words to see your learning statistics here.':
    'Füge Wörter hinzu und wiederhole sie, um hier deine Lernstatistiken zu sehen.',
  'remembered (30 d)': 'gemerkt (30 T.)',
  'day streak': 'Tage-Serie',
  'total cards': 'Karten insgesamt',
  'new this week': 'neu diese Woche',
  'Review activity': 'Wiederholungsaktivität',
  less: 'weniger',
  more: 'mehr',
  'Vocabulary growth': 'Vokabelwachstum',
  'new words per week': 'neue Wörter pro Woche',
  'Difficult words': 'Schwierige Wörter',
  'No lapses yet - nothing difficult to show.':
    'Noch keine Rückfälle - nichts Schwieriges zu zeigen.',
  '{{count}} lapses': '{{count}} Rückfälle',
  'Anki deck (.apkg)': 'Anki-Stapel (.apkg)',
  "Bring your existing decks. Review history isn't imported - cards start fresh.":
    'Bring deine bestehenden Stapel mit. Der Wiederholungsverlauf wird nicht importiert - Karten starten neu.',
  'Choose .apkg file': '.apkg-Datei auswählen',
  'CSV with column mapping': 'CSV mit Spaltenzuordnung',
  'From Quizlet, Memrise, or spreadsheets.': 'Von Quizlet, Memrise oder Tabellenkalkulationen.',
  'Choose CSV file': 'CSV-Datei auswählen',
  'A shared deck (.lem)': 'Ein geteilter Stapel (.lem)',
  "Add a deck someone shared with you - full fidelity, including review history. Doesn't touch anything else on this device.":
    'Füge einen Stapel hinzu, den dir jemand geteilt hat - vollständig, inklusive Wiederholungsverlauf. Berührt nichts anderes auf diesem Gerät.',
  'Choose .lem file': '.lem-Datei auswählen',
  'Restore from Lemmory backup (.lem)': 'Aus Lemmory-Sicherung wiederherstellen (.lem)',
  'Replaces everything on this device with a previously exported backup.':
    'Ersetzt alles auf diesem Gerät durch eine zuvor exportierte Sicherung.',
  'Restoring...': 'Wird wiederhergestellt...',
  'Choose backup file': 'Sicherungsdatei auswählen',
  'Lemmory backup (.lem)': 'Lemmory-Sicherung (.lem)',
  'Your full library - decks, cards, review history. Your data is always yours. API keys are never included.':
    'Deine gesamte Bibliothek - Stapel, Karten, Wiederholungsverlauf. Deine Daten gehören immer dir. API-Schlüssel sind nie enthalten.',
  'Export everything': 'Alles exportieren',
  'One row per card - the same columns CSV import reads, so this file re-imports as-is.':
    'Eine Zeile pro Karte - dieselben Spalten, die der CSV-Import liest, sodass diese Datei unverändert wieder importiert werden kann.',
  'Export as CSV': 'Als CSV exportieren',
  "Study your Lemmory vocabulary in Anki/AnkiDroid. Cards start fresh - review history isn't carried over.":
    'Lerne deine Lemmory-Vokabeln in Anki/AnkiDroid. Karten starten neu - der Wiederholungsverlauf wird nicht übernommen.',
  'Export as .apkg': 'Als .apkg exportieren',
  'A readable word - meaning - example list. Not meant to re-import.':
    'Eine lesbare Wort-Bedeutung-Beispiel-Liste. Nicht zum erneuten Import gedacht.',
  'Export as Markdown': 'Als Markdown exportieren',
  'Backup ready': 'Sicherung bereit',
  'Restore from backup?': 'Aus Sicherung wiederherstellen?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'Dies ersetzt alles, was derzeit auf diesem Gerät ist, durch den Inhalt von „{{fileName}}" (exportiert am {{date}}). Dies kann nicht rückgängig gemacht werden.',
  Restore: 'Wiederherstellen',
  'Restore complete': 'Wiederherstellung abgeschlossen',
  'Restored {{count}} rows.': '{{count}} Zeilen wiederhergestellt.',
  'Restore failed': 'Wiederherstellung fehlgeschlagen',
  'Invalid backup file': 'Ungültige Sicherungsdatei',
  'Could not read file': 'Datei konnte nicht gelesen werden',
  Preview: 'Vorschau',
  'Will import': 'Wird importiert',
  Duplicates: 'Duplikate',
  Errors: 'Fehler',
  Selected: 'Ausgewählt',
  'Import {{count}} rows': '{{count}} Zeilen importieren',
  'Import {{count}} words': '{{count}} Wörter importieren',
  'Import from CSV': 'Aus CSV importieren',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Von Quizlet, Memrise oder einem Tabellenexport. Als Nächstes legst du fest, was jede Spalte bedeutet.',
  '{{count}} rows detected. Map each column below.':
    '{{count}} Zeilen erkannt. Ordne unten jede Spalte zu.',
  'Sample data': 'Beispieldaten',
  'The first few rows, so you can see what each column actually holds.':
    'Die ersten paar Zeilen, damit du siehst, was jede Spalte tatsächlich enthält.',
  'Column {{n}}': 'Spalte {{n}}',
  'Field mapping': 'Feldzuordnung',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes - they're derived from the example's cloze markup and its translation.":
    'Alles ist optional. Lasse Wort/Bedeutung bei Lückentext-Notizen unzugeordnet - sie werden aus der Lückentext-Markierung des Beispiels und dessen Übersetzung abgeleitet.',
  None: 'Keine',
  'Import into deck': 'In Stapel importieren',
  '+ New deck': '+ Neuer Stapel',
  'If the word already exists': 'Falls das Wort bereits existiert',
  'Applies to every duplicate row you leave checked in the next step.':
    'Gilt für jede markierte Duplikat-Zeile im nächsten Schritt.',
  'Checking...': 'Wird geprüft...',
  'Preview import': 'Import-Vorschau',
  'Importing...': 'Wird importiert...',
  'Import complete': 'Import abgeschlossen',
  'Imported {{count}} words.': '{{count}} Wörter importiert.',
  Imported: 'Importiert',
  Skipped: 'Übersprungen',
  Failed: 'Fehlgeschlagen',
  'Import another file': 'Weitere Datei importieren',
  'Could not read this file': 'Diese Datei konnte nicht gelesen werden',
  'Import failed': 'Import fehlgeschlagen',
  'This file has no rows to import.': 'Diese Datei enthält keine importierbaren Zeilen.',
  Word: 'Wort',
  Example: 'Beispiel',
  Issues: 'Probleme',
  Skip: 'Überspringen',
  "Don't touch the existing word.": 'Bestehendes Wort nicht verändern.',
  Merge: 'Zusammenführen',
  'Add this as another meaning on the existing card.':
    'Als weitere Bedeutung zur bestehenden Karte hinzufügen.',
  'Keep both': 'Beide behalten',
  'Add a second, separate card for the same word.':
    'Eine zweite, separate Karte für dasselbe Wort hinzufügen.',
  'Import from Anki': 'Aus Anki importieren',
  "Choose a `.apkg` export. Review history isn't imported - every card starts fresh - and media (audio/images) is stripped rather than copied.":
    'Wähle einen `.apkg`-Export. Der Wiederholungsverlauf wird nicht importiert - jede Karte startet neu - und Medien (Audio/Bilder) werden entfernt statt kopiert.',
  '{{notes}} notes across {{decks}} decks. Map each field below - it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{notes}} Notizen in {{decks}} Stapeln. Ordne unten jedes Feld zu - es gilt für jede Notiz, ein Notiztyp ohne so viele Felder bleibt dann einfach leer.',
  'The first few notes, so you can see what each field actually holds.':
    'Die ersten paar Notizen, damit du siehst, was jedes Feld tatsächlich enthält.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes - they're derived from the example's cloze markup and its translation.":
    'Alles ist optional. Lasse Wort/Bedeutung bei Lückentext-Notizen unzugeordnet - sie werden aus der Lückentext-Markierung des Beispiels und dessen Übersetzung abgeleitet.',
  'Field {{n}}': 'Feld {{n}}',
  'This collection has no notes to import.': 'Diese Sammlung enthält keine importierbaren Notizen.',
  'Could not read this collection': 'Diese Sammlung konnte nicht gelesen werden',
  '{{done}} of {{total}} notes': '{{done}} von {{total}} Notizen',
  'Import canceled': 'Import abgebrochen',
  'The rest were left untouched - you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'Der Rest wurde nicht verändert - du kannst dieselbe Datei erneut importieren, um dort weiterzumachen (bereits importierte Wörter werden als Duplikate übersprungen).',
  'Import from a .lem file': 'Aus einer .lem-Datei importieren',
  'Choose a Lemmory `.lem` file - a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    'Wähle eine Lemmory-`.lem`-Datei - einen von jemandem geteilten Stapel oder einen deiner eigenen Stapel-Exporte. Vollständig: Bedeutungen, Beispiele, Synonyme, Lückentext-Karten, Wiederholungsverlauf und FSRS-Planung werden alle übernommen.',
  'This file has more than one deck. Which one do you want to import?':
    'Diese Datei enthält mehr als einen Stapel. Welchen möchtest du importieren?',
  'This file has no decks to import.': 'Diese Datei enthält keine importierbaren Stapel.',
  'Importing "{{name}}" ({{count}} cards).': 'Importiere „{{name}}" ({{count}} Karten).',
  "Don't touch the word already in your library.":
    'Bereits in der Bibliothek vorhandenes Wort nicht verändern.',
  'Imported {{words}} words ({{cards}} cards).': '{{words}} Wörter importiert ({{cards}} Karten).',
  Vocabulary: 'Vokabeln',
  Cloze: 'Lückentext',
  '+ New': '+ Neu',
  Front: 'Vorderseite',
  'actual review card size on this device': 'tatsächliche Kartengröße auf diesem Gerät',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'Gerendert mit einem Beispiel-Lückentextsatz über dieselbe Engine, die auch die Wiederholungssitzung nutzt.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'Gerendert mit Beispieldaten ("ausgehen") über dieselbe Engine, die auch die Wiederholungssitzung nutzt.',
  'Template name': 'Vorlagenname',
  Fields: 'Felder',
  'Tap "Front" or "Back" to show a field on that side - a field can appear on both, or neither.':
    'Tippe auf „Vorderseite" oder „Rückseite", um ein Feld auf dieser Seite anzuzeigen - ein Feld kann auf beiden, auf keiner erscheinen.',
  'Layout & style': 'Layout & Stil',
  'Reset to default': 'Auf Standard zurücksetzen',
  'Accent color': 'Akzentfarbe',
  'Stored as a': 'Gespeichert als',
  'rule - reference it in your CSS below as': 'Regel - referenziere sie in deinem CSS unten als',
  'Applied to both sides in the real WebView renderer.':
    'Wird auf beide Seiten im echten WebView-Renderer angewendet.',
  'Front (Liquid)': 'Vorderseite (Liquid)',
  'Back (Liquid)': 'Rückseite (Liquid)',
  'Available template variables': 'Verfügbare Vorlagenvariablen',
  'Conditional example': 'Bedingtes Beispiel',
  'Set default': 'Als Standard festlegen',
  'Deleting...': 'Wird gelöscht...',
  'Delete this template?': 'Diese Vorlage löschen?',
  '"{{name}}" will be removed.': '„{{name}}" wird entfernt.',
  'Create template': 'Vorlage erstellen',
  'Template editor help': 'Hilfe zum Vorlagen-Editor',
  'Fields tab': 'Reiter „Felder"',
  'Style tab': 'Reiter „Stil"',
  'Preview tab': 'Reiter „Vorschau"',
  'Code tab': 'Reiter „Code"',
  'HTML & CSS without extra elements': 'HTML & CSS ohne zusätzliche Elemente',
  'Could not save template': 'Vorlage konnte nicht gespeichert werden',
  'Could not set default template': 'Standardvorlage konnte nicht festgelegt werden',
  'Could not delete template': 'Vorlage konnte nicht gelöscht werden',
  'New template': 'Neue Vorlage',
  'Reset to default layout & style?': 'Auf Standardlayout & -stil zurücksetzen?',
  'This replaces the front, back, and CSS in the editor - tap "Save changes" to keep it. Unsaved edits are lost.':
    'Dies ersetzt Vorder-, Rückseite und CSS im Editor - tippe auf „Änderungen speichern", um es zu behalten. Ungespeicherte Änderungen gehen verloren.',
  Reset: 'Zurücksetzen',
  'Speaking rate': 'Sprechgeschwindigkeit',
  Pitch: 'Tonhöhe',
  'Voice (German)': 'Stimme (Deutsch)',
  'No German voices are installed on this device.':
    'Auf diesem Gerät sind keine deutschen Stimmen installiert.',
  'Device default': 'Gerätestandard',
  Enhanced: 'Erweitert',
  "Voices come from the device's own text-to-speech engine - install more from your phone's system settings if you don't see the one you want.":
    'Stimmen stammen von der eigenen Text-zu-Sprache-Engine des Geräts - installiere weitere über die Systemeinstellungen deines Telefons, falls die gewünschte fehlt.',
  'Playing...': 'Wird abgespielt...',
  Test: 'Testen',
  'Could not install this chunk': 'Dieser Abschnitt konnte nicht installiert werden',
  'Could not remove this chunk': 'Dieser Abschnitt konnte nicht entfernt werden',
  'Local Dictionaries installed': 'Lokale Wörterbücher installiert',
  'Installed {{count}} new chunks.': '{{count}} neue Abschnitte installiert.',
  'Could not install local dictionaries': 'Lokale Wörterbücher konnten nicht installiert werden',
  '{{language}}-English Dictionary': '{{language}}-Englisch-Wörterbuch',
  '{{installed}} installed · {{available}} available to install':
    '{{installed}} installiert · {{available}} verfügbar zum Installieren',
  'Install all available': 'Alle verfügbaren installieren',
  Chunks: 'Abschnitte',
  'Words {{start}}-{{end}}': 'Wörter {{start}}-{{end}}',
  '{{count}} words': '{{count}} Wörter',
  'Uninstall all': 'Alle deinstallieren',
  'Uninstalling...': 'Wird deinstalliert...',
  'Local Dictionaries uninstalled': 'Lokale Wörterbücher deinstalliert',
  'Removed {{count}} chunks.': '{{count}} Abschnitte entfernt.',
  'Could not uninstall local dictionaries':
    'Lokale Wörterbücher konnten nicht deinstalliert werden',
  'Uninstall all local dictionaries?': 'Alle lokalen Wörterbücher deinstallieren?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'Entfernt jeden installierten Abschnitt von diesem Gerät. Bereits zu deinem Stapel hinzugefügte Karten sind davon nicht betroffen.',
  'No translation to add.': 'Keine Übersetzung zum Hinzufügen.',
  'No dictionary entry to add.': 'Kein Wörterbucheintrag zum Hinzufügen.',
  'More info': 'Mehr Infos',
  'Hide details': 'Details ausblenden',
  'Understanding the {{language}} {{wordClass}} "{{headword}}"':
    'Das {{language}} {{wordClass}} „{{headword}}" verstehen',
  Usage: 'Verwendung',
  'Examples of Usage': 'Anwendungsbeispiele',
  Noun: 'Substantiv',
  Adjective: 'Adjektiv',
  Preposition: 'Präposition',
  Conjunction: 'Konjunktion',
  Pronoun: 'Pronomen',
  Article: 'Artikel',
  Phrase: 'Redewendung',
  Connected: 'Verbunden',
  'No internet connection': 'Keine Internetverbindung',
  'DeepL validation failed': 'DeepL-Überprüfung fehlgeschlagen',
  '{{provider}} validation failed': '{{provider}}-Überprüfung fehlgeschlagen',
  'Delete all API keys?': 'Alle API-Schlüssel löschen?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'Dies entfernt jeden Anbieter-Schlüssel von diesem Gerät. Vokabeln und Fortschritt sind davon nicht betroffen.',
  'Limited mode': 'Eingeschränkter Modus',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    'Ohne Generierungs-Schlüssel ist die Kartenerstellung mit KI deaktiviert. Übersetzung und manuelle Karten funktionieren weiterhin. Füge einem der Anbieter unten einen Schlüssel hinzu, um alle Funktionen zu nutzen.',
  "Couldn't load saved settings": 'Gespeicherte Einstellungen konnten nicht geladen werden',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key - nothing is sent until you generate a card.':
    'Die Kartenerstellung (Bedeutungen, Beispiele, Cluster, Redewendungen, Lückentext) nutzt den unten konfigurierten und aktivierten Anbieter. Bring deinen eigenen API-Schlüssel mit - es wird nichts gesendet, bevor du eine Karte erzeugst.',
  'Active provider': 'Aktiver Anbieter',
  Model: 'Modell',
  'Paste your {{provider}} API key...': 'Füge deinen {{provider}}-API-Schlüssel ein...',
  'Hide {{provider}} API key': '{{provider}}-API-Schlüssel ausblenden',
  'Show {{provider}} API key': '{{provider}}-API-Schlüssel anzeigen',
  'Validate key': 'Schlüssel prüfen',
  Clear: 'Leeren',
  'Semantic Contexts': 'Semantische Kontexte',
  'Delete this card?': 'Diese Karte löschen?',
  'This permanently deletes this card and all its meanings, examples, synonyms, phrases, and cloze variations. This cannot be undone.':
    'Dies löscht diese Karte und alle ihre Bedeutungen, Beispiele, Synonyme, Redewendungen und Lückentexte dauerhaft. Dies kann nicht rückgängig gemacht werden.',
  'Could not delete this card': 'Diese Karte konnte nicht gelöscht werden',
  '{{count}} contexts': '{{count}} Kontexte',
  'Device-observed usage': 'Auf dem Gerät beobachtete Nutzung',
  '{{count}} requests': '{{count}} Anfragen',
  '{{count}} tokens': '{{count}} Tokens',
  'Open {{provider}} usage ↗': '{{provider}}-Nutzung öffnen ↗',
  'Google Translate': 'Google Übersetzer',
  'Free tier, no key needed': 'Kostenlose Stufe, kein Schlüssel nötig',
  'Uses this provider\'s key above': 'Verwendet den obigen Schlüssel dieses Anbieters',
  'Add a key above to enable': 'Füge oben einen Schlüssel hinzu, um zu aktivieren',
  Active: 'Aktiv',
  'Best German↔English quality - bring your own key':
    'Beste Deutsch↔Englisch-Qualität - eigenen Schlüssel mitbringen',
  'Hide DeepL settings': 'DeepL-Einstellungen ausblenden',
  'Show DeepL settings': 'DeepL-Einstellungen anzeigen',
  'Paste your DeepL API key...': 'Füge deinen DeepL-API-Schlüssel ein...',
  Enabled: 'Aktiviert',
  'Open DeepL usage ↗': 'DeepL-Nutzung öffnen ↗',
  'v0.0.1 · offline-first · your data stays on device':
    'v0.0.1 · offline-first · deine Daten bleiben auf dem Gerät',
  'Opening your vocabulary...': 'Vokabeln werden geöffnet...',
  'Import CSV': 'CSV importieren',
  'Import Anki deck': 'Anki-Stapel importieren',
  'Card Templates': 'Kartenvorlagen',
  '"Add to deck" at the bottom is how you start reviewing this word - you can add it to more than one deck, or create a new one on the spot.':
    '„Zu Stapel hinzufügen" unten ist der Weg, um mit diesem Wort zu üben - du kannst es zu mehreren Stapeln hinzufügen oder direkt einen neuen erstellen.',
  '"Ask AI" opens a small chat where you can type a follow-up question about this specific word.':
    '„KI fragen" öffnet einen kleinen Chat, in dem du eine Anschlussfrage zu genau diesem Wort stellen kannst.',
  '"Explain" (or "More info" on an AI-generated card) shows or expands a direct explanation of what the word means and where or why it\'s used.':
    '„Erklären" (oder „Mehr Infos" bei einer KI-generierten Karte) zeigt bzw. erweitert eine direkte Erklärung, was das Wort bedeutet und wo oder warum man es verwendet.',
  '"Follow device" just matches whatever language your phone is already set to.':
    '„Gerätesprache verwenden" übernimmt einfach die Sprache, die dein Handy bereits eingestellt hat.',
  '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.':
    '„Mit KI erzeugen" erstellt eine vollständige Erklärkarte mit Bedeutungen, Beispielen, Grammatik und mehr - mit dem KI-Anbieter, den du in den Einstellungen eingerichtet hast.',
  'The "AI Insights" preview gives a short, direct explanation of what the word means and where or why it\'s used - tap it any time to generate the full flashcard.':
    'Die Vorschau „KI-Einblicke" liefert eine kurze, direkte Erklärung, was das Wort bedeutet und wo oder warum man es verwendet - tippe jederzeit darauf, um die vollständige Karte zu erzeugen.',
  "\"Regenerate\" throws away this card's meanings, examples, synonyms, phrases, and cloze cards, and generates all of it fresh - useful if the current version isn't working for you. This can't be undone.":
    '„Neu erzeugen" verwirft die Bedeutungen, Beispiele, Synonyme, Redewendungen und Lückentext-Karten dieser Karte und erstellt alles neu - nützlich, wenn die aktuelle Version nicht zu dir passt. Das kann nicht rückgängig gemacht werden.',
  '"Test active engine" plays the Test phrase through whichever engine is marked Active - the same thing any real speaker button in the app does.':
    '„Aktive Engine testen" spielt den Testsatz über die als Aktiv markierte Engine ab - genau das, was jede echte Lautsprecher-Schaltfläche in der App auch tut.',
  'A cloze card blanks out part of a sentence for you to fill in - a different way of practicing the same word.':
    'Eine Lückentext-Karte blendet einen Teil eines Satzes aus, den du ausfüllen sollst - eine andere Art, dasselbe Wort zu üben.',
  'A green checkmark means the word is already in one of your decks.':
    'Ein grünes Häkchen bedeutet, dass das Wort bereits in einem deiner Stapel ist.',
  'A short summary': 'Eine kurze Zusammenfassung',
  'AI Providers': 'KI-Anbieter',
  'AI-generated - explanations can be inaccurate. Check important details against a trusted reference.':
    'KI-generiert - Erklärungen können ungenau sein. Überprüfe wichtige Details mit einer vertrauenswürdigen Quelle.',
  'On an AI-generated card, the short explanation right below the translation states directly what the word means and where or why it\'s used - not a hint to figure out yourself.':
    'Bei einer KI-generierten Karte gibt die kurze Erklärung direkt unter der Übersetzung unmittelbar an, was das Wort bedeutet und wo oder warum man es verwendet - kein Rätsel zum Selbst-Herausfinden.',
  'Accent color swatches write a custom property at the top of your CSS:':
    'Akzentfarb-Kacheln schreiben eine benutzerdefinierte Eigenschaft an den Anfang deines CSS:',
  'Add "{{term}}" to...': '„{{term}}" hinzufügen zu...',
  'Add a key in AI Providers to enable':
    'Füge einen Schlüssel bei KI-Anbieter hinzu, um zu aktivieren',
  'Add a sentence by typing it, pasting it from your clipboard, or sharing text here from another app.':
    'Füge einen Satz hinzu, indem du ihn eingibst, aus der Zwischenablage einfügst oder Text aus einer anderen App hierher teilst.',
  'Add card': 'Karte hinzufügen',
  'Add card manually': 'Karte manuell hinzufügen',
  'Add to Lemmory': 'Zu Lemmory hinzufügen',
  'Add to Mining queue': 'Zur Sammel-Warteschlange hinzufügen',
  'Add your AI provider key in Settings to ask a follow-up.':
    'Füge deinen KI-Anbieter-Schlüssel in den Einstellungen hinzu, um eine Anschlussfrage zu stellen.',
  'Add your AI provider key in Settings to regenerate this card.':
    'Füge deinen KI-Anbieter-Schlüssel in den Einstellungen hinzu, um diese Karte neu zu erzeugen.',
  'Adding from other apps': 'Hinzufügen aus anderen Apps',
  'Adding to a deck': 'Zu einem Stapel hinzufügen',
  Adverb: 'Adverb',
  'All caught up - nothing due right now.': 'Alles erledigt - gerade nichts fällig.',
  'Alternatively, generate a new key from a project that already has it enabled (or the "Default project" if you have one).':
    'Alternativ kannst du einen neuen Schlüssel aus einem Projekt erzeugen, in dem es bereits aktiviert ist (oder dem „Default project", falls du eins hast).',
  'Always open Search, split between Search and the Mining queue depending on how much text it is, or ask you every time.':
    'Immer die Suche öffnen, je nach Textmenge zwischen Suche und Sammel-Warteschlange aufteilen, oder dich jedes Mal fragen.',
  Answer: 'Antwort',
  'App version, platform, and feature tier - helps reproduce a bug.':
    'App-Version, Plattform und Funktionsstufe - hilft, einen Fehler nachzuvollziehen.',
  'App {{version}} · {{platform}} · {{tier}}': 'App {{version}} · {{platform}} · {{tier}}',
  'Applies across the app.': 'Gilt für die gesamte App.',
  Ask: 'Fragen',
  'Ask AI': 'KI fragen',
  'Ask a follow-up question, maximum {{max}} characters':
    'Stelle eine Anschlussfrage, maximal {{max}} Zeichen',
  'Ask a short follow-up...': 'Stelle eine kurze Anschlussfrage...',
  'Asking...': 'Wird gefragt...',
  'At most every': 'Höchstens alle',
  'Audio Settings': 'Audio-Einstellungen',
  'Audio Settings help': 'Hilfe zu Audio-Einstellungen',
  'Audio settings, app language': 'Audio-Einstellungen, App-Sprache',
  'Aura-2. Once your key is entered, choose from Deepgram\'s available models, or switch to manual entry to enter a model name directly (see Deepgram\'s docs for exact names).':
    'Aura-2. Sobald dein Schlüssel eingegeben ist, wähle aus den verfügbaren Deepgram-Modellen oder wechsle zur manuellen Eingabe, um einen Modellnamen direkt einzugeben (die genauen Namen findest du in der Deepgram-Dokumentation).',
  'Automatic sync': 'Automatische Synchronisierung',
  CSS: 'CSS',
  CSV: 'CSV',
  'Choose a voice...': 'Wähle eine Stimme...',
  'Choose from your {{provider}} voices instead':
    'Wähle stattdessen aus deinen {{provider}}-Stimmen',
  'Choosing what to keep': 'Auswählen, was behalten wird',
  'Cloud providers are bring-your-own-key - nothing is sent to them until you tap a speaker icon or press Test.':
    'Cloud-Anbieter funktionieren nach dem Prinzip „eigener Schlüssel" - es wird nichts an sie gesendet, bis du auf ein Lautsprecher-Symbol tippst oder Testen drückst.',
  'Comma-separated': 'Durch Komma getrennt',
  'Could not add card': 'Karte konnte nicht hinzugefügt werden',
  'Could not create deck': 'Stapel konnte nicht erstellt werden',
  'Could not generate an example': 'Ein Beispiel konnte nicht erzeugt werden',
  'Could not get an answer': 'Es konnte keine Antwort abgerufen werden',
  'Could not regenerate this card': 'Diese Karte konnte nicht neu erzeugt werden',
  'Could not remove card': 'Karte konnte nicht entfernt werden',
  'Could not reset progress': 'Fortschritt konnte nicht zurückgesetzt werden',
  'Could not sign in': 'Anmeldung fehlgeschlagen',
  Create: 'Erstellen',
  'Create & select': 'Erstellen & auswählen',
  'Create new deck': 'Neuen Stapel erstellen',
  'Creating a GitHub issue needs a token with write access to the repo - that can never ship inside the app, since a compiled build can be decompiled and any embedded secret treated as public.':
    'Das Erstellen eines GitHub-Issues erfordert ein Token mit Schreibzugriff auf das Repository - das kann niemals in der App enthalten sein, da ein kompilierter Build dekompiliert werden kann und jedes eingebettete Geheimnis dann als öffentlich gilt.',
  Deepgram: 'Deepgram',
  'Default: {{voice}}': 'Standard: {{voice}}',
  'Delete All AI Providers Keys': 'Alle KI-Anbieter-Schlüssel löschen',
  'Delete all AI provider keys?': 'Alle KI-Anbieter-Schlüssel löschen?',
  'Depending on a setting in Settings, under "Share & Search," a shared sentence might land here right away, or you might get asked what to do with it first.':
    'Je nach Einstellung unter „Teilen & Suche" in den Einstellungen landet ein geteilter Satz entweder sofort hier, oder du wirst zuerst gefragt, was damit geschehen soll.',
  Details: 'Details',
  'Device (built-in)': 'Gerät (integriert)',
  'Display on Flashcard': 'Auf Karteikarte anzeigen',
  'Each provider\'s own "Test this provider" button plays through that card\'s current key/voice/speed directly, regardless of which engine is Active - use it to check a setup before switching to it.':
    'Der eigene „Diesen Anbieter testen"-Button jeder Karte spielt direkt mit dem aktuellen Schlüssel/der Stimme/Geschwindigkeit dieser Karte ab, unabhängig davon, welche Engine als Aktiv markiert ist - nutze ihn, um eine Einrichtung zu prüfen, bevor du zu ihr wechselst.',
  'Each row is one piece of card data. Tap "Front" or "Back" to show that field on that side - a field can appear on both, on neither, or on just one.':
    'Jede Zeile ist ein Datenfeld der Karte. Tippe auf „Vorderseite" oder „Rückseite", um dieses Feld auf dieser Seite anzuzeigen - ein Feld kann auf beiden, auf keiner oder nur auf einer erscheinen.',
  ElevenLabs: 'ElevenLabs',
  'Email (Optional)': 'E-Mail (optional)',
  'Emoji (optional)': 'Emoji (optional)',
  'Enter the word first.': 'Gib zuerst das Wort ein.',
  'Every card in "{{name}}" goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    'Jede Karte in „{{name}}" wird auf „neu" zurückgesetzt - sowohl die Wort-Bedeutung-Wiederholung als auch das Lückentext-Üben starten von vorn. Dein Wiederholungsverlauf bleibt erhalten. Das kann nicht rückgängig gemacht werden.',
  'Every card in this deck goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    'Jede Karte in diesem Stapel wird auf „neu" zurückgesetzt - sowohl die Wort-Bedeutung-Wiederholung als auch das Lückentext-Üben starten von vorn. Dein Wiederholungsverlauf bleibt erhalten. Das kann nicht rückgängig gemacht werden.',
  'Every speaker button in the app uses whichever engine is marked Active below.':
    'Jede Lautsprecher-Schaltfläche in der App verwendet die unten als Aktiv markierte Engine.',
  'Everything in the queue is selected by default. Tap a card to include or leave it out, or use the trash icon to remove it for good.':
    'Standardmäßig ist alles in der Warteschlange ausgewählt. Tippe auf eine Karte, um sie ein- oder auszuschließen, oder nutze das Papierkorb-Symbol, um sie endgültig zu entfernen.',
  'Everything renders inside a real WebView, so standard CSS applies as on any web page - flexbox, custom fonts via @font-face, transitions, etc. all work; there is no special "app CSS" subset to learn beyond this.':
    'Alles wird in einer echten WebView gerendert, daher gilt Standard-CSS wie auf jeder Webseite - Flexbox, benutzerdefinierte Schriften über @font-face, Übergänge usw. funktionieren alle; es gibt darüber hinaus keine besondere „App-CSS"-Teilmenge zu lernen.',
  'Example sentences': 'Beispielsätze',
  'Example sentences show the word used in context, with a translation underneath.':
    'Beispielsätze zeigen das Wort im Kontext, mit einer Übersetzung darunter.',
  'Examples generated from a selected option get a highlighted background, so you can tell which ones came from your request.':
    'Beispiele, die aus einer ausgewählten Option erzeugt wurden, erhalten einen hervorgehobenen Hintergrund, damit du erkennst, welche aus deiner Anfrage stammen.',
  'Explain, Ask AI & more': 'Erklären, KI fragen & mehr',
  'Explanations and the "More info" follow-up use this language.':
    'Erklärungen und die „Mehr Infos"-Anschlussfunktion verwenden diese Sprache.',
  'Exporting...': 'Wird exportiert...',
  Expression: 'Ausdruck',
  'Fields added via the toggles are never auto-wrapped in a <div> or <span> - {{ word }} renders as bare text directly inside the card body. That keeps generated templates minimal, but it means a rule like ".word { ... }" has nothing to match unless you add that class yourself.':
    'Über die Schalter hinzugefügte Felder werden nie automatisch in ein <div> oder <span> eingepackt - {{ word }} wird als reiner Text direkt im Kartenkörper gerendert. Das hält generierte Vorlagen minimal, bedeutet aber, dass eine Regel wie ".word { ... }" nichts trifft, solange du diese Klasse nicht selbst hinzufügst.',
  "Found a sentence somewhere else, like an article or a message? Share it to Lemmory the same way you'd share it to any other app.":
    'Einen Satz woanders gefunden, etwa in einem Artikel oder einer Nachricht? Teile ihn mit Lemmory genauso, wie du ihn mit jeder anderen App teilen würdest.',
  'Front and Back are raw Liquid templates - anything valid Liquid works here, not just what the Fields toggles generate.':
    'Vorder- und Rückseite sind rohe Liquid-Vorlagen - alles gültige Liquid funktioniert hier, nicht nur das, was die Felder-Schalter erzeugen.',
  "Front and Back are separate - the chip above the card switches which side is rendered, so you always know exactly which side you're looking at.":
    'Vorder- und Rückseite sind getrennt - die Chip-Auswahl über der Karte schaltet um, welche Seite gerendert wird, sodass du immer genau weißt, welche Seite du gerade siehst.',
  Full: 'Voll',
  Gender: 'Genus',
  General: 'Allgemein',
  'General settings help': 'Hilfe zu Allgemein',
  'Generated with AI - not from your installed dictionary.':
    'Mit KI erzeugt - nicht aus deinem installierten Wörterbuch.',
  'Generating your card...': 'Deine Karte wird erzeugt...',
  'Generation came back incomplete - nothing was changed. Try again.':
    'Die Generierung kam unvollständig zurück - es wurde nichts geändert. Versuche es erneut.',
  'Go to platform.openai.com > Settings > Projects > select the project this key belongs to > Models > enable gpt-4o-mini-tts for that project.':
    'Gehe zu platform.openai.com > Settings > Projects > wähle das Projekt, zu dem dieser Schlüssel gehört > Models > aktiviere gpt-4o-mini-tts für dieses Projekt.',
  'Hide DeepL API key': 'DeepL-API-Schlüssel ausblenden',
  Hindi: 'Hindi',
  'How Audio Settings works': 'Wie Audio-Einstellungen funktioniert',
  'I speak': 'Ich spreche',
  "I'm learning": 'Ich lerne',
  'If Validate says a project doesn\'t have access to gpt-4o-mini-tts, but the model works fine on platform.openai.com, your API key is scoped to a specific OpenAI Project that hasn\'t enabled it.':
    'Wenn „Überprüfen" meldet, dass ein Projekt keinen Zugriff auf gpt-4o-mini-tts hat, das Modell auf platform.openai.com aber einwandfrei funktioniert, ist dein API-Schlüssel auf ein bestimmtes OpenAI-Projekt beschränkt, das es nicht aktiviert hat.',
  'If a cloud key is invalid, the provider is unreachable, or a request fails, playback falls back to the device voice automatically - you\'re never left with silence.':
    'Wenn ein Cloud-Schlüssel ungültig ist, der Anbieter nicht erreichbar ist oder eine Anfrage fehlschlägt, wechselt die Wiedergabe automatisch zur Gerätestimme - du sitzt nie in Stille.',
  "If a word isn't in your library yet, you may see a quick built-in dictionary entry and/or a translation preview - both are read-only until you choose to add one to a deck.":
    'Wenn ein Wort noch nicht in deiner Bibliothek ist, siehst du eventuell einen schnellen integrierten Wörterbucheintrag und/oder eine Übersetzungsvorschau - beide sind nur lesbar, bis du dich entscheidest, eines zu einem Stapel hinzuzufügen.',
  'If no model is picked, a default is chosen to match whatever language is set under Settings > Learning > "I\'m learning" (English, German, Spanish, or French) - other languages fall back to an English voice until you pick one manually.':
    'Wenn kein Modell ausgewählt ist, wird ein Standard passend zu der unter Einstellungen > Lernen > „Ich lerne" eingestellten Sprache gewählt (Englisch, Deutsch, Spanisch oder Französisch) - andere Sprachen greifen auf eine englische Stimme zurück, bis du manuell eine auswählst.',
  'If no voice is picked, a known-good multilingual default voice is used automatically.':
    'Wenn keine Stimme ausgewählt ist, wird automatisch eine bewährte mehrsprachige Standardstimme verwendet.',
  'If this word has more than one distinct sense - say, a casual meaning and a business one - you\'ll see small labeled capsules (like "social" or "formal") just above the translation. Tap one to switch; each keeps its own examples and synonyms.':
    'Wenn dieses Wort mehr als eine eigenständige Bedeutung hat - etwa eine umgangssprachliche und eine geschäftliche -, siehst du kleine beschriftete Kapseln (wie „umgangssprachlich" oder „formell") direkt über der Übersetzung. Tippe auf eine, um zu wechseln; jede behält ihre eigenen Beispiele und Synonyme.',
  'Import & Export': 'Import & Export',
  'Import & export, templates, local dictionaries':
    'Import & Export, Vorlagen, lokale Wörterbücher',
  'Include diagnostics': 'Diagnosedaten einschließen',
  'Inflected or conjugated forms work too, not just the base/dictionary form of a word.':
    'Gebeugte oder konjugierte Formen funktionieren ebenfalls, nicht nur die Grund-/Wörterbuchform eines Worts.',
  'Install more voices from your phone\'s system settings if the one you want isn\'t listed.':
    'Installiere weitere Stimmen über die Systemeinstellungen deines Telefons, falls die gewünschte nicht aufgeführt ist.',
  'Installing...': 'Wird installiert...',
  'Key validated': 'Schlüssel überprüft',
  'Last synced: {{when}}': 'Zuletzt synchronisiert: {{when}}',
  'List fields (Other meanings, Synonyms, Related phrases) already need a {% for %} loop to render at all - that loop is structurally required, not a styling choice. To style each item individually, wrap the item inside the loop:':
    'Listenfelder (Weitere Bedeutungen, Synonyme, Verwandte Redewendungen) benötigen bereits eine {% for %}-Schleife, um überhaupt gerendert zu werden - diese Schleife ist strukturell erforderlich, keine Stilentscheidung. Um jedes Element einzeln zu gestalten, packe das Element innerhalb der Schleife ein:',
  'Long-press a word in any app and pick "Search in Lemmory" to look it up here right away.':
    'Halte ein Wort in einer beliebigen App gedrückt und wähle „In Lemmory suchen", um es sofort hier nachzuschlagen.',
  'Long-press a word in any app - your browser, messages, anywhere - and pick "Search in Lemmory." It opens right here with that word ready to go.':
    'Halte ein Wort in einer beliebigen App gedrückt - deinem Browser, Nachrichten, überall - und wähle „In Lemmory suchen." Es öffnet sich direkt hier mit diesem Wort startklar.',
  Markdown: 'Markdown',
  Message: 'Nachricht',
  'Mine help': 'Hilfe zu Meins',
  'Mine is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    '„Meins" ist ein Sammelbereich für Sätze, die du später in Vokabelkarten umwandeln möchtest - hier passiert nichts automatisch.',
  Never: 'Nie',
  'Never included: word content, translations, AI responses, or API keys.':
    'Nie enthalten: Wortinhalte, Übersetzungen, KI-Antworten oder API-Schlüssel.',
  'New deck name': 'Neuer Stapelname',
  'Create New Study Deck': 'Neuen Lernstapel erstellen',
  'DECK TITLE': 'STAPELTITEL',
  'EMOJI / ICON (OPTIONAL)': 'EMOJI / ICON (OPTIONAL)',
  'Only cards matching these types can be saved into this deck.': 'Nur Karten, die zu diesen Typen passen, können in diesen Stapel gespeichert werden.',
  'e.g. German Verbs': 'z.B. Deutsche Verben',
  'Total Cards': 'Karten gesamt',
  'Due Today': 'Heute fällig',
  'Your Study Decks': 'Deine Lernstapel',
  'New Deck': 'Neuer Stapel',
  'Up to date': 'Aktuell',
  'Decks & Schedule': 'Stapel & Zeitplan',
  'Manage study decks and review due vocabulary': 'Lernstapel verwalten und fällige Vokabeln wiederholen',
  'Mastery & Retention': 'Beherrschung & Behalten',
  'All caught up across {{decks}} study collections.': 'Alles auf dem neuesten Stand in {{decks}} Lernsammlungen.',
  '{{due}} cards due across {{decks}} study collections today.': 'Heute sind {{due}} Karten in {{decks}} Lernsammlungen fällig.',
  '{{count}} cards registered': '{{count}} Karten registriert',
  due: 'fällig',
  'Daily Load': 'Tageslast',
  'cards due today': 'Karten heute fällig',
  'cards due across all decks': 'Karten in allen Stapeln fällig',
  'Sentence holding': 'Satz-Warteschlange',
  'Daily Discovery': 'Tagesentdeckung',
  'Meaning & Explanation': 'Bedeutung & Erklärung',
  'Example in Context': 'Beispiel im Kontext',
  'Beispielsatz wird geladen...': 'Beispielsatz wird geladen...',
  'Explore Full Details ↗': 'Alle Details anzeigen ↗',
  'Reviewed Today': 'Heute wiederholt',
  Explore: 'Erkunden',
  Stats: 'Statistiken',
  'New words are looked up and generated in this language.':
    'Neue Wörter werden in dieser Sprache nachgeschlagen und erzeugt.',
  'No AI provider active - open Settings': 'Kein KI-Anbieter aktiv - Einstellungen öffnen',
  'No AI provider is active - add and enable one in Settings to generate new words':
    'Kein KI-Anbieter ist aktiv - füge in den Einstellungen einen hinzu und aktiviere ihn, um neue Wörter zu erzeugen',
  'No AI provider is active - add and enable one to generate targeted examples.':
    'Kein KI-Anbieter ist aktiv - füge einen hinzu und aktiviere ihn, um gezielte Beispiele zu erzeugen.',
  'No AI provider is active.': 'Kein KI-Anbieter ist aktiv.',
  'No AI provider is active. Add and enable one in Settings to generate cards.':
    'Kein KI-Anbieter ist aktiv. Füge in den Einstellungen einen hinzu und aktiviere ihn, um Karten zu erzeugen.',
  'No AI provider is active. Add and enable one in Settings to generate examples.':
    'Kein KI-Anbieter ist aktiv. Füge in den Einstellungen einen hinzu und aktiviere ihn, um Beispiele zu erzeugen.',
  'No AI provider is active. Add and enable one in Settings to generate words.':
    'Kein KI-Anbieter ist aktiv. Füge in den Einstellungen einen hinzu und aktiviere ihn, um Wörter zu erzeugen.',
  'No decks yet - create one above.': 'Noch keine Stapel - erstelle oben einen.',
  'No provider configured - AI generation disabled':
    'Kein Anbieter konfiguriert - KI-Generierung deaktiviert',
  'No settings match "{{query}}"': 'Keine Einstellungen passen zu „{{query}}"',
  'No {{language}} voices are installed on this device.':
    'Auf diesem Gerät sind keine {{language}}-Stimmen installiert.',
  Normal: 'Normal',
  'Not supported yet': 'Noch nicht unterstützt',
  'Match your native language too?': 'Auch deine Muttersprache anpassen?',
  'You just set the app language to {{language}}. Also set "I speak" to match?':
    'Du hast die App-Sprache gerade auf {{language}} gesetzt. Soll „Ich spreche" ebenfalls angepasst werden?',
  'Match the app language too?': 'Auch die App-Sprache anpassen?',
  'You just set "I speak" to {{language}}. Switch the app\'s own language to match?':
    'Du hast „Ich spreche" gerade auf {{language}} gesetzt. Soll die App-Sprache ebenfalls gewechselt werden?',
  'Yes, switch it': 'Ja, wechseln',
  'No, keep it': 'Nein, beibehalten',
  'Nothing to add.': 'Nichts hinzuzufügen.',
  'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.':
    'Nur App-Version, Plattform und deine aktuelle Funktionsstufe (Voll oder Nur Übersetzung) - genug, um einen Fehler nachzuvollziehen.',
  'Only bother with this if you want to be selective - otherwise everything gets turned into cards together.':
    'Kümmere dich nur darum, wenn du gezielt auswählen möchtest - andernfalls wird alles zusammen in Karten umgewandelt.',
  'Only if you want a reply - also becomes public once posted.':
    'Nur wenn du eine Antwort möchtest - wird nach dem Absenden ebenfalls öffentlich.',
  'Open Settings': 'Einstellungen öffnen',
  OpenAI: 'OpenAI',
  'Or enter an ID manually': 'Oder gib eine ID manuell ein',
  'Phrases show this word used in common expressions or word combinations.':
    'Redewendungen zeigen dieses Wort in gängigen Ausdrücken oder Wortkombinationen.',
  'Pick a look for the whole app, from bright to dark and everything between.':
    'Wähle ein Erscheinungsbild für die gesamte App, von hell bis dunkel und allem dazwischen.',
  'Picking a swatch again (or none) removes the line - it never conflicts with CSS you write by hand elsewhere in the box.':
    'Erneutes Auswählen einer Kachel (oder keiner) entfernt die Zeile - sie steht nie im Konflikt mit CSS, das du selbst an anderer Stelle in der Box schreibst.',
  "Please don't include anything private in your message.":
    'Bitte gib nichts Privates in deiner Nachricht an.',
  'Practice reverse': 'Umgekehrt üben',
  'Practice words': 'Wörter üben',
  'Practice {{count}} cloze': '{{count}} Lückentexte üben',
  'Reference it anywhere in your own CSS rules, e.g.:':
    'Referenziere sie an beliebiger Stelle in deinen eigenen CSS-Regeln, z. B.:',
  Regenerate: 'Neu erzeugen',
  'Regenerate this card?': 'Diese Karte neu erzeugen?',
  Remove: 'Entfernen',
  'Remove {{count}}': '{{count}} entfernen',
  'Remove {{count}} cards from this deck?': '{{count}} Karten aus diesem Stapel entfernen?',
  'Removing...': 'Wird entfernt...',
  'Rendering goes through the exact same LiquidJS + WebView pipeline the review session uses, with one fixed sample word ("ausgehen") standing in for your real vocabulary.':
    'Das Rendering läuft über genau dieselbe LiquidJS+WebView-Pipeline wie die Wiederholungssitzung, wobei ein festes Beispielwort („ausgehen") für deine echten Vokabeln steht.',
  'Report an issue or request a feature': 'Ein Problem melden oder eine Funktion vorschlagen',
  'Reset progress': 'Fortschritt zurücksetzen',
  'Reset progress?': 'Fortschritt zurücksetzen?',
  'Reset to default?': 'Auf Standard zurücksetzen?',
  'Resetting...': 'Wird zurückgesetzt...',
  "Review your captures. Discard what you don't need, then generate cards for the rest.":
    'Überprüfe deine Erfassungen. Verwirf, was du nicht brauchst, und erzeuge dann Karten für den Rest.',
  'Review {{count}} words': '{{count}} Wörter wiederholen',
  'Saving...': 'Wird gespeichert...',
  'Search from anywhere': 'Von überall suchen',
  'Search help': 'Hilfe zur Suche',
  'Search in German ("ausgeh...") or English ("go out").\\nInflected forms like "ging aus" work too.':
    'Suche auf Deutsch ("ausgeh...") oder Englisch ("go out").\nGebeugte Formen wie "ging aus" funktionieren auch.',
  'Search settings': 'Einstellungen durchsuchen',
  'Search this': 'Dies suchen',
  'Select cards': 'Karten auswählen',
  'Selectors that work with zero extra markup (they target the card body itself or elements this app already emits):':
    'Selektoren, die ohne zusätzliches Markup funktionieren (sie zielen auf den Kartenkörper selbst oder auf Elemente, die diese App bereits ausgibt):',
  'Send Feedback': 'Feedback senden',
  'Send Feedback help': 'Hilfe zu Feedback senden',
  'Sentence (use [...] for the gap)': 'Satz (verwende [...] für die Lücke)',
  'Sentence translation': 'Satzübersetzung',
  'Share & Search': 'Teilen & Suche',
  'Show DeepL API key': 'DeepL-API-Schlüssel anzeigen',
  'Shown on flashcard': 'Auf Karteikarte angezeigt',
  'Sign in with Google': 'Mit Google anmelden',
  'Sign out': 'Abmelden',
  'Signing in...': 'Wird angemeldet...',
  'Speaking speed': 'Sprechgeschwindigkeit',
  'Speaking speed isn\'t configurable for this provider yet.':
    'Die Sprechgeschwindigkeit ist für diesen Anbieter noch nicht einstellbar.',
  'Speech engine': 'Sprach-Engine',
  Status: 'Status',
  "Submitting posts your message as a GitHub issue on Lemmory's public repository - anyone can read it, including your contact email if you provide one.":
    'Beim Absenden wird deine Nachricht als GitHub-Issue im öffentlichen Repository von Lemmory veröffentlicht - jeder kann es lesen, einschließlich deiner Kontakt-E-Mail, falls du eine angibst.',
  Sync: 'Synchronisierung',
  'Sync decks, cards, and progress to a Google account':
    'Stapel, Karten und Fortschritt mit einem Google-Konto synchronisieren',
  'Sync failed': 'Synchronisierung fehlgeschlagen',
  'Sync not connected': 'Synchronisierung nicht verbunden',
  'Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.':
    'Verbinde dein Google-Konto unter Einstellungen > Synchronisierung, um deine Stapel und deinen Lernfortschritt geräteübergreifend zu synchronisieren.',
  'Sync in the background whenever you leave the app, at most this often':
    'Im Hintergrund synchronisieren, wann immer du die App verlässt, höchstens so oft',
  'Sync now': 'Jetzt synchronisieren',
  'Sync your decks, cards, and review progress to a Google account so they carry over to another device. API keys are never synced.':
    'Synchronisiere deine Stapel, Karten und deinen Wiederholungsfortschritt mit einem Google-Konto, damit sie auf ein anderes Gerät übertragen werden. API-Schlüssel werden nie synchronisiert.',
  Synced: 'Synchronisiert',
  'Syncing...': 'Wird synchronisiert...',
  'Synonyms & phrases': 'Synonyme & Redewendungen',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. You can rate or flag one the same way as an example.':
    'Synonyme sind andere Wörter mit ähnlicher Bedeutung, nützlich, um deinen Wortschatz rund um dieses Wort zu erweitern. Du kannst eines genauso wie ein Beispiel bewerten oder melden.',
  Tags: 'Tags',
  'Tap the star on any example to choose which one appears on your flashcard - only one shows at a time.':
    'Tippe auf den Stern bei einem Beispiel, um festzulegen, welches auf deiner Karteikarte erscheint - es wird immer nur eines angezeigt.',
  'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.':
    'Ein Tipp auf „Zu Stapel hinzufügen" fragt immer, zu welchem Stapel das Wort hinzugefügt werden soll, und lässt dich direkt einen brandneuen Stapel erstellen.',
  'Test active engine': 'Aktive Engine testen',
  'Test phrase': 'Testsatz',
  'Test this provider': 'Diesen Anbieter testen',
  'Testing a voice': 'Eine Stimme testen',
  'Text to speak when testing': 'Text, der beim Testen gesprochen wird',
  'Thanks for the feedback': 'Danke für dein Feedback',
  'The "Available template variables" card lists every field name you can reference, with a one-line description of what it holds.':
    'Die Karte „Verfügbare Vorlagenvariablen" listet jeden Feldnamen auf, den du referenzieren kannst, mit einer einzeiligen Beschreibung dessen, was er enthält.',
  'The CSS box applies to both the front and back - there is one stylesheet per template, not one per side.':
    'Die CSS-Box gilt für Vorder- und Rückseite gleichermaßen - es gibt ein Stylesheet pro Vorlage, nicht eines pro Seite.',
  'The button at the bottom turns your selected sentences into real vocabulary cards, one at a time.':
    'Die Schaltfläche unten verwandelt deine ausgewählten Sätze nacheinander in echte Vokabelkarten.',
  'The card fills the available screen space exactly (no scrolling) and the caption above it shows its real, on-device measured width and height in points - the same size a card gets during an actual review session.':
    'Die Karte füllt den verfügbaren Bildschirmbereich genau aus (kein Scrollen), und die Beschriftung darüber zeigt ihre tatsächliche, auf dem Gerät gemessene Breite und Höhe in Punkten - dieselbe Größe, die eine Karte in einer echten Wiederholungssitzung hat.',
  'The conditional example at the bottom is a worked, copy-pasteable snippet combining {% if %} and {% for ... limit %}.':
    'Das bedingte Beispiel unten ist ein fertiges, kopierbares Snippet, das {% if %} und {% for ... limit %} kombiniert.',
  'The dropdown above the examples ("all", "travel", "business", and so on) filters them down to a particular tone or situation, if you only want to see those.':
    'Das Dropdown-Menü über den Beispielen („alle", „Reisen", „Geschäft" usw.) filtert sie auf einen bestimmten Ton oder eine bestimmte Situation, falls du nur diese sehen möchtest.',
  'The pencil icon lets you edit the meaning or example text directly. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'Mit dem Stift-Symbol kannst du die Bedeutung oder den Beispieltext direkt bearbeiten. Das letzte Symbol öffnet eine schnelle Websuche für das Wort, um eine zweite Meinung außerhalb der App einzuholen.',
  'The row of small icon buttons under the meaning gives you a few more ways to dig into this word.':
    'Die Reihe kleiner Symbol-Schaltflächen unter der Bedeutung bietet dir ein paar weitere Möglichkeiten, dieses Wort genauer zu erkunden.',
  'The sentence must contain "[...]" for the gap, and an answer is required.':
    'Der Satz muss „[...]" für die Lücke enthalten, und eine Antwort ist erforderlich.',
  'The toggles read the template text itself (no hidden markers) - they work reliably for templates built through the toggles. If you hand-write unusual formatting in the Code tab, a toggle may not detect it; edit the Code tab directly in that case.':
    'Die Schalter lesen den Vorlagentext selbst (keine versteckten Markierungen) - sie funktionieren zuverlässig bei Vorlagen, die über die Schalter erstellt wurden. Wenn du im Reiter „Code" ungewöhnliche Formatierungen von Hand schreibst, erkennt ein Schalter das möglicherweise nicht; bearbeite in diesem Fall den Reiter „Code" direkt.',
  'The translation at the top is what actually appears on your flashcard.':
    'Die Übersetzung oben ist das, was tatsächlich auf deiner Karteikarte erscheint.',
  'The voice list follows whatever language is set under Settings > Learning > "I\'m learning".':
    'Die Stimmenliste richtet sich nach der Sprache, die unter Einstellungen > Lernen > „Ich lerne" eingestellt ist.',
  Theme: 'Design',
  'Thinking...': 'Denkt nach...',
  'This becomes a public issue': 'Dies wird zu einem öffentlichen Issue',
  'This card, explained': 'Diese Karte, erklärt',
  "This changes the language of the app itself - its buttons and menus - not the language you're learning.":
    'Dies ändert die Sprache der App selbst - ihre Schaltflächen und Menüs - nicht die Sprache, die du lernst.',
  'This collapsible panel below the examples lets you pick a specific grammar pattern - a tense, a sentence structure, a particular conjunction - that you want the next batch of examples to practice, instead of leaving it to chance.':
    'Mit diesem einklappbaren Bereich unter den Beispielen kannst du ein bestimmtes Grammatikmuster auswählen - eine Zeitform, einen Satzbau, eine bestimmte Konjunktion -, das die nächste Beispielserie üben soll, anstatt es dem Zufall zu überlassen.',
  "This is a preview of the feedback form - sending isn't connected yet, so nothing was sent anywhere. Once it is, this exact form will open a GitHub issue on your behalf.":
    'Dies ist eine Vorschau des Feedback-Formulars - das Senden ist noch nicht angebunden, es wurde also nichts irgendwohin gesendet. Sobald es angebunden ist, öffnet genau dieses Formular in deinem Namen ein GitHub-Issue.',
  'This is the one step that actually does the work - nothing before it does anything with your captured text.':
    'Dies ist der eine Schritt, der die eigentliche Arbeit erledigt - davor passiert nichts mit deinem erfassten Text.',
  'This only changes colors - nothing about how the app works.':
    'Dies ändert nur Farben - nichts an der Funktionsweise der App.',
  'This only removes them from this deck - cards that live in other decks too stay there.':
    'Dies entfernt sie nur aus diesem Stapel - Karten, die auch in anderen Stapeln liegen, bleiben dort erhalten.',
  'This opens a separate screen for the voice that reads words out loud, and how fast it speaks.':
    'Dies öffnet einen eigenen Bildschirm für die Stimme, die Wörter vorliest, und wie schnell sie spricht.',
  'This removes every OpenAI/Mistral/Gemini/Claude key from this device. Vocabulary and progress are unaffected.':
    'Dies entfernt jeden OpenAI-/Mistral-/Gemini-/Claude-Schlüssel von diesem Gerät. Vokabeln und Fortschritt sind davon nicht betroffen.',
  'This replaces the fields, layout, and style with the built-in default, and saves immediately. This cannot be undone.':
    'Dies ersetzt Felder, Layout und Stil durch den integrierten Standard und speichert sofort. Das kann nicht rückgängig gemacht werden.',
  'This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.':
    'Dies ersetzt die Bedeutungen, Beispiele, Synonyme, Redewendungen und Lückentext-Karten durch eine neue KI-Generierung. Das kann nicht rückgängig gemacht werden.',
  'This screen is a preview of the full flow; submitting just confirms locally for now. A small server-side function will handle real submission in a future update.':
    'Dieser Bildschirm ist eine Vorschau des vollständigen Ablaufs; das Absenden bestätigt vorerst nur lokal. Eine kleine serverseitige Funktion wird das tatsächliche Absenden in einem zukünftigen Update übernehmen.',
  'This setting decides what happens next.':
    'Diese Einstellung entscheidet, was als Nächstes passiert.',
  Title: 'Titel',
  'To style one field on its own - e.g. make the word bigger than the rest - wrap just that field in your own element in the Code tab, then target the class you chose:':
    'Um ein einzelnes Feld für sich zu gestalten - z. B. das Wort größer als den Rest zu machen - packe nur dieses Feld im Reiter „Code" in ein eigenes Element und ziele dann auf die von dir gewählte Klasse:',
  'Translation-only': 'Nur Übersetzung',
  "Turning a field on inserts the minimum Liquid needed for it at the end of that side's template: a plain field becomes {{ word }}; a list field (Other meanings, Synonyms, Related phrases) becomes a {% for %} loop, because a list can't be printed directly.":
    'Das Einschalten eines Feldes fügt am Ende der Vorlage dieser Seite das minimal nötige Liquid ein: Ein einfaches Feld wird zu {{ word }}; ein Listenfeld (Weitere Bedeutungen, Synonyme, Verwandte Redewendungen) wird zu einer {% for %}-Schleife, da eine Liste nicht direkt ausgegeben werden kann.',
  'Turning captures into cards': 'Erfassungen in Karten umwandeln',
  "Type a word in either language you've set up under Learning - your own vocabulary is searched instantly as you type.":
    'Tippe ein Wort in einer der Sprachen ein, die du unter Lernen eingerichtet hast - dein eigener Wortschatz wird sofort während der Eingabe durchsucht.',
  "Underneath each example, thumbs up/down let you mark whether it's good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense.":
    'Unter jedem Beispiel kannst du mit Daumen hoch/runter markieren, ob es gut ist oder später noch einmal geprüft werden sollte. Das Fahnen-Symbol meldet ein konkretes Problem (wie unnatürliche Formulierung oder einen Grammatikfehler) mit einer optionalen Notiz. Der runde Pfeil erzeugt eine neue Beispielserie für diese Bedeutung.',
  'Unknown error': 'Unbekannter Fehler',
  'Uses this provider\'s key from AI Providers':
    'Verwendet den Schlüssel dieses Anbieters aus KI-Anbieter',
  'Uses your phone\'s own text-to-speech engine - offline, free, no API key.':
    'Verwendet die eigene Text-zu-Sprache-Engine deines Telefons - offline, kostenlos, kein API-Schlüssel.',
  Verb: 'Verb',
  Voice: 'Stimme',
  'Voice ({{language}})': 'Stimme ({{language}})',
  'Want it to work a bit differently? There\'s a setting for that in Settings, under "Share & Search."':
    'Möchtest du, dass es etwas anders funktioniert? Dafür gibt es eine Einstellung unter „Teilen & Suche" in den Einstellungen.',
  'What diagnostics includes': 'Was Diagnosedaten enthalten',
  'What happened, or what would you like to see?':
    'Was ist passiert, oder was würdest du dir wünschen?',
  'What kind of feedback?': 'Welche Art von Feedback?',
  'What this screen is for': 'Wofür dieser Bildschirm gedacht ist',
  'Whatever translation at this moment is selected/shown will be added to deck along with its relevant example.':
    'Die aktuell ausgewählte bzw. angezeigte Übersetzung wird zusammen mit dem passenden Beispiel zum Stapel hinzugefügt.',
  'When a word is new to you': 'Wenn dir ein Wort neu ist',
  'Why nothing sends yet': 'Warum noch nichts gesendet wird',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.':
    'Ohne einen Generierungsschlüssel ist die Kartenerstellung mit KI deaktiviert. Übersetzung und manuelle Karten funktionieren weiterhin. Füge unter KI-Anbieter einen Schlüssel hinzu, um das volle Erlebnis zu erhalten.',
  'Word and meaning are required.': 'Wort und Bedeutung sind erforderlich.',
  'Word card': 'Wortkarte',
  'You can add your cards to multiple decks even if it is added before.':
    'Du kannst deine Karten zu mehreren Stapeln hinzufügen, auch wenn sie bereits zuvor hinzugefügt wurden.',
  "You can also share text from another app straight to Lemmory, the same way you'd share a link or a photo.":
    'Du kannst auch Text direkt aus einer anderen App mit Lemmory teilen, genauso wie du einen Link oder ein Foto teilen würdest.',
  "You can also share text to Lemmory, the same way you'd share a link or a photo to any other app.":
    'Du kannst auch Text mit Lemmory teilen, genauso wie du einen Link oder ein Foto mit jeder anderen App teilen würdest.',
  'ask a follow-up question': 'eine Anschlussfrage stellen',
  'e.g. Er lehnt das Angebot ab.': 'z. B. Er lehnt das Angebot ab.',
  'e.g. He refuses the offer.': 'z. B. He refuses the offer.',
  'e.g. We are going out tonight.': 'z. B. We are going out tonight.',
  'e.g. Wir gehen heute Abend [...].': 'z. B. Wir gehen heute Abend [...].',
  'e.g. ablehnen': 'z. B. ablehnen',
  'e.g. aus': 'z. B. aus',
  'e.g. to refuse': 'z. B. to refuse',
  'e.g. verweigern, zurückweisen': 'z. B. verweigern, zurückweisen',
  'eleven_multilingual_v2. Once your key is entered, choose from your own ElevenLabs voice library, or switch to manual entry to paste a voice ID directly.':
    'eleven_multilingual_v2. Sobald dein Schlüssel eingegeben ist, wähle aus deiner eigenen ElevenLabs-Stimmbibliothek oder wechsle zur manuellen Eingabe, um eine Stimmen-ID direkt einzufügen.',
  'generate an explanation for this meaning': 'eine Erklärung für diese Bedeutung erzeugen',
  'gpt-4o-mini-tts. Marin and Cedar (★) are OpenAI\'s newest, most natural-sounding voices.':
    'gpt-4o-mini-tts. Marin und Cedar (★) sind OpenAIs neueste, am natürlichsten klingende Stimmen.',
  'regenerate this card': 'diese Karte neu erzeugen',
  reverse: 'umgekehrt',
  'this deck': 'dieser Stapel',
  'you@example.com': 'you@example.com',
  '{{ variable }} prints a value. {% if gender %}...{% endif %} shows content only when a field has one - good for optional fields. {% for s in synonyms %}...{% endfor %} loops a list; add "limit:2" to cap it, and {% unless forloop.last %}...{% endunless %} to add a separator between items but not after the last one.':
    '{{ variable }} gibt einen Wert aus. {% if gender %}...{% endif %} zeigt Inhalt nur an, wenn ein Feld einen Wert hat - gut für optionale Felder. {% for s in synonyms %}...{% endfor %} durchläuft eine Liste; füge „limit:2" hinzu, um sie zu begrenzen, und {% unless forloop.last %}...{% endunless %}, um zwischen Elementen einen Trenner einzufügen, aber nicht nach dem letzten.',
  '{{cefr}} · {{native}} > {{target}}': '{{cefr}} · {{native}} > {{target}}',
  '{{count}} of {{total}} configured': '{{count}} von {{total}} konfiguriert',
  '{{count}} selected': '{{count}} ausgewählt',
  '{{count}}h': '{{count}}h',
  '{{count}}m': '{{count}}m',
  "{{language}} isn't ready yet - English and German are the only languages Lemmory fully supports right now.":
    '{{language}} ist noch nicht bereit - Englisch und Deutsch sind derzeit die einzigen Sprachen, die Lemmory vollständig unterstützt.',
  '{{provider}} playback failed': '{{provider}}-Wiedergabe fehlgeschlagen',
  '{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted':
    '{{pulled}} abgerufen · {{pushed}} gesendet · {{deleted}} gelöscht',

  masculine: 'männlich',
  feminine: 'weiblich',
  neuter: 'sächlich',
  Again: 'Nochmal',
  Hard: 'Schwer',
  Good: 'Gut',
  Easy: 'Leicht',
  'Lemmory Light': 'Lemmory Hell',
  'Midnight Indigo': 'Mitternachtsindigo',
  'Carbon Noir': 'Kohleschwarz',
  'Arctic Day': 'Arktischer Tag',
  'Warm Sand': 'Warmer Sand',
  Paperlight: 'Papierweiß',
  'Meanings, examples, clusters, phrases, and cloze - the default generation provider.':
    'Bedeutungen, Beispiele, Cluster, Phrasen und Lückentexte - der Standard-Anbieter für die Generierung.',
  'BYOK alternative for card generation and translation.':
    'BYOK-Alternative für Kartengenerierung und Übersetzung.',
  'Google Gemini BYOK for card generation and translation.':
    'Google Gemini BYOK für Kartengenerierung und Übersetzung.',
  'Claude BYOK for card generation and translation.':
    'Claude BYOK für Kartengenerierung und Übersetzung.',
  'Your phone\'s own text-to-speech engine. Offline, no API key, no per-word cost.':
    'Die eigene Text-zu-Sprache-Engine deines Telefons. Offline, kein API-Schlüssel, keine Kosten pro Wort.',
  'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.':
    'gpt-4o-mini-tts. Für die natürlichste Stimme wähle unten Marin oder Cedar.',
  'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.':
    'eleven_multilingual_v2. Füge eine Stimmen-ID aus deiner ElevenLabs-Stimmbibliothek ein.',
  'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).':
    'Aura-2. Gib den genauen Modellnamen für die gewünschte Stimme/Sprache ein (siehe Deepgram-Dokumentation).',
  'Bug / Issue': 'Fehler/Problem',
  'Feature request': 'Funktionswunsch',
  'General feedback': 'Allgemeines Feedback',
  Vietnamese: 'Vietnamesisch',

  Queue: 'Warteschlange',
  'Queue help': 'Warteschlange-Hilfe',
  'Queue is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    'Die Warteschlange ist ein Sammelplatz für Sätze, die du später in Vokabelkarten verwandeln möchtest - hier passiert nichts von selbst.',

  'Generate {{count}} cards to...': '{{count}} Karten erzeugen in...',
  'Delete account & sync data?': 'Konto & Sync-Daten löschen?',
  'This permanently erases everything you\'ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can\'t be undone.':
    'Dies löscht dauerhaft alles, was du in die Cloud synchronisiert hast, und meldet dich ab. Deine Decks und Karten auf diesem Gerät sind davon nicht betroffen. Das kann nicht rückgängig gemacht werden.',
  'Delete everything': 'Alles löschen',
  'Deletion failed': 'Löschen fehlgeschlagen',
  'Danger zone': 'Gefahrenzone',
  'Permanently erase everything synced to this account and sign out. Your data on this device stays put.':
    'Lösche dauerhaft alles, was mit diesem Konto synchronisiert wurde, und melde dich ab. Deine Daten auf diesem Gerät bleiben erhalten.',
  'Delete account & sync data': 'Konto & Sync-Daten löschen',
  'Sync help': 'Hilfe zur Synchronisierung',
  'How sync works': 'Wie die Synchronisierung funktioniert',
  'Deleting your account & data': 'Konto & Daten löschen',
  'What does this actually delete?': 'Was wird dabei genau gelöscht?',
  "Signing in with Google links this device to a private cloud copy of your decks, cards, and review progress - so if you get a new phone, or use Lemmory on two devices, you're not starting from zero on the second one.":
    'Wenn du dich mit Google anmeldest, wird dieses Gerät mit einer privaten Cloud-Kopie deiner Decks, Karten und deines Lernfortschritts verknüpft - bekommst du also ein neues Handy oder nutzt Lemmory auf zwei Geräten, fängst du auf dem zweiten nicht bei null an.',
  'Tap "Sync now" any time to push your latest changes up and pull down anything from another device. Under the hood it merges rather than overwrites - if you added a card here and reviewed one on your other phone, both survive.':
    'Tippe jederzeit auf „Jetzt synchronisieren", um deine neuesten Änderungen hochzuladen und alles von einem anderen Gerät herunterzuladen. Im Hintergrund wird zusammengeführt statt überschrieben - hast du hier eine Karte hinzugefügt und auf deinem anderen Handy eine wiederholt, bleibt beides erhalten.',
  "Your AI provider API keys are never synced. They live only in this device's secure storage, so you'll need to re-enter them if you set up a new device.":
    'Deine KI-Anbieter-API-Schlüssel werden nie synchronisiert. Sie liegen nur im sicheren Speicher dieses Geräts - richtest du ein neues Gerät ein, musst du sie dort erneut eingeben.',
  'When this is on, Lemmory quietly syncs in the background whenever you leave the app - no need to remember to tap "Sync now" yourself.':
    'Ist das aktiviert, synchronisiert Lemmory still im Hintergrund, sobald du die App verlässt - du musst nicht mehr selbst an „Jetzt synchronisieren" denken.',
  "\"At most every\" is a cooldown, not a schedule - it won't sync more often than that, but it also won't force a sync if you haven't opened the app in the meantime.":
    '„Höchstens alle" ist eine Abklingzeit, kein fester Zeitplan - häufiger als angegeben wird nicht synchronisiert, aber es wird auch nicht erzwungen, wenn du die App zwischendurch gar nicht geöffnet hast.',
  "It runs over whatever connection you've got, Wi-Fi or mobile data - there's no Wi-Fi-only toggle.":
    'Es läuft über jede verfügbare Verbindung, WLAN oder mobile Daten - einen Nur-WLAN-Schalter gibt es nicht.',
  "This is the one action here you genuinely can't undo - read this before you tap it.":
    'Das ist die einzige Aktion hier, die du wirklich nicht rückgängig machen kannst - lies dir das durch, bevor du tippst.',
  'It permanently erases everything this account ever synced to the cloud, disconnects the Google account from Lemmory, and signs you out.':
    'Es löscht dauerhaft alles, was dieses Konto je in die Cloud synchronisiert hat, trennt das Google-Konto von Lemmory und meldet dich ab.',
  'Your decks, cards, and progress on THIS device are completely untouched - they stay right where they are, fully usable offline. Only the cloud copy (and the link to it) is gone.':
    'Deine Decks, Karten und dein Fortschritt auf DIESEM Gerät bleiben komplett unangetastet - sie bleiben genau da, vollständig offline nutzbar. Nur die Cloud-Kopie (und die Verknüpfung dazu) verschwindet.',
  'If you sign back in with the same Google account afterward, syncing starts fresh - nothing comes back automatically.':
    'Meldest du dich später wieder mit demselben Google-Konto an, beginnt die Synchronisierung von vorn - nichts kommt automatisch zurück.',
  'Card type for this import': 'Kartentyp für diesen Import',
  'A row with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'Eine Zeile mit Wort/Bedeutung UND Lückensatz wird zu EINER Karte, nie zu zwei. Beide gewünscht? Importiere die Datei danach erneut mit dem jeweils anderen Kartentyp.',
  'A note with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'Eine Notiz mit Wort/Bedeutung UND Lückensatz wird zu EINER Karte, nie zu zwei. Beide gewünscht? Importiere die Datei danach erneut mit dem jeweils anderen Kartentyp.',
  'Regular (word/meaning)': 'Normal (Wort/Bedeutung)',
  'Cloze (fill-in-the-blank)': 'Lückentext',
  'View all cards (table)': 'Alle Karten anzeigen (Tabelle)',
  '{{name}} - all cards': '{{name}} - alle Karten',
  'All cards': 'Alle Karten',
  'No cards yet': 'Noch keine Karten',
  'Add words from Search or import a file to see them here.':
    'Füge Wörter über die Suche hinzu oder importiere eine Datei, um sie hier zu sehen.',
  Type: 'Typ',
  'Part of speech': 'Wortart',
  CEFR: 'GER-Niveau',

  // Newly added — Mixed practice, question types, cards-per-session, and the AI Providers help
  // sheet/error-message hardening that went with them
  'Fill in the blank': 'Lückentext',
  'True or False': 'Wahr oder Falsch',
  'Multiple choice': 'Multiple-Choice',
  mixed: 'gemischt',
  'true/false': 'wahr/falsch',
  'multiple choice': 'Multiple-Choice',
  'Mixed practice': 'Gemischtes Üben',
  'Practice more': 'Weiter üben',
  'Practice question types': 'Übungsarten',
  'Cards per session': 'Karten pro Sitzung',
  'No limit': 'Kein Limit',
  'You reviewed {{count}} cards. There are more cards due - keep going or come back later.':
    'Du hast {{count}} Karten geübt. Es sind noch mehr Karten fällig - mach weiter oder komm später wieder.',
  'Added to {{deck}}': 'Zu {{deck}} hinzugefügt',
  'Cloze added': 'Lückentext hinzugefügt',
  '"{{word}}" means "{{meaning}}"': '"{{word}}" bedeutet "{{meaning}}"',
  'Not quite - "{{word}}" means "{{meaning}}".': 'Nicht ganz - "{{word}}" bedeutet "{{meaning}}".',
  True: 'Wahr',
  False: 'Falsch',
  'Correct!': 'Richtig!',
  'What does this mean?': 'Was bedeutet das?',
  'True or false?': 'Wahr oder falsch?',
  'Language pair': 'Sprachpaar',
  '"I speak": explanations and the "More info" follow-up use this language.':
    '"Ich spreche": Erklärungen und die Funktion "Mehr Infos" nutzen diese Sprache.',
  '"I\'m learning": new words are looked up and generated in this language.':
    '"Ich lerne": Neue Wörter werden in dieser Sprache nachgeschlagen und erstellt.',
  'Mixed practice presents due cards in a random mix of whichever formats are enabled here.':
    'Gemischtes Üben zeigt fällige Karten in einer zufälligen Mischung der hier aktivierten Formate.',
  'Cloze here is scored separately from the dedicated Cloze Practice mode.':
    'Lückentext wird hier getrennt vom eigenen Lückentext-Übungsmodus bewertet.',
  'Caps how many due cards a single review session pulls in - the most overdue cards first. Applies to every practice mode, not just Mixed.':
    'Begrenzt, wie viele fällige Karten eine einzelne Übungssitzung lädt - die am längsten fälligen zuerst. Gilt für jeden Übungsmodus, nicht nur für Gemischt.',
  'If more are due, finish the session and tap "Practice more" for another round right away, instead of waiting until they come due again.':
    'Sind noch mehr fällig, beende die Sitzung und tippe auf "Weiter üben" für eine weitere Runde, statt zu warten, bis sie erneut fällig werden.',
  'How AI Providers works': 'So funktionieren KI-Anbieter',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled.':
    'Die Kartenerstellung (Bedeutungen, Beispiele, Cluster, Phrasen, Lückentext) nutzt den unten konfigurierten und aktivierten Anbieter.',
  'Bring your own API key - nothing is sent to a provider until you generate a card.':
    'Nutze deinen eigenen API-Schlüssel - es wird nichts an einen Anbieter gesendet, bevor du eine Karte erstellst.',
  "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.":
    'Die Antwort von {{providerName}} hatte für dieses Wort nicht das erwartete Format. Das kann gelegentlich vorkommen - versuche es erneut oder wähle einen anderen KI-Anbieter unter Einstellungen > KI-Anbieter.',
  '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} hat eine Antwort geliefert, die nicht gelesen werden konnte. Das kann gelegentlich vorkommen - versuche es erneut oder wähle einen anderen KI-Anbieter unter Einstellungen > KI-Anbieter.',
  '{{providerName}} could not generate a valid response for this word. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} konnte keine gültige Antwort für dieses Wort erzeugen. Das kann gelegentlich vorkommen - versuche es erneut oder wähle einen anderen KI-Anbieter unter Einstellungen > KI-Anbieter.',
  'The word is already blanked out below - select a different word or phrase and tap "Mark as cloze" to change it.':
    'Das Wort ist unten bereits ausgeblendet - wähle ein anderes Wort oder eine andere Phrase und tippe auf "Als Lücke markieren", um es zu ändern.',
  'Cloze added to {{deck}}': 'Lückentext zu {{deck}} hinzugefügt',
  'Select a word or phrase in the sentence below, then tap "Mark as cloze" to blank it out.':
    'Wähle ein Wort oder eine Phrase im Satz unten aus und tippe dann auf "Als Lücke markieren", um es auszublenden.',
  Sentence: 'Satz',
  'Mark as cloze': 'Als Lücke markieren',
  'Nothing to preview yet.': 'Noch nichts zum Anzeigen.',
  'English translation': 'Englische Übersetzung',
  'Add cloze card': 'Lückentext-Karte hinzufügen',
  'Save cloze card': 'Lückentext-Karte speichern',

  'Underneath each example, thumbs up/down let you mark whether it\'s good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense - the same thing "Generate more examples" below the list does.':
    'Unter jedem Beispiel kannst du mit Daumen hoch/runter markieren, ob es gut ist oder später nochmal geprüft werden sollte. Das Flag-Symbol meldet ein konkretes Problem (z. B. unnatürliche Formulierung oder einen Grammatikfehler) mit optionaler Notiz. Der Kreispfeil erzeugt einen frischen Satz Beispiele für diese Bedeutung - dasselbe wie "Weitere Beispiele erzeugen" unter der Liste.',
  'Don\'t see the pattern you want? Type your own under "Custom Grammar Rule" and tap the + to add it to the selection - it\'s sent to the AI exactly as written, alongside any picked chips.':
    'Die gewünschte Struktur ist nicht dabei? Trag sie unter "Eigene Grammatikregel" ein und tippe auf +, um sie zur Auswahl hinzuzufügen - sie wird genau so, wie geschrieben, zusammen mit den ausgewählten Chips an die KI gesendet.',
  '"Generate targeted examples" replaces the current examples with fresh ones written to practice your selection. Examples generated this way get a highlighted background, so you can tell which ones came from your request.':
    '„Gezielte Beispiele erzeugen" ersetzt die aktuellen Beispiele durch neue, die genau deine Auswahl üben. Auf diese Weise erzeugte Beispiele bekommen einen hervorgehobenen Hintergrund, damit du sie erkennst.',
  'The pencil icon lets you edit the meaning or example text directly (dictionary-sourced cards only - an AI card uses Regenerate and the per-field AI tools instead). The trash icon deletes this card entirely, after confirming. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'Mit dem Stift-Symbol bearbeitest du Bedeutung oder Beispieltext direkt (nur bei Karten aus dem Wörterbuch - eine KI-Karte nutzt stattdessen Regenerieren und die einzelnen KI-Werkzeuge). Das Papierkorb-Symbol löscht diese Karte endgültig, nach einer Bestätigung. Das letzte Symbol öffnet eine schnelle Websuche zum Wort, für eine zweite Meinung außerhalb der App.',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. Tap the sparkle icon on one to fetch AI usage & nuance - how formal it is and what makes it different from the headword. The icon next to it opens that synonym as its own flashcard.':
    'Synonyme sind andere Wörter mit ähnlicher Bedeutung - nützlich, um deinen Wortschatz rund um dieses Wort zu erweitern. Tippe auf das Funkeln-Symbol bei einem Synonym, um KI-Infos zu Verwendung & Nuance abzurufen - wie förmlich es ist und was es vom Stichwort unterscheidet. Das Symbol daneben öffnet dieses Synonym als eigene Karteikarte.',
  'Phrases show this word used in common expressions or word combinations, fetched on demand: tap "Explore with AI" the first time, or "Load more with AI" for another batch once you already have some.':
    'Redewendungen zeigen dieses Wort in gängigen Ausdrücken oder Wortkombinationen, bei Bedarf abgerufen: Tippe beim ersten Mal auf „Mit KI entdecken" oder auf „Weitere mit KI laden", wenn du schon welche hast.',
  '"Add to Cloze" (or "Edit Cloze" once one exists) at the bottom opens the editor pre-filled with the currently selected example. Select a word or phrase in the sentence and tap "Mark as cloze" to blank it out - it defaults to blanking the headword itself - then adjust the translation and save.':
    '„Zu Lückentext hinzufügen" (oder „Lückentext bearbeiten", sobald einer existiert) unten öffnet den Editor, vorausgefüllt mit dem aktuell ausgewählten Beispiel. Wähle ein Wort oder eine Phrase im Satz aus und tippe auf „Als Lücke markieren", um es auszublenden - standardmäßig wird das Stichwort selbst ausgeblendet - passe dann die Übersetzung an und speichere.',
  'Saving always replaces this card\'s cloze sentence rather than adding a second one - there\'s only ever one per card.':
    'Beim Speichern wird immer der bestehende Lückentext-Satz dieser Karte ersetzt statt ein zweiter hinzugefügt - es gibt immer nur einen pro Karte.',

  // Newly added — the redesigned AI Providers help sheet (grid + single detail panel) and its
  // matching Audio Settings labels
  'Active Generation Provider': 'Aktiver Generierungsanbieter',
  'Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.':
    'Wähle, welche KI zur Kontext-Unterscheidung, Wortpaket-Erstellung und GER-Beispielsatzerstellung genutzt wird.',
  'Key configured': 'Schlüssel konfiguriert',
  'No key set': 'Kein Schlüssel hinterlegt',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.':
    'Wähle, welches System vorliest - Gerätestimmen sind kostenlos und offline nutzbar; Cloud-Anbieter nutzen deinen eigenen API-Schlüssel.',
  'Always available': 'Immer verfügbar',
  'Validated': 'Validiert',
  '"Active" vs "Enabled" - what\'s the difference?': '„Aktiv" vs. „Aktiviert" - was ist der Unterschied?',
  'Adding and validating a key': 'Einen Schlüssel hinzufügen und validieren',
  'Which provider should I pick?': 'Welchen Anbieter sollte ich wählen?',
  'What the usage numbers mean': 'Was die Nutzungszahlen bedeuten',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.':
    'Hier wird aus einem neuen Wort eine vollständige Karte - Bedeutungen, Beispielsätze, Bedeutungscluster und mehr. Sobald du ein Wort nachschlägst, das Lingora noch nicht kennt, übergibt die App es an den Anbieter, den du unten als **Aktiv** markiert hast, und lässt ihn die Karte erstellen.',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.':
    'Es funktioniert nach dem Prinzip **„eigener Schlüssel"**: Lingora liefert kein gemeinsames KI-Abo mit, daher wird nichts erzeugt, bevor du deinen eigenen API-Schlüssel bei einem der Anbieter unten eingibst. Das bedeutet auch: Solange du kein Wort nachschlägst, wird nichts gesendet - ein gespeicherter Schlüssel allein löst keine Anfrage aus.',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.':
    'Du musst nicht jeden Anbieter ausfüllen. Ein einziger funktionierender, validierter Schlüssel reicht - wähle den Dienst, bei dem du bereits ein Konto hast, oder einen, den du einfach ausprobieren möchtest, und leg dort los.',
  '**Active** is the one provider actually doing the work right now - the engine that responds when you look up a word. Only one provider can be Active at a time, and tapping a validated provider\'s card here switches to it immediately.':
    '**Aktiv** ist der eine Anbieter, der gerade wirklich arbeitet - die KI, die antwortet, wenn du ein Wort nachschlägst. Nur ein Anbieter kann gleichzeitig aktiv sein, und ein Tipp auf die Karte eines validierten Anbieters schaltet sofort dorthin um.',
  '**Enabled** is a softer flag, tucked inside a provider\'s own settings panel. It controls whether that provider is allowed to be picked at all (including as a fallback, and as an option elsewhere in the app like Settings > Translation) - flip it off if you want to keep a key saved for later without it being usable right now.':
    '**Aktiviert** ist eine sanftere Markierung, versteckt im eigenen Einstellungsbereich eines Anbieters. Sie legt fest, ob dieser Anbieter überhaupt ausgewählt werden darf (auch als Ausweichoption sowie an anderen Stellen der App wie Einstellungen > Übersetzung) - schalte sie aus, wenn du einen Schlüssel für später aufheben, ihn aber gerade nicht nutzbar machen willst.',
  'If a key gets cleared or fails validation while its provider is Active, Lingora quietly falls back to the next best option - whichever provider is both enabled and has a validated key - so you\'re never stuck without generation just because one key went stale.':
    'Wird ein Schlüssel gelöscht oder schlägt die Validierung fehl, während sein Anbieter aktiv ist, wechselt Lingora unbemerkt zur nächstbesten Option - dem Anbieter, der sowohl aktiviert ist als auch einen validierten Schlüssel hat - damit du nie ohne Generierung dastehst, nur weil ein Schlüssel ungültig geworden ist.',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Validate** - this sends one small real request to confirm the key actually works before you rely on it for word generation.':
    'Tippe auf die Karte eines Anbieters, um dessen Einstellungen zu öffnen, füge deinen API-Schlüssel ein und wähle bei Bedarf ein anderes Modell als das Standardmodell. Tippe dann auf **Validieren** - dabei wird eine kleine echte Anfrage gesendet, um zu bestätigen, dass der Schlüssel funktioniert, bevor du dich bei der Worterstellung darauf verlässt.',
  'A provider only becomes eligible to be Active once its key has validated successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.':
    'Ein Anbieter kann erst aktiv werden, wenn sein Schlüssel erfolgreich validiert wurde. Das ist Absicht - so verhindert es, dass ein vertippter oder abgelaufener Schlüssel unbemerkt zum einzigen Hindernis zwischen dir und einer neuen Karte wird.',
  '**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device\'s secure storage - not in Lingora\'s own servers, not synced anywhere, unless you back up and restore it yourself.':
    '**Löschen** entfernt den Schlüssel vollständig von diesem Gerät (und setzt Validierung und Nutzungsverlauf zurück). Alles wird ausschließlich im sicheren Speicher dieses Geräts abgelegt - nicht auf Lingoras eigenen Servern und nirgendwo synchronisiert, außer du sicherst und stellst es selbst wieder her.',
  '**OpenAI** is the default and a safe general-purpose choice - reliable structured output, widely used, easy to get a key for at `platform.openai.com`.':
    '**OpenAI** ist die Standardwahl und eine sichere Allround-Option - zuverlässige strukturierte Ausgaben, weit verbreitet, ein Schlüssel ist leicht auf `platform.openai.com` zu bekommen.',
  '**Groq** runs open models (like the gpt-oss family) on very fast custom hardware - if speed matters more to you than picking a specific model family, this is usually the quickest of the bunch to respond.':
    '**Groq** betreibt offene Modelle (wie die gpt-oss-Familie) auf sehr schneller eigener Hardware - wenn dir Geschwindigkeit wichtiger ist als eine bestimmte Modellfamilie, antwortet dieser Anbieter meist am schnellsten.',
  '**Mistral** is a solid European alternative with its own models, good if you\'d rather not depend on a US-based provider or just want a second option in the mix.':
    '**Mistral** ist eine solide europäische Alternative mit eigenen Modellen - gut geeignet, wenn du nicht von einem US-Anbieter abhängig sein möchtest oder einfach eine zweite Option haben willst.',
  '**Gemini** (Google) tends to be generous on free-tier usage limits if you\'re just trying this out without committing to a paid key yet.':
    '**Gemini** (Google) bietet oft großzügige kostenlose Nutzungsgrenzen, wenn du es erst einmal ausprobieren möchtest, ohne dich auf einen kostenpflichtigen Schlüssel festzulegen.',
  '**Claude** (Anthropic) is known for careful, well-reasoned output - a good pick if you find another provider\'s example sentences or meanings feel a little off and want to compare.':
    '**Claude** (Anthropic) ist für sorgfältige, gut durchdachte Ausgaben bekannt - eine gute Wahl, wenn dir Beispielsätze oder Bedeutungen eines anderen Anbieters etwas seltsam vorkommen und du vergleichen möchtest.',
  '**DeepSeek** is capable and inexpensive, but tends to run noticeably slower than the others for a full word generation - worth knowing going in so a longer wait doesn\'t feel like something\'s broken.':
    '**DeepSeek** ist leistungsfähig und günstig, arbeitet bei einer vollständigen Wortgenerierung aber merklich langsamer als die anderen - gut zu wissen, damit eine längere Wartezeit nicht wie ein Fehler wirkt.',
  'Whichever you choose, the model picker under each provider lets you trade off speed, cost, and quality without needing to leave this screen.':
    'Für welchen Anbieter du dich auch entscheidest - die Modellauswahl unter jedem Anbieter lässt dich Geschwindigkeit, Kosten und Qualität abwägen, ohne diesen Bildschirm zu verlassen.',
  'Each provider\'s panel shows a **device-observed usage** box - request and token counts this specific device has actually sent through that key. It\'s a convenience, not a bill: it only counts what happened here, so it won\'t match a key shared across multiple devices or apps.':
    'Im Bereich jedes Anbieters zeigt ein Feld die **geräteseitig erfasste Nutzung** - Anfrage- und Token-Anzahl, die dieses Gerät tatsächlich über diesen Schlüssel gesendet hat. Das ist eine Orientierungshilfe, keine Rechnung: Es zählt nur, was hier auf diesem Gerät passiert ist, und stimmt daher nicht mit einem Schlüssel überein, der auf mehreren Geräten oder in mehreren Apps genutzt wird.',
  'For the real, authoritative numbers - and anything to do with billing or rate limits - use the "Open usage" link, which takes you straight to that provider\'s own dashboard.':
    'Für die echten, verbindlichen Zahlen - und für alles rund um Abrechnung oder Ratenlimits - nutze den Link „Nutzung öffnen", der dich direkt zum eigenen Dashboard des jeweiligen Anbieters bringt.',
}

const fr: Partial<Record<Phrase, string>> = {
  Home: 'Accueil',
  Search: 'Recherche',
  Decks: 'Paquets',
  Mine: 'À moi',
  Settings: 'Réglages',
  Cancel: 'Annuler',
  Save: 'Enregistrer',
  Delete: 'Supprimer',
  Edit: 'Modifier',
  Done: 'Terminé',
  Continue: 'Continuer',
  Back: 'Retour',
  Next: 'Suivant',
  Add: 'Ajouter',
  Import: 'Importer',
  Export: 'Exporter',
  Retry: 'Réessayer',
  Send: 'Envoyer',
  Undo: 'Annuler',
  Redo: 'Rétablir',
  Close: 'Fermer',
  Install: 'Installer',
  Uninstall: 'Désinstaller',
  Installed: 'Installé',
  Generation: 'Génération',
  Translation: 'Traduction',
  Learning: 'Apprentissage',
  Data: 'Données',
  Privacy: 'Confidentialité',
  About: 'À propos',
  'Advanced Grammar Options': 'Options de grammaire avancées',
  'Select grammar structures to exercise in your examples:': 'Sélectionnez les structures grammaticales à exercer dans vos exemples :',
  'Generate targeted examples': 'Générer des exemples ciblés',
  'Custom Grammar Rule': 'Règle de grammaire personnalisée',
  'e.g. Past perfect continuous, reported speech...': 'ex. Plus-que-parfait continu, discours rapporté...',
  'App Language': "Langue de l'application",
  'Follow device': "Suivre la langue de l'appareil",
  'System (Auto)': 'Système (Automatique)',
  'Default CEFR level': 'Niveau CECRL par défaut',
  'Examples and explanations are calibrated to this level.':
    'Les exemples et explications sont calibrés sur ce niveau.',
  'Word of the Day reminder': 'Rappel « Mot du jour »',
  'When the daily notification for your Home screen word arrives.':
    "Quand la notification quotidienne pour votre mot de l'écran d'accueil arrive.",
  'Import & export': 'Importer et exporter',
  'Anki, CSV, JSON backup': 'Anki, CSV, sauvegarde JSON',
  'Card templates': 'Modèles de cartes',
  'Customize card layouts': 'Personnaliser la mise en page des cartes',
  Pronunciation: 'Prononciation',
  'Voice, rate, pitch': 'Voix, débit, tonalité',
  'Local Dictionaries': 'Dictionnaires locaux',
  'Free starter dictionary - no AI key needed':
    'Dictionnaire de démarrage gratuit - aucune clé IA requise',
  'Delete all API keys': 'Supprimer toutes les clés API',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'Les clés API restent sur cet appareil (Expo SecureStore) et ne sont jamais incluses dans les exports ou sauvegardes.',
  English: 'Anglais',
  German: 'Allemand',
  French: 'Français',
  Spanish: 'Espagnol',
  'Word of the Day': 'Mot du jour',
  'Learn this word': 'Apprendre ce mot',
  "Finding today's word...": "Recherche du mot du jour...",
  '✨ Word of the Day: {{word}}': '✨ Mot du jour : {{word}}',
  'Nice to see you back.': 'Content de te revoir !',
  '{{count}} days': '{{count}} jours',
  "Some data on this screen couldn't load.":
    "Certaines données de cet écran n'ont pas pu être chargées.",
  'cards due for review': 'cartes à réviser',
  'Start review': 'Commencer la révision',
  Review: 'Réviser',
  'reviewed today': "révisées aujourd'hui",
  remembered: 'mémorisé',
  'Quick actions': 'Actions rapides',
  'Look up a word': 'Chercher un mot',
  'Mining queue': 'File de minage',
  'Practice cloze': 'Pratiquer les lacunaires',
  Statistics: 'Statistiques',
  'Recently added': 'Ajoutés récemment',
  'Recently searched': 'Recherchés récemment',
  'Add to Deck': 'Ajouter au paquet',
  'Add to Cloze': 'Ajouter en texte à trous',
  Listen: 'Écouter',
  'Added to deck': 'Ajouté au paquet',
  'Added to cloze': 'Ajouté en texte à trous',
  'Deck options': 'Options du paquet',
  'Move deck': 'Déplacer le paquet',
  'Merge deck': 'Fusionner le paquet',
  'Merge into another deck': 'Fusionner dans un autre paquet',
  'Good morning!': 'Bonjour !',
  'Good afternoon!': 'Bon après-midi !',
  'Good evening!': 'Bonsoir !',
  'Add Card': 'Ajouter une carte',
  'Open Deck': 'Ouvrir le paquet',
  'eBook Library': 'Bibliothèque d\'eBooks',
  'Import eBook': 'Importer un eBook',
  'No eBooks in your library yet': 'Aucun eBook dans votre bibliothèque',
  'Loading eBook...': 'Chargement de l\'eBook...',
  'Table of Contents': 'Table des matières',
  'Reader Settings': 'Paramètres du lecteur',
  'Font Size': 'Taille de police',
  'Translate Inline': 'Traduire en ligne',
  'Selected paragraph translation': 'Traduction du paragraphe sélectionné',
  'CEFR level set in settings': 'Niveau CECRL défini dans les paramètres',
  'Remove level': 'Supprimer le niveau',
  'Set manually': 'Définir manuellement',
  'Automatic (CEFR)': 'Automatique (CECRL)',
  'See all': 'Tout voir',
  'No words yet': 'Aucun mot pour le moment',
  'Look up a word to add your first card.': 'Cherchez un mot pour ajouter votre première carte.',
  'Type a German or English word...': 'Tapez un mot allemand ou anglais...',
  'Instant lookup': 'Recherche instantanée',
  'Search in German ("ausgeh...") or English ("go out").\nInflected forms like "ging aus" work too.':
    'Recherchez en allemand ("ausgeh...") ou en anglais ("go out").\nLes formes fléchies comme "ging aus" fonctionnent aussi.',
  '"{{term}}" is new': '« {{term}} » est nouveau',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    "Ce mot n'est pas encore dans votre bibliothèque. Générez des sens, exemples et synonymes avec l'IA.",
  'Translating...': 'Traduction...',
  'Generating...': 'Génération...',
  'Generate with AI': "Générer avec l'IA",
  'Add your OpenAI key in Settings to generate new words':
    'Ajoutez votre clé OpenAI dans les réglages pour générer de nouveaux mots',
  'Generation came back incomplete': 'La génération est revenue incomplète',
  'From your installed dictionary - free, no AI needed.':
    'Depuis votre dictionnaire installé - gratuit, aucune IA nécessaire.',
  'Nothing was saved - try again.': "Rien n'a été enregistré - réessayez.",
  'Give the deck a name.': 'Donnez un nom au paquet.',
  'Could not delete deck': 'Impossible de supprimer le paquet',
  'Delete deck?': 'Supprimer le paquet ?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    "Les cartes présentes uniquement dans ce paquet sont supprimées avec lui. Les cartes présentes dans d'autres paquets restent en place.",
  'No deck selected.': 'Aucun paquet sélectionné.',
  'Could not move deck': 'Impossible de déplacer le paquet',
  'Could not merge deck': 'Impossible de fusionner le paquet',
  'Merge into "{{name}}"?': 'Fusionner dans « {{name}} » ?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'Cela supprime « {{source}} » et déplace toutes ses cartes dans « {{target}} ». Cette action est irréversible.',
  'Export ready': 'Export prêt',
  'Exported {{count}} cards.': '{{count}} cartes exportées.',
  'Saved to the folder you chose.': 'Enregistré dans le dossier choisi.',
  'Choose where to save it.': "Choisissez où l'enregistrer.",
  'Export failed': "Échec de l'export",
  'No decks yet': 'Aucun paquet pour le moment',
  'Create your first deck with the + button.': 'Créez votre premier paquet avec le bouton +.',
  'New deck': 'Nouveau paquet',
  'Deck name': 'Nom du paquet',
  'Emoji (optional)': 'Emoji (optionnel)',
  'Creating...': 'Création...',
  'Create deck': 'Créer le paquet',
  'Import into this deck': 'Importer dans ce paquet',
  'Export this deck': 'Exporter ce paquet',
  'Rename deck': 'Renommer le paquet',
  'Move to...': 'Déplacer vers...',
  'Merge into...': 'Fusionner dans...',
  'Delete deck': 'Supprimer le paquet',
  'Top level (no parent)': 'Niveau supérieur (sans parent)',
  'No other deck to nest this one under.': 'Aucun autre paquet sous lequel imbriquer celui-ci.',
  'No other deck to merge into.': 'Aucun autre paquet dans lequel fusionner.',
  'Import into "{{name}}"': 'Importer dans « {{name}} »',
  'Export "{{name}}"': 'Exporter « {{name}} »',
  '{{due}} due/{{total}} cards': '{{due}} à réviser / {{total}} cartes',
  '{{count}} due': '{{count}} à réviser',
  Deck: 'Paquet',
  'This deck no longer exists.': "Ce paquet n'existe plus.",
  cards: 'cartes',
  'due now': 'à réviser maintenant',
  'Review {{count}} due cards': 'Réviser {{count}} cartes dues',
  'Nothing due - study ahead': "Rien à réviser - étudier à l'avance",
  Cards: 'Cartes',
  'No cards yet - add words from Search.':
    'Aucune carte pour le moment - ajoutez des mots depuis la recherche.',
  'Move "{{name}}" to...': 'Déplacer « {{name}} » vers...',
  'Merge "{{name}}" into...': 'Fusionner « {{name}} » dans...',
  'Could not discard capture': "Impossible d'ignorer la capture",
  'Could not save capture': "Impossible d'enregistrer la capture",
  'Clipboard is empty': 'Le presse-papiers est vide',
  'Copy some text first, then paste it here.': "Copiez d'abord du texte, puis collez-le ici.",
  'Could not read clipboard': 'Impossible de lire le presse-papiers',
  '✨ AI enriching meanings & examples...': '✨ L\'IA enrichit les significations et exemples...',
  'AI Enrichment Failed': 'Échec de l\'enrichissement IA',
  'Selected model is not accessible with your {{providerName}} key/project. Try selecting a different model in Settings > AI Providers.':
    'Le modèle sélectionné n\'est pas accessible avec votre clé/projet {{providerName}}. Essayez de choisir un autre modèle dans Paramètres > Fournisseurs IA.',
  '{{providerName}} credit balance or quota exceeded. Please check your account plan and billing details.':
    'Solde de crédit ou quota {{providerName}} dépassé. Veuillez vérifier votre abonnement et vos coordonnées de facturation.',
  '{{providerName}} rate limit reached. Please wait a few seconds and try again.':
    'Limite de fréquence {{providerName}} atteinte. Veuillez patienter quelques secondes et réessayer.',
  'Invalid {{providerName}} API key or permission denied. Please check your key in Settings > AI Providers.':
    'Clé d\'API {{providerName}} non valide ou autorisation refusée. Veuillez vérifier votre clé dans Paramètres > Fournisseurs IA.',
  "Couldn't reach {{providerName}} - check your device's internet connection and try again.":
    'Impossible d\'atteindre {{providerName}} - vérifiez la connexion Internet de votre appareil et réessayez.',
  '{{providerName}} servers are temporarily unavailable ({{status}}). Please try again shortly.':
    'Les serveurs {{providerName}} sont temporairement indisponibles ({{status}}). Veuillez réessayer sous peu.',
  'Add your OpenAI key in Settings to generate cards.':
    'Ajoutez votre clé OpenAI dans les réglages pour générer des cartes.',
  'Add a sentence': 'Ajouter une phrase',
  'Paste or type a German sentence. It joins the queue below - nothing is sent to AI until you generate.':
    "Collez ou tapez une phrase en allemand. Elle rejoint la file ci-dessous - rien n'est envoyé à l'IA avant que vous ne générez.",
  'Paste from clipboard': 'Coller depuis le presse-papiers',
  'Adding...': 'Ajout...',
  'Add to queue': 'Ajouter à la file',
  'Queue is empty': 'La file est vide',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet - it lands here before any AI processing.':
    "Ajoutez une phrase manuellement, collez-en une depuis le presse-papiers, ou capturez du texte depuis le menu de partage - elle atterrit ici avant tout traitement par l'IA.",
  '{{done}} of {{total}} generated': '{{done}} sur {{total}} générées',
  '{{count}} failed': '{{count}} échouées',
  'see Decks.': 'voir Paquets.',
  "Review your captures. Discard what you don't need, then generate cards for the rest - no API call is wasted on text you didn't ask for.":
    "Passez en revue vos captures. Ignorez ce dont vous n'avez pas besoin, puis générez des cartes pour le reste - aucun appel API n'est gaspillé sur un texte non demandé.",
  'Generate {{count}} cards with AI': "Générer {{count}} cartes avec l'IA",
  'Add your OpenAI key to generate cards': 'Ajoutez votre clé OpenAI pour générer des cartes',
  'Explore Full AI Flashcard': "Découvrir la carte IA complète",
  'Generate Full AI Flashcard': "Générer la carte IA complète",
  'AI Insights': "Aperçus de l'IA",
  'Getting AI insights for "{{word}}"...': 'Récupération des aperçus IA pour « {{word}} »...',
  'Load more phrases with AI': "Charger plus d'expressions avec l'IA",
  'Explore idioms and collocations with AI': "Découvrir des expressions avec l'IA",
  'Tap the sparkle above to explore idioms, expressions, and common word combinations.':
    "Touchez l'étincelle ci-dessus pour découvrir des expressions, locutions et combinaisons de mots courantes.",
  'Could not load more info': "Impossible de charger plus d'informations",
  'Add your AI provider key in Settings to generate more info.':
    "Ajoutez votre clé de fournisseur IA dans les réglages pour générer plus d'informations.",
  'No additional info available yet.': "Aucune information supplémentaire disponible pour l'instant.",
  'Add your OpenAI key in Settings to generate examples.':
    'Ajoutez votre clé OpenAI dans les réglages pour générer des exemples.',
  'This word has no card yet.': "Ce mot n'a pas encore de carte.",
  'Could not save your feedback': "Impossible d'enregistrer votre avis",
  'Could not save your report': "Impossible d'enregistrer votre signalement",
  'Could not change the primary meaning': 'Impossible de changer le sens principal',
  'Could not update the flashcard example': "Impossible de mettre à jour l'exemple de la carte",
  'This word has no meaning yet.': "Ce mot n'a pas encore de sens.",
  'Could not generate an explanation': 'Impossible de générer une explication',
  'AI not configured': 'IA non configurée',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'Ajoutez une clé OpenAI, Mistral, Gemini ou Claude dans les réglages pour générer une explication de ce sens.',
  'Could not look up an explanation': 'Impossible de rechercher une explication',
  'Could not save your changes': "Impossible d'enregistrer vos modifications",
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    "« {{form}} » n'est pas encore dans votre bibliothèque. Recherchez-le depuis l'onglet Recherche pour le générer.",
  'No explanation yet.': "Pas encore d'explication.",
  'Make primary: {{translation}}': 'Définir comme principal : {{translation}}',
  Examples: 'Exemples',
  'shown on flashcard': 'affiché sur la carte',
  'use on flashcard': 'utiliser sur la carte',
  'Advanced grammar options': 'Options de grammaire avancées',
  'Active: {{selection}}': 'Actif : {{selection}}',
  'Generate examples': 'Générer des exemples',
  'Add your OpenAI key in Settings to generate targeted examples.':
    'Ajoutez votre clé OpenAI dans les réglages pour générer des exemples ciblés.',
  'Meanings in this word': 'Sens de ce mot',
  'Grammar info': 'Infos grammaticales',
  'Hide grammar info': 'Masquer les infos grammaticales',
  'chat with your AI tutor': 'discuter avec votre tuteur IA',
  'Ask about "{{word}}"': 'Posez une question sur « {{word}} »',
  'Chat with your AI tutor about this word - ask for more examples, nuance, or anything unclear.':
    'Discutez avec votre tuteur IA à propos de ce mot - demandez plus d\'exemples, des nuances, ou tout ce qui n\'est pas clair.',
  "Couldn't load the explanation.": "Impossible de charger l'explication.",
  "Couldn't load additional info.": 'Impossible de charger des infos supplémentaires.',
  'Nothing to chat about yet': 'Rien à discuter pour l\'instant',
  "This card has no meaning content yet, so there's nothing to discuss. Open it from the word's own page and try Regenerate there.":
    "Cette carte n'a pas encore de contenu de sens, il n'y a donc rien à discuter. Ouvrez-la depuis la page du mot et essayez « Régénérer » là-bas.",
  'Give me another example': 'Donne-moi un autre exemple',
  "What's a synonym for this?": 'Quel est un synonyme pour ça ?',
  'When would I use this?': 'Quand utiliserais-je ce mot ?',
  "Couldn't get a reply.": "Impossible d'obtenir une réponse.",
  'Message your AI tutor...': 'Écrivez à votre tuteur IA...',
  Synonyms: 'Synonymes',
  'Phrases & collocations': 'Expressions et collocations',
  'Cloze card': 'Carte lacunaire',
  'Cloze cards': 'Cartes lacunaires',
  'Added ✓ - add to another deck': 'Ajouté ✓ - ajouter à un autre paquet',
  'Add to deck': 'Ajouter au paquet',
  'Add "{{form}}" to...': 'Ajouter « {{form}} » à...',
  'Edit this card': 'Modifier cette carte',
  Meaning: 'Sens',
  'Example sentence': "Phrase d'exemple",
  'Example translation': "Traduction de l'exemple",
  'Save changes': 'Enregistrer les modifications',
  "What's wrong with this?": "Qu'est-ce qui ne va pas ?",
  'Optional details...': 'Détails facultatifs...',
  'Send report': 'Envoyer le signalement',
  'Sending...': 'Envoi...',
  'Inaccurate translation': 'Traduction inexacte',
  'Unnatural phrasing': 'Formulation peu naturelle',
  'Wrong CEFR level': 'Niveau CECRL incorrect',
  'Grammar error': 'Erreur de grammaire',
  Other: 'Autre',
  'Tense & mood': 'Temps et mode',
  'Sentence structure': 'Structure de phrase',
  Conjunctions: 'Conjonctions',
  'Focus words': "Mots d'insistance",
  GOOD: 'BIEN',
  AGAIN: 'ENCORE',
  EASY: 'FACILE',
  HARD: 'DIFFICILE',
  'No card to rate.': 'Aucune carte à évaluer.',
  'Could not save your rating': "Impossible d'enregistrer votre évaluation",
  'No card to edit.': 'Aucune carte à modifier.',
  'Add your AI provider key in Settings to generate an explanation.':
    "Ajoutez votre clé de fournisseur d'IA dans les réglages pour générer une explication.",
  'Nothing due right now': 'Rien à réviser pour le moment',
  'Session complete!': 'Session terminée !',
  'This deck has no cards due for review. Add words or check back later.':
    "Ce paquet n'a aucune carte à réviser. Ajoutez des mots ou revenez plus tard.",
  'You reviewed {{count}} cards. Great work - come back when the next cards are due.':
    'Vous avez révisé {{count}} cartes. Bravo - revenez quand les prochaines cartes seront dues.',
  'Back to deck': 'Retour au paquet',
  'tap to reveal': 'toucher pour révéler',
  cloze: 'lacunaire',
  'Basic inline HTML works too - {{bold}}, {{italic}}, {{colored}}.':
    'Le HTML en ligne de base fonctionne aussi - {{bold}}, {{italic}}, {{colored}}.',
  'No stats yet': 'Aucune statistique pour le moment',
  'Add and review some words to see your learning statistics here.':
    'Ajoutez et révisez des mots pour voir vos statistiques ici.',
  'remembered (30 d)': 'mémorisé (30 j)',
  'day streak': 'série de jours',
  'total cards': 'total des cartes',
  'new this week': 'nouveaux cette semaine',
  'Review activity': 'Activité de révision',
  less: 'moins',
  more: 'plus',
  'Vocabulary growth': 'Croissance du vocabulaire',
  'new words per week': 'nouveaux mots par semaine',
  'Difficult words': 'Mots difficiles',
  'No lapses yet - nothing difficult to show.':
    'Aucun échec pour le moment - rien de difficile à montrer.',
  '{{count}} lapses': '{{count}} échecs',
  'Anki deck (.apkg)': 'Paquet Anki (.apkg)',
  "Bring your existing decks. Review history isn't imported - cards start fresh.":
    "Importez vos paquets existants. L'historique de révision n'est pas importé - les cartes repartent à zéro.",
  'Choose .apkg file': 'Choisir un fichier .apkg',
  'CSV with column mapping': 'CSV avec mappage de colonnes',
  'From Quizlet, Memrise, or spreadsheets.': 'Depuis Quizlet, Memrise ou des feuilles de calcul.',
  'Choose CSV file': 'Choisir un fichier CSV',
  'A shared deck (.lem)': 'Un paquet partagé (.lem)',
  "Add a deck someone shared with you - full fidelity, including review history. Doesn't touch anything else on this device.":
    "Ajoutez un paquet que quelqu'un a partagé avec vous - fidélité totale, y compris l'historique de révision. Ne touche à rien d'autre sur cet appareil.",
  'Choose .lem file': 'Choisir un fichier .lem',
  'Restore from Lemmory backup (.lem)': 'Restaurer depuis une sauvegarde Lemmory (.lem)',
  'Replaces everything on this device with a previously exported backup.':
    'Remplace tout sur cet appareil par une sauvegarde exportée précédemment.',
  'Restoring...': 'Restauration...',
  'Choose backup file': 'Choisir un fichier de sauvegarde',
  'Lemmory backup (.lem)': 'Sauvegarde Lemmory (.lem)',
  'Your full library - decks, cards, review history. Your data is always yours. API keys are never included.':
    'Toute votre bibliothèque - paquets, cartes, historique de révision. Vos données vous appartiennent toujours. Les clés API ne sont jamais incluses.',
  'Export everything': 'Tout exporter',
  'One row per card - the same columns CSV import reads, so this file re-imports as-is.':
    "Une ligne par carte - les mêmes colonnes que celles lues par l'import CSV, donc ce fichier se réimporte tel quel.",
  'Export as CSV': 'Exporter en CSV',
  "Study your Lemmory vocabulary in Anki/AnkiDroid. Cards start fresh - review history isn't carried over.":
    "Étudiez votre vocabulaire Lemmory dans Anki/AnkiDroid. Les cartes repartent à zéro - l'historique de révision n'est pas transféré.",
  'Export as .apkg': 'Exporter en .apkg',
  'A readable word - meaning - example list. Not meant to re-import.':
    'Une liste lisible mot - sens - exemple. Pas destinée à être réimportée.',
  'Export as Markdown': 'Exporter en Markdown',
  'Backup ready': 'Sauvegarde prête',
  'Restore from backup?': 'Restaurer depuis la sauvegarde ?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'Cela remplace tout ce qui se trouve actuellement sur cet appareil par le contenu de « {{fileName}} » (exporté le {{date}}). Cette action est irréversible.',
  Restore: 'Restaurer',
  'Restore complete': 'Restauration terminée',
  'Restored {{count}} rows.': '{{count}} lignes restaurées.',
  'Restore failed': 'Échec de la restauration',
  'Invalid backup file': 'Fichier de sauvegarde invalide',
  'Could not read file': 'Impossible de lire le fichier',
  Preview: 'Aperçu',
  'Will import': 'Sera importé',
  Duplicates: 'Doublons',
  Errors: 'Erreurs',
  Selected: 'Sélectionné',
  'Import {{count}} rows': '{{count}} lignes importer',
  'Import {{count}} words': 'Importer {{count}} mots',
  'Import from CSV': 'Importer depuis CSV',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Depuis Quizlet, Memrise ou un export de feuille de calcul. Vous choisirez ensuite ce que signifie chaque colonne.',
  '{{count}} rows detected. Map each column below.':
    '{{count}} lignes détectées. Mappez chaque colonne ci-dessous.',
  'Sample data': 'Exemple de données',
  'The first few rows, so you can see what each column actually holds.':
    'Les premières lignes, pour que vous voyiez ce que chaque colonne contient réellement.',
  'Column {{n}}': 'Colonne {{n}}',
  'Field mapping': 'Mappage des champs',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes - they're derived from the example's cloze markup and its translation.":
    "Tout est facultatif. Laissez Mot/Sens non mappés pour les notes de type lacunaire - ils sont déduits du balisage lacunaire de l'exemple et de sa traduction.",
  None: 'Aucun',
  'Import into deck': 'Importer dans le paquet',
  '+ New deck': '+ Nouveau paquet',
  'If the word already exists': 'Si le mot existe déjà',
  'Applies to every duplicate row you leave checked in the next step.':
    "S'applique à chaque ligne en double laissée cochée à l'étape suivante.",
  'Checking...': 'Vérification...',
  'Preview import': "Aperçu de l'import",
  'Importing...': 'Import...',
  'Import complete': 'Import terminé',
  'Imported {{count}} words.': '{{count}} mots importés.',
  Imported: 'Importés',
  Skipped: 'Ignorés',
  Failed: 'Échoués',
  'Import another file': 'Importer un autre fichier',
  'Could not read this file': 'Impossible de lire ce fichier',
  'Import failed': "Échec de l'import",
  'This file has no rows to import.': 'Ce fichier ne contient aucune ligne à importer.',
  Word: 'Mot',
  Example: 'Exemple',
  Status: 'Statut',
  Issues: 'Problèmes',
  Skip: 'Ignorer',
  "Don't touch the existing word.": 'Ne pas toucher au mot existant.',
  Merge: 'Fusionner',
  'Add this as another meaning on the existing card.':
    'Ajouter ceci comme un autre sens sur la carte existante.',
  'Keep both': 'Garder les deux',
  'Add a second, separate card for the same word.':
    'Ajouter une deuxième carte distincte pour le même mot.',
  'Import from Anki': 'Importer depuis Anki',
  "Choose a `.apkg` export. Review history isn't imported - every card starts fresh - and media (audio/images) is stripped rather than copied.":
    "Choisissez un export `.apkg`. L'historique de révision n'est pas importé - chaque carte repart à zéro - et les médias (audio/images) sont supprimés plutôt que copiés.",
  '{{notes}} notes across {{decks}} decks. Map each field below - it applies to every note, so a note type without that many fields just leaves it empty.':
    "{{notes}} notes réparties sur {{decks}} paquets. Mappez chaque champ ci-dessous - cela s'applique à chaque note, un type de note sans autant de champs laissera simplement le champ vide.",
  'The first few notes, so you can see what each field actually holds.':
    'Les premières notes, pour que vous voyiez ce que chaque champ contient réellement.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes - they're derived from the example's cloze markup and its translation.":
    "Tout est facultatif. Laissez Mot/Sens non mappés pour les notes lacunaires - ils sont déduits du balisage lacunaire de l'exemple et de sa traduction.",
  'Field {{n}}': 'Champ {{n}}',
  'This collection has no notes to import.': 'Cette collection ne contient aucune note à importer.',
  'Could not read this collection': 'Impossible de lire cette collection',
  '{{done}} of {{total}} notes': '{{done}} sur {{total}} notes',
  'Import canceled': 'Import annulé',
  'The rest were left untouched - you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'Le reste a été laissé intact - vous pouvez réimporter le même fichier pour reprendre où vous en étiez (les mots déjà importés sont ignorés comme doublons).',
  Tags: 'Étiquettes',
  'Import from a .lem file': 'Importer depuis un fichier .lem',
  'Choose a Lemmory `.lem` file - a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    "Choisissez un fichier Lemmory `.lem` - un paquet que quelqu'un a partagé avec vous, ou l'un de vos propres exports de paquet. Fidélité totale : sens, exemples, synonymes, cartes lacunaires, historique de révision et planification FSRS sont tous transférés.",
  'This file has more than one deck. Which one do you want to import?':
    'Ce fichier contient plusieurs paquets. Lequel voulez-vous importer ?',
  'This file has no decks to import.': 'Ce fichier ne contient aucun paquet à importer.',
  'Importing "{{name}}" ({{count}} cards).': 'Import de « {{name}} » ({{count}} cartes).',
  "Don't touch the word already in your library.":
    'Ne pas toucher au mot déjà présent dans votre bibliothèque.',
  'Imported {{words}} words ({{cards}} cards).': '{{words}} mots importés ({{cards}} cartes).',
  Vocabulary: 'Vocabulaire',
  Cloze: 'Lacunaire',
  '+ New': '+ Nouveau',
  Front: 'Recto',
  'actual review card size on this device':
    'taille réelle de la carte de révision sur cet appareil',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    "Rendu avec une phrase lacunaire d'exemple via le même moteur que la session de révision.",
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'Rendu avec des données d\'exemple ("ausgehen") via le même moteur que la session de révision.',
  'Template name': 'Nom du modèle',
  Fields: 'Champs',
  'Tap "Front" or "Back" to show a field on that side - a field can appear on both, or neither.':
    "Touchez « Recto » ou « Verso » pour afficher un champ de ce côté - un champ peut apparaître des deux côtés, ou d'aucun.",
  'Layout & style': 'Mise en page et style',
  'Reset to default': 'Réinitialiser par défaut',
  'Accent color': "Couleur d'accent",
  'Stored as a': 'Enregistré comme une',
  'rule - reference it in your CSS below as':
    'règle - référencez-la dans votre CSS ci-dessous comme',
  'Applied to both sides in the real WebView renderer.':
    'Appliqué aux deux côtés dans le vrai moteur de rendu WebView.',
  'Front (Liquid)': 'Recto (Liquid)',
  'Back (Liquid)': 'Verso (Liquid)',
  'Available template variables': 'Variables de modèle disponibles',
  'Conditional example': 'Exemple conditionnel',
  'Set default': 'Définir par défaut',
  'Deleting...': 'Suppression...',
  'Delete this template?': 'Supprimer ce modèle ?',
  '"{{name}}" will be removed.': '« {{name}} » sera supprimé.',
  'Create template': 'Créer le modèle',
  'Template editor help': "Aide de l'éditeur de modèles",
  'Fields tab': 'Onglet Champs',
  'Style tab': 'Onglet Style',
  'Preview tab': 'Onglet Aperçu',
  'Code tab': 'Onglet Code',
  'HTML & CSS without extra elements': 'HTML et CSS sans éléments supplémentaires',
  'Could not save template': "Impossible d'enregistrer le modèle",
  'Could not set default template': 'Impossible de définir le modèle par défaut',
  'Could not delete template': 'Impossible de supprimer le modèle',
  'New template': 'Nouveau modèle',
  'Reset to default layout & style?': 'Réinitialiser la mise en page et le style par défaut ?',
  'This replaces the front, back, and CSS in the editor - tap "Save changes" to keep it. Unsaved edits are lost.':
    "Cela remplace le recto, le verso et le CSS dans l'éditeur - touchez « Enregistrer les modifications » pour le conserver. Les modifications non enregistrées sont perdues.",
  Reset: 'Réinitialiser',
  'Speaking rate': 'Débit de parole',
  Pitch: 'Tonalité',
  'Voice (German)': 'Voix (allemand)',
  'No German voices are installed on this device.':
    "Aucune voix allemande n'est installée sur cet appareil.",
  'Device default': "Par défaut de l'appareil",
  Enhanced: 'Améliorée',
  "Voices come from the device's own text-to-speech engine - install more from your phone's system settings if you don't see the one you want.":
    "Les voix proviennent du moteur de synthèse vocale de l'appareil - installez-en d'autres depuis les réglages système de votre téléphone si celle que vous voulez n'apparaît pas.",
  'Playing...': 'Lecture...',
  Test: 'Tester',
  'Could not install this chunk': "Impossible d'installer ce segment",
  'Could not remove this chunk': 'Impossible de supprimer ce segment',
  'Local Dictionaries installed': 'Dictionnaires locaux installés',
  'Installed {{count}} new chunks.': '{{count}} nouveaux segments installés.',
  'Could not install local dictionaries': "Impossible d'installer les dictionnaires locaux",
  '{{language}}-English Dictionary': 'Dictionnaire {{language}}-anglais',
  '{{installed}} installed · {{available}} available to install':
    '{{installed}} installés · {{available}} disponibles à installer',
  'Install all available': 'Installer tout ce qui est disponible',
  Chunks: 'Segments',
  'Words {{start}}-{{end}}': 'Mots {{start}}-{{end}}',
  '{{count}} words': '{{count}} mots',
  'Uninstall all': 'Tout désinstaller',
  'Uninstalling...': 'Désinstallation...',
  'Local Dictionaries uninstalled': 'Dictionnaires locaux désinstallés',
  'Removed {{count}} chunks.': '{{count}} segments supprimés.',
  'Could not uninstall local dictionaries': 'Impossible de désinstaller les dictionnaires locaux',
  'Uninstall all local dictionaries?': 'Désinstaller tous les dictionnaires locaux ?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'Supprime chaque segment installé de cet appareil. Les cartes déjà ajoutées à votre paquet ne sont pas affectées.',
  'No translation to add.': 'Aucune traduction à ajouter.',
  'No dictionary entry to add.': 'Aucune entrée de dictionnaire à ajouter.',
  Details: 'Détails',
  'More info': "Plus d'infos",
  'Hide details': 'Masquer les détails',
  'Context & Practical Usage': 'Contexte et utilisation pratique',
  'Understanding the {{language}} {{wordClass}} "{{headword}}"':
    'Comprendre le {{wordClass}} {{language}} « {{headword}} »',
  'Examples of Usage': "Exemples d'usage",
  Noun: 'Nom',
  Verb: 'Verbe',
  Adjective: 'Adjectif',
  Adverb: 'Adverbe',
  Preposition: 'Préposition',
  Conjunction: 'Conjonction',
  Pronoun: 'Pronom',
  Phrase: 'Expression',
  Connected: 'Connecté',
  'No internet connection': 'Pas de connexion Internet',
  'DeepL validation failed': 'Échec de la vérification DeepL',
  '{{provider}} validation failed': 'Échec de la vérification {{provider}}',
  'Delete all API keys?': 'Supprimer toutes les clés API ?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'Cela supprime toutes les clés de fournisseur de cet appareil. Le vocabulaire et la progression ne sont pas affectés.',
  'Limited mode': 'Mode limité',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    "Sans clé de génération, la création de cartes avec l'IA est désactivée. La traduction et les cartes manuelles fonctionnent toujours. Ajoutez une clé à l'un des fournisseurs ci-dessous pour l'expérience complète.",
  "Couldn't load saved settings": 'Impossible de charger les réglages enregistrés',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key - nothing is sent until you generate a card.':
    "La génération de cartes (sens, exemples, groupes, expressions, lacunaires) utilise le fournisseur ci-dessous configuré et activé. Apportez votre propre clé API - rien n'est envoyé avant que vous ne génériez une carte.",
  'Active provider': 'Fournisseur actif',
  Model: 'Modèle',
  'Paste your {{provider}} API key...': 'Collez votre clé API {{provider}}...',
  'Hide {{provider}} API key': 'Masquer la clé API {{provider}}',
  'Show {{provider}} API key': 'Afficher la clé API {{provider}}',
  'Validate key': 'Vérifier la clé',
  Clear: 'Effacer',
  'Device-observed usage': "Utilisation observée sur l'appareil",
  '{{count}} requests': '{{count}} requêtes',
  '{{count}} tokens': '{{count}} jetons',
  'Open {{provider}} usage ↗': "Ouvrir l'utilisation {{provider}} ↗",
  'Google Translate': 'Google Traduction',
  'Free tier, no key needed': 'Niveau gratuit, aucune clé requise',
  'Uses this provider\'s key above': 'Utilise la clé de ce fournisseur ci-dessus',
  'Add a key above to enable': 'Ajoutez une clé ci-dessus pour activer',
  Active: 'Actif',
  'Best German↔English quality - bring your own key':
    'Meilleure qualité allemand↔anglais - apportez votre propre clé',
  'Hide DeepL settings': 'Masquer les réglages DeepL',
  'Show DeepL settings': 'Afficher les réglages DeepL',
  'Paste your DeepL API key...': 'Collez votre clé API DeepL...',
  Enabled: 'Activé',
  'Open DeepL usage ↗': "Ouvrir l'utilisation DeepL ↗",
  'v0.0.1 · offline-first · your data stays on device':
    "v0.0.1 · hors ligne par défaut · vos données restent sur l'appareil",
  'Delete this card?': 'Supprimer cette carte ?',
  'This permanently deletes this card and all its meanings, examples, synonyms, phrases, and cloze variations. This cannot be undone.':
    'Cela supprime définitivement cette carte et tous ses sens, exemples, synonymes, expressions et cartes lacunaires. Cette action est irréversible.',
  'Could not delete this card': 'Impossible de supprimer cette carte',
  'Semantic Contexts': 'Contextes sémantiques',
  '{{count}} contexts': '{{count}} contextes',
  'Opening your vocabulary...': 'Ouverture de votre vocabulaire...',
  'Import & Export': 'Import et export',
  'Import CSV': 'Importer un CSV',
  'Import Anki deck': 'Importer un paquet Anki',
  'Card Templates': 'Modèles de cartes',
  '"Add to deck" at the bottom is how you start reviewing this word - you can add it to more than one deck, or create a new one on the spot.':
    "« Ajouter au paquet » en bas te permet de commencer à réviser ce mot - tu peux l'ajouter à plusieurs paquets, ou en créer un nouveau sur-le-champ.",
  '"Ask AI" opens a small chat where you can type a follow-up question about this specific word.':
    "« Demander à l'IA » ouvre un petit chat où tu peux poser une question complémentaire sur ce mot précis.",
  '"Explain" (or "More info" on an AI-generated card) shows or expands a direct explanation of what the word means and where or why it\'s used.':
    "« Expliquer » (ou « Plus d'infos » sur une carte générée par IA) affiche ou développe une explication directe de ce que le mot signifie et où ou pourquoi on l'utilise.",
  '"Follow device" just matches whatever language your phone is already set to.':
    "« Suivre l'appareil » adopte simplement la langue déjà définie sur ton téléphone.",
  '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.':
    "« Générer avec l'IA » crée une carte d'explication complète avec sens, exemples, grammaire et plus, en utilisant le fournisseur d'IA que tu as configuré dans les Réglages.",
  'The "AI Insights" preview gives a short, direct explanation of what the word means and where or why it\'s used - tap it any time to generate the full flashcard.':
    "L'aperçu « Aperçus IA » donne une explication courte et directe de ce que le mot signifie et où ou pourquoi on l'utilise - appuie dessus à tout moment pour générer la carte complète.",
  "\"Regenerate\" throws away this card's meanings, examples, synonyms, phrases, and cloze cards, and generates all of it fresh - useful if the current version isn't working for you. This can't be undone.":
    '« Régénérer » supprime les sens, exemples, synonymes, expressions et cartes à trous de cette carte, et régénère tout à neuf - utile si la version actuelle ne te convient pas. Cette action est irréversible.',
  '"Test active engine" plays the Test phrase through whichever engine is marked Active - the same thing any real speaker button in the app does.':
    "« Tester le moteur actif » joue la phrase de test avec le moteur marqué Actif - exactement ce que fait n'importe quel bouton haut-parleur de l'app.",
  'A cloze card blanks out part of a sentence for you to fill in - a different way of practicing the same word.':
    "Une carte à trous masque une partie d'une phrase que tu dois compléter - une autre façon de pratiquer le même mot.",
  'A green checkmark means the word is already in one of your decks.':
    "Une coche verte signifie que le mot est déjà dans l'un de tes paquets.",
  'A short summary': 'Un court résumé',
  'AI Providers': "Fournisseurs d'IA",
  'AI-generated - explanations can be inaccurate. Check important details against a trusted reference.':
    "Généré par IA - les explications peuvent contenir des erreurs. Vérifie les détails importants auprès d'une source fiable.",
  'On an AI-generated card, the short explanation right below the translation states directly what the word means and where or why it\'s used - not a hint to figure out yourself.':
    "Sur une carte générée par IA, la courte explication juste sous la traduction indique directement ce que le mot signifie et où ou pourquoi on l'utilise - pas un indice à deviner soi-même.",
  'Accent color swatches write a custom property at the top of your CSS:':
    "Les nuances de couleur d'accent inscrivent une propriété personnalisée en haut de ton CSS :",
  'Add "{{term}}" to...': 'Ajouter « {{term}} » à...',
  'Add a key in AI Providers to enable': "Ajoute une clé dans Fournisseurs d'IA pour activer",
  'Add a sentence by typing it, pasting it from your clipboard, or sharing text here from another app.':
    'Ajoute une phrase en la tapant, en la collant depuis ton presse-papiers, ou en partageant du texte ici depuis une autre app.',
  'Add card': 'Ajouter la carte',
  'Add card manually': 'Ajouter une carte manuellement',
  'Add to Lemmory': 'Ajouter à Lemmory',
  'Add to Mining queue': 'Ajouter à la file de collecte',
  'Add your AI provider key in Settings to ask a follow-up.':
    "Ajoute ta clé de fournisseur d'IA dans les Réglages pour poser une question complémentaire.",
  'Add your AI provider key in Settings to regenerate this card.':
    "Ajoute ta clé de fournisseur d'IA dans les Réglages pour régénérer cette carte.",
  'Adding from other apps': "Ajouter depuis d'autres apps",
  'Adding to a deck': 'Ajouter à un paquet',
  'All caught up - nothing due right now.': "Tout est à jour - rien à réviser pour l'instant.",
  'Alternatively, generate a new key from a project that already has it enabled (or the "Default project" if you have one).':
    "Sinon, génère une nouvelle clé depuis un projet qui l'a déjà activé (ou le « Projet par défaut » si tu en as un).",
  'Always open Search, split between Search and the Mining queue depending on how much text it is, or ask you every time.':
    'Toujours ouvrir la Recherche, répartir entre Recherche et la file de collecte selon la quantité de texte, ou te demander à chaque fois.',
  Answer: 'Réponse',
  'App version, platform, and feature tier - helps reproduce a bug.':
    "Version de l'app, plateforme et niveau de fonctionnalités - aide à reproduire un bug.",
  'App {{version}} · {{platform}} · {{tier}}': 'App {{version}} · {{platform}} · {{tier}}',
  'Applies across the app.': "S'applique à toute l'app.",
  Article: 'Article',
  Ask: 'Demander',
  'Ask AI': "Demander à l'IA",
  'Ask a follow-up question, maximum {{max}} characters':
    'Pose une question complémentaire, {{max}} caractères maximum',
  'Ask a short follow-up...': 'Pose une brève question complémentaire...',
  'Asking...': 'Envoi de la question...',
  'At most every': 'Au maximum toutes les',
  'Audio Settings': 'Réglages audio',
  'Audio Settings help': 'Aide des réglages audio',
  'Audio settings, app language': "Réglages audio, langue de l'app",
  'Aura-2. Once your key is entered, choose from Deepgram\'s available models, or switch to manual entry to enter a model name directly (see Deepgram\'s docs for exact names).':
    'Aura-2. Une fois ta clé saisie, choisis parmi les modèles disponibles de Deepgram, ou passe en saisie manuelle pour entrer un nom de modèle directement (voir la documentation de Deepgram pour les noms exacts).',
  'Automatic sync': 'Synchronisation automatique',
  CSS: 'CSS',
  CSV: 'CSV',
  'Choose a voice...': 'Choisir une voix...',
  'Choose from your {{provider}} voices instead': 'Choisir plutôt parmi tes voix {{provider}}',
  'Choosing what to keep': "Choisir ce qu'on garde",
  'Cloud providers are bring-your-own-key - nothing is sent to them until you tap a speaker icon or press Test.':
    "Les fournisseurs cloud fonctionnent avec ta propre clé - rien ne leur est envoyé tant que tu n'appuies pas sur une icône haut-parleur ou sur Tester.",
  'Comma-separated': 'Séparés par des virgules',
  'Could not add card': "Impossible d'ajouter la carte",
  'Could not create deck': 'Impossible de créer le paquet',
  'Could not generate an example': 'Impossible de générer un exemple',
  'Could not get an answer': "Impossible d'obtenir une réponse",
  'Could not regenerate this card': 'Impossible de régénérer cette carte',
  'Could not remove card': 'Impossible de supprimer la carte',
  'Could not reset progress': 'Impossible de réinitialiser la progression',
  'Could not sign in': 'Connexion impossible',
  Create: 'Créer',
  'Create & select': 'Créer et sélectionner',
  'Create new deck': 'Créer un nouveau paquet',
  'Creating a GitHub issue needs a token with write access to the repo - that can never ship inside the app, since a compiled build can be decompiled and any embedded secret treated as public.':
    "Créer une issue GitHub nécessite un jeton avec accès en écriture au dépôt - ça ne peut jamais être inclus dans l'app, car une build compilée peut être décompilée et tout secret embarqué doit être considéré comme public.",
  Deepgram: 'Deepgram',
  'Default: {{voice}}': 'Par défaut : {{voice}}',
  'Delete All AI Providers Keys': "Supprimer toutes les clés de fournisseurs d'IA",
  'Delete all AI provider keys?': "Supprimer toutes les clés de fournisseur d'IA ?",
  'Depending on a setting in Settings, under "Share & Search," a shared sentence might land here right away, or you might get asked what to do with it first.':
    "Selon un réglage dans les Réglages, sous « Partage et recherche », une phrase partagée peut atterrir ici directement, ou on peut te demander d'abord quoi en faire.",
  'Device (built-in)': 'Appareil (intégré)',
  'Display on Flashcard': 'Afficher sur la carte',
  'Each provider\'s own "Test this provider" button plays through that card\'s current key/voice/speed directly, regardless of which engine is Active - use it to check a setup before switching to it.':
    "Le bouton « Tester ce fournisseur » de chaque carte lit directement avec la clé/voix/vitesse actuelle de cette carte, quel que soit le moteur Actif - utilise-le pour vérifier une configuration avant d'y basculer.",
  'Each row is one piece of card data. Tap "Front" or "Back" to show that field on that side - a field can appear on both, on neither, or on just one.':
    'Chaque ligne est une donnée de la carte. Appuie sur « Recto » ou « Verso » pour afficher ce champ sur cette face - un champ peut apparaître sur les deux, sur aucune, ou sur une seule.',
  ElevenLabs: 'ElevenLabs',
  'Email (Optional)': 'E-mail (facultatif)',
  'Enter the word first.': "Saisis d'abord le mot.",
  'Every card in "{{name}}" goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    "Chaque carte de « {{name}} » repasse à l'état « nouvelle » - la révision mot-sens et la pratique à trous repartent toutes deux de zéro. Ton historique de révision est conservé. Cette action est irréversible.",
  'Every card in this deck goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    "Chaque carte de ce paquet repasse à l'état « nouvelle » - la révision mot-sens et la pratique à trous repartent toutes deux de zéro. Ton historique de révision est conservé. Cette action est irréversible.",
  'Every speaker button in the app uses whichever engine is marked Active below.':
    "Chaque bouton haut-parleur de l'app utilise le moteur marqué Actif ci-dessous.",
  'Everything in the queue is selected by default. Tap a card to include or leave it out, or use the trash icon to remove it for good.':
    "Tout dans la file est sélectionné par défaut. Appuie sur une carte pour l'inclure ou l'exclure, ou utilise l'icône corbeille pour la supprimer définitivement.",
  'Everything renders inside a real WebView, so standard CSS applies as on any web page - flexbox, custom fonts via @font-face, transitions, etc. all work; there is no special "app CSS" subset to learn beyond this.':
    "Tout s'affiche dans une vraie WebView, donc le CSS standard s'applique comme sur n'importe quelle page web - flexbox, polices personnalisées via @font-face, transitions, etc. fonctionnent tous ; il n'y a pas de sous-ensemble « CSS app » spécial à apprendre en plus.",
  'Example sentences': "Phrases d'exemple",
  'Example sentences show the word used in context, with a translation underneath.':
    "Les phrases d'exemple montrent le mot utilisé en contexte, avec une traduction en dessous.",
  'Examples generated from a selected option get a highlighted background, so you can tell which ones came from your request.':
    "Les exemples générés à partir d'une option sélectionnée ont un fond surligné, pour que tu puisses voir lesquels viennent de ta demande.",
  'Explain, Ask AI & more': "Expliquer, Demander à l'IA et plus",
  'Explanations and the "More info" follow-up use this language.':
    "Les explications et le complément « Plus d'infos » utilisent cette langue.",
  'Exporting...': 'Exportation...',
  Expression: 'Expression',
  'Fields added via the toggles are never auto-wrapped in a <div> or <span> - {{ word }} renders as bare text directly inside the card body. That keeps generated templates minimal, but it means a rule like ".word { ... }" has nothing to match unless you add that class yourself.':
    "Les champs ajoutés via les interrupteurs ne sont jamais automatiquement enveloppés dans un <div> ou un <span> - {{ word }} s'affiche comme du texte brut directement dans le corps de la carte. Cela garde les modèles générés minimalistes, mais une règle comme « .word { ... } » n'a rien à cibler tant que tu n'ajoutes pas cette classe toi-même.",
  "Found a sentence somewhere else, like an article or a message? Share it to Lemmory the same way you'd share it to any other app.":
    "Tu as trouvé une phrase ailleurs, comme dans un article ou un message ? Partage-la vers Lemmory comme tu le ferais vers n'importe quelle autre app.",
  'Front and Back are raw Liquid templates - anything valid Liquid works here, not just what the Fields toggles generate.':
    'Recto et Verso sont des modèles Liquid bruts - tout code Liquid valide fonctionne ici, pas seulement ce que génèrent les interrupteurs de champs.',
  "Front and Back are separate - the chip above the card switches which side is rendered, so you always know exactly which side you're looking at.":
    'Recto et Verso sont séparés - la puce au-dessus de la carte change la face affichée, donc tu sais toujours exactement quelle face tu regardes.',
  Full: 'Complet',
  Gender: 'Genre',
  General: 'Général',
  'General settings help': 'Aide des réglages généraux',
  'Generated with AI - not from your installed dictionary.':
    'Généré par IA - ne provient pas de ton dictionnaire installé.',
  'Generating your card...': 'Génération de ta carte...',
  'Generation came back incomplete - nothing was changed. Try again.':
    "La génération est revenue incomplète - rien n'a été modifié. Réessaie.",
  'Go to platform.openai.com > Settings > Projects > select the project this key belongs to > Models > enable gpt-4o-mini-tts for that project.':
    'Va sur platform.openai.com > Settings > Projects > sélectionne le projet auquel appartient cette clé > Models > active gpt-4o-mini-tts pour ce projet.',
  'Hide DeepL API key': 'Masquer la clé API DeepL',
  Hindi: 'Hindi',
  'How Audio Settings works': 'Comment fonctionnent les réglages audio',
  'I speak': 'Je parle',
  "I'm learning": "J'apprends",
  'If Validate says a project doesn\'t have access to gpt-4o-mini-tts, but the model works fine on platform.openai.com, your API key is scoped to a specific OpenAI Project that hasn\'t enabled it.':
    "Si Valider indique qu'un projet n'a pas accès à gpt-4o-mini-tts, mais que le modèle fonctionne bien sur platform.openai.com, ta clé API est limitée à un projet OpenAI spécifique qui ne l'a pas activé.",
  'If a cloud key is invalid, the provider is unreachable, or a request fails, playback falls back to the device voice automatically - you\'re never left with silence.':
    "Si une clé cloud est invalide, si le fournisseur est injoignable, ou si une requête échoue, la lecture bascule automatiquement sur la voix de l'appareil - tu ne te retrouves jamais dans le silence.",
  "If a word isn't in your library yet, you may see a quick built-in dictionary entry and/or a translation preview - both are read-only until you choose to add one to a deck.":
    "Si un mot n'est pas encore dans ta bibliothèque, tu peux voir une entrée rapide du dictionnaire intégré et/ou un aperçu de traduction - les deux sont en lecture seule tant que tu ne choisis pas de l'ajouter à un paquet.",
  'If no model is picked, a default is chosen to match whatever language is set under Settings > Learning > "I\'m learning" (English, German, Spanish, or French) - other languages fall back to an English voice until you pick one manually.':
    "Si aucun modèle n'est choisi, un modèle par défaut est sélectionné selon la langue définie dans Réglages > Apprentissage > « J'apprends » (anglais, allemand, espagnol ou français) - les autres langues utilisent une voix anglaise jusqu'à ce que tu en choisisses une manuellement.",
  'If no voice is picked, a known-good multilingual default voice is used automatically.':
    "Si aucune voix n'est choisie, une voix multilingue par défaut connue pour bien fonctionner est utilisée automatiquement.",
  'If this word has more than one distinct sense - say, a casual meaning and a business one - you\'ll see small labeled capsules (like "social" or "formal") just above the translation. Tap one to switch; each keeps its own examples and synonyms.':
    "Si ce mot a plusieurs sens distincts - par exemple un sens familier et un sens professionnel - tu verras de petites capsules étiquetées (comme « familier » ou « soutenu ») juste au-dessus de la traduction. Appuie sur l'une pour basculer ; chacune garde ses propres exemples et synonymes.",
  'Import & export, templates, local dictionaries':
    'Import et export, modèles, dictionnaires locaux',
  'Include diagnostics': 'Inclure les diagnostics',
  'Inflected or conjugated forms work too, not just the base/dictionary form of a word.':
    "Les formes fléchies ou conjuguées fonctionnent aussi, pas seulement la forme de base/dictionnaire d'un mot.",
  'Install more voices from your phone\'s system settings if the one you want isn\'t listed.':
    "Installe d'autres voix depuis les réglages système de ton téléphone si celle que tu veux n'est pas listée.",
  'Installing...': 'Installation...',
  'Key validated': 'Clé validée',
  'Last synced: {{when}}': 'Dernière synchronisation : {{when}}',
  'List fields (Other meanings, Synonyms, Related phrases) already need a {% for %} loop to render at all - that loop is structurally required, not a styling choice. To style each item individually, wrap the item inside the loop:':
    "Les champs de liste (Autres sens, Synonymes, Expressions liées) ont déjà besoin d'une boucle {% for %} pour s'afficher - cette boucle est structurellement obligatoire, pas un choix de style. Pour styliser chaque élément individuellement, enveloppe l'élément à l'intérieur de la boucle :",
  'Long-press a word in any app and pick "Search in Lemmory" to look it up here right away.':
    "Fais un appui long sur un mot dans n'importe quelle app et choisis « Rechercher dans Lemmory » pour le chercher ici directement.",
  'Long-press a word in any app - your browser, messages, anywhere - and pick "Search in Lemmory." It opens right here with that word ready to go.':
    "Fais un appui long sur un mot dans n'importe quelle app - ton navigateur, tes messages, n'importe où - et choisis « Rechercher dans Lemmory ». Ça s'ouvre directement ici avec ce mot prêt à l'emploi.",
  Markdown: 'Markdown',
  Message: 'Message',
  'Mine help': 'Aide de la collecte',
  'Mine is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    "La Collecte est une zone d'attente pour les phrases que tu veux transformer en cartes de vocabulaire plus tard - rien ici ne se fait automatiquement.",
  Never: 'Jamais',
  'Never included: word content, translations, AI responses, or API keys.':
    "Jamais inclus : contenu des mots, traductions, réponses de l'IA ou clés API.",
  'New deck name': 'Nom du nouveau paquet',
  'New words are looked up and generated in this language.':
    'Les nouveaux mots sont recherchés et générés dans cette langue.',
  'No AI provider active - open Settings': "Aucun fournisseur d'IA actif - ouvrir les Réglages",
  'No AI provider is active - add and enable one in Settings to generate new words':
    "Aucun fournisseur d'IA n'est actif - ajoutes-en un et active-le dans les Réglages pour générer de nouveaux mots",
  'No AI provider is active - add and enable one to generate targeted examples.':
    "Aucun fournisseur d'IA n'est actif - ajoutes-en un et active-le pour générer des exemples ciblés.",
  'No AI provider is active.': "Aucun fournisseur d'IA n'est actif.",
  'No AI provider is active. Add and enable one in Settings to generate cards.':
    "Aucun fournisseur d'IA n'est actif. Ajoutes-en un et active-le dans les Réglages pour générer des cartes.",
  'No AI provider is active. Add and enable one in Settings to generate examples.':
    "Aucun fournisseur d'IA n'est actif. Ajoutes-en un et active-le dans les Réglages pour générer des exemples.",
  'No AI provider is active. Add and enable one in Settings to generate words.':
    "Aucun fournisseur d'IA n'est actif. Ajoutes-en un et active-le dans les Réglages pour générer des mots.",
  'No decks yet - create one above.': 'Pas encore de paquets - crées-en un ci-dessus.',
  'No provider configured - AI generation disabled':
    'Aucun fournisseur configuré - génération par IA désactivée',
  'No settings match "{{query}}"': 'Aucun réglage ne correspond à « {{query}} »',
  'No {{language}} voices are installed on this device.':
    "Aucune voix en {{language}} n'est installée sur cet appareil.",
  Normal: 'Normal',
  'Not supported yet': 'Pas encore pris en charge',
  'Match your native language too?': 'Adapter aussi votre langue maternelle ?',
  'You just set the app language to {{language}}. Also set "I speak" to match?':
    "Vous venez de définir la langue de l'application sur {{language}}. Définir aussi « Je parle » sur cette langue ?",
  'Match the app language too?': "Adapter aussi la langue de l'application ?",
  'You just set "I speak" to {{language}}. Switch the app\'s own language to match?':
    "Vous venez de définir « Je parle » sur {{language}}. Changer aussi la langue de l'application ?",
  'Yes, switch it': 'Oui, changer',
  'No, keep it': 'Non, garder',
  'Nothing to add.': 'Rien à ajouter.',
  'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.':
    "Seulement la version de l'app, la plateforme et ton niveau de fonctionnalités actuel (Complet ou Traduction seule) - suffisant pour aider à reproduire un bug.",
  'Only bother with this if you want to be selective - otherwise everything gets turned into cards together.':
    'Ne te préoccupe de ça que si tu veux être sélectif - sinon tout est transformé en cartes ensemble.',
  'Only if you want a reply - also becomes public once posted.':
    'Seulement si tu veux une réponse - devient aussi public une fois publié.',
  'Open Settings': 'Ouvrir les Réglages',
  OpenAI: 'OpenAI',
  'Or enter an ID manually': 'Ou saisis un ID manuellement',
  'Phrases show this word used in common expressions or word combinations.':
    'Les expressions montrent ce mot utilisé dans des tournures courantes ou des combinaisons de mots.',
  'Pick a look for the whole app, from bright to dark and everything between.':
    "Choisis une apparence pour toute l'app, du clair au sombre et tout ce qu'il y a entre les deux.",
  'Picking a swatch again (or none) removes the line - it never conflicts with CSS you write by hand elsewhere in the box.':
    "Sélectionner à nouveau une nuance (ou aucune) supprime la ligne - ça n'entre jamais en conflit avec le CSS que tu écris toi-même ailleurs dans la case.",
  "Please don't include anything private in your message.":
    'Merci de ne rien inclure de personnel dans ton message.',
  'Practice reverse': "Pratiquer à l'envers",
  'Practice words': 'Pratiquer les mots',
  'Practice {{count}} cloze': 'Pratiquer {{count}} trous',
  'Reference it anywhere in your own CSS rules, e.g.:':
    "Référence-la n'importe où dans tes propres règles CSS, par ex. :",
  Regenerate: 'Régénérer',
  'Regenerate this card?': 'Régénérer cette carte ?',
  Remove: 'Supprimer',
  'Remove {{count}}': 'Supprimer {{count}}',
  'Remove {{count}} cards from this deck?': 'Supprimer {{count}} cartes de ce paquet ?',
  'Removing...': 'Suppression...',
  'Rendering goes through the exact same LiquidJS + WebView pipeline the review session uses, with one fixed sample word ("ausgehen") standing in for your real vocabulary.':
    "Le rendu passe exactement par le même processus LiquidJS + WebView que la session de révision, avec un mot d'exemple fixe (« ausgehen ») à la place de ton vrai vocabulaire.",
  'Report an issue or request a feature': 'Signaler un problème ou demander une fonctionnalité',
  'Reset progress': 'Réinitialiser la progression',
  'Reset progress?': 'Réinitialiser la progression ?',
  'Reset to default?': 'Réinitialiser aux valeurs par défaut ?',
  'Resetting...': 'Réinitialisation...',
  "Review your captures. Discard what you don't need, then generate cards for the rest.":
    "Passe en revue tes captures. Écarte ce dont tu n'as pas besoin, puis génère des cartes pour le reste.",
  'Review {{count}} words': 'Réviser {{count}} mots',
  'Saving...': 'Enregistrement...',
  'Search from anywhere': "Rechercher depuis n'importe où",
  'Search help': 'Aide de la recherche',
  'Search in German ("ausgeh...") or English ("go out").\\nInflected forms like "ging aus" work too.':
    'Cherche en allemand (« ausgeh... ») ou en anglais (« go out »).\\nLes formes fléchies comme « ging aus » fonctionnent aussi.',
  'Search settings': 'Rechercher dans les réglages',
  'Search this': 'Rechercher ceci',
  'Select cards': 'Sélectionner des cartes',
  'Selectors that work with zero extra markup (they target the card body itself or elements this app already emits):':
    "Sélecteurs qui fonctionnent sans balisage supplémentaire (ils ciblent le corps de la carte lui-même ou des éléments que l'app génère déjà) :",
  'Send Feedback': 'Envoyer un avis',
  'Send Feedback help': "Aide pour l'envoi d'avis",
  'Sentence (use [...] for the gap)': 'Phrase (utilise [...] pour le trou)',
  'Sentence translation': 'Traduction de la phrase',
  'Share & Search': 'Partage et recherche',
  'Show DeepL API key': 'Afficher la clé API DeepL',
  'Shown on flashcard': 'Affiché sur la carte',
  'Sign in with Google': 'Se connecter avec Google',
  'Sign out': 'Se déconnecter',
  'Signing in...': 'Connexion...',
  'Speaking speed': 'Vitesse de la voix',
  'Speaking speed isn\'t configurable for this provider yet.':
    "La vitesse de la voix n'est pas encore configurable pour ce fournisseur.",
  'Speech engine': 'Moteur vocal',
  "Submitting posts your message as a GitHub issue on Lemmory's public repository - anyone can read it, including your contact email if you provide one.":
    "Envoyer publie ton message comme issue GitHub sur le dépôt public de Lemmory - n'importe qui peut le lire, y compris ton e-mail de contact si tu en fournis un.",
  Sync: 'Synchronisation',
  'Sync decks, cards, and progress to a Google account':
    'Synchroniser les paquets, cartes et progression avec un compte Google',
  'Sync failed': 'Échec de la synchronisation',
  'Sync not connected': 'Synchronisation non connectée',
  'Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.':
    "Connecte ton compte Google dans Réglages > Synchronisation pour synchroniser tes paquets et ta progression entre tes appareils.",
  'Sync in the background whenever you leave the app, at most this often':
    "Synchroniser en arrière-plan chaque fois que tu quittes l'app, au maximum aussi souvent que ceci",
  'Sync now': 'Synchroniser maintenant',
  'Sync your decks, cards, and review progress to a Google account so they carry over to another device. API keys are never synced.':
    'Synchronise tes paquets, cartes et progression de révision avec un compte Google pour les retrouver sur un autre appareil. Les clés API ne sont jamais synchronisées.',
  Synced: 'Synchronisé',
  'Syncing...': 'Synchronisation...',
  'Synonyms & phrases': 'Synonymes et expressions',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. You can rate or flag one the same way as an example.':
    "Les synonymes sont d'autres mots de sens proche, utiles pour élargir ton vocabulaire autour de ce mot. Tu peux en noter ou en signaler un de la même façon qu'un exemple.",
  'Tap the star on any example to choose which one appears on your flashcard - only one shows at a time.':
    "Appuie sur l'étoile de n'importe quel exemple pour choisir celui qui apparaît sur ta carte - un seul s'affiche à la fois.",
  'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.':
    'Appuyer sur « Ajouter au paquet » demande toujours à quel paquet ajouter le mot, et te permet de créer un tout nouveau paquet sur-le-champ.',
  'Test active engine': 'Tester le moteur actif',
  'Test phrase': 'Phrase de test',
  'Test this provider': 'Tester ce fournisseur',
  'Testing a voice': "Test d'une voix",
  'Text to speak when testing': 'Texte à prononcer lors du test',
  'Thanks for the feedback': 'Merci pour ton avis',
  'The "Available template variables" card lists every field name you can reference, with a one-line description of what it holds.':
    "La carte « Variables de modèle disponibles » liste tous les noms de champs que tu peux référencer, avec une description en une ligne de ce qu'ils contiennent.",
  'The CSS box applies to both the front and back - there is one stylesheet per template, not one per side.':
    "La case CSS s'applique au recto et au verso - il y a une feuille de style par modèle, pas une par face.",
  'The button at the bottom turns your selected sentences into real vocabulary cards, one at a time.':
    'Le bouton en bas transforme tes phrases sélectionnées en véritables cartes de vocabulaire, une par une.',
  'The card fills the available screen space exactly (no scrolling) and the caption above it shows its real, on-device measured width and height in points - the same size a card gets during an actual review session.':
    "La carte remplit exactement l'espace disponible à l'écran (sans défilement) et la légende au-dessus indique sa largeur et sa hauteur réelles mesurées sur l'appareil, en points - la même taille qu'une carte pendant une vraie session de révision.",
  'The conditional example at the bottom is a worked, copy-pasteable snippet combining {% if %} and {% for ... limit %}.':
    "L'exemple conditionnel en bas est un extrait fonctionnel, prêt à copier-coller, combinant {% if %} et {% for ... limit %}.",
  'The dropdown above the examples ("all", "travel", "business", and so on) filters them down to a particular tone or situation, if you only want to see those.':
    'Le menu déroulant au-dessus des exemples (« tous », « voyage », « affaires », etc.) les filtre selon un ton ou une situation précise, si tu ne veux voir que ceux-là.',
  'The pencil icon lets you edit the meaning or example text directly. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    "L'icône crayon te permet de modifier directement le texte du sens ou de l'exemple. La dernière icône ouvre une recherche web rapide sur le mot, pour un second avis en dehors de l'app.",
  'The row of small icon buttons under the meaning gives you a few more ways to dig into this word.':
    "La rangée de petites icônes sous le sens t'offre d'autres façons d'approfondir ce mot.",
  'The sentence must contain "[...]" for the gap, and an answer is required.':
    'La phrase doit contenir « [...] » pour le trou, et une réponse est requise.',
  'The toggles read the template text itself (no hidden markers) - they work reliably for templates built through the toggles. If you hand-write unusual formatting in the Code tab, a toggle may not detect it; edit the Code tab directly in that case.':
    "Les interrupteurs lisent le texte du modèle lui-même (pas de marqueurs cachés) - ils fonctionnent de façon fiable pour les modèles créés via les interrupteurs. Si tu écris à la main une mise en forme inhabituelle dans l'onglet Code, un interrupteur peut ne pas la détecter ; modifie alors directement l'onglet Code.",
  'The translation at the top is what actually appears on your flashcard.':
    'La traduction en haut est ce qui apparaît réellement sur ta carte.',
  'The voice list follows whatever language is set under Settings > Learning > "I\'m learning".':
    "La liste des voix suit la langue définie dans Réglages > Apprentissage > « J'apprends ».",
  Theme: 'Thème',
  'Thinking...': 'Réflexion...',
  'This becomes a public issue': 'Ceci devient une issue publique',
  'This card, explained': 'Cette carte, expliquée',
  "This changes the language of the app itself - its buttons and menus - not the language you're learning.":
    "Ceci change la langue de l'app elle-même - ses boutons et menus - pas la langue que tu apprends.",
  'This collapsible panel below the examples lets you pick a specific grammar pattern - a tense, a sentence structure, a particular conjunction - that you want the next batch of examples to practice, instead of leaving it to chance.':
    "Ce panneau repliable sous les exemples te permet de choisir une structure grammaticale précise - un temps, une construction de phrase, une conjonction particulière - que tu veux pratiquer dans le prochain lot d'exemples, plutôt que de laisser ça au hasard.",
  "This is a preview of the feedback form - sending isn't connected yet, so nothing was sent anywhere. Once it is, this exact form will open a GitHub issue on your behalf.":
    "Ceci est un aperçu du formulaire d'avis - l'envoi n'est pas encore connecté, donc rien n'a été envoyé nulle part. Une fois que ce sera le cas, ce même formulaire ouvrira une issue GitHub en ton nom.",
  'This is the one step that actually does the work - nothing before it does anything with your captured text.':
    "C'est la seule étape qui fait réellement le travail - rien avant elle ne fait quoi que ce soit avec ton texte capturé.",
  'This only changes colors - nothing about how the app works.':
    "Ceci ne change que les couleurs - rien sur le fonctionnement de l'app.",
  'This only removes them from this deck - cards that live in other decks too stay there.':
    "Ceci les retire seulement de ce paquet - les cartes présentes aussi dans d'autres paquets y restent.",
  'This opens a separate screen for the voice that reads words out loud, and how fast it speaks.':
    "Ceci ouvre un écran séparé pour la voix qui lit les mots à voix haute, et sa vitesse d'élocution.",
  'This removes every OpenAI/Mistral/Gemini/Claude key from this device. Vocabulary and progress are unaffected.':
    'Ceci supprime toutes les clés OpenAI/Mistral/Gemini/Claude de cet appareil. Le vocabulaire et la progression ne sont pas affectés.',
  'This replaces the fields, layout, and style with the built-in default, and saves immediately. This cannot be undone.':
    'Ceci remplace les champs, la mise en page et le style par les valeurs par défaut intégrées, et enregistre immédiatement. Cette action est irréversible.',
  'This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.':
    'Ceci remplace les sens, exemples, synonymes, expressions et cartes à trous par une nouvelle génération IA. Cette action est irréversible.',
  'This screen is a preview of the full flow; submitting just confirms locally for now. A small server-side function will handle real submission in a future update.':
    "Cet écran est un aperçu du flux complet ; envoyer ne fait pour l'instant que confirmer localement. Une petite fonction côté serveur gérera l'envoi réel dans une future mise à jour.",
  'This setting decides what happens next.': 'Ce réglage détermine ce qui se passe ensuite.',
  Title: 'Titre',
  'To style one field on its own - e.g. make the word bigger than the rest - wrap just that field in your own element in the Code tab, then target the class you chose:':
    "Pour styliser un champ à part - par ex. agrandir le mot par rapport au reste - enveloppe uniquement ce champ dans ton propre élément dans l'onglet Code, puis cible la classe que tu as choisie :",
  'Translation-only': 'Traduction seule',
  "Turning a field on inserts the minimum Liquid needed for it at the end of that side's template: a plain field becomes {{ word }}; a list field (Other meanings, Synonyms, Related phrases) becomes a {% for %} loop, because a list can't be printed directly.":
    "Activer un champ insère le minimum de code Liquid nécessaire à la fin du modèle de cette face : un champ simple devient {{ word }} ; un champ de liste (Autres sens, Synonymes, Expressions liées) devient une boucle {% for %}, car une liste ne peut pas s'afficher directement.",
  'Turning captures into cards': 'Transformer les captures en cartes',
  "Type a word in either language you've set up under Learning - your own vocabulary is searched instantly as you type.":
    "Tape un mot dans l'une des langues configurées dans Apprentissage - ton propre vocabulaire est cherché instantanément pendant que tu tapes.",
  "Underneath each example, thumbs up/down let you mark whether it's good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense.":
    "Sous chaque exemple, les pouces haut/bas te permettent d'indiquer s'il est bon ou à revérifier plus tard. L'icône drapeau signale un problème précis (comme une formulation peu naturelle ou une erreur de grammaire) avec une note facultative. La flèche circulaire régénère un nouveau lot d'exemples pour ce sens.",
  'Unknown error': 'Erreur inconnue',
  Usage: 'Utilisation',
  'Uses this provider\'s key from AI Providers':
    "Utilise la clé de ce fournisseur depuis Fournisseurs d'IA",
  'Uses your phone\'s own text-to-speech engine - offline, free, no API key.':
    'Utilise le moteur de synthèse vocale de ton téléphone - hors ligne, gratuit, sans clé API.',
  Voice: 'Voix',
  'Voice ({{language}})': 'Voix ({{language}})',
  'Want it to work a bit differently? There\'s a setting for that in Settings, under "Share & Search."':
    'Tu veux que ça fonctionne un peu différemment ? Il y a un réglage pour ça dans les Réglages, sous « Partage et recherche ».',
  'What diagnostics includes': 'Ce que contiennent les diagnostics',
  'What happened, or what would you like to see?': "Que s'est-il passé, ou qu'aimerais-tu voir ?",
  'What kind of feedback?': "Quel type d'avis ?",
  'What this screen is for': 'À quoi sert cet écran',
  'Whatever translation at this moment is selected/shown will be added to deck along with its relevant example.':
    'La traduction sélectionnée/affichée à ce moment sera ajoutée au paquet avec son exemple correspondant.',
  'When a word is new to you': 'Quand un mot est nouveau pour toi',
  'Why nothing sends yet': "Pourquoi rien n'est encore envoyé",
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.':
    "Sans clé de génération, la création de cartes par IA est désactivée. La traduction et les cartes manuelles fonctionnent toujours. Ajoute une clé dans Fournisseurs d'IA pour l'expérience complète.",
  'Word and meaning are required.': 'Le mot et le sens sont requis.',
  'Word card': 'Carte de mot',
  'You can add your cards to multiple decks even if it is added before.':
    'Tu peux ajouter tes cartes à plusieurs paquets même si elles y ont déjà été ajoutées.',
  "You can also share text from another app straight to Lemmory, the same way you'd share a link or a photo.":
    'Tu peux aussi partager du texte depuis une autre app directement vers Lemmory, comme tu partagerais un lien ou une photo.',
  "You can also share text to Lemmory, the same way you'd share a link or a photo to any other app.":
    "Tu peux aussi partager du texte vers Lemmory, comme tu partagerais un lien ou une photo vers n'importe quelle autre app.",
  'ask a follow-up question': 'poser une question complémentaire',
  'e.g. Er lehnt das Angebot ab.': 'ex. Er lehnt das Angebot ab.',
  'e.g. He refuses the offer.': "ex. Il refuse l'offre.",
  'e.g. We are going out tonight.': 'ex. Nous sortons ce soir.',
  'e.g. Wir gehen heute Abend [...].': 'ex. Wir gehen heute Abend [...].',
  'e.g. ablehnen': 'ex. ablehnen',
  'e.g. aus': 'ex. aus',
  'e.g. to refuse': 'ex. refuser',
  'e.g. verweigern, zurückweisen': 'ex. verweigern, zurückweisen',
  'eleven_multilingual_v2. Once your key is entered, choose from your own ElevenLabs voice library, or switch to manual entry to paste a voice ID directly.':
    'eleven_multilingual_v2. Une fois ta clé saisie, choisis parmi ta propre bibliothèque de voix ElevenLabs, ou passe en saisie manuelle pour coller directement un ID de voix.',
  'generate an explanation for this meaning': 'générer une explication pour ce sens',
  'gpt-4o-mini-tts. Marin and Cedar (★) are OpenAI\'s newest, most natural-sounding voices.':
    "gpt-4o-mini-tts. Marin et Cedar (★) sont les voix les plus récentes et les plus naturelles d'OpenAI.",
  'regenerate this card': 'régénérer cette carte',
  reverse: "à l'envers",
  'this deck': 'ce paquet',
  'you@example.com': 'toi@exemple.com',
  '{{ variable }} prints a value. {% if gender %}...{% endif %} shows content only when a field has one - good for optional fields. {% for s in synonyms %}...{% endfor %} loops a list; add "limit:2" to cap it, and {% unless forloop.last %}...{% endunless %} to add a separator between items but not after the last one.':
    '{{ variable }} affiche une valeur. {% if gender %}...{% endif %} affiche du contenu seulement quand un champ en a un - utile pour les champs facultatifs. {% for s in synonyms %}...{% endfor %} parcourt une liste ; ajoute « limit:2 » pour la limiter, et {% unless forloop.last %}...{% endunless %} pour ajouter un séparateur entre les éléments mais pas après le dernier.',
  '{{cefr}} · {{native}} > {{target}}': '{{cefr}} · {{native}} > {{target}}',
  '{{count}} of {{total}} configured': '{{count}} sur {{total}} configuré(s)',
  '{{count}} selected': '{{count}} sélectionné(s)',
  '{{count}}h': '{{count}} h',
  '{{count}}m': '{{count}} min',
  "{{language}} isn't ready yet - English and German are the only languages Lemmory fully supports right now.":
    "{{language}} n'est pas encore prêt - l'anglais et l'allemand sont les seules langues entièrement prises en charge par Lemmory pour l'instant.",
  '{{provider}} playback failed': 'Échec de la lecture {{provider}}',
  '{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted':
    '{{pulled}} récupérées · {{pushed}} envoyées · {{deleted}} supprimées',

  masculine: 'masculin',
  feminine: 'féminin',
  neuter: 'neutre',
  Again: 'Encore',
  Hard: 'Difficile',
  Good: 'Bien',
  Easy: 'Facile',
  'Lemmory Light': 'Lemmory Clair',
  'Midnight Indigo': 'Indigo Minuit',
  'Carbon Noir': 'Carbone Noir',
  'Arctic Day': 'Jour Arctique',
  'Warm Sand': 'Sable Chaud',
  Paperlight: 'Blanc Papier',
  'Meanings, examples, clusters, phrases, and cloze - the default generation provider.':
    'Significations, exemples, groupes, phrases et textes à trous - le fournisseur de génération par défaut.',
  'BYOK alternative for card generation and translation.':
    'Alternative BYOK pour la génération de cartes et la traduction.',
  'Google Gemini BYOK for card generation and translation.':
    'Google Gemini BYOK pour la génération de cartes et la traduction.',
  'Claude BYOK for card generation and translation.':
    'Claude BYOK pour la génération de cartes et la traduction.',
  'Your phone\'s own text-to-speech engine. Offline, no API key, no per-word cost.':
    'Le moteur de synthèse vocale intégré à ton téléphone. Hors ligne, sans clé API, sans coût par mot.',
  'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.':
    'gpt-4o-mini-tts. Pour la voix la plus naturelle, choisis Marin ou Cedar ci-dessous.',
  'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.':
    'eleven_multilingual_v2. Colle un identifiant de voix depuis ta bibliothèque de voix ElevenLabs.',
  'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).':
    'Aura-2. Saisis le nom exact du modèle pour la voix/langue souhaitée (voir la documentation Deepgram).',
  'Bug / Issue': 'Bug / Problème',
  'Feature request': 'Demande de fonctionnalité',
  'General feedback': 'Retour général',
  Vietnamese: 'Vietnamien',

  Queue: 'File',
  'Queue help': 'Aide de la file',
  'Queue is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    "La file est un espace d'attente pour les phrases que tu veux transformer en cartes de vocabulaire plus tard - rien ne se passe ici automatiquement.",

  'Generate {{count}} cards to...': 'Générer {{count}} cartes dans...',
  'Delete account & sync data?': 'Supprimer le compte et les données synchronisées ?',
  'This permanently erases everything you\'ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can\'t be undone.':
    'Cela efface définitivement tout ce que tu as synchronisé dans le cloud et te déconnecte. Tes paquets et cartes sur cet appareil ne sont pas affectés. Cette action est irréversible.',
  'Delete everything': 'Tout supprimer',
  'Deletion failed': 'Échec de la suppression',
  'Danger zone': 'Zone de danger',
  'Permanently erase everything synced to this account and sign out. Your data on this device stays put.':
    'Efface définitivement tout ce qui a été synchronisé avec ce compte et déconnecte-toi. Tes données sur cet appareil restent intactes.',
  'Delete account & sync data': 'Supprimer le compte et les données synchronisées',
  'Sync help': 'Aide sur la synchronisation',
  'How sync works': 'Comment fonctionne la synchronisation',
  'Deleting your account & data': 'Supprimer ton compte et tes données',
  'What does this actually delete?': "Qu'est-ce que ça supprime exactement ?",
  "Signing in with Google links this device to a private cloud copy of your decks, cards, and review progress - so if you get a new phone, or use Lemmory on two devices, you're not starting from zero on the second one.":
    'Se connecter avec Google relie cet appareil à une copie cloud privée de tes decks, cartes et progression - donc si tu changes de téléphone, ou utilises Lemmory sur deux appareils, tu ne repars pas de zéro sur le second.',
  'Tap "Sync now" any time to push your latest changes up and pull down anything from another device. Under the hood it merges rather than overwrites - if you added a card here and reviewed one on your other phone, both survive.':
    "Touche « Synchroniser maintenant » à tout moment pour envoyer tes derniers changements et récupérer ceux d'un autre appareil. En coulisses, ça fusionne plutôt que d'écraser - si tu as ajouté une carte ici et révisé sur ton autre téléphone, les deux sont conservés.",
  "Your AI provider API keys are never synced. They live only in this device's secure storage, so you'll need to re-enter them if you set up a new device.":
    "Tes clés API des fournisseurs d'IA ne sont jamais synchronisées. Elles restent uniquement dans le stockage sécurisé de cet appareil - tu devras les ressaisir sur un nouvel appareil.",
  'When this is on, Lemmory quietly syncs in the background whenever you leave the app - no need to remember to tap "Sync now" yourself.':
    "Une fois activé, Lemmory se synchronise discrètement en arrière-plan dès que tu quittes l'app - plus besoin de penser à toucher « Synchroniser maintenant » toi-même.",
  "\"At most every\" is a cooldown, not a schedule - it won't sync more often than that, but it also won't force a sync if you haven't opened the app in the meantime.":
    "« Au plus toutes les » est un délai minimum, pas un horaire fixe - ça ne synchronise pas plus souvent que ça, mais ça ne force pas non plus une synchronisation si tu n'as pas rouvert l'app entre-temps.",
  "It runs over whatever connection you've got, Wi-Fi or mobile data - there's no Wi-Fi-only toggle.":
    "Ça fonctionne avec n'importe quelle connexion disponible, Wi-Fi ou données mobiles - il n'y a pas d'option Wi-Fi uniquement.",
  "This is the one action here you genuinely can't undo - read this before you tap it.":
    "C'est la seule action ici que tu ne peux vraiment pas annuler - lis ceci avant de la toucher.",
  'It permanently erases everything this account ever synced to the cloud, disconnects the Google account from Lemmory, and signs you out.':
    'Ça efface définitivement tout ce que ce compte a jamais synchronisé dans le cloud, déconnecte le compte Google de Lemmory, et te déconnecte.',
  'Your decks, cards, and progress on THIS device are completely untouched - they stay right where they are, fully usable offline. Only the cloud copy (and the link to it) is gone.':
    'Tes decks, cartes et progression sur CET appareil restent totalement intacts - ils restent exactement là où ils sont, utilisables hors ligne. Seule la copie cloud (et le lien vers elle) disparaît.',
  'If you sign back in with the same Google account afterward, syncing starts fresh - nothing comes back automatically.':
    'Si tu te reconnectes ensuite avec le même compte Google, la synchronisation repart de zéro - rien ne revient automatiquement.',
  'Card type for this import': 'Type de carte pour cet import',
  'A row with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    "Une ligne avec à la fois un mot/sens ET une phrase à trous devient UNE carte, jamais deux. Tu veux les deux ? Importe à nouveau le fichier ensuite avec l'autre type de carte.",
  'A note with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    "Une note avec à la fois un mot/sens ET une phrase à trous devient UNE carte, jamais deux. Tu veux les deux ? Importe à nouveau le fichier ensuite avec l'autre type de carte.",
  'Regular (word/meaning)': 'Normale (mot/sens)',
  'Cloze (fill-in-the-blank)': 'À trous',
  'View all cards (table)': 'Voir toutes les cartes (tableau)',
  '{{name}} - all cards': '{{name}} - toutes les cartes',
  'All cards': 'Toutes les cartes',
  'No cards yet': 'Pas encore de cartes',
  'Add words from Search or import a file to see them here.':
    'Ajoute des mots depuis la recherche ou importe un fichier pour les voir ici.',
  Type: 'Type',
  'Part of speech': 'Nature grammaticale',
  CEFR: 'Niveau CECRL',

  // Newly added — Mixed practice, question types, cards-per-session, and the AI Providers help
  // sheet/error-message hardening that went with them
  'Fill in the blank': 'Texte à trous',
  'True or False': 'Vrai ou faux',
  'Multiple choice': 'Choix multiple',
  mixed: 'mixte',
  'true/false': 'vrai/faux',
  'multiple choice': 'choix multiple',
  'Mixed practice': 'Entraînement mixte',
  'Practice more': 'Continuer',
  'Practice question types': 'Types de questions',
  'Cards per session': 'Cartes par session',
  'No limit': 'Aucune limite',
  'You reviewed {{count}} cards. There are more cards due - keep going or come back later.':
    "Tu as révisé {{count}} cartes. D'autres cartes sont encore à réviser - continue ou reviens plus tard.",
  'Added to {{deck}}': 'Ajouté à {{deck}}',
  'Cloze added': 'Texte lacunaire ajouté',
  '"{{word}}" means "{{meaning}}"': '« {{word}} » signifie « {{meaning}} »',
  'Not quite - "{{word}}" means "{{meaning}}".': 'Pas tout à fait - « {{word}} » signifie « {{meaning}} ».',
  True: 'Vrai',
  False: 'Faux',
  'Correct!': 'Correct !',
  'What does this mean?': 'Que signifie ce mot ?',
  'True or false?': 'Vrai ou faux ?',
  'Language pair': 'Paire de langues',
  '"I speak": explanations and the "More info" follow-up use this language.':
    '« Je parle » : les explications et le suivi « Plus d\'infos » utilisent cette langue.',
  '"I\'m learning": new words are looked up and generated in this language.':
    '« J\'apprends » : les nouveaux mots sont recherchés et générés dans cette langue.',
  'Mixed practice presents due cards in a random mix of whichever formats are enabled here.':
    "L'entraînement mixte présente les cartes à réviser dans un mélange aléatoire des formats activés ici.",
  'Cloze here is scored separately from the dedicated Cloze Practice mode.':
    "Le texte lacunaire est noté séparément du mode d'entraînement lacunaire dédié.",
  'Caps how many due cards a single review session pulls in - the most overdue cards first. Applies to every practice mode, not just Mixed.':
    "Limite le nombre de cartes à réviser chargées dans une seule session - les plus en retard d'abord. S'applique à tous les modes d'entraînement, pas seulement Mixte.",
  'If more are due, finish the session and tap "Practice more" for another round right away, instead of waiting until they come due again.':
    'S\'il en reste, termine la session et appuie sur « Continuer » pour une autre série tout de suite, plutôt que d\'attendre qu\'elles soient de nouveau dues.',
  'How AI Providers works': 'Comment fonctionnent les fournisseurs IA',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled.':
    'La génération de cartes (sens, exemples, groupes, phrases, texte lacunaire) utilise le fournisseur configuré et activé ci-dessous.',
  'Bring your own API key - nothing is sent to a provider until you generate a card.':
    "Utilise ta propre clé API - rien n'est envoyé à un fournisseur avant que tu génères une carte.",
  "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.":
    "La réponse de {{providerName}} pour ce mot n'était pas dans le format attendu. Cela peut arriver occasionnellement - réessaie, ou choisis un autre fournisseur IA dans Réglages > Fournisseurs IA.",
  '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} a renvoyé une réponse illisible. Cela peut arriver occasionnellement - réessaie, ou choisis un autre fournisseur IA dans Réglages > Fournisseurs IA.',
  '{{providerName}} could not generate a valid response for this word. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    "{{providerName}} n'a pas pu générer de réponse valide pour ce mot. Cela peut arriver occasionnellement - réessaie, ou choisis un autre fournisseur IA dans Réglages > Fournisseurs IA.",
  'The word is already blanked out below - select a different word or phrase and tap "Mark as cloze" to change it.':
    'Le mot est déjà masqué ci-dessous - sélectionne un autre mot ou une autre expression et appuie sur « Marquer comme lacune » pour le changer.',
  'Cloze added to {{deck}}': 'Texte lacunaire ajouté à {{deck}}',
  'Select a word or phrase in the sentence below, then tap "Mark as cloze" to blank it out.':
    'Sélectionne un mot ou une expression dans la phrase ci-dessous, puis appuie sur « Marquer comme lacune » pour le masquer.',
  Sentence: 'Phrase',
  'Mark as cloze': 'Marquer comme lacune',
  'Nothing to preview yet.': 'Encore rien à afficher.',
  'English translation': 'Traduction anglaise',
  'Add cloze card': 'Ajouter une carte lacunaire',
  'Save cloze card': 'Enregistrer la carte lacunaire',

  'Underneath each example, thumbs up/down let you mark whether it\'s good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense - the same thing "Generate more examples" below the list does.':
    "Sous chaque exemple, pouce en haut/en bas te permet d'indiquer s'il est bon ou à vérifier plus tard. L'icône drapeau signale un problème précis (formulation peu naturelle, erreur de grammaire...) avec une note facultative. La flèche circulaire régénère un nouveau lot d'exemples pour ce sens - comme « Générer plus d'exemples » sous la liste.",
  'Don\'t see the pattern you want? Type your own under "Custom Grammar Rule" and tap the + to add it to the selection - it\'s sent to the AI exactly as written, alongside any picked chips.':
    "Tu ne trouves pas la structure voulue ? Saisis la tienne sous « Règle de grammaire personnalisée » et appuie sur + pour l'ajouter à la sélection - elle est envoyée à l'IA telle quelle, avec les puces déjà choisies.",
  '"Generate targeted examples" replaces the current examples with fresh ones written to practice your selection. Examples generated this way get a highlighted background, so you can tell which ones came from your request.':
    "« Générer des exemples ciblés » remplace les exemples actuels par de nouveaux, écrits pour pratiquer ta sélection. Les exemples générés ainsi ont un fond mis en évidence, pour que tu puisses les repérer.",
  'The pencil icon lets you edit the meaning or example text directly (dictionary-sourced cards only - an AI card uses Regenerate and the per-field AI tools instead). The trash icon deletes this card entirely, after confirming. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    "L'icône crayon te permet de modifier directement le sens ou le texte d'exemple (cartes issues du dictionnaire uniquement - une carte IA utilise plutôt Régénérer et les outils IA par champ). L'icône poubelle supprime définitivement cette carte, après confirmation. La dernière icône ouvre une recherche web rapide pour le mot, pour un second avis en dehors de l'appli.",
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. Tap the sparkle icon on one to fetch AI usage & nuance - how formal it is and what makes it different from the headword. The icon next to it opens that synonym as its own flashcard.':
    "Les synonymes sont d'autres mots de sens proche, utiles pour élargir ton vocabulaire autour de ce mot. Appuie sur l'icône étincelle d'un synonyme pour obtenir l'usage et la nuance donnés par l'IA - son degré de formalité et ce qui le distingue du mot vedette. L'icône à côté ouvre ce synonyme comme sa propre carte.",
  'Phrases show this word used in common expressions or word combinations, fetched on demand: tap "Explore with AI" the first time, or "Load more with AI" for another batch once you already have some.':
    'Les expressions montrent ce mot utilisé dans des tournures ou combinaisons courantes, récupérées à la demande : appuie sur « Explorer avec l\'IA » la première fois, ou sur « Charger plus avec l\'IA » pour un nouveau lot une fois que tu en as déjà.',
  '"Add to Cloze" (or "Edit Cloze" once one exists) at the bottom opens the editor pre-filled with the currently selected example. Select a word or phrase in the sentence and tap "Mark as cloze" to blank it out - it defaults to blanking the headword itself - then adjust the translation and save.':
    "« Ajouter au texte lacunaire » (ou « Modifier le texte lacunaire » une fois qu'il en existe un) en bas ouvre l'éditeur pré-rempli avec l'exemple actuellement sélectionné. Sélectionne un mot ou une expression dans la phrase et appuie sur « Marquer comme lacune » pour le masquer - par défaut, c'est le mot vedette lui-même qui est masqué - puis ajuste la traduction et enregistre.",
  'Saving always replaces this card\'s cloze sentence rather than adding a second one - there\'s only ever one per card.':
    "L'enregistrement remplace toujours la phrase lacunaire existante de cette carte plutôt que d'en ajouter une seconde - il n'y en a jamais qu'une seule par carte.",

  // Newly added — the redesigned AI Providers help sheet (grid + single detail panel) and its
  // matching Audio Settings labels
  'Active Generation Provider': 'Fournisseur de génération actif',
  'Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.':
    'Choisis quel moteur IA est utilisé pour la désambiguïsation du contexte, la génération du pack de mots et la création des phrases d\'exemple selon le niveau CECR.',
  'Key configured': 'Clé configurée',
  'No key set': 'Aucune clé définie',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.':
    'Choisis quel moteur lit à voix haute - les voix de l\'appareil sont gratuites et fonctionnent hors ligne ; les fournisseurs cloud utilisent ta propre clé API.',
  'Always available': 'Toujours disponible',
  'Validated': 'Validée',
  '"Active" vs "Enabled" - what\'s the difference?': '« Actif » et « Activé » : quelle est la différence ?',
  'Adding and validating a key': 'Ajouter et valider une clé',
  'Which provider should I pick?': 'Quel fournisseur choisir ?',
  'What the usage numbers mean': 'Ce que signifient les chiffres d\'utilisation',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.':
    'C\'est ici qu\'un nouveau mot devient une carte complète - significations, phrases d\'exemple, groupes de sens, et plus encore. Dès que tu recherches un mot que Lingora ne connaît pas encore, l\'app le transmet au fournisseur que tu as marqué comme **Actif** ci-dessous et lui demande de construire la carte.',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.':
    'C\'est le principe **« apporte ta propre clé »** : Lingora ne fournit pas d\'abonnement IA partagé, donc rien n\'est généré tant que tu n\'as pas collé ta propre clé API pour l\'un des fournisseurs ci-dessous. Cela signifie aussi que rien n\'est jamais envoyé nulle part tant que tu ne recherches pas réellement un mot - avoir simplement une clé enregistrée ne déclenche aucune requête.',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.':
    'Tu n\'as pas besoin de remplir tous les fournisseurs. Une seule clé fonctionnelle et validée suffit - choisis le service pour lequel tu as déjà un compte, ou celui que tu as envie d\'essayer, et commence par là.',
  '**Active** is the one provider actually doing the work right now - the engine that responds when you look up a word. Only one provider can be Active at a time, and tapping a validated provider\'s card here switches to it immediately.':
    '**Actif** désigne le seul fournisseur qui travaille réellement en ce moment - le moteur qui répond quand tu recherches un mot. Un seul fournisseur peut être Actif à la fois, et toucher la carte d\'un fournisseur validé y bascule immédiatement.',
  '**Enabled** is a softer flag, tucked inside a provider\'s own settings panel. It controls whether that provider is allowed to be picked at all (including as a fallback, and as an option elsewhere in the app like Settings > Translation) - flip it off if you want to keep a key saved for later without it being usable right now.':
    '**Activé** est un indicateur plus discret, dans les réglages propres à chaque fournisseur. Il détermine si ce fournisseur peut être choisi du tout (y compris comme solution de repli, et comme option ailleurs dans l\'app, par exemple dans Réglages > Traduction) - désactive-le si tu veux garder une clé de côté sans qu\'elle soit utilisable pour le moment.',
  'If a key gets cleared or fails validation while its provider is Active, Lingora quietly falls back to the next best option - whichever provider is both enabled and has a validated key - so you\'re never stuck without generation just because one key went stale.':
    'Si une clé est effacée ou échoue à la validation alors que son fournisseur est Actif, Lingora bascule discrètement vers la meilleure option suivante - un fournisseur à la fois activé et doté d\'une clé validée - pour que tu ne te retrouves jamais sans génération simplement parce qu\'une clé est devenue invalide.',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Validate** - this sends one small real request to confirm the key actually works before you rely on it for word generation.':
    'Touche la carte d\'un fournisseur pour ouvrir ses réglages, colle ta clé API, et choisis un modèle différent du modèle par défaut si tu le souhaites. Touche ensuite **Valider** - cela envoie une petite requête réelle pour confirmer que la clé fonctionne réellement avant que tu ne t\'y fies pour générer un mot.',
  'A provider only becomes eligible to be Active once its key has validated successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.':
    'Un fournisseur ne devient éligible pour devenir Actif qu\'une fois sa clé validée avec succès. C\'est voulu - cela évite qu\'une clé mal saisie ou expirée devienne, sans que tu le saches, le seul obstacle entre toi et une nouvelle carte.',
  '**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device\'s secure storage - not in Lingora\'s own servers, not synced anywhere, unless you back up and restore it yourself.':
    '**Effacer** supprime la clé de cet appareil entièrement (et réinitialise son historique de validation et d\'utilisation). Rien n\'est stocké ailleurs que dans le stockage sécurisé de cet appareil - ni sur les serveurs de Lingora, ni synchronisé où que ce soit, sauf si tu sauvegardes et restaures toi-même.',
  '**OpenAI** is the default and a safe general-purpose choice - reliable structured output, widely used, easy to get a key for at `platform.openai.com`.':
    '**OpenAI** est le choix par défaut, sûr et polyvalent - sortie structurée fiable, très utilisé, une clé facile à obtenir sur `platform.openai.com`.',
  '**Groq** runs open models (like the gpt-oss family) on very fast custom hardware - if speed matters more to you than picking a specific model family, this is usually the quickest of the bunch to respond.':
    '**Groq** fait tourner des modèles ouverts (comme la famille gpt-oss) sur un matériel maison très rapide - si la vitesse compte plus pour toi qu\'une famille de modèle précise, c\'est généralement le plus rapide à répondre.',
  '**Mistral** is a solid European alternative with its own models, good if you\'d rather not depend on a US-based provider or just want a second option in the mix.':
    '**Mistral** est une bonne alternative européenne avec ses propres modèles - utile si tu préfères ne pas dépendre d\'un fournisseur américain, ou si tu veux simplement une seconde option.',
  '**Gemini** (Google) tends to be generous on free-tier usage limits if you\'re just trying this out without committing to a paid key yet.':
    '**Gemini** (Google) offre souvent des limites d\'utilisation gratuites généreuses si tu veux juste essayer sans t\'engager tout de suite avec une clé payante.',
  '**Claude** (Anthropic) is known for careful, well-reasoned output - a good pick if you find another provider\'s example sentences or meanings feel a little off and want to compare.':
    '**Claude** (Anthropic) est réputé pour des réponses soignées et bien construites - un bon choix si les phrases d\'exemple ou les significations d\'un autre fournisseur te semblent un peu bancales et que tu veux comparer.',
  '**DeepSeek** is capable and inexpensive, but tends to run noticeably slower than the others for a full word generation - worth knowing going in so a longer wait doesn\'t feel like something\'s broken.':
    '**DeepSeek** est performant et peu coûteux, mais tend à être nettement plus lent que les autres pour générer un mot complet - utile à savoir pour qu\'une attente plus longue ne donne pas l\'impression d\'un bug.',
  'Whichever you choose, the model picker under each provider lets you trade off speed, cost, and quality without needing to leave this screen.':
    'Quel que soit ton choix, le sélecteur de modèle sous chaque fournisseur te permet d\'ajuster vitesse, coût et qualité sans quitter cet écran.',
  'Each provider\'s panel shows a **device-observed usage** box - request and token counts this specific device has actually sent through that key. It\'s a convenience, not a bill: it only counts what happened here, so it won\'t match a key shared across multiple devices or apps.':
    'Le panneau de chaque fournisseur affiche un encadré d\'**utilisation observée sur l\'appareil** - le nombre de requêtes et de jetons réellement envoyés par cet appareil via cette clé. C\'est un repère pratique, pas une facture : cela ne compte que ce qui s\'est passé ici, donc cela ne correspondra pas à une clé partagée entre plusieurs appareils ou applications.',
  'For the real, authoritative numbers - and anything to do with billing or rate limits - use the "Open usage" link, which takes you straight to that provider\'s own dashboard.':
    'Pour les chiffres réels et faisant foi - et pour tout ce qui concerne la facturation ou les limites de débit - utilise le lien « Ouvrir l\'utilisation », qui t\'amène directement au tableau de bord de ce fournisseur.',
}

const es: Partial<Record<Phrase, string>> = {
  Home: 'Inicio',
  Search: 'Buscar',
  Decks: 'Mazos',
  Mine: 'Mío',
  Settings: 'Ajustes',
  Cancel: 'Cancelar',
  Save: 'Guardar',
  Delete: 'Eliminar',
  Edit: 'Editar',
  Done: 'Hecho',
  Continue: 'Continuar',
  Back: 'Atrás',
  Next: 'Siguiente',
  Add: 'Añadir',
  Import: 'Importar',
  Export: 'Exportar',
  Retry: 'Reintentar',
  Send: 'Enviar',
  Undo: 'Deshacer',
  Redo: 'Rehacer',
  Close: 'Cerrar',
  Install: 'Instalar',
  Uninstall: 'Desinstalar',
  Installed: 'Instalado',
  Generation: 'Generación',
  Translation: 'Traducción',
  Learning: 'Aprendizaje',
  Data: 'Datos',
  Privacy: 'Privacidad',
  About: 'Acerca de',
  'Advanced Grammar Options': 'Opciones de gramática avanzadas',
  'Select grammar structures to exercise in your examples:': 'Selecciona estructuras gramaticales para ejercitar en tus ejemplos:',
  'Generate targeted examples': 'Generar ejemplos específicos',
  'Custom Grammar Rule': 'Regla gramatical personalizada',
  'e.g. Past perfect continuous, reported speech...': 'ej. Pasado perfecto continuo, estilo indirecto...',
  'App Language': 'Idioma de la aplicación',
  'Follow device': 'Seguir el idioma del dispositivo',
  'System (Auto)': 'Sistema (Automático)',
  'Default CEFR level': 'Nivel MCER predeterminado',
  'Examples and explanations are calibrated to this level.':
    'Los ejemplos y explicaciones están calibrados para este nivel.',
  'Word of the Day reminder': 'Recordatorio de "Palabra del día"',
  'When the daily notification for your Home screen word arrives.':
    'Cuándo llega la notificación diaria de tu palabra en la pantalla de inicio.',
  'Import & export': 'Importar y exportar',
  'Anki, CSV, JSON backup': 'Anki, CSV, copia de seguridad JSON',
  'Card templates': 'Plantillas de tarjetas',
  'Customize card layouts': 'Personalizar el diseño de las tarjetas',
  Pronunciation: 'Pronunciación',
  'Voice, rate, pitch': 'Voz, velocidad, tono',
  'Local Dictionaries': 'Diccionarios locales',
  'Free starter dictionary - no AI key needed':
    'Diccionario inicial gratuito - no requiere clave de IA',
  'Delete all API keys': 'Eliminar todas las claves API',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'Las claves API permanecen en este dispositivo (Expo SecureStore) y nunca se incluyen en exportaciones o copias de seguridad.',
  English: 'Inglés',
  German: 'Alemán',
  French: 'Francés',
  Spanish: 'Español',
  'Word of the Day': 'Palabra del día',
  'Learn this word': 'Aprender esta palabra',
  "Finding today's word...": 'Buscando la palabra de hoy...',
  '✨ Word of the Day: {{word}}': '✨ Palabra del día: {{word}}',
  'Nice to see you back.': '¡Qué bueno verte de nuevo!',
  '{{count}} days': '{{count}} días',
  "Some data on this screen couldn't load.":
    'Algunos datos de esta pantalla no se pudieron cargar.',
  'cards due for review': 'tarjetas pendientes de repaso',
  'Start review': 'Iniciar repaso',
  Review: 'Repasar',
  'reviewed today': 'repasadas hoy',
  remembered: 'recordado',
  'Quick actions': 'Acciones rápidas',
  'Look up a word': 'Buscar una palabra',
  'Mining queue': 'Cola de minería',
  'Practice cloze': 'Practicar huecos',
  Statistics: 'Estadísticas',
  'Recently added': 'Añadidas recientemente',
  'Recently searched': 'Buscados recientemente',
  'Add to Deck': 'Añadir al mazo',
  'Add to Cloze': 'Añadir a texto con huecos',
  Listen: 'Escuchar',
  'Added to deck': 'Añadido al mazo',
  'Added to cloze': 'Añadido a texto con huecos',
  'Deck options': 'Opciones del mazo',
  'Move deck': 'Mover mazo',
  'Merge deck': 'Combinar mazo',
  'Merge into another deck': 'Combinar en otro mazo',
  'Good morning!': '¡Buenos días!',
  'Good afternoon!': '¡Buenas tardes!',
  'Good evening!': '¡Buenas noches!',
  'Add Card': 'Añadir tarjeta',
  'Open Deck': 'Abrir mazo',
  'eBook Library': 'Biblioteca de eBooks',
  'Import eBook': 'Importar eBook',
  'No eBooks in your library yet': 'Aún no hay eBooks en tu biblioteca',
  'Loading eBook...': 'Cargando eBook...',
  'Table of Contents': 'Índice de contenidos',
  'Reader Settings': 'Ajustes del lector',
  'Font Size': 'Tamaño de fuente',
  'Translate Inline': 'Traducir en línea',
  'Selected paragraph translation': 'Traducción del párrafo seleccionado',
  'CEFR level set in settings': 'Nivel MCER establecido en ajustes',
  'Remove level': 'Quitar nivel',
  'Set manually': 'Establecer manualmente',
  'Automatic (CEFR)': 'Automático (MCER)',
  'See all': 'Ver todo',
  'No words yet': 'Aún no hay palabras',
  'Look up a word to add your first card.': 'Busca una palabra para añadir tu primera tarjeta.',
  'Type a German or English word...': 'Escribe una palabra en alemán o inglés...',
  'Instant lookup': 'Búsqueda instantánea',
  'Search in German ("ausgeh...") or English ("go out").\nInflected forms like "ging aus" work too.':
    'Busca en alemán ("ausgeh...") o en inglés ("go out").\nLas formas flexionadas como "ging aus" también funcionan.',
  '"{{term}}" is new': '"{{term}}" es nuevo',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    'Esta palabra aún no está en tu biblioteca. Genera significados, ejemplos y sinónimos con IA.',
  'Translating...': 'Traduciendo...',
  'Generating...': 'Generando...',
  'Generate with AI': 'Generar con IA',
  'Add your OpenAI key in Settings to generate new words':
    'Añade tu clave de OpenAI en Ajustes para generar nuevas palabras',
  'Generation came back incomplete': 'La generación volvió incompleta',
  'From your installed dictionary - free, no AI needed.':
    'De tu diccionario instalado - gratis, sin necesidad de IA.',
  'Nothing was saved - try again.': 'No se guardó nada - inténtalo de nuevo.',
  'Give the deck a name.': 'Ponle un nombre al mazo.',
  'Could not delete deck': 'No se pudo eliminar el mazo',
  'Delete deck?': '¿Eliminar el mazo?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    'Las tarjetas que solo están en este mazo se eliminan con él. Las tarjetas en otros mazos permanecen allí.',
  'No deck selected.': 'Ningún mazo seleccionado.',
  'Could not move deck': 'No se pudo mover el mazo',
  'Could not merge deck': 'No se pudo fusionar el mazo',
  'Merge into "{{name}}"?': '¿Fusionar en "{{name}}"?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'Esto elimina "{{source}}" y mueve todas sus tarjetas a "{{target}}". Esta acción no se puede deshacer.',
  'Export ready': 'Exportación lista',
  'Exported {{count}} cards.': '{{count}} tarjetas exportadas.',
  'Saved to the folder you chose.': 'Guardado en la carpeta elegida.',
  'Choose where to save it.': 'Elige dónde guardarlo.',
  'Export failed': 'Error al exportar',
  'No decks yet': 'Aún no hay mazos',
  'Create your first deck with the + button.': 'Crea tu primer mazo con el botón +.',
  'New deck': 'Nuevo mazo',
  'Deck name': 'Nombre del mazo',
  'Emoji (optional)': 'Emoji (opcional)',
  'Creating...': 'Creando...',
  'Create deck': 'Crear mazo',
  'Import into this deck': 'Importar a este mazo',
  'Export this deck': 'Exportar este mazo',
  'Rename deck': 'Renombrar mazo',
  'Move to...': 'Mover a...',
  'Merge into...': 'Fusionar en...',
  'Delete deck': 'Eliminar mazo',
  'Top level (no parent)': 'Nivel superior (sin mazo padre)',
  'No other deck to nest this one under.': 'No hay otro mazo bajo el cual anidar este.',
  'No other deck to merge into.': 'No hay otro mazo con el que fusionar.',
  'Import into "{{name}}"': 'Importar a "{{name}}"',
  'Export "{{name}}"': 'Exportar "{{name}}"',
  '{{due}} due/{{total}} cards': '{{due}} pendientes/{{total}} tarjetas',
  '{{count}} due': '{{count}} pendientes',
  Deck: 'Mazo',
  'This deck no longer exists.': 'Este mazo ya no existe.',
  cards: 'tarjetas',
  'due now': 'pendientes ahora',
  'Review {{count}} due cards': 'Repasar {{count}} tarjetas pendientes',
  'Nothing due - study ahead': 'Nada pendiente - estudiar por adelantado',
  Cards: 'Tarjetas',
  'No cards yet - add words from Search.': 'Aún no hay tarjetas - añade palabras desde Buscar.',
  'Move "{{name}}" to...': 'Mover "{{name}}" a...',
  'Merge "{{name}}" into...': 'Fusionar "{{name}}" en...',
  'Could not discard capture': 'No se pudo descartar la captura',
  'Could not save capture': 'No se pudo guardar la captura',
  'Clipboard is empty': 'El portapapeles está vacío',
  'Copy some text first, then paste it here.': 'Copia algún texto primero y luego pégalo aquí.',
  'Could not read clipboard': 'No se pudo leer el portapapeles',
  '✨ AI enriching meanings & examples...': '✨ IA enriqueciendo significados y ejemplos...',
  'AI Enrichment Failed': 'Error en el enriquecimiento de IA',
  'Selected model is not accessible with your {{providerName}} key/project. Try selecting a different model in Settings > AI Providers.':
    'El modelo seleccionado no está accesible con tu clave/proyecto de {{providerName}}. Intenta seleccionar otro modelo en Ajustes > Proveedores de IA.',
  '{{providerName}} credit balance or quota exceeded. Please check your account plan and billing details.':
    'Saldo o cuota de {{providerName}} superados. Consulta tu plan de cuenta y datos de facturación.',
  '{{providerName}} rate limit reached. Please wait a few seconds and try again.':
    'Límite de solicitudes de {{providerName}} alcanzado. Espera unos segundos e inténtalo de nuevo.',
  'Invalid {{providerName}} API key or permission denied. Please check your key in Settings > AI Providers.':
    'Clave API de {{providerName}} no válida o permiso denegado. Revisa tu clave en Ajustes > Proveedores de IA.',
  "Couldn't reach {{providerName}} - check your device's internet connection and try again.":
    'No se pudo acceder a {{providerName}}: comprueba la conexión a Internet e inténtalo de nuevo.',
  '{{providerName}} servers are temporarily unavailable ({{status}}). Please try again shortly.':
    'Los servidores de {{providerName}} no están disponibles temporalmente ({{status}}). Inténtalo de nuevo en unos minutos.',
  'Add your OpenAI key in Settings to generate cards.':
    'Añade tu clave de OpenAI en Ajustes para generar tarjetas.',
  'Add a sentence': 'Añadir una frase',
  'Paste or type a German sentence. It joins the queue below - nothing is sent to AI until you generate.':
    'Pega o escribe una frase en alemán. Se une a la cola de abajo - nada se envía a la IA hasta que generes.',
  'Paste from clipboard': 'Pegar desde el portapapeles',
  'Adding...': 'Añadiendo...',
  'Add to queue': 'Añadir a la cola',
  'Queue is empty': 'La cola está vacía',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet - it lands here before any AI processing.':
    'Añade una frase manualmente, pega una desde el portapapeles o captura texto desde el menú compartir - llega aquí antes de cualquier procesamiento por IA.',
  '{{done}} of {{total}} generated': '{{done}} de {{total}} generadas',
  '{{count}} failed': '{{count}} fallidas',
  'see Decks.': 'ver Mazos.',
  "Review your captures. Discard what you don't need, then generate cards for the rest - no API call is wasted on text you didn't ask for.":
    'Revisa tus capturas. Descarta lo que no necesites y luego genera tarjetas para el resto - ninguna llamada a la API se desperdicia en texto que no pediste.',
  'Generate {{count}} cards with AI': 'Generar {{count}} tarjetas con IA',
  'Add your OpenAI key to generate cards': 'Añade tu clave de OpenAI para generar tarjetas',
  'Explore Full AI Flashcard': 'Explorar tarjeta de IA completa',
  'Generate Full AI Flashcard': 'Generar tarjeta de IA completa',
  'AI Insights': 'Información de la IA',
  'Getting AI insights for "{{word}}"...': 'Obteniendo información de la IA para "{{word}}"...',
  'Load more phrases with AI': 'Cargar más frases con IA',
  'Explore idioms and collocations with AI': 'Explorar modismos y colocaciones con IA',
  'Tap the sparkle above to explore idioms, expressions, and common word combinations.':
    'Toca el destello de arriba para explorar modismos, expresiones y combinaciones de palabras comunes.',
  'Could not load more info': 'No se pudo cargar más información',
  'Add your AI provider key in Settings to generate more info.':
    'Añade tu clave de proveedor de IA en Ajustes para generar más información.',
  'No additional info available yet.': 'Aún no hay información adicional disponible.',
  'Add your OpenAI key in Settings to generate examples.':
    'Añade tu clave de OpenAI en Ajustes para generar ejemplos.',
  'This word has no card yet.': 'Esta palabra aún no tiene tarjeta.',
  'Could not save your feedback': 'No se pudo guardar tu valoración',
  'Could not save your report': 'No se pudo guardar tu informe',
  'Could not change the primary meaning': 'No se pudo cambiar el significado principal',
  'Could not update the flashcard example': 'No se pudo actualizar el ejemplo de la tarjeta',
  'This word has no meaning yet.': 'Esta palabra aún no tiene significado.',
  'Could not generate an explanation': 'No se pudo generar una explicación',
  'AI not configured': 'IA no configurada',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'Añade una clave de OpenAI, Mistral, Gemini o Claude en Ajustes para generar una explicación de este significado.',
  'Could not look up an explanation': 'No se pudo buscar una explicación',
  'Could not save your changes': 'No se pudieron guardar tus cambios',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '"{{form}}" aún no está en tu biblioteca. Búscala desde la pestaña Buscar para generarla.',
  'No explanation yet.': 'Aún no hay explicación.',
  'Make primary: {{translation}}': 'Establecer como principal: {{translation}}',
  Examples: 'Ejemplos',
  'shown on flashcard': 'mostrado en la tarjeta',
  'use on flashcard': 'usar en la tarjeta',
  'Advanced grammar options': 'Opciones avanzadas de gramática',
  'Active: {{selection}}': 'Activo: {{selection}}',
  'Generate examples': 'Generar ejemplos',
  'Add your OpenAI key in Settings to generate targeted examples.':
    'Añade tu clave de OpenAI en Ajustes para generar ejemplos específicos.',
  'Meanings in this word': 'Significados de esta palabra',
  'Grammar info': 'Información gramatical',
  'Hide grammar info': 'Ocultar información gramatical',
  'chat with your AI tutor': 'chatear con tu tutor de IA',
  'Ask about "{{word}}"': 'Pregunta sobre "{{word}}"',
  'Chat with your AI tutor about this word - ask for more examples, nuance, or anything unclear.':
    'Chatea con tu tutor de IA sobre esta palabra - pide más ejemplos, matices o cualquier duda.',
  "Couldn't load the explanation.": 'No se pudo cargar la explicación.',
  "Couldn't load additional info.": 'No se pudo cargar información adicional.',
  'Nothing to chat about yet': 'Nada de qué hablar todavía',
  "This card has no meaning content yet, so there's nothing to discuss. Open it from the word's own page and try Regenerate there.":
    'Esta tarjeta aún no tiene contenido de significado, así que no hay nada que comentar. Ábrela desde la página propia de la palabra e intenta "Regenerar" allí.',
  'Give me another example': 'Dame otro ejemplo',
  "What's a synonym for this?": '¿Cuál es un sinónimo de esto?',
  'When would I use this?': '¿Cuándo usaría esto?',
  "Couldn't get a reply.": 'No se pudo obtener una respuesta.',
  'Message your AI tutor...': 'Escribe a tu tutor de IA...',
  Synonyms: 'Sinónimos',
  'Phrases & collocations': 'Frases y colocaciones',
  'Cloze card': 'Tarjeta de huecos',
  'Cloze cards': 'Tarjetas de huecos',
  'Added ✓ - add to another deck': 'Añadido ✓ - añadir a otro mazo',
  'Add to deck': 'Añadir al mazo',
  'Add "{{form}}" to...': 'Añadir "{{form}}" a...',
  'Edit this card': 'Editar esta tarjeta',
  Meaning: 'Significado',
  'Example sentence': 'Frase de ejemplo',
  'Example translation': 'Traducción del ejemplo',
  'Save changes': 'Guardar cambios',
  "What's wrong with this?": '¿Qué está mal aquí?',
  'Optional details...': 'Detalles opcionales...',
  'Send report': 'Enviar informe',
  'Sending...': 'Enviando...',
  'Inaccurate translation': 'Traducción inexacta',
  'Unnatural phrasing': 'Frase poco natural',
  'Wrong CEFR level': 'Nivel MCER incorrecto',
  'Grammar error': 'Error gramatical',
  Other: 'Otro',
  'Tense & mood': 'Tiempo y modo',
  'Sentence structure': 'Estructura de la frase',
  Conjunctions: 'Conjunciones',
  'Focus words': 'Palabras de énfasis',
  GOOD: 'BIEN',
  AGAIN: 'OTRA VEZ',
  EASY: 'FÁCIL',
  HARD: 'DIFÍCIL',
  'No card to rate.': 'No hay tarjeta que calificar.',
  'Could not save your rating': 'No se pudo guardar tu calificación',
  'No card to edit.': 'No hay tarjeta que editar.',
  'Add your AI provider key in Settings to generate an explanation.':
    'Añade tu clave de proveedor de IA en Ajustes para generar una explicación.',
  'Nothing due right now': 'Nada pendiente ahora mismo',
  'Session complete!': '¡Sesión completada!',
  'This deck has no cards due for review. Add words or check back later.':
    'Este mazo no tiene tarjetas pendientes de repaso. Añade palabras o vuelve más tarde.',
  'You reviewed {{count}} cards. Great work - come back when the next cards are due.':
    'Has repasado {{count}} tarjetas. Buen trabajo - vuelve cuando las próximas tarjetas venzan.',
  'Back to deck': 'Volver al mazo',
  'tap to reveal': 'toca para revelar',
  cloze: 'huecos',
  'Basic inline HTML works too - {{bold}}, {{italic}}, {{colored}}.':
    'El HTML en línea básico también funciona - {{bold}}, {{italic}}, {{colored}}.',
  'No stats yet': 'Aún no hay estadísticas',
  'Add and review some words to see your learning statistics here.':
    'Añade y repasa algunas palabras para ver aquí tus estadísticas de aprendizaje.',
  'remembered (30 d)': 'recordado (30 d)',
  'day streak': 'racha de días',
  'total cards': 'tarjetas totales',
  'new this week': 'nuevas esta semana',
  'Review activity': 'Actividad de repaso',
  less: 'menos',
  more: 'más',
  'Vocabulary growth': 'Crecimiento de vocabulario',
  'new words per week': 'palabras nuevas por semana',
  'Difficult words': 'Palabras difíciles',
  'No lapses yet - nothing difficult to show.': 'Aún no hay fallos - nada difícil que mostrar.',
  '{{count}} lapses': '{{count}} fallos',
  'Anki deck (.apkg)': 'Mazo de Anki (.apkg)',
  "Bring your existing decks. Review history isn't imported - cards start fresh.":
    'Trae tus mazos existentes. El historial de repaso no se importa - las tarjetas empiezan de cero.',
  'Choose .apkg file': 'Elegir archivo .apkg',
  'CSV with column mapping': 'CSV con asignación de columnas',
  'From Quizlet, Memrise, or spreadsheets.': 'Desde Quizlet, Memrise u hojas de cálculo.',
  'Choose CSV file': 'Elegir archivo CSV',
  'A shared deck (.lem)': 'Un mazo compartido (.lem)',
  "Add a deck someone shared with you - full fidelity, including review history. Doesn't touch anything else on this device.":
    'Añade un mazo que alguien compartió contigo - fidelidad total, incluido el historial de repaso. No afecta nada más en este dispositivo.',
  'Choose .lem file': 'Elegir archivo .lem',
  'Restore from Lemmory backup (.lem)': 'Restaurar desde una copia de seguridad de Lemmory (.lem)',
  'Replaces everything on this device with a previously exported backup.':
    'Reemplaza todo en este dispositivo con una copia de seguridad exportada previamente.',
  'Restoring...': 'Restaurando...',
  'Choose backup file': 'Elegir archivo de copia de seguridad',
  'Lemmory backup (.lem)': 'Copia de seguridad de Lemmory (.lem)',
  'Your full library - decks, cards, review history. Your data is always yours. API keys are never included.':
    'Toda tu biblioteca - mazos, tarjetas, historial de repaso. Tus datos siempre son tuyos. Las claves API nunca se incluyen.',
  'Export everything': 'Exportar todo',
  'One row per card - the same columns CSV import reads, so this file re-imports as-is.':
    'Una fila por tarjeta - las mismas columnas que lee la importación CSV, así que este archivo se reimporta tal cual.',
  'Export as CSV': 'Exportar como CSV',
  "Study your Lemmory vocabulary in Anki/AnkiDroid. Cards start fresh - review history isn't carried over.":
    'Estudia tu vocabulario de Lemmory en Anki/AnkiDroid. Las tarjetas empiezan de cero - el historial de repaso no se transfiere.',
  'Export as .apkg': 'Exportar como .apkg',
  'A readable word - meaning - example list. Not meant to re-import.':
    'Una lista legible de palabra - significado - ejemplo. No pensada para reimportarse.',
  'Export as Markdown': 'Exportar como Markdown',
  'Backup ready': 'Copia de seguridad lista',
  'Restore from backup?': '¿Restaurar desde la copia de seguridad?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'Esto reemplaza todo lo que hay actualmente en este dispositivo con el contenido de "{{fileName}}" (exportado el {{date}}). Esta acción no se puede deshacer.',
  Restore: 'Restaurar',
  'Restore complete': 'Restauración completada',
  'Restored {{count}} rows.': '{{count}} filas restauradas.',
  'Restore failed': 'Error al restaurar',
  'Invalid backup file': 'Archivo de copia de seguridad no válido',
  'Could not read file': 'No se pudo leer el archivo',
  Preview: 'Vista previa',
  'Will import': 'Se importará',
  Duplicates: 'Duplicados',
  Errors: 'Errores',
  Selected: 'Seleccionadas',
  'Import {{count}} rows': 'Importar {{count}} filas',
  'Import {{count}} words': 'Importar {{count}} palabras',
  'Import from CSV': 'Importar desde CSV',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Desde Quizlet, Memrise o una exportación de hoja de cálculo. A continuación elegirás qué significa cada columna.',
  '{{count}} rows detected. Map each column below.':
    '{{count}} filas detectadas. Asigna cada columna abajo.',
  'Sample data': 'Datos de ejemplo',
  'The first few rows, so you can see what each column actually holds.':
    'Las primeras filas, para que veas qué contiene realmente cada columna.',
  'Column {{n}}': 'Columna {{n}}',
  'Field mapping': 'Asignación de campos',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes - they're derived from the example's cloze markup and its translation.":
    'Todo es opcional. Deja Palabra/Significado sin asignar para notas tipo hueco - se derivan del marcado de huecos del ejemplo y su traducción.',
  None: 'Ninguna',
  'Import into deck': 'Importar al mazo',
  '+ New deck': '+ Nuevo mazo',
  'If the word already exists': 'Si la palabra ya existe',
  'Applies to every duplicate row you leave checked in the next step.':
    'Se aplica a cada fila duplicada que dejes marcada en el siguiente paso.',
  'Checking...': 'Comprobando...',
  'Preview import': 'Vista previa de importación',
  'Importing...': 'Importando...',
  'Import complete': 'Importación completada',
  'Imported {{count}} words.': '{{count}} palabras importadas.',
  Imported: 'Importadas',
  Skipped: 'Omitidas',
  Failed: 'Fallidas',
  'Import another file': 'Importar otro archivo',
  'Could not read this file': 'No se pudo leer este archivo',
  'Import failed': 'Error al importar',
  'This file has no rows to import.': 'Este archivo no tiene filas para importar.',
  Word: 'Palabra',
  Example: 'Ejemplo',
  Status: 'Estado',
  Issues: 'Problemas',
  Skip: 'Omitir',
  "Don't touch the existing word.": 'No tocar la palabra existente.',
  Merge: 'Fusionar',
  'Add this as another meaning on the existing card.':
    'Añadir esto como otro significado en la tarjeta existente.',
  'Keep both': 'Mantener ambas',
  'Add a second, separate card for the same word.':
    'Añadir una segunda tarjeta separada para la misma palabra.',
  'Import from Anki': 'Importar desde Anki',
  "Choose a `.apkg` export. Review history isn't imported - every card starts fresh - and media (audio/images) is stripped rather than copied.":
    'Elige una exportación `.apkg`. El historial de repaso no se importa - cada tarjeta empieza de cero - y los medios (audio/imágenes) se eliminan en lugar de copiarse.',
  '{{notes}} notes across {{decks}} decks. Map each field below - it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{notes}} notas en {{decks}} mazos. Asigna cada campo abajo - se aplica a cada nota, un tipo de nota sin tantos campos simplemente lo deja vacío.',
  'The first few notes, so you can see what each field actually holds.':
    'Las primeras notas, para que veas qué contiene realmente cada campo.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes - they're derived from the example's cloze markup and its translation.":
    'Todo es opcional. Deja Palabra/Significado sin asignar para notas de huecos - se derivan del marcado de huecos del ejemplo y su traducción.',
  'Field {{n}}': 'Campo {{n}}',
  'This collection has no notes to import.': 'Esta colección no tiene notas para importar.',
  'Could not read this collection': 'No se pudo leer esta colección',
  '{{done}} of {{total}} notes': '{{done}} de {{total}} notas',
  'Import canceled': 'Importación cancelada',
  'The rest were left untouched - you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'El resto se dejó sin cambios - puedes volver a importar el mismo archivo para continuar donde lo dejaste (las palabras ya importadas se omiten como duplicados).',
  Tags: 'Etiquetas',
  'Import from a .lem file': 'Importar desde un archivo .lem',
  'Choose a Lemmory `.lem` file - a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    'Elige un archivo Lemmory `.lem` - un mazo que alguien compartió contigo, o una de tus propias exportaciones de mazo. Fidelidad total: significados, ejemplos, sinónimos, tarjetas de huecos, historial de repaso y programación FSRS se transfieren todos.',
  'This file has more than one deck. Which one do you want to import?':
    'Este archivo tiene más de un mazo. ¿Cuál quieres importar?',
  'This file has no decks to import.': 'Este archivo no tiene mazos para importar.',
  'Importing "{{name}}" ({{count}} cards).': 'Importando "{{name}}" ({{count}} tarjetas).',
  "Don't touch the word already in your library.":
    'No tocar la palabra ya presente en tu biblioteca.',
  'Imported {{words}} words ({{cards}} cards).':
    '{{words}} palabras importadas ({{cards}} tarjetas).',
  Vocabulary: 'Vocabulario',
  Cloze: 'Huecos',
  '+ New': '+ Nuevo',
  Front: 'Anverso',
  'actual review card size on this device':
    'tamaño real de la tarjeta de repaso en este dispositivo',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'Renderizado con una frase de huecos de ejemplo mediante el mismo motor que usa la sesión de repaso.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'Renderizado con datos de ejemplo ("ausgehen") mediante el mismo motor que usa la sesión de repaso.',
  'Template name': 'Nombre de la plantilla',
  Fields: 'Campos',
  'Tap "Front" or "Back" to show a field on that side - a field can appear on both, or neither.':
    'Toca "Anverso" o "Reverso" para mostrar un campo en ese lado - un campo puede aparecer en ambos, o en ninguno.',
  'Layout & style': 'Diseño y estilo',
  'Reset to default': 'Restablecer por defecto',
  'Accent color': 'Color de acento',
  'Stored as a': 'Guardado como una',
  'rule - reference it in your CSS below as': 'regla - referénciala en tu CSS abajo como',
  'Applied to both sides in the real WebView renderer.':
    'Aplicado a ambos lados en el renderizador WebView real.',
  'Front (Liquid)': 'Anverso (Liquid)',
  'Back (Liquid)': 'Reverso (Liquid)',
  'Available template variables': 'Variables de plantilla disponibles',
  'Conditional example': 'Ejemplo condicional',
  'Set default': 'Establecer por defecto',
  'Deleting...': 'Eliminando...',
  'Delete this template?': '¿Eliminar esta plantilla?',
  '"{{name}}" will be removed.': '"{{name}}" se eliminará.',
  'Create template': 'Crear plantilla',
  'Template editor help': 'Ayuda del editor de plantillas',
  'Fields tab': 'Pestaña Campos',
  'Style tab': 'Pestaña Estilo',
  'Preview tab': 'Pestaña Vista previa',
  'Code tab': 'Pestaña Código',
  'HTML & CSS without extra elements': 'HTML y CSS sin elementos adicionales',
  'Could not save template': 'No se pudo guardar la plantilla',
  'Could not set default template': 'No se pudo establecer la plantilla por defecto',
  'Could not delete template': 'No se pudo eliminar la plantilla',
  'New template': 'Nueva plantilla',
  'Reset to default layout & style?': '¿Restablecer diseño y estilo por defecto?',
  'This replaces the front, back, and CSS in the editor - tap "Save changes" to keep it. Unsaved edits are lost.':
    'Esto reemplaza el anverso, el reverso y el CSS en el editor - toca "Guardar cambios" para conservarlo. Las ediciones no guardadas se pierden.',
  Reset: 'Restablecer',
  'Speaking rate': 'Velocidad de habla',
  Pitch: 'Tono',
  'Voice (German)': 'Voz (alemán)',
  'No German voices are installed on this device.':
    'No hay voces en alemán instaladas en este dispositivo.',
  'Device default': 'Predeterminado del dispositivo',
  Enhanced: 'Mejorada',
  "Voices come from the device's own text-to-speech engine - install more from your phone's system settings if you don't see the one you want.":
    'Las voces provienen del motor de texto a voz del propio dispositivo - instala más desde los ajustes del sistema de tu teléfono si no ves la que quieres.',
  'Playing...': 'Reproduciendo...',
  Test: 'Probar',
  'Could not install this chunk': 'No se pudo instalar este fragmento',
  'Could not remove this chunk': 'No se pudo eliminar este fragmento',
  'Local Dictionaries installed': 'Diccionarios locales instalados',
  'Installed {{count}} new chunks.': '{{count}} fragmentos nuevos instalados.',
  'Could not install local dictionaries': 'No se pudieron instalar los diccionarios locales',
  '{{language}}-English Dictionary': 'Diccionario {{language}}-inglés',
  '{{installed}} installed · {{available}} available to install':
    '{{installed}} instalados · {{available}} disponibles para instalar',
  'Install all available': 'Instalar todo lo disponible',
  Chunks: 'Fragmentos',
  'Words {{start}}-{{end}}': 'Palabras {{start}}-{{end}}',
  '{{count}} words': '{{count}} palabras',
  'Uninstall all': 'Desinstalar todo',
  'Uninstalling...': 'Desinstalando...',
  'Local Dictionaries uninstalled': 'Diccionarios locales desinstalados',
  'Removed {{count}} chunks.': '{{count}} fragmentos eliminados.',
  'Could not uninstall local dictionaries': 'No se pudieron desinstalar los diccionarios locales',
  'Uninstall all local dictionaries?': '¿Desinstalar todos los diccionarios locales?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'Elimina cada fragmento instalado de este dispositivo. Las tarjetas que ya añadiste a tu mazo no se ven afectadas.',
  'No translation to add.': 'No hay traducción para añadir.',
  'No dictionary entry to add.': 'No hay entrada de diccionario para añadir.',
  Details: 'Detalles',
  'More info': 'Más información',
  'Hide details': 'Ocultar detalles',
  'Context & Practical Usage': 'Contexto y uso práctico',
  'Understanding the {{language}} {{wordClass}} "{{headword}}"':
    'Entendiendo el {{wordClass}} {{language}} "{{headword}}"',
  Usage: 'Uso',
  'Examples of Usage': 'Ejemplos de uso',
  Noun: 'Sustantivo',
  Verb: 'Verbo',
  Adjective: 'Adjetivo',
  Adverb: 'Adverbio',
  Preposition: 'Preposición',
  Conjunction: 'Conjunción',
  Pronoun: 'Pronombre',
  Article: 'Artículo',
  Phrase: 'Frase',
  Connected: 'Conectado',
  'No internet connection': 'Sin conexión a Internet',
  'DeepL validation failed': 'Error de verificación de DeepL',
  '{{provider}} validation failed': 'Error de verificación de {{provider}}',
  'Delete all API keys?': '¿Eliminar todas las claves API?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'Esto elimina todas las claves de proveedor de este dispositivo. El vocabulario y el progreso no se ven afectados.',
  'Limited mode': 'Modo limitado',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    'Sin una clave de generación, la creación de tarjetas con IA está desactivada. La traducción y las tarjetas manuales siguen funcionando. Añade una clave a uno de los proveedores de abajo para la experiencia completa.',
  "Couldn't load saved settings": 'No se pudieron cargar los ajustes guardados',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key - nothing is sent until you generate a card.':
    'La generación de tarjetas (significados, ejemplos, grupos, frases, huecos) usa el proveedor de abajo que esté configurado y activado. Trae tu propia clave API - nada se envía hasta que generes una tarjeta.',
  'Active provider': 'Proveedor activo',
  Model: 'Modelo',
  'Paste your {{provider}} API key...': 'Pega tu clave API de {{provider}}...',
  'Hide {{provider}} API key': 'Ocultar clave API de {{provider}}',
  'Show {{provider}} API key': 'Mostrar clave API de {{provider}}',
  'Validate key': 'Verificar clave',
  Clear: 'Borrar',
  'Device-observed usage': 'Uso observado en el dispositivo',
  '{{count}} requests': '{{count}} solicitudes',
  'Open {{provider}} usage ↗': 'Abrir uso de {{provider}} ↗',
  'Free tier, no key needed': 'Nivel gratuito, sin clave necesaria',
  'Uses this provider\'s key above': 'Usa la clave de este proveedor de arriba',
  'Add a key above to enable': 'Añade una clave arriba para activar',
  Active: 'Activo',
  'Best German↔English quality - bring your own key':
    'Mejor calidad alemán↔inglés - trae tu propia clave',
  'Hide DeepL settings': 'Ocultar ajustes de DeepL',
  'Show DeepL settings': 'Mostrar ajustes de DeepL',
  'Paste your DeepL API key...': 'Pega tu clave API de DeepL...',
  Enabled: 'Activado',
  'Open DeepL usage ↗': 'Abrir uso de DeepL ↗',
  'v0.0.1 · offline-first · your data stays on device':
    'v0.0.1 · sin conexión por defecto · tus datos permanecen en el dispositivo',
  'Delete this card?': '¿Eliminar esta tarjeta?',
  'This permanently deletes this card and all its meanings, examples, synonyms, phrases, and cloze variations. This cannot be undone.':
    'Esto elimina permanentemente esta tarjeta y todos sus significados, ejemplos, sinónimos, frases y variaciones de huecos. Esto no se puede deshacer.',
  'Could not delete this card': 'No se pudo eliminar esta tarjeta',
  'Semantic Contexts': 'Contextos semánticos',
  '{{count}} contexts': '{{count}} contextos',
  'Opening your vocabulary...': 'Abriendo tu vocabulario...',
  'Import & Export': 'Importar y exportar',
  'Import CSV': 'Importar CSV',
  'Import Anki deck': 'Importar mazo de Anki',
  'Card Templates': 'Plantillas de tarjetas',
  '"Add to deck" at the bottom is how you start reviewing this word - you can add it to more than one deck, or create a new one on the spot.':
    '"Añadir a mazo" en la parte inferior es cómo empiezas a repasar esta palabra: puedes añadirla a más de un mazo o crear uno nuevo al instante.',
  '"Ask AI" opens a small chat where you can type a follow-up question about this specific word.':
    '"Preguntar a la IA" abre un pequeño chat donde puedes escribir una pregunta de seguimiento sobre esta palabra en concreto.',
  '"Explain" (or "More info" on an AI-generated card) shows or expands a direct explanation of what the word means and where or why it\'s used.':
    '"Explicar" (o "Más info" en una tarjeta generada por IA) muestra o amplía una explicación directa de qué significa la palabra y dónde o por qué se usa.',
  '"Follow device" just matches whatever language your phone is already set to.':
    '"Seguir al dispositivo" simplemente usa el idioma que ya tiene configurado tu teléfono.',
  '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.':
    '"Generar con IA" crea una tarjeta explicativa completa con significados, ejemplos, gramática y más, usando el proveedor de IA que hayas configurado en Ajustes.',
  'The "AI Insights" preview gives a short, direct explanation of what the word means and where or why it\'s used - tap it any time to generate the full flashcard.':
    'La vista previa "Información de IA" ofrece una explicación breve y directa de qué significa la palabra y dónde o por qué se usa - tócala en cualquier momento para generar la tarjeta completa.',
  "\"Regenerate\" throws away this card's meanings, examples, synonyms, phrases, and cloze cards, and generates all of it fresh - useful if the current version isn't working for you. This can't be undone.":
    '"Regenerar" descarta los significados, ejemplos, sinónimos, frases y tarjetas de huecos de esta tarjeta, y genera todo de nuevo desde cero; útil si la versión actual no te está funcionando. Esto no se puede deshacer.',
  '"Test active engine" plays the Test phrase through whichever engine is marked Active - the same thing any real speaker button in the app does.':
    '"Probar motor activo" reproduce la frase de prueba con el motor marcado como Activo, justo lo mismo que hace cualquier botón de altavoz real de la app.',
  'A cloze card blanks out part of a sentence for you to fill in - a different way of practicing the same word.':
    'Una tarjeta de huecos oculta parte de una frase para que la completes: otra forma de practicar la misma palabra.',
  'A green checkmark means the word is already in one of your decks.':
    'Una marca verde significa que la palabra ya está en uno de tus mazos.',
  'A short summary': 'Un resumen breve',
  'AI Providers': 'Proveedores de IA',
  'AI-generated - explanations can be inaccurate. Check important details against a trusted reference.':
    'Generado por IA: las explicaciones pueden ser inexactas. Comprueba los detalles importantes con una fuente de confianza.',
  'On an AI-generated card, the short explanation right below the translation states directly what the word means and where or why it\'s used - not a hint to figure out yourself.':
    'En una tarjeta generada por IA, la breve explicación justo debajo de la traducción indica directamente qué significa la palabra y dónde o por qué se usa - no es una pista para que la adivines tú.',
  'Accent color swatches write a custom property at the top of your CSS:':
    'Las muestras de color de acento escriben una propiedad personalizada al principio de tu CSS:',
  'Add "{{term}}" to...': 'Añadir "{{term}}" a...',
  'Add a key in AI Providers to enable': 'Añade una clave en Proveedores de IA para activarlo',
  'Add a sentence by typing it, pasting it from your clipboard, or sharing text here from another app.':
    'Añade una frase escribiéndola, pegándola desde el portapapeles o compartiendo texto aquí desde otra app.',
  'Add card': 'Añadir tarjeta',
  'Add card manually': 'Añadir tarjeta manualmente',
  'Add to Lemmory': 'Añadir a Lemmory',
  'Add to Mining queue': 'Añadir a la cola de captura',
  'Add your AI provider key in Settings to ask a follow-up.':
    'Añade tu clave de proveedor de IA en Ajustes para hacer una pregunta de seguimiento.',
  'Add your AI provider key in Settings to regenerate this card.':
    'Añade tu clave de proveedor de IA en Ajustes para regenerar esta tarjeta.',
  'Adding from other apps': 'Añadir desde otras apps',
  'Adding to a deck': 'Añadir a un mazo',
  'All caught up - nothing due right now.': 'Todo al día: no hay nada pendiente por ahora.',
  'Alternatively, generate a new key from a project that already has it enabled (or the "Default project" if you have one).':
    'También puedes generar una clave nueva desde un proyecto que ya lo tenga habilitado (o el "Proyecto predeterminado" si tienes uno).',
  'Always open Search, split between Search and the Mining queue depending on how much text it is, or ask you every time.':
    'Abrir siempre Buscar, repartir entre Buscar y la cola de captura según la cantidad de texto, o preguntarte cada vez.',
  Answer: 'Respuesta',
  'App version, platform, and feature tier - helps reproduce a bug.':
    'Versión de la app, plataforma y nivel de funciones: ayuda a reproducir un error.',
  'App {{version}} · {{platform}} · {{tier}}': 'App {{version}} · {{platform}} · {{tier}}',
  'Applies across the app.': 'Se aplica en toda la app.',
  Ask: 'Preguntar',
  'Ask AI': 'Preguntar a la IA',
  'Ask a follow-up question, maximum {{max}} characters':
    'Haz una pregunta de seguimiento, máximo {{max}} caracteres',
  'Ask a short follow-up...': 'Haz una pregunta breve de seguimiento...',
  'Asking...': 'Preguntando...',
  'At most every': 'Como máximo cada',
  'Audio Settings': 'Ajustes de audio',
  'Audio Settings help': 'Ayuda de Ajustes de audio',
  'Audio settings, app language': 'Ajustes de audio, idioma de la app',
  'Aura-2. Once your key is entered, choose from Deepgram\'s available models, or switch to manual entry to enter a model name directly (see Deepgram\'s docs for exact names).':
    'Aura-2. Una vez introducida tu clave, elige entre los modelos disponibles de Deepgram, o cambia a entrada manual para escribir el nombre de un modelo directamente (consulta la documentación de Deepgram para los nombres exactos).',
  'Automatic sync': 'Sincronización automática',
  CSS: 'CSS',
  CSV: 'CSV',
  'Choose a voice...': 'Elige una voz...',
  'Choose from your {{provider}} voices instead':
    'Elige entre tus voces de {{provider}} en su lugar',
  'Choosing what to keep': 'Elegir qué conservar',
  'Cloud providers are bring-your-own-key - nothing is sent to them until you tap a speaker icon or press Test.':
    'Los proveedores en la nube requieren tu propia clave: no se les envía nada hasta que tocas un icono de altavoz o pulsas Probar.',
  'Comma-separated': 'Separado por comas',
  'Could not add card': 'No se pudo añadir la tarjeta',
  'Could not create deck': 'No se pudo crear el mazo',
  'Could not generate an example': 'No se pudo generar un ejemplo',
  'Could not get an answer': 'No se pudo obtener una respuesta',
  'Could not regenerate this card': 'No se pudo regenerar esta tarjeta',
  'Could not remove card': 'No se pudo eliminar la tarjeta',
  'Could not reset progress': 'No se pudo restablecer el progreso',
  'Could not sign in': 'No se pudo iniciar sesión',
  Create: 'Crear',
  'Create & select': 'Crear y seleccionar',
  'Create new deck': 'Crear mazo nuevo',
  'Creating a GitHub issue needs a token with write access to the repo - that can never ship inside the app, since a compiled build can be decompiled and any embedded secret treated as public.':
    'Crear una incidencia en GitHub requiere un token con acceso de escritura al repositorio; eso nunca puede incluirse en la app, ya que una compilación puede descompilarse y cualquier secreto incrustado se trataría como público.',
  Deepgram: 'Deepgram',
  'Default: {{voice}}': 'Predeterminada: {{voice}}',
  'Delete All AI Providers Keys': 'Eliminar todas las claves de proveedores de IA',
  'Delete all AI provider keys?': '¿Eliminar todas las claves de proveedores de IA?',
  'Depending on a setting in Settings, under "Share & Search," a shared sentence might land here right away, or you might get asked what to do with it first.':
    'Según un ajuste en Ajustes, dentro de "Compartir y buscar", una frase compartida puede aparecer aquí de inmediato, o puede que primero te pregunten qué hacer con ella.',
  'Device (built-in)': 'Dispositivo (integrado)',
  'Display on Flashcard': 'Mostrar en la tarjeta',
  'Each provider\'s own "Test this provider" button plays through that card\'s current key/voice/speed directly, regardless of which engine is Active - use it to check a setup before switching to it.':
    'El botón "Probar este proveedor" de cada proveedor reproduce directamente con la clave/voz/velocidad actuales de esa tarjeta, sin importar qué motor esté Activo; úsalo para comprobar una configuración antes de cambiarte a ella.',
  'Each row is one piece of card data. Tap "Front" or "Back" to show that field on that side - a field can appear on both, on neither, or on just one.':
    'Cada fila es un dato de la tarjeta. Toca "Anverso" o "Reverso" para mostrar ese campo en ese lado; un campo puede aparecer en ambos, en ninguno o solo en uno.',
  ElevenLabs: 'ElevenLabs',
  'Email (Optional)': 'Correo electrónico (opcional)',
  'Enter the word first.': 'Introduce primero la palabra.',
  'Every card in "{{name}}" goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    'Todas las tarjetas de "{{name}}" vuelven a "nueva": tanto el repaso de palabra-significado como la práctica de huecos empiezan de cero. Tu historial de repasos se conserva. Esto no se puede deshacer.',
  'Every card in this deck goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    'Todas las tarjetas de este mazo vuelven a "nueva": tanto el repaso de palabra-significado como la práctica de huecos empiezan de cero. Tu historial de repasos se conserva. Esto no se puede deshacer.',
  'Every speaker button in the app uses whichever engine is marked Active below.':
    'Todos los botones de altavoz de la app usan el motor marcado como Activo abajo.',
  'Everything in the queue is selected by default. Tap a card to include or leave it out, or use the trash icon to remove it for good.':
    'Todo lo de la cola está seleccionado por defecto. Toca una tarjeta para incluirla o dejarla fuera, o usa el icono de papelera para eliminarla definitivamente.',
  'Everything renders inside a real WebView, so standard CSS applies as on any web page - flexbox, custom fonts via @font-face, transitions, etc. all work; there is no special "app CSS" subset to learn beyond this.':
    'Todo se renderiza dentro de un WebView real, así que el CSS estándar se aplica como en cualquier página web: flexbox, fuentes personalizadas con @font-face, transiciones, etc., todo funciona; no hay un subconjunto especial de "CSS de la app" que aprender más allá de esto.',
  'Example sentences': 'Frases de ejemplo',
  'Example sentences show the word used in context, with a translation underneath.':
    'Las frases de ejemplo muestran la palabra usada en contexto, con una traducción debajo.',
  'Examples generated from a selected option get a highlighted background, so you can tell which ones came from your request.':
    'Los ejemplos generados a partir de una opción seleccionada tienen un fondo resaltado, para que sepas cuáles vinieron de tu solicitud.',
  'Explain, Ask AI & more': 'Explicar, Preguntar a la IA y más',
  'Explanations and the "More info" follow-up use this language.':
    'Las explicaciones y el seguimiento "Más info" usan este idioma.',
  'Exporting...': 'Exportando...',
  Expression: 'Expresión',
  'Fields added via the toggles are never auto-wrapped in a <div> or <span> - {{ word }} renders as bare text directly inside the card body. That keeps generated templates minimal, but it means a rule like ".word { ... }" has nothing to match unless you add that class yourself.':
    'Los campos añadidos mediante los interruptores nunca se envuelven automáticamente en un <div> o <span>: {{ word }} se renderiza como texto suelto directamente dentro del cuerpo de la tarjeta. Eso mantiene las plantillas generadas mínimas, pero significa que una regla como ".word { ... }" no tiene nada que coincidir a menos que añadas tú mismo esa clase.',
  "Found a sentence somewhere else, like an article or a message? Share it to Lemmory the same way you'd share it to any other app.":
    '¿Encontraste una frase en otro sitio, como un artículo o un mensaje? Compártela con Lemmory igual que la compartirías con cualquier otra app.',
  'Front and Back are raw Liquid templates - anything valid Liquid works here, not just what the Fields toggles generate.':
    'Anverso y Reverso son plantillas Liquid en bruto: aquí funciona cualquier Liquid válido, no solo lo que generan los interruptores de Campos.',
  "Front and Back are separate - the chip above the card switches which side is rendered, so you always know exactly which side you're looking at.":
    'Anverso y Reverso son independientes: el chip encima de la tarjeta cambia qué lado se renderiza, así siempre sabes exactamente qué lado estás viendo.',
  Full: 'Completo',
  Gender: 'Género',
  General: 'General',
  'General settings help': 'Ayuda de Ajustes generales',
  'Generated with AI - not from your installed dictionary.':
    'Generado con IA, no proviene de tu diccionario instalado.',
  'Generating your card...': 'Generando tu tarjeta...',
  'Generation came back incomplete - nothing was changed. Try again.':
    'La generación volvió incompleta; no se cambió nada. Inténtalo de nuevo.',
  'Go to platform.openai.com > Settings > Projects > select the project this key belongs to > Models > enable gpt-4o-mini-tts for that project.':
    'Ve a platform.openai.com > Settings > Projects > selecciona el proyecto al que pertenece esta clave > Models > activa gpt-4o-mini-tts para ese proyecto.',
  'Google Translate': 'Google Translate',
  'Hide DeepL API key': 'Ocultar clave de API de DeepL',
  Hindi: 'Hindi',
  'How Audio Settings works': 'Cómo funcionan los ajustes de audio',
  'I speak': 'Hablo',
  "I'm learning": 'Estoy aprendiendo',
  'If Validate says a project doesn\'t have access to gpt-4o-mini-tts, but the model works fine on platform.openai.com, your API key is scoped to a specific OpenAI Project that hasn\'t enabled it.':
    'Si Validar dice que un proyecto no tiene acceso a gpt-4o-mini-tts, pero el modelo funciona bien en platform.openai.com, tu clave de API está limitada a un proyecto de OpenAI específico que no lo ha habilitado.',
  'If a cloud key is invalid, the provider is unreachable, or a request fails, playback falls back to the device voice automatically - you\'re never left with silence.':
    'Si una clave en la nube no es válida, el proveedor no está disponible o una solicitud falla, la reproducción vuelve automáticamente a la voz del dispositivo; nunca te quedas sin sonido.',
  "If a word isn't in your library yet, you may see a quick built-in dictionary entry and/or a translation preview - both are read-only until you choose to add one to a deck.":
    'Si una palabra aún no está en tu biblioteca, puede que veas una entrada rápida del diccionario integrado y/o una vista previa de traducción; ambas son de solo lectura hasta que elijas añadir una a un mazo.',
  'If no model is picked, a default is chosen to match whatever language is set under Settings > Learning > "I\'m learning" (English, German, Spanish, or French) - other languages fall back to an English voice until you pick one manually.':
    'Si no eliges un modelo, se selecciona uno predeterminado según el idioma configurado en Ajustes > Aprendizaje > "Estoy aprendiendo" (inglés, alemán, español o francés); otros idiomas usan una voz en inglés hasta que elijas una manualmente.',
  'If no voice is picked, a known-good multilingual default voice is used automatically.':
    'Si no eliges una voz, se usa automáticamente una voz multilingüe predeterminada de calidad conocida.',
  'If this word has more than one distinct sense - say, a casual meaning and a business one - you\'ll see small labeled capsules (like "social" or "formal") just above the translation. Tap one to switch; each keeps its own examples and synonyms.':
    'Si esta palabra tiene más de un sentido distinto (por ejemplo, un significado informal y otro empresarial), verás pequeñas cápsulas etiquetadas (como "social" o "formal") justo encima de la traducción. Toca una para cambiar; cada una conserva sus propios ejemplos y sinónimos.',
  'Import & export, templates, local dictionaries':
    'Importar y exportar, plantillas, diccionarios locales',
  'Include diagnostics': 'Incluir diagnóstico',
  'Inflected or conjugated forms work too, not just the base/dictionary form of a word.':
    'Las formas flexionadas o conjugadas también funcionan, no solo la forma base o de diccionario de una palabra.',
  'Install more voices from your phone\'s system settings if the one you want isn\'t listed.':
    'Instala más voces desde los ajustes del sistema de tu teléfono si la que buscas no aparece en la lista.',
  'Installing...': 'Instalando...',
  'Key validated': 'Clave validada',
  'Last synced: {{when}}': 'Última sincronización: {{when}}',
  'List fields (Other meanings, Synonyms, Related phrases) already need a {% for %} loop to render at all - that loop is structurally required, not a styling choice. To style each item individually, wrap the item inside the loop:':
    'Los campos de lista (Otros significados, Sinónimos, Frases relacionadas) ya necesitan un bucle {% for %} para renderizarse; ese bucle es estructuralmente necesario, no una opción de estilo. Para dar estilo a cada elemento individualmente, envuelve el elemento dentro del bucle:',
  'Long-press a word in any app and pick "Search in Lemmory" to look it up here right away.':
    'Mantén pulsada una palabra en cualquier app y elige "Buscar en Lemmory" para consultarla aquí al instante.',
  'Long-press a word in any app - your browser, messages, anywhere - and pick "Search in Lemmory." It opens right here with that word ready to go.':
    'Mantén pulsada una palabra en cualquier app (tu navegador, mensajes, donde sea) y elige "Buscar en Lemmory". Se abre aquí mismo con esa palabra lista para consultar.',
  Markdown: 'Markdown',
  Message: 'Mensaje',
  'Mine help': 'Ayuda de Capturas',
  'Mine is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    'Capturas es un área de espera para frases que quieres convertir en tarjetas de vocabulario más tarde; nada aquí ocurre automáticamente.',
  Never: 'Nunca',
  'Never included: word content, translations, AI responses, or API keys.':
    'Nunca se incluye: contenido de palabras, traducciones, respuestas de IA ni claves de API.',
  'New deck name': 'Nombre del mazo nuevo',
  'New words are looked up and generated in this language.':
    'Las palabras nuevas se buscan y generan en este idioma.',
  'No AI provider active - open Settings': 'Ningún proveedor de IA activo: abre Ajustes',
  'No AI provider is active - add and enable one in Settings to generate new words':
    'No hay ningún proveedor de IA activo: añade y activa uno en Ajustes para generar palabras nuevas',
  'No AI provider is active - add and enable one to generate targeted examples.':
    'No hay ningún proveedor de IA activo: añade y activa uno para generar ejemplos dirigidos.',
  'No AI provider is active.': 'No hay ningún proveedor de IA activo.',
  'No AI provider is active. Add and enable one in Settings to generate cards.':
    'No hay ningún proveedor de IA activo. Añade y activa uno en Ajustes para generar tarjetas.',
  'No AI provider is active. Add and enable one in Settings to generate examples.':
    'No hay ningún proveedor de IA activo. Añade y activa uno en Ajustes para generar ejemplos.',
  'No AI provider is active. Add and enable one in Settings to generate words.':
    'No hay ningún proveedor de IA activo. Añade y activa uno en Ajustes para generar palabras.',
  'No decks yet - create one above.': 'Aún no hay mazos: crea uno arriba.',
  'No provider configured - AI generation disabled':
    'Ningún proveedor configurado: generación con IA desactivada',
  'No settings match "{{query}}"': 'Ningún ajuste coincide con "{{query}}"',
  'No {{language}} voices are installed on this device.':
    'No hay voces de {{language}} instaladas en este dispositivo.',
  Normal: 'Normal',
  'Not supported yet': 'Aún no compatible',
  'Match your native language too?': '¿Ajustar también tu idioma nativo?',
  'You just set the app language to {{language}}. Also set "I speak" to match?':
    'Acabas de establecer el idioma de la app en {{language}}. ¿Establecer también "Hablo" para que coincida?',
  'Match the app language too?': '¿Ajustar también el idioma de la app?',
  'You just set "I speak" to {{language}}. Switch the app\'s own language to match?':
    'Acabas de establecer "Hablo" en {{language}}. ¿Cambiar también el idioma de la app para que coincida?',
  'Yes, switch it': 'Sí, cambiarlo',
  'No, keep it': 'No, mantenerlo',
  'Nothing to add.': 'No hay nada que añadir.',
  'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.':
    'Solo la versión de la app, la plataforma y tu nivel de funciones actual (Completo o Solo traducción); lo justo para ayudar a reproducir un error.',
  'Only bother with this if you want to be selective - otherwise everything gets turned into cards together.':
    'Solo te hace falta esto si quieres ser selectivo; si no, todo se convierte en tarjetas junto.',
  'Only if you want a reply - also becomes public once posted.':
    'Solo si quieres una respuesta; también se hace público en cuanto se publica.',
  'Open Settings': 'Abrir Ajustes',
  OpenAI: 'OpenAI',
  'Or enter an ID manually': 'O introduce un ID manualmente',
  'Phrases show this word used in common expressions or word combinations.':
    'Las frases muestran esta palabra usada en expresiones comunes o combinaciones de palabras.',
  'Pick a look for the whole app, from bright to dark and everything between.':
    'Elige un aspecto para toda la app, desde claro hasta oscuro y todo lo intermedio.',
  'Picking a swatch again (or none) removes the line - it never conflicts with CSS you write by hand elsewhere in the box.':
    'Volver a elegir una muestra (o ninguna) elimina la línea; nunca entra en conflicto con el CSS que escribas a mano en otra parte del cuadro.',
  "Please don't include anything private in your message.":
    'Por favor, no incluyas nada privado en tu mensaje.',
  'Practice reverse': 'Practicar al revés',
  'Practice words': 'Practicar palabras',
  'Practice {{count}} cloze': 'Practicar {{count}} huecos',
  'Reference it anywhere in your own CSS rules, e.g.:':
    'Haz referencia a ella en cualquier parte de tus propias reglas CSS, por ejemplo:',
  Regenerate: 'Regenerar',
  'Regenerate this card?': '¿Regenerar esta tarjeta?',
  Remove: 'Eliminar',
  'Remove {{count}}': 'Eliminar {{count}}',
  'Remove {{count}} cards from this deck?': '¿Eliminar {{count}} tarjetas de este mazo?',
  'Removing...': 'Eliminando...',
  'Rendering goes through the exact same LiquidJS + WebView pipeline the review session uses, with one fixed sample word ("ausgehen") standing in for your real vocabulary.':
    'El renderizado pasa por exactamente el mismo proceso de LiquidJS + WebView que usa la sesión de repaso, con una palabra de ejemplo fija ("ausgehen") representando tu vocabulario real.',
  'Report an issue or request a feature': 'Reportar un problema o solicitar una función',
  'Reset progress': 'Restablecer progreso',
  'Reset progress?': '¿Restablecer progreso?',
  'Reset to default?': '¿Restablecer a los valores predeterminados?',
  'Resetting...': 'Restableciendo...',
  "Review your captures. Discard what you don't need, then generate cards for the rest.":
    'Revisa tus capturas. Descarta lo que no necesites y luego genera tarjetas para el resto.',
  'Review {{count}} words': 'Repasar {{count}} palabras',
  'Saving...': 'Guardando...',
  'Search from anywhere': 'Buscar desde cualquier lugar',
  'Search help': 'Ayuda de Buscar',
  'Search in German ("ausgeh...") or English ("go out").\\nInflected forms like "ging aus" work too.':
    'Busca en alemán ("ausgeh...") o en inglés ("go out").\\nLas formas flexionadas como "ging aus" también funcionan.',
  'Search settings': 'Buscar en ajustes',
  'Search this': 'Buscar esto',
  'Select cards': 'Seleccionar tarjetas',
  'Selectors that work with zero extra markup (they target the card body itself or elements this app already emits):':
    'Selectores que funcionan sin ningún marcado adicional (apuntan al propio cuerpo de la tarjeta o a elementos que esta app ya genera):',
  'Send Feedback': 'Enviar comentarios',
  'Send Feedback help': 'Ayuda de Enviar comentarios',
  'Sentence (use [...] for the gap)': 'Frase (usa [...] para el hueco)',
  'Sentence translation': 'Traducción de la frase',
  'Share & Search': 'Compartir y buscar',
  'Show DeepL API key': 'Mostrar clave de API de DeepL',
  'Shown on flashcard': 'Se muestra en la tarjeta',
  'Sign in with Google': 'Iniciar sesión con Google',
  'Sign out': 'Cerrar sesión',
  'Signing in...': 'Iniciando sesión...',
  'Speaking speed': 'Velocidad de habla',
  'Speaking speed isn\'t configurable for this provider yet.':
    'La velocidad de habla aún no se puede configurar para este proveedor.',
  'Speech engine': 'Motor de voz',
  "Submitting posts your message as a GitHub issue on Lemmory's public repository - anyone can read it, including your contact email if you provide one.":
    'Enviar publica tu mensaje como una incidencia de GitHub en el repositorio público de Lemmory; cualquiera puede leerlo, incluido tu correo de contacto si proporcionas uno.',
  Sync: 'Sincronizar',
  'Sync decks, cards, and progress to a Google account':
    'Sincroniza mazos, tarjetas y progreso con una cuenta de Google',
  'Sync failed': 'Error al sincronizar',
  'Sync not connected': 'Sincronización no conectada',
  'Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.':
    'Conecta tu cuenta de Google en Ajustes > Sincronización para empezar a sincronizar tus mazos y tu progreso entre dispositivos.',
  'Sync in the background whenever you leave the app, at most this often':
    'Sincronizar en segundo plano cada vez que sales de la app, como máximo con esta frecuencia',
  'Sync now': 'Sincronizar ahora',
  'Sync your decks, cards, and review progress to a Google account so they carry over to another device. API keys are never synced.':
    'Sincroniza tus mazos, tarjetas y progreso de repaso con una cuenta de Google para que se trasladen a otro dispositivo. Las claves de API nunca se sincronizan.',
  Synced: 'Sincronizado',
  'Syncing...': 'Sincronizando...',
  'Synonyms & phrases': 'Sinónimos y frases',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. You can rate or flag one the same way as an example.':
    'Los sinónimos son otras palabras con un significado similar, útiles para ampliar tu vocabulario alrededor de esta palabra. Puedes valorar o marcar uno igual que un ejemplo.',
  'Tap the star on any example to choose which one appears on your flashcard - only one shows at a time.':
    'Toca la estrella de cualquier ejemplo para elegir cuál aparece en tu tarjeta; solo se muestra uno a la vez.',
  'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.':
    'Tocar "Añadir a mazo" siempre pregunta a qué mazo añadir la palabra, y te deja crear un mazo completamente nuevo al instante.',
  'Test active engine': 'Probar motor activo',
  'Test phrase': 'Frase de prueba',
  'Test this provider': 'Probar este proveedor',
  'Testing a voice': 'Probar una voz',
  'Text to speak when testing': 'Texto a pronunciar al probar',
  'Thanks for the feedback': 'Gracias por tus comentarios',
  'The "Available template variables" card lists every field name you can reference, with a one-line description of what it holds.':
    'La tarjeta "Variables de plantilla disponibles" enumera todos los nombres de campo que puedes referenciar, con una descripción de una línea de lo que contiene.',
  'The CSS box applies to both the front and back - there is one stylesheet per template, not one per side.':
    'El cuadro CSS se aplica tanto al anverso como al reverso: hay una hoja de estilos por plantilla, no una por lado.',
  'The button at the bottom turns your selected sentences into real vocabulary cards, one at a time.':
    'El botón de abajo convierte tus frases seleccionadas en tarjetas de vocabulario reales, una a una.',
  'The card fills the available screen space exactly (no scrolling) and the caption above it shows its real, on-device measured width and height in points - the same size a card gets during an actual review session.':
    'La tarjeta ocupa exactamente el espacio de pantalla disponible (sin desplazamiento) y el texto de arriba muestra su ancho y alto reales, medidos en el dispositivo en puntos: el mismo tamaño que tiene una tarjeta durante una sesión de repaso real.',
  'The conditional example at the bottom is a worked, copy-pasteable snippet combining {% if %} and {% for ... limit %}.':
    'El ejemplo condicional de abajo es un fragmento resuelto y listo para copiar y pegar que combina {% if %} y {% for ... limit %}.',
  'The dropdown above the examples ("all", "travel", "business", and so on) filters them down to a particular tone or situation, if you only want to see those.':
    'El menú desplegable encima de los ejemplos ("todos", "viajes", "negocios", etc.) los filtra según un tono o situación concreta, por si solo quieres ver esos.',
  'The pencil icon lets you edit the meaning or example text directly. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'El icono de lápiz te permite editar directamente el texto del significado o el ejemplo. El último icono abre una búsqueda web rápida de la palabra, para una segunda opinión fuera de la app.',
  'The row of small icon buttons under the meaning gives you a few more ways to dig into this word.':
    'La fila de pequeños botones con iconos debajo del significado te da algunas formas más de profundizar en esta palabra.',
  'The sentence must contain "[...]" for the gap, and an answer is required.':
    'La frase debe contener "[...]" para el hueco, y se requiere una respuesta.',
  'The toggles read the template text itself (no hidden markers) - they work reliably for templates built through the toggles. If you hand-write unusual formatting in the Code tab, a toggle may not detect it; edit the Code tab directly in that case.':
    'Los interruptores leen el propio texto de la plantilla (sin marcadores ocultos); funcionan de forma fiable para plantillas creadas mediante los interruptores. Si escribes a mano un formato inusual en la pestaña Código, es posible que un interruptor no lo detecte; en ese caso, edita directamente la pestaña Código.',
  'The translation at the top is what actually appears on your flashcard.':
    'La traducción de arriba es lo que realmente aparece en tu tarjeta.',
  'The voice list follows whatever language is set under Settings > Learning > "I\'m learning".':
    'La lista de voces sigue el idioma configurado en Ajustes > Aprendizaje > "Estoy aprendiendo".',
  Theme: 'Tema',
  'Thinking...': 'Pensando...',
  'This becomes a public issue': 'Esto se convierte en una incidencia pública',
  'This card, explained': 'Esta tarjeta, explicada',
  "This changes the language of the app itself - its buttons and menus - not the language you're learning.":
    'Esto cambia el idioma de la propia app (sus botones y menús), no el idioma que estás aprendiendo.',
  'This collapsible panel below the examples lets you pick a specific grammar pattern - a tense, a sentence structure, a particular conjunction - that you want the next batch of examples to practice, instead of leaving it to chance.':
    'Este panel desplegable debajo de los ejemplos te permite elegir un patrón gramatical concreto (un tiempo verbal, una estructura de frase, una conjunción concreta) que quieras que practique el próximo lote de ejemplos, en lugar de dejarlo al azar.',
  "This is a preview of the feedback form - sending isn't connected yet, so nothing was sent anywhere. Once it is, this exact form will open a GitHub issue on your behalf.":
    'Esto es una vista previa del formulario de comentarios: el envío aún no está conectado, así que no se ha enviado nada a ningún sitio. Cuando lo esté, este mismo formulario abrirá una incidencia de GitHub en tu nombre.',
  'This is the one step that actually does the work - nothing before it does anything with your captured text.':
    'Este es el único paso que realmente hace el trabajo; nada antes de él hace algo con tu texto capturado.',
  'This only changes colors - nothing about how the app works.':
    'Esto solo cambia los colores, nada sobre cómo funciona la app.',
  'This only removes them from this deck - cards that live in other decks too stay there.':
    'Esto solo las elimina de este mazo; las tarjetas que también están en otros mazos se quedan ahí.',
  'This opens a separate screen for the voice that reads words out loud, and how fast it speaks.':
    'Esto abre una pantalla aparte para la voz que lee las palabras en voz alta y la velocidad a la que habla.',
  'This removes every OpenAI/Mistral/Gemini/Claude key from this device. Vocabulary and progress are unaffected.':
    'Esto elimina todas las claves de OpenAI/Mistral/Gemini/Claude de este dispositivo. El vocabulario y el progreso no se ven afectados.',
  'This replaces the fields, layout, and style with the built-in default, and saves immediately. This cannot be undone.':
    'Esto reemplaza los campos, el diseño y el estilo por los valores predeterminados integrados, y guarda de inmediato. Esto no se puede deshacer.',
  'This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.':
    'Esto reemplaza los significados, ejemplos, sinónimos, frases y tarjetas de huecos por una nueva generación con IA. Esto no se puede deshacer.',
  'This screen is a preview of the full flow; submitting just confirms locally for now. A small server-side function will handle real submission in a future update.':
    'Esta pantalla es una vista previa del flujo completo; enviar por ahora solo confirma de forma local. Una pequeña función del lado del servidor gestionará el envío real en una futura actualización.',
  'This setting decides what happens next.': 'Este ajuste decide qué ocurre a continuación.',
  Title: 'Título',
  'To style one field on its own - e.g. make the word bigger than the rest - wrap just that field in your own element in the Code tab, then target the class you chose:':
    'Para dar estilo a un solo campo (por ejemplo, hacer la palabra más grande que el resto), envuelve solo ese campo en tu propio elemento en la pestaña Código y luego apunta a la clase que elegiste:',
  'Translation-only': 'Solo traducción',
  "Turning a field on inserts the minimum Liquid needed for it at the end of that side's template: a plain field becomes {{ word }}; a list field (Other meanings, Synonyms, Related phrases) becomes a {% for %} loop, because a list can't be printed directly.":
    'Activar un campo inserta el mínimo Liquid necesario al final de la plantilla de ese lado: un campo simple se convierte en {{ word }}; un campo de lista (Otros significados, Sinónimos, Frases relacionadas) se convierte en un bucle {% for %}, porque una lista no se puede imprimir directamente.',
  'Turning captures into cards': 'Convertir capturas en tarjetas',
  "Type a word in either language you've set up under Learning - your own vocabulary is searched instantly as you type.":
    'Escribe una palabra en cualquiera de los idiomas que configuraste en Aprendizaje; tu propio vocabulario se busca al instante mientras escribes.',
  "Underneath each example, thumbs up/down let you mark whether it's good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense.":
    'Debajo de cada ejemplo, los pulgares arriba/abajo te permiten marcar si es bueno o si vale la pena revisarlo más tarde. El icono de bandera reporta un problema concreto (como una redacción poco natural o un error gramatical) con una nota opcional. La flecha circular regenera un nuevo lote de ejemplos para este sentido.',
  'Unknown error': 'Error desconocido',
  'Uses this provider\'s key from AI Providers':
    'Usa la clave de este proveedor desde Proveedores de IA',
  'Uses your phone\'s own text-to-speech engine - offline, free, no API key.':
    'Usa el propio motor de texto a voz de tu teléfono: sin conexión, gratis, sin clave de API.',
  Voice: 'Voz',
  'Voice ({{language}})': 'Voz ({{language}})',
  'Want it to work a bit differently? There\'s a setting for that in Settings, under "Share & Search."':
    '¿Quieres que funcione de forma un poco distinta? Hay un ajuste para eso en Ajustes, dentro de "Compartir y buscar".',
  'What diagnostics includes': 'Qué incluye el diagnóstico',
  'What happened, or what would you like to see?': '¿Qué pasó, o qué te gustaría ver?',
  'What kind of feedback?': '¿Qué tipo de comentario?',
  'What this screen is for': 'Para qué sirve esta pantalla',
  'Whatever translation at this moment is selected/shown will be added to deck along with its relevant example.':
    'La traducción que esté seleccionada o mostrada en este momento se añadirá al mazo junto con su ejemplo correspondiente.',
  'When a word is new to you': 'Cuando una palabra es nueva para ti',
  'Why nothing sends yet': 'Por qué aún no se envía nada',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.':
    'Sin una clave de generación, la creación de tarjetas con IA está desactivada. La traducción y las tarjetas manuales siguen funcionando. Añade una clave en Proveedores de IA para la experiencia completa.',
  'Word and meaning are required.': 'Se requieren la palabra y el significado.',
  'Word card': 'Tarjeta de palabra',
  'You can add your cards to multiple decks even if it is added before.':
    'Puedes añadir tus tarjetas a varios mazos aunque ya se hayan añadido antes.',
  "You can also share text from another app straight to Lemmory, the same way you'd share a link or a photo.":
    'También puedes compartir texto directamente desde otra app a Lemmory, igual que compartirías un enlace o una foto.',
  "You can also share text to Lemmory, the same way you'd share a link or a photo to any other app.":
    'También puedes compartir texto con Lemmory, igual que compartirías un enlace o una foto con cualquier otra app.',
  'ask a follow-up question': 'hacer una pregunta de seguimiento',
  'e.g. Er lehnt das Angebot ab.': 'p. ej. Er lehnt das Angebot ab.',
  'e.g. He refuses the offer.': 'p. ej. He refuses the offer.',
  'e.g. We are going out tonight.': 'p. ej. We are going out tonight.',
  'e.g. Wir gehen heute Abend [...].': 'p. ej. Wir gehen heute Abend [...].',
  'e.g. ablehnen': 'p. ej. ablehnen',
  'e.g. aus': 'p. ej. aus',
  'e.g. to refuse': 'p. ej. to refuse',
  'e.g. verweigern, zurückweisen': 'p. ej. verweigern, zurückweisen',
  'eleven_multilingual_v2. Once your key is entered, choose from your own ElevenLabs voice library, or switch to manual entry to paste a voice ID directly.':
    'eleven_multilingual_v2. Una vez introducida tu clave, elige entre tu propia biblioteca de voces de ElevenLabs, o cambia a entrada manual para pegar directamente un ID de voz.',
  'generate an explanation for this meaning': 'generar una explicación para este significado',
  'gpt-4o-mini-tts. Marin and Cedar (★) are OpenAI\'s newest, most natural-sounding voices.':
    'gpt-4o-mini-tts. Marin y Cedar (★) son las voces más nuevas y naturales de OpenAI.',
  'regenerate this card': 'regenerar esta tarjeta',
  reverse: 'al revés',
  'this deck': 'este mazo',
  'you@example.com': 'tu@ejemplo.com',
  '{{ variable }} prints a value. {% if gender %}...{% endif %} shows content only when a field has one - good for optional fields. {% for s in synonyms %}...{% endfor %} loops a list; add "limit:2" to cap it, and {% unless forloop.last %}...{% endunless %} to add a separator between items but not after the last one.':
    '{{ variable }} imprime un valor. {% if gender %}...{% endif %} muestra contenido solo cuando un campo lo tiene; útil para campos opcionales. {% for s in synonyms %}...{% endfor %} recorre una lista; añade "limit:2" para limitarla, y {% unless forloop.last %}...{% endunless %} para añadir un separador entre elementos pero no después del último.',
  '{{cefr}} · {{native}} > {{target}}': '{{cefr}} · {{native}} > {{target}}',
  '{{count}} of {{total}} configured': '{{count}} de {{total}} configurados',
  '{{count}} selected': '{{count}} seleccionados',
  '{{count}} tokens': '{{count}} tokens',
  '{{count}}h': '{{count}} h',
  '{{count}}m': '{{count}} min',
  "{{language}} isn't ready yet - English and German are the only languages Lemmory fully supports right now.":
    '{{language}} aún no está disponible: el inglés y el alemán son los únicos idiomas que Lemmory admite completamente por ahora.',
  '{{provider}} playback failed': 'Error de reproducción de {{provider}}',
  '{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted':
    '{{pulled}} descargados · {{pushed}} subidos · {{deleted}} eliminados',

  masculine: 'masculino',
  feminine: 'femenino',
  neuter: 'neutro',
  Again: 'De nuevo',
  Hard: 'Difícil',
  Good: 'Bien',
  Easy: 'Fácil',
  'Lemmory Light': 'Lemmory Claro',
  'Midnight Indigo': 'Índigo Medianoche',
  'Carbon Noir': 'Carbón Negro',
  'Arctic Day': 'Día Ártico',
  'Warm Sand': 'Arena Cálida',
  Paperlight: 'Blanco Papel',
  'Meanings, examples, clusters, phrases, and cloze - the default generation provider.':
    'Significados, ejemplos, grupos, frases y textos con huecos - el proveedor de generación predeterminado.',
  'BYOK alternative for card generation and translation.':
    'Alternativa BYOK para la generación de tarjetas y traducción.',
  'Google Gemini BYOK for card generation and translation.':
    'Google Gemini BYOK para la generación de tarjetas y traducción.',
  'Claude BYOK for card generation and translation.':
    'Claude BYOK para la generación de tarjetas y traducción.',
  'Your phone\'s own text-to-speech engine. Offline, no API key, no per-word cost.':
    'El motor de texto a voz propio de tu teléfono. Sin conexión, sin clave de API, sin costo por palabra.',
  'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.':
    'gpt-4o-mini-tts. Para la voz más natural, elige Marin o Cedar abajo.',
  'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.':
    'eleven_multilingual_v2. Pega un ID de voz de tu biblioteca de voces de ElevenLabs.',
  'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).':
    'Aura-2. Ingresa el nombre exacto del modelo para la voz/idioma que deseas (consulta la documentación de Deepgram).',
  'Bug / Issue': 'Error / Problema',
  'Feature request': 'Solicitud de función',
  'General feedback': 'Comentario general',
  Vietnamese: 'Vietnamita',

  Queue: 'Cola',
  'Queue help': 'Ayuda de la cola',
  'Queue is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    'La cola es un espacio de espera para las frases que quieres convertir en tarjetas de vocabulario más tarde - aquí no pasa nada automáticamente.',

  'Generate {{count}} cards to...': 'Generar {{count}} tarjetas en...',
  'Delete account & sync data?': '¿Eliminar la cuenta y los datos sincronizados?',
  'This permanently erases everything you\'ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can\'t be undone.':
    'Esto borra permanentemente todo lo que has sincronizado con la nube y cierra tu sesión. Tus mazos y tarjetas en este dispositivo no se ven afectados. Esta acción no se puede deshacer.',
  'Delete everything': 'Eliminar todo',
  'Deletion failed': 'Error al eliminar',
  'Danger zone': 'Zona de peligro',
  'Permanently erase everything synced to this account and sign out. Your data on this device stays put.':
    'Borra permanentemente todo lo sincronizado con esta cuenta y cierra sesión. Tus datos en este dispositivo permanecen intactos.',
  'Delete account & sync data': 'Eliminar cuenta y datos sincronizados',
  'Sync help': 'Ayuda de sincronización',
  'How sync works': 'Cómo funciona la sincronización',
  'Deleting your account & data': 'Eliminar tu cuenta y datos',
  'What does this actually delete?': '¿Qué elimina esto exactamente?',
  "Signing in with Google links this device to a private cloud copy of your decks, cards, and review progress - so if you get a new phone, or use Lemmory on two devices, you're not starting from zero on the second one.":
    'Iniciar sesión con Google vincula este dispositivo a una copia privada en la nube de tus mazos, tarjetas y progreso - así que si consigues un teléfono nuevo, o usas Lemmory en dos dispositivos, no empiezas de cero en el segundo.',
  'Tap "Sync now" any time to push your latest changes up and pull down anything from another device. Under the hood it merges rather than overwrites - if you added a card here and reviewed one on your other phone, both survive.':
    'Toca "Sincronizar ahora" en cualquier momento para subir tus últimos cambios y bajar lo de otro dispositivo. Por dentro, combina en lugar de sobrescribir - si añadiste una tarjeta aquí y repasaste otra en tu otro teléfono, ambas se conservan.',
  "Your AI provider API keys are never synced. They live only in this device's secure storage, so you'll need to re-enter them if you set up a new device.":
    'Tus claves API de proveedores de IA nunca se sincronizan. Solo viven en el almacenamiento seguro de este dispositivo, así que tendrás que volver a introducirlas si configuras un dispositivo nuevo.',
  'When this is on, Lemmory quietly syncs in the background whenever you leave the app - no need to remember to tap "Sync now" yourself.':
    'Cuando esto está activado, Lemmory sincroniza silenciosamente en segundo plano cada vez que sales de la app - no hace falta que recuerdes tocar "Sincronizar ahora".',
  "\"At most every\" is a cooldown, not a schedule - it won't sync more often than that, but it also won't force a sync if you haven't opened the app in the meantime.":
    '"Como mucho cada" es un tiempo de espera mínimo, no un horario fijo - no sincronizará más a menudo que eso, pero tampoco forzará una sincronización si no has abierto la app mientras tanto.',
  "It runs over whatever connection you've got, Wi-Fi or mobile data - there's no Wi-Fi-only toggle.":
    'Funciona con cualquier conexión que tengas, Wi-Fi o datos móviles - no hay opción de solo Wi-Fi.',
  "This is the one action here you genuinely can't undo - read this before you tap it.":
    'Esta es la única acción aquí que de verdad no se puede deshacer - lee esto antes de tocarla.',
  'It permanently erases everything this account ever synced to the cloud, disconnects the Google account from Lemmory, and signs you out.':
    'Borra permanentemente todo lo que esta cuenta haya sincronizado alguna vez con la nube, desconecta la cuenta de Google de Lemmory y cierra tu sesión.',
  'Your decks, cards, and progress on THIS device are completely untouched - they stay right where they are, fully usable offline. Only the cloud copy (and the link to it) is gone.':
    'Tus mazos, tarjetas y progreso en ESTE dispositivo quedan completamente intactos - se quedan justo donde están, totalmente utilizables sin conexión. Solo desaparece la copia en la nube (y el enlace a ella).',
  'If you sign back in with the same Google account afterward, syncing starts fresh - nothing comes back automatically.':
    'Si vuelves a iniciar sesión después con la misma cuenta de Google, la sincronización empieza de cero - nada vuelve automáticamente.',
  'Card type for this import': 'Tipo de tarjeta para esta importación',
  'A row with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'Una fila con palabra/significado Y frase con hueco se convierte en UNA tarjeta, nunca dos. ¿Quieres ambas? Importa el archivo de nuevo después con el otro tipo de tarjeta.',
  'A note with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'Una nota con palabra/significado Y frase con hueco se convierte en UNA tarjeta, nunca dos. ¿Quieres ambas? Importa el archivo de nuevo después con el otro tipo de tarjeta.',
  'Regular (word/meaning)': 'Normal (palabra/significado)',
  'Cloze (fill-in-the-blank)': 'Huecos',
  'View all cards (table)': 'Ver todas las tarjetas (tabla)',
  '{{name}} - all cards': '{{name}} - todas las tarjetas',
  'All cards': 'Todas las tarjetas',
  'No cards yet': 'Aún no hay tarjetas',
  'Add words from Search or import a file to see them here.':
    'Añade palabras desde Buscar o importa un archivo para verlas aquí.',
  Type: 'Tipo',
  'Part of speech': 'Categoría gramatical',
  CEFR: 'Nivel MCER',

  // Newly added — Mixed practice, question types, cards-per-session, and the AI Providers help
  // sheet/error-message hardening that went with them
  'Fill in the blank': 'Rellenar el hueco',
  'True or False': 'Verdadero o falso',
  'Multiple choice': 'Opción múltiple',
  mixed: 'mixto',
  'true/false': 'verdadero/falso',
  'multiple choice': 'opción múltiple',
  'Mixed practice': 'Práctica mixta',
  'Practice more': 'Seguir practicando',
  'Practice question types': 'Tipos de pregunta de práctica',
  'Cards per session': 'Tarjetas por sesión',
  'No limit': 'Sin límite',
  'You reviewed {{count}} cards. There are more cards due - keep going or come back later.':
    'Repasaste {{count}} tarjetas. Hay más tarjetas pendientes - continúa o vuelve más tarde.',
  'Added to {{deck}}': 'Añadido a {{deck}}',
  'Cloze added': 'Ejercicio de huecos añadido',
  '"{{word}}" means "{{meaning}}"': '"{{word}}" significa "{{meaning}}"',
  'Not quite - "{{word}}" means "{{meaning}}".': 'No exactamente - "{{word}}" significa "{{meaning}}".',
  True: 'Verdadero',
  False: 'Falso',
  'Correct!': '¡Correcto!',
  'What does this mean?': '¿Qué significa esto?',
  'True or false?': '¿Verdadero o falso?',
  'Language pair': 'Par de idiomas',
  '"I speak": explanations and the "More info" follow-up use this language.':
    '"Hablo": las explicaciones y el seguimiento "Más información" usan este idioma.',
  '"I\'m learning": new words are looked up and generated in this language.':
    '"Estoy aprendiendo": las palabras nuevas se buscan y se generan en este idioma.',
  'Mixed practice presents due cards in a random mix of whichever formats are enabled here.':
    'La práctica mixta presenta las tarjetas pendientes en una mezcla aleatoria de los formatos activados aquí.',
  'Cloze here is scored separately from the dedicated Cloze Practice mode.':
    'Aquí, los huecos se puntúan por separado del modo dedicado de práctica de huecos.',
  'Caps how many due cards a single review session pulls in - the most overdue cards first. Applies to every practice mode, not just Mixed.':
    'Limita cuántas tarjetas pendientes carga una sola sesión de repaso - las más atrasadas primero. Se aplica a todos los modos de práctica, no solo a Mixta.',
  'If more are due, finish the session and tap "Practice more" for another round right away, instead of waiting until they come due again.':
    'Si quedan más pendientes, termina la sesión y toca "Seguir practicando" para otra ronda enseguida, en lugar de esperar a que vuelvan a estar pendientes.',
  'How AI Providers works': 'Cómo funcionan los proveedores de IA',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled.':
    'La generación de tarjetas (significados, ejemplos, grupos, frases, huecos) usa el proveedor configurado y activado abajo.',
  'Bring your own API key - nothing is sent to a provider until you generate a card.':
    'Usa tu propia clave API - no se envía nada a un proveedor hasta que generes una tarjeta.',
  "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.":
    'La respuesta de {{providerName}} para esta palabra no tenía el formato esperado. Esto puede ocurrir ocasionalmente - inténtalo de nuevo, o prueba otro proveedor de IA en Ajustes > Proveedores de IA.',
  '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} devolvió una respuesta que no se pudo leer. Esto puede ocurrir ocasionalmente - inténtalo de nuevo, o prueba otro proveedor de IA en Ajustes > Proveedores de IA.',
  '{{providerName}} could not generate a valid response for this word. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} no pudo generar una respuesta válida para esta palabra. Esto puede ocurrir ocasionalmente - inténtalo de nuevo, o prueba otro proveedor de IA en Ajustes > Proveedores de IA.',
  'The word is already blanked out below - select a different word or phrase and tap "Mark as cloze" to change it.':
    'La palabra ya está oculta abajo - selecciona otra palabra o frase y toca "Marcar como hueco" para cambiarla.',
  'Cloze added to {{deck}}': 'Ejercicio de huecos añadido a {{deck}}',
  'Select a word or phrase in the sentence below, then tap "Mark as cloze" to blank it out.':
    'Selecciona una palabra o frase en la oración de abajo y luego toca "Marcar como hueco" para ocultarla.',
  Sentence: 'Oración',
  'Mark as cloze': 'Marcar como hueco',
  'Nothing to preview yet.': 'Aún no hay nada que previsualizar.',
  'English translation': 'Traducción al inglés',
  'Add cloze card': 'Añadir tarjeta de huecos',
  'Save cloze card': 'Guardar tarjeta de huecos',

  'Underneath each example, thumbs up/down let you mark whether it\'s good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense - the same thing "Generate more examples" below the list does.':
    'Debajo de cada ejemplo, el pulgar arriba/abajo te permite indicar si es bueno o si conviene revisarlo después. El icono de bandera reporta un problema concreto (como una frase poco natural o un error gramatical) con una nota opcional. La flecha circular genera un nuevo lote de ejemplos para este sentido - lo mismo que hace "Generar más ejemplos" debajo de la lista.',
  'Don\'t see the pattern you want? Type your own under "Custom Grammar Rule" and tap the + to add it to the selection - it\'s sent to the AI exactly as written, alongside any picked chips.':
    '¿No encuentras la estructura que buscas? Escribe la tuya en "Regla gramatical personalizada" y toca el + para añadirla a la selección - se envía a la IA tal cual la escribiste, junto con los chips ya elegidos.',
  '"Generate targeted examples" replaces the current examples with fresh ones written to practice your selection. Examples generated this way get a highlighted background, so you can tell which ones came from your request.':
    '"Generar ejemplos dirigidos" reemplaza los ejemplos actuales por otros nuevos, escritos para practicar tu selección. Los ejemplos generados así tienen un fondo resaltado, para que puedas identificarlos.',
  'The pencil icon lets you edit the meaning or example text directly (dictionary-sourced cards only - an AI card uses Regenerate and the per-field AI tools instead). The trash icon deletes this card entirely, after confirming. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'El icono de lápiz te permite editar directamente el significado o el texto del ejemplo (solo en tarjetas del diccionario - una tarjeta de IA usa Regenerar y las herramientas de IA por campo en su lugar). El icono de papelera elimina esta tarjeta por completo, tras confirmar. El último icono abre una búsqueda web rápida de la palabra, para una segunda opinión fuera de la app.',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. Tap the sparkle icon on one to fetch AI usage & nuance - how formal it is and what makes it different from the headword. The icon next to it opens that synonym as its own flashcard.':
    'Los sinónimos son otras palabras de significado similar, útiles para ampliar tu vocabulario alrededor de esta palabra. Toca el icono de destello en uno para obtener uso y matiz según la IA - qué tan formal es y qué lo diferencia de la palabra principal. El icono de al lado abre ese sinónimo como su propia tarjeta.',
  'Phrases show this word used in common expressions or word combinations, fetched on demand: tap "Explore with AI" the first time, or "Load more with AI" for another batch once you already have some.':
    'Las frases muestran esta palabra usada en expresiones o combinaciones comunes, obtenidas bajo demanda: toca "Explorar con IA" la primera vez, o "Cargar más con IA" para otro lote una vez que ya tienes algunas.',
  '"Add to Cloze" (or "Edit Cloze" once one exists) at the bottom opens the editor pre-filled with the currently selected example. Select a word or phrase in the sentence and tap "Mark as cloze" to blank it out - it defaults to blanking the headword itself - then adjust the translation and save.':
    '"Añadir a hueco" (o "Editar hueco" una vez que existe uno) en la parte inferior abre el editor precargado con el ejemplo actualmente seleccionado. Selecciona una palabra o frase en la oración y toca "Marcar como hueco" para ocultarla - por defecto oculta la propia palabra principal - luego ajusta la traducción y guarda.',
  'Saving always replaces this card\'s cloze sentence rather than adding a second one - there\'s only ever one per card.':
    'Guardar siempre reemplaza la oración de huecos existente de esta tarjeta en lugar de añadir una segunda - solo puede haber una por tarjeta.',

  // Newly added — the redesigned AI Providers help sheet (grid + single detail panel) and its
  // matching Audio Settings labels
  'Active Generation Provider': 'Proveedor de generación activo',
  'Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.':
    'Elige qué motor de IA se usa para desambiguar el contexto, generar el paquete de la palabra y crear frases de ejemplo según el nivel MCER.',
  'Key configured': 'Clave configurada',
  'No key set': 'Sin clave configurada',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.':
    'Elige qué motor habla en voz alta - las voces del dispositivo son gratuitas y funcionan sin conexión; los proveedores en la nube usan tu propia clave API.',
  'Always available': 'Siempre disponible',
  'Validated': 'Validada',
  '"Active" vs "Enabled" - what\'s the difference?': '«Activo» frente a «Habilitado» - ¿cuál es la diferencia?',
  'Adding and validating a key': 'Añadir y validar una clave',
  'Which provider should I pick?': '¿Qué proveedor debería elegir?',
  'What the usage numbers mean': 'Qué significan las cifras de uso',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.':
    'Aquí es donde una palabra nueva se convierte en una tarjeta completa - significados, frases de ejemplo, grupos de sentido y más. Cada vez que buscas una palabra que Lingora aún no conoce, la entrega al proveedor que hayas marcado como **Activo** abajo y le pide que construya la tarjeta.',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.':
    'Funciona con el principio de **"trae tu propia clave"**: Lingora no incluye una suscripción de IA compartida, así que no se genera nada hasta que pegues tu propia clave API en uno de los proveedores de abajo. Eso también significa que nunca se envía nada a ningún sitio hasta que realmente busques una palabra - guardar una clave por sí sola no dispara ninguna solicitud.',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.':
    'No necesitas rellenar todos los proveedores. Con una sola clave que funcione y esté validada es suficiente - elige el servicio con el que ya tengas cuenta, o el que te dé curiosidad probar, y empieza por ahí.',
  '**Active** is the one provider actually doing the work right now - the engine that responds when you look up a word. Only one provider can be Active at a time, and tapping a validated provider\'s card here switches to it immediately.':
    '**Activo** es el único proveedor que realmente está trabajando ahora mismo - el motor que responde cuando buscas una palabra. Solo un proveedor puede estar Activo a la vez, y tocar la tarjeta de un proveedor validado cambia a él al instante.',
  '**Enabled** is a softer flag, tucked inside a provider\'s own settings panel. It controls whether that provider is allowed to be picked at all (including as a fallback, and as an option elsewhere in the app like Settings > Translation) - flip it off if you want to keep a key saved for later without it being usable right now.':
    '**Habilitado** es un indicador más suave, dentro del propio panel de ajustes de cada proveedor. Controla si ese proveedor puede elegirse en absoluto (incluso como alternativa de respaldo, y como opción en otras partes de la app, como Ajustes > Traducción) - desactívalo si quieres guardar una clave para más adelante sin que se pueda usar ahora.',
  'If a key gets cleared or fails validation while its provider is Active, Lingora quietly falls back to the next best option - whichever provider is both enabled and has a validated key - so you\'re never stuck without generation just because one key went stale.':
    'Si una clave se borra o falla la validación mientras su proveedor está Activo, Lingora cambia discretamente a la siguiente mejor opción - un proveedor que esté habilitado y tenga una clave validada - para que nunca te quedes sin generación solo porque una clave dejó de ser válida.',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Validate** - this sends one small real request to confirm the key actually works before you rely on it for word generation.':
    'Toca la tarjeta de un proveedor para abrir sus ajustes, pega tu clave API y elige un modelo distinto del predeterminado si quieres. Luego pulsa **Validar** - esto envía una pequeña solicitud real para confirmar que la clave funciona antes de que confíes en ella para generar palabras.',
  'A provider only becomes eligible to be Active once its key has validated successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.':
    'Un proveedor solo se vuelve elegible para ser Activo una vez que su clave se ha validado correctamente. Es a propósito - así se evita que una clave mal escrita o caducada se convierta, sin que te des cuenta, en lo único que te separa de una tarjeta nueva.',
  '**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device\'s secure storage - not in Lingora\'s own servers, not synced anywhere, unless you back up and restore it yourself.':
    '**Borrar** elimina la clave de este dispositivo por completo (y reinicia su historial de validación y uso). No se guarda nada en ningún otro sitio salvo en el almacenamiento seguro de este dispositivo - no en los servidores de Lingora, ni sincronizado en ningún sitio, a menos que tú mismo hagas una copia de seguridad y la restaures.',
  '**OpenAI** is the default and a safe general-purpose choice - reliable structured output, widely used, easy to get a key for at `platform.openai.com`.':
    '**OpenAI** es la opción predeterminada y una elección segura y de uso general - salida estructurada fiable, muy utilizada, fácil de conseguir una clave en `platform.openai.com`.',
  '**Groq** runs open models (like the gpt-oss family) on very fast custom hardware - if speed matters more to you than picking a specific model family, this is usually the quickest of the bunch to respond.':
    '**Groq** ejecuta modelos abiertos (como la familia gpt-oss) en hardware propio muy rápido - si la velocidad te importa más que una familia de modelos concreta, suele ser el más rápido en responder.',
  '**Mistral** is a solid European alternative with its own models, good if you\'d rather not depend on a US-based provider or just want a second option in the mix.':
    '**Mistral** es una buena alternativa europea con sus propios modelos - útil si prefieres no depender de un proveedor estadounidense o simplemente quieres una segunda opción.',
  '**Gemini** (Google) tends to be generous on free-tier usage limits if you\'re just trying this out without committing to a paid key yet.':
    '**Gemini** (Google) suele tener límites de uso gratuito generosos si solo quieres probarlo sin comprometerte todavía con una clave de pago.',
  '**Claude** (Anthropic) is known for careful, well-reasoned output - a good pick if you find another provider\'s example sentences or meanings feel a little off and want to compare.':
    '**Claude** (Anthropic) es conocido por respuestas cuidadas y bien razonadas - una buena opción si las frases de ejemplo o los significados de otro proveedor te parecen algo raros y quieres comparar.',
  '**DeepSeek** is capable and inexpensive, but tends to run noticeably slower than the others for a full word generation - worth knowing going in so a longer wait doesn\'t feel like something\'s broken.':
    '**DeepSeek** es capaz y económico, pero suele ser notablemente más lento que los demás al generar una palabra completa - conviene saberlo de antemano para que una espera más larga no parezca un fallo.',
  'Whichever you choose, the model picker under each provider lets you trade off speed, cost, and quality without needing to leave this screen.':
    'Elijas el que elijas, el selector de modelo de cada proveedor te permite equilibrar velocidad, coste y calidad sin salir de esta pantalla.',
  'Each provider\'s panel shows a **device-observed usage** box - request and token counts this specific device has actually sent through that key. It\'s a convenience, not a bill: it only counts what happened here, so it won\'t match a key shared across multiple devices or apps.':
    'El panel de cada proveedor muestra un recuadro de **uso observado por el dispositivo** - el número de solicitudes y tokens que este dispositivo ha enviado realmente con esa clave. Es una referencia práctica, no una factura: solo cuenta lo que ha pasado aquí, así que no coincidirá con una clave compartida entre varios dispositivos o apps.',
  'For the real, authoritative numbers - and anything to do with billing or rate limits - use the "Open usage" link, which takes you straight to that provider\'s own dashboard.':
    'Para las cifras reales y oficiales - y para cualquier cosa relacionada con facturación o límites de uso - usa el enlace «Abrir uso», que te lleva directamente al panel propio de ese proveedor.',
}

const hi: Partial<Record<Phrase, string>> = {
  Home: 'होम',
  Search: 'खोजें',
  Decks: 'डेक',
  Mine: 'मेरा',
  Settings: 'सेटिंग्स',
  Cancel: 'रद्द करें',
  Save: 'सहेजें',
  Delete: 'हटाएं',
  Edit: 'संपादित करें',
  Done: 'हो गया',
  Continue: 'जारी रखें',
  Back: 'वापस',
  Next: 'अगला',
  Add: 'जोड़ें',
  Import: 'आयात करें',
  Export: 'निर्यात करें',
  Retry: 'पुनः प्रयास करें',
  Send: 'भेजें',
  Undo: 'पूर्ववत करें',
  Redo: 'फिर से करें',
  Close: 'बंद करें',
  Install: 'इंस्टॉल करें',
  Uninstall: 'अनइंस्टॉल करें',
  Installed: 'इंस्टॉल हो गया',
  Generation: 'जनरेशन',
  Translation: 'अनुवाद',
  Learning: 'सीखना',
  Data: 'डेटा',
  Privacy: 'गोपनीयता',
  About: 'ऐप के बारे में',
  'Advanced Grammar Options': 'उन्नत व्याकरण विकल्प',
  'Select grammar structures to exercise in your examples:': 'अपने उदाहरणों में अभ्यास करने के लिए व्याकरण संरचनाएं चुनें:',
  'Generate targeted examples': 'लक्षित उदाहरण उत्पन्न करें',
  'Custom Grammar Rule': 'कस्टम व्याकरण नियम',
  'e.g. Past perfect continuous, reported speech...': 'जैसे: पूर्ण भूतकाल निरंतर, अप्रत्यक्ष कथन...',
  'App Language': 'ऐप की भाषा',
  'Follow device': 'डिवाइस की भाषा उपयोग करें',
  'System (Auto)': 'सिस्टम (स्वचालित)',
  'Default CEFR level': 'डिफ़ॉल्ट CEFR स्तर',
  'Examples and explanations are calibrated to this level.':
    'उदाहरण और स्पष्टीकरण इसी स्तर के अनुसार तैयार किए गए हैं।',
  'Word of the Day reminder': '"दिन का शब्द" रिमाइंडर',
  'When the daily notification for your Home screen word arrives.':
    'आपकी होम स्क्रीन के शब्द की दैनिक सूचना कब आती है।',
  'Import & export': 'आयात और निर्यात',
  'Anki, CSV, JSON backup': 'Anki, CSV, JSON बैकअप',
  'Card templates': 'कार्ड टेम्पलेट',
  'Customize card layouts': 'कार्ड लेआउट अनुकूलित करें',
  Pronunciation: 'उच्चारण',
  'Voice, rate, pitch': 'आवाज़, गति, पिच',
  'Local Dictionaries': 'स्थानीय शब्दकोश',
  'Free starter dictionary - no AI key needed':
    'मुफ़्त स्टार्टर शब्दकोश - AI कुंजी की आवश्यकता नहीं',
  'Delete all API keys': 'सभी API कुंजियाँ हटाएं',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'API कुंजियाँ इसी डिवाइस पर रहती हैं (Expo SecureStore) और निर्यात या बैकअप में कभी शामिल नहीं होतीं।',
  English: 'अंग्रेज़ी',
  German: 'जर्मन',
  French: 'फ़्रेंच',
  Spanish: 'स्पेनिश',
  Hindi: 'हिन्दी',
  'Word of the Day': 'आज का शब्द',
  'Learn this word': 'यह शब्द सीखें',
  "Finding today's word...": 'आज का शब्द खोजा जा रहा है...',
  '✨ Word of the Day: {{word}}': '✨ आज का शब्द: {{word}}',
  'Nice to see you back.': 'आपको वापस देखकर अच्छा लगा।',
  '{{count}} days': '{{count}} दिन',
  "Some data on this screen couldn't load.": 'इस स्क्रीन का कुछ डेटा लोड नहीं हो सका।',
  'cards due for review': 'दोहराने के लिए कार्ड बाकी',
  'Start review': 'दोहराव शुरू करें',
  Review: 'दोहराएँ',
  'reviewed today': 'आज दोहराए गए',
  remembered: 'याद रखा',
  'Quick actions': 'त्वरित कार्य',
  'Look up a word': 'एक शब्द खोजें',
  'Mining queue': 'माइनिंग कतार',
  'Practice cloze': 'क्लोज़ अभ्यास करें',
  Statistics: 'आँकड़े',
  'Recently added': 'हाल ही में जोड़े गए',
  'Recently searched': 'हाल ही में खोजे गए',
  'Add to Deck': 'डेक में जोड़ें',
  'Add to Cloze': 'क्लोज़ कार्ड में जोड़ें',
  Listen: 'सुनें',
  'Added to deck': 'डेक में जोड़ा गया',
  'Added to cloze': 'क्लोज़ में जोड़ा गया',
  'Deck options': 'डेक के विकल्प',
  'Move deck': 'डेक स्थानांतरित करें',
  'Merge deck': 'डेक विलय करें',
  'Merge into another deck': 'दूसरे डेक में विलय करें',
  'Good morning!': 'शुभ प्रभात!',
  'Good afternoon!': 'नमस्कार!',
  'Good evening!': 'शुभ संध्या!',
  'Add Card': 'कार्ड जोड़ें',
  'Open Deck': 'डेक खोलें',
  'eBook Library': 'ई-पुस्तक लाइब्रेरी',
  'Import eBook': 'ई-पुस्तक आयात करें',
  'No eBooks in your library yet': 'आपकी लाइब्रेरी में अभी कोई ई-पुस्तक नहीं है',
  'Loading eBook...': 'ई-पुस्तक लोड हो रही है...',
  'Table of Contents': 'विषय-सूची',
  'Reader Settings': 'रीडर सेटिंग्स',
  'Font Size': 'फ़ॉन्ट आकार',
  'Translate Inline': 'इनलाइन अनुवाद करें',
  'Selected paragraph translation': 'चयनित पैराग्राफ का अनुवाद',
  'CEFR level set in settings': 'सेटिंग्स में निर्धारित CEFR स्तर',
  'Remove level': 'स्तर हटाएँ',
  'Set manually': 'मैन्युअल रूप से सेट करें',
  'Automatic (CEFR)': 'ऑटोमैटिक (CEFR)',
  'See all': 'सभी देखें',
  'No words yet': 'अभी तक कोई शब्द नहीं',
  'Look up a word to add your first card.': 'अपना पहला कार्ड जोड़ने के लिए एक शब्द खोजें।',
  'Type a German or English word...': 'जर्मन या अंग्रेज़ी शब्द टाइप करें...',
  'Instant lookup': 'तुरंत खोज',
  'Search in German ("ausgeh...") or English ("go out").\nInflected forms like "ging aus" work too.':
    'जर्मन ("ausgeh...") या अंग्रेज़ी ("go out") में खोजें।\n"ging aus" जैसे रूपांतरित शब्द भी काम करते हैं।',
  '"{{term}}" is new': '"{{term}}" नया है',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    'यह शब्द अभी तक आपकी लाइब्रेरी में नहीं है। AI से अर्थ, उदाहरण और समानार्थी शब्द बनाएं।',
  'Translating...': 'अनुवाद हो रहा है...',
  'Generating...': 'बन रहा है...',
  'Generate with AI': 'AI से बनाएं',
  'Add your OpenAI key in Settings to generate new words':
    'नए शब्द बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें',
  'Generation came back incomplete': 'जनरेशन अधूरा वापस आया',
  'From your installed dictionary - free, no AI needed.':
    'आपके इंस्टॉल किए गए शब्दकोश से - मुफ़्त, AI की ज़रूरत नहीं।',
  'Nothing was saved - try again.': 'कुछ भी सहेजा नहीं गया - फिर से कोशिश करें।',
  'Give the deck a name.': 'डेक को एक नाम दें।',
  'Could not delete deck': 'डेक हटाया नहीं जा सका',
  'Delete deck?': 'डेक हटाएं?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    'केवल इस डेक में मौजूद कार्ड इसके साथ हट जाएंगे। अन्य डेक में मौजूद कार्ड वहीं रहेंगे।',
  'No deck selected.': 'कोई डेक चयनित नहीं है।',
  'Could not move deck': 'डेक ले जाया नहीं जा सका',
  'Could not merge deck': 'डेक मर्ज नहीं किया जा सका',
  'Merge into "{{name}}"?': '"{{name}}" में मर्ज करें?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'इससे "{{source}}" हट जाएगा और इसके सभी कार्ड "{{target}}" में चले जाएंगे। इसे वापस नहीं लिया जा सकता।',
  'Export ready': 'निर्यात तैयार',
  'Exported {{count}} cards.': '{{count}} कार्ड निर्यात किए गए।',
  'Saved to the folder you chose.': 'आपके चुने गए फ़ोल्डर में सहेजा गया।',
  'Choose where to save it.': 'इसे कहाँ सहेजना है चुनें।',
  'Export failed': 'निर्यात विफल',
  'No decks yet': 'अभी तक कोई डेक नहीं',
  'Create your first deck with the + button.': '+ बटन से अपना पहला डेक बनाएं।',
  'New deck': 'नया डेक',
  'Deck name': 'डेक का नाम',
  'Emoji (optional)': 'इमोजी (वैकल्पिक)',
  'Creating...': 'बनाया जा रहा है...',
  'Create deck': 'डेक बनाएं',
  'Import into this deck': 'इस डेक में आयात करें',
  'Export this deck': 'इस डेक को निर्यात करें',
  'Rename deck': 'डेक का नाम बदलें',
  'Move to...': 'ले जाएं...',
  'Merge into...': 'मर्ज करें...',
  'Delete deck': 'डेक हटाएं',
  'Top level (no parent)': 'शीर्ष स्तर (कोई मूल डेक नहीं)',
  'No other deck to nest this one under.': 'इसे नेस्ट करने के लिए कोई अन्य डेक नहीं है।',
  'No other deck to merge into.': 'मर्ज करने के लिए कोई अन्य डेक नहीं है।',
  'Import into "{{name}}"': '"{{name}}" में आयात करें',
  'Export "{{name}}"': '"{{name}}" निर्यात करें',
  '{{due}} due/{{total}} cards': '{{due}} बाकी/{{total}} कार्ड',
  '{{count}} due': '{{count}} बाकी',
  Deck: 'डेक',
  'This deck no longer exists.': 'यह डेक अब मौजूद नहीं है।',
  cards: 'कार्ड',
  'due now': 'अभी बाकी',
  'Review {{count}} due cards': '{{count}} बाकी कार्ड दोहराएं',
  'Nothing due - study ahead': 'कुछ बाकी नहीं - आगे से पढ़ें',
  Cards: 'कार्ड',
  'No cards yet - add words from Search.': 'अभी तक कोई कार्ड नहीं - खोज से शब्द जोड़ें।',
  'Move "{{name}}" to...': '"{{name}}" को ले जाएं...',
  'Merge "{{name}}" into...': '"{{name}}" को मर्ज करें...',
  'Could not discard capture': 'कैप्चर हटाया नहीं जा सका',
  'Could not save capture': 'कैप्चर सहेजा नहीं जा सका',
  'Clipboard is empty': 'क्लिपबोर्ड खाली है',
  'Copy some text first, then paste it here.':
    'पहले कुछ टेक्स्ट कॉपी करें, फिर उसे यहाँ पेस्ट करें।',
  'Could not read clipboard': 'क्लिपबोर्ड पढ़ा नहीं जा सका',
  '✨ AI enriching meanings & examples...': '✨ AI अर्थ और उदाहरण जोड़ रहा है...',
  'AI Enrichment Failed': 'AI संवर्धन विफल रहा',
  'Selected model is not accessible with your {{providerName}} key/project. Try selecting a different model in Settings > AI Providers.':
    'चयनित मॉडल आपकी {{providerName}} कुंजी/प्रोजेक्ट के साथ उपलब्ध नहीं है। सेटिंग्स > AI प्रदाता में दूसरा मॉडल चुनें।',
  '{{providerName}} credit balance or quota exceeded. Please check your account plan and billing details.':
    '{{providerName}} क्रेडिट शेष या कोटा समाप्त हो गया है। कृपया अपना खाता प्लान और बिलिंग विवरण जांचें।',
  '{{providerName}} rate limit reached. Please wait a few seconds and try again.':
    '{{providerName}} दर सीमा समाप्त हो गई है। कृपया कुछ सेकंड प्रतीक्षा करें और पुनः प्रयास करें।',
  'Invalid {{providerName}} API key or permission denied. Please check your key in Settings > AI Providers.':
    'अमान्य {{providerName}} API कुंजी या अनुमति अस्वीकृत। सेटिंग्स > AI प्रदाता में अपनी कुंजी जांचें।',
  "Couldn't reach {{providerName}} - check your device's internet connection and try again.":
    '{{providerName}} तक पहुंच नहीं हो सकी - अपने डिवाइस का इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।',
  '{{providerName}} servers are temporarily unavailable ({{status}}). Please try again shortly.':
    '{{providerName}} सर्वर अस्थायी रूप से अनुपलब्ध हैं ({{status}})। कृपया जल्द ही पुनः प्रयास करें।',
  'Add your OpenAI key in Settings to generate cards.':
    'कार्ड बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें।',
  'Add a sentence': 'एक वाक्य जोड़ें',
  'Paste or type a German sentence. It joins the queue below - nothing is sent to AI until you generate.':
    'एक जर्मन वाक्य पेस्ट करें या टाइप करें। यह नीचे कतार में जुड़ जाता है - जब तक आप जनरेट न करें, AI को कुछ नहीं भेजा जाता।',
  'Paste from clipboard': 'क्लिपबोर्ड से पेस्ट करें',
  'Adding...': 'जोड़ा जा रहा है...',
  'Add to queue': 'कतार में जोड़ें',
  'Queue is empty': 'कतार खाली है',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet - it lands here before any AI processing.':
    'मैन्युअल रूप से एक वाक्य जोड़ें, अपने क्लिपबोर्ड से पेस्ट करें, या शेयर शीट से टेक्स्ट कैप्चर करें - यह किसी भी AI प्रोसेसिंग से पहले यहाँ आता है।',
  '{{done}} of {{total}} generated': '{{total}} में से {{done}} बनाए गए',
  '{{count}} failed': '{{count}} विफल',
  'see Decks.': 'डेक देखें।',
  "Review your captures. Discard what you don't need, then generate cards for the rest - no API call is wasted on text you didn't ask for.":
    'अपने कैप्चर की समीक्षा करें। जिनकी ज़रूरत नहीं उन्हें हटाएं, फिर बाकी के लिए कार्ड बनाएं - जो टेक्स्ट आपने नहीं मांगा उस पर कोई API कॉल बर्बाद नहीं होती।',
  'Generate {{count}} cards with AI': 'AI से {{count}} कार्ड बनाएं',
  'Add your OpenAI key to generate cards': 'कार्ड बनाने के लिए अपनी OpenAI कुंजी जोड़ें',
  'Explore Full AI Flashcard': 'पूरा AI फ्लैशकार्ड देखें',
  'Generate Full AI Flashcard': 'पूरा AI फ्लैशकार्ड बनाएं',
  'AI Insights': 'AI जानकारियां',
  'Getting AI insights for "{{word}}"...': '"{{word}}" के लिए AI जानकारियां ला रहे हैं...',
  'Load more phrases with AI': 'AI से और वाक्यांश लोड करें',
  'Explore idioms and collocations with AI': 'AI से मुहावरे और संयोजन देखें',
  'Tap the sparkle above to explore idioms, expressions, and common word combinations.':
    'मुहावरे, अभिव्यक्तियां और आम शब्द-संयोजन देखने के लिए ऊपर चमकते आइकन पर टैप करें।',
  'Could not load more info': 'अधिक जानकारी लोड नहीं हो सकी',
  'Add your AI provider key in Settings to generate more info.':
    'अधिक जानकारी बनाने के लिए सेटिंग्स में अपनी AI प्रोवाइडर कुंजी जोड़ें।',
  'No additional info available yet.': 'अभी तक कोई अतिरिक्त जानकारी उपलब्ध नहीं है।',
  'Add your OpenAI key in Settings to generate examples.':
    'उदाहरण बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें।',
  'This word has no card yet.': 'इस शब्द का अभी तक कोई कार्ड नहीं है।',
  'Could not save your feedback': 'आपकी प्रतिक्रिया सहेजी नहीं जा सकी',
  'Could not save your report': 'आपकी रिपोर्ट सहेजी नहीं जा सकी',
  'Could not change the primary meaning': 'मुख्य अर्थ बदला नहीं जा सका',
  'Could not update the flashcard example': 'फ्लैशकार्ड उदाहरण अपडेट नहीं हो सका',
  'This word has no meaning yet.': 'इस शब्द का अभी तक कोई अर्थ नहीं है।',
  'Could not generate an explanation': 'स्पष्टीकरण बनाया नहीं जा सका',
  'AI not configured': 'AI कॉन्फ़िगर नहीं है',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'इस अर्थ के लिए स्पष्टीकरण बनाने हेतु सेटिंग्स में OpenAI, Mistral, Gemini या Claude कुंजी जोड़ें।',
  'Could not look up an explanation': 'स्पष्टीकरण खोजा नहीं जा सका',
  'Could not save your changes': 'आपके बदलाव सहेजे नहीं जा सके',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '"{{form}}" अभी तक आपकी लाइब्रेरी में नहीं है। इसे बनाने के लिए खोज टैब से खोजें।',
  'No explanation yet.': 'अभी तक कोई स्पष्टीकरण नहीं।',
  'Make primary: {{translation}}': 'मुख्य बनाएं: {{translation}}',
  Examples: 'उदाहरण',
  'shown on flashcard': 'फ्लैशकार्ड पर दिखाया गया',
  'use on flashcard': 'फ्लैशकार्ड पर उपयोग करें',
  'Advanced grammar options': 'उन्नत व्याकरण विकल्प',
  'Active: {{selection}}': 'सक्रिय: {{selection}}',
  'Generate examples': 'उदाहरण बनाएं',
  'Add your OpenAI key in Settings to generate targeted examples.':
    'लक्षित उदाहरण बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें।',
  'Meanings in this word': 'इस शब्द के अर्थ',
  'Grammar info': 'व्याकरण जानकारी',
  'Hide grammar info': 'व्याकरण जानकारी छिपाएं',
  'chat with your AI tutor': 'अपने AI ट्यूटर से बात करने',
  'Ask about "{{word}}"': '"{{word}}" के बारे में पूछें',
  'Chat with your AI tutor about this word - ask for more examples, nuance, or anything unclear.':
    'इस शब्द के बारे में अपने AI ट्यूटर से बात करें - और उदाहरण, बारीकियाँ, या कोई भी अस्पष्ट बात पूछें।',
  "Couldn't load the explanation.": 'स्पष्टीकरण लोड नहीं हो सका।',
  "Couldn't load additional info.": 'अतिरिक्त जानकारी लोड नहीं हो सकी।',
  'Nothing to chat about yet': 'अभी बात करने के लिए कुछ नहीं है',
  "This card has no meaning content yet, so there's nothing to discuss. Open it from the word's own page and try Regenerate there.":
    'इस कार्ड में अभी अर्थ की सामग्री नहीं है, इसलिए चर्चा करने के लिए कुछ नहीं है। इसे शब्द के अपने पेज से खोलें और वहाँ "दोबारा जनरेट करें" आज़माएं।',
  'Give me another example': 'मुझे एक और उदाहरण दें',
  "What's a synonym for this?": 'इसका समानार्थी शब्द क्या है?',
  'When would I use this?': 'मैं इसका उपयोग कब करूँगा?',
  "Couldn't get a reply.": 'जवाब नहीं मिल सका।',
  'Message your AI tutor...': 'अपने AI ट्यूटर को संदेश भेजें...',
  Synonyms: 'समानार्थी शब्द',
  'Phrases & collocations': 'वाक्यांश और सहचर्य',
  'Cloze card': 'क्लोज़ कार्ड',
  'Cloze cards': 'क्लोज़ कार्ड',
  'Added ✓ - add to another deck': 'जोड़ा गया ✓ - किसी अन्य डेक में जोड़ें',
  'Add to deck': 'डेक में जोड़ें',
  'Add "{{form}}" to...': '"{{form}}" को इसमें जोड़ें...',
  'Edit this card': 'इस कार्ड को संपादित करें',
  Meaning: 'अर्थ',
  'Example sentence': 'उदाहरण वाक्य',
  'Example translation': 'उदाहरण अनुवाद',
  'Save changes': 'बदलाव सहेजें',
  "What's wrong with this?": 'इसमें क्या गलत है?',
  'Optional details...': 'वैकल्पिक विवरण...',
  'Send report': 'रिपोर्ट भेजें',
  'Sending...': 'भेजा जा रहा है...',
  'Inaccurate translation': 'गलत अनुवाद',
  'Unnatural phrasing': 'अस्वाभाविक वाक्य रचना',
  'Wrong CEFR level': 'गलत CEFR स्तर',
  'Grammar error': 'व्याकरण त्रुटि',
  Other: 'अन्य',
  'Tense & mood': 'काल और मूड',
  'Sentence structure': 'वाक्य संरचना',
  Conjunctions: 'संयोजक',
  'Focus words': 'बल शब्द',
  GOOD: 'अच्छा',
  AGAIN: 'फिर से',
  EASY: 'आसान',
  HARD: 'कठिन',
  'No card to rate.': 'रेट करने के लिए कोई कार्ड नहीं।',
  'Could not save your rating': 'आपकी रेटिंग सहेजी नहीं जा सकी',
  'No card to edit.': 'संपादित करने के लिए कोई कार्ड नहीं।',
  'Add your AI provider key in Settings to generate an explanation.':
    'स्पष्टीकरण बनाने के लिए सेटिंग्स में अपनी AI प्रदाता कुंजी जोड़ें।',
  'Nothing due right now': 'अभी कुछ भी बाकी नहीं',
  'Session complete!': 'सत्र पूरा हुआ!',
  'This deck has no cards due for review. Add words or check back later.':
    'इस डेक में दोहराने के लिए कोई कार्ड बाकी नहीं है। शब्द जोड़ें या बाद में देखें।',
  'You reviewed {{count}} cards. Great work - come back when the next cards are due.':
    'आपने {{count}} कार्ड दोहराए। शानदार काम - अगले कार्ड बाकी होने पर वापस आएं।',
  'Back to deck': 'डेक पर वापस जाएं',
  'tap to reveal': 'दिखाने के लिए टैप करें',
  cloze: 'क्लोज़',
  'Basic inline HTML works too - {{bold}}, {{italic}}, {{colored}}.':
    'बुनियादी इनलाइन HTML भी काम करता है - {{bold}}, {{italic}}, {{colored}}।',
  'No stats yet': 'अभी तक कोई आँकड़े नहीं',
  'Add and review some words to see your learning statistics here.':
    'यहाँ अपने सीखने के आँकड़े देखने के लिए कुछ शब्द जोड़ें और दोहराएं।',
  'remembered (30 d)': 'याद रखा (30 दिन)',
  'day streak': 'दिनों की लड़ी',
  'total cards': 'कुल कार्ड',
  'new this week': 'इस सप्ताह नए',
  'Review activity': 'दोहराव गतिविधि',
  less: 'कम',
  more: 'अधिक',
  'Vocabulary growth': 'शब्दावली वृद्धि',
  'new words per week': 'प्रति सप्ताह नए शब्द',
  'Difficult words': 'कठिन शब्द',
  'No lapses yet - nothing difficult to show.':
    'अभी तक कोई चूक नहीं - दिखाने के लिए कुछ कठिन नहीं।',
  '{{count}} lapses': '{{count}} चूक',
  'Anki deck (.apkg)': 'Anki डेक (.apkg)',
  "Bring your existing decks. Review history isn't imported - cards start fresh.":
    'अपने मौजूदा डेक लाएं। दोहराव का इतिहास आयात नहीं होता - कार्ड नए सिरे से शुरू होते हैं।',
  'Choose .apkg file': '.apkg फ़ाइल चुनें',
  'CSV with column mapping': 'कॉलम मैपिंग के साथ CSV',
  'From Quizlet, Memrise, or spreadsheets.': 'Quizlet, Memrise, या स्प्रेडशीट से।',
  'Choose CSV file': 'CSV फ़ाइल चुनें',
  'A shared deck (.lem)': 'एक साझा किया गया डेक (.lem)',
  "Add a deck someone shared with you - full fidelity, including review history. Doesn't touch anything else on this device.":
    'किसी ने आपके साथ साझा किया गया डेक जोड़ें - पूरी निष्ठा के साथ, दोहराव इतिहास सहित। यह इस डिवाइस पर कुछ और नहीं छूता।',
  'Choose .lem file': '.lem फ़ाइल चुनें',
  'Restore from Lemmory backup (.lem)': 'Lemmory बैकअप से पुनर्स्थापित करें (.lem)',
  'Replaces everything on this device with a previously exported backup.':
    'यह पहले निर्यात किए गए बैकअप से इस डिवाइस पर सब कुछ बदल देता है।',
  'Restoring...': 'पुनर्स्थापित हो रहा है...',
  'Choose backup file': 'बैकअप फ़ाइल चुनें',
  'Lemmory backup (.lem)': 'Lemmory बैकअप (.lem)',
  'Your full library - decks, cards, review history. Your data is always yours. API keys are never included.':
    'आपकी पूरी लाइब्रेरी - डेक, कार्ड, दोहराव इतिहास। आपका डेटा हमेशा आपका ही रहता है। API कुंजियाँ कभी शामिल नहीं होतीं।',
  'Export everything': 'सब कुछ निर्यात करें',
  'One row per card - the same columns CSV import reads, so this file re-imports as-is.':
    'प्रति कार्ड एक पंक्ति - वही कॉलम जो CSV आयात पढ़ता है, इसलिए यह फ़ाइल जैसी है वैसे ही फिर से आयात हो जाती है।',
  'Export as CSV': 'CSV के रूप में निर्यात करें',
  "Study your Lemmory vocabulary in Anki/AnkiDroid. Cards start fresh - review history isn't carried over.":
    'Anki/AnkiDroid में अपनी Lemmory शब्दावली पढ़ें। कार्ड नए सिरे से शुरू होते हैं - दोहराव इतिहास आगे नहीं बढ़ता।',
  'Export as .apkg': '.apkg के रूप में निर्यात करें',
  'A readable word - meaning - example list. Not meant to re-import.':
    'एक पठनीय शब्द - अर्थ - उदाहरण सूची। फिर से आयात के लिए नहीं है।',
  'Export as Markdown': 'Markdown के रूप में निर्यात करें',
  'Backup ready': 'बैकअप तैयार',
  'Restore from backup?': 'बैकअप से पुनर्स्थापित करें?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'यह इस डिवाइस पर मौजूद सब कुछ "{{fileName}}" (निर्यात किया गया {{date}}) की सामग्री से बदल देता है। इसे वापस नहीं लिया जा सकता।',
  Restore: 'पुनर्स्थापित करें',
  'Restore complete': 'पुनर्स्थापन पूरा हुआ',
  'Restored {{count}} rows.': '{{count}} पंक्तियाँ पुनर्स्थापित की गईं।',
  'Restore failed': 'पुनर्स्थापन विफल',
  'Invalid backup file': 'अमान्य बैकअप फ़ाइल',
  'Could not read file': 'फ़ाइल पढ़ी नहीं जा सकी',
  Preview: 'पूर्वावलोकन',
  'Will import': 'आयात होगा',
  Duplicates: 'डुप्लिकेट',
  Errors: 'त्रुटियाँ',
  Selected: 'चयनित',
  'Import {{count}} rows': '{{count}} पंक्तियाँ आयात करें',
  'Import {{count}} words': '{{count}} शब्द आयात करें',
  'Import from CSV': 'CSV से आयात करें',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Quizlet, Memrise, या स्प्रेडशीट निर्यात से। इसके बाद आप चुनेंगे कि हर कॉलम का क्या मतलब है।',
  '{{count}} rows detected. Map each column below.':
    '{{count}} पंक्तियाँ मिलीं। नीचे हर कॉलम को मैप करें।',
  'Sample data': 'नमूना डेटा',
  'The first few rows, so you can see what each column actually holds.':
    'पहली कुछ पंक्तियाँ, ताकि आप देख सकें कि हर कॉलम में वास्तव में क्या है।',
  'Column {{n}}': 'कॉलम {{n}}',
  'Field mapping': 'फ़ील्ड मैपिंग',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes - they're derived from the example's cloze markup and its translation.":
    'सब कुछ वैकल्पिक है। क्लोज़-शैली नोट्स के लिए शब्द/अर्थ को अनमैप्ड छोड़ें - वे उदाहरण के क्लोज़ मार्कअप और उसके अनुवाद से निकाले जाते हैं।',
  None: 'कोई नहीं',
  'Import into deck': 'डेक में आयात करें',
  '+ New deck': '+ नया डेक',
  'If the word already exists': 'यदि शब्द पहले से मौजूद है',
  'Applies to every duplicate row you leave checked in the next step.':
    'यह अगले चरण में चेक की गई हर डुप्लिकेट पंक्ति पर लागू होता है।',
  'Checking...': 'जाँच हो रही है...',
  'Preview import': 'आयात पूर्वावलोकन',
  'Importing...': 'आयात हो रहा है...',
  'Import complete': 'आयात पूरा हुआ',
  'Imported {{count}} words.': '{{count}} शब्द आयात किए गए।',
  Imported: 'आयातित',
  Skipped: 'छोड़े गए',
  Failed: 'विफल',
  'Import another file': 'एक और फ़ाइल आयात करें',
  'Could not read this file': 'यह फ़ाइल पढ़ी नहीं जा सकी',
  'Import failed': 'आयात विफल',
  'This file has no rows to import.': 'इस फ़ाइल में आयात करने के लिए कोई पंक्ति नहीं है।',
  Word: 'शब्द',
  Example: 'उदाहरण',
  Status: 'स्थिति',
  Issues: 'समस्याएं',
  Skip: 'छोड़ें',
  "Don't touch the existing word.": 'मौजूदा शब्द को न बदलें।',
  Merge: 'मर्ज करें',
  'Add this as another meaning on the existing card.':
    'इसे मौजूदा कार्ड पर एक और अर्थ के रूप में जोड़ें।',
  'Keep both': 'दोनों रखें',
  'Add a second, separate card for the same word.': 'उसी शब्द के लिए एक दूसरा, अलग कार्ड जोड़ें।',
  'Import from Anki': 'Anki से आयात करें',
  "Choose a `.apkg` export. Review history isn't imported - every card starts fresh - and media (audio/images) is stripped rather than copied.":
    'एक `.apkg` निर्यात चुनें। दोहराव इतिहास आयात नहीं होता - हर कार्ड नए सिरे से शुरू होता है - और मीडिया (ऑडियो/छवियाँ) कॉपी होने के बजाय हटा दिया जाता है।',
  '{{notes}} notes across {{decks}} decks. Map each field below - it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{decks}} डेक में {{notes}} नोट्स। नीचे हर फ़ील्ड मैप करें - यह हर नोट पर लागू होता है, इतने फ़ील्ड न रखने वाला नोट प्रकार इसे बस खाली छोड़ देता है।',
  'The first few notes, so you can see what each field actually holds.':
    'पहले कुछ नोट्स, ताकि आप देख सकें कि हर फ़ील्ड में वास्तव में क्या है।',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes - they're derived from the example's cloze markup and its translation.":
    'सब कुछ वैकल्पिक है। क्लोज़ नोट्स के लिए शब्द/अर्थ को अनमैप्ड छोड़ें - वे उदाहरण के क्लोज़ मार्कअप और उसके अनुवाद से निकाले जाते हैं।',
  'Field {{n}}': 'फ़ील्ड {{n}}',
  'This collection has no notes to import.': 'इस संग्रह में आयात करने के लिए कोई नोट नहीं है।',
  'Could not read this collection': 'यह संग्रह पढ़ा नहीं जा सका',
  '{{done}} of {{total}} notes': '{{total}} में से {{done}} नोट्स',
  'Import canceled': 'आयात रद्द किया गया',
  'The rest were left untouched - you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'बाकी को नहीं बदला गया - आप जहाँ छोड़ा था वहीं से जारी रखने के लिए वही फ़ाइल फिर से आयात कर सकते हैं (पहले से आयातित शब्द डुप्लिकेट के रूप में छोड़ दिए जाते हैं)।',
  Tags: 'टैग',
  'Import from a .lem file': '.lem फ़ाइल से आयात करें',
  'Choose a Lemmory `.lem` file - a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    'एक Lemmory `.lem` फ़ाइल चुनें - किसी ने आपके साथ साझा किया गया डेक, या आपके अपने डेक निर्यातों में से एक। पूरी निष्ठा: अर्थ, उदाहरण, समानार्थी शब्द, क्लोज़ कार्ड, दोहराव इतिहास, और FSRS शेड्यूलिंग सब आ जाते हैं।',
  'This file has more than one deck. Which one do you want to import?':
    'इस फ़ाइल में एक से अधिक डेक हैं। आप कौन सा आयात करना चाहते हैं?',
  'This file has no decks to import.': 'इस फ़ाइल में आयात करने के लिए कोई डेक नहीं है।',
  'Importing "{{name}}" ({{count}} cards).': '"{{name}}" आयात हो रहा है ({{count}} कार्ड)।',
  "Don't touch the word already in your library.": 'लाइब्रेरी में पहले से मौजूद शब्द को न बदलें।',
  'Imported {{words}} words ({{cards}} cards).': '{{words}} शब्द आयात किए गए ({{cards}} कार्ड)।',
  Vocabulary: 'शब्दावली',
  Cloze: 'क्लोज़',
  '+ New': '+ नया',
  Front: 'सामने',
  'actual review card size on this device': 'इस डिवाइस पर वास्तविक दोहराव कार्ड आकार',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'दोहराव सत्र द्वारा उपयोग किए जाने वाले उसी इंजन से एक नमूना क्लोज़ वाक्य के साथ रेंडर किया गया।',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'दोहराव सत्र द्वारा उपयोग किए जाने वाले उसी इंजन से नमूना डेटा ("ausgehen") के साथ रेंडर किया गया।',
  'Template name': 'टेम्पलेट नाम',
  Fields: 'फ़ील्ड',
  'Tap "Front" or "Back" to show a field on that side - a field can appear on both, or neither.':
    'उस तरफ़ फ़ील्ड दिखाने के लिए "सामने" या "पीछे" टैप करें - एक फ़ील्ड दोनों पर, या किसी पर भी नहीं दिख सकता है।',
  'Layout & style': 'लेआउट और शैली',
  'Reset to default': 'डिफ़ॉल्ट पर रीसेट करें',
  'Accent color': 'एक्सेंट रंग',
  'Stored as a': 'इस रूप में सहेजा गया',
  'rule - reference it in your CSS below as':
    'नियम - इसे अपने CSS में नीचे इस रूप में संदर्भित करें',
  'Applied to both sides in the real WebView renderer.':
    'वास्तविक WebView रेंडरर में दोनों तरफ़ लागू किया गया।',
  'Front (Liquid)': 'सामने (Liquid)',
  'Back (Liquid)': 'पीछे (Liquid)',
  'Available template variables': 'उपलब्ध टेम्पलेट वेरिएबल',
  'Conditional example': 'सशर्त उदाहरण',
  'Set default': 'डिफ़ॉल्ट सेट करें',
  'Deleting...': 'हटाया जा रहा है...',
  'Delete this template?': 'यह टेम्पलेट हटाएं?',
  '"{{name}}" will be removed.': '"{{name}}" हटा दिया जाएगा।',
  'Create template': 'टेम्पलेट बनाएं',
  'Template editor help': 'टेम्पलेट संपादक सहायता',
  'Fields tab': 'फ़ील्ड टैब',
  'Style tab': 'शैली टैब',
  'Preview tab': 'पूर्वावलोकन टैब',
  'Code tab': 'कोड टैब',
  'HTML & CSS without extra elements': 'बिना अतिरिक्त तत्वों के HTML और CSS',
  'Could not save template': 'टेम्पलेट सहेजा नहीं जा सका',
  'Could not set default template': 'डिफ़ॉल्ट टेम्पलेट सेट नहीं हो सका',
  'Could not delete template': 'टेम्पलेट हटाया नहीं जा सका',
  'New template': 'नया टेम्पलेट',
  'Reset to default layout & style?': 'डिफ़ॉल्ट लेआउट और शैली पर रीसेट करें?',
  'This replaces the front, back, and CSS in the editor - tap "Save changes" to keep it. Unsaved edits are lost.':
    'यह संपादक में सामने, पीछे, और CSS बदल देता है - इसे रखने के लिए "बदलाव सहेजें" टैप करें। असहेजे बदलाव खो जाते हैं।',
  Reset: 'रीसेट करें',
  'Speaking rate': 'बोलने की गति',
  Pitch: 'पिच',
  Normal: 'सामान्य',
  'Voice (German)': 'आवाज़ (जर्मन)',
  'No German voices are installed on this device.':
    'इस डिवाइस पर कोई जर्मन आवाज़ें इंस्टॉल नहीं हैं।',
  'Device default': 'डिवाइस डिफ़ॉल्ट',
  Enhanced: 'उन्नत',
  "Voices come from the device's own text-to-speech engine - install more from your phone's system settings if you don't see the one you want.":
    'आवाज़ें डिवाइस के अपने टेक्स्ट-टू-स्पीच इंजन से आती हैं - अगर वांछित आवाज़ नहीं दिखती तो अपने फ़ोन की सिस्टम सेटिंग्स से और इंस्टॉल करें।',
  'Playing...': 'चलाया जा रहा है...',
  Test: 'परीक्षण',
  'Could not install this chunk': 'यह हिस्सा इंस्टॉल नहीं हो सका',
  'Could not remove this chunk': 'यह हिस्सा हटाया नहीं जा सका',
  'Local Dictionaries installed': 'स्थानीय शब्दकोश इंस्टॉल हो गए',
  'Installed {{count}} new chunks.': '{{count}} नए हिस्से इंस्टॉल किए गए।',
  'Could not install local dictionaries': 'स्थानीय शब्दकोश इंस्टॉल नहीं हो सके',
  '{{language}}-English Dictionary': '{{language}}-अंग्रेज़ी शब्दकोश',
  '{{installed}} installed · {{available}} available to install':
    '{{installed}} इंस्टॉल किए गए · {{available}} इंस्टॉल के लिए उपलब्ध',
  'Install all available': 'सभी उपलब्ध इंस्टॉल करें',
  Chunks: 'हिस्से',
  'Words {{start}}-{{end}}': 'शब्द {{start}}-{{end}}',
  '{{count}} words': '{{count}} शब्द',
  'Uninstall all': 'सभी अनइंस्टॉल करें',
  'Uninstalling...': 'अनइंस्टॉल हो रहा है...',
  'Local Dictionaries uninstalled': 'स्थानीय शब्दकोश अनइंस्टॉल हो गए',
  'Removed {{count}} chunks.': '{{count}} हिस्से हटा दिए गए।',
  'Could not uninstall local dictionaries': 'स्थानीय शब्दकोश अनइंस्टॉल नहीं हो सके',
  'Uninstall all local dictionaries?': 'सभी स्थानीय शब्दकोश अनइंस्टॉल करें?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'यह इस डिवाइस से हर इंस्टॉल किया हुआ हिस्सा हटा देता है। आपके डेक में पहले से जोड़े गए कार्ड प्रभावित नहीं होते।',
  'No translation to add.': 'जोड़ने के लिए कोई अनुवाद नहीं।',
  'No dictionary entry to add.': 'जोड़ने के लिए कोई शब्दकोश प्रविष्टि नहीं।',
  Details: 'विवरण',
  'More info': 'अधिक जानकारी',
  'Hide details': 'विवरण छुपाएं',
  'Context & Practical Usage': 'संदर्भ और व्यावहारिक उपयोग',
  'Understanding the {{language}} {{wordClass}} "{{headword}}"':
    '{{language}} {{wordClass}} "{{headword}}" को समझना',
  Usage: 'उपयोग',
  'Examples of Usage': 'उपयोग के उदाहरण',
  Noun: 'संज्ञा',
  Verb: 'क्रिया',
  Adjective: 'विशेषण',
  Adverb: 'क्रिया-विशेषण',
  Preposition: 'पूर्वसर्ग',
  Conjunction: 'संयोजक',
  Pronoun: 'सर्वनाम',
  Article: 'आर्टिकल',
  Phrase: 'वाक्यांश',
  Connected: 'कनेक्टेड',
  'No internet connection': 'इंटरनेट कनेक्शन नहीं है',
  'DeepL validation failed': 'DeepL सत्यापन विफल',
  '{{provider}} validation failed': '{{provider}} सत्यापन विफल',
  'Delete all API keys?': 'सभी API कुंजियाँ हटाएं?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'यह इस डिवाइस से हर प्रदाता कुंजी हटा देता है। शब्दावली और प्रगति प्रभावित नहीं होती।',
  'Limited mode': 'सीमित मोड',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    'जनरेशन कुंजी के बिना, AI से कार्ड बनाना अक्षम है। अनुवाद और मैन्युअल कार्ड अभी भी काम करते हैं। पूर्ण अनुभव के लिए नीचे किसी प्रदाता में कुंजी जोड़ें।',
  "Couldn't load saved settings": 'सहेजी गई सेटिंग्स लोड नहीं हो सकीं',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key - nothing is sent until you generate a card.':
    'कार्ड जनरेशन (अर्थ, उदाहरण, समूह, वाक्यांश, क्लोज़) नीचे कॉन्फ़िगर और सक्षम किए गए प्रदाता का उपयोग करता है। अपनी खुद की API कुंजी लाएं - जब तक आप कार्ड जनरेट नहीं करते तब तक कुछ नहीं भेजा जाता।',
  'Active provider': 'सक्रिय प्रदाता',
  Model: 'मॉडल',
  'Paste your {{provider}} API key...': 'अपनी {{provider}} API कुंजी पेस्ट करें...',
  'Hide {{provider}} API key': '{{provider}} API कुंजी छिपाएं',
  'Show {{provider}} API key': '{{provider}} API कुंजी दिखाएं',
  'Validate key': 'कुंजी सत्यापित करें',
  Clear: 'साफ़ करें',
  'Device-observed usage': 'डिवाइस पर देखा गया उपयोग',
  '{{count}} requests': '{{count}} अनुरोध',
  '{{count}} tokens': '{{count}} टोकन',
  'Open {{provider}} usage ↗': '{{provider}} उपयोग खोलें ↗',
  'Google Translate': 'Google अनुवाद',
  'Free tier, no key needed': 'मुफ़्त स्तर, कोई कुंजी आवश्यक नहीं',
  'Uses this provider\'s key above': 'इस प्रदाता की ऊपर वाली कुंजी का उपयोग करता है',
  'Add a key above to enable': 'सक्षम करने के लिए ऊपर एक कुंजी जोड़ें',
  Active: 'सक्रिय',
  'Best German↔English quality - bring your own key':
    'सर्वश्रेष्ठ जर्मन↔अंग्रेज़ी गुणवत्ता - अपनी खुद की कुंजी लाएं',
  'Hide DeepL settings': 'DeepL सेटिंग्स छिपाएं',
  'Show DeepL settings': 'DeepL सेटिंग्स दिखाएं',
  'Paste your DeepL API key...': 'अपनी DeepL API कुंजी पेस्ट करें...',
  Enabled: 'सक्षम',
  'Open DeepL usage ↗': 'DeepL उपयोग खोलें ↗',
  'v0.0.1 · offline-first · your data stays on device':
    'v0.0.1 · ऑफ़लाइन-फर्स्ट · आपका डेटा डिवाइस पर ही रहता है',
  'Delete this card?': 'क्या इस कार्ड को मिटाएं?',
  'This permanently deletes this card and all its meanings, examples, synonyms, phrases, and cloze variations. This cannot be undone.':
    'यह इस कार्ड और इसके सभी अर्थों, उदाहरणों, समानार्थी शब्दों, वाक्यांशों और क्लोज़ रूपांतरों को स्थायी रूप से हटा देता है। इसे वापस नहीं किया जा सकता।',
  'Could not delete this card': 'इस कार्ड को नहीं मिटाया जा सका',
  'Semantic Contexts': 'अर्थगत संदर्भ',
  '{{count}} contexts': '{{count}} संदर्भ',
  'Opening your vocabulary...': 'आपकी शब्दावली खोली जा रही है...',
  'Import & Export': 'आयात और निर्यात',
  'Import CSV': 'CSV आयात करें',
  'Import Anki deck': 'Anki डेक आयात करें',
  'Card Templates': 'कार्ड टेम्पलेट',
  '"Add to deck" at the bottom is how you start reviewing this word - you can add it to more than one deck, or create a new one on the spot.':
    '"Add to deck" नीचे दिया गया है और इस शब्द की रिव्यू शुरू करने का तरीका है - आप इसे एक से ज़्यादा डेक में जोड़ सकते हैं, या तुरंत एक नया डेक बना सकते हैं।',
  '"Ask AI" opens a small chat where you can type a follow-up question about this specific word.':
    '"Ask AI" एक छोटी चैट खोलता है, जहां आप इस शब्द से जुड़ा कोई और सवाल टाइप कर सकते हैं।',
  '"Explain" (or "More info" on an AI-generated card) shows or expands a direct explanation of what the word means and where or why it\'s used.':
    '"Explain" (या AI-जनरेटेड कार्ड पर "More info") शब्द का सीधा मतलब और उसे कहां या क्यों इस्तेमाल किया जाता है, यह दिखाता या खोलता है।',
  '"Follow device" just matches whatever language your phone is already set to.':
    '"Follow device" बस आपके फ़ोन की मौजूदा भाषा से मेल खाता है।',
  '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.':
    '"Generate with AI" आपके Settings में सेट किए गए AI प्रोवाइडर की मदद से अर्थ, उदाहरण, व्याकरण और बाकी सब कुछ वाला पूरा एक्सप्लेनेशन कार्ड बनाता है।',
  'The "AI Insights" preview gives a short, direct explanation of what the word means and where or why it\'s used - tap it any time to generate the full flashcard.':
    '"AI Insights" प्रीव्यू शब्द का सीधा और छोटा मतलब और उसे कहां या क्यों इस्तेमाल किया जाता है, यह बताता है - पूरा फ्लैशकार्ड बनाने के लिए इसे कभी भी टैप करें।',
  "\"Regenerate\" throws away this card's meanings, examples, synonyms, phrases, and cloze cards, and generates all of it fresh - useful if the current version isn't working for you. This can't be undone.":
    '"Regenerate" इस कार्ड के अर्थ, उदाहरण, समानार्थी शब्द, वाक्यांश और क्लोज़ कार्ड हटाकर सब कुछ नए सिरे से बनाता है - अगर मौजूदा वर्शन आपके काम का नहीं है तो यह मददगार है। इसे वापस नहीं किया जा सकता।',
  '"Test active engine" plays the Test phrase through whichever engine is marked Active - the same thing any real speaker button in the app does.':
    '"Test active engine" जो भी इंजन Active मार्क है, उसके ज़रिए Test phrase चलाता है - बिल्कुल वैसे ही जैसे ऐप का कोई भी असली स्पीकर बटन करता है।',
  'A cloze card blanks out part of a sentence for you to fill in - a different way of practicing the same word.':
    'क्लोज़ कार्ड वाक्य के किसी हिस्से को खाली छोड़ देता है ताकि आप उसे भरें - यह उसी शब्द को प्रैक्टिस करने का एक अलग तरीका है।',
  'A green checkmark means the word is already in one of your decks.':
    'हरा चेकमार्क दिखाता है कि यह शब्द आपके किसी डेक में पहले से मौजूद है।',
  'A short summary': 'एक छोटा सारांश',
  'AI Providers': 'AI प्रोवाइडर्स',
  'AI-generated - explanations can be inaccurate. Check important details against a trusted reference.':
    'AI-जनरेटेड - व्याख्या ग़लत भी हो सकती है। ज़रूरी जानकारी को किसी भरोसेमंद स्रोत से ज़रूर जांच लें।',
  'On an AI-generated card, the short explanation right below the translation states directly what the word means and where or why it\'s used - not a hint to figure out yourself.':
    'AI-जनरेटेड कार्ड पर, अनुवाद के ठीक नीचे दी गई छोटी व्याख्या सीधे बताती है कि शब्द का मतलब क्या है और उसे कहां या क्यों इस्तेमाल किया जाता है - यह कोई पहेली नहीं है जिसे आपको खुद सुलझाना हो।',
  'Accent color swatches write a custom property at the top of your CSS:':
    'Accent कलर स्वॉच आपके CSS के ऊपर एक कस्टम प्रॉपर्टी लिख देते हैं:',
  'Add "{{term}}" to...': '"{{term}}" को इसमें जोड़ें...',
  'Add a key in AI Providers to enable': 'इसे चालू करने के लिए AI Providers में एक key जोड़ें',
  'Add a sentence by typing it, pasting it from your clipboard, or sharing text here from another app.':
    'वाक्य टाइप करके, क्लिपबोर्ड से पेस्ट करके, या किसी और ऐप से टेक्स्ट शेयर करके यहां जोड़ें।',
  'Add card': 'कार्ड जोड़ें',
  'Add card manually': 'कार्ड खुद जोड़ें',
  'Add to Lemmory': 'Lemmory में जोड़ें',
  'Add to Mining queue': 'Mining क्यू में जोड़ें',
  'Add your AI provider key in Settings to ask a follow-up.':
    'फॉलो-अप सवाल पूछने के लिए Settings में अपनी AI provider key जोड़ें।',
  'Add your AI provider key in Settings to regenerate this card.':
    'इस कार्ड को दोबारा जनरेट करने के लिए Settings में अपनी AI provider key जोड़ें।',
  'Adding from other apps': 'दूसरे ऐप्स से जोड़ना',
  'Adding to a deck': 'डेक में जोड़ना',
  'All caught up - nothing due right now.': 'सब पूरा हो गया - अभी कुछ भी ड्यू नहीं है।',
  'Alternatively, generate a new key from a project that already has it enabled (or the "Default project" if you have one).':
    'इसके बजाय, ऐसे प्रोजेक्ट से नई key बनाएं जिसमें यह पहले से चालू हो (या अगर आपके पास हो तो "Default project" से)।',
  'Always open Search, split between Search and the Mining queue depending on how much text it is, or ask you every time.':
    'हमेशा Search खोलें, टेक्स्ट की लंबाई के हिसाब से Search और Mining क्यू के बीच बांट दें, या हर बार आपसे पूछें।',
  Answer: 'जवाब',
  'App version, platform, and feature tier - helps reproduce a bug.':
    'ऐप वर्शन, प्लेटफ़ॉर्म और फ़ीचर टियर - बग को दोबारा समझने में मदद करता है।',
  'App {{version}} · {{platform}} · {{tier}}': 'ऐप {{version}} · {{platform}} · {{tier}}',
  'Applies across the app.': 'यह पूरे ऐप पर लागू होता है।',
  Ask: 'पूछें',
  'Ask AI': 'Ask AI',
  'Ask a follow-up question, maximum {{max}} characters':
    'फॉलो-अप सवाल पूछें, अधिकतम {{max}} अक्षर',
  'Ask a short follow-up...': 'कोई छोटा फॉलो-अप सवाल पूछें...',
  'Asking...': 'पूछ रहे हैं...',
  'At most every': 'ज़्यादा से ज़्यादा हर',
  'Audio Settings': 'ऑडियो सेटिंग्स',
  'Audio Settings help': 'ऑडियो सेटिंग्स सहायता',
  'Audio settings, app language': 'ऑडियो सेटिंग्स, ऐप की भाषा',
  'Aura-2. Once your key is entered, choose from Deepgram\'s available models, or switch to manual entry to enter a model name directly (see Deepgram\'s docs for exact names).':
    'Aura-2. आपकी key डालने के बाद, Deepgram के उपलब्ध मॉडल में से चुनें, या मॉडल नाम सीधे डालने के लिए मैनुअल एंट्री पर स्विच करें (सही नाम के लिए Deepgram के डॉक्स देखें)।',
  'Automatic sync': 'ऑटोमैटिक सिंक',
  CSS: 'CSS',
  CSV: 'CSV',
  'Choose a voice...': 'एक आवाज़ चुनें...',
  'Choose from your {{provider}} voices instead':
    'इसके बजाय अपनी {{provider}} आवाज़ों में से चुनें',
  'Choosing what to keep': 'क्या रखना है, यह चुनना',
  'Cloud providers are bring-your-own-key - nothing is sent to them until you tap a speaker icon or press Test.':
    'क्लाउड प्रोवाइडर्स bring-your-own-key वाले हैं - जब तक आप स्पीकर आइकन टैप न करें या Test न दबाएं, उन्हें कुछ भी नहीं भेजा जाता।',
  'Comma-separated': 'कॉमा से अलग किए गए',
  'Could not add card': 'कार्ड नहीं जोड़ा जा सका',
  'Could not create deck': 'डेक नहीं बनाया जा सका',
  'Could not generate an example': 'उदाहरण जनरेट नहीं हो सका',
  'Could not get an answer': 'जवाब नहीं मिल सका',
  'Could not regenerate this card': 'यह कार्ड दोबारा जनरेट नहीं हो सका',
  'Could not remove card': 'कार्ड हटाया नहीं जा सका',
  'Could not reset progress': 'प्रोग्रेस रीसेट नहीं हो सका',
  'Could not sign in': 'साइन इन नहीं हो सका',
  Create: 'बनाएं',
  'Create & select': 'बनाएं और चुनें',
  'Create new deck': 'नया डेक बनाएं',
  'Creating a GitHub issue needs a token with write access to the repo - that can never ship inside the app, since a compiled build can be decompiled and any embedded secret treated as public.':
    'GitHub issue बनाने के लिए repo पर write एक्सेस वाला token चाहिए - यह कभी भी ऐप के अंदर नहीं भेजा जा सकता, क्योंकि किसी भी compiled build को decompile किया जा सकता है और उसमें छिपाई गई कोई भी सीक्रेट जानकारी सार्वजनिक मानी जाएगी।',
  Deepgram: 'Deepgram',
  'Default: {{voice}}': 'डिफ़ॉल्ट: {{voice}}',
  'Delete All AI Providers Keys': 'सभी AI Provider Keys डिलीट करें',
  'Delete all AI provider keys?': 'सभी AI provider keys डिलीट करें?',
  'Depending on a setting in Settings, under "Share & Search," a shared sentence might land here right away, or you might get asked what to do with it first.':
    'Settings में "Share & Search" के तहत की गई सेटिंग के हिसाब से, शेयर किया गया वाक्य सीधे यहां आ सकता है, या पहले आपसे पूछा जा सकता है कि उसका क्या करना है।',
  'Device (built-in)': 'डिवाइस (बिल्ट-इन)',
  'Display on Flashcard': 'फ्लैशकार्ड पर दिखाएं',
  'Each provider\'s own "Test this provider" button plays through that card\'s current key/voice/speed directly, regardless of which engine is Active - use it to check a setup before switching to it.':
    'हर प्रोवाइडर का अपना "Test this provider" बटन उस कार्ड की मौजूदा key/voice/speed से सीधे प्ले करता है, चाहे कोई भी इंजन Active हो - किसी सेटअप पर स्विच करने से पहले उसे जांचने के लिए इसका इस्तेमाल करें।',
  'Each row is one piece of card data. Tap "Front" or "Back" to show that field on that side - a field can appear on both, on neither, or on just one.':
    'हर रो कार्ड डेटा का एक हिस्सा है। उस साइड पर वह फ़ील्ड दिखाने के लिए "Front" या "Back" टैप करें - कोई फ़ील्ड दोनों तरफ़, किसी भी तरफ़ नहीं, या सिर्फ़ एक तरफ़ दिख सकती है।',
  ElevenLabs: 'ElevenLabs',
  'Email (Optional)': 'ईमेल (वैकल्पिक)',
  'Enter the word first.': 'पहले शब्द डालें।',
  'Every card in "{{name}}" goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    '"{{name}}" के हर कार्ड की स्थिति वापस "new" हो जाएगी - शब्द-अर्थ रिव्यू और क्लोज़ प्रैक्टिस दोनों शुरुआत से फिर से शुरू होंगे। आपकी रिव्यू हिस्ट्री सुरक्षित रहेगी। इसे वापस नहीं किया जा सकता।',
  'Every card in this deck goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    'इस डेक के हर कार्ड की स्थिति वापस "new" हो जाएगी - शब्द-अर्थ रिव्यू और क्लोज़ प्रैक्टिस दोनों शुरुआत से फिर से शुरू होंगे। आपकी रिव्यू हिस्ट्री सुरक्षित रहेगी। इसे वापस नहीं किया जा सकता।',
  'Every speaker button in the app uses whichever engine is marked Active below.':
    'ऐप का हर स्पीकर बटन नीचे Active मार्क किए गए इंजन का इस्तेमाल करता है।',
  'Everything in the queue is selected by default. Tap a card to include or leave it out, or use the trash icon to remove it for good.':
    'क्यू में मौजूद हर चीज़ डिफ़ॉल्ट रूप से चुनी हुई है। किसी कार्ड को शामिल करने या हटाने के लिए उसे टैप करें, या हमेशा के लिए हटाने के लिए ट्रैश आइकन इस्तेमाल करें।',
  'Everything renders inside a real WebView, so standard CSS applies as on any web page - flexbox, custom fonts via @font-face, transitions, etc. all work; there is no special "app CSS" subset to learn beyond this.':
    'सब कुछ एक असली WebView के अंदर रेंडर होता है, इसलिए स्टैंडर्ड CSS वैसे ही लागू होता है जैसे किसी भी वेब पेज पर - flexbox, @font-face से कस्टम फ़ॉन्ट, transitions, वगैरह सब काम करते हैं; सीखने के लिए इसके अलावा कोई खास "app CSS" सबसेट नहीं है।',
  'Example sentences': 'उदाहरण वाक्य',
  'Example sentences show the word used in context, with a translation underneath.':
    'उदाहरण वाक्य शब्द को संदर्भ में दिखाते हैं, साथ में नीचे उसका अनुवाद भी होता है।',
  'Examples generated from a selected option get a highlighted background, so you can tell which ones came from your request.':
    'चुने गए विकल्प से जनरेट हुए उदाहरणों का बैकग्राउंड हाइलाइट हो जाता है, ताकि आप पहचान सकें कि कौन-से आपके अनुरोध से आए हैं।',
  'Explain, Ask AI & more': 'Explain, Ask AI और भी बहुत कुछ',
  'Explanations and the "More info" follow-up use this language.':
    'व्याख्या और "More info" फॉलो-अप इसी भाषा में होते हैं।',
  'Exporting...': 'एक्सपोर्ट हो रहा है...',
  Expression: 'वाक्यांश',
  'Fields added via the toggles are never auto-wrapped in a <div> or <span> - {{ word }} renders as bare text directly inside the card body. That keeps generated templates minimal, but it means a rule like ".word { ... }" has nothing to match unless you add that class yourself.':
    'टॉगल से जोड़ी गई फ़ील्ड कभी अपने आप <div> या <span> में रैप नहीं होतीं - {{ word }} कार्ड बॉडी के अंदर सीधे खाली टेक्स्ट की तरह रेंडर होता है। इससे जनरेट किए गए टेम्पलेट्स मिनिमल रहते हैं, लेकिन इसका मतलब है कि ".word { ... }" जैसा नियम तब तक किसी चीज़ से मैच नहीं करेगा जब तक आप खुद वह क्लास न जोड़ें।',
  "Found a sentence somewhere else, like an article or a message? Share it to Lemmory the same way you'd share it to any other app.":
    'कहीं और, जैसे किसी आर्टिकल या मैसेज में कोई वाक्य मिला? उसे Lemmory में वैसे ही शेयर करें जैसे आप किसी और ऐप में शेयर करते हैं।',
  'Front and Back are raw Liquid templates - anything valid Liquid works here, not just what the Fields toggles generate.':
    'Front और Back कच्चे (raw) Liquid टेम्पलेट हैं - यहां कोई भी वैध Liquid काम करेगा, सिर्फ़ Fields टॉगल से जनरेट हुआ ही नहीं।',
  "Front and Back are separate - the chip above the card switches which side is rendered, so you always know exactly which side you're looking at.":
    'Front और Back अलग-अलग हैं - कार्ड के ऊपर की चिप बताती है कि कौन-सी साइड रेंडर हो रही है, ताकि आपको हमेशा पता रहे कि आप किस साइड को देख रहे हैं।',
  Full: 'पूरा (Full)',
  Gender: 'लिंग (Gender)',
  General: 'सामान्य',
  'General settings help': 'सामान्य सेटिंग्स सहायता',
  'Generated with AI - not from your installed dictionary.':
    'AI से जनरेट किया गया - आपकी इंस्टॉल की गई डिक्शनरी से नहीं।',
  'Generating your card...': 'आपका कार्ड जनरेट हो रहा है...',
  'Generation came back incomplete - nothing was changed. Try again.':
    'जनरेशन अधूरा आया - कुछ भी नहीं बदला गया। दोबारा कोशिश करें।',
  'Go to platform.openai.com > Settings > Projects > select the project this key belongs to > Models > enable gpt-4o-mini-tts for that project.':
    'platform.openai.com पर जाएं > Settings > Projects > वह प्रोजेक्ट चुनें जिससे यह key जुड़ी है > Models > उस प्रोजेक्ट के लिए gpt-4o-mini-tts चालू करें।',
  'Hide DeepL API key': 'DeepL API key छुपाएं',
  'How Audio Settings works': 'ऑडियो सेटिंग्स कैसे काम करती हैं',
  'I speak': 'मैं बोलता/बोलती हूं',
  "I'm learning": 'मैं सीख रहा/रही हूं',
  'If Validate says a project doesn\'t have access to gpt-4o-mini-tts, but the model works fine on platform.openai.com, your API key is scoped to a specific OpenAI Project that hasn\'t enabled it.':
    'अगर Validate कहता है कि किसी प्रोजेक्ट के पास gpt-4o-mini-tts का एक्सेस नहीं है, लेकिन platform.openai.com पर मॉडल ठीक काम करता है, तो आपकी API key किसी खास OpenAI प्रोजेक्ट तक सीमित है जिसने इसे चालू नहीं किया है।',
  'If a cloud key is invalid, the provider is unreachable, or a request fails, playback falls back to the device voice automatically - you\'re never left with silence.':
    'अगर क्लाउड key अमान्य है, प्रोवाइडर तक पहुंचा नहीं जा सकता, या कोई रिक्वेस्ट फेल हो जाती है, तो प्लेबैक अपने आप डिवाइस की आवाज़ पर वापस आ जाता है - आपको कभी खामोशी का सामना नहीं करना पड़ता।',
  "If a word isn't in your library yet, you may see a quick built-in dictionary entry and/or a translation preview - both are read-only until you choose to add one to a deck.":
    'अगर कोई शब्द अभी आपकी लाइब्रेरी में नहीं है, तो आपको एक झलक के तौर पर बिल्ट-इन डिक्शनरी एंट्री और/या अनुवाद प्रीव्यू दिख सकता है - जब तक आप उसे किसी डेक में जोड़ने का फ़ैसला न करें, दोनों सिर्फ़ देखने के लिए हैं।',
  'If no model is picked, a default is chosen to match whatever language is set under Settings > Learning > "I\'m learning" (English, German, Spanish, or French) - other languages fall back to an English voice until you pick one manually.':
    'अगर कोई मॉडल नहीं चुना गया है, तो Settings > Learning > "I\'m learning" में सेट भाषा (अंग्रेज़ी, जर्मन, स्पैनिश, या फ़्रेंच) के हिसाब से एक डिफ़ॉल्ट चुना जाता है - बाकी भाषाओं के लिए, जब तक आप खुद कोई न चुनें, अंग्रेज़ी आवाज़ इस्तेमाल होती है।',
  'If no voice is picked, a known-good multilingual default voice is used automatically.':
    'अगर कोई आवाज़ नहीं चुनी गई है, तो एक भरोसेमंद मल्टीलिंगुअल डिफ़ॉल्ट आवाज़ अपने आप इस्तेमाल हो जाती है।',
  'If this word has more than one distinct sense - say, a casual meaning and a business one - you\'ll see small labeled capsules (like "social" or "formal") just above the translation. Tap one to switch; each keeps its own examples and synonyms.':
    'अगर इस शब्द के एक से ज़्यादा अलग अर्थ हैं - जैसे एक कैज़ुअल और एक बिज़नेस अर्थ - तो अनुवाद के ठीक ऊपर आपको छोटे लेबल वाले कैप्सूल (जैसे "social" या "formal") दिखेंगे। बदलने के लिए किसी एक को टैप करें; हर एक के अपने उदाहरण और समानार्थी शब्द होते हैं।',
  'Import & export, templates, local dictionaries':
    'इम्पोर्ट व एक्सपोर्ट, टेम्पलेट्स, लोकल डिक्शनरी',
  'Include diagnostics': 'डायग्नोस्टिक्स शामिल करें',
  'Inflected or conjugated forms work too, not just the base/dictionary form of a word.':
    'सिर्फ़ शब्द का बेस/डिक्शनरी रूप ही नहीं, बल्कि विभक्त (inflected) या क्रिया-रूपांतरित (conjugated) रूप भी काम करते हैं।',
  'Install more voices from your phone\'s system settings if the one you want isn\'t listed.':
    'अगर आपकी पसंद की आवाज़ लिस्ट में नहीं है, तो अपने फ़ोन की सिस्टम सेटिंग्स से और आवाज़ें इंस्टॉल करें।',
  'Installing...': 'इंस्टॉल हो रहा है...',
  'Key validated': 'Key वैलिडेट हो गई',
  'Last synced: {{when}}': 'आख़िरी सिंक: {{when}}',
  'List fields (Other meanings, Synonyms, Related phrases) already need a {% for %} loop to render at all - that loop is structurally required, not a styling choice. To style each item individually, wrap the item inside the loop:':
    'लिस्ट फ़ील्ड (Other meanings, Synonyms, Related phrases) को रेंडर होने के लिए पहले से ही {% for %} लूप चाहिए होता है - यह लूप स्ट्रक्चर के लिहाज़ से ज़रूरी है, स्टाइलिंग का विकल्प नहीं। हर आइटम को अलग से स्टाइल करने के लिए, आइटम को लूप के अंदर रैप करें:',
  'Long-press a word in any app and pick "Search in Lemmory" to look it up here right away.':
    'किसी भी ऐप में किसी शब्द को लॉन्ग-प्रेस करें और "Search in Lemmory" चुनें, ताकि उसे तुरंत यहां देख सकें।',
  'Long-press a word in any app - your browser, messages, anywhere - and pick "Search in Lemmory." It opens right here with that word ready to go.':
    'किसी भी ऐप में - ब्राउज़र, मैसेज, कहीं भी - किसी शब्द को लॉन्ग-प्रेस करें और "Search in Lemmory" चुनें। यह उस शब्द के साथ सीधे यहां खुल जाएगा।',
  Markdown: 'Markdown',
  Message: 'मैसेज',
  'Mine help': 'Mine सहायता',
  'Mine is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    'Mine उन वाक्यों को रखने की जगह है जिन्हें आप बाद में वोकैबुलरी कार्ड में बदलना चाहते हैं - यहां कुछ भी अपने आप नहीं होता।',
  Never: 'कभी नहीं',
  'Never included: word content, translations, AI responses, or API keys.':
    'कभी शामिल नहीं होता: शब्द का कंटेंट, अनुवाद, AI के जवाब, या API keys।',
  'New deck name': 'नए डेक का नाम',
  'New words are looked up and generated in this language.':
    'नए शब्द इसी भाषा में खोजे और जनरेट किए जाते हैं।',
  'No AI provider active - open Settings': 'कोई AI provider चालू नहीं है - Settings खोलें',
  'No AI provider is active - add and enable one in Settings to generate new words':
    'कोई AI provider चालू नहीं है - नए शब्द जनरेट करने के लिए Settings में एक जोड़ें और चालू करें',
  'No AI provider is active - add and enable one to generate targeted examples.':
    'कोई AI provider चालू नहीं है - टारगेटेड उदाहरण जनरेट करने के लिए एक जोड़ें और चालू करें।',
  'No AI provider is active.': 'कोई AI provider चालू नहीं है।',
  'No AI provider is active. Add and enable one in Settings to generate cards.':
    'कोई AI provider चालू नहीं है। कार्ड जनरेट करने के लिए Settings में एक जोड़ें और चालू करें।',
  'No AI provider is active. Add and enable one in Settings to generate examples.':
    'कोई AI provider चालू नहीं है। उदाहरण जनरेट करने के लिए Settings में एक जोड़ें और चालू करें।',
  'No AI provider is active. Add and enable one in Settings to generate words.':
    'कोई AI provider चालू नहीं है। शब्द जनरेट करने के लिए Settings में एक जोड़ें और चालू करें।',
  'No decks yet - create one above.': 'अभी तक कोई डेक नहीं - ऊपर से एक बनाएं।',
  'No provider configured - AI generation disabled': 'कोई प्रोवाइडर सेट नहीं है - AI जनरेशन बंद है',
  'No settings match "{{query}}"': '"{{query}}" से कोई सेटिंग मेल नहीं खाती',
  'No {{language}} voices are installed on this device.':
    'इस डिवाइस पर कोई {{language}} आवाज़ इंस्टॉल नहीं है।',
  'Not supported yet': 'अभी सपोर्टेड नहीं है',
  'Match your native language too?': 'क्या आपकी मातृभाषा भी बदलें?',
  'You just set the app language to {{language}}. Also set "I speak" to match?':
    'आपने अभी ऐप की भाषा {{language}} पर सेट की है। क्या "मैं बोलता/बोलती हूँ" भी इससे मिलाएं?',
  'Match the app language too?': 'क्या ऐप की भाषा भी बदलें?',
  'You just set "I speak" to {{language}}. Switch the app\'s own language to match?':
    'आपने अभी "मैं बोलता/बोलती हूँ" {{language}} पर सेट की है। क्या ऐप की भाषा भी इससे मिलाएं?',
  'Yes, switch it': 'हाँ, बदलें',
  'No, keep it': 'नहीं, ऐसे ही रहने दें',
  'Nothing to add.': 'जोड़ने के लिए कुछ नहीं है।',
  'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.':
    'सिर्फ़ ऐप वर्शन, प्लेटफ़ॉर्म, और आपका मौजूदा फ़ीचर टियर (Full या Translation-only) - बग को दोबारा समझने के लिए बस इतना काफ़ी है।',
  'Only bother with this if you want to be selective - otherwise everything gets turned into cards together.':
    'अगर आप चुन-चुन कर करना चाहते हैं तभी इसकी परवाह करें - वरना सब कुछ एक साथ कार्ड में बदल जाता है।',
  'Only if you want a reply - also becomes public once posted.':
    'सिर्फ़ तब भरें जब आपको जवाब चाहिए - पोस्ट होने के बाद यह भी सार्वजनिक हो जाता है।',
  'Open Settings': 'Settings खोलें',
  OpenAI: 'OpenAI',
  'Or enter an ID manually': 'या ID खुद डालें',
  'Phrases show this word used in common expressions or word combinations.':
    'वाक्यांश (Phrases) इस शब्द को आम अभिव्यक्तियों या शब्द-संयोजनों में इस्तेमाल होते हुए दिखाते हैं।',
  'Pick a look for the whole app, from bright to dark and everything between.':
    'पूरे ऐप के लिए एक लुक चुनें - हल्के से गहरे रंग तक, और बीच का सब कुछ।',
  'Picking a swatch again (or none) removes the line - it never conflicts with CSS you write by hand elsewhere in the box.':
    'स्वॉच को दोबारा चुनने (या कोई नहीं चुनने) से वह लाइन हट जाती है - यह बॉक्स में कहीं भी आपके खुद लिखे CSS से कभी नहीं टकराता।',
  "Please don't include anything private in your message.":
    'कृपया अपने मैसेज में कोई निजी जानकारी न डालें।',
  'Practice reverse': 'उल्टा प्रैक्टिस करें',
  'Practice words': 'शब्द प्रैक्टिस करें',
  'Practice {{count}} cloze': '{{count}} क्लोज़ प्रैक्टिस करें',
  'Reference it anywhere in your own CSS rules, e.g.:':
    'इसे अपने CSS नियमों में कहीं भी इस्तेमाल करें, जैसे:',
  Regenerate: 'दोबारा जनरेट करें',
  'Regenerate this card?': 'इस कार्ड को दोबारा जनरेट करें?',
  Remove: 'हटाएं',
  'Remove {{count}}': '{{count}} हटाएं',
  'Remove {{count}} cards from this deck?': 'इस डेक से {{count}} कार्ड हटाएं?',
  'Removing...': 'हटाया जा रहा है...',
  'Rendering goes through the exact same LiquidJS + WebView pipeline the review session uses, with one fixed sample word ("ausgehen") standing in for your real vocabulary.':
    'रेंडरिंग वही LiquidJS + WebView पाइपलाइन इस्तेमाल करती है जो रिव्यू सेशन में इस्तेमाल होती है, बस आपकी असली वोकैबुलरी की जगह एक तय सैंपल शब्द ("ausgehen") इस्तेमाल होता है।',
  'Report an issue or request a feature': 'कोई समस्या बताएं या फ़ीचर का अनुरोध करें',
  'Reset progress': 'प्रोग्रेस रीसेट करें',
  'Reset progress?': 'प्रोग्रेस रीसेट करें?',
  'Reset to default?': 'डिफ़ॉल्ट पर रीसेट करें?',
  'Resetting...': 'रीसेट हो रहा है...',
  "Review your captures. Discard what you don't need, then generate cards for the rest.":
    'अपने कैप्चर किए गए वाक्यों को देखें। जिनकी ज़रूरत नहीं उन्हें हटाएं, फिर बाकी के लिए कार्ड जनरेट करें।',
  'Review {{count}} words': '{{count}} शब्दों को रिव्यू करें',
  'Saving...': 'सेव हो रहा है...',
  'Search from anywhere': 'कहीं से भी सर्च करें',
  'Search help': 'सर्च सहायता',
  'Search in German ("ausgeh...") or English ("go out").\\nInflected forms like "ging aus" work too.':
    'जर्मन ("ausgeh...") या अंग्रेज़ी ("go out") में सर्च करें।\\n"ging aus" जैसे विभक्त रूप भी काम करते हैं।',
  'Search settings': 'सर्च सेटिंग्स',
  'Search this': 'इसे सर्च करें',
  'Select cards': 'कार्ड चुनें',
  'Selectors that work with zero extra markup (they target the card body itself or elements this app already emits):':
    'ऐसे सिलेक्टर जो बिना किसी अतिरिक्त मार्कअप के काम करते हैं (ये सीधे कार्ड बॉडी या ऐप द्वारा पहले से जनरेट किए गए एलिमेंट्स को टारगेट करते हैं):',
  'Send Feedback': 'फ़ीडबैक भेजें',
  'Send Feedback help': 'फ़ीडबैक भेजें सहायता',
  'Sentence (use [...] for the gap)': 'वाक्य (खाली जगह के लिए [...] इस्तेमाल करें)',
  'Sentence translation': 'वाक्य का अनुवाद',
  'Share & Search': 'Share & Search',
  'Show DeepL API key': 'DeepL API key दिखाएं',
  'Shown on flashcard': 'फ्लैशकार्ड पर दिखाया गया',
  'Sign in with Google': 'Google से साइन इन करें',
  'Sign out': 'साइन आउट करें',
  'Signing in...': 'साइन इन हो रहा है...',
  'Speaking speed': 'बोलने की स्पीड',
  'Speaking speed isn\'t configurable for this provider yet.':
    'इस प्रोवाइडर के लिए बोलने की स्पीड अभी सेट नहीं की जा सकती।',
  'Speech engine': 'स्पीच इंजन',
  "Submitting posts your message as a GitHub issue on Lemmory's public repository - anyone can read it, including your contact email if you provide one.":
    'सबमिट करने पर आपका मैसेज Lemmory की पब्लिक repository पर एक GitHub issue के तौर पर पोस्ट हो जाता है - इसे कोई भी पढ़ सकता है, आपकी दी गई कॉन्टैक्ट ईमेल समेत।',
  Sync: 'सिंक',
  'Sync decks, cards, and progress to a Google account':
    'डेक, कार्ड और प्रोग्रेस को Google अकाउंट में सिंक करें',
  'Sync failed': 'सिंक नहीं हो सका',
  'Sync not connected': 'सिंक कनेक्ट नहीं है',
  'Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.':
    'अपने डेक और रिव्यू प्रोग्रेस को अलग-अलग डिवाइस पर सिंक करने के लिए Settings > Sync में जाकर अपना Google अकाउंट कनेक्ट करें।',
  'Sync in the background whenever you leave the app, at most this often':
    'जब भी आप ऐप छोड़ें, बैकग्राउंड में सिंक करें, ज़्यादा से ज़्यादा इतनी बार',
  'Sync now': 'अभी सिंक करें',
  'Sync your decks, cards, and review progress to a Google account so they carry over to another device. API keys are never synced.':
    'अपने डेक, कार्ड और रिव्यू प्रोग्रेस को Google अकाउंट में सिंक करें ताकि वे दूसरे डिवाइस पर भी मिलें। API keys कभी सिंक नहीं होतीं।',
  Synced: 'सिंक हो गया',
  'Syncing...': 'सिंक हो रहा है...',
  'Synonyms & phrases': 'समानार्थी शब्द व वाक्यांश',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. You can rate or flag one the same way as an example.':
    'समानार्थी शब्द वे शब्द हैं जिनका अर्थ मिलता-जुलता है, जो इस शब्द के आसपास आपकी वोकैबुलरी बढ़ाने में मददगार हैं। आप इन्हें भी किसी उदाहरण की तरह रेट या फ़्लैग कर सकते हैं।',
  'Tap the star on any example to choose which one appears on your flashcard - only one shows at a time.':
    'किसी भी उदाहरण पर स्टार टैप करके चुनें कि आपके फ्लैशकार्ड पर कौन-सा दिखेगा - एक बार में सिर्फ़ एक ही दिखता है।',
  'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.':
    '"Add to deck" टैप करने पर हमेशा पूछा जाता है कि शब्द किस डेक में जोड़ना है, और आप तुरंत एक बिल्कुल नया डेक भी बना सकते हैं।',
  'Test active engine': 'एक्टिव इंजन टेस्ट करें',
  'Test phrase': 'टेस्ट वाक्यांश',
  'Test this provider': 'इस प्रोवाइडर को टेस्ट करें',
  'Testing a voice': 'आवाज़ टेस्ट करना',
  'Text to speak when testing': 'टेस्ट के दौरान बोला जाने वाला टेक्स्ट',
  'Thanks for the feedback': 'फ़ीडबैक के लिए धन्यवाद',
  'The "Available template variables" card lists every field name you can reference, with a one-line description of what it holds.':
    '"Available template variables" कार्ड में हर उस फ़ील्ड का नाम है जिसे आप इस्तेमाल कर सकते हैं, साथ में एक लाइन में यह बताया गया है कि उसमें क्या होता है।',
  'The CSS box applies to both the front and back - there is one stylesheet per template, not one per side.':
    'CSS बॉक्स फ्रंट और बैक दोनों पर लागू होता है - हर टेम्पलेट के लिए एक स्टाइलशीट होती है, हर साइड के लिए अलग नहीं।',
  'The button at the bottom turns your selected sentences into real vocabulary cards, one at a time.':
    'नीचे दिया बटन आपके चुने गए वाक्यों को एक-एक करके असली वोकैबुलरी कार्ड में बदल देता है।',
  'The card fills the available screen space exactly (no scrolling) and the caption above it shows its real, on-device measured width and height in points - the same size a card gets during an actual review session.':
    'कार्ड उपलब्ध स्क्रीन स्पेस को बिल्कुल भर देता है (कोई स्क्रॉलिंग नहीं) और उसके ऊपर लिखा कैप्शन उसकी असली, डिवाइस पर नापी गई चौड़ाई और ऊंचाई पॉइंट्स में दिखाता है - बिल्कुल वही साइज़ जो एक कार्ड असली रिव्यू सेशन में पाता है।',
  'The conditional example at the bottom is a worked, copy-pasteable snippet combining {% if %} and {% for ... limit %}.':
    'नीचे दिया कंडीशनल उदाहरण एक तैयार, कॉपी-पेस्ट करने लायक स्निपेट है जो {% if %} और {% for ... limit %} को मिलाता है।',
  'The dropdown above the examples ("all", "travel", "business", and so on) filters them down to a particular tone or situation, if you only want to see those.':
    'उदाहरणों के ऊपर मौजूद ड्रॉपडाउन ("all", "travel", "business", वगैरह) उन्हें किसी खास टोन या स्थिति के हिसाब से फ़िल्टर करता है, अगर आप सिर्फ़ वही देखना चाहते हैं।',
  'The pencil icon lets you edit the meaning or example text directly. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'पेंसिल आइकन से आप अर्थ या उदाहरण का टेक्स्ट सीधे एडिट कर सकते हैं। आख़िरी आइकन उस शब्द के लिए एक झटपट वेब सर्च खोलता है, ऐप के बाहर एक और राय जानने के लिए।',
  'The row of small icon buttons under the meaning gives you a few more ways to dig into this word.':
    'अर्थ के नीचे छोटे आइकन बटनों की रो इस शब्द को और गहराई से समझने के कुछ और तरीके देती है।',
  'The sentence must contain "[...]" for the gap, and an answer is required.':
    'वाक्य में खाली जगह के लिए "[...]" होना ज़रूरी है, और जवाब भी देना ज़रूरी है।',
  'The toggles read the template text itself (no hidden markers) - they work reliably for templates built through the toggles. If you hand-write unusual formatting in the Code tab, a toggle may not detect it; edit the Code tab directly in that case.':
    'टॉगल टेम्पलेट के टेक्स्ट को ही पढ़ते हैं (कोई छिपा हुआ मार्कर नहीं) - जो टेम्पलेट टॉगल से बनाए गए हों, उनके लिए ये भरोसे से काम करते हैं। अगर आप Code टैब में खुद कोई अनूठी फ़ॉर्मैटिंग लिखते हैं, तो हो सकता है टॉगल उसे न पहचाने; ऐसे में सीधे Code टैब में एडिट करें।',
  'The translation at the top is what actually appears on your flashcard.':
    'ऊपर दिया अनुवाद ही वह है जो आपके फ्लैशकार्ड पर असल में दिखता है।',
  'The voice list follows whatever language is set under Settings > Learning > "I\'m learning".':
    'आवाज़ों की लिस्ट Settings > Learning > "I\'m learning" में सेट भाषा के हिसाब से बदलती है।',
  Theme: 'थीम',
  'Thinking...': 'सोच रहे हैं...',
  'This becomes a public issue': 'यह एक सार्वजनिक issue बन जाता है',
  'This card, explained': 'यह कार्ड, समझाया गया',
  "This changes the language of the app itself - its buttons and menus - not the language you're learning.":
    'यह ऐप की अपनी भाषा बदलता है - इसके बटन और मेन्यू - न कि वह भाषा जो आप सीख रहे हैं।',
  'This collapsible panel below the examples lets you pick a specific grammar pattern - a tense, a sentence structure, a particular conjunction - that you want the next batch of examples to practice, instead of leaving it to chance.':
    'उदाहरणों के नीचे यह पैनल आपको कोई खास व्याकरण पैटर्न चुनने देता है - कोई टेंस, वाक्य-संरचना, या कोई खास conjunction - जिसे आप अगले उदाहरणों में प्रैक्टिस करना चाहते हैं, बजाय इसे किस्मत पर छोड़ने के।',
  "This is a preview of the feedback form - sending isn't connected yet, so nothing was sent anywhere. Once it is, this exact form will open a GitHub issue on your behalf.":
    'यह फ़ीडबैक फ़ॉर्म की एक झलक है - भेजना अभी जुड़ा नहीं है, इसलिए कहीं कुछ नहीं भेजा गया। जुड़ने के बाद, यही फ़ॉर्म आपकी ओर से एक GitHub issue खोलेगा।',
  'This is the one step that actually does the work - nothing before it does anything with your captured text.':
    'यही वह एक स्टेप है जो असल में काम करता है - इससे पहले कोई भी स्टेप आपके कैप्चर किए टेक्स्ट के साथ कुछ नहीं करता।',
  'This only changes colors - nothing about how the app works.':
    'इससे सिर्फ़ रंग बदलते हैं - ऐप के काम करने के तरीके में कोई फ़र्क़ नहीं पड़ता।',
  'This only removes them from this deck - cards that live in other decks too stay there.':
    'इससे वे सिर्फ़ इस डेक से हटते हैं - जो कार्ड दूसरे डेक में भी हैं वे वहां बने रहते हैं।',
  'This opens a separate screen for the voice that reads words out loud, and how fast it speaks.':
    'यह शब्दों को ज़ोर से पढ़ने वाली आवाज़, और वह कितनी तेज़ बोलती है, इसके लिए एक अलग स्क्रीन खोलता है।',
  'This removes every OpenAI/Mistral/Gemini/Claude key from this device. Vocabulary and progress are unaffected.':
    'इससे इस डिवाइस से हर OpenAI/Mistral/Gemini/Claude key हट जाएगी। वोकैबुलरी और प्रोग्रेस पर कोई असर नहीं पड़ेगा।',
  'This replaces the fields, layout, and style with the built-in default, and saves immediately. This cannot be undone.':
    'इससे फ़ील्ड, लेआउट और स्टाइल बिल्ट-इन डिफ़ॉल्ट से बदल जाएंगे, और तुरंत सेव हो जाएंगे। इसे वापस नहीं किया जा सकता।',
  'This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.':
    'इससे अर्थ, उदाहरण, समानार्थी शब्द, वाक्यांश और क्लोज़ कार्ड नई AI जनरेशन से बदल जाएंगे। इसे वापस नहीं किया जा सकता।',
  'This screen is a preview of the full flow; submitting just confirms locally for now. A small server-side function will handle real submission in a future update.':
    'यह स्क्रीन पूरे फ़्लो की एक झलक है; अभी सबमिट करने पर सिर्फ़ लोकल रूप से पुष्टि होती है। असली सबमिशन को भविष्य के अपडेट में एक सर्वर-साइड फ़ंक्शन संभालेगा।',
  'This setting decides what happens next.': 'यह सेटिंग तय करती है कि आगे क्या होगा।',
  Title: 'शीर्षक',
  'To style one field on its own - e.g. make the word bigger than the rest - wrap just that field in your own element in the Code tab, then target the class you chose:':
    'किसी एक फ़ील्ड को अलग से स्टाइल करने के लिए - जैसे शब्द को बाकी से बड़ा बनाना - Code टैब में सिर्फ़ उस फ़ील्ड को अपने एलिमेंट में रैप करें, फिर अपनी चुनी हुई क्लास को टारगेट करें:',
  'Translation-only': 'सिर्फ़ अनुवाद (Translation-only)',
  "Turning a field on inserts the minimum Liquid needed for it at the end of that side's template: a plain field becomes {{ word }}; a list field (Other meanings, Synonyms, Related phrases) becomes a {% for %} loop, because a list can't be printed directly.":
    'किसी फ़ील्ड को चालू करने पर उस साइड के टेम्पलेट के आख़िर में उसके लिए ज़रूरी न्यूनतम Liquid जुड़ जाती है: एक सामान्य फ़ील्ड {{ word }} बन जाती है; एक लिस्ट फ़ील्ड (Other meanings, Synonyms, Related phrases) {% for %} लूप बन जाती है, क्योंकि लिस्ट को सीधे प्रिंट नहीं किया जा सकता।',
  'Turning captures into cards': 'कैप्चर को कार्ड में बदलना',
  "Type a word in either language you've set up under Learning - your own vocabulary is searched instantly as you type.":
    'Learning में सेट की गई किसी भी भाषा में शब्द टाइप करें - टाइप करते ही आपकी वोकैबुलरी में तुरंत खोज होती है।',
  "Underneath each example, thumbs up/down let you mark whether it's good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense.":
    'हर उदाहरण के नीचे, thumbs up/down से आप बता सकते हैं कि वह अच्छा है या बाद में दोबारा जांचने लायक है। फ़्लैग आइकन किसी खास समस्या (जैसे अनैचुरल भाषा या व्याकरण की गलती) की रिपोर्ट एक वैकल्पिक नोट के साथ करता है। गोल तीर इस अर्थ के लिए उदाहरणों का एक नया बैच जनरेट करता है।',
  'Unknown error': 'अनजान त्रुटि',
  'Uses this provider\'s key from AI Providers':
    'AI Providers से इस प्रोवाइडर की key का इस्तेमाल करता है',
  'Uses your phone\'s own text-to-speech engine - offline, free, no API key.':
    'आपके फ़ोन के अपने text-to-speech इंजन का इस्तेमाल करता है - ऑफ़लाइन, मुफ़्त, बिना किसी API key के।',
  Voice: 'आवाज़',
  'Voice ({{language}})': 'आवाज़ ({{language}})',
  'Want it to work a bit differently? There\'s a setting for that in Settings, under "Share & Search."':
    'इसे थोड़ा अलग तरीके से चलाना चाहते हैं? इसके लिए Settings में "Share & Search" के तहत एक सेटिंग है।',
  'What diagnostics includes': 'डायग्नोस्टिक्स में क्या शामिल है',
  'What happened, or what would you like to see?': 'क्या हुआ, या आप क्या देखना चाहेंगे?',
  'What kind of feedback?': 'किस तरह का फ़ीडबैक?',
  'What this screen is for': 'यह स्क्रीन किसलिए है',
  'Whatever translation at this moment is selected/shown will be added to deck along with its relevant example.':
    'इस वक्त जो भी अनुवाद चुना/दिखाया गया है, वह अपने संबंधित उदाहरण के साथ डेक में जोड़ दिया जाएगा।',
  'When a word is new to you': 'जब कोई शब्द आपके लिए नया हो',
  'Why nothing sends yet': 'अभी कुछ क्यों नहीं भेजा जाता',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.':
    'जनरेशन key के बिना, AI से कार्ड बनाना बंद रहता है। अनुवाद और खुद बनाए कार्ड फिर भी काम करते हैं। पूरा अनुभव पाने के लिए AI Providers में एक key जोड़ें।',
  'Word and meaning are required.': 'शब्द और अर्थ ज़रूरी हैं।',
  'Word card': 'शब्द कार्ड',
  'You can add your cards to multiple decks even if it is added before.':
    'आप अपने कार्ड को कई डेक में जोड़ सकते हैं, भले ही वह पहले जोड़ा जा चुका हो।',
  "You can also share text from another app straight to Lemmory, the same way you'd share a link or a photo.":
    'आप किसी और ऐप से सीधे Lemmory में भी टेक्स्ट शेयर कर सकते हैं, वैसे ही जैसे आप कोई लिंक या फ़ोटो शेयर करते हैं।',
  "You can also share text to Lemmory, the same way you'd share a link or a photo to any other app.":
    'आप Lemmory में भी टेक्स्ट शेयर कर सकते हैं, वैसे ही जैसे आप किसी और ऐप में लिंक या फ़ोटो शेयर करते हैं।',
  'ask a follow-up question': 'फॉलो-अप सवाल पूछें',
  'e.g. Er lehnt das Angebot ab.': 'जैसे: Er lehnt das Angebot ab.',
  'e.g. He refuses the offer.': 'जैसे: He refuses the offer.',
  'e.g. We are going out tonight.': 'जैसे: We are going out tonight.',
  'e.g. Wir gehen heute Abend [...].': 'जैसे: Wir gehen heute Abend [...].',
  'e.g. ablehnen': 'जैसे: ablehnen',
  'e.g. aus': 'जैसे: aus',
  'e.g. to refuse': 'जैसे: to refuse',
  'e.g. verweigern, zurückweisen': 'जैसे: verweigern, zurückweisen',
  'eleven_multilingual_v2. Once your key is entered, choose from your own ElevenLabs voice library, or switch to manual entry to paste a voice ID directly.':
    'eleven_multilingual_v2. आपकी key डालने के बाद, अपनी ElevenLabs वॉइस लाइब्रेरी में से चुनें, या वॉइस ID सीधे पेस्ट करने के लिए मैनुअल एंट्री पर स्विच करें।',
  'generate an explanation for this meaning': 'इस अर्थ के लिए व्याख्या जनरेट करें',
  'gpt-4o-mini-tts. Marin and Cedar (★) are OpenAI\'s newest, most natural-sounding voices.':
    'gpt-4o-mini-tts. Marin और Cedar (★) OpenAI की सबसे नई, सबसे स्वाभाविक लगने वाली आवाज़ें हैं।',
  'regenerate this card': 'इस कार्ड को दोबारा जनरेट करें',
  reverse: 'उल्टा',
  'this deck': 'यह डेक',
  'you@example.com': 'you@example.com',
  '{{ variable }} prints a value. {% if gender %}...{% endif %} shows content only when a field has one - good for optional fields. {% for s in synonyms %}...{% endfor %} loops a list; add "limit:2" to cap it, and {% unless forloop.last %}...{% endunless %} to add a separator between items but not after the last one.':
    '{{ variable }} एक वैल्यू प्रिंट करता है। {% if gender %}...{% endif %} तभी कंटेंट दिखाता है जब किसी फ़ील्ड में कोई वैल्यू हो - यह वैकल्पिक फ़ील्ड के लिए अच्छा है। {% for s in synonyms %}...{% endfor %} किसी लिस्ट पर लूप चलाता है; उसे सीमित करने के लिए "limit:2" जोड़ें, और आख़िरी को छोड़कर बाकी आइटम के बीच सेपरेटर जोड़ने के लिए {% unless forloop.last %}...{% endunless %} इस्तेमाल करें।',
  '{{cefr}} · {{native}} > {{target}}': '{{cefr}} · {{native}} > {{target}}',
  '{{count}} of {{total}} configured': '{{total}} में से {{count}} कॉन्फ़िगर किए गए',
  '{{count}} selected': '{{count}} चुने गए',
  '{{count}}h': '{{count}}घं',
  '{{count}}m': '{{count}}मि',
  "{{language}} isn't ready yet - English and German are the only languages Lemmory fully supports right now.":
    '{{language}} अभी तैयार नहीं है - अभी सिर्फ़ अंग्रेज़ी और जर्मन ही ऐसी भाषाएं हैं जिन्हें Lemmory पूरी तरह सपोर्ट करता है।',
  '{{provider}} playback failed': '{{provider}} प्लेबैक फेल हो गया',
  '{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted':
    '{{pulled}} पुल किए · {{pushed}} पुश किए · {{deleted}} डिलीट किए',

  masculine: 'पुल्लिंग',
  feminine: 'स्त्रीलिंग',
  neuter: 'नपुंसकलिंग',
  Again: 'फिर से',
  Hard: 'कठिन',
  Good: 'अच्छा',
  Easy: 'आसान',
  'Lemmory Light': 'लेमोरी लाइट',
  'Midnight Indigo': 'मिडनाइट इंडिगो',
  'Carbon Noir': 'कार्बन नॉयर',
  'Arctic Day': 'आर्कटिक डे',
  'Warm Sand': 'वॉर्म सैंड',
  Paperlight: 'पेपरलाइट',
  'Meanings, examples, clusters, phrases, and cloze - the default generation provider.':
    'अर्थ, उदाहरण, समूह, वाक्यांश और क्लोज़ - डिफ़ॉल्ट जनरेशन प्रोवाइडर।',
  'BYOK alternative for card generation and translation.':
    'कार्ड जनरेशन और अनुवाद के लिए BYOK विकल्प।',
  'Google Gemini BYOK for card generation and translation.':
    'कार्ड जनरेशन और अनुवाद के लिए Google Gemini BYOK।',
  'Claude BYOK for card generation and translation.': 'कार्ड जनरेशन और अनुवाद के लिए Claude BYOK।',
  'Your phone\'s own text-to-speech engine. Offline, no API key, no per-word cost.':
    'आपके फ़ोन का अपना टेक्स्ट-टू-स्पीच इंजन। ऑफ़लाइन, कोई API कुंजी नहीं, प्रति शब्द कोई खर्च नहीं।',
  'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.':
    'gpt-4o-mini-tts. सबसे नेचुरल आवाज़ के लिए नीचे Marin या Cedar चुनें।',
  'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.':
    'eleven_multilingual_v2. अपनी ElevenLabs वॉइस लाइब्रेरी से एक वॉइस ID पेस्ट करें।',
  'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).':
    'Aura-2. जिस आवाज़/भाषा का आप उपयोग करना चाहते हैं, उसका सटीक मॉडल नाम डालें (Deepgram के दस्तावेज़ देखें)।',
  'Bug / Issue': 'बग / समस्या',
  'Feature request': 'फ़ीचर रिक्वेस्ट',
  'General feedback': 'सामान्य फ़ीडबैक',
  Vietnamese: 'वियतनामी',

  Queue: 'कतार',
  'Queue help': 'कतार सहायता',
  'Queue is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    'कतार उन वाक्यों को रखने की जगह है जिन्हें आप बाद में शब्दावली कार्ड में बदलना चाहते हैं - यहाँ अपने आप कुछ नहीं होता।',

  'Generate {{count}} cards to...': '{{count}} कार्ड यहाँ बनाएं...',
  'Delete account & sync data?': 'खाता और सिंक डेटा हटाएं?',
  'This permanently erases everything you\'ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can\'t be undone.':
    'इससे आपने क्लाउड पर जो कुछ भी सिंक किया है वह स्थायी रूप से मिट जाएगा और आप साइन आउट हो जाएंगे। इस डिवाइस पर आपके डेक और कार्ड प्रभावित नहीं होंगे। इसे वापस नहीं किया जा सकता।',
  'Delete everything': 'सब कुछ हटाएं',
  'Deletion failed': 'हटाना विफल रहा',
  'Danger zone': 'खतरे का क्षेत्र',
  'Permanently erase everything synced to this account and sign out. Your data on this device stays put.':
    'इस खाते से सिंक किया गया सब कुछ स्थायी रूप से मिटाएं और साइन आउट करें। इस डिवाइस पर आपका डेटा सुरक्षित रहेगा।',
  'Delete account & sync data': 'खाता और सिंक डेटा हटाएं',
  'Sync help': 'सिंक हेल्प',
  'How sync works': 'सिंक कैसे काम करता है',
  'Deleting your account & data': 'अपना खाता और डेटा हटाना',
  'What does this actually delete?': 'इससे असल में क्या डिलीट होता है?',
  "Signing in with Google links this device to a private cloud copy of your decks, cards, and review progress - so if you get a new phone, or use Lemmory on two devices, you're not starting from zero on the second one.":
    'Google से साइन इन करने पर यह डिवाइस आपके डेक, कार्ड और रिव्यू प्रोग्रेस की एक प्राइवेट क्लाउड कॉपी से जुड़ जाता है - तो अगर आपको नया फ़ोन मिलता है, या आप Lemmory दो डिवाइस पर इस्तेमाल करते हैं, तो दूसरे डिवाइस पर आप ज़ीरो से शुरू नहीं करते।',
  'Tap "Sync now" any time to push your latest changes up and pull down anything from another device. Under the hood it merges rather than overwrites - if you added a card here and reviewed one on your other phone, both survive.':
    '"Sync now" पर कभी भी टैप करें ताकि आपके नए बदलाव ऊपर चले जाएं और दूसरे डिवाइस का डेटा नीचे आ जाए। अंदर ही अंदर यह ओवरराइट नहीं, बल्कि मर्ज करता है - अगर आपने यहां एक कार्ड जोड़ा और अपने दूसरे फ़ोन पर एक रिव्यू किया, तो दोनों बच जाते हैं।',
  "Your AI provider API keys are never synced. They live only in this device's secure storage, so you'll need to re-enter them if you set up a new device.":
    'आपकी AI provider API keys कभी सिंक नहीं होतीं। वे सिर्फ इसी डिवाइस के secure storage में रहती हैं, इसलिए नया डिवाइस सेट करते समय आपको उन्हें फिर से डालना होगा।',
  'When this is on, Lemmory quietly syncs in the background whenever you leave the app - no need to remember to tap "Sync now" yourself.':
    'यह ऑन होने पर, जब भी आप ऐप छोड़ते हैं, Lemmory बैकग्राउंड में चुपचाप सिंक कर लेता है - खुद "Sync now" पर टैप करना याद रखने की ज़रूरत नहीं।',
  "\"At most every\" is a cooldown, not a schedule - it won't sync more often than that, but it also won't force a sync if you haven't opened the app in the meantime.":
    '"At most every" एक कूलडाउन है, कोई तय शेड्यूल नहीं - यह उससे ज़्यादा बार सिंक नहीं करेगा, लेकिन अगर आपने बीच में ऐप खोला ही नहीं, तो यह सिंक को ज़बरदस्ती भी नहीं करेगा।',
  "It runs over whatever connection you've got, Wi-Fi or mobile data - there's no Wi-Fi-only toggle.":
    'यह जो भी कनेक्शन उपलब्ध हो उस पर चलता है, चाहे Wi-Fi हो या मोबाइल डेटा - कोई Wi-Fi-only टॉगल नहीं है।',
  "This is the one action here you genuinely can't undo - read this before you tap it.":
    'यह यहां की एक ऐसी कार्रवाई है जिसे आप वाकई वापस नहीं कर सकते - टैप करने से पहले इसे ज़रूर पढ़ें।',
  'It permanently erases everything this account ever synced to the cloud, disconnects the Google account from Lemmory, and signs you out.':
    'यह इस खाते ने क्लाउड पर जो कुछ भी कभी सिंक किया है उसे स्थायी रूप से मिटा देता है, Google खाते को Lemmory से डिसकनेक्ट कर देता है, और आपको साइन आउट कर देता है।',
  'Your decks, cards, and progress on THIS device are completely untouched - they stay right where they are, fully usable offline. Only the cloud copy (and the link to it) is gone.':
    'इसी डिवाइस पर आपके डेक, कार्ड और प्रोग्रेस बिल्कुल सुरक्षित रहते हैं - वे वहीं रहते हैं, पूरी तरह ऑफ़लाइन इस्तेमाल के लायक। सिर्फ़ क्लाउड कॉपी (और उससे जुड़ा लिंक) ही मिटता है।',
  'If you sign back in with the same Google account afterward, syncing starts fresh - nothing comes back automatically.':
    'अगर आप बाद में उसी Google खाते से फिर साइन इन करते हैं, तो सिंकिंग नए सिरे से शुरू होती है - कुछ भी अपने आप वापस नहीं आता।',
  'Card type for this import': 'इस आयात के लिए कार्ड प्रकार',
  'A row with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'शब्द/अर्थ और रिक्त-स्थान वाक्य दोनों वाली पंक्ति एक ही कार्ड बनती है, कभी दो नहीं। दोनों चाहिए? फ़ाइल को बाद में दूसरे कार्ड प्रकार के साथ फिर से आयात करें।',
  'A note with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'शब्द/अर्थ और रिक्त-स्थान वाक्य दोनों वाला नोट एक ही कार्ड बनता है, कभी दो नहीं। दोनों चाहिए? फ़ाइल को बाद में दूसरे कार्ड प्रकार के साथ फिर से आयात करें।',
  'Regular (word/meaning)': 'सामान्य (शब्द/अर्थ)',
  'Cloze (fill-in-the-blank)': 'रिक्त-स्थान',
  'View all cards (table)': 'सभी कार्ड देखें (तालिका)',
  '{{name}} - all cards': '{{name}} - सभी कार्ड',
  'All cards': 'सभी कार्ड',
  'No cards yet': 'अभी तक कोई कार्ड नहीं',
  'Add words from Search or import a file to see them here.':
    'यहां देखने के लिए खोज से शब्द जोड़ें या कोई फ़ाइल आयात करें।',
  Type: 'प्रकार',
  'Part of speech': 'शब्द भेद',
  CEFR: 'CEFR स्तर',

  // Newly added — Mixed practice, question types, cards-per-session, and the AI Providers help
  // sheet/error-message hardening that went with them
  'Fill in the blank': 'रिक्त स्थान भरें',
  'True or False': 'सही या गलत',
  'Multiple choice': 'बहुविकल्पीय',
  mixed: 'मिश्रित',
  'true/false': 'सही/गलत',
  'multiple choice': 'बहुविकल्पीय',
  'Mixed practice': 'मिश्रित अभ्यास',
  'Practice more': 'और अभ्यास करें',
  'Practice question types': 'अभ्यास प्रश्न प्रकार',
  'Cards per session': 'प्रति सत्र कार्ड',
  'No limit': 'कोई सीमा नहीं',
  'You reviewed {{count}} cards. There are more cards due - keep going or come back later.':
    'आपने {{count}} कार्ड दोहराए। और कार्ड बाकी हैं - जारी रखें या बाद में वापस आएं।',
  'Added to {{deck}}': '{{deck}} में जोड़ा गया',
  'Cloze added': 'क्लोज़ जोड़ा गया',
  '"{{word}}" means "{{meaning}}"': '"{{word}}" का अर्थ है "{{meaning}}"',
  'Not quite - "{{word}}" means "{{meaning}}".': 'सही नहीं - "{{word}}" का अर्थ है "{{meaning}}"।',
  True: 'सही',
  False: 'गलत',
  'Correct!': 'सही!',
  'What does this mean?': 'इसका क्या अर्थ है?',
  'True or false?': 'सही या गलत?',
  'Language pair': 'भाषा युग्म',
  '"I speak": explanations and the "More info" follow-up use this language.':
    '"मैं बोलता हूं": स्पष्टीकरण और "अधिक जानकारी" सुविधा इसी भाषा का उपयोग करती है।',
  '"I\'m learning": new words are looked up and generated in this language.':
    '"मैं सीख रहा हूं": नए शब्द इसी भाषा में खोजे और बनाए जाते हैं।',
  'Mixed practice presents due cards in a random mix of whichever formats are enabled here.':
    'मिश्रित अभ्यास बकाया कार्ड को यहां सक्षम किए गए प्रारूपों के यादृच्छिक मिश्रण में प्रस्तुत करता है।',
  'Cloze here is scored separately from the dedicated Cloze Practice mode.':
    'यहां क्लोज़ को समर्पित क्लोज़ अभ्यास मोड से अलग स्कोर किया जाता है।',
  'Caps how many due cards a single review session pulls in - the most overdue cards first. Applies to every practice mode, not just Mixed.':
    'सीमित करता है कि एक अभ्यास सत्र में कितने बकाया कार्ड शामिल होंगे - सबसे अधिक विलंबित कार्ड पहले। यह हर अभ्यास मोड पर लागू होता है, केवल मिश्रित पर नहीं।',
  'If more are due, finish the session and tap "Practice more" for another round right away, instead of waiting until they come due again.':
    'अगर और कार्ड बाकी हैं, तो सत्र समाप्त करें और तुरंत एक और राउंड के लिए "और अभ्यास करें" पर टैप करें, फिर से बकाया होने का इंतज़ार करने के बजाय।',
  'How AI Providers works': '"एआई प्रदाता" कैसे काम करता है',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled.':
    'कार्ड निर्माण (अर्थ, उदाहरण, क्लस्टर, वाक्यांश, क्लोज़) नीचे कॉन्फ़िगर और सक्षम किए गए प्रदाता का उपयोग करता है।',
  'Bring your own API key - nothing is sent to a provider until you generate a card.':
    'अपनी खुद की एपीआई कुंजी लाएं - जब तक आप कार्ड नहीं बनाते, प्रदाता को कुछ भी नहीं भेजा जाता।',
  "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.":
    'इस शब्द के लिए {{providerName}} की प्रतिक्रिया अपेक्षित प्रारूप में नहीं थी। यह कभी-कभी हो सकता है - फिर से प्रयास करें, या सेटिंग्स > एआई प्रदाता में कोई दूसरा एआई प्रदाता आज़माएं।',
  '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} ने ऐसी प्रतिक्रिया दी जिसे पढ़ा नहीं जा सका। यह कभी-कभी हो सकता है - फिर से प्रयास करें, या सेटिंग्स > एआई प्रदाता में कोई दूसरा एआई प्रदाता आज़माएं।',
  '{{providerName}} could not generate a valid response for this word. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} इस शब्द के लिए मान्य प्रतिक्रिया नहीं बना सका। यह कभी-कभी हो सकता है - फिर से प्रयास करें, या सेटिंग्स > एआई प्रदाता में कोई दूसरा एआई प्रदाता आज़माएं।',
  'The word is already blanked out below - select a different word or phrase and tap "Mark as cloze" to change it.':
    'शब्द नीचे पहले से छिपा हुआ है - इसे बदलने के लिए कोई दूसरा शब्द या वाक्यांश चुनें और "क्लोज़ के रूप में चिह्नित करें" पर टैप करें।',
  'Cloze added to {{deck}}': '{{deck}} में क्लोज़ जोड़ा गया',
  'Select a word or phrase in the sentence below, then tap "Mark as cloze" to blank it out.':
    'नीचे दिए गए वाक्य में कोई शब्द या वाक्यांश चुनें, फिर उसे छिपाने के लिए "क्लोज़ के रूप में चिह्नित करें" पर टैप करें।',
  Sentence: 'वाक्य',
  'Mark as cloze': 'क्लोज़ के रूप में चिह्नित करें',
  'Nothing to preview yet.': 'अभी दिखाने के लिए कुछ नहीं है।',
  'English translation': 'अंग्रेज़ी अनुवाद',
  'Add cloze card': 'क्लोज़ कार्ड जोड़ें',
  'Save cloze card': 'क्लोज़ कार्ड सहेजें',

  'Underneath each example, thumbs up/down let you mark whether it\'s good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense - the same thing "Generate more examples" below the list does.':
    'हर उदाहरण के नीचे, थम्ब्स अप/डाउन से आप बता सकते हैं कि यह अच्छा है या बाद में फिर से जांचने लायक है। फ्लैग आइकन किसी खास समस्या (जैसे अस्वाभाविक भाषा या व्याकरण की गलती) को ऐच्छिक नोट के साथ रिपोर्ट करता है। गोल तीर इस अर्थ के लिए उदाहरणों का एक नया सेट बनाता है - बिल्कुल वैसे ही जैसे लिस्ट के नीचे "और उदाहरण जनरेट करें" करता है।',
  'Don\'t see the pattern you want? Type your own under "Custom Grammar Rule" and tap the + to add it to the selection - it\'s sent to the AI exactly as written, alongside any picked chips.':
    'चाहा हुआ पैटर्न नहीं दिख रहा? "Custom Grammar Rule" में अपना खुद का टाइप करें और उसे चुनाव में जोड़ने के लिए + पर टैप करें - यह जैसा लिखा है वैसा ही, चुनी गई चिप्स के साथ AI को भेजा जाता है।',
  '"Generate targeted examples" replaces the current examples with fresh ones written to practice your selection. Examples generated this way get a highlighted background, so you can tell which ones came from your request.':
    '"Generate targeted examples" मौजूदा उदाहरणों को नए उदाहरणों से बदल देता है जो आपके चुनाव पर आधारित हों। इस तरह बने उदाहरणों को हाइलाइट किया गया बैकग्राउंड मिलता है, ताकि आप उन्हें पहचान सकें।',
  'The pencil icon lets you edit the meaning or example text directly (dictionary-sourced cards only - an AI card uses Regenerate and the per-field AI tools instead). The trash icon deletes this card entirely, after confirming. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'पेंसिल आइकन से आप मतलब या उदाहरण टेक्स्ट सीधे एडिट कर सकते हैं (सिर्फ डिक्शनरी से मिले कार्ड पर - AI कार्ड पर इसकी जगह Regenerate और अलग-अलग फील्ड के AI टूल इस्तेमाल होते हैं)। ट्रैश आइकन पुष्टि के बाद इस कार्ड को पूरी तरह मिटा देता है। आखिरी आइकन शब्द के लिए ऐप के बाहर दूसरी राय पाने के लिए एक जल्दी वेब सर्च खोलता है।',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. Tap the sparkle icon on one to fetch AI usage & nuance - how formal it is and what makes it different from the headword. The icon next to it opens that synonym as its own flashcard.':
    'पर्यायवाची शब्द मिलते-जुलते मतलब वाले दूसरे शब्द हैं, जो इस शब्द के आसपास आपकी शब्दावली बढ़ाने में मदद करते हैं। किसी पर्यायवाची पर स्पार्कल आइकन टैप करके AI से उसका इस्तेमाल और बारीकियां जानें - यह कितना औपचारिक है और मुख्य शब्द से कैसे अलग है। बगल वाला आइकन उस पर्यायवाची को उसके अपने फ्लैशकार्ड के रूप में खोलता है।',
  'Phrases show this word used in common expressions or word combinations, fetched on demand: tap "Explore with AI" the first time, or "Load more with AI" for another batch once you already have some.':
    'वाक्यांश इस शब्द को आम अभिव्यक्तियों या शब्द-संयोजनों में दिखाते हैं, जिन्हें ज़रूरत पर लाया जाता है: पहली बार "Explore with AI" पर टैप करें, या पहले से कुछ होने पर और पाने के लिए "Load more with AI" पर टैप करें।',
  '"Add to Cloze" (or "Edit Cloze" once one exists) at the bottom opens the editor pre-filled with the currently selected example. Select a word or phrase in the sentence and tap "Mark as cloze" to blank it out - it defaults to blanking the headword itself - then adjust the translation and save.':
    'नीचे दिया "Add to Cloze" (या एक बार बन जाने पर "Edit Cloze") बटन मौजूदा चुने गए उदाहरण के साथ पहले से भरा हुआ एडिटर खोलता है। वाक्य में कोई शब्द या वाक्यांश चुनें और उसे छिपाने के लिए "Mark as cloze" पर टैप करें - यह डिफ़ॉल्ट रूप से मुख्य शब्द को ही छिपाता है - फिर अनुवाद ठीक करें और सेव करें।',
  'Saving always replaces this card\'s cloze sentence rather than adding a second one - there\'s only ever one per card.':
    'सेव करने पर हमेशा इस कार्ड का मौजूदा क्लोज़ वाक्य बदल जाता है, दूसरा नहीं जुड़ता - हर कार्ड पर हमेशा सिर्फ एक ही होता है।',

  // Newly added — the redesigned AI Providers help sheet (grid + single detail panel) and its
  // matching Audio Settings labels
  'Active Generation Provider': 'सक्रिय जनरेशन प्रदाता',
  'Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.':
    'चुनें कि संदर्भ स्पष्ट करने, वर्ड पैकेज बनाने और सीईएफआर उदाहरण वाक्य तैयार करने के लिए कौन सा एआई इंजन उपयोग किया जाए।',
  'Key configured': 'कुंजी कॉन्फ़िगर की गई',
  'No key set': 'कोई कुंजी सेट नहीं है',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.':
    'चुनें कि कौन सा इंजन बोलकर सुनाए - डिवाइस की आवाज़ें मुफ़्त हैं और ऑफ़लाइन काम करती हैं; क्लाउड प्रदाता आपकी अपनी एपीआई कुंजी का उपयोग करते हैं।',
  'Always available': 'हमेशा उपलब्ध',
  'Validated': 'सत्यापित',
  '"Active" vs "Enabled" - what\'s the difference?': '"सक्रिय" बनाम "सक्षम" - अंतर क्या है?',
  'Adding and validating a key': 'कुंजी जोड़ना और सत्यापित करना',
  'Which provider should I pick?': 'कौन सा प्रदाता चुनें?',
  'What the usage numbers mean': 'उपयोग के आंकड़ों का क्या मतलब है',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.':
    'यहीं पर एक नया शब्द पूरा कार्ड बनता है - अर्थ, उदाहरण वाक्य, अर्थ-समूह और भी बहुत कुछ। जब भी आप कोई ऐसा शब्द खोजते हैं जिसे Lingora अभी नहीं जानता, यह उस शब्द को नीचे आपके द्वारा **सक्रिय** के रूप में चिह्नित प्रदाता को सौंप देता है और उससे कार्ड बनाने के लिए कहता है।',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.':
    'यह **"अपनी कुंजी लाएं"** तरीके पर काम करता है: Lingora के साथ कोई साझा एआई सब्सक्रिप्शन नहीं आता, इसलिए जब तक आप नीचे दिए गए किसी प्रदाता में अपनी खुद की एपीआई कुंजी नहीं डालते, तब तक कुछ भी जनरेट नहीं होता। इसका मतलब यह भी है कि जब तक आप वाकई कोई शब्द नहीं खोजते, तब तक कहीं कुछ नहीं भेजा जाता - सिर्फ़ कुंजी सेव होने से कोई अनुरोध शुरू नहीं होता।',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.':
    'आपको हर प्रदाता में जानकारी भरने की ज़रूरत नहीं है। एक काम करने वाली, सत्यापित कुंजी ही काफी है - जिस सेवा का खाता आपके पास पहले से है, या जिसे आज़माने में आपकी दिलचस्पी है, उसे चुनें और वहीं से शुरू करें।',
  '**Active** is the one provider actually doing the work right now - the engine that responds when you look up a word. Only one provider can be Active at a time, and tapping a validated provider\'s card here switches to it immediately.':
    '**सक्रिय** वह एकमात्र प्रदाता है जो अभी वाकई काम कर रहा है - वह इंजन जो शब्द खोजने पर जवाब देता है। एक समय में केवल एक ही प्रदाता सक्रिय हो सकता है, और किसी सत्यापित प्रदाता के कार्ड पर टैप करते ही तुरंत उस पर स्विच हो जाता है।',
  '**Enabled** is a softer flag, tucked inside a provider\'s own settings panel. It controls whether that provider is allowed to be picked at all (including as a fallback, and as an option elsewhere in the app like Settings > Translation) - flip it off if you want to keep a key saved for later without it being usable right now.':
    '**सक्षम** एक हल्का संकेतक है, जो हर प्रदाता के अपने सेटिंग्स पैनल में छिपा होता है। यह तय करता है कि उस प्रदाता को चुना जा सकता है या नहीं (फ़ॉलबैक के रूप में, और ऐप में कहीं और, जैसे सेटिंग्स > अनुवाद में विकल्प के रूप में भी) - अगर आप किसी कुंजी को बाद के लिए सेव रखना चाहते हैं पर अभी उसका उपयोग नहीं होने देना चाहते, तो इसे बंद कर दें।',
  'If a key gets cleared or fails validation while its provider is Active, Lingora quietly falls back to the next best option - whichever provider is both enabled and has a validated key - so you\'re never stuck without generation just because one key went stale.':
    'अगर किसी प्रदाता के सक्रिय रहते हुए उसकी कुंजी मिटा दी जाती है या सत्यापन में विफल हो जाती है, तो Lingora चुपचाप अगले सबसे अच्छे विकल्प पर स्विच हो जाता है - जो प्रदाता सक्षम है और जिसकी कुंजी सत्यापित है - ताकि सिर्फ़ एक कुंजी के पुरानी पड़ जाने से आप कभी बिना जनरेशन के न रह जाएं।',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Validate** - this sends one small real request to confirm the key actually works before you rely on it for word generation.':
    'किसी प्रदाता की सेटिंग्स खोलने के लिए उसके कार्ड पर टैप करें, अपनी एपीआई कुंजी पेस्ट करें, और अगर डिफ़ॉल्ट से अलग मॉडल चाहिए तो उसे चुनें। फिर **सत्यापित करें** पर टैप करें - इससे एक छोटा असली अनुरोध भेजा जाता है, जो यह पुष्टि करता है कि कुंजी वाकई काम करती है, इससे पहले कि आप शब्द जनरेशन के लिए उस पर भरोसा करें।',
  'A provider only becomes eligible to be Active once its key has validated successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.':
    'कोई प्रदाता तभी सक्रिय बनने के योग्य होता है जब उसकी कुंजी सफलतापूर्वक सत्यापित हो चुकी हो। यह जानबूझकर किया गया है - इससे कोई गलत टाइप की गई या समय-सीमा समाप्त कुंजी चुपचाप आपके और नए कार्ड के बीच एकमात्र रुकावट नहीं बन पाती।',
  '**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device\'s secure storage - not in Lingora\'s own servers, not synced anywhere, unless you back up and restore it yourself.':
    '**मिटाएं** इस डिवाइस से कुंजी को पूरी तरह हटा देता है (और उसका सत्यापन व उपयोग इतिहास रीसेट कर देता है)। कुछ भी इस डिवाइस के सुरक्षित स्टोरेज के अलावा कहीं और सेव नहीं होता - न Lingora के अपने सर्वर पर, न कहीं सिंक होता है, जब तक कि आप खुद बैकअप लेकर उसे पुनर्स्थापित न करें।',
  '**OpenAI** is the default and a safe general-purpose choice - reliable structured output, widely used, easy to get a key for at `platform.openai.com`.':
    '**OpenAI** डिफ़ॉल्ट विकल्प है और एक सुरक्षित, सामान्य-उद्देश्य वाला विकल्प है - भरोसेमंद संरचित आउटपुट, व्यापक रूप से इस्तेमाल किया जाने वाला, और `platform.openai.com` पर कुंजी पाना आसान है।',
  '**Groq** runs open models (like the gpt-oss family) on very fast custom hardware - if speed matters more to you than picking a specific model family, this is usually the quickest of the bunch to respond.':
    '**Groq** बहुत तेज़ खुद के हार्डवेयर पर ओपन मॉडल (जैसे gpt-oss परिवार) चलाता है - अगर किसी खास मॉडल परिवार से ज़्यादा आपके लिए गति मायने रखती है, तो यह आमतौर पर सबसे तेज़ जवाब देता है।',
  '**Mistral** is a solid European alternative with its own models, good if you\'d rather not depend on a US-based provider or just want a second option in the mix.':
    '**Mistral** अपने खुद के मॉडलों के साथ एक मज़बूत यूरोपीय विकल्प है - अच्छा है अगर आप किसी अमेरिकी प्रदाता पर निर्भर नहीं रहना चाहते, या बस एक दूसरा विकल्प चाहते हैं।',
  '**Gemini** (Google) tends to be generous on free-tier usage limits if you\'re just trying this out without committing to a paid key yet.':
    '**Gemini** (Google) अक्सर उदार मुफ़्त उपयोग सीमा देता है, अगर आप बिना किसी भुगतान वाली कुंजी के लिए प्रतिबद्ध हुए बस इसे आज़माना चाहते हैं।',
  '**Claude** (Anthropic) is known for careful, well-reasoned output - a good pick if you find another provider\'s example sentences or meanings feel a little off and want to compare.':
    '**Claude** (Anthropic) सावधानी से सोचे-समझे आउटपुट के लिए जाना जाता है - अच्छा विकल्प है अगर किसी और प्रदाता के उदाहरण वाक्य या अर्थ आपको थोड़े अटपटे लगें और आप तुलना करना चाहें।',
  '**DeepSeek** is capable and inexpensive, but tends to run noticeably slower than the others for a full word generation - worth knowing going in so a longer wait doesn\'t feel like something\'s broken.':
    '**DeepSeek** सक्षम और सस्ता है, लेकिन पूरे शब्द जनरेशन के लिए बाकियों की तुलना में काफ़ी धीमा हो सकता है - यह पहले से पता होना अच्छा है, ताकि लंबा इंतज़ार किसी खराबी जैसा न लगे।',
  'Whichever you choose, the model picker under each provider lets you trade off speed, cost, and quality without needing to leave this screen.':
    'आप जो भी चुनें, हर प्रदाता के नीचे दिया गया मॉडल चयनकर्ता आपको इस स्क्रीन से बाहर गए बिना गति, लागत और गुणवत्ता के बीच संतुलन बनाने देता है।',
  'Each provider\'s panel shows a **device-observed usage** box - request and token counts this specific device has actually sent through that key. It\'s a convenience, not a bill: it only counts what happened here, so it won\'t match a key shared across multiple devices or apps.':
    'हर प्रदाता के पैनल में एक **डिवाइस-आधारित उपयोग** बॉक्स दिखता है - इस डिवाइस ने उस कुंजी से वाकई जितने अनुरोध और टोकन भेजे हैं, उनकी गिनती। यह एक सुविधा है, बिल नहीं: यह सिर्फ़ वही गिनता है जो यहीं इस डिवाइस पर हुआ, इसलिए यह कई डिवाइस या ऐप में साझा की गई कुंजी से मेल नहीं खाएगा।',
  'For the real, authoritative numbers - and anything to do with billing or rate limits - use the "Open usage" link, which takes you straight to that provider\'s own dashboard.':
    'असली, आधिकारिक आंकड़ों के लिए - और बिलिंग या दर सीमा से जुड़ी किसी भी बात के लिए - "उपयोग खोलें" लिंक का उपयोग करें, जो आपको सीधे उस प्रदाता के अपने डैशबोर्ड पर ले जाता है।',
}

const vi: Partial<Record<Phrase, string>> = {
  '"Add to deck" at the bottom is how you start reviewing this word - you can add it to more than one deck, or create a new one on the spot.':
    'Nút "Thêm vào bộ thẻ" ở dưới cùng là cách bạn bắt đầu ôn từ này - bạn có thể thêm vào nhiều bộ thẻ, hoặc tạo bộ mới ngay tại chỗ.',
  '"Ask AI" opens a small chat where you can type a follow-up question about this specific word.':
    'Nút "Hỏi AI" mở một khung chat nhỏ để bạn đặt câu hỏi thêm về từ này.',
  '"Explain" (or "More info" on an AI-generated card) shows or expands a direct explanation of what the word means and where or why it\'s used.':
    'Nút "Giải thích" (hoặc "Xem thêm" trên thẻ do AI tạo) hiển thị hoặc mở rộng phần giải thích trực tiếp về nghĩa của từ và nơi hoặc lý do dùng từ đó.',
  '"Follow device" just matches whatever language your phone is already set to.':
    '"Theo máy" chỉ đơn giản là dùng đúng ngôn ngữ mà điện thoại của bạn đang cài đặt.',
  '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.':
    'Nút "Tạo bằng AI" tạo một thẻ giải thích đầy đủ gồm nghĩa, ví dụ, ngữ pháp và nhiều hơn nữa, dùng nhà cung cấp AI bạn đã thiết lập trong Cài đặt.',
  'The "AI Insights" preview gives a short, direct explanation of what the word means and where or why it\'s used - tap it any time to generate the full flashcard.':
    'Bản xem trước "AI Insights" đưa ra phần giải thích ngắn gọn, trực tiếp về nghĩa của từ và nơi hoặc lý do dùng từ đó - chạm vào bất cứ lúc nào để tạo thẻ đầy đủ.',
  "\"Regenerate\" throws away this card's meanings, examples, synonyms, phrases, and cloze cards, and generates all of it fresh - useful if the current version isn't working for you. This can't be undone.":
    'Nút "Tạo lại" sẽ xóa bỏ toàn bộ nghĩa, ví dụ, từ đồng nghĩa, cụm từ và thẻ điền khuyết của thẻ này, rồi tạo lại từ đầu - hữu ích nếu phiên bản hiện tại chưa phù hợp với bạn. Không thể hoàn tác thao tác này.',
  '"Test active engine" plays the Test phrase through whichever engine is marked Active - the same thing any real speaker button in the app does.':
    'Nút "Thử bộ máy đang dùng" phát câu thử nghiệm qua bộ máy đang được đánh dấu Đang dùng - giống hệt nút loa thật trong ứng dụng.',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '"{{form}}" chưa có trong thư viện của bạn. Hãy tra từ này ở tab Tìm kiếm để tạo thẻ.',
  '"{{name}}" will be removed.': '"{{name}}" sẽ bị xóa.',
  '"{{term}}" is new': '"{{term}}" là từ mới',
  '+ New': '+ Mới',
  '+ New deck': '+ Bộ thẻ mới',
  'A cloze card blanks out part of a sentence for you to fill in - a different way of practicing the same word.':
    'Thẻ điền khuyết ẩn đi một phần của câu để bạn điền vào - một cách khác để luyện tập cùng một từ.',
  'A green checkmark means the word is already in one of your decks.':
    'Dấu tích xanh nghĩa là từ đó đã có trong một bộ thẻ của bạn.',
  'A readable word - meaning - example list. Not meant to re-import.':
    'Danh sách từ - nghĩa - ví dụ dễ đọc. Không dùng để nhập lại.',
  'A shared deck (.lem)': 'Bộ thẻ được chia sẻ (.lem)',
  'A short summary': 'Một tóm tắt ngắn gọn',
  AGAIN: 'LẠI',
  'AI Providers': 'Nhà cung cấp AI',
  'AI not configured': 'Chưa thiết lập AI',
  'AI-generated - explanations can be inaccurate. Check important details against a trusted reference.':
    'Do AI tạo ra - phần giải thích có thể không chính xác. Hãy kiểm tra lại các chi tiết quan trọng với nguồn đáng tin cậy.',
  'On an AI-generated card, the short explanation right below the translation states directly what the word means and where or why it\'s used - not a hint to figure out yourself.':
    'Trên thẻ do AI tạo, phần giải thích ngắn ngay dưới bản dịch nói thẳng nghĩa của từ và nơi hoặc lý do dùng từ đó - không phải gợi ý để bạn tự đoán.',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'Khóa API được lưu ngay trên thiết bị này (Expo SecureStore) và không bao giờ được đưa vào bản xuất hay bản sao lưu.',
  About: 'Giới thiệu',
  'Accent color': 'Màu nhấn',
  'Accent color swatches write a custom property at the top of your CSS:':
    'Các mẫu màu nhấn sẽ ghi một thuộc tính tùy chỉnh ở đầu CSS của bạn:',
  Active: 'Đang dùng',
  'Active provider': 'Nhà cung cấp đang dùng',
  'Active: {{selection}}': 'Đang dùng: {{selection}}',
  'Advanced Grammar Options': 'Tùy chọn ngữ pháp nâng cao',
  'Select grammar structures to exercise in your examples:': 'Chọn các cấu trúc ngữ pháp để luyện tập trong ví dụ của bạn:',
  'Generate targeted examples': 'Tạo các ví dụ mục tiêu',
  'Custom Grammar Rule': 'Quy tắc ngữ pháp tùy chỉnh',
  'e.g. Past perfect continuous, reported speech...': 'ví dụ: Quá khứ hoàn thành tiếp diễn, câu gián tiếp...',
  Add: 'Thêm',
  'Add "{{form}}" to...': 'Thêm "{{form}}" vào...',
  'Add "{{term}}" to...': 'Thêm "{{term}}" vào...',
  "Add a deck someone shared with you - full fidelity, including review history. Doesn't touch anything else on this device.":
    'Thêm một bộ thẻ ai đó đã chia sẻ với bạn - giữ nguyên đầy đủ, kể cả lịch sử ôn tập. Không ảnh hưởng đến bất cứ thứ gì khác trên thiết bị này.',
  'Add a key above to enable': 'Thêm khóa ở trên để bật',
  'Add a key in AI Providers to enable': 'Thêm khóa trong mục Nhà cung cấp AI để bật',
  'Add a second, separate card for the same word.':
    'Thêm một thẻ thứ hai, riêng biệt, cho cùng một từ.',
  'Add a sentence': 'Thêm một câu',
  'Add a sentence by typing it, pasting it from your clipboard, or sharing text here from another app.':
    'Thêm một câu bằng cách gõ, dán từ khay nhớ tạm, hoặc chia sẻ văn bản đến đây từ ứng dụng khác.',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet - it lands here before any AI processing.':
    'Thêm một câu thủ công, dán từ khay nhớ tạm, hoặc lấy văn bản từ bảng chia sẻ - câu sẽ nằm ở đây trước khi được AI xử lý.',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'Thêm khóa OpenAI, Mistral, Gemini hoặc Claude trong Cài đặt để tạo giải thích cho nghĩa này.',
  'Add and review some words to see your learning statistics here.':
    'Thêm và ôn tập vài từ để xem thống kê học tập của bạn ở đây.',
  'Add card': 'Thêm thẻ',
  'Add card manually': 'Thêm thẻ thủ công',
  'Add this as another meaning on the existing card.':
    'Thêm cái này như một nghĩa khác vào thẻ đã có.',
  'Add to Lemmory': 'Thêm vào Lemmory',
  'Add to Mining queue': 'Thêm vào hàng đợi Khai thác',
  'Add to deck': 'Thêm vào bộ thẻ',
  'Add to queue': 'Thêm vào hàng đợi',
  'Add your AI provider key in Settings to ask a follow-up.':
    'Thêm khóa nhà cung cấp AI trong Cài đặt để đặt câu hỏi thêm.',
  'Add your AI provider key in Settings to generate an explanation.':
    'Thêm khóa nhà cung cấp AI trong Cài đặt để tạo giải thích.',
  'Add your AI provider key in Settings to regenerate this card.':
    'Thêm khóa nhà cung cấp AI trong Cài đặt để tạo lại thẻ này.',
  'Add your OpenAI key in Settings to generate cards.':
    'Thêm khóa OpenAI trong Cài đặt để tạo thẻ.',
  'Add your OpenAI key in Settings to generate examples.':
    'Thêm khóa OpenAI trong Cài đặt để tạo ví dụ.',
  'Add your OpenAI key in Settings to generate new words':
    'Thêm khóa OpenAI trong Cài đặt để tạo từ mới',
  'Add your OpenAI key in Settings to generate targeted examples.':
    'Thêm khóa OpenAI trong Cài đặt để tạo ví dụ theo yêu cầu.',
  'Meanings in this word': 'Các nghĩa của từ này',
  'Grammar info': 'Thông tin ngữ pháp',
  'Hide grammar info': 'Ẩn thông tin ngữ pháp',
  'chat with your AI tutor': 'trò chuyện với gia sư AI của bạn',
  'Ask about "{{word}}"': 'Hỏi về "{{word}}"',
  'Chat with your AI tutor about this word - ask for more examples, nuance, or anything unclear.':
    'Trò chuyện với gia sư AI của bạn về từ này - hỏi thêm ví dụ, sắc thái nghĩa, hoặc bất cứ điều gì chưa rõ.',
  "Couldn't load the explanation.": 'Không thể tải phần giải thích.',
  "Couldn't load additional info.": 'Không thể tải thêm thông tin.',
  'Nothing to chat about yet': 'Chưa có gì để trò chuyện',
  "This card has no meaning content yet, so there's nothing to discuss. Open it from the word's own page and try Regenerate there.":
    'Thẻ này chưa có nội dung nghĩa, nên chưa có gì để bàn. Hãy mở nó từ trang riêng của từ và thử "Tạo lại" ở đó.',
  'Give me another example': 'Cho tôi một ví dụ khác',
  "What's a synonym for this?": 'Từ đồng nghĩa của từ này là gì?',
  'When would I use this?': 'Khi nào tôi nên dùng từ này?',
  "Couldn't get a reply.": 'Không thể nhận được phản hồi.',
  'Message your AI tutor...': 'Nhắn tin cho gia sư AI của bạn...',
  'Add your OpenAI key to generate cards': 'Thêm khóa OpenAI để tạo thẻ',
  'Explore Full AI Flashcard': 'Khám phá thẻ AI đầy đủ',
  'Generate Full AI Flashcard': 'Tạo thẻ AI đầy đủ',
  'AI Insights': 'Thông tin chi tiết AI',
  'Getting AI insights for "{{word}}"...': 'Đang lấy thông tin AI cho "{{word}}"...',
  'Load more phrases with AI': 'Tải thêm cụm từ bằng AI',
  'Explore idioms and collocations with AI': 'Khám phá thành ngữ và cụm từ bằng AI',
  'Tap the sparkle above to explore idioms, expressions, and common word combinations.':
    'Chạm vào biểu tượng lấp lánh ở trên để khám phá thành ngữ, cách diễn đạt và các cụm từ thông dụng.',
  'Could not load more info': 'Không thể tải thêm thông tin',
  'Add your AI provider key in Settings to generate more info.':
    'Thêm khóa nhà cung cấp AI trong Cài đặt để tạo thêm thông tin.',
  'No additional info available yet.': 'Chưa có thông tin bổ sung nào.',
  'Added ✓ - add to another deck': 'Đã thêm ✓ - thêm vào bộ thẻ khác',
  'Adding from other apps': 'Thêm từ ứng dụng khác',
  'Adding to a deck': 'Thêm vào một bộ thẻ',
  'Adding...': 'Đang thêm...',
  Adjective: 'Tính từ',
  'Advanced grammar options': 'Tùy chọn ngữ pháp nâng cao',
  Adverb: 'Trạng từ',
  'All caught up - nothing due right now.': 'Đã xong hết - hiện chưa có thẻ nào đến hạn.',
  'Alternatively, generate a new key from a project that already has it enabled (or the "Default project" if you have one).':
    'Hoặc bạn có thể tạo khóa mới từ một dự án đã bật tính năng này (hoặc "Dự án mặc định" nếu có).',
  'Always open Search, split between Search and the Mining queue depending on how much text it is, or ask you every time.':
    'Luôn mở Tìm kiếm, chia giữa Tìm kiếm và hàng đợi Khai thác tùy theo lượng văn bản, hoặc hỏi bạn mỗi lần.',
  'Anki deck (.apkg)': 'Bộ thẻ Anki (.apkg)',
  'Anki, CSV, JSON backup': 'Anki, CSV, sao lưu JSON',
  Answer: 'Đáp án',
  'App Language': 'Ngôn ngữ ứng dụng',
  'App version, platform, and feature tier - helps reproduce a bug.':
    'Phiên bản ứng dụng, nền tảng và gói tính năng - giúp tái hiện lỗi.',
  'App {{version}} · {{platform}} · {{tier}}': 'Ứng dụng {{version}} · {{platform}} · {{tier}}',
  'Applied to both sides in the real WebView renderer.':
    'Được áp dụng cho cả hai mặt trong bộ hiển thị WebView thật.',
  'Applies across the app.': 'Áp dụng cho toàn bộ ứng dụng.',
  'Applies to every duplicate row you leave checked in the next step.':
    'Áp dụng cho mọi dòng trùng lặp bạn để đánh dấu ở bước tiếp theo.',
  Article: 'Mạo từ',
  Ask: 'Hỏi',
  'Ask AI': 'Hỏi AI',
  'Ask a follow-up question, maximum {{max}} characters': 'Đặt câu hỏi thêm, tối đa {{max}} ký tự',
  'Ask a short follow-up...': 'Đặt một câu hỏi ngắn...',
  'Asking...': 'Đang hỏi...',
  'At most every': 'Tối đa mỗi',
  'Audio Settings': 'Cài đặt âm thanh',
  'Audio Settings help': 'Trợ giúp Cài đặt âm thanh',
  'Audio settings, app language': 'Cài đặt âm thanh, ngôn ngữ ứng dụng',
  'Aura-2. Once your key is entered, choose from Deepgram\'s available models, or switch to manual entry to enter a model name directly (see Deepgram\'s docs for exact names).':
    'Aura-2. Sau khi nhập khóa, hãy chọn một trong các mô hình có sẵn của Deepgram, hoặc chuyển sang nhập thủ công để gõ tên mô hình trực tiếp (xem tài liệu Deepgram để biết tên chính xác).',
  'Automatic sync': 'Đồng bộ tự động',
  'Available template variables': 'Các biến mẫu có sẵn',
  Back: 'Mặt sau',
  'Back (Liquid)': 'Mặt sau (Liquid)',
  'Back to deck': 'Quay lại bộ thẻ',
  'Backup ready': 'Bản sao lưu đã sẵn sàng',
  'Basic inline HTML works too - {{bold}}, {{italic}}, {{colored}}.':
    'HTML nội tuyến cơ bản cũng hoạt động - {{bold}}, {{italic}}, {{colored}}.',
  'Best German↔English quality - bring your own key':
    'Chất lượng Đức↔Anh tốt nhất - dùng khóa của riêng bạn',
  "Bring your existing decks. Review history isn't imported - cards start fresh.":
    'Mang các bộ thẻ hiện có của bạn vào. Lịch sử ôn tập không được nhập - thẻ sẽ bắt đầu lại từ đầu.',
  CSS: 'CSS',
  CSV: 'CSV',
  'CSV with column mapping': 'CSV với ánh xạ cột',
  Cancel: 'Hủy',
  'Card Templates': 'Mẫu thẻ',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key - nothing is sent until you generate a card.':
    'Việc tạo thẻ (nghĩa, ví dụ, cụm nghĩa, cụm từ, điền khuyết) dùng bất kỳ nhà cung cấp nào bên dưới đã được thiết lập và bật. Dùng khóa API của riêng bạn - không có gì được gửi đi cho đến khi bạn tạo thẻ.',
  'Card templates': 'Mẫu thẻ',
  Cards: 'Thẻ',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    'Những thẻ chỉ có trong bộ thẻ này sẽ bị xóa cùng nó. Thẻ nằm trong các bộ thẻ khác vẫn được giữ nguyên.',
  'Checking...': 'Đang kiểm tra...',
  'Choose .apkg file': 'Chọn tệp .apkg',
  'Choose .lem file': 'Chọn tệp .lem',
  'Choose CSV file': 'Chọn tệp CSV',
  'Choose a Lemmory `.lem` file - a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    'Chọn một tệp Lemmory `.lem` - bộ thẻ ai đó chia sẻ với bạn, hoặc một bản xuất từ bộ thẻ của chính bạn. Giữ nguyên đầy đủ: nghĩa, ví dụ, từ đồng nghĩa, thẻ điền khuyết, lịch sử ôn tập và lịch trình FSRS đều được mang theo.',
  "Choose a `.apkg` export. Review history isn't imported - every card starts fresh - and media (audio/images) is stripped rather than copied.":
    'Chọn một bản xuất `.apkg`. Lịch sử ôn tập không được nhập - mọi thẻ đều bắt đầu lại từ đầu - và media (âm thanh/hình ảnh) sẽ bị loại bỏ thay vì được sao chép.',
  'Choose a voice...': 'Chọn một giọng đọc...',
  'Choose backup file': 'Chọn tệp sao lưu',
  'Choose from your {{provider}} voices instead':
    'Thay vào đó, chọn từ các giọng đọc {{provider}} của bạn',
  'Choose where to save it.': 'Chọn nơi lưu tệp.',
  'Choosing what to keep': 'Chọn những gì cần giữ lại',
  Chunks: 'Phần dữ liệu',
  Clear: 'Xóa',
  'Clipboard is empty': 'Khay nhớ tạm đang trống',
  Close: 'Đóng',
  'Cloud providers are bring-your-own-key - nothing is sent to them until you tap a speaker icon or press Test.':
    'Các nhà cung cấp trên đám mây dùng khóa của riêng bạn - không có gì được gửi đến họ cho đến khi bạn chạm biểu tượng loa hoặc nhấn Thử.',
  Cloze: 'Điền khuyết',
  'Cloze card': 'Thẻ điền khuyết',
  'Cloze cards': 'Thẻ điền khuyết',
  'Code tab': 'Tab Mã',
  'Column {{n}}': 'Cột {{n}}',
  'Comma-separated': 'Phân cách bằng dấu phẩy',
  'Conditional example': 'Ví dụ có điều kiện',
  Conjunction: 'Liên từ',
  Conjunctions: 'Liên từ',
  Connected: 'Đã kết nối',
  Continue: 'Tiếp tục',
  'Copy some text first, then paste it here.':
    'Sao chép một đoạn văn bản trước, sau đó dán vào đây.',
  'Could not add card': 'Không thể thêm thẻ',
  'Could not change the primary meaning': 'Không thể đổi nghĩa chính',
  'Could not create deck': 'Không thể tạo bộ thẻ',
  'Could not delete deck': 'Không thể xóa bộ thẻ',
  'Could not delete template': 'Không thể xóa mẫu',
  'Could not discard capture': 'Không thể bỏ mục đã ghi lại',
  'Could not generate an example': 'Không thể tạo ví dụ',
  'Could not generate an explanation': 'Không thể tạo giải thích',
  'Could not get an answer': 'Không thể nhận được câu trả lời',
  'Could not install local dictionaries': 'Không thể cài đặt từ điển ngoại tuyến',
  'Could not install this chunk': 'Không thể cài đặt phần dữ liệu này',
  'Could not look up an explanation': 'Không thể tra cứu giải thích',
  'Could not merge deck': 'Không thể gộp bộ thẻ',
  'Could not move deck': 'Không thể di chuyển bộ thẻ',
  'Could not read clipboard': 'Không thể đọc khay nhớ tạm',
  '✨ AI enriching meanings & examples...': '✨ AI đang bổ sung nghĩa và ví dụ...',
  'AI Enrichment Failed': 'Bổ sung AI thất bại',
  'Selected model is not accessible with your {{providerName}} key/project. Try selecting a different model in Settings > AI Providers.':
    'Mô hình đã chọn không thể truy cập bằng khóa/dự án {{providerName}} của bạn. Thử chọn mô hình khác trong Cài đặt > Nhà cung cấp AI.',
  '{{providerName}} credit balance or quota exceeded. Please check your account plan and billing details.':
    'Hạn ngạch hoặc số dư {{providerName}} đã hết. Vui lòng kiểm tra gói tài khoản và thông tin thanh toán.',
  '{{providerName}} rate limit reached. Please wait a few seconds and try again.':
    'Đã đạt giới hạn yêu cầu của {{providerName}}. Vui lòng đợi vài giây và thử lại.',
  'Invalid {{providerName}} API key or permission denied. Please check your key in Settings > AI Providers.':
    'Khóa API {{providerName}} không hợp lệ hoặc bị từ chối quyền. Vui lòng kiểm tra khóa trong Cài đặt > Nhà cung cấp AI.',
  "Couldn't reach {{providerName}} - check your device's internet connection and try again.":
    'Không thể kết nối tới {{providerName}} - kiểm tra kết nối internet của thiết bị và thử lại.',
  '{{providerName}} servers are temporarily unavailable ({{status}}). Please try again shortly.':
    'Máy chủ {{providerName}} tạm thời không khả dụng ({{status}}). Vui lòng thử lại sau ít phút.',
  'Could not read file': 'Không thể đọc tệp',
  'Could not read this collection': 'Không thể đọc bộ sưu tập này',
  'Could not read this file': 'Không thể đọc tệp này',
  'Could not regenerate this card': 'Không thể tạo lại thẻ này',
  'Could not remove card': 'Không thể xóa thẻ',
  'Could not remove this chunk': 'Không thể xóa phần dữ liệu này',
  'Could not reset progress': 'Không thể đặt lại tiến trình',
  'Could not save capture': 'Không thể lưu mục đã ghi lại',
  'Could not save template': 'Không thể lưu mẫu',
  'Could not save your changes': 'Không thể lưu thay đổi của bạn',
  'Could not save your feedback': 'Không thể lưu phản hồi của bạn',
  'Could not save your rating': 'Không thể lưu đánh giá của bạn',
  'Could not save your report': 'Không thể lưu báo cáo của bạn',
  'Could not set default template': 'Không thể đặt mẫu mặc định',
  'Could not sign in': 'Không thể đăng nhập',
  'Could not uninstall local dictionaries': 'Không thể gỡ cài đặt từ điển ngoại tuyến',
  'Could not update the flashcard example': 'Không thể cập nhật ví dụ trên thẻ ghi nhớ',
  "Couldn't load saved settings": 'Không thể tải cài đặt đã lưu',
  Create: 'Tạo',
  'Create & select': 'Tạo & chọn',
  'Create deck': 'Tạo bộ thẻ',
  'Create new deck': 'Tạo bộ thẻ mới',
  'Create template': 'Tạo mẫu',
  'Create your first deck with the + button.': 'Tạo bộ thẻ đầu tiên của bạn bằng nút +.',
  'Creating a GitHub issue needs a token with write access to the repo - that can never ship inside the app, since a compiled build can be decompiled and any embedded secret treated as public.':
    'Việc tạo issue trên GitHub cần một token có quyền ghi vào kho lưu trữ - token đó không bao giờ có thể đi kèm trong ứng dụng, vì bản build đã biên dịch có thể bị dịch ngược và bất kỳ bí mật nào nhúng vào cũng bị xem là công khai.',
  'Creating...': 'Đang tạo...',
  'Customize card layouts': 'Tùy chỉnh bố cục thẻ',
  Data: 'Dữ liệu',
  Deck: 'Bộ thẻ',
  'Deck name': 'Tên bộ thẻ',
  Decks: 'Bộ thẻ',
  'DeepL validation failed': 'Xác thực DeepL thất bại',
  Deepgram: 'Deepgram',
  'Default CEFR level': 'Cấp độ CEFR mặc định',
  'Word of the Day reminder': 'Nhắc nhở "Từ trong ngày"',
  'When the daily notification for your Home screen word arrives.':
    'Khi nào thông báo hằng ngày cho từ ở màn hình chính của bạn xuất hiện.',
  'Default: {{voice}}': 'Mặc định: {{voice}}',
  Delete: 'Xóa',
  'Delete All AI Providers Keys': 'Xóa tất cả khóa nhà cung cấp AI',
  'Delete all AI provider keys?': 'Xóa tất cả khóa nhà cung cấp AI?',
  'Delete all API keys': 'Xóa tất cả khóa API',
  'Delete all API keys?': 'Xóa tất cả khóa API?',
  'Delete deck': 'Xóa bộ thẻ',
  'Delete deck?': 'Xóa bộ thẻ?',
  'Delete this template?': 'Xóa mẫu này?',
  'Deleting...': 'Đang xóa...',
  'Depending on a setting in Settings, under "Share & Search," a shared sentence might land here right away, or you might get asked what to do with it first.':
    'Tùy theo cài đặt trong mục "Chia sẻ & Tìm kiếm" của Cài đặt, một câu được chia sẻ có thể xuất hiện ở đây ngay lập tức, hoặc bạn có thể được hỏi trước xem muốn làm gì với nó.',
  Details: 'Chi tiết',
  'Device (built-in)': 'Thiết bị (tích hợp sẵn)',
  'Device default': 'Mặc định thiết bị',
  'Device-observed usage': 'Mức sử dụng ghi nhận trên thiết bị',
  'Difficult words': 'Từ khó',
  'Display on Flashcard': 'Hiển thị trên thẻ ghi nhớ',
  "Don't touch the existing word.": 'Không thay đổi từ đã có.',
  "Don't touch the word already in your library.":
    'Không thay đổi từ đã có trong thư viện của bạn.',
  Done: 'Xong',
  Duplicates: 'Trùng lặp',
  EASY: 'DỄ',
  'Each provider\'s own "Test this provider" button plays through that card\'s current key/voice/speed directly, regardless of which engine is Active - use it to check a setup before switching to it.':
    'Nút "Thử nhà cung cấp này" riêng của mỗi thẻ sẽ phát trực tiếp bằng khóa/giọng đọc/tốc độ hiện tại của thẻ đó, bất kể bộ máy nào đang được đánh dấu Đang dùng - dùng để kiểm tra cài đặt trước khi chuyển sang dùng nó.',
  'Each row is one piece of card data. Tap "Front" or "Back" to show that field on that side - a field can appear on both, on neither, or on just one.':
    'Mỗi dòng là một mảnh dữ liệu của thẻ. Chạm "Mặt trước" hoặc "Mặt sau" để hiển thị trường đó trên mặt tương ứng - một trường có thể xuất hiện ở cả hai mặt, không mặt nào, hoặc chỉ một mặt.',
  Edit: 'Sửa',
  'Edit this card': 'Sửa thẻ này',
  ElevenLabs: 'ElevenLabs',
  'Email (Optional)': 'Email (Không bắt buộc)',
  'Emoji (optional)': 'Emoji (không bắt buộc)',
  Enabled: 'Đã bật',
  English: 'Tiếng Anh',
  Enhanced: 'Nâng cao',
  'Enter the word first.': 'Hãy nhập từ trước.',
  Errors: 'Lỗi',
  'Every card in "{{name}}" goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    'Mọi thẻ trong "{{name}}" sẽ trở về trạng thái "mới" - cả việc ôn nghĩa từ và luyện điền khuyết đều bắt đầu lại từ đầu. Lịch sử ôn tập của bạn vẫn được giữ. Không thể hoàn tác thao tác này.',
  'Every card in this deck goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.':
    'Mọi thẻ trong bộ thẻ này sẽ trở về trạng thái "mới" - cả việc ôn nghĩa từ và luyện điền khuyết đều bắt đầu lại từ đầu. Lịch sử ôn tập của bạn vẫn được giữ. Không thể hoàn tác thao tác này.',
  'Every speaker button in the app uses whichever engine is marked Active below.':
    'Mọi nút loa trong ứng dụng đều dùng bộ máy được đánh dấu Đang dùng bên dưới.',
  'Everything in the queue is selected by default. Tap a card to include or leave it out, or use the trash icon to remove it for good.':
    'Mọi mục trong hàng đợi đều được chọn sẵn theo mặc định. Chạm vào một thẻ để bao gồm hoặc bỏ qua, hoặc dùng biểu tượng thùng rác để xóa hẳn.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes - they're derived from the example's cloze markup and its translation.":
    'Mọi thứ đều không bắt buộc. Để trống ánh xạ Từ/Nghĩa cho ghi chú Điền khuyết - chúng được suy ra từ đánh dấu điền khuyết của ví dụ và bản dịch của nó.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes - they're derived from the example's cloze markup and its translation.":
    'Mọi thứ đều không bắt buộc. Để trống ánh xạ Từ/Nghĩa cho ghi chú kiểu Điền khuyết - chúng được suy ra từ đánh dấu điền khuyết của ví dụ và bản dịch của nó.',
  'Everything renders inside a real WebView, so standard CSS applies as on any web page - flexbox, custom fonts via @font-face, transitions, etc. all work; there is no special "app CSS" subset to learn beyond this.':
    'Mọi thứ được hiển thị trong một WebView thật, nên CSS chuẩn hoạt động như trên bất kỳ trang web nào - flexbox, phông chữ tùy chỉnh qua @font-face, hiệu ứng chuyển động, v.v. đều hoạt động; không có tập con "CSS riêng của ứng dụng" nào khác cần học.',
  Example: 'Ví dụ',
  'Example sentence': 'Câu ví dụ',
  'Example sentences': 'Câu ví dụ',
  'Example sentences show the word used in context, with a translation underneath.':
    'Câu ví dụ cho thấy từ được dùng trong ngữ cảnh, kèm bản dịch bên dưới.',
  'Example translation': 'Bản dịch ví dụ',
  Examples: 'Ví dụ',
  'Examples and explanations are calibrated to this level.':
    'Ví dụ và giải thích được điều chỉnh theo cấp độ này.',
  'Examples generated from a selected option get a highlighted background, so you can tell which ones came from your request.':
    'Các ví dụ được tạo từ một tùy chọn đã chọn sẽ có nền được tô sáng, để bạn biết cái nào đến từ yêu cầu của mình.',
  'Examples of Usage': 'Ví dụ sử dụng',
  'Explain, Ask AI & more': 'Giải thích, Hỏi AI & nhiều hơn nữa',
  'Explanations and the "More info" follow-up use this language.':
    'Phần giải thích và mục "Xem thêm" sẽ dùng ngôn ngữ này.',
  Export: 'Xuất',
  'Export "{{name}}"': 'Xuất "{{name}}"',
  'Export as .apkg': 'Xuất dưới dạng .apkg',
  'Export as CSV': 'Xuất dưới dạng CSV',
  'Export as Markdown': 'Xuất dưới dạng Markdown',
  'Export everything': 'Xuất tất cả',
  'Export failed': 'Xuất thất bại',
  'Export ready': 'Đã sẵn sàng để xuất',
  'Export this deck': 'Xuất bộ thẻ này',
  'Exported {{count}} cards.': 'Đã xuất {{count}} thẻ.',
  'Exporting...': 'Đang xuất...',
  Expression: 'Cách diễn đạt',
  Failed: 'Thất bại',
  'Field mapping': 'Ánh xạ trường',
  'Field {{n}}': 'Trường {{n}}',
  Fields: 'Trường',
  'Fields added via the toggles are never auto-wrapped in a <div> or <span> - {{ word }} renders as bare text directly inside the card body. That keeps generated templates minimal, but it means a rule like ".word { ... }" has nothing to match unless you add that class yourself.':
    'Các trường được thêm qua công tắc bật/tắt sẽ không bao giờ tự động được bọc trong <div> hay <span> - {{ word }} hiển thị như văn bản trần trực tiếp trong thân thẻ. Điều này giữ cho mẫu được tạo ra tối giản, nhưng nghĩa là một quy tắc như ".word { ... }" sẽ không khớp với gì cả trừ khi bạn tự thêm class đó.',
  'Fields tab': 'Tab Trường',
  'Focus words': 'Từ trọng tâm',
  'Follow device': 'Theo máy',
  "Found a sentence somewhere else, like an article or a message? Share it to Lemmory the same way you'd share it to any other app.":
    'Tìm thấy một câu ở đâu đó, như trong bài báo hay tin nhắn? Hãy chia sẻ nó đến Lemmory giống như cách bạn chia sẻ đến bất kỳ ứng dụng nào khác.',
  'Free starter dictionary - no AI key needed': 'Từ điển khởi đầu miễn phí - không cần khóa AI',
  'Free tier, no key needed': 'Gói miễn phí, không cần khóa',
  French: 'Tiếng Pháp',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Từ Quizlet, Memrise, hoặc bản xuất bảng tính. Bạn sẽ chọn ý nghĩa của từng cột ở bước tiếp theo.',
  'From Quizlet, Memrise, or spreadsheets.': 'Từ Quizlet, Memrise, hoặc bảng tính.',
  'From your installed dictionary - free, no AI needed.':
    'Từ từ điển đã cài đặt của bạn - miễn phí, không cần AI.',
  Front: 'Mặt trước',
  'Front (Liquid)': 'Mặt trước (Liquid)',
  'Front and Back are raw Liquid templates - anything valid Liquid works here, not just what the Fields toggles generate.':
    'Mặt trước và Mặt sau là các mẫu Liquid thuần túy - bất kỳ cú pháp Liquid hợp lệ nào cũng dùng được ở đây, không chỉ những gì công tắc Trường tạo ra.',
  "Front and Back are separate - the chip above the card switches which side is rendered, so you always know exactly which side you're looking at.":
    'Mặt trước và Mặt sau tách biệt - nhãn phía trên thẻ chuyển đổi mặt nào đang được hiển thị, để bạn luôn biết chính xác mình đang xem mặt nào.',
  Full: 'Đầy đủ',
  GOOD: 'TỐT',
  Gender: 'Giống',
  General: 'Chung',
  'General settings help': 'Trợ giúp cài đặt chung',
  'Generate examples': 'Tạo ví dụ',
  'Generate with AI': 'Tạo bằng AI',
  'Generate {{count}} cards with AI': 'Tạo {{count}} thẻ bằng AI',
  'Generated with AI - not from your installed dictionary.':
    'Được tạo bằng AI - không phải từ từ điển đã cài đặt của bạn.',
  'Generating your card...': 'Đang tạo thẻ của bạn...',
  'Generating...': 'Đang tạo...',
  Generation: 'Tạo nội dung',
  'Generation came back incomplete': 'Kết quả tạo nội dung bị thiếu',
  'Generation came back incomplete - nothing was changed. Try again.':
    'Kết quả tạo nội dung bị thiếu - không có gì được thay đổi. Hãy thử lại.',
  German: 'Tiếng Đức',
  '{{language}}-English Dictionary': 'Từ điển {{language}}-Anh',
  'Give the deck a name.': 'Đặt tên cho bộ thẻ.',
  'Go to platform.openai.com > Settings > Projects > select the project this key belongs to > Models > enable gpt-4o-mini-tts for that project.':
    'Vào platform.openai.com > Settings > Projects > chọn dự án mà khóa này thuộc về > Models > bật gpt-4o-mini-tts cho dự án đó.',
  'Google Translate': 'Google Dịch',
  'Grammar error': 'Lỗi ngữ pháp',
  HARD: 'KHÓ',
  'HTML & CSS without extra elements': 'HTML & CSS không cần phần tử thừa',
  'Hide DeepL API key': 'Ẩn khóa API DeepL',
  'Hide DeepL settings': 'Ẩn cài đặt DeepL',
  'Hide details': 'Ẩn chi tiết',
  'Hide {{provider}} API key': 'Ẩn khóa API {{provider}}',
  Hindi: 'Tiếng Hindi',
  Home: 'Trang chủ',
  'How Audio Settings works': 'Cách Cài đặt âm thanh hoạt động',
  'I speak': 'Tôi nói',
  "I'm learning": 'Tôi đang học',
  'If Validate says a project doesn\'t have access to gpt-4o-mini-tts, but the model works fine on platform.openai.com, your API key is scoped to a specific OpenAI Project that hasn\'t enabled it.':
    'Nếu chức năng Xác thực báo rằng dự án không có quyền truy cập gpt-4o-mini-tts, nhưng mô hình vẫn chạy tốt trên platform.openai.com, thì khóa API của bạn đang giới hạn trong một OpenAI Project cụ thể chưa bật tính năng này.',
  'If a cloud key is invalid, the provider is unreachable, or a request fails, playback falls back to the device voice automatically - you\'re never left with silence.':
    'Nếu khóa trên đám mây không hợp lệ, nhà cung cấp không thể kết nối, hoặc yêu cầu thất bại, việc phát âm thanh sẽ tự động chuyển về giọng đọc của thiết bị - bạn sẽ không bao giờ bị im lặng hoàn toàn.',
  "If a word isn't in your library yet, you may see a quick built-in dictionary entry and/or a translation preview - both are read-only until you choose to add one to a deck.":
    'Nếu một từ chưa có trong thư viện của bạn, bạn có thể thấy nhanh một mục từ điển tích hợp và/hoặc bản xem trước bản dịch - cả hai đều chỉ để xem cho đến khi bạn chọn thêm vào một bộ thẻ.',
  'If no model is picked, a default is chosen to match whatever language is set under Settings > Learning > "I\'m learning" (English, German, Spanish, or French) - other languages fall back to an English voice until you pick one manually.':
    'Nếu không chọn mô hình nào, một mô hình mặc định sẽ được chọn để phù hợp với ngôn ngữ đặt trong Cài đặt > Học tập > "Tôi đang học" (tiếng Anh, Đức, Tây Ban Nha, hoặc Pháp) - các ngôn ngữ khác sẽ dùng tạm giọng tiếng Anh cho đến khi bạn tự chọn.',
  'If no voice is picked, a known-good multilingual default voice is used automatically.':
    'Nếu không chọn giọng đọc nào, một giọng đọc đa ngôn ngữ mặc định đã được kiểm chứng sẽ tự động được dùng.',
  'If the word already exists': 'Nếu từ đã tồn tại',
  'If this word has more than one distinct sense - say, a casual meaning and a business one - you\'ll see small labeled capsules (like "social" or "formal") just above the translation. Tap one to switch; each keeps its own examples and synonyms.':
    'Nếu từ này có nhiều hơn một nghĩa khác biệt - chẳng hạn một nghĩa thông dụng và một nghĩa trong kinh doanh - bạn sẽ thấy các nhãn nhỏ (như "thông dụng" hoặc "trang trọng") ngay phía trên bản dịch. Chạm vào một nhãn để chuyển đổi; mỗi nhãn giữ riêng ví dụ và từ đồng nghĩa của mình.',
  Import: 'Nhập',
  'Import & Export': 'Nhập & Xuất',
  'Import & export': 'Nhập & xuất',
  'Import & export, templates, local dictionaries': 'Nhập & xuất, mẫu thẻ, từ điển ngoại tuyến',
  'Import Anki deck': 'Nhập bộ thẻ Anki',
  'Import CSV': 'Nhập CSV',
  'Import another file': 'Nhập tệp khác',
  'Import canceled': 'Đã hủy nhập',
  'Import complete': 'Đã nhập xong',
  'Import failed': 'Nhập thất bại',
  'Import from Anki': 'Nhập từ Anki',
  'Import from CSV': 'Nhập từ CSV',
  'Import from a .lem file': 'Nhập từ tệp .lem',
  'Import into "{{name}}"': 'Nhập vào "{{name}}"',
  'Import into deck': 'Nhập vào bộ thẻ',
  'Import into this deck': 'Nhập vào bộ thẻ này',
  'Import {{count}} rows': 'Nhập {{count}} dòng',
  'Import {{count}} words': 'Nhập {{count}} từ',
  Imported: 'Đã nhập',
  'Imported {{count}} words.': 'Đã nhập {{count}} từ.',
  'Imported {{words}} words ({{cards}} cards).': 'Đã nhập {{words}} từ ({{cards}} thẻ).',
  'Importing "{{name}}" ({{count}} cards).': 'Đang nhập "{{name}}" ({{count}} thẻ).',
  'Importing...': 'Đang nhập...',
  'Inaccurate translation': 'Bản dịch không chính xác',
  'Include diagnostics': 'Kèm thông tin chẩn đoán',
  'Inflected or conjugated forms work too, not just the base/dictionary form of a word.':
    'Các dạng biến đổi hoặc chia động từ cũng dùng được, không chỉ dạng gốc/từ điển của từ.',
  Install: 'Cài đặt',
  'Install all available': 'Cài đặt tất cả các phần có sẵn',
  'Install more voices from your phone\'s system settings if the one you want isn\'t listed.':
    'Cài thêm giọng đọc từ cài đặt hệ thống của điện thoại nếu giọng bạn muốn không có trong danh sách.',
  Installed: 'Đã cài đặt',
  'Installed {{count}} new chunks.': 'Đã cài đặt {{count}} phần dữ liệu mới.',
  'Installing...': 'Đang cài đặt...',
  'Instant lookup': 'Tra cứu tức thì',
  'Invalid backup file': 'Tệp sao lưu không hợp lệ',
  Issues: 'Vấn đề',
  'Keep both': 'Giữ cả hai',
  'Key validated': 'Khóa đã được xác thực',
  'Last synced: {{when}}': 'Đồng bộ lần cuối: {{when}}',
  'Layout & style': 'Bố cục & kiểu dáng',
  Learning: 'Học tập',
  'Limited mode': 'Chế độ giới hạn',
  'Lemmory backup (.lem)': 'Bản sao lưu Lemmory (.lem)',
  'List fields (Other meanings, Synonyms, Related phrases) already need a {% for %} loop to render at all - that loop is structurally required, not a styling choice. To style each item individually, wrap the item inside the loop:':
    'Các trường dạng danh sách (Nghĩa khác, Từ đồng nghĩa, Cụm từ liên quan) vốn đã cần một vòng lặp {% for %} để hiển thị - vòng lặp đó là yêu cầu về cấu trúc, không phải lựa chọn về kiểu dáng. Để tạo kiểu riêng cho từng mục, hãy bọc mục đó bên trong vòng lặp:',
  'Local Dictionaries': 'Từ điển ngoại tuyến',
  'Local Dictionaries installed': 'Đã cài đặt từ điển ngoại tuyến',
  'Local Dictionaries uninstalled': 'Đã gỡ cài đặt từ điển ngoại tuyến',
  'Long-press a word in any app and pick "Search in Lemmory" to look it up here right away.':
    'Nhấn giữ một từ trong bất kỳ ứng dụng nào và chọn "Tìm trong Lemmory" để tra cứu ngay tại đây.',
  'Long-press a word in any app - your browser, messages, anywhere - and pick "Search in Lemmory." It opens right here with that word ready to go.':
    'Nhấn giữ một từ trong bất kỳ ứng dụng nào - trình duyệt, tin nhắn, bất cứ đâu - và chọn "Tìm trong Lemmory." Nó sẽ mở ngay tại đây với từ đó đã sẵn sàng.',
  'Look up a word': 'Tra một từ',
  'Look up a word to add your first card.': 'Tra một từ để thêm thẻ đầu tiên của bạn.',
  'Make primary: {{translation}}': 'Đặt làm nghĩa chính: {{translation}}',
  Markdown: 'Markdown',
  Meaning: 'Nghĩa',
  Merge: 'Gộp',
  'Merge "{{name}}" into...': 'Gộp "{{name}}" vào...',
  'Merge into "{{name}}"?': 'Gộp vào "{{name}}"?',
  'Merge into...': 'Gộp vào...',
  Message: 'Tin nhắn',
  Mine: 'Khai thác',
  'Mine help': 'Trợ giúp Khai thác',
  'Mine is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    'Khai thác là nơi lưu tạm các câu bạn muốn biến thành thẻ từ vựng sau này - không có gì ở đây xảy ra tự động cả.',
  'Mining queue': 'Hàng đợi khai thác',
  Model: 'Mô hình',
  'More info': 'Xem thêm',
  'Move "{{name}}" to...': 'Di chuyển "{{name}}" đến...',
  'Move to...': 'Di chuyển đến...',
  Never: 'Không bao giờ',
  'Never included: word content, translations, AI responses, or API keys.':
    'Không bao giờ bao gồm: nội dung từ, bản dịch, phản hồi AI, hoặc khóa API.',
  'New deck': 'Bộ thẻ mới',
  'New deck name': 'Tên bộ thẻ mới',
  'New template': 'Mẫu mới',
  'New words are looked up and generated in this language.':
    'Từ mới sẽ được tra cứu và tạo bằng ngôn ngữ này.',
  Next: 'Tiếp theo',
  'Word of the Day': 'Từ trong ngày',
  'Learn this word': 'Học từ này',
  "Finding today's word...": 'Đang tìm từ của hôm nay...',
  '✨ Word of the Day: {{word}}': '✨ Từ trong ngày: {{word}}',
  'Nice to see you back.': 'Rất vui vì bạn đã quay lại.',
  'No AI provider active - open Settings':
    'Không có nhà cung cấp AI nào đang hoạt động - mở Cài đặt',
  'No AI provider is active - add and enable one in Settings to generate new words':
    'Không có nhà cung cấp AI nào đang hoạt động - thêm và bật một nhà cung cấp trong Cài đặt để tạo từ mới',
  'No AI provider is active - add and enable one to generate targeted examples.':
    'Không có nhà cung cấp AI nào đang hoạt động - thêm và bật một nhà cung cấp để tạo ví dụ theo yêu cầu.',
  'No AI provider is active.': 'Không có nhà cung cấp AI nào đang hoạt động.',
  'No AI provider is active. Add and enable one in Settings to generate cards.':
    'Không có nhà cung cấp AI nào đang hoạt động. Thêm và bật một nhà cung cấp trong Cài đặt để tạo thẻ.',
  'No AI provider is active. Add and enable one in Settings to generate examples.':
    'Không có nhà cung cấp AI nào đang hoạt động. Thêm và bật một nhà cung cấp trong Cài đặt để tạo ví dụ.',
  'No AI provider is active. Add and enable one in Settings to generate words.':
    'Không có nhà cung cấp AI nào đang hoạt động. Thêm và bật một nhà cung cấp trong Cài đặt để tạo từ.',
  'No German voices are installed on this device.':
    'Chưa có giọng đọc tiếng Đức nào được cài đặt trên thiết bị này.',
  'No card to edit.': 'Không có thẻ nào để sửa.',
  'No card to rate.': 'Không có thẻ nào để đánh giá.',
  'No cards yet - add words from Search.': 'Chưa có thẻ nào - thêm từ từ Tìm kiếm.',
  'No deck selected.': 'Chưa chọn bộ thẻ nào.',
  'No decks yet': 'Chưa có bộ thẻ nào',
  'No decks yet - create one above.': 'Chưa có bộ thẻ nào - tạo một bộ ở trên.',
  'No dictionary entry to add.': 'Không có mục từ điển nào để thêm.',
  'No explanation yet.': 'Chưa có giải thích.',
  'No internet connection': 'Không có kết nối internet',
  'No lapses yet - nothing difficult to show.':
    'Chưa có lần quên nào - không có gì khó để hiển thị.',
  'No other deck to merge into.': 'Không có bộ thẻ nào khác để gộp vào.',
  'No other deck to nest this one under.': 'Không có bộ thẻ nào khác để lồng bộ này vào.',
  'No provider configured - AI generation disabled':
    'Chưa thiết lập nhà cung cấp nào - tính năng tạo bằng AI bị vô hiệu hóa',
  'No settings match "{{query}}"': 'Không có cài đặt nào khớp với "{{query}}"',
  'No stats yet': 'Chưa có thống kê',
  'No translation to add.': 'Không có bản dịch nào để thêm.',
  'No words yet': 'Chưa có từ nào',
  'No {{language}} voices are installed on this device.':
    'Chưa có giọng đọc {{language}} nào được cài đặt trên thiết bị này.',
  None: 'Không có',
  Normal: 'Bình thường',
  'Not supported yet': 'Chưa được hỗ trợ',
  'Match your native language too?': 'Đổi luôn ngôn ngữ mẹ đẻ của bạn?',
  'You just set the app language to {{language}}. Also set "I speak" to match?':
    'Bạn vừa đặt ngôn ngữ ứng dụng thành {{language}}. Đặt luôn "Tôi nói" theo ngôn ngữ này?',
  'Match the app language too?': 'Đổi luôn ngôn ngữ ứng dụng?',
  'You just set "I speak" to {{language}}. Switch the app\'s own language to match?':
    'Bạn vừa đặt "Tôi nói" thành {{language}}. Đổi luôn ngôn ngữ ứng dụng theo ngôn ngữ này?',
  'Yes, switch it': 'Có, đổi',
  'No, keep it': 'Không, giữ nguyên',
  'Nothing due right now': 'Hiện chưa có gì đến hạn',
  'Nothing due - study ahead': 'Chưa có gì đến hạn - học trước',
  'Nothing to add.': 'Không có gì để thêm.',
  'Nothing was saved - try again.': 'Không có gì được lưu - hãy thử lại.',
  Noun: 'Danh từ',
  'One row per card - the same columns CSV import reads, so this file re-imports as-is.':
    'Mỗi dòng là một thẻ - cùng các cột mà tính năng nhập CSV đọc, nên tệp này có thể được nhập lại nguyên trạng.',
  'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.':
    'Chỉ gồm phiên bản ứng dụng, nền tảng và gói tính năng hiện tại của bạn (Đầy đủ hoặc Chỉ dịch) - đủ để giúp tái hiện lỗi.',
  'Only bother with this if you want to be selective - otherwise everything gets turned into cards together.':
    'Chỉ cần làm việc này nếu bạn muốn chọn lọc - nếu không, mọi thứ sẽ được biến thành thẻ cùng một lúc.',
  'Only if you want a reply - also becomes public once posted.':
    'Chỉ khi bạn muốn nhận phản hồi - cũng sẽ công khai sau khi đăng.',
  'Open DeepL usage ↗': 'Xem mức sử dụng DeepL ↗',
  'Open Settings': 'Mở Cài đặt',
  'Open {{provider}} usage ↗': 'Xem mức sử dụng {{provider}} ↗',
  OpenAI: 'OpenAI',
  'Opening your vocabulary...': 'Đang mở từ vựng của bạn...',
  'Optional details...': 'Chi tiết không bắt buộc...',
  'Or enter an ID manually': 'Hoặc nhập ID thủ công',
  Other: 'Khác',
  'Paste from clipboard': 'Dán từ khay nhớ tạm',
  'Paste or type a German sentence. It joins the queue below - nothing is sent to AI until you generate.':
    'Dán hoặc gõ một câu tiếng Đức. Câu sẽ được thêm vào hàng đợi bên dưới - không có gì được gửi đến AI cho đến khi bạn tạo thẻ.',
  'Paste your DeepL API key...': 'Dán khóa API DeepL của bạn...',
  'Paste your {{provider}} API key...': 'Dán khóa API {{provider}} của bạn...',
  Phrase: 'Cụm từ',
  'Phrases & collocations': 'Cụm từ & kết hợp từ',
  'Phrases show this word used in common expressions or word combinations.':
    'Cụm từ cho thấy từ này được dùng trong các cách diễn đạt hoặc tổ hợp từ thông dụng.',
  'Pick a look for the whole app, from bright to dark and everything between.':
    'Chọn giao diện cho toàn bộ ứng dụng, từ sáng đến tối và mọi thứ ở giữa.',
  'Picking a swatch again (or none) removes the line - it never conflicts with CSS you write by hand elsewhere in the box.':
    'Chọn lại một mẫu màu (hoặc không chọn gì) sẽ xóa dòng đó - nó không bao giờ xung đột với CSS bạn tự viết ở chỗ khác trong hộp.',
  Pitch: 'Cao độ',
  'Playing...': 'Đang phát...',
  "Please don't include anything private in your message.":
    'Vui lòng không đưa bất kỳ thông tin riêng tư nào vào tin nhắn của bạn.',
  'Practice cloze': 'Luyện điền khuyết',
  'Practice reverse': 'Luyện chiều ngược lại',
  'Practice words': 'Luyện từ',
  'Practice {{count}} cloze': 'Luyện {{count}} điền khuyết',
  Preposition: 'Giới từ',
  Preview: 'Xem trước',
  'Preview import': 'Xem trước khi nhập',
  'Preview tab': 'Tab Xem trước',
  Privacy: 'Quyền riêng tư',
  Pronoun: 'Đại từ',
  Pronunciation: 'Cách phát âm',
  'Queue is empty': 'Hàng đợi đang trống',
  'Quick actions': 'Thao tác nhanh',
  'Recently added': 'Vừa thêm gần đây',
  'Recently searched': 'Đã tìm kiếm gần đây',
  'Add to Deck': 'Thêm vào bộ thẻ',
  'Add to Cloze': 'Thêm vào thẻ đền khuyết',
  Listen: 'Nghe',
  'Added to deck': 'Đã thêm vào bộ thẻ',
  'Added to cloze': 'Đã thêm vào thẻ đền khuyết',
  'Deck options': 'Tùy chọn bộ thẻ',
  'Move deck': 'Di chuyển bộ thẻ',
  'Merge deck': 'Hợp nhất bộ thẻ',
  'Merge into another deck': 'Hợp nhất vào bộ thẻ khác',
  'Good morning!': 'Chào buổi sáng!',
  'Good afternoon!': 'Chào buổi chiều!',
  'Good evening!': 'Chào buổi tối!',
  'Add Card': 'Thêm thẻ',
  'Open Deck': 'Mở bộ thẻ',
  'eBook Library': 'Thư viện sách điện tử',
  'Import eBook': 'Nhập sách điện tử',
  'No eBooks in your library yet': 'Chưa có sách điện tử nào trong thư viện',
  'Loading eBook...': 'Đang tải sách điện tử...',
  'Table of Contents': 'Mục lục',
  'Reader Settings': 'Cài đặt trình đọc',
  'Font Size': 'Cỡ chữ',
  'Translate Inline': 'Dịch trực tiếp',
  'Selected paragraph translation': 'Bản dịch đoạn văn đã chọn',
  'CEFR level set in settings': 'Cấp độ CEFR trong cài đặt',
  'Remove level': 'Xóa cấp độ',
  'Set manually': 'Đặt thủ công',
  'Automatic (CEFR)': 'Tự động (CEFR)',
  'Reference it anywhere in your own CSS rules, e.g.:':
    'Tham chiếu nó ở bất cứ đâu trong các quy tắc CSS của riêng bạn, ví dụ:',
  Regenerate: 'Tạo lại',
  'Regenerate this card?': 'Tạo lại thẻ này?',
  Remove: 'Xóa',
  'Remove {{count}}': 'Xóa {{count}}',
  'Remove {{count}} cards from this deck?': 'Xóa {{count}} thẻ khỏi bộ thẻ này?',
  'Removed {{count}} chunks.': 'Đã xóa {{count}} phần dữ liệu.',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'Xóa mọi phần dữ liệu đã cài đặt khỏi thiết bị này. Các thẻ bạn đã thêm vào bộ thẻ không bị ảnh hưởng.',
  'Removing...': 'Đang xóa...',
  'Rename deck': 'Đổi tên bộ thẻ',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'Được hiển thị bằng một câu điền khuyết mẫu, qua cùng bộ máy mà phiên ôn tập sử dụng.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'Được hiển thị bằng dữ liệu mẫu ("ausgehen"), qua cùng bộ máy mà phiên ôn tập sử dụng.',
  'Rendering goes through the exact same LiquidJS + WebView pipeline the review session uses, with one fixed sample word ("ausgehen") standing in for your real vocabulary.':
    'Việc hiển thị đi qua đúng quy trình LiquidJS + WebView mà phiên ôn tập sử dụng, với một từ mẫu cố định ("ausgehen") thay thế cho từ vựng thật của bạn.',
  'Replaces everything on this device with a previously exported backup.':
    'Thay thế toàn bộ dữ liệu trên thiết bị này bằng một bản sao lưu đã xuất trước đó.',
  'Report an issue or request a feature': 'Báo lỗi hoặc đề xuất tính năng',
  Reset: 'Đặt lại',
  'Reset progress': 'Đặt lại tiến trình',
  'Reset progress?': 'Đặt lại tiến trình?',
  'Reset to default': 'Đặt lại về mặc định',
  'Reset to default layout & style?': 'Đặt lại về bố cục & kiểu dáng mặc định?',
  'Reset to default?': 'Đặt lại về mặc định?',
  'Resetting...': 'Đang đặt lại...',
  Restore: 'Khôi phục',
  'Restore complete': 'Đã khôi phục xong',
  'Restore failed': 'Khôi phục thất bại',
  'Restore from Lemmory backup (.lem)': 'Khôi phục từ bản sao lưu Lemmory (.lem)',
  'Restore from backup?': 'Khôi phục từ bản sao lưu?',
  'Restored {{count}} rows.': 'Đã khôi phục {{count}} dòng.',
  'Restoring...': 'Đang khôi phục...',
  Retry: 'Thử lại',
  Send: 'Gửi',
  Undo: 'Hoàn tác',
  Redo: 'Làm lại',
  'Review activity': 'Hoạt động ôn tập',
  "Review your captures. Discard what you don't need, then generate cards for the rest - no API call is wasted on text you didn't ask for.":
    'Xem lại các mục đã ghi. Bỏ những gì bạn không cần, rồi tạo thẻ cho phần còn lại - không có lệnh gọi API nào bị lãng phí cho văn bản bạn không yêu cầu.',
  "Review your captures. Discard what you don't need, then generate cards for the rest.":
    'Xem lại các mục đã ghi. Bỏ những gì bạn không cần, rồi tạo thẻ cho phần còn lại.',
  'Review {{count}} due cards': 'Ôn {{count}} thẻ đến hạn',
  'Review {{count}} words': 'Ôn {{count}} từ',
  'Sample data': 'Dữ liệu mẫu',
  Save: 'Lưu',
  'Save changes': 'Lưu thay đổi',
  'Saved to the folder you chose.': 'Đã lưu vào thư mục bạn đã chọn.',
  'Saving...': 'Đang lưu...',
  Search: 'Tìm kiếm',
  'Search from anywhere': 'Tìm kiếm từ bất cứ đâu',
  'Search help': 'Trợ giúp Tìm kiếm',
  'Search in German ("ausgeh...") or English ("go out").\nInflected forms like "ging aus" work too.':
    'Tìm bằng tiếng Đức ("ausgeh...") hoặc tiếng Anh ("go out").\nCác dạng biến đổi như "ging aus" cũng dùng được.',
  'Search in German ("ausgeh...") or English ("go out").\\nInflected forms like "ging aus" work too.':
    'Tìm bằng tiếng Đức ("ausgeh...") hoặc tiếng Anh ("go out").\\nCác dạng biến đổi như "ging aus" cũng dùng được.',
  'Search settings': 'Tìm cài đặt',
  'Search this': 'Tìm cái này',
  'See all': 'Xem tất cả',
  'Select cards': 'Chọn thẻ',
  Selected: 'Đã chọn',
  'Selectors that work with zero extra markup (they target the card body itself or elements this app already emits):':
    'Các bộ chọn hoạt động mà không cần thêm mã đánh dấu nào (chúng nhắm vào chính thân thẻ hoặc các phần tử ứng dụng này đã tạo sẵn):',
  'Send Feedback': 'Gửi phản hồi',
  'Send Feedback help': 'Trợ giúp Gửi phản hồi',
  'Send report': 'Gửi báo cáo',
  'Sending...': 'Đang gửi...',
  'Sentence (use [...] for the gap)': 'Câu (dùng [...] cho chỗ trống)',
  'Sentence structure': 'Cấu trúc câu',
  'Sentence translation': 'Bản dịch câu',
  'Session complete!': 'Đã hoàn thành phiên học!',
  'Set default': 'Đặt làm mặc định',
  Settings: 'Cài đặt',
  'Share & Search': 'Chia sẻ & Tìm kiếm',
  'Show DeepL API key': 'Hiện khóa API DeepL',
  'Show DeepL settings': 'Hiện cài đặt DeepL',
  'Show {{provider}} API key': 'Hiện khóa API {{provider}}',
  'Shown on flashcard': 'Hiển thị trên thẻ ghi nhớ',
  'Sign in with Google': 'Đăng nhập bằng Google',
  'Sign out': 'Đăng xuất',
  'Signing in...': 'Đang đăng nhập...',
  Skip: 'Bỏ qua',
  Skipped: 'Đã bỏ qua',
  "Some data on this screen couldn't load.": 'Một số dữ liệu trên màn hình này không thể tải được.',
  Spanish: 'Tiếng Tây Ban Nha',
  'Speaking rate': 'Tốc độ nói',
  'Speaking speed': 'Tốc độ nói',
  'Speaking speed isn\'t configurable for this provider yet.':
    'Tốc độ nói chưa thể tùy chỉnh cho nhà cung cấp này.',
  'Speech engine': 'Bộ máy giọng nói',
  'Start review': 'Bắt đầu ôn tập',
  Review: 'Ôn tập',
  Statistics: 'Thống kê',
  Status: 'Trạng thái',
  'Stored as a': 'Được lưu dưới dạng',
  "Study your Lemmory vocabulary in Anki/AnkiDroid. Cards start fresh - review history isn't carried over.":
    'Học từ vựng Lemmory của bạn trong Anki/AnkiDroid. Thẻ bắt đầu lại từ đầu - lịch sử ôn tập không được mang theo.',
  'Style tab': 'Tab Kiểu dáng',
  "Submitting posts your message as a GitHub issue on Lemmory's public repository - anyone can read it, including your contact email if you provide one.":
    'Gửi đi sẽ đăng tin nhắn của bạn thành một issue trên kho lưu trữ công khai của Lemmory trên GitHub - bất kỳ ai cũng có thể đọc được, kể cả email liên hệ nếu bạn cung cấp.',
  Sync: 'Đồng bộ',
  'Sync decks, cards, and progress to a Google account':
    'Đồng bộ bộ thẻ, thẻ và tiến trình lên một tài khoản Google',
  'Sync failed': 'Đồng bộ thất bại',
  'Sync not connected': 'Chưa kết nối đồng bộ',
  'Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.':
    'Kết nối tài khoản Google của bạn trong Cài đặt > Đồng bộ để bắt đầu đồng bộ bộ thẻ và tiến trình ôn tập giữa các thiết bị.',
  'Sync in the background whenever you leave the app, at most this often':
    'Đồng bộ ngầm mỗi khi bạn rời khỏi ứng dụng, tối đa với tần suất này',
  'Sync now': 'Đồng bộ ngay',
  'Sync your decks, cards, and review progress to a Google account so they carry over to another device. API keys are never synced.':
    'Đồng bộ bộ thẻ, thẻ và tiến trình ôn tập của bạn lên một tài khoản Google để mang sang thiết bị khác. Khóa API không bao giờ được đồng bộ.',
  Synced: 'Đã đồng bộ',
  'Syncing...': 'Đang đồng bộ...',
  Synonyms: 'Từ đồng nghĩa',
  'Synonyms & phrases': 'Từ đồng nghĩa & cụm từ',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. You can rate or flag one the same way as an example.':
    'Từ đồng nghĩa là những từ khác có nghĩa tương tự, hữu ích để mở rộng vốn từ xoay quanh từ này. Bạn có thể đánh giá hoặc gắn cờ một từ giống như với ví dụ.',
  Tags: 'Nhãn',
  'Tap "Front" or "Back" to show a field on that side - a field can appear on both, or neither.':
    'Chạm "Mặt trước" hoặc "Mặt sau" để hiển thị một trường ở mặt đó - một trường có thể xuất hiện ở cả hai mặt, hoặc không mặt nào.',
  'Tap the star on any example to choose which one appears on your flashcard - only one shows at a time.':
    'Chạm vào ngôi sao trên bất kỳ ví dụ nào để chọn ví dụ nào hiển thị trên thẻ ghi nhớ của bạn - chỉ một ví dụ hiển thị tại một thời điểm.',
  'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.':
    'Chạm "Thêm vào bộ thẻ" luôn hỏi bạn muốn thêm từ vào bộ thẻ nào, và cho phép bạn tạo một bộ thẻ hoàn toàn mới ngay tại chỗ.',
  'Template editor help': 'Trợ giúp Trình chỉnh sửa mẫu',
  'Template name': 'Tên mẫu',
  'Tense & mood': 'Thì & thức',
  Test: 'Thử',
  'Test active engine': 'Thử bộ máy đang dùng',
  'Test phrase': 'Câu thử nghiệm',
  'Test this provider': 'Thử nhà cung cấp này',
  'Testing a voice': 'Đang thử một giọng đọc',
  'Text to speak when testing': 'Văn bản để đọc khi thử nghiệm',
  'Thanks for the feedback': 'Cảm ơn bạn đã phản hồi',
  'The "Available template variables" card lists every field name you can reference, with a one-line description of what it holds.':
    'Thẻ "Các biến mẫu có sẵn" liệt kê mọi tên trường bạn có thể tham chiếu, kèm mô tả một dòng về nội dung nó chứa.',
  'The CSS box applies to both the front and back - there is one stylesheet per template, not one per side.':
    'Hộp CSS áp dụng cho cả mặt trước và mặt sau - mỗi mẫu có một bảng kiểu, không phải mỗi mặt một bảng.',
  'The button at the bottom turns your selected sentences into real vocabulary cards, one at a time.':
    'Nút ở dưới cùng biến các câu bạn đã chọn thành thẻ từ vựng thật, từng câu một.',
  'The card fills the available screen space exactly (no scrolling) and the caption above it shows its real, on-device measured width and height in points - the same size a card gets during an actual review session.':
    'Thẻ lấp đầy đúng khoảng không gian màn hình có sẵn (không cuộn) và chú thích phía trên nó hiển thị chiều rộng và chiều cao thực tế đo được trên thiết bị, tính bằng point - đúng kích thước một thẻ có trong phiên ôn tập thật.',
  'The conditional example at the bottom is a worked, copy-pasteable snippet combining {% if %} and {% for ... limit %}.':
    'Ví dụ có điều kiện ở dưới cùng là một đoạn mã hoàn chỉnh, có thể sao chép-dán, kết hợp {% if %} và {% for ... limit %}.',
  'The dropdown above the examples ("all", "travel", "business", and so on) filters them down to a particular tone or situation, if you only want to see those.':
    'Menu thả xuống phía trên các ví dụ ("tất cả", "du lịch", "kinh doanh", v.v.) lọc chúng theo một sắc thái hoặc tình huống cụ thể, nếu bạn chỉ muốn xem những cái đó.',
  'The first few notes, so you can see what each field actually holds.':
    'Vài ghi chú đầu tiên, để bạn thấy mỗi trường thực sự chứa gì.',
  'The first few rows, so you can see what each column actually holds.':
    'Vài dòng đầu tiên, để bạn thấy mỗi cột thực sự chứa gì.',
  'The pencil icon lets you edit the meaning or example text directly. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'Biểu tượng bút chì cho phép bạn sửa trực tiếp nghĩa hoặc văn bản ví dụ. Biểu tượng cuối cùng mở nhanh một tìm kiếm trên web cho từ đó, để có thêm góc nhìn khác ngoài ứng dụng.',
  'The rest were left untouched - you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'Phần còn lại không bị thay đổi - bạn có thể nhập lại cùng tệp này để tiếp tục từ chỗ đã dừng (những từ đã nhập rồi sẽ bị bỏ qua vì trùng lặp).',
  'The row of small icon buttons under the meaning gives you a few more ways to dig into this word.':
    'Hàng các nút biểu tượng nhỏ dưới phần nghĩa cho bạn thêm vài cách để tìm hiểu sâu hơn về từ này.',
  'The sentence must contain "[...]" for the gap, and an answer is required.':
    'Câu phải chứa "[...]" cho chỗ trống, và bắt buộc phải có đáp án.',
  'The toggles read the template text itself (no hidden markers) - they work reliably for templates built through the toggles. If you hand-write unusual formatting in the Code tab, a toggle may not detect it; edit the Code tab directly in that case.':
    'Các công tắc đọc chính văn bản mẫu (không có dấu hiệu ẩn) - chúng hoạt động đáng tin cậy với các mẫu được xây dựng qua công tắc. Nếu bạn tự viết định dạng bất thường trong tab Mã, một công tắc có thể không nhận ra; trong trường hợp đó hãy sửa trực tiếp trong tab Mã.',
  'The translation at the top is what actually appears on your flashcard.':
    'Bản dịch ở trên cùng là thứ thực sự xuất hiện trên thẻ ghi nhớ của bạn.',
  'The voice list follows whatever language is set under Settings > Learning > "I\'m learning".':
    'Danh sách giọng đọc theo ngôn ngữ đặt trong Cài đặt > Học tập > "Tôi đang học".',
  Theme: 'Giao diện',
  'Thinking...': 'Đang suy nghĩ...',
  'This becomes a public issue': 'Điều này sẽ trở thành một issue công khai',
  'This card, explained': 'Giải thích thẻ này',
  "This changes the language of the app itself - its buttons and menus - not the language you're learning.":
    'Điều này thay đổi ngôn ngữ của chính ứng dụng - các nút và menu của nó - không phải ngôn ngữ bạn đang học.',
  'This collapsible panel below the examples lets you pick a specific grammar pattern - a tense, a sentence structure, a particular conjunction - that you want the next batch of examples to practice, instead of leaving it to chance.':
    'Bảng có thể thu gọn này bên dưới các ví dụ cho phép bạn chọn một mẫu ngữ pháp cụ thể - một thì, một cấu trúc câu, một liên từ nhất định - mà bạn muốn đợt ví dụ tiếp theo luyện tập, thay vì để ngẫu nhiên.',
  'This collection has no notes to import.': 'Bộ sưu tập này không có ghi chú nào để nhập.',
  'This deck has no cards due for review. Add words or check back later.':
    'Bộ thẻ này không có thẻ nào đến hạn ôn tập. Hãy thêm từ hoặc quay lại sau.',
  'This deck no longer exists.': 'Bộ thẻ này không còn tồn tại.',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'Thao tác này sẽ xóa "{{source}}" và chuyển tất cả thẻ của nó vào "{{target}}". Không thể hoàn tác thao tác này.',
  'This file has more than one deck. Which one do you want to import?':
    'Tệp này có nhiều hơn một bộ thẻ. Bạn muốn nhập bộ nào?',
  'This file has no decks to import.': 'Tệp này không có bộ thẻ nào để nhập.',
  'This file has no rows to import.': 'Tệp này không có dòng nào để nhập.',
  "This is a preview of the feedback form - sending isn't connected yet, so nothing was sent anywhere. Once it is, this exact form will open a GitHub issue on your behalf.":
    'Đây là bản xem trước của biểu mẫu phản hồi - chức năng gửi chưa được kết nối, nên chưa có gì được gửi đi cả. Khi được kết nối, chính biểu mẫu này sẽ mở một issue trên GitHub thay mặt bạn.',
  'This is the one step that actually does the work - nothing before it does anything with your captured text.':
    'Đây là bước duy nhất thực sự thực hiện công việc - không có bước nào trước đó làm gì với văn bản bạn đã ghi lại.',
  'This only changes colors - nothing about how the app works.':
    'Điều này chỉ thay đổi màu sắc - không thay đổi gì về cách ứng dụng hoạt động.',
  'This only removes them from this deck - cards that live in other decks too stay there.':
    'Điều này chỉ xóa chúng khỏi bộ thẻ này - các thẻ cũng nằm trong bộ thẻ khác vẫn được giữ nguyên ở đó.',
  'This opens a separate screen for the voice that reads words out loud, and how fast it speaks.':
    'Điều này mở một màn hình riêng cho giọng đọc từ thành tiếng, và tốc độ nói của nó.',
  'This removes every OpenAI/Mistral/Gemini/Claude key from this device. Vocabulary and progress are unaffected.':
    'Điều này xóa mọi khóa OpenAI/Mistral/Gemini/Claude khỏi thiết bị này. Từ vựng và tiến trình không bị ảnh hưởng.',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'Điều này xóa mọi khóa nhà cung cấp khỏi thiết bị này. Từ vựng và tiến trình không bị ảnh hưởng.',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'Điều này thay thế toàn bộ dữ liệu hiện có trên thiết bị này bằng nội dung của "{{fileName}}" (đã xuất ngày {{date}}). Không thể hoàn tác thao tác này.',
  'This replaces the fields, layout, and style with the built-in default, and saves immediately. This cannot be undone.':
    'Điều này thay thế các trường, bố cục và kiểu dáng bằng giá trị mặc định tích hợp sẵn, và lưu ngay lập tức. Không thể hoàn tác thao tác này.',
  'This replaces the front, back, and CSS in the editor - tap "Save changes" to keep it. Unsaved edits are lost.':
    'Điều này thay thế mặt trước, mặt sau và CSS trong trình chỉnh sửa - chạm "Lưu thay đổi" để giữ lại. Các chỉnh sửa chưa lưu sẽ bị mất.',
  'This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.':
    'Điều này thay thế nghĩa, ví dụ, từ đồng nghĩa, cụm từ và thẻ điền khuyết bằng một lượt tạo mới bằng AI. Không thể hoàn tác thao tác này.',
  'This screen is a preview of the full flow; submitting just confirms locally for now. A small server-side function will handle real submission in a future update.':
    'Màn hình này là bản xem trước của toàn bộ quy trình; việc gửi hiện chỉ xác nhận cục bộ. Một chức năng phía máy chủ nhỏ sẽ xử lý việc gửi thật trong bản cập nhật tương lai.',
  'This setting decides what happens next.': 'Cài đặt này quyết định điều gì xảy ra tiếp theo.',
  'This word has no card yet.': 'Từ này chưa có thẻ.',
  'This word has no meaning yet.': 'Từ này chưa có nghĩa.',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    'Từ này chưa có trong thư viện của bạn. Hãy tạo nghĩa, ví dụ và từ đồng nghĩa bằng AI.',
  Title: 'Tiêu đề',
  'To style one field on its own - e.g. make the word bigger than the rest - wrap just that field in your own element in the Code tab, then target the class you chose:':
    'Để tạo kiểu riêng cho một trường - ví dụ làm từ đó lớn hơn phần còn lại - chỉ cần bọc trường đó trong phần tử của riêng bạn ở tab Mã, rồi nhắm vào class bạn đã chọn:',
  'Top level (no parent)': 'Cấp cao nhất (không có bộ thẻ cha)',
  'Translating...': 'Đang dịch...',
  Translation: 'Bản dịch',
  'Translation-only': 'Chỉ dịch',
  "Turning a field on inserts the minimum Liquid needed for it at the end of that side's template: a plain field becomes {{ word }}; a list field (Other meanings, Synonyms, Related phrases) becomes a {% for %} loop, because a list can't be printed directly.":
    'Bật một trường sẽ chèn đoạn Liquid tối thiểu cần thiết vào cuối mẫu của mặt đó: một trường thường trở thành {{ word }}; một trường dạng danh sách (Nghĩa khác, Từ đồng nghĩa, Cụm từ liên quan) trở thành một vòng lặp {% for %}, vì danh sách không thể in trực tiếp.',
  'Turning captures into cards': 'Biến các mục đã ghi thành thẻ',
  'Type a German or English word...': 'Gõ một từ tiếng Đức hoặc tiếng Anh...',
  "Type a word in either language you've set up under Learning - your own vocabulary is searched instantly as you type.":
    'Gõ một từ bằng một trong hai ngôn ngữ bạn đã thiết lập trong mục Học tập - từ vựng của bạn được tìm ngay khi bạn gõ.',
  "Underneath each example, thumbs up/down let you mark whether it's good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense.":
    'Bên dưới mỗi ví dụ, nút thích/không thích cho phép bạn đánh dấu ví dụ đó tốt hay cần kiểm tra lại sau. Biểu tượng cờ báo cáo một vấn đề cụ thể (như cách diễn đạt không tự nhiên hoặc lỗi ngữ pháp) kèm ghi chú không bắt buộc. Mũi tên tròn tạo lại một loạt ví dụ mới cho nghĩa này.',
  'Understanding the {{language}} {{wordClass}} "{{headword}}"':
    'Hiểu về {{wordClass}} {{language}} "{{headword}}"',
  Uninstall: 'Gỡ cài đặt',
  'Uninstall all': 'Gỡ cài đặt tất cả',
  'Uninstall all local dictionaries?': 'Gỡ cài đặt tất cả từ điển ngoại tuyến?',
  'Uninstalling...': 'Đang gỡ cài đặt...',
  'Unknown error': 'Lỗi không xác định',
  'Unnatural phrasing': 'Cách diễn đạt không tự nhiên',
  Usage: 'Mức sử dụng',
  'Uses this provider\'s key above': 'Dùng khóa của nhà cung cấp này ở trên',
  'Uses this provider\'s key from AI Providers':
    'Dùng khóa của nhà cung cấp này từ mục Nhà cung cấp AI',
  'Uses your phone\'s own text-to-speech engine - offline, free, no API key.':
    'Dùng bộ máy chuyển văn bản thành giọng nói riêng của điện thoại bạn - ngoại tuyến, miễn phí, không cần khóa API.',
  'Validate key': 'Xác thực khóa',
  Verb: 'Động từ',
  Vocabulary: 'Từ vựng',
  'Vocabulary growth': 'Tăng trưởng từ vựng',
  Voice: 'Giọng đọc',
  'Voice (German)': 'Giọng đọc (Tiếng Đức)',
  'Voice ({{language}})': 'Giọng đọc ({{language}})',
  'Voice, rate, pitch': 'Giọng đọc, tốc độ, cao độ',
  "Voices come from the device's own text-to-speech engine - install more from your phone's system settings if you don't see the one you want.":
    'Các giọng đọc đến từ bộ máy chuyển văn bản thành giọng nói riêng của thiết bị - cài thêm từ cài đặt hệ thống của điện thoại nếu bạn không thấy giọng mình muốn.',
  'Want it to work a bit differently? There\'s a setting for that in Settings, under "Share & Search."':
    'Muốn nó hoạt động khác đi một chút? Có một cài đặt cho việc đó trong Cài đặt, mục "Chia sẻ & Tìm kiếm."',
  'What diagnostics includes': 'Thông tin chẩn đoán bao gồm những gì',
  'What happened, or what would you like to see?': 'Điều gì đã xảy ra, hoặc bạn muốn thấy gì?',
  'What kind of feedback?': 'Bạn muốn phản hồi loại nào?',
  'What this screen is for': 'Màn hình này dùng để làm gì',
  "What's wrong with this?": 'Có vấn đề gì với cái này?',
  'Whatever translation at this moment is selected/shown will be added to deck along with its relevant example.':
    'Bản dịch nào đang được chọn/hiển thị tại thời điểm này sẽ được thêm vào bộ thẻ cùng với ví dụ liên quan của nó.',
  'When a word is new to you': 'Khi một từ mới với bạn',
  'Why nothing sends yet': 'Vì sao chưa có gì được gửi đi',
  'Will import': 'Sẽ nhập',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    'Nếu không có khóa tạo nội dung, việc tạo thẻ bằng AI sẽ bị vô hiệu hóa. Dịch thuật và thẻ thủ công vẫn hoạt động. Thêm khóa cho một trong các nhà cung cấp bên dưới để có trải nghiệm đầy đủ.',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.':
    'Nếu không có khóa tạo nội dung, việc tạo thẻ bằng AI sẽ bị vô hiệu hóa. Dịch thuật và thẻ thủ công vẫn hoạt động. Thêm khóa trong mục Nhà cung cấp AI để có trải nghiệm đầy đủ.',
  Word: 'Từ',
  'Word and meaning are required.': 'Bắt buộc phải có từ và nghĩa.',
  'Word card': 'Thẻ từ',
  'Words {{start}}-{{end}}': 'Từ {{start}}-{{end}}',
  'Wrong CEFR level': 'Sai cấp độ CEFR',
  'You can add your cards to multiple decks even if it is added before.':
    'Bạn có thể thêm thẻ của mình vào nhiều bộ thẻ ngay cả khi nó đã được thêm trước đó.',
  "You can also share text from another app straight to Lemmory, the same way you'd share a link or a photo.":
    'Bạn cũng có thể chia sẻ văn bản từ ứng dụng khác thẳng đến Lemmory, giống như cách bạn chia sẻ một liên kết hoặc ảnh.',
  "You can also share text to Lemmory, the same way you'd share a link or a photo to any other app.":
    'Bạn cũng có thể chia sẻ văn bản đến Lemmory, giống như cách bạn chia sẻ một liên kết hoặc ảnh đến bất kỳ ứng dụng nào khác.',
  'You reviewed {{count}} cards. Great work - come back when the next cards are due.':
    'Bạn đã ôn {{count}} thẻ. Làm tốt lắm - hãy quay lại khi có thẻ tiếp theo đến hạn.',
  'Your full library - decks, cards, review history. Your data is always yours. API keys are never included.':
    'Toàn bộ thư viện của bạn - bộ thẻ, thẻ, lịch sử ôn tập. Dữ liệu của bạn luôn thuộc về bạn. Khóa API không bao giờ được bao gồm.',
  'actual review card size on this device': 'kích thước thẻ ôn tập thực tế trên thiết bị này',
  'ask a follow-up question': 'đặt một câu hỏi thêm',
  cards: 'thẻ',
  'cards due for review': 'thẻ đến hạn ôn tập',
  cloze: 'điền khuyết',
  'day streak': 'ngày liên tiếp',
  'due now': 'đến hạn ngay',
  'e.g. Er lehnt das Angebot ab.': 'vd. Er lehnt das Angebot ab.',
  'e.g. He refuses the offer.': 'vd. Anh ấy từ chối lời đề nghị.',
  'e.g. We are going out tonight.': 'vd. Tối nay chúng tôi đi chơi.',
  'e.g. Wir gehen heute Abend [...].': 'vd. Wir gehen heute Abend [...].',
  'e.g. ablehnen': 'vd. ablehnen',
  'e.g. aus': 'vd. aus',
  'e.g. to refuse': 'vd. từ chối',
  'e.g. verweigern, zurückweisen': 'vd. verweigern, zurückweisen',
  'eleven_multilingual_v2. Once your key is entered, choose from your own ElevenLabs voice library, or switch to manual entry to paste a voice ID directly.':
    'eleven_multilingual_v2. Sau khi nhập khóa, hãy chọn từ thư viện giọng đọc ElevenLabs của riêng bạn, hoặc chuyển sang nhập thủ công để dán trực tiếp ID giọng đọc.',
  'generate an explanation for this meaning': 'tạo giải thích cho nghĩa này',
  'gpt-4o-mini-tts. Marin and Cedar (★) are OpenAI\'s newest, most natural-sounding voices.':
    'gpt-4o-mini-tts. Marin và Cedar (★) là những giọng đọc mới nhất, tự nhiên nhất của OpenAI.',
  less: 'ít hơn',
  more: 'nhiều hơn',
  'new this week': 'mới trong tuần này',
  'new words per week': 'từ mới mỗi tuần',
  'regenerate this card': 'tạo lại thẻ này',
  'remembered (30 d)': 'đã nhớ (30 ngày)',
  reverse: 'chiều ngược lại',
  'reviewed today': 'đã ôn hôm nay',
  'rule - reference it in your CSS below as':
    'quy tắc - tham chiếu nó trong CSS của bạn bên dưới dưới dạng',
  'see Decks.': 'xem Bộ thẻ.',
  'shown on flashcard': 'hiển thị trên thẻ ghi nhớ',
  'tap to reveal': 'chạm để hiện đáp án',
  'this deck': 'bộ thẻ này',
  'total cards': 'tổng số thẻ',
  remembered: 'đã nhớ',
  'use on flashcard': 'dùng trên thẻ ghi nhớ',
  'v0.0.1 · offline-first · your data stays on device':
    'v0.0.1 · ưu tiên ngoại tuyến · dữ liệu của bạn luôn ở trên thiết bị',
  'Delete this card?': 'Xóa thẻ này?',
  'This permanently deletes this card and all its meanings, examples, synonyms, phrases, and cloze variations. This cannot be undone.':
    'Thao tác này sẽ xóa vĩnh viễn thẻ này cùng tất cả các nghĩa, ví dụ, từ đồng nghĩa, cụm từ và biến thể điền khuyết. Thao tác này không thể hoàn tác.',
  'Could not delete this card': 'Không thể xóa thẻ này',
  'Semantic Contexts': 'Ngữ cảnh ngữ nghĩa',
  '{{count}} contexts': '{{count}} ngữ cảnh',
  'you@example.com': 'you@example.com',
  '{{ variable }} prints a value. {% if gender %}...{% endif %} shows content only when a field has one - good for optional fields. {% for s in synonyms %}...{% endfor %} loops a list; add "limit:2" to cap it, and {% unless forloop.last %}...{% endunless %} to add a separator between items but not after the last one.':
    '{{ variable }} in ra một giá trị. {% if gender %}...{% endif %} chỉ hiển thị nội dung khi trường đó có giá trị - hữu ích cho các trường không bắt buộc. {% for s in synonyms %}...{% endfor %} lặp qua một danh sách; thêm "limit:2" để giới hạn số lượng, và {% unless forloop.last %}...{% endunless %} để thêm dấu phân cách giữa các mục nhưng không thêm sau mục cuối cùng.',
  '{{cefr}} · {{native}} > {{target}}': '{{cefr}} · {{native}} > {{target}}',
  '{{count}} days': '{{count}} ngày',
  '{{count}} due': '{{count}} đến hạn',
  '{{count}} failed': '{{count}} thất bại',
  '{{count}} lapses': '{{count}} lần quên',
  '{{count}} of {{total}} configured': '{{count}} trong {{total}} đã thiết lập',
  '{{count}} requests': '{{count}} yêu cầu',
  '{{count}} rows detected. Map each column below.':
    'Đã phát hiện {{count}} dòng. Hãy ánh xạ từng cột bên dưới.',
  '{{count}} selected': 'Đã chọn {{count}}',
  '{{count}} tokens': '{{count}} token',
  '{{count}} words': '{{count}} từ',
  '{{count}}h': '{{count}}g',
  '{{count}}m': '{{count}}p',
  '{{done}} of {{total}} generated': 'Đã tạo {{done}} trên {{total}}',
  '{{done}} of {{total}} notes': '{{done}} trên {{total}} ghi chú',
  '{{due}} due/{{total}} cards': '{{due}} đến hạn/{{total}} thẻ',
  '{{installed}} installed · {{available}} available to install':
    'Đã cài {{installed}} · {{available}} có thể cài thêm',
  "{{language}} isn't ready yet - English and German are the only languages Lemmory fully supports right now.":
    '{{language}} chưa sẵn sàng - tiếng Anh và tiếng Đức là hai ngôn ngữ duy nhất Lemmory hỗ trợ đầy đủ hiện tại.',
  '{{notes}} notes across {{decks}} decks. Map each field below - it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{notes}} ghi chú trải khắp {{decks}} bộ thẻ. Ánh xạ từng trường bên dưới - nó áp dụng cho mọi ghi chú, nên một loại ghi chú không có đủ số trường đó sẽ chỉ để trống.',
  '{{provider}} playback failed': 'Phát âm thanh {{provider}} thất bại',
  '{{provider}} validation failed': 'Xác thực {{provider}} thất bại',
  '{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted':
    'Đã tải về {{pulled}} · đã đẩy lên {{pushed}} · đã xóa {{deleted}}',

  masculine: 'giống đực',
  feminine: 'giống cái',
  neuter: 'giống trung',
  Again: 'Lại',
  Hard: 'Khó',
  Good: 'Tốt',
  Easy: 'Dễ',
  'Lemmory Light': 'Lemmory Sáng',
  'Midnight Indigo': 'Chàm Nửa Đêm',
  'Carbon Noir': 'Đen Carbon',
  'Arctic Day': 'Ngày Bắc Cực',
  'Warm Sand': 'Cát Ấm',
  Paperlight: 'Trắng Giấy',
  'Meanings, examples, clusters, phrases, and cloze - the default generation provider.':
    'Nghĩa, ví dụ, cụm nghĩa, cụm từ và bài tập điền từ - nhà cung cấp tạo nội dung mặc định.',
  'BYOK alternative for card generation and translation.':
    'Lựa chọn BYOK thay thế để tạo thẻ và dịch.',
  'Google Gemini BYOK for card generation and translation.':
    'Google Gemini BYOK để tạo thẻ và dịch.',
  'Claude BYOK for card generation and translation.': 'Claude BYOK để tạo thẻ và dịch.',
  'Your phone\'s own text-to-speech engine. Offline, no API key, no per-word cost.':
    'Công cụ chuyển văn bản thành giọng nói có sẵn trên điện thoại của bạn. Ngoại tuyến, không cần khóa API, không tốn phí theo từ.',
  'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.':
    'gpt-4o-mini-tts. Để có giọng tự nhiên nhất, hãy chọn Marin hoặc Cedar bên dưới.',
  'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.':
    'eleven_multilingual_v2. Dán ID giọng nói từ thư viện giọng nói ElevenLabs của bạn.',
  'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).':
    'Aura-2. Nhập chính xác tên mô hình cho giọng nói/ngôn ngữ bạn muốn (xem tài liệu của Deepgram).',
  'Bug / Issue': 'Lỗi / Sự cố',
  'Feature request': 'Yêu cầu tính năng',
  'General feedback': 'Phản hồi chung',
  Vietnamese: 'Tiếng Việt',

  Queue: 'Hàng đợi',
  'Queue help': 'Trợ giúp Hàng đợi',
  'Queue is a holding area for sentences you want to turn into vocabulary cards later - nothing here happens automatically.':
    'Hàng đợi là nơi lưu tạm các câu bạn muốn biến thành thẻ từ vựng sau này - không có gì ở đây tự động xảy ra cả.',

  'Generate {{count}} cards to...': 'Tạo {{count}} thẻ vào...',
  'Delete account & sync data?': 'Xóa tài khoản & dữ liệu đồng bộ?',
  'This permanently erases everything you\'ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can\'t be undone.':
    'Thao tác này sẽ xóa vĩnh viễn mọi thứ bạn đã đồng bộ lên đám mây và đăng xuất bạn. Bộ thẻ và thẻ trên thiết bị này không bị ảnh hưởng. Không thể hoàn tác.',
  'Delete everything': 'Xóa tất cả',
  'Deletion failed': 'Xóa thất bại',
  'Danger zone': 'Khu vực nguy hiểm',
  'Permanently erase everything synced to this account and sign out. Your data on this device stays put.':
    'Xóa vĩnh viễn mọi thứ đã đồng bộ với tài khoản này và đăng xuất. Dữ liệu của bạn trên thiết bị này vẫn được giữ nguyên.',
  'Delete account & sync data': 'Xóa tài khoản & dữ liệu đồng bộ',
  'Sync help': 'Trợ giúp đồng bộ',
  'How sync works': 'Đồng bộ hoạt động thế nào',
  'Deleting your account & data': 'Xóa tài khoản & dữ liệu của bạn',
  'What does this actually delete?': 'Việc này thực sự xóa những gì?',
  "Signing in with Google links this device to a private cloud copy of your decks, cards, and review progress - so if you get a new phone, or use Lemmory on two devices, you're not starting from zero on the second one.":
    'Đăng nhập bằng Google sẽ liên kết thiết bị này với một bản sao đám mây riêng tư của bộ thẻ, thẻ và tiến độ ôn tập của bạn - nên nếu bạn đổi điện thoại mới, hoặc dùng Lemmory trên hai thiết bị, bạn không phải bắt đầu lại từ đầu trên thiết bị thứ hai.',
  'Tap "Sync now" any time to push your latest changes up and pull down anything from another device. Under the hood it merges rather than overwrites - if you added a card here and reviewed one on your other phone, both survive.':
    'Chạm "Đồng bộ ngay" bất cứ lúc nào để đẩy các thay đổi mới nhất lên và tải về mọi thứ từ thiết bị khác. Về bản chất, nó hợp nhất chứ không ghi đè - nếu bạn thêm một thẻ ở đây và ôn tập một thẻ khác trên điện thoại kia, cả hai đều được giữ lại.',
  "Your AI provider API keys are never synced. They live only in this device's secure storage, so you'll need to re-enter them if you set up a new device.":
    'Khóa API của các nhà cung cấp AI không bao giờ được đồng bộ. Chúng chỉ tồn tại trong bộ nhớ an toàn của thiết bị này, nên bạn sẽ cần nhập lại chúng khi thiết lập một thiết bị mới.',
  'When this is on, Lemmory quietly syncs in the background whenever you leave the app - no need to remember to tap "Sync now" yourself.':
    'Khi bật tính năng này, Lemmory sẽ âm thầm đồng bộ trong nền mỗi khi bạn rời khỏi ứng dụng - không cần phải nhớ tự chạm "Đồng bộ ngay".',
  "\"At most every\" is a cooldown, not a schedule - it won't sync more often than that, but it also won't force a sync if you haven't opened the app in the meantime.":
    '"Tối đa mỗi" là thời gian chờ tối thiểu, không phải lịch cố định - nó sẽ không đồng bộ thường xuyên hơn mức đó, nhưng cũng không ép đồng bộ nếu bạn chưa mở lại ứng dụng trong lúc đó.',
  "It runs over whatever connection you've got, Wi-Fi or mobile data - there's no Wi-Fi-only toggle.":
    'Nó chạy trên bất kỳ kết nối nào bạn có, Wi-Fi hay dữ liệu di động - không có tùy chọn chỉ dùng Wi-Fi.',
  "This is the one action here you genuinely can't undo - read this before you tap it.":
    'Đây là hành động duy nhất ở đây mà bạn thực sự không thể hoàn tác - hãy đọc kỹ trước khi chạm vào nó.',
  'It permanently erases everything this account ever synced to the cloud, disconnects the Google account from Lemmory, and signs you out.':
    'Nó xóa vĩnh viễn mọi thứ tài khoản này từng đồng bộ lên đám mây, ngắt kết nối tài khoản Google khỏi Lemmory, và đăng xuất bạn.',
  'Your decks, cards, and progress on THIS device are completely untouched - they stay right where they are, fully usable offline. Only the cloud copy (and the link to it) is gone.':
    'Bộ thẻ, thẻ và tiến độ của bạn trên CHÍNH thiết bị này hoàn toàn không bị ảnh hưởng - chúng vẫn ở nguyên đó, dùng ngoại tuyến bình thường. Chỉ bản sao trên đám mây (và liên kết tới nó) là mất đi.',
  'If you sign back in with the same Google account afterward, syncing starts fresh - nothing comes back automatically.':
    'Nếu sau đó bạn đăng nhập lại bằng cùng tài khoản Google, việc đồng bộ sẽ bắt đầu lại từ đầu - không có gì tự động quay trở lại.',
  'Card type for this import': 'Loại thẻ cho lần nhập này',
  'A row with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'Một hàng có cả từ/nghĩa và câu điền khuyết sẽ trở thành MỘT thẻ, không bao giờ là hai. Muốn cả hai? Hãy nhập lại tệp sau đó với loại thẻ còn lại.',
  'A note with both a word/meaning and a cloze sentence becomes ONE card, never two. Want both? Import the file again afterward with the other card type selected.':
    'Một ghi chú có cả từ/nghĩa và câu điền khuyết sẽ trở thành MỘT thẻ, không bao giờ là hai. Muốn cả hai? Hãy nhập lại tệp sau đó với loại thẻ còn lại.',
  'Regular (word/meaning)': 'Thông thường (từ/nghĩa)',
  'Cloze (fill-in-the-blank)': 'Điền khuyết',
  'View all cards (table)': 'Xem tất cả thẻ (dạng bảng)',
  '{{name}} - all cards': '{{name}} - tất cả thẻ',
  'All cards': 'Tất cả thẻ',
  'No cards yet': 'Chưa có thẻ nào',
  'Add words from Search or import a file to see them here.':
    'Thêm từ từ Tìm kiếm hoặc nhập một tệp để xem chúng ở đây.',
  Type: 'Loại',
  'Part of speech': 'Từ loại',
  CEFR: 'Cấp độ CEFR',

  // Newly added — Mixed practice, question types, cards-per-session, and the AI Providers help
  // sheet/error-message hardening that went with them
  'Fill in the blank': 'Điền khuyết',
  'True or False': 'Đúng hay sai',
  'Multiple choice': 'Trắc nghiệm',
  mixed: 'hỗn hợp',
  'true/false': 'đúng/sai',
  'multiple choice': 'trắc nghiệm',
  'Mixed practice': 'Luyện tập hỗn hợp',
  'Practice more': 'Luyện thêm',
  'Practice question types': 'Loại câu hỏi luyện tập',
  'Cards per session': 'Số thẻ mỗi phiên',
  'No limit': 'Không giới hạn',
  'You reviewed {{count}} cards. There are more cards due - keep going or come back later.':
    'Bạn đã ôn {{count}} thẻ. Vẫn còn thẻ đến hạn - tiếp tục hoặc quay lại sau.',
  'Added to {{deck}}': 'Đã thêm vào {{deck}}',
  'Cloze added': 'Đã thêm bài điền khuyết',
  '"{{word}}" means "{{meaning}}"': '"{{word}}" nghĩa là "{{meaning}}"',
  'Not quite - "{{word}}" means "{{meaning}}".': 'Chưa đúng - "{{word}}" nghĩa là "{{meaning}}".',
  True: 'Đúng',
  False: 'Sai',
  'Correct!': 'Chính xác!',
  'What does this mean?': 'Từ này nghĩa là gì?',
  'True or false?': 'Đúng hay sai?',
  'Language pair': 'Cặp ngôn ngữ',
  '"I speak": explanations and the "More info" follow-up use this language.':
    '"Tôi nói": phần giải thích và mục "Thêm thông tin" dùng ngôn ngữ này.',
  '"I\'m learning": new words are looked up and generated in this language.':
    '"Tôi đang học": từ mới được tra cứu và tạo bằng ngôn ngữ này.',
  'Mixed practice presents due cards in a random mix of whichever formats are enabled here.':
    'Luyện tập hỗn hợp hiển thị các thẻ đến hạn theo cách trộn ngẫu nhiên các định dạng được bật ở đây.',
  'Cloze here is scored separately from the dedicated Cloze Practice mode.':
    'Điền khuyết ở đây được chấm điểm riêng biệt với chế độ Luyện điền khuyết chuyên biệt.',
  'Caps how many due cards a single review session pulls in - the most overdue cards first. Applies to every practice mode, not just Mixed.':
    'Giới hạn số thẻ đến hạn mà một phiên ôn tập tải vào - thẻ quá hạn lâu nhất trước. Áp dụng cho mọi chế độ luyện tập, không chỉ Hỗn hợp.',
  'If more are due, finish the session and tap "Practice more" for another round right away, instead of waiting until they come due again.':
    'Nếu còn thẻ đến hạn, hãy hoàn thành phiên và nhấn "Luyện thêm" để có thêm một vòng ngay lập tức, thay vì chờ đến khi chúng đến hạn lần nữa.',
  'How AI Providers works': 'Cách hoạt động của Nhà cung cấp AI',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled.':
    'Việc tạo thẻ (nghĩa, ví dụ, cụm, cụm từ, điền khuyết) sử dụng nhà cung cấp đã được cấu hình và bật bên dưới.',
  'Bring your own API key - nothing is sent to a provider until you generate a card.':
    'Dùng khóa API của riêng bạn - không có gì được gửi đến nhà cung cấp cho đến khi bạn tạo thẻ.',
  "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.":
    'Phản hồi của {{providerName}} cho từ này không đúng định dạng mong đợi. Điều này đôi khi có thể xảy ra - hãy thử lại, hoặc chọn nhà cung cấp AI khác trong Cài đặt > Nhà cung cấp AI.',
  '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} đã trả về phản hồi không thể đọc được. Điều này đôi khi có thể xảy ra - hãy thử lại, hoặc chọn nhà cung cấp AI khác trong Cài đặt > Nhà cung cấp AI.',
  '{{providerName}} could not generate a valid response for this word. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.':
    '{{providerName}} không thể tạo phản hồi hợp lệ cho từ này. Điều này đôi khi có thể xảy ra - hãy thử lại, hoặc chọn nhà cung cấp AI khác trong Cài đặt > Nhà cung cấp AI.',
  'The word is already blanked out below - select a different word or phrase and tap "Mark as cloze" to change it.':
    'Từ đã được ẩn bên dưới - chọn một từ hoặc cụm từ khác và nhấn "Đánh dấu là điền khuyết" để thay đổi.',
  'Cloze added to {{deck}}': 'Đã thêm bài điền khuyết vào {{deck}}',
  'Select a word or phrase in the sentence below, then tap "Mark as cloze" to blank it out.':
    'Chọn một từ hoặc cụm từ trong câu bên dưới, sau đó nhấn "Đánh dấu là điền khuyết" để ẩn nó.',
  Sentence: 'Câu',
  'Mark as cloze': 'Đánh dấu là điền khuyết',
  'Nothing to preview yet.': 'Chưa có gì để xem trước.',
  'English translation': 'Bản dịch tiếng Anh',
  'Add cloze card': 'Thêm thẻ điền khuyết',
  'Save cloze card': 'Lưu thẻ điền khuyết',

  'Underneath each example, thumbs up/down let you mark whether it\'s good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense - the same thing "Generate more examples" below the list does.':
    'Bên dưới mỗi ví dụ, nút thích/không thích giúp bạn đánh dấu nó tốt hay cần kiểm tra lại sau. Biểu tượng cờ báo một vấn đề cụ thể (như diễn đạt không tự nhiên hoặc lỗi ngữ pháp) kèm ghi chú tùy chọn. Mũi tên tròn tạo một loạt ví dụ mới cho nghĩa này - giống hệt nút "Tạo thêm ví dụ" bên dưới danh sách.',
  'Don\'t see the pattern you want? Type your own under "Custom Grammar Rule" and tap the + to add it to the selection - it\'s sent to the AI exactly as written, alongside any picked chips.':
    'Không thấy mẫu ngữ pháp bạn muốn? Gõ mẫu của riêng bạn vào "Custom Grammar Rule" rồi nhấn + để thêm vào lựa chọn - nó được gửi cho AI đúng như bạn đã gõ, cùng với các thẻ đã chọn.',
  '"Generate targeted examples" replaces the current examples with fresh ones written to practice your selection. Examples generated this way get a highlighted background, so you can tell which ones came from your request.':
    '"Generate targeted examples" thay các ví dụ hiện tại bằng ví dụ mới được viết để luyện đúng lựa chọn của bạn. Các ví dụ tạo theo cách này có nền được làm nổi bật, để bạn nhận ra chúng.',
  'The pencil icon lets you edit the meaning or example text directly (dictionary-sourced cards only - an AI card uses Regenerate and the per-field AI tools instead). The trash icon deletes this card entirely, after confirming. The last icon opens a quick web search for the word, for a second opinion outside the app.':
    'Biểu tượng cây bút cho phép bạn chỉnh sửa trực tiếp nghĩa hoặc văn bản ví dụ (chỉ với thẻ lấy từ từ điển - thẻ AI dùng Regenerate và các công cụ AI riêng cho từng trường thay vào đó). Biểu tượng thùng rác xóa hẳn thẻ này sau khi xác nhận. Biểu tượng cuối cùng mở nhanh một tìm kiếm trên web cho từ này, để có thêm ý kiến khác ngoài ứng dụng.',
  'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. Tap the sparkle icon on one to fetch AI usage & nuance - how formal it is and what makes it different from the headword. The icon next to it opens that synonym as its own flashcard.':
    'Từ đồng nghĩa là những từ khác có nghĩa gần giống, giúp mở rộng vốn từ quanh từ này. Nhấn biểu tượng lấp lánh trên một từ đồng nghĩa để lấy thông tin cách dùng & sắc thái từ AI - mức độ trang trọng và điểm khác với từ chính. Biểu tượng bên cạnh mở từ đồng nghĩa đó thành thẻ riêng của nó.',
  'Phrases show this word used in common expressions or word combinations, fetched on demand: tap "Explore with AI" the first time, or "Load more with AI" for another batch once you already have some.':
    'Cụm từ cho thấy từ này được dùng trong các cách diễn đạt hoặc tổ hợp từ thông dụng, được lấy khi cần: nhấn "Explore with AI" lần đầu, hoặc "Load more with AI" để lấy thêm khi đã có sẵn một số.',
  '"Add to Cloze" (or "Edit Cloze" once one exists) at the bottom opens the editor pre-filled with the currently selected example. Select a word or phrase in the sentence and tap "Mark as cloze" to blank it out - it defaults to blanking the headword itself - then adjust the translation and save.':
    'Nút "Add to Cloze" (hoặc "Edit Cloze" khi đã có sẵn) ở dưới cùng mở trình chỉnh sửa với ví dụ đang chọn được điền sẵn. Chọn một từ hoặc cụm từ trong câu rồi nhấn "Mark as cloze" để ẩn nó - mặc định sẽ ẩn chính từ chính - sau đó chỉnh bản dịch và lưu lại.',
  'Saving always replaces this card\'s cloze sentence rather than adding a second one - there\'s only ever one per card.':
    'Lưu luôn thay thế câu điền khuyết hiện có của thẻ này thay vì thêm câu thứ hai - mỗi thẻ chỉ có duy nhất một câu.',

  // Newly added — the redesigned AI Providers help sheet (grid + single detail panel) and its
  // matching Audio Settings labels
  'Active Generation Provider': 'Nhà cung cấp tạo nội dung đang hoạt động',
  'Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.':
    'Chọn công cụ AI nào được dùng để phân biệt ngữ cảnh, tạo gói từ vựng và soạn câu ví dụ theo cấp độ CEFR.',
  'Key configured': 'Đã cấu hình khóa',
  'No key set': 'Chưa đặt khóa',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.':
    'Chọn công cụ nào sẽ đọc to - giọng thiết bị miễn phí và hoạt động ngoại tuyến; các nhà cung cấp đám mây dùng khóa API của riêng bạn.',
  'Always available': 'Luôn khả dụng',
  'Validated': 'Đã xác thực',
  '"Active" vs "Enabled" - what\'s the difference?': '"Đang hoạt động" khác "Bật" thế nào?',
  'Adding and validating a key': 'Thêm và xác thực khóa',
  'Which provider should I pick?': 'Nên chọn nhà cung cấp nào?',
  'What the usage numbers mean': 'Các con số sử dụng nghĩa là gì',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.':
    'Đây là nơi một từ mới trở thành thẻ hoàn chỉnh - nghĩa, câu ví dụ, nhóm nghĩa, và nhiều hơn nữa. Bất cứ khi nào bạn tra một từ mà Lingora chưa biết, ứng dụng sẽ giao từ đó cho nhà cung cấp mà bạn đã đánh dấu **Đang hoạt động** bên dưới và yêu cầu tạo thẻ.',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.':
    'Đây là mô hình **"tự mang khóa của bạn"**: Lingora không đi kèm gói AI dùng chung, nên sẽ không có gì được tạo ra cho đến khi bạn dán khóa API của riêng mình vào một trong các nhà cung cấp bên dưới. Điều đó cũng có nghĩa là không có gì được gửi đi đâu cả cho đến khi bạn thực sự tra một từ - chỉ lưu khóa thôi thì không kích hoạt yêu cầu nào.',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.':
    'Bạn không cần điền đầy đủ mọi nhà cung cấp. Chỉ cần một khóa hoạt động và đã xác thực là đủ - chọn dịch vụ mà bạn đã có tài khoản, hoặc dịch vụ nào bạn tò mò muốn thử, rồi bắt đầu từ đó.',
  '**Active** is the one provider actually doing the work right now - the engine that responds when you look up a word. Only one provider can be Active at a time, and tapping a validated provider\'s card here switches to it immediately.':
    '**Đang hoạt động** là nhà cung cấp duy nhất thực sự đang làm việc ngay lúc này - công cụ trả lời khi bạn tra một từ. Chỉ một nhà cung cấp có thể Đang hoạt động tại một thời điểm, và chạm vào thẻ của một nhà cung cấp đã xác thực sẽ chuyển sang nó ngay lập tức.',
  '**Enabled** is a softer flag, tucked inside a provider\'s own settings panel. It controls whether that provider is allowed to be picked at all (including as a fallback, and as an option elsewhere in the app like Settings > Translation) - flip it off if you want to keep a key saved for later without it being usable right now.':
    '**Bật** là một cờ nhẹ nhàng hơn, nằm trong bảng cài đặt riêng của từng nhà cung cấp. Nó quyết định nhà cung cấp đó có được phép chọn hay không (kể cả làm phương án dự phòng, và như một lựa chọn ở nơi khác trong ứng dụng như Cài đặt > Dịch) - tắt nó nếu bạn muốn giữ một khóa để dùng sau mà chưa cho phép sử dụng ngay bây giờ.',
  'If a key gets cleared or fails validation while its provider is Active, Lingora quietly falls back to the next best option - whichever provider is both enabled and has a validated key - so you\'re never stuck without generation just because one key went stale.':
    'Nếu một khóa bị xóa hoặc xác thực thất bại trong khi nhà cung cấp của nó đang hoạt động, Lingora sẽ âm thầm chuyển sang phương án tốt nhất tiếp theo - nhà cung cấp vừa được bật vừa có khóa đã xác thực - để bạn không bao giờ mất khả năng tạo nội dung chỉ vì một khóa bị hỏng.',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Validate** - this sends one small real request to confirm the key actually works before you rely on it for word generation.':
    'Chạm vào thẻ của một nhà cung cấp để mở cài đặt của nó, dán khóa API của bạn vào, và chọn một mô hình khác nếu bạn muốn thay vì mô hình mặc định. Sau đó chạm **Xác thực** - thao tác này gửi một yêu cầu thực nhỏ để xác nhận khóa thực sự hoạt động trước khi bạn dựa vào nó để tạo từ.',
  'A provider only becomes eligible to be Active once its key has validated successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.':
    'Một nhà cung cấp chỉ đủ điều kiện trở thành Đang hoạt động khi khóa của nó đã được xác thực thành công. Đây là chủ ý - để tránh một khóa gõ sai hoặc hết hạn âm thầm trở thành trở ngại duy nhất giữa bạn và một thẻ mới.',
  '**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device\'s secure storage - not in Lingora\'s own servers, not synced anywhere, unless you back up and restore it yourself.':
    '**Xóa** sẽ gỡ bỏ hoàn toàn khóa khỏi thiết bị này (và đặt lại lịch sử xác thực cũng như sử dụng của nó). Không có gì được lưu ở đâu khác ngoài bộ nhớ an toàn của thiết bị này - không lưu trên máy chủ của Lingora, không đồng bộ ở bất kỳ đâu, trừ khi chính bạn sao lưu và khôi phục nó.',
  '**OpenAI** is the default and a safe general-purpose choice - reliable structured output, widely used, easy to get a key for at `platform.openai.com`.':
    '**OpenAI** là lựa chọn mặc định và an toàn cho mục đích chung - đầu ra có cấu trúc đáng tin cậy, được dùng rộng rãi, dễ lấy khóa tại `platform.openai.com`.',
  '**Groq** runs open models (like the gpt-oss family) on very fast custom hardware - if speed matters more to you than picking a specific model family, this is usually the quickest of the bunch to respond.':
    '**Groq** chạy các mô hình mở (như dòng gpt-oss) trên phần cứng riêng rất nhanh - nếu tốc độ quan trọng với bạn hơn việc chọn một dòng mô hình cụ thể, đây thường là nhà cung cấp phản hồi nhanh nhất.',
  '**Mistral** is a solid European alternative with its own models, good if you\'d rather not depend on a US-based provider or just want a second option in the mix.':
    '**Mistral** là một lựa chọn châu Âu vững chắc với các mô hình riêng - tốt nếu bạn không muốn phụ thuộc vào một nhà cung cấp của Mỹ, hoặc chỉ đơn giản là muốn có thêm một lựa chọn.',
  '**Gemini** (Google) tends to be generous on free-tier usage limits if you\'re just trying this out without committing to a paid key yet.':
    '**Gemini** (Google) thường có hạn mức sử dụng miễn phí khá rộng rãi, nếu bạn chỉ muốn dùng thử mà chưa muốn cam kết với một khóa trả phí.',
  '**Claude** (Anthropic) is known for careful, well-reasoned output - a good pick if you find another provider\'s example sentences or meanings feel a little off and want to compare.':
    '**Claude** (Anthropic) nổi tiếng với đầu ra cẩn thận, lập luận kỹ - lựa chọn tốt nếu bạn thấy câu ví dụ hoặc nghĩa của một nhà cung cấp khác hơi khó hiểu và muốn so sánh.',
  '**DeepSeek** is capable and inexpensive, but tends to run noticeably slower than the others for a full word generation - worth knowing going in so a longer wait doesn\'t feel like something\'s broken.':
    '**DeepSeek** có khả năng tốt và giá rẻ, nhưng thường chạy chậm hơn rõ rệt so với các nhà cung cấp khác khi tạo đầy đủ một từ - nên biết trước điều này để thời gian chờ lâu hơn không giống như một lỗi.',
  'Whichever you choose, the model picker under each provider lets you trade off speed, cost, and quality without needing to leave this screen.':
    'Dù bạn chọn nhà cung cấp nào, bộ chọn mô hình bên dưới mỗi nhà cung cấp cũng cho phép bạn cân bằng giữa tốc độ, chi phí và chất lượng mà không cần rời khỏi màn hình này.',
  'Each provider\'s panel shows a **device-observed usage** box - request and token counts this specific device has actually sent through that key. It\'s a convenience, not a bill: it only counts what happened here, so it won\'t match a key shared across multiple devices or apps.':
    'Bảng của mỗi nhà cung cấp hiển thị một ô **sử dụng được ghi nhận trên thiết bị** - số yêu cầu và token mà thiết bị này thực sự đã gửi qua khóa đó. Đây là thông tin tham khảo tiện lợi, không phải hóa đơn: nó chỉ đếm những gì xảy ra ở đây, nên sẽ không khớp với một khóa được dùng chung trên nhiều thiết bị hoặc ứng dụng.',
  'For the real, authoritative numbers - and anything to do with billing or rate limits - use the "Open usage" link, which takes you straight to that provider\'s own dashboard.':
    'Để xem số liệu thực tế, chính xác - và mọi thứ liên quan đến thanh toán hay giới hạn tốc độ - hãy dùng liên kết "Mở trang sử dụng", liên kết này sẽ đưa bạn thẳng đến bảng điều khiển riêng của nhà cung cấp đó.',
}

export const resources = {
  en: { translation: english },
  de: { translation: complete(de) },
  fr: { translation: complete(fr) },
  es: { translation: complete(es) },
  hi: { translation: complete(hi) },
  vi: { translation: complete(vi) },
} as const
