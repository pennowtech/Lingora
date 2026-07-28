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
  'Home', 'Search', 'Decks', 'Mine', 'Settings',
  // Common actions
  'Cancel', 'Save', 'Delete', 'Edit', 'Done', 'Continue', 'Back', 'Next',
  'Add', 'Import', 'Export', 'Retry', 'Close', 'Install', 'Uninstall', 'Installed',
  // Settings — sections
  'Generation', 'Translation', 'Learning', 'Data', 'Privacy', 'About',
  // Settings — labels
  'App Language', 'Follow device', 'Default CEFR level',
  'Examples and explanations are calibrated to this level.',
  'Import & export', 'Anki, CSV, JSON backup',
  'Card templates', 'Customize card layouts',
  'Pronunciation', 'Voice, rate, pitch',
  'Word guides', 'Free starter dictionary — no AI key needed',
  'Delete all API keys',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.',
  'English', 'German', 'French', 'Spanish', 'Hindi',

  // Home
  "Ready for today's session?", '{{count}} days', "Some data on this screen couldn't load.",
  'cards due for review', 'Start review', 'reviewed today', 'retention', 'total cards →',
  'Quick actions', 'Look up a word', 'Mining queue', 'Practice cloze', 'Statistics',
  'Recently added', 'See all', 'No words yet', 'Look up a word to add your first card.',

  // Search
  'Type a German or English word…', 'Instant lookup',
  'Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.',
  '"{{term}}" is new', "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.",
  'Translating…', 'Generating…', 'Generate with AI', 'Add your OpenAI key in Settings to generate new words',
  'Generation came back incomplete', 'Nothing was saved — try again.',
  'From your installed dictionary — free, no AI needed.',

  // Decks / Deck detail
  'Give the deck a name.', 'Could not delete deck', 'Delete deck?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.',
  'No deck selected.', 'Could not move deck', 'Could not merge deck',
  'Merge into "{{name}}"?', 'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.',
  'Export ready', 'Exported {{count}} cards.', 'Saved to the folder you chose.', 'Choose where to save it.',
  'Export failed', 'No decks yet', 'Create your first deck with the + button.',
  'New deck', 'Deck name', 'Emoji (optional)', 'Creating…', 'Create deck',
  'Import into this deck', 'Export this deck', 'Rename deck', 'Move to…', 'Merge into…', 'Delete deck',
  'Rename deck', 'Saving…', 'Save', 'Top level (no parent)', 'No other deck to nest this one under.',
  'No other deck to merge into.', 'Import into "{{name}}"', 'Export "{{name}}"',
  '{{due}} due/{{total}} cards', '{{count}} due', 'Deck', 'This deck no longer exists.',
  'cards', 'due now', 'Review {{count}} due cards', 'Nothing due — study ahead', 'Cards',
  'No cards yet — add words from Search.', 'Move "{{name}}" to…', 'Merge "{{name}}" into…',

  // Mine (mining queue)
  'Could not discard capture', 'Could not save capture', 'Clipboard is empty',
  'Copy some text first, then paste it here.', 'Could not read clipboard',
  'Add your OpenAI key in Settings to generate cards.', 'Add a sentence',
  'Paste or type a German sentence. It joins the queue below — nothing is sent to AI until you generate.',
  'Paste from clipboard', 'Adding…', 'Add to queue', 'Queue is empty',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet — it lands here before any AI processing.',
  '{{done}} of {{total}} generated', '{{count}} failed', 'see Decks.',
  'Review your captures. Discard what you don\'t need, then generate cards for the rest — no API call is wasted on text you didn\'t ask for.',
  'Generate {{count}} cards with AI', 'Add your OpenAI key to generate cards',

  // Word detail
  'Add your OpenAI key in Settings to generate examples.', 'This word has no card yet.',
  'Could not save your feedback', 'Could not save your report', 'Could not change the primary meaning',
  'Could not update the flashcard example', 'This word has no meaning yet.', 'Could not generate an explanation',
  'AI not configured', 'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.',
  'Could not look up an explanation', 'Could not save your changes',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.',
  'No explanation yet.', 'Make primary: {{translation}}', 'Examples', 'shown on flashcard', 'use on flashcard',
  'Advanced grammar options', 'Active: {{selection}}', 'Generate examples',
  'Add your OpenAI key in Settings to generate targeted examples.', 'Synonyms', 'Phrases & collocations',
  'Cloze card', 'Cloze cards', 'Added ✓ — add to another deck', 'Add to deck', 'Add "{{form}}" to…',
  'Edit this card', 'Meaning', 'Example sentence', 'Example translation', 'Cancel', 'Save changes',
  "What's wrong with this?", 'Optional details…', 'Send report', 'Sending…',
  'Inaccurate translation', 'Unnatural phrasing', 'Wrong CEFR level', 'Grammar error', 'Other',
  'Tense & mood', 'Sentence structure', 'Conjunctions', 'Focus words',

  // Review session
  'GOOD', 'AGAIN', 'EASY', 'HARD', 'No card to rate.', 'Could not save your rating', 'No card to edit.',
  'Add your AI provider key in Settings to generate an explanation.', 'Nothing due right now',
  'Session complete!', 'This deck has no cards due for review. Add words or check back later.',
  'You reviewed {{count}} cards. Great work — come back when the next cards are due.', 'Back to deck',
  'tap to reveal', 'cloze', 'Basic inline HTML works too — {{bold}}, {{italic}}, {{colored}}.',

  // Stats
  'No stats yet', 'Add and review some words to see your learning statistics here.',
  'retention (30 d)', 'day streak', 'total cards', 'new this week', 'Review activity', 'less', 'more',
  'Vocabulary growth', 'new words per week', 'Difficult words', 'No lapses yet — nothing difficult to show.',
  '{{count}} lapses',

  // Import & export
  'Anki deck (.apkg)', "Bring your existing decks. Review history isn't imported — cards start fresh.",
  'Choose .apkg file', 'CSV with column mapping', 'From Quizlet, Memrise, or spreadsheets.', 'Choose CSV file',
  'A shared deck (.lin)',
  "Add a deck someone shared with you — full fidelity, including review history. Doesn't touch anything else on this device.",
  'Choose .lin file', 'Restore from Lingora backup (.lin)',
  'Replaces everything on this device with a previously exported backup.', 'Restoring…', 'Choose backup file',
  'Lingora backup (.lin)',
  'Your full library — decks, cards, review history. Your data is always yours. API keys are never included.',
  'Export everything', 'CSV', 'One row per card — the same columns CSV import reads, so this file re-imports as-is.',
  'Export as CSV',
  'Study your Lingora vocabulary in Anki/AnkiDroid. Cards start fresh — review history isn\'t carried over.',
  'Export as .apkg', 'Markdown', 'A readable word — meaning — example list. Not meant to re-import.',
  'Export as Markdown', 'Backup ready', 'Restore from backup?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.',
  'Restore', 'Restore complete', 'Restored {{count}} rows.', 'Restore failed', 'Invalid backup file',
  'Could not read file',

  // CSV / Anki / .lin import wizards
  'Preview', 'Will import', 'Duplicates', 'Errors', 'Selected', 'Back', 'Import {{count}} rows',
  'Import {{count}} words', 'Import from CSV', "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.",
  '{{count}} rows detected. Map each column below.', 'Sample data',
  'The first few rows, so you can see what each column actually holds.', 'Column {{n}}',
  'Field mapping', "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes — they're derived from the example's cloze markup and its translation.",
  'None', 'Import into deck', '+ New deck', 'If the word already exists',
  'Applies to every duplicate row you leave checked in the next step.', 'Checking…', 'Preview import',
  'Importing…', 'Import complete', 'Imported {{count}} words.', 'Imported', 'Skipped', 'Failed',
  'Import another file', 'New deck', 'Create & select', 'Could not read this file', 'Import failed',
  'This file has no rows to import.', 'Word', 'Example', 'Status', 'Issues', 'Skip', "Don't touch the existing word.",
  'Merge', 'Add this as another meaning on the existing card.', 'Keep both', 'Add a second, separate card for the same word.',

  'Import from Anki', "Choose a `.apkg` export. Review history isn't imported — every card starts fresh — and media (audio/images) is stripped rather than copied.",
  '{{notes}} notes across {{decks}} decks. Map each field below — it applies to every note, so a note type without that many fields just leaves it empty.',
  'The first few notes, so you can see what each field actually holds.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes — they're derived from the example's cloze markup and its translation.",
  'Field {{n}}', 'This collection has no notes to import.', 'Could not read this collection',
  '{{done}} of {{total}} notes', 'Import canceled',
  'The rest were left untouched — you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).',
  'Tags',

  'Import from a .lin file', 'Choose a Lingora `.lin` file — a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.',
  'This file has more than one deck. Which one do you want to import?', 'This file has no decks to import.',
  'Importing "{{name}}" ({{count}} cards).', "Don't touch the word already in your library.",
  'Imported {{words}} words ({{cards}} cards).',

  // Templates
  'Vocabulary', 'Cloze', '+ New', 'Front', 'Back', 'actual review card size on this device',
  'Rendered with a sample cloze sentence through the same engine the review session uses.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.',
  'Template name', 'Fields', 'Tap "Front" or "Back" to show a field on that side — a field can appear on both, or neither.',
  'Layout & style', 'Reset to default', 'Accent color',
  'Stored as a', 'rule — reference it in your CSS below as', 'CSS', 'Applied to both sides in the real WebView renderer.',
  'Front (Liquid)', 'Back (Liquid)', 'Available template variables', 'Conditional example',
  'Set default', 'Deleting…', 'Delete this template?', '"{{name}}" will be removed.',
  'Create template', 'Template editor help', 'Fields tab', 'Style tab', 'Preview tab', 'Code tab',
  'HTML & CSS without extra elements', 'Could not save template', 'Could not set default template',
  'Could not delete template', 'New template', 'Reset to default layout & style?',
  'This replaces the front, back, and CSS in the editor — tap "Save changes" to keep it. Unsaved edits are lost.',
  'Reset',

  // TTS
  'Speaking rate', 'Pitch', 'Normal', 'Voice (German)', 'No German voices are installed on this device.',
  'Device default', 'Enhanced',
  "Voices come from the device's own text-to-speech engine — install more from your phone's system settings if you don't see the one you want.",
  'Playing…', 'Test',

  // Word guides
  'Could not install this chunk', 'Could not remove this chunk', 'Word guides installed',
  'Installed {{count}} new chunks.', 'Could not install word guides', 'German word guides',
  'A free, pre-written dictionary — install to get instant word explanations without an AI key.',
  '{{words}} words planned, {{chunks}} chunks of ~100.',
  '{{installed}} installed · {{available}} available to install · {{pending}} not generated yet',
  'Install all available', 'Chunks', 'Words {{start}}–{{end}}', '{{count}} words', 'Not generated yet',
  'Uninstall all', 'Uninstalling…', 'Word guides uninstalled', 'Removed {{count}} chunks.',
  'Could not uninstall word guides', 'Uninstall all word guides?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.',
  'No translation to add.', 'No dictionary entry to add.', 'Details', 'More info', 'Hide details',
  'Understanding the German {{wordClass}} "{{headword}}"', 'Usage', 'Examples of Usage',
  'Noun', 'Verb', 'Adjective', 'Adverb', 'Preposition', 'Conjunction', 'Pronoun', 'Article', 'Phrase', 'Word',

  // Settings — provider chrome
  'Connected', 'No internet connection', 'DeepL validation failed', '{{provider}} validation failed',
  'Delete all API keys?', 'This removes every provider key from this device. Vocabulary and progress are unaffected.',
  'Limited mode', 'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.',
  "Couldn't load saved settings",
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key — nothing is sent until you generate a card.',
  'Active provider', 'Model', 'Paste your {{provider}} API key…', 'Hide {{provider}} API key',
  'Show {{provider}} API key', 'Validate key', 'Clear', 'Device-observed usage', '{{count}} requests',
  '{{count}} tokens', 'Open {{provider}} usage ↗', 'Google Translate', 'Free tier, no key needed',
  'Uses this provider’s key above', 'Add a key above to enable', 'Active',
  'Best German↔English quality — bring your own key', 'Hide DeepL settings', 'Show DeepL settings',
  'Paste your DeepL API key…', 'Enabled', 'Open DeepL usage ↗', 'v0.0.1 · offline-first · your data stays on device',

  // Root layout titles
  'Opening your vocabulary…', 'Import & Export', 'Import CSV', 'Import Anki deck', 'Card Templates',
] as const

type Phrase = (typeof ENGLISH_PHRASES)[number]
type PhraseMap = Record<string, string>

const english: PhraseMap = Object.fromEntries(ENGLISH_PHRASES.map((phrase) => [phrase, phrase]))

function complete(overrides: Partial<Record<Phrase, string>>): PhraseMap {
  return { ...english, ...overrides }
}

const de: Partial<Record<Phrase, string>> = {
  Home: 'Start', Search: 'Suche', Decks: 'Stapel', Mine: 'Meins', Settings: 'Einstellungen',
  Cancel: 'Abbrechen', Save: 'Speichern', Delete: 'Löschen', Edit: 'Bearbeiten', Done: 'Fertig',
  Continue: 'Weiter', Back: 'Zurück', Next: 'Weiter', Add: 'Hinzufügen', Import: 'Importieren',
  Export: 'Exportieren', Retry: 'Erneut versuchen', Close: 'Schließen', Install: 'Installieren',
  Uninstall: 'Deinstallieren', Installed: 'Installiert',
  Generation: 'Generierung', Translation: 'Übersetzung', Learning: 'Lernen', Data: 'Daten',
  Privacy: 'Datenschutz', About: 'Über',
  'App Language': 'App-Sprache', 'Follow device': 'Gerätesprache verwenden',
  'Default CEFR level': 'Standard-Niveaustufe (GER)',
  'Examples and explanations are calibrated to this level.':
    'Beispiele und Erklärungen sind auf dieses Niveau abgestimmt.',
  'Import & export': 'Import & Export', 'Anki, CSV, JSON backup': 'Anki, CSV, JSON-Sicherung',
  'Card templates': 'Kartenvorlagen', 'Customize card layouts': 'Kartenlayouts anpassen',
  Pronunciation: 'Aussprache', 'Voice, rate, pitch': 'Stimme, Geschwindigkeit, Tonhöhe',
  'Word guides': 'Wortführer', 'Free starter dictionary — no AI key needed': 'Kostenloses Starter-Wörterbuch — kein KI-Schlüssel nötig',
  'Delete all API keys': 'Alle API-Schlüssel löschen',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'API-Schlüssel verbleiben auf diesem Gerät (Expo SecureStore) und werden nie in Exporte oder Sicherungen aufgenommen.',
  English: 'Englisch', German: 'Deutsch', French: 'Französisch', Spanish: 'Spanisch', Hindi: 'Hindi',

  "Ready for today's session?": 'Bereit für die heutige Sitzung?', '{{count}} days': '{{count}} Tage',
  "Some data on this screen couldn't load.": 'Einige Daten auf diesem Bildschirm konnten nicht geladen werden.',
  'cards due for review': 'Karten zur Wiederholung fällig', 'Start review': 'Wiederholung starten',
  'reviewed today': 'heute wiederholt', retention: 'Behaltensrate', 'total cards →': 'Karten insgesamt →',
  'Quick actions': 'Schnellzugriff', 'Look up a word': 'Ein Wort nachschlagen', 'Mining queue': 'Sammel-Warteschlange',
  'Practice cloze': 'Lückentext üben', Statistics: 'Statistiken',
  'Recently added': 'Kürzlich hinzugefügt', 'See all': 'Alle anzeigen', 'No words yet': 'Noch keine Wörter',
  'Look up a word to add your first card.': 'Schlage ein Wort nach, um deine erste Karte zu erstellen.',

  'Type a German or English word…': 'Ein deutsches oder englisches Wort eingeben…', 'Instant lookup': 'Sofortnachschlagen',
  'Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.':
    'Suche auf Deutsch ("ausgeh…") oder Englisch ("go out").\nGebeugte Formen wie "ging aus" funktionieren auch.',
  '"{{term}}" is new': '„{{term}}" ist neu',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    'Dieses Wort ist noch nicht in deiner Bibliothek. Erzeuge Bedeutungen, Beispiele und Synonyme mit KI.',
  'Translating…': 'Übersetze…', 'Generating…': 'Erzeuge…', 'Generate with AI': 'Mit KI erzeugen',
  'Add your OpenAI key in Settings to generate new words': 'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um neue Wörter zu erzeugen',
  'Generation came back incomplete': 'Die Generierung kam unvollständig zurück',
  'From your installed dictionary — free, no AI needed.': 'Aus deinem installierten Wörterbuch — kostenlos, keine KI nötig.',
  'Nothing was saved — try again.': 'Es wurde nichts gespeichert — versuche es erneut.',

  'Give the deck a name.': 'Gib dem Stapel einen Namen.', 'Could not delete deck': 'Stapel konnte nicht gelöscht werden',
  'Delete deck?': 'Stapel löschen?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    'Karten, die nur in diesem Stapel sind, werden mit ihm gelöscht. Karten in anderen Stapeln bleiben erhalten.',
  'No deck selected.': 'Kein Stapel ausgewählt.', 'Could not move deck': 'Stapel konnte nicht verschoben werden',
  'Could not merge deck': 'Stapel konnte nicht zusammengeführt werden',
  'Merge into "{{name}}"?': 'In „{{name}}" zusammenführen?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'Dies löscht „{{source}}" und verschiebt alle Karten nach „{{target}}". Dies kann nicht rückgängig gemacht werden.',
  'Export ready': 'Export bereit', 'Exported {{count}} cards.': '{{count}} Karten exportiert.',
  'Saved to the folder you chose.': 'Im gewählten Ordner gespeichert.', 'Choose where to save it.': 'Wähle, wo gespeichert werden soll.',
  'Export failed': 'Export fehlgeschlagen', 'No decks yet': 'Noch keine Stapel',
  'Create your first deck with the + button.': 'Erstelle deinen ersten Stapel mit der +-Schaltfläche.',
  'New deck': 'Neuer Stapel', 'Deck name': 'Stapelname', 'Emoji (optional)': 'Emoji (optional)',
  'Creating…': 'Wird erstellt…', 'Create deck': 'Stapel erstellen',
  'Import into this deck': 'In diesen Stapel importieren', 'Export this deck': 'Diesen Stapel exportieren',
  'Rename deck': 'Stapel umbenennen', 'Move to…': 'Verschieben nach…', 'Merge into…': 'Zusammenführen mit…',
  'Delete deck': 'Stapel löschen', 'Top level (no parent)': 'Oberste Ebene (kein übergeordneter Stapel)',
  'No other deck to nest this one under.': 'Kein anderer Stapel, unter dem dieser eingeordnet werden könnte.',
  'No other deck to merge into.': 'Kein anderer Stapel, mit dem zusammengeführt werden könnte.',
  'Import into "{{name}}"': 'In „{{name}}" importieren', 'Export "{{name}}"': '„{{name}}" exportieren',
  '{{due}} due/{{total}} cards': '{{due}} fällig/{{total}} Karten', '{{count}} due': '{{count}} fällig',
  Deck: 'Stapel', 'This deck no longer exists.': 'Dieser Stapel existiert nicht mehr.',
  cards: 'Karten', 'due now': 'jetzt fällig', 'Review {{count}} due cards': '{{count}} fällige Karten wiederholen',
  'Nothing due — study ahead': 'Nichts fällig — im Voraus lernen', Cards: 'Karten',
  'No cards yet — add words from Search.': 'Noch keine Karten — füge Wörter über die Suche hinzu.',
  'Move "{{name}}" to…': '„{{name}}" verschieben nach…', 'Merge "{{name}}" into…': '„{{name}}" zusammenführen mit…',

  'Could not discard capture': 'Erfassung konnte nicht verworfen werden', 'Could not save capture': 'Erfassung konnte nicht gespeichert werden',
  'Clipboard is empty': 'Zwischenablage ist leer', 'Copy some text first, then paste it here.': 'Kopiere zuerst einen Text und füge ihn dann hier ein.',
  'Could not read clipboard': 'Zwischenablage konnte nicht gelesen werden',
  'Add your OpenAI key in Settings to generate cards.': 'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um Karten zu erzeugen.',
  'Add a sentence': 'Einen Satz hinzufügen',
  'Paste or type a German sentence. It joins the queue below — nothing is sent to AI until you generate.':
    'Füge einen deutschen Satz ein oder tippe ihn. Er landet in der Warteschlange unten — nichts wird an die KI gesendet, bis du generierst.',
  'Paste from clipboard': 'Aus Zwischenablage einfügen', 'Adding…': 'Wird hinzugefügt…', 'Add to queue': 'Zur Warteschlange hinzufügen',
  'Queue is empty': 'Warteschlange ist leer',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet — it lands here before any AI processing.':
    'Füge einen Satz manuell hinzu, füge einen aus der Zwischenablage ein oder erfasse Text über das Teilen-Menü — er landet hier, bevor er von der KI verarbeitet wird.',
  '{{done}} of {{total}} generated': '{{done}} von {{total}} erzeugt', '{{count}} failed': '{{count}} fehlgeschlagen',
  'see Decks.': 'siehe Stapel.',
  "Review your captures. Discard what you don't need, then generate cards for the rest — no API call is wasted on text you didn't ask for.":
    'Überprüfe deine Erfassungen. Verwirf, was du nicht brauchst, und erzeuge dann Karten für den Rest — kein API-Aufruf wird für Text verschwendet, den du nicht angefordert hast.',
  'Generate {{count}} cards with AI': '{{count}} Karten mit KI erzeugen',
  'Add your OpenAI key to generate cards': 'Füge deinen OpenAI-Schlüssel hinzu, um Karten zu erzeugen',

  'Add your OpenAI key in Settings to generate examples.': 'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um Beispiele zu erzeugen.',
  'This word has no card yet.': 'Dieses Wort hat noch keine Karte.', 'Could not save your feedback': 'Dein Feedback konnte nicht gespeichert werden',
  'Could not save your report': 'Deine Meldung konnte nicht gespeichert werden', 'Could not change the primary meaning': 'Die Hauptbedeutung konnte nicht geändert werden',
  'Could not update the flashcard example': 'Das Karteikarten-Beispiel konnte nicht aktualisiert werden',
  'This word has no meaning yet.': 'Dieses Wort hat noch keine Bedeutung.', 'Could not generate an explanation': 'Eine Erklärung konnte nicht erzeugt werden',
  'AI not configured': 'KI nicht konfiguriert',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'Füge einen OpenAI-, Mistral-, Gemini- oder Claude-Schlüssel in den Einstellungen hinzu, um eine Erklärung für diese Bedeutung zu erzeugen.',
  'Could not look up an explanation': 'Eine Erklärung konnte nicht nachgeschlagen werden', 'Could not save your changes': 'Deine Änderungen konnten nicht gespeichert werden',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '„{{form}}" ist noch nicht in deiner Bibliothek. Schlage es über die Suche nach, um es zu erzeugen.',
  'No explanation yet.': 'Noch keine Erklärung.', 'Make primary: {{translation}}': 'Als Hauptbedeutung festlegen: {{translation}}',
  Examples: 'Beispiele', 'shown on flashcard': 'auf Karteikarte angezeigt', 'use on flashcard': 'auf Karteikarte verwenden',
  'Advanced grammar options': 'Erweiterte Grammatikoptionen', 'Active: {{selection}}': 'Aktiv: {{selection}}',
  'Generate examples': 'Beispiele erzeugen',
  'Add your OpenAI key in Settings to generate targeted examples.': 'Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um gezielte Beispiele zu erzeugen.',
  Synonyms: 'Synonyme', 'Phrases & collocations': 'Redewendungen & Kollokationen',
  'Cloze card': 'Lückentext-Karte', 'Cloze cards': 'Lückentext-Karten',
  'Added ✓ — add to another deck': 'Hinzugefügt ✓ — zu einem weiteren Stapel hinzufügen', 'Add to deck': 'Zu Stapel hinzufügen',
  'Add "{{form}}" to…': '„{{form}}" hinzufügen zu…',
  'Edit this card': 'Diese Karte bearbeiten', Meaning: 'Bedeutung', 'Example sentence': 'Beispielsatz',
  'Example translation': 'Beispielübersetzung', 'Save changes': 'Änderungen speichern',
  "What's wrong with this?": 'Was stimmt hier nicht?', 'Optional details…': 'Optionale Details…',
  'Send report': 'Meldung senden', 'Sending…': 'Wird gesendet…',
  'Inaccurate translation': 'Ungenaue Übersetzung', 'Unnatural phrasing': 'Unnatürliche Formulierung',
  'Wrong CEFR level': 'Falsches GER-Niveau', 'Grammar error': 'Grammatikfehler', Other: 'Sonstiges',
  'Tense & mood': 'Zeitform & Modus', 'Sentence structure': 'Satzbau', Conjunctions: 'Konjunktionen', 'Focus words': 'Fokuswörter',

  GOOD: 'GUT', AGAIN: 'NOCHMAL', EASY: 'LEICHT', HARD: 'SCHWER',
  'No card to rate.': 'Keine Karte zum Bewerten.', 'Could not save your rating': 'Deine Bewertung konnte nicht gespeichert werden',
  'No card to edit.': 'Keine Karte zum Bearbeiten.',
  'Add your AI provider key in Settings to generate an explanation.': 'Füge deinen KI-Anbieter-Schlüssel in den Einstellungen hinzu, um eine Erklärung zu erzeugen.',
  'Nothing due right now': 'Gerade nichts fällig', 'Session complete!': 'Sitzung abgeschlossen!',
  'This deck has no cards due for review. Add words or check back later.':
    'Dieser Stapel hat keine fälligen Karten. Füge Wörter hinzu oder schau später wieder vorbei.',
  'You reviewed {{count}} cards. Great work — come back when the next cards are due.':
    'Du hast {{count}} Karten wiederholt. Gut gemacht — komm wieder, wenn die nächsten Karten fällig sind.',
  'Back to deck': 'Zurück zum Stapel', 'tap to reveal': 'zum Aufdecken tippen', cloze: 'Lückentext',
  'Basic inline HTML works too — {{bold}}, {{italic}}, {{colored}}.':
    'Einfaches Inline-HTML funktioniert auch — {{bold}}, {{italic}}, {{colored}}.',

  'No stats yet': 'Noch keine Statistiken',
  'Add and review some words to see your learning statistics here.': 'Füge Wörter hinzu und wiederhole sie, um hier deine Lernstatistiken zu sehen.',
  'retention (30 d)': 'Behaltensrate (30 T.)', 'day streak': 'Tage-Serie', 'total cards': 'Karten insgesamt',
  'new this week': 'neu diese Woche', 'Review activity': 'Wiederholungsaktivität', less: 'weniger', more: 'mehr',
  'Vocabulary growth': 'Vokabelwachstum', 'new words per week': 'neue Wörter pro Woche',
  'Difficult words': 'Schwierige Wörter', 'No lapses yet — nothing difficult to show.': 'Noch keine Rückfälle — nichts Schwieriges zu zeigen.',
  '{{count}} lapses': '{{count}} Rückfälle',

  'Anki deck (.apkg)': 'Anki-Stapel (.apkg)',
  "Bring your existing decks. Review history isn't imported — cards start fresh.":
    'Bring deine bestehenden Stapel mit. Der Wiederholungsverlauf wird nicht importiert — Karten starten neu.',
  'Choose .apkg file': '.apkg-Datei auswählen', 'CSV with column mapping': 'CSV mit Spaltenzuordnung',
  'From Quizlet, Memrise, or spreadsheets.': 'Von Quizlet, Memrise oder Tabellenkalkulationen.',
  'Choose CSV file': 'CSV-Datei auswählen', 'A shared deck (.lin)': 'Ein geteilter Stapel (.lin)',
  "Add a deck someone shared with you — full fidelity, including review history. Doesn't touch anything else on this device.":
    'Füge einen Stapel hinzu, den dir jemand geteilt hat — vollständig, inklusive Wiederholungsverlauf. Berührt nichts anderes auf diesem Gerät.',
  'Choose .lin file': '.lin-Datei auswählen', 'Restore from Lingora backup (.lin)': 'Aus Lingora-Sicherung wiederherstellen (.lin)',
  'Replaces everything on this device with a previously exported backup.': 'Ersetzt alles auf diesem Gerät durch eine zuvor exportierte Sicherung.',
  'Restoring…': 'Wird wiederhergestellt…', 'Choose backup file': 'Sicherungsdatei auswählen',
  'Lingora backup (.lin)': 'Lingora-Sicherung (.lin)',
  'Your full library — decks, cards, review history. Your data is always yours. API keys are never included.':
    'Deine gesamte Bibliothek — Stapel, Karten, Wiederholungsverlauf. Deine Daten gehören immer dir. API-Schlüssel sind nie enthalten.',
  'Export everything': 'Alles exportieren', CSV: 'CSV',
  'One row per card — the same columns CSV import reads, so this file re-imports as-is.':
    'Eine Zeile pro Karte — dieselben Spalten, die der CSV-Import liest, sodass diese Datei unverändert wieder importiert werden kann.',
  'Export as CSV': 'Als CSV exportieren',
  "Study your Lingora vocabulary in Anki/AnkiDroid. Cards start fresh — review history isn't carried over.":
    'Lerne deine Lingora-Vokabeln in Anki/AnkiDroid. Karten starten neu — der Wiederholungsverlauf wird nicht übernommen.',
  'Export as .apkg': 'Als .apkg exportieren', Markdown: 'Markdown',
  'A readable word — meaning — example list. Not meant to re-import.': 'Eine lesbare Wort-Bedeutung-Beispiel-Liste. Nicht zum erneuten Import gedacht.',
  'Export as Markdown': 'Als Markdown exportieren', 'Backup ready': 'Sicherung bereit', 'Restore from backup?': 'Aus Sicherung wiederherstellen?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'Dies ersetzt alles, was derzeit auf diesem Gerät ist, durch den Inhalt von „{{fileName}}" (exportiert am {{date}}). Dies kann nicht rückgängig gemacht werden.',
  Restore: 'Wiederherstellen', 'Restore complete': 'Wiederherstellung abgeschlossen', 'Restored {{count}} rows.': '{{count}} Zeilen wiederhergestellt.',
  'Restore failed': 'Wiederherstellung fehlgeschlagen', 'Invalid backup file': 'Ungültige Sicherungsdatei',
  'Could not read file': 'Datei konnte nicht gelesen werden',

  Preview: 'Vorschau', 'Will import': 'Wird importiert', Duplicates: 'Duplikate', Errors: 'Fehler', Selected: 'Ausgewählt',
  'Import {{count}} rows': '{{count}} Zeilen importieren', 'Import {{count}} words': '{{count}} Wörter importieren',
  'Import from CSV': 'Aus CSV importieren',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Von Quizlet, Memrise oder einem Tabellenexport. Als Nächstes legst du fest, was jede Spalte bedeutet.',
  '{{count}} rows detected. Map each column below.': '{{count}} Zeilen erkannt. Ordne unten jede Spalte zu.',
  'Sample data': 'Beispieldaten', 'The first few rows, so you can see what each column actually holds.':
    'Die ersten paar Zeilen, damit du siehst, was jede Spalte tatsächlich enthält.',
  'Column {{n}}': 'Spalte {{n}}', 'Field mapping': 'Feldzuordnung',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes — they're derived from the example's cloze markup and its translation.":
    'Alles ist optional. Lasse Wort/Bedeutung bei Lückentext-Notizen unzugeordnet — sie werden aus der Lückentext-Markierung des Beispiels und dessen Übersetzung abgeleitet.',
  None: 'Keine', 'Import into deck': 'In Stapel importieren', '+ New deck': '+ Neuer Stapel',
  'If the word already exists': 'Falls das Wort bereits existiert',
  'Applies to every duplicate row you leave checked in the next step.': 'Gilt für jede markierte Duplikat-Zeile im nächsten Schritt.',
  'Checking…': 'Wird geprüft…', 'Preview import': 'Import-Vorschau',
  'Importing…': 'Wird importiert…', 'Import complete': 'Import abgeschlossen', 'Imported {{count}} words.': '{{count}} Wörter importiert.',
  Imported: 'Importiert', Skipped: 'Übersprungen', Failed: 'Fehlgeschlagen', 'Import another file': 'Weitere Datei importieren',
  'Could not read this file': 'Diese Datei konnte nicht gelesen werden', 'Import failed': 'Import fehlgeschlagen',
  'This file has no rows to import.': 'Diese Datei enthält keine importierbaren Zeilen.',
  Word: 'Wort', Example: 'Beispiel', Status: 'Status', Issues: 'Probleme', Skip: 'Überspringen',
  "Don't touch the existing word.": 'Bestehendes Wort nicht verändern.', Merge: 'Zusammenführen',
  'Add this as another meaning on the existing card.': 'Als weitere Bedeutung zur bestehenden Karte hinzufügen.',
  'Keep both': 'Beide behalten', 'Add a second, separate card for the same word.': 'Eine zweite, separate Karte für dasselbe Wort hinzufügen.',

  'Import from Anki': 'Aus Anki importieren',
  "Choose a `.apkg` export. Review history isn't imported — every card starts fresh — and media (audio/images) is stripped rather than copied.":
    'Wähle einen `.apkg`-Export. Der Wiederholungsverlauf wird nicht importiert — jede Karte startet neu — und Medien (Audio/Bilder) werden entfernt statt kopiert.',
  '{{notes}} notes across {{decks}} decks. Map each field below — it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{notes}} Notizen in {{decks}} Stapeln. Ordne unten jedes Feld zu — es gilt für jede Notiz, ein Notiztyp ohne so viele Felder bleibt dann einfach leer.',
  'The first few notes, so you can see what each field actually holds.': 'Die ersten paar Notizen, damit du siehst, was jedes Feld tatsächlich enthält.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes — they're derived from the example's cloze markup and its translation.":
    'Alles ist optional. Lasse Wort/Bedeutung bei Lückentext-Notizen unzugeordnet — sie werden aus der Lückentext-Markierung des Beispiels und dessen Übersetzung abgeleitet.',
  'Field {{n}}': 'Feld {{n}}', 'This collection has no notes to import.': 'Diese Sammlung enthält keine importierbaren Notizen.',
  'Could not read this collection': 'Diese Sammlung konnte nicht gelesen werden', '{{done}} of {{total}} notes': '{{done}} von {{total}} Notizen',
  'Import canceled': 'Import abgebrochen',
  'The rest were left untouched — you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'Der Rest wurde nicht verändert — du kannst dieselbe Datei erneut importieren, um dort weiterzumachen (bereits importierte Wörter werden als Duplikate übersprungen).',
  Tags: 'Tags',

  'Import from a .lin file': 'Aus einer .lin-Datei importieren',
  'Choose a Lingora `.lin` file — a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    'Wähle eine Lingora-`.lin`-Datei — einen von jemandem geteilten Stapel oder einen deiner eigenen Stapel-Exporte. Vollständig: Bedeutungen, Beispiele, Synonyme, Lückentext-Karten, Wiederholungsverlauf und FSRS-Planung werden alle übernommen.',
  'This file has more than one deck. Which one do you want to import?': 'Diese Datei enthält mehr als einen Stapel. Welchen möchtest du importieren?',
  'This file has no decks to import.': 'Diese Datei enthält keine importierbaren Stapel.',
  'Importing "{{name}}" ({{count}} cards).': 'Importiere „{{name}}" ({{count}} Karten).',
  "Don't touch the word already in your library.": 'Bereits in der Bibliothek vorhandenes Wort nicht verändern.',
  'Imported {{words}} words ({{cards}} cards).': '{{words}} Wörter importiert ({{cards}} Karten).',

  Vocabulary: 'Vokabeln', Cloze: 'Lückentext', '+ New': '+ Neu', Front: 'Vorderseite',
  'actual review card size on this device': 'tatsächliche Kartengröße auf diesem Gerät',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'Gerendert mit einem Beispiel-Lückentextsatz über dieselbe Engine, die auch die Wiederholungssitzung nutzt.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'Gerendert mit Beispieldaten ("ausgehen") über dieselbe Engine, die auch die Wiederholungssitzung nutzt.',
  'Template name': 'Vorlagenname', Fields: 'Felder',
  'Tap "Front" or "Back" to show a field on that side — a field can appear on both, or neither.':
    'Tippe auf „Vorderseite" oder „Rückseite", um ein Feld auf dieser Seite anzuzeigen — ein Feld kann auf beiden, auf keiner erscheinen.',
  'Layout & style': 'Layout & Stil', 'Reset to default': 'Auf Standard zurücksetzen', 'Accent color': 'Akzentfarbe',
  'Stored as a': 'Gespeichert als', 'rule — reference it in your CSS below as': 'Regel — referenziere sie in deinem CSS unten als',
  CSS: 'CSS', 'Applied to both sides in the real WebView renderer.': 'Wird auf beide Seiten im echten WebView-Renderer angewendet.',
  'Front (Liquid)': 'Vorderseite (Liquid)', 'Back (Liquid)': 'Rückseite (Liquid)',
  'Available template variables': 'Verfügbare Vorlagenvariablen', 'Conditional example': 'Bedingtes Beispiel',
  'Set default': 'Als Standard festlegen', 'Deleting…': 'Wird gelöscht…', 'Delete this template?': 'Diese Vorlage löschen?',
  '"{{name}}" will be removed.': '„{{name}}" wird entfernt.', 'Create template': 'Vorlage erstellen',
  'Template editor help': 'Hilfe zum Vorlagen-Editor', 'Fields tab': 'Reiter „Felder"', 'Style tab': 'Reiter „Stil"',
  'Preview tab': 'Reiter „Vorschau"', 'Code tab': 'Reiter „Code"',
  'HTML & CSS without extra elements': 'HTML & CSS ohne zusätzliche Elemente',
  'Could not save template': 'Vorlage konnte nicht gespeichert werden', 'Could not set default template': 'Standardvorlage konnte nicht festgelegt werden',
  'Could not delete template': 'Vorlage konnte nicht gelöscht werden', 'New template': 'Neue Vorlage',
  'Reset to default layout & style?': 'Auf Standardlayout & -stil zurücksetzen?',
  'This replaces the front, back, and CSS in the editor — tap "Save changes" to keep it. Unsaved edits are lost.':
    'Dies ersetzt Vorder-, Rückseite und CSS im Editor — tippe auf „Änderungen speichern", um es zu behalten. Ungespeicherte Änderungen gehen verloren.',
  Reset: 'Zurücksetzen',

  'Speaking rate': 'Sprechgeschwindigkeit', Pitch: 'Tonhöhe', Normal: 'Normal', 'Voice (German)': 'Stimme (Deutsch)',
  'No German voices are installed on this device.': 'Auf diesem Gerät sind keine deutschen Stimmen installiert.',
  'Device default': 'Gerätestandard', Enhanced: 'Erweitert',
  "Voices come from the device's own text-to-speech engine — install more from your phone's system settings if you don't see the one you want.":
    'Stimmen stammen von der eigenen Text-zu-Sprache-Engine des Geräts — installiere weitere über die Systemeinstellungen deines Telefons, falls die gewünschte fehlt.',
  'Playing…': 'Wird abgespielt…', Test: 'Testen',

  'Could not install this chunk': 'Dieser Abschnitt konnte nicht installiert werden', 'Could not remove this chunk': 'Dieser Abschnitt konnte nicht entfernt werden',
  'Word guides installed': 'Wortführer installiert', 'Installed {{count}} new chunks.': '{{count}} neue Abschnitte installiert.',
  'Could not install word guides': 'Wortführer konnten nicht installiert werden', 'German word guides': 'Deutsche Wortführer',
  'A free, pre-written dictionary — install to get instant word explanations without an AI key.':
    'Ein kostenloses, vorgefertigtes Wörterbuch — installiere es für sofortige Worterklärungen ohne KI-Schlüssel.',
  '{{words}} words planned, {{chunks}} chunks of ~100.': '{{words}} Wörter geplant, {{chunks}} Abschnitte à ~100.',
  '{{installed}} installed · {{available}} available to install · {{pending}} not generated yet':
    '{{installed}} installiert · {{available}} verfügbar zum Installieren · {{pending}} noch nicht erzeugt',
  'Install all available': 'Alle verfügbaren installieren', Chunks: 'Abschnitte',
  'Words {{start}}–{{end}}': 'Wörter {{start}}–{{end}}', '{{count}} words': '{{count}} Wörter', 'Not generated yet': 'Noch nicht erzeugt',
  'Uninstall all': 'Alle deinstallieren', 'Uninstalling…': 'Wird deinstalliert…',
  'Word guides uninstalled': 'Wortführer deinstalliert', 'Removed {{count}} chunks.': '{{count}} Abschnitte entfernt.',
  'Could not uninstall word guides': 'Wortführer konnten nicht deinstalliert werden',
  'Uninstall all word guides?': 'Alle Wortführer deinstallieren?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'Entfernt jeden installierten Abschnitt von diesem Gerät. Bereits zu deinem Stapel hinzugefügte Karten sind davon nicht betroffen.',
  'No translation to add.': 'Keine Übersetzung zum Hinzufügen.', 'No dictionary entry to add.': 'Kein Wörterbucheintrag zum Hinzufügen.',
  Details: 'Details', 'More info': 'Mehr Infos', 'Hide details': 'Details ausblenden',
  'Understanding the German {{wordClass}} "{{headword}}"': 'Das deutsche {{wordClass}} „{{headword}}" verstehen',
  Usage: 'Verwendung', 'Examples of Usage': 'Anwendungsbeispiele',
  Noun: 'Substantiv', Verb: 'Verb', Adjective: 'Adjektiv', Adverb: 'Adverb', Preposition: 'Präposition',
  Conjunction: 'Konjunktion', Pronoun: 'Pronomen', Article: 'Artikel', Phrase: 'Redewendung',

  Connected: 'Verbunden', 'No internet connection': 'Keine Internetverbindung', 'DeepL validation failed': 'DeepL-Überprüfung fehlgeschlagen',
  '{{provider}} validation failed': '{{provider}}-Überprüfung fehlgeschlagen',
  'Delete all API keys?': 'Alle API-Schlüssel löschen?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'Dies entfernt jeden Anbieter-Schlüssel von diesem Gerät. Vokabeln und Fortschritt sind davon nicht betroffen.',
  'Limited mode': 'Eingeschränkter Modus',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    'Ohne Generierungs-Schlüssel ist die Kartenerstellung mit KI deaktiviert. Übersetzung und manuelle Karten funktionieren weiterhin. Füge einem der Anbieter unten einen Schlüssel hinzu, um alle Funktionen zu nutzen.',
  "Couldn't load saved settings": 'Gespeicherte Einstellungen konnten nicht geladen werden',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key — nothing is sent until you generate a card.':
    'Die Kartenerstellung (Bedeutungen, Beispiele, Cluster, Redewendungen, Lückentext) nutzt den unten konfigurierten und aktivierten Anbieter. Bring deinen eigenen API-Schlüssel mit — es wird nichts gesendet, bevor du eine Karte erzeugst.',
  'Active provider': 'Aktiver Anbieter', Model: 'Modell', 'Paste your {{provider}} API key…': 'Füge deinen {{provider}}-API-Schlüssel ein…',
  'Hide {{provider}} API key': '{{provider}}-API-Schlüssel ausblenden', 'Show {{provider}} API key': '{{provider}}-API-Schlüssel anzeigen',
  'Validate key': 'Schlüssel prüfen', Clear: 'Leeren', 'Device-observed usage': 'Auf dem Gerät beobachtete Nutzung',
  '{{count}} requests': '{{count}} Anfragen', '{{count}} tokens': '{{count}} Tokens', 'Open {{provider}} usage ↗': '{{provider}}-Nutzung öffnen ↗',
  'Google Translate': 'Google Übersetzer', 'Free tier, no key needed': 'Kostenlose Stufe, kein Schlüssel nötig',
  'Uses this provider’s key above': 'Verwendet den obigen Schlüssel dieses Anbieters', 'Add a key above to enable': 'Füge oben einen Schlüssel hinzu, um zu aktivieren',
  Active: 'Aktiv', 'Best German↔English quality — bring your own key': 'Beste Deutsch↔Englisch-Qualität — eigenen Schlüssel mitbringen',
  'Hide DeepL settings': 'DeepL-Einstellungen ausblenden', 'Show DeepL settings': 'DeepL-Einstellungen anzeigen',
  'Paste your DeepL API key…': 'Füge deinen DeepL-API-Schlüssel ein…', Enabled: 'Aktiviert',
  'Open DeepL usage ↗': 'DeepL-Nutzung öffnen ↗', 'v0.0.1 · offline-first · your data stays on device': 'v0.0.1 · offline-first · deine Daten bleiben auf dem Gerät',

  'Opening your vocabulary…': 'Vokabeln werden geöffnet…', 'Import & Export': 'Import & Export', 'Import CSV': 'CSV importieren',
  'Import Anki deck': 'Anki-Stapel importieren', 'Card Templates': 'Kartenvorlagen',
}

const fr: Partial<Record<Phrase, string>> = {
  Home: 'Accueil', Search: 'Recherche', Decks: 'Paquets', Mine: 'À moi', Settings: 'Réglages',
  Cancel: 'Annuler', Save: 'Enregistrer', Delete: 'Supprimer', Edit: 'Modifier', Done: 'Terminé',
  Continue: 'Continuer', Back: 'Retour', Next: 'Suivant', Add: 'Ajouter', Import: 'Importer',
  Export: 'Exporter', Retry: 'Réessayer', Close: 'Fermer', Install: 'Installer',
  Uninstall: 'Désinstaller', Installed: 'Installé',
  Generation: 'Génération', Translation: 'Traduction', Learning: 'Apprentissage', Data: 'Données',
  Privacy: 'Confidentialité', About: 'À propos',
  'App Language': "Langue de l'application", 'Follow device': "Suivre la langue de l'appareil",
  'Default CEFR level': 'Niveau CECRL par défaut',
  'Examples and explanations are calibrated to this level.':
    'Les exemples et explications sont calibrés sur ce niveau.',
  'Import & export': 'Importer et exporter', 'Anki, CSV, JSON backup': 'Anki, CSV, sauvegarde JSON',
  'Card templates': 'Modèles de cartes', 'Customize card layouts': 'Personnaliser la mise en page des cartes',
  Pronunciation: 'Prononciation', 'Voice, rate, pitch': 'Voix, débit, tonalité',
  'Word guides': 'Guides de mots', 'Free starter dictionary — no AI key needed': "Dictionnaire de démarrage gratuit — aucune clé IA requise",
  'Delete all API keys': 'Supprimer toutes les clés API',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    "Les clés API restent sur cet appareil (Expo SecureStore) et ne sont jamais incluses dans les exports ou sauvegardes.",
  English: 'Anglais', German: 'Allemand', French: 'Français', Spanish: 'Espagnol', Hindi: 'Hindi',

  "Ready for today's session?": "Prêt pour la session du jour ?", '{{count}} days': '{{count}} jours',
  "Some data on this screen couldn't load.": "Certaines données de cet écran n'ont pas pu être chargées.",
  'cards due for review': 'cartes à réviser', 'Start review': 'Commencer la révision',
  'reviewed today': "révisées aujourd'hui", retention: 'rétention', 'total cards →': 'total des cartes →',
  'Quick actions': 'Actions rapides', 'Look up a word': 'Chercher un mot', 'Mining queue': 'File de minage',
  'Practice cloze': 'Pratiquer les lacunaires', Statistics: 'Statistiques',
  'Recently added': 'Ajoutés récemment', 'See all': 'Tout voir', 'No words yet': 'Aucun mot pour le moment',
  'Look up a word to add your first card.': 'Cherchez un mot pour ajouter votre première carte.',

  'Type a German or English word…': 'Tapez un mot allemand ou anglais…', 'Instant lookup': 'Recherche instantanée',
  'Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.':
    'Recherchez en allemand ("ausgeh…") ou en anglais ("go out").\nLes formes fléchies comme "ging aus" fonctionnent aussi.',
  '"{{term}}" is new': '« {{term}} » est nouveau',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    "Ce mot n'est pas encore dans votre bibliothèque. Générez des sens, exemples et synonymes avec l'IA.",
  'Translating…': 'Traduction…', 'Generating…': 'Génération…', 'Generate with AI': "Générer avec l'IA",
  'Add your OpenAI key in Settings to generate new words': 'Ajoutez votre clé OpenAI dans les réglages pour générer de nouveaux mots',
  'Generation came back incomplete': 'La génération est revenue incomplète',
  'From your installed dictionary — free, no AI needed.': 'Depuis votre dictionnaire installé — gratuit, aucune IA nécessaire.',
  'Nothing was saved — try again.': "Rien n'a été enregistré — réessayez.",

  'Give the deck a name.': 'Donnez un nom au paquet.', 'Could not delete deck': 'Impossible de supprimer le paquet',
  'Delete deck?': 'Supprimer le paquet ?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    "Les cartes présentes uniquement dans ce paquet sont supprimées avec lui. Les cartes présentes dans d'autres paquets restent en place.",
  'No deck selected.': 'Aucun paquet sélectionné.', 'Could not move deck': 'Impossible de déplacer le paquet',
  'Could not merge deck': 'Impossible de fusionner le paquet',
  'Merge into "{{name}}"?': 'Fusionner dans « {{name}} » ?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'Cela supprime « {{source}} » et déplace toutes ses cartes dans « {{target}} ». Cette action est irréversible.',
  'Export ready': 'Export prêt', 'Exported {{count}} cards.': '{{count}} cartes exportées.',
  'Saved to the folder you chose.': 'Enregistré dans le dossier choisi.', 'Choose where to save it.': "Choisissez où l'enregistrer.",
  'Export failed': "Échec de l'export", 'No decks yet': 'Aucun paquet pour le moment',
  'Create your first deck with the + button.': 'Créez votre premier paquet avec le bouton +.',
  'New deck': 'Nouveau paquet', 'Deck name': 'Nom du paquet', 'Emoji (optional)': 'Emoji (optionnel)',
  'Creating…': 'Création…', 'Create deck': 'Créer le paquet',
  'Import into this deck': 'Importer dans ce paquet', 'Export this deck': 'Exporter ce paquet',
  'Rename deck': 'Renommer le paquet', 'Move to…': 'Déplacer vers…', 'Merge into…': 'Fusionner dans…',
  'Delete deck': 'Supprimer le paquet', 'Top level (no parent)': 'Niveau supérieur (sans parent)',
  'No other deck to nest this one under.': "Aucun autre paquet sous lequel imbriquer celui-ci.",
  'No other deck to merge into.': 'Aucun autre paquet dans lequel fusionner.',
  'Import into "{{name}}"': 'Importer dans « {{name}} »', 'Export "{{name}}"': 'Exporter « {{name}} »',
  '{{due}} due/{{total}} cards': '{{due}} à réviser / {{total}} cartes', '{{count}} due': '{{count}} à réviser',
  Deck: 'Paquet', 'This deck no longer exists.': "Ce paquet n'existe plus.",
  cards: 'cartes', 'due now': 'à réviser maintenant', 'Review {{count}} due cards': 'Réviser {{count}} cartes dues',
  'Nothing due — study ahead': "Rien à réviser — étudier à l'avance", Cards: 'Cartes',
  'No cards yet — add words from Search.': 'Aucune carte pour le moment — ajoutez des mots depuis la recherche.',
  'Move "{{name}}" to…': 'Déplacer « {{name}} » vers…', 'Merge "{{name}}" into…': 'Fusionner « {{name}} » dans…',

  'Could not discard capture': "Impossible d'ignorer la capture", 'Could not save capture': "Impossible d'enregistrer la capture",
  'Clipboard is empty': 'Le presse-papiers est vide', 'Copy some text first, then paste it here.': "Copiez d'abord du texte, puis collez-le ici.",
  'Could not read clipboard': 'Impossible de lire le presse-papiers',
  'Add your OpenAI key in Settings to generate cards.': 'Ajoutez votre clé OpenAI dans les réglages pour générer des cartes.',
  'Add a sentence': 'Ajouter une phrase',
  'Paste or type a German sentence. It joins the queue below — nothing is sent to AI until you generate.':
    "Collez ou tapez une phrase en allemand. Elle rejoint la file ci-dessous — rien n'est envoyé à l'IA avant que vous ne générez.",
  'Paste from clipboard': 'Coller depuis le presse-papiers', 'Adding…': 'Ajout…', 'Add to queue': 'Ajouter à la file',
  'Queue is empty': 'La file est vide',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet — it lands here before any AI processing.':
    "Ajoutez une phrase manuellement, collez-en une depuis le presse-papiers, ou capturez du texte depuis le menu de partage — elle atterrit ici avant tout traitement par l'IA.",
  '{{done}} of {{total}} generated': '{{done}} sur {{total}} générées', '{{count}} failed': '{{count}} échouées',
  'see Decks.': 'voir Paquets.',
  "Review your captures. Discard what you don't need, then generate cards for the rest — no API call is wasted on text you didn't ask for.":
    "Passez en revue vos captures. Ignorez ce dont vous n'avez pas besoin, puis générez des cartes pour le reste — aucun appel API n'est gaspillé sur un texte non demandé.",
  'Generate {{count}} cards with AI': "Générer {{count}} cartes avec l'IA",
  'Add your OpenAI key to generate cards': 'Ajoutez votre clé OpenAI pour générer des cartes',

  'Add your OpenAI key in Settings to generate examples.': 'Ajoutez votre clé OpenAI dans les réglages pour générer des exemples.',
  'This word has no card yet.': "Ce mot n'a pas encore de carte.", 'Could not save your feedback': "Impossible d'enregistrer votre avis",
  'Could not save your report': "Impossible d'enregistrer votre signalement", 'Could not change the primary meaning': 'Impossible de changer le sens principal',
  'Could not update the flashcard example': "Impossible de mettre à jour l'exemple de la carte",
  'This word has no meaning yet.': "Ce mot n'a pas encore de sens.", 'Could not generate an explanation': 'Impossible de générer une explication',
  'AI not configured': 'IA non configurée',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'Ajoutez une clé OpenAI, Mistral, Gemini ou Claude dans les réglages pour générer une explication de ce sens.',
  'Could not look up an explanation': 'Impossible de rechercher une explication', 'Could not save your changes': 'Impossible d\'enregistrer vos modifications',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '« {{form}} » n\'est pas encore dans votre bibliothèque. Recherchez-le depuis l\'onglet Recherche pour le générer.',
  'No explanation yet.': 'Pas encore d\'explication.', 'Make primary: {{translation}}': 'Définir comme principal : {{translation}}',
  Examples: 'Exemples', 'shown on flashcard': 'affiché sur la carte', 'use on flashcard': 'utiliser sur la carte',
  'Advanced grammar options': 'Options de grammaire avancées', 'Active: {{selection}}': 'Actif : {{selection}}',
  'Generate examples': 'Générer des exemples',
  'Add your OpenAI key in Settings to generate targeted examples.': 'Ajoutez votre clé OpenAI dans les réglages pour générer des exemples ciblés.',
  Synonyms: 'Synonymes', 'Phrases & collocations': 'Expressions et collocations',
  'Cloze card': 'Carte lacunaire', 'Cloze cards': 'Cartes lacunaires',
  'Added ✓ — add to another deck': 'Ajouté ✓ — ajouter à un autre paquet', 'Add to deck': 'Ajouter au paquet',
  'Add "{{form}}" to…': 'Ajouter « {{form}} » à…',
  'Edit this card': 'Modifier cette carte', Meaning: 'Sens', 'Example sentence': "Phrase d'exemple",
  'Example translation': "Traduction de l'exemple", 'Save changes': 'Enregistrer les modifications',
  "What's wrong with this?": "Qu'est-ce qui ne va pas ?", 'Optional details…': 'Détails facultatifs…',
  'Send report': 'Envoyer le signalement', 'Sending…': 'Envoi…',
  'Inaccurate translation': 'Traduction inexacte', 'Unnatural phrasing': 'Formulation peu naturelle',
  'Wrong CEFR level': 'Niveau CECRL incorrect', 'Grammar error': 'Erreur de grammaire', Other: 'Autre',
  'Tense & mood': 'Temps et mode', 'Sentence structure': 'Structure de phrase', Conjunctions: 'Conjonctions', 'Focus words': "Mots d'insistance",

  GOOD: 'BIEN', AGAIN: 'ENCORE', EASY: 'FACILE', HARD: 'DIFFICILE',
  'No card to rate.': 'Aucune carte à évaluer.', 'Could not save your rating': 'Impossible d\'enregistrer votre évaluation',
  'No card to edit.': 'Aucune carte à modifier.',
  'Add your AI provider key in Settings to generate an explanation.': "Ajoutez votre clé de fournisseur d'IA dans les réglages pour générer une explication.",
  'Nothing due right now': 'Rien à réviser pour le moment', 'Session complete!': 'Session terminée !',
  'This deck has no cards due for review. Add words or check back later.':
    "Ce paquet n'a aucune carte à réviser. Ajoutez des mots ou revenez plus tard.",
  'You reviewed {{count}} cards. Great work — come back when the next cards are due.':
    'Vous avez révisé {{count}} cartes. Bravo — revenez quand les prochaines cartes seront dues.',
  'Back to deck': 'Retour au paquet', 'tap to reveal': 'toucher pour révéler', cloze: 'lacunaire',
  'Basic inline HTML works too — {{bold}}, {{italic}}, {{colored}}.':
    'Le HTML en ligne de base fonctionne aussi — {{bold}}, {{italic}}, {{colored}}.',

  'No stats yet': 'Aucune statistique pour le moment',
  'Add and review some words to see your learning statistics here.': 'Ajoutez et révisez des mots pour voir vos statistiques ici.',
  'retention (30 d)': 'rétention (30 j)', 'day streak': 'série de jours', 'total cards': 'total des cartes',
  'new this week': 'nouveaux cette semaine', 'Review activity': 'Activité de révision', less: 'moins', more: 'plus',
  'Vocabulary growth': 'Croissance du vocabulaire', 'new words per week': 'nouveaux mots par semaine',
  'Difficult words': 'Mots difficiles', 'No lapses yet — nothing difficult to show.': 'Aucun échec pour le moment — rien de difficile à montrer.',
  '{{count}} lapses': '{{count}} échecs',

  'Anki deck (.apkg)': 'Paquet Anki (.apkg)',
  "Bring your existing decks. Review history isn't imported — cards start fresh.":
    "Importez vos paquets existants. L'historique de révision n'est pas importé — les cartes repartent à zéro.",
  'Choose .apkg file': 'Choisir un fichier .apkg', 'CSV with column mapping': 'CSV avec mappage de colonnes',
  'From Quizlet, Memrise, or spreadsheets.': 'Depuis Quizlet, Memrise ou des feuilles de calcul.',
  'Choose CSV file': 'Choisir un fichier CSV', 'A shared deck (.lin)': 'Un paquet partagé (.lin)',
  "Add a deck someone shared with you — full fidelity, including review history. Doesn't touch anything else on this device.":
    "Ajoutez un paquet que quelqu'un a partagé avec vous — fidélité totale, y compris l'historique de révision. Ne touche à rien d'autre sur cet appareil.",
  'Choose .lin file': 'Choisir un fichier .lin', 'Restore from Lingora backup (.lin)': 'Restaurer depuis une sauvegarde Lingora (.lin)',
  'Replaces everything on this device with a previously exported backup.': 'Remplace tout sur cet appareil par une sauvegarde exportée précédemment.',
  'Restoring…': 'Restauration…', 'Choose backup file': 'Choisir un fichier de sauvegarde',
  'Lingora backup (.lin)': 'Sauvegarde Lingora (.lin)',
  'Your full library — decks, cards, review history. Your data is always yours. API keys are never included.':
    'Toute votre bibliothèque — paquets, cartes, historique de révision. Vos données vous appartiennent toujours. Les clés API ne sont jamais incluses.',
  'Export everything': 'Tout exporter', CSV: 'CSV',
  'One row per card — the same columns CSV import reads, so this file re-imports as-is.':
    "Une ligne par carte — les mêmes colonnes que celles lues par l'import CSV, donc ce fichier se réimporte tel quel.",
  'Export as CSV': 'Exporter en CSV',
  "Study your Lingora vocabulary in Anki/AnkiDroid. Cards start fresh — review history isn't carried over.":
    "Étudiez votre vocabulaire Lingora dans Anki/AnkiDroid. Les cartes repartent à zéro — l'historique de révision n'est pas transféré.",
  'Export as .apkg': 'Exporter en .apkg', Markdown: 'Markdown',
  'A readable word — meaning — example list. Not meant to re-import.': "Une liste lisible mot — sens — exemple. Pas destinée à être réimportée.",
  'Export as Markdown': 'Exporter en Markdown', 'Backup ready': 'Sauvegarde prête', 'Restore from backup?': 'Restaurer depuis la sauvegarde ?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'Cela remplace tout ce qui se trouve actuellement sur cet appareil par le contenu de « {{fileName}} » (exporté le {{date}}). Cette action est irréversible.',
  Restore: 'Restaurer', 'Restore complete': 'Restauration terminée', 'Restored {{count}} rows.': '{{count}} lignes restaurées.',
  'Restore failed': 'Échec de la restauration', 'Invalid backup file': 'Fichier de sauvegarde invalide',
  'Could not read file': 'Impossible de lire le fichier',

  Preview: 'Aperçu', 'Will import': 'Sera importé', Duplicates: 'Doublons', Errors: 'Erreurs', Selected: 'Sélectionné',
  'Import {{count}} rows': '{{count}} lignes importer', 'Import {{count}} words': 'Importer {{count}} mots',
  'Import from CSV': 'Importer depuis CSV',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    "Depuis Quizlet, Memrise ou un export de feuille de calcul. Vous choisirez ensuite ce que signifie chaque colonne.",
  '{{count}} rows detected. Map each column below.': '{{count}} lignes détectées. Mappez chaque colonne ci-dessous.',
  'Sample data': 'Exemple de données', 'The first few rows, so you can see what each column actually holds.':
    'Les premières lignes, pour que vous voyiez ce que chaque colonne contient réellement.',
  'Column {{n}}': 'Colonne {{n}}', 'Field mapping': 'Mappage des champs',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes — they're derived from the example's cloze markup and its translation.":
    "Tout est facultatif. Laissez Mot/Sens non mappés pour les notes de type lacunaire — ils sont déduits du balisage lacunaire de l'exemple et de sa traduction.",
  None: 'Aucun', 'Import into deck': 'Importer dans le paquet', '+ New deck': '+ Nouveau paquet',
  'If the word already exists': 'Si le mot existe déjà',
  'Applies to every duplicate row you leave checked in the next step.': "S'applique à chaque ligne en double laissée cochée à l'étape suivante.",
  'Checking…': 'Vérification…', 'Preview import': "Aperçu de l'import",
  'Importing…': 'Import…', 'Import complete': 'Import terminé', 'Imported {{count}} words.': '{{count}} mots importés.',
  Imported: 'Importés', Skipped: 'Ignorés', Failed: 'Échoués', 'Import another file': 'Importer un autre fichier',
  'Could not read this file': 'Impossible de lire ce fichier', 'Import failed': "Échec de l'import",
  'This file has no rows to import.': 'Ce fichier ne contient aucune ligne à importer.',
  Word: 'Mot', Example: 'Exemple', Status: 'Statut', Issues: 'Problèmes', Skip: 'Ignorer',
  "Don't touch the existing word.": 'Ne pas toucher au mot existant.', Merge: 'Fusionner',
  'Add this as another meaning on the existing card.': 'Ajouter ceci comme un autre sens sur la carte existante.',
  'Keep both': 'Garder les deux', 'Add a second, separate card for the same word.': 'Ajouter une deuxième carte distincte pour le même mot.',

  'Import from Anki': "Importer depuis Anki",
  "Choose a `.apkg` export. Review history isn't imported — every card starts fresh — and media (audio/images) is stripped rather than copied.":
    "Choisissez un export `.apkg`. L'historique de révision n'est pas importé — chaque carte repart à zéro — et les médias (audio/images) sont supprimés plutôt que copiés.",
  '{{notes}} notes across {{decks}} decks. Map each field below — it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{notes}} notes réparties sur {{decks}} paquets. Mappez chaque champ ci-dessous — cela s\'applique à chaque note, un type de note sans autant de champs laissera simplement le champ vide.',
  'The first few notes, so you can see what each field actually holds.': 'Les premières notes, pour que vous voyiez ce que chaque champ contient réellement.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes — they're derived from the example's cloze markup and its translation.":
    "Tout est facultatif. Laissez Mot/Sens non mappés pour les notes lacunaires — ils sont déduits du balisage lacunaire de l'exemple et de sa traduction.",
  'Field {{n}}': 'Champ {{n}}', 'This collection has no notes to import.': 'Cette collection ne contient aucune note à importer.',
  'Could not read this collection': 'Impossible de lire cette collection', '{{done}} of {{total}} notes': '{{done}} sur {{total}} notes',
  'Import canceled': 'Import annulé',
  'The rest were left untouched — you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    "Le reste a été laissé intact — vous pouvez réimporter le même fichier pour reprendre où vous en étiez (les mots déjà importés sont ignorés comme doublons).",
  Tags: 'Étiquettes',

  'Import from a .lin file': 'Importer depuis un fichier .lin',
  'Choose a Lingora `.lin` file — a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    "Choisissez un fichier Lingora `.lin` — un paquet que quelqu'un a partagé avec vous, ou l'un de vos propres exports de paquet. Fidélité totale : sens, exemples, synonymes, cartes lacunaires, historique de révision et planification FSRS sont tous transférés.",
  'This file has more than one deck. Which one do you want to import?': 'Ce fichier contient plusieurs paquets. Lequel voulez-vous importer ?',
  'This file has no decks to import.': 'Ce fichier ne contient aucun paquet à importer.',
  'Importing "{{name}}" ({{count}} cards).': 'Import de « {{name}} » ({{count}} cartes).',
  "Don't touch the word already in your library.": 'Ne pas toucher au mot déjà présent dans votre bibliothèque.',
  'Imported {{words}} words ({{cards}} cards).': '{{words}} mots importés ({{cards}} cartes).',

  Vocabulary: 'Vocabulaire', Cloze: 'Lacunaire', '+ New': '+ Nouveau', Front: 'Recto',
  'actual review card size on this device': 'taille réelle de la carte de révision sur cet appareil',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'Rendu avec une phrase lacunaire d\'exemple via le même moteur que la session de révision.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'Rendu avec des données d\'exemple ("ausgehen") via le même moteur que la session de révision.',
  'Template name': 'Nom du modèle', Fields: 'Champs',
  'Tap "Front" or "Back" to show a field on that side — a field can appear on both, or neither.':
    'Touchez « Recto » ou « Verso » pour afficher un champ de ce côté — un champ peut apparaître des deux côtés, ou d\'aucun.',
  'Layout & style': 'Mise en page et style', 'Reset to default': 'Réinitialiser par défaut', 'Accent color': "Couleur d'accent",
  'Stored as a': 'Enregistré comme une', 'rule — reference it in your CSS below as': 'règle — référencez-la dans votre CSS ci-dessous comme',
  CSS: 'CSS', 'Applied to both sides in the real WebView renderer.': 'Appliqué aux deux côtés dans le vrai moteur de rendu WebView.',
  'Front (Liquid)': 'Recto (Liquid)', 'Back (Liquid)': 'Verso (Liquid)',
  'Available template variables': 'Variables de modèle disponibles', 'Conditional example': 'Exemple conditionnel',
  'Set default': 'Définir par défaut', 'Deleting…': 'Suppression…', 'Delete this template?': 'Supprimer ce modèle ?',
  '"{{name}}" will be removed.': '« {{name}} » sera supprimé.', 'Create template': 'Créer le modèle',
  'Template editor help': "Aide de l'éditeur de modèles", 'Fields tab': 'Onglet Champs', 'Style tab': 'Onglet Style',
  'Preview tab': 'Onglet Aperçu', 'Code tab': 'Onglet Code',
  'HTML & CSS without extra elements': 'HTML et CSS sans éléments supplémentaires',
  'Could not save template': 'Impossible d\'enregistrer le modèle', 'Could not set default template': 'Impossible de définir le modèle par défaut',
  'Could not delete template': 'Impossible de supprimer le modèle', 'New template': 'Nouveau modèle',
  'Reset to default layout & style?': 'Réinitialiser la mise en page et le style par défaut ?',
  'This replaces the front, back, and CSS in the editor — tap "Save changes" to keep it. Unsaved edits are lost.':
    'Cela remplace le recto, le verso et le CSS dans l\'éditeur — touchez « Enregistrer les modifications » pour le conserver. Les modifications non enregistrées sont perdues.',
  Reset: 'Réinitialiser',

  'Speaking rate': 'Débit de parole', Pitch: 'Tonalité', Normal: 'Normal', 'Voice (German)': 'Voix (allemand)',
  'No German voices are installed on this device.': "Aucune voix allemande n'est installée sur cet appareil.",
  'Device default': "Par défaut de l'appareil", Enhanced: 'Améliorée',
  "Voices come from the device's own text-to-speech engine — install more from your phone's system settings if you don't see the one you want.":
    "Les voix proviennent du moteur de synthèse vocale de l'appareil — installez-en d'autres depuis les réglages système de votre téléphone si celle que vous voulez n'apparaît pas.",
  'Playing…': 'Lecture…', Test: 'Tester',

  'Could not install this chunk': 'Impossible d\'installer ce segment', 'Could not remove this chunk': 'Impossible de supprimer ce segment',
  'Word guides installed': 'Guides de mots installés', 'Installed {{count}} new chunks.': '{{count}} nouveaux segments installés.',
  'Could not install word guides': "Impossible d'installer les guides de mots", 'German word guides': 'Guides de mots allemands',
  'A free, pre-written dictionary — install to get instant word explanations without an AI key.':
    "Un dictionnaire gratuit pré-rédigé — installez-le pour obtenir des explications de mots instantanées sans clé IA.",
  '{{words}} words planned, {{chunks}} chunks of ~100.': '{{words}} mots prévus, {{chunks}} segments d\'environ 100.',
  '{{installed}} installed · {{available}} available to install · {{pending}} not generated yet':
    '{{installed}} installés · {{available}} disponibles à installer · {{pending}} pas encore générés',
  'Install all available': 'Installer tout ce qui est disponible', Chunks: 'Segments',
  'Words {{start}}–{{end}}': 'Mots {{start}}–{{end}}', '{{count}} words': '{{count}} mots', 'Not generated yet': 'Pas encore généré',
  'Uninstall all': 'Tout désinstaller', 'Uninstalling…': 'Désinstallation…',
  'Word guides uninstalled': 'Guides de mots désinstallés', 'Removed {{count}} chunks.': '{{count}} segments supprimés.',
  'Could not uninstall word guides': "Impossible de désinstaller les guides de mots",
  'Uninstall all word guides?': 'Désinstaller tous les guides de mots ?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    "Supprime chaque segment installé de cet appareil. Les cartes déjà ajoutées à votre paquet ne sont pas affectées.",
  'No translation to add.': 'Aucune traduction à ajouter.', 'No dictionary entry to add.': 'Aucune entrée de dictionnaire à ajouter.',
  Details: 'Détails', 'More info': "Plus d'infos", 'Hide details': 'Masquer les détails',
  'Understanding the German {{wordClass}} "{{headword}}"': 'Comprendre le {{wordClass}} allemand « {{headword}} »',
  Usage: 'Usage', 'Examples of Usage': "Exemples d'usage",
  Noun: 'Nom', Verb: 'Verbe', Adjective: 'Adjectif', Adverb: 'Adverbe', Preposition: 'Préposition',
  Conjunction: 'Conjonction', Pronoun: 'Pronom', Article: 'Article', Phrase: 'Expression',

  Connected: 'Connecté', 'No internet connection': 'Pas de connexion Internet', 'DeepL validation failed': 'Échec de la vérification DeepL',
  '{{provider}} validation failed': 'Échec de la vérification {{provider}}',
  'Delete all API keys?': 'Supprimer toutes les clés API ?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    "Cela supprime toutes les clés de fournisseur de cet appareil. Le vocabulaire et la progression ne sont pas affectés.",
  'Limited mode': 'Mode limité',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    "Sans clé de génération, la création de cartes avec l'IA est désactivée. La traduction et les cartes manuelles fonctionnent toujours. Ajoutez une clé à l'un des fournisseurs ci-dessous pour l'expérience complète.",
  "Couldn't load saved settings": "Impossible de charger les réglages enregistrés",
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key — nothing is sent until you generate a card.':
    "La génération de cartes (sens, exemples, groupes, expressions, lacunaires) utilise le fournisseur ci-dessous configuré et activé. Apportez votre propre clé API — rien n'est envoyé avant que vous ne génériez une carte.",
  'Active provider': 'Fournisseur actif', Model: 'Modèle', 'Paste your {{provider}} API key…': 'Collez votre clé API {{provider}}…',
  'Hide {{provider}} API key': 'Masquer la clé API {{provider}}', 'Show {{provider}} API key': 'Afficher la clé API {{provider}}',
  'Validate key': 'Vérifier la clé', Clear: 'Effacer', 'Device-observed usage': "Utilisation observée sur l'appareil",
  '{{count}} requests': '{{count}} requêtes', '{{count}} tokens': '{{count}} jetons', 'Open {{provider}} usage ↗': 'Ouvrir l\'utilisation {{provider}} ↗',
  'Google Translate': 'Google Traduction', 'Free tier, no key needed': 'Niveau gratuit, aucune clé requise',
  'Uses this provider’s key above': 'Utilise la clé de ce fournisseur ci-dessus', 'Add a key above to enable': 'Ajoutez une clé ci-dessus pour activer',
  Active: 'Actif', 'Best German↔English quality — bring your own key': 'Meilleure qualité allemand↔anglais — apportez votre propre clé',
  'Hide DeepL settings': 'Masquer les réglages DeepL', 'Show DeepL settings': 'Afficher les réglages DeepL',
  'Paste your DeepL API key…': 'Collez votre clé API DeepL…', Enabled: 'Activé',
  'Open DeepL usage ↗': 'Ouvrir l\'utilisation DeepL ↗', 'v0.0.1 · offline-first · your data stays on device': 'v0.0.1 · hors ligne par défaut · vos données restent sur l\'appareil',

  'Opening your vocabulary…': 'Ouverture de votre vocabulaire…', 'Import & Export': 'Import et export', 'Import CSV': 'Importer un CSV',
  'Import Anki deck': 'Importer un paquet Anki', 'Card Templates': 'Modèles de cartes',
}

const es: Partial<Record<Phrase, string>> = {
  Home: 'Inicio', Search: 'Buscar', Decks: 'Mazos', Mine: 'Mío', Settings: 'Ajustes',
  Cancel: 'Cancelar', Save: 'Guardar', Delete: 'Eliminar', Edit: 'Editar', Done: 'Hecho',
  Continue: 'Continuar', Back: 'Atrás', Next: 'Siguiente', Add: 'Añadir', Import: 'Importar',
  Export: 'Exportar', Retry: 'Reintentar', Close: 'Cerrar', Install: 'Instalar',
  Uninstall: 'Desinstalar', Installed: 'Instalado',
  Generation: 'Generación', Translation: 'Traducción', Learning: 'Aprendizaje', Data: 'Datos',
  Privacy: 'Privacidad', About: 'Acerca de',
  'App Language': 'Idioma de la aplicación', 'Follow device': 'Seguir el idioma del dispositivo',
  'Default CEFR level': 'Nivel MCER predeterminado',
  'Examples and explanations are calibrated to this level.':
    'Los ejemplos y explicaciones están calibrados para este nivel.',
  'Import & export': 'Importar y exportar', 'Anki, CSV, JSON backup': 'Anki, CSV, copia de seguridad JSON',
  'Card templates': 'Plantillas de tarjetas', 'Customize card layouts': 'Personalizar el diseño de las tarjetas',
  Pronunciation: 'Pronunciación', 'Voice, rate, pitch': 'Voz, velocidad, tono',
  'Word guides': 'Guías de palabras', 'Free starter dictionary — no AI key needed': 'Diccionario inicial gratuito — no requiere clave de IA',
  'Delete all API keys': 'Eliminar todas las claves API',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'Las claves API permanecen en este dispositivo (Expo SecureStore) y nunca se incluyen en exportaciones o copias de seguridad.',
  English: 'Inglés', German: 'Alemán', French: 'Francés', Spanish: 'Español', Hindi: 'Hindi',

  "Ready for today's session?": '¿Listo para la sesión de hoy?', '{{count}} days': '{{count}} días',
  "Some data on this screen couldn't load.": 'Algunos datos de esta pantalla no se pudieron cargar.',
  'cards due for review': 'tarjetas pendientes de repaso', 'Start review': 'Iniciar repaso',
  'reviewed today': 'repasadas hoy', retention: 'retención', 'total cards →': 'tarjetas totales →',
  'Quick actions': 'Acciones rápidas', 'Look up a word': 'Buscar una palabra', 'Mining queue': 'Cola de minería',
  'Practice cloze': 'Practicar huecos', Statistics: 'Estadísticas',
  'Recently added': 'Añadidas recientemente', 'See all': 'Ver todo', 'No words yet': 'Aún no hay palabras',
  'Look up a word to add your first card.': 'Busca una palabra para añadir tu primera tarjeta.',

  'Type a German or English word…': 'Escribe una palabra en alemán o inglés…', 'Instant lookup': 'Búsqueda instantánea',
  'Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.':
    'Busca en alemán ("ausgeh…") o en inglés ("go out").\nLas formas flexionadas como "ging aus" también funcionan.',
  '"{{term}}" is new': '"{{term}}" es nuevo',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    'Esta palabra aún no está en tu biblioteca. Genera significados, ejemplos y sinónimos con IA.',
  'Translating…': 'Traduciendo…', 'Generating…': 'Generando…', 'Generate with AI': 'Generar con IA',
  'Add your OpenAI key in Settings to generate new words': 'Añade tu clave de OpenAI en Ajustes para generar nuevas palabras',
  'Generation came back incomplete': 'La generación volvió incompleta',
  'From your installed dictionary — free, no AI needed.': 'De tu diccionario instalado — gratis, sin necesidad de IA.',
  'Nothing was saved — try again.': 'No se guardó nada — inténtalo de nuevo.',

  'Give the deck a name.': 'Ponle un nombre al mazo.', 'Could not delete deck': 'No se pudo eliminar el mazo',
  'Delete deck?': '¿Eliminar el mazo?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    'Las tarjetas que solo están en este mazo se eliminan con él. Las tarjetas en otros mazos permanecen allí.',
  'No deck selected.': 'Ningún mazo seleccionado.', 'Could not move deck': 'No se pudo mover el mazo',
  'Could not merge deck': 'No se pudo fusionar el mazo',
  'Merge into "{{name}}"?': '¿Fusionar en "{{name}}"?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'Esto elimina "{{source}}" y mueve todas sus tarjetas a "{{target}}". Esta acción no se puede deshacer.',
  'Export ready': 'Exportación lista', 'Exported {{count}} cards.': '{{count}} tarjetas exportadas.',
  'Saved to the folder you chose.': 'Guardado en la carpeta elegida.', 'Choose where to save it.': 'Elige dónde guardarlo.',
  'Export failed': 'Error al exportar', 'No decks yet': 'Aún no hay mazos',
  'Create your first deck with the + button.': 'Crea tu primer mazo con el botón +.',
  'New deck': 'Nuevo mazo', 'Deck name': 'Nombre del mazo', 'Emoji (optional)': 'Emoji (opcional)',
  'Creating…': 'Creando…', 'Create deck': 'Crear mazo',
  'Import into this deck': 'Importar a este mazo', 'Export this deck': 'Exportar este mazo',
  'Rename deck': 'Renombrar mazo', 'Move to…': 'Mover a…', 'Merge into…': 'Fusionar en…',
  'Delete deck': 'Eliminar mazo', 'Top level (no parent)': 'Nivel superior (sin mazo padre)',
  'No other deck to nest this one under.': 'No hay otro mazo bajo el cual anidar este.',
  'No other deck to merge into.': 'No hay otro mazo con el que fusionar.',
  'Import into "{{name}}"': 'Importar a "{{name}}"', 'Export "{{name}}"': 'Exportar "{{name}}"',
  '{{due}} due/{{total}} cards': '{{due}} pendientes/{{total}} tarjetas', '{{count}} due': '{{count}} pendientes',
  Deck: 'Mazo', 'This deck no longer exists.': 'Este mazo ya no existe.',
  cards: 'tarjetas', 'due now': 'pendientes ahora', 'Review {{count}} due cards': 'Repasar {{count}} tarjetas pendientes',
  'Nothing due — study ahead': 'Nada pendiente — estudiar por adelantado', Cards: 'Tarjetas',
  'No cards yet — add words from Search.': 'Aún no hay tarjetas — añade palabras desde Buscar.',
  'Move "{{name}}" to…': 'Mover "{{name}}" a…', 'Merge "{{name}}" into…': 'Fusionar "{{name}}" en…',

  'Could not discard capture': 'No se pudo descartar la captura', 'Could not save capture': 'No se pudo guardar la captura',
  'Clipboard is empty': 'El portapapeles está vacío', 'Copy some text first, then paste it here.': 'Copia algún texto primero y luego pégalo aquí.',
  'Could not read clipboard': 'No se pudo leer el portapapeles',
  'Add your OpenAI key in Settings to generate cards.': 'Añade tu clave de OpenAI en Ajustes para generar tarjetas.',
  'Add a sentence': 'Añadir una frase',
  'Paste or type a German sentence. It joins the queue below — nothing is sent to AI until you generate.':
    'Pega o escribe una frase en alemán. Se une a la cola de abajo — nada se envía a la IA hasta que generes.',
  'Paste from clipboard': 'Pegar desde el portapapeles', 'Adding…': 'Añadiendo…', 'Add to queue': 'Añadir a la cola',
  'Queue is empty': 'La cola está vacía',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet — it lands here before any AI processing.':
    'Añade una frase manualmente, pega una desde el portapapeles o captura texto desde el menú compartir — llega aquí antes de cualquier procesamiento por IA.',
  '{{done}} of {{total}} generated': '{{done}} de {{total}} generadas', '{{count}} failed': '{{count}} fallidas',
  'see Decks.': 'ver Mazos.',
  "Review your captures. Discard what you don't need, then generate cards for the rest — no API call is wasted on text you didn't ask for.":
    'Revisa tus capturas. Descarta lo que no necesites y luego genera tarjetas para el resto — ninguna llamada a la API se desperdicia en texto que no pediste.',
  'Generate {{count}} cards with AI': 'Generar {{count}} tarjetas con IA',
  'Add your OpenAI key to generate cards': 'Añade tu clave de OpenAI para generar tarjetas',

  'Add your OpenAI key in Settings to generate examples.': 'Añade tu clave de OpenAI en Ajustes para generar ejemplos.',
  'This word has no card yet.': 'Esta palabra aún no tiene tarjeta.', 'Could not save your feedback': 'No se pudo guardar tu valoración',
  'Could not save your report': 'No se pudo guardar tu informe', 'Could not change the primary meaning': 'No se pudo cambiar el significado principal',
  'Could not update the flashcard example': 'No se pudo actualizar el ejemplo de la tarjeta',
  'This word has no meaning yet.': 'Esta palabra aún no tiene significado.', 'Could not generate an explanation': 'No se pudo generar una explicación',
  'AI not configured': 'IA no configurada',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'Añade una clave de OpenAI, Mistral, Gemini o Claude en Ajustes para generar una explicación de este significado.',
  'Could not look up an explanation': 'No se pudo buscar una explicación', 'Could not save your changes': 'No se pudieron guardar tus cambios',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '"{{form}}" aún no está en tu biblioteca. Búscala desde la pestaña Buscar para generarla.',
  'No explanation yet.': 'Aún no hay explicación.', 'Make primary: {{translation}}': 'Establecer como principal: {{translation}}',
  Examples: 'Ejemplos', 'shown on flashcard': 'mostrado en la tarjeta', 'use on flashcard': 'usar en la tarjeta',
  'Advanced grammar options': 'Opciones avanzadas de gramática', 'Active: {{selection}}': 'Activo: {{selection}}',
  'Generate examples': 'Generar ejemplos',
  'Add your OpenAI key in Settings to generate targeted examples.': 'Añade tu clave de OpenAI en Ajustes para generar ejemplos específicos.',
  Synonyms: 'Sinónimos', 'Phrases & collocations': 'Frases y colocaciones',
  'Cloze card': 'Tarjeta de huecos', 'Cloze cards': 'Tarjetas de huecos',
  'Added ✓ — add to another deck': 'Añadido ✓ — añadir a otro mazo', 'Add to deck': 'Añadir al mazo',
  'Add "{{form}}" to…': 'Añadir "{{form}}" a…',
  'Edit this card': 'Editar esta tarjeta', Meaning: 'Significado', 'Example sentence': 'Frase de ejemplo',
  'Example translation': 'Traducción del ejemplo', 'Save changes': 'Guardar cambios',
  "What's wrong with this?": '¿Qué está mal aquí?', 'Optional details…': 'Detalles opcionales…',
  'Send report': 'Enviar informe', 'Sending…': 'Enviando…',
  'Inaccurate translation': 'Traducción inexacta', 'Unnatural phrasing': 'Frase poco natural',
  'Wrong CEFR level': 'Nivel MCER incorrecto', 'Grammar error': 'Error gramatical', Other: 'Otro',
  'Tense & mood': 'Tiempo y modo', 'Sentence structure': 'Estructura de la frase', Conjunctions: 'Conjunciones', 'Focus words': 'Palabras de énfasis',

  GOOD: 'BIEN', AGAIN: 'OTRA VEZ', EASY: 'FÁCIL', HARD: 'DIFÍCIL',
  'No card to rate.': 'No hay tarjeta que calificar.', 'Could not save your rating': 'No se pudo guardar tu calificación',
  'No card to edit.': 'No hay tarjeta que editar.',
  'Add your AI provider key in Settings to generate an explanation.': 'Añade tu clave de proveedor de IA en Ajustes para generar una explicación.',
  'Nothing due right now': 'Nada pendiente ahora mismo', 'Session complete!': '¡Sesión completada!',
  'This deck has no cards due for review. Add words or check back later.':
    'Este mazo no tiene tarjetas pendientes de repaso. Añade palabras o vuelve más tarde.',
  'You reviewed {{count}} cards. Great work — come back when the next cards are due.':
    'Has repasado {{count}} tarjetas. Buen trabajo — vuelve cuando las próximas tarjetas venzan.',
  'Back to deck': 'Volver al mazo', 'tap to reveal': 'toca para revelar', cloze: 'huecos',
  'Basic inline HTML works too — {{bold}}, {{italic}}, {{colored}}.':
    'El HTML en línea básico también funciona — {{bold}}, {{italic}}, {{colored}}.',

  'No stats yet': 'Aún no hay estadísticas',
  'Add and review some words to see your learning statistics here.': 'Añade y repasa algunas palabras para ver aquí tus estadísticas de aprendizaje.',
  'retention (30 d)': 'retención (30 d)', 'day streak': 'racha de días', 'total cards': 'tarjetas totales',
  'new this week': 'nuevas esta semana', 'Review activity': 'Actividad de repaso', less: 'menos', more: 'más',
  'Vocabulary growth': 'Crecimiento de vocabulario', 'new words per week': 'palabras nuevas por semana',
  'Difficult words': 'Palabras difíciles', 'No lapses yet — nothing difficult to show.': 'Aún no hay fallos — nada difícil que mostrar.',
  '{{count}} lapses': '{{count}} fallos',

  'Anki deck (.apkg)': 'Mazo de Anki (.apkg)',
  "Bring your existing decks. Review history isn't imported — cards start fresh.":
    'Trae tus mazos existentes. El historial de repaso no se importa — las tarjetas empiezan de cero.',
  'Choose .apkg file': 'Elegir archivo .apkg', 'CSV with column mapping': 'CSV con asignación de columnas',
  'From Quizlet, Memrise, or spreadsheets.': 'Desde Quizlet, Memrise u hojas de cálculo.',
  'Choose CSV file': 'Elegir archivo CSV', 'A shared deck (.lin)': 'Un mazo compartido (.lin)',
  "Add a deck someone shared with you — full fidelity, including review history. Doesn't touch anything else on this device.":
    'Añade un mazo que alguien compartió contigo — fidelidad total, incluido el historial de repaso. No afecta nada más en este dispositivo.',
  'Choose .lin file': 'Elegir archivo .lin', 'Restore from Lingora backup (.lin)': 'Restaurar desde una copia de seguridad de Lingora (.lin)',
  'Replaces everything on this device with a previously exported backup.': 'Reemplaza todo en este dispositivo con una copia de seguridad exportada previamente.',
  'Restoring…': 'Restaurando…', 'Choose backup file': 'Elegir archivo de copia de seguridad',
  'Lingora backup (.lin)': 'Copia de seguridad de Lingora (.lin)',
  'Your full library — decks, cards, review history. Your data is always yours. API keys are never included.':
    'Toda tu biblioteca — mazos, tarjetas, historial de repaso. Tus datos siempre son tuyos. Las claves API nunca se incluyen.',
  'Export everything': 'Exportar todo', CSV: 'CSV',
  'One row per card — the same columns CSV import reads, so this file re-imports as-is.':
    'Una fila por tarjeta — las mismas columnas que lee la importación CSV, así que este archivo se reimporta tal cual.',
  'Export as CSV': 'Exportar como CSV',
  "Study your Lingora vocabulary in Anki/AnkiDroid. Cards start fresh — review history isn't carried over.":
    'Estudia tu vocabulario de Lingora en Anki/AnkiDroid. Las tarjetas empiezan de cero — el historial de repaso no se transfiere.',
  'Export as .apkg': 'Exportar como .apkg', Markdown: 'Markdown',
  'A readable word — meaning — example list. Not meant to re-import.': 'Una lista legible de palabra — significado — ejemplo. No pensada para reimportarse.',
  'Export as Markdown': 'Exportar como Markdown', 'Backup ready': 'Copia de seguridad lista', 'Restore from backup?': '¿Restaurar desde la copia de seguridad?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'Esto reemplaza todo lo que hay actualmente en este dispositivo con el contenido de "{{fileName}}" (exportado el {{date}}). Esta acción no se puede deshacer.',
  Restore: 'Restaurar', 'Restore complete': 'Restauración completada', 'Restored {{count}} rows.': '{{count}} filas restauradas.',
  'Restore failed': 'Error al restaurar', 'Invalid backup file': 'Archivo de copia de seguridad no válido',
  'Could not read file': 'No se pudo leer el archivo',

  Preview: 'Vista previa', 'Will import': 'Se importará', Duplicates: 'Duplicados', Errors: 'Errores', Selected: 'Seleccionadas',
  'Import {{count}} rows': 'Importar {{count}} filas', 'Import {{count}} words': 'Importar {{count}} palabras',
  'Import from CSV': 'Importar desde CSV',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Desde Quizlet, Memrise o una exportación de hoja de cálculo. A continuación elegirás qué significa cada columna.',
  '{{count}} rows detected. Map each column below.': '{{count}} filas detectadas. Asigna cada columna abajo.',
  'Sample data': 'Datos de ejemplo', 'The first few rows, so you can see what each column actually holds.':
    'Las primeras filas, para que veas qué contiene realmente cada columna.',
  'Column {{n}}': 'Columna {{n}}', 'Field mapping': 'Asignación de campos',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes — they're derived from the example's cloze markup and its translation.":
    'Todo es opcional. Deja Palabra/Significado sin asignar para notas tipo hueco — se derivan del marcado de huecos del ejemplo y su traducción.',
  None: 'Ninguna', 'Import into deck': 'Importar al mazo', '+ New deck': '+ Nuevo mazo',
  'If the word already exists': 'Si la palabra ya existe',
  'Applies to every duplicate row you leave checked in the next step.': 'Se aplica a cada fila duplicada que dejes marcada en el siguiente paso.',
  'Checking…': 'Comprobando…', 'Preview import': 'Vista previa de importación',
  'Importing…': 'Importando…', 'Import complete': 'Importación completada', 'Imported {{count}} words.': '{{count}} palabras importadas.',
  Imported: 'Importadas', Skipped: 'Omitidas', Failed: 'Fallidas', 'Import another file': 'Importar otro archivo',
  'Could not read this file': 'No se pudo leer este archivo', 'Import failed': 'Error al importar',
  'This file has no rows to import.': 'Este archivo no tiene filas para importar.',
  Word: 'Palabra', Example: 'Ejemplo', Status: 'Estado', Issues: 'Problemas', Skip: 'Omitir',
  "Don't touch the existing word.": 'No tocar la palabra existente.', Merge: 'Fusionar',
  'Add this as another meaning on the existing card.': 'Añadir esto como otro significado en la tarjeta existente.',
  'Keep both': 'Mantener ambas', 'Add a second, separate card for the same word.': 'Añadir una segunda tarjeta separada para la misma palabra.',

  'Import from Anki': 'Importar desde Anki',
  "Choose a `.apkg` export. Review history isn't imported — every card starts fresh — and media (audio/images) is stripped rather than copied.":
    'Elige una exportación `.apkg`. El historial de repaso no se importa — cada tarjeta empieza de cero — y los medios (audio/imágenes) se eliminan en lugar de copiarse.',
  '{{notes}} notes across {{decks}} decks. Map each field below — it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{notes}} notas en {{decks}} mazos. Asigna cada campo abajo — se aplica a cada nota, un tipo de nota sin tantos campos simplemente lo deja vacío.',
  'The first few notes, so you can see what each field actually holds.': 'Las primeras notas, para que veas qué contiene realmente cada campo.',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes — they're derived from the example's cloze markup and its translation.":
    'Todo es opcional. Deja Palabra/Significado sin asignar para notas de huecos — se derivan del marcado de huecos del ejemplo y su traducción.',
  'Field {{n}}': 'Campo {{n}}', 'This collection has no notes to import.': 'Esta colección no tiene notas para importar.',
  'Could not read this collection': 'No se pudo leer esta colección', '{{done}} of {{total}} notes': '{{done}} de {{total}} notas',
  'Import canceled': 'Importación cancelada',
  'The rest were left untouched — you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'El resto se dejó sin cambios — puedes volver a importar el mismo archivo para continuar donde lo dejaste (las palabras ya importadas se omiten como duplicados).',
  Tags: 'Etiquetas',

  'Import from a .lin file': 'Importar desde un archivo .lin',
  'Choose a Lingora `.lin` file — a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    'Elige un archivo Lingora `.lin` — un mazo que alguien compartió contigo, o una de tus propias exportaciones de mazo. Fidelidad total: significados, ejemplos, sinónimos, tarjetas de huecos, historial de repaso y programación FSRS se transfieren todos.',
  'This file has more than one deck. Which one do you want to import?': 'Este archivo tiene más de un mazo. ¿Cuál quieres importar?',
  'This file has no decks to import.': 'Este archivo no tiene mazos para importar.',
  'Importing "{{name}}" ({{count}} cards).': 'Importando "{{name}}" ({{count}} tarjetas).',
  "Don't touch the word already in your library.": 'No tocar la palabra ya presente en tu biblioteca.',
  'Imported {{words}} words ({{cards}} cards).': '{{words}} palabras importadas ({{cards}} tarjetas).',

  Vocabulary: 'Vocabulario', Cloze: 'Huecos', '+ New': '+ Nuevo', Front: 'Anverso',
  'actual review card size on this device': 'tamaño real de la tarjeta de repaso en este dispositivo',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'Renderizado con una frase de huecos de ejemplo mediante el mismo motor que usa la sesión de repaso.',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'Renderizado con datos de ejemplo ("ausgehen") mediante el mismo motor que usa la sesión de repaso.',
  'Template name': 'Nombre de la plantilla', Fields: 'Campos',
  'Tap "Front" or "Back" to show a field on that side — a field can appear on both, or neither.':
    'Toca "Anverso" o "Reverso" para mostrar un campo en ese lado — un campo puede aparecer en ambos, o en ninguno.',
  'Layout & style': 'Diseño y estilo', 'Reset to default': 'Restablecer por defecto', 'Accent color': 'Color de acento',
  'Stored as a': 'Guardado como una', 'rule — reference it in your CSS below as': 'regla — referénciala en tu CSS abajo como',
  CSS: 'CSS', 'Applied to both sides in the real WebView renderer.': 'Aplicado a ambos lados en el renderizador WebView real.',
  'Front (Liquid)': 'Anverso (Liquid)', 'Back (Liquid)': 'Reverso (Liquid)',
  'Available template variables': 'Variables de plantilla disponibles', 'Conditional example': 'Ejemplo condicional',
  'Set default': 'Establecer por defecto', 'Deleting…': 'Eliminando…', 'Delete this template?': '¿Eliminar esta plantilla?',
  '"{{name}}" will be removed.': '"{{name}}" se eliminará.', 'Create template': 'Crear plantilla',
  'Template editor help': 'Ayuda del editor de plantillas', 'Fields tab': 'Pestaña Campos', 'Style tab': 'Pestaña Estilo',
  'Preview tab': 'Pestaña Vista previa', 'Code tab': 'Pestaña Código',
  'HTML & CSS without extra elements': 'HTML y CSS sin elementos adicionales',
  'Could not save template': 'No se pudo guardar la plantilla', 'Could not set default template': 'No se pudo establecer la plantilla por defecto',
  'Could not delete template': 'No se pudo eliminar la plantilla', 'New template': 'Nueva plantilla',
  'Reset to default layout & style?': '¿Restablecer diseño y estilo por defecto?',
  'This replaces the front, back, and CSS in the editor — tap "Save changes" to keep it. Unsaved edits are lost.':
    'Esto reemplaza el anverso, el reverso y el CSS en el editor — toca "Guardar cambios" para conservarlo. Las ediciones no guardadas se pierden.',
  Reset: 'Restablecer',

  'Speaking rate': 'Velocidad de habla', Pitch: 'Tono', Normal: 'Normal', 'Voice (German)': 'Voz (alemán)',
  'No German voices are installed on this device.': 'No hay voces en alemán instaladas en este dispositivo.',
  'Device default': 'Predeterminado del dispositivo', Enhanced: 'Mejorada',
  "Voices come from the device's own text-to-speech engine — install more from your phone's system settings if you don't see the one you want.":
    'Las voces provienen del motor de texto a voz del propio dispositivo — instala más desde los ajustes del sistema de tu teléfono si no ves la que quieres.',
  'Playing…': 'Reproduciendo…', Test: 'Probar',

  'Could not install this chunk': 'No se pudo instalar este fragmento', 'Could not remove this chunk': 'No se pudo eliminar este fragmento',
  'Word guides installed': 'Guías de palabras instaladas', 'Installed {{count}} new chunks.': '{{count}} fragmentos nuevos instalados.',
  'Could not install word guides': 'No se pudieron instalar las guías de palabras', 'German word guides': 'Guías de palabras en alemán',
  'A free, pre-written dictionary — install to get instant word explanations without an AI key.':
    'Un diccionario gratuito ya escrito — instálalo para obtener explicaciones de palabras al instante sin clave de IA.',
  '{{words}} words planned, {{chunks}} chunks of ~100.': '{{words}} palabras planificadas, {{chunks}} fragmentos de ~100.',
  '{{installed}} installed · {{available}} available to install · {{pending}} not generated yet':
    '{{installed}} instalados · {{available}} disponibles para instalar · {{pending}} aún no generados',
  'Install all available': 'Instalar todo lo disponible', Chunks: 'Fragmentos',
  'Words {{start}}–{{end}}': 'Palabras {{start}}–{{end}}', '{{count}} words': '{{count}} palabras', 'Not generated yet': 'Aún no generado',
  'Uninstall all': 'Desinstalar todo', 'Uninstalling…': 'Desinstalando…',
  'Word guides uninstalled': 'Guías de palabras desinstaladas', 'Removed {{count}} chunks.': '{{count}} fragmentos eliminados.',
  'Could not uninstall word guides': 'No se pudieron desinstalar las guías de palabras',
  'Uninstall all word guides?': '¿Desinstalar todas las guías de palabras?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'Elimina cada fragmento instalado de este dispositivo. Las tarjetas que ya añadiste a tu mazo no se ven afectadas.',
  'No translation to add.': 'No hay traducción para añadir.', 'No dictionary entry to add.': 'No hay entrada de diccionario para añadir.',
  Details: 'Detalles', 'More info': 'Más información', 'Hide details': 'Ocultar detalles',
  'Understanding the German {{wordClass}} "{{headword}}"': 'Entendiendo el {{wordClass}} alemán "{{headword}}"',
  Usage: 'Uso', 'Examples of Usage': 'Ejemplos de uso',
  Noun: 'Sustantivo', Verb: 'Verbo', Adjective: 'Adjetivo', Adverb: 'Adverbio', Preposition: 'Preposición',
  Conjunction: 'Conjunción', Pronoun: 'Pronombre', Article: 'Artículo', Phrase: 'Frase',

  Connected: 'Conectado', 'No internet connection': 'Sin conexión a Internet', 'DeepL validation failed': 'Error de verificación de DeepL',
  '{{provider}} validation failed': 'Error de verificación de {{provider}}',
  'Delete all API keys?': '¿Eliminar todas las claves API?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'Esto elimina todas las claves de proveedor de este dispositivo. El vocabulario y el progreso no se ven afectados.',
  'Limited mode': 'Modo limitado',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    'Sin una clave de generación, la creación de tarjetas con IA está desactivada. La traducción y las tarjetas manuales siguen funcionando. Añade una clave a uno de los proveedores de abajo para la experiencia completa.',
  "Couldn't load saved settings": 'No se pudieron cargar los ajustes guardados',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key — nothing is sent until you generate a card.':
    'La generación de tarjetas (significados, ejemplos, grupos, frases, huecos) usa el proveedor de abajo que esté configurado y activado. Trae tu propia clave API — nada se envía hasta que generes una tarjeta.',
  'Active provider': 'Proveedor activo', Model: 'Modelo', 'Paste your {{provider}} API key…': 'Pega tu clave API de {{provider}}…',
  'Hide {{provider}} API key': 'Ocultar clave API de {{provider}}', 'Show {{provider}} API key': 'Mostrar clave API de {{provider}}',
  'Validate key': 'Verificar clave', Clear: 'Borrar', 'Device-observed usage': 'Uso observado en el dispositivo',
  '{{count}} requests': '{{count}} solicitudes', '{{count}} tokens': '{{count}} tokens', 'Open {{provider}} usage ↗': 'Abrir uso de {{provider}} ↗',
  'Google Translate': 'Google Translate', 'Free tier, no key needed': 'Nivel gratuito, sin clave necesaria',
  'Uses this provider’s key above': 'Usa la clave de este proveedor de arriba', 'Add a key above to enable': 'Añade una clave arriba para activar',
  Active: 'Activo', 'Best German↔English quality — bring your own key': 'Mejor calidad alemán↔inglés — trae tu propia clave',
  'Hide DeepL settings': 'Ocultar ajustes de DeepL', 'Show DeepL settings': 'Mostrar ajustes de DeepL',
  'Paste your DeepL API key…': 'Pega tu clave API de DeepL…', Enabled: 'Activado',
  'Open DeepL usage ↗': 'Abrir uso de DeepL ↗', 'v0.0.1 · offline-first · your data stays on device': 'v0.0.1 · sin conexión por defecto · tus datos permanecen en el dispositivo',

  'Opening your vocabulary…': 'Abriendo tu vocabulario…', 'Import & Export': 'Importar y exportar', 'Import CSV': 'Importar CSV',
  'Import Anki deck': 'Importar mazo de Anki', 'Card Templates': 'Plantillas de tarjetas',
}

const hi: Partial<Record<Phrase, string>> = {
  Home: 'होम', Search: 'खोजें', Decks: 'डेक', Mine: 'मेरा', Settings: 'सेटिंग्स',
  Cancel: 'रद्द करें', Save: 'सहेजें', Delete: 'हटाएं', Edit: 'संपादित करें', Done: 'हो गया',
  Continue: 'जारी रखें', Back: 'वापस', Next: 'अगला', Add: 'जोड़ें', Import: 'आयात करें',
  Export: 'निर्यात करें', Retry: 'पुनः प्रयास करें', Close: 'बंद करें', Install: 'इंस्टॉल करें',
  Uninstall: 'अनइंस्टॉल करें', Installed: 'इंस्टॉल हो गया',
  Generation: 'जनरेशन', Translation: 'अनुवाद', Learning: 'सीखना', Data: 'डेटा',
  Privacy: 'गोपनीयता', About: 'ऐप के बारे में',
  'App Language': 'ऐप की भाषा', 'Follow device': 'डिवाइस की भाषा उपयोग करें',
  'Default CEFR level': 'डिफ़ॉल्ट CEFR स्तर',
  'Examples and explanations are calibrated to this level.':
    'उदाहरण और स्पष्टीकरण इसी स्तर के अनुसार तैयार किए गए हैं।',
  'Import & export': 'आयात और निर्यात', 'Anki, CSV, JSON backup': 'Anki, CSV, JSON बैकअप',
  'Card templates': 'कार्ड टेम्पलेट', 'Customize card layouts': 'कार्ड लेआउट अनुकूलित करें',
  Pronunciation: 'उच्चारण', 'Voice, rate, pitch': 'आवाज़, गति, पिच',
  'Word guides': 'शब्द गाइड', 'Free starter dictionary — no AI key needed': 'मुफ़्त स्टार्टर शब्दकोश — AI कुंजी की आवश्यकता नहीं',
  'Delete all API keys': 'सभी API कुंजियाँ हटाएं',
  'API keys stay on this device (Expo SecureStore) and are never included in exports or backups.':
    'API कुंजियाँ इसी डिवाइस पर रहती हैं (Expo SecureStore) और निर्यात या बैकअप में कभी शामिल नहीं होतीं।',
  English: 'अंग्रेज़ी', German: 'जर्मन', French: 'फ़्रेंच', Spanish: 'स्पेनिश', Hindi: 'हिन्दी',

  "Ready for today's session?": 'आज के सत्र के लिए तैयार हैं?', '{{count}} days': '{{count}} दिन',
  "Some data on this screen couldn't load.": 'इस स्क्रीन का कुछ डेटा लोड नहीं हो सका।',
  'cards due for review': 'दोहराने के लिए कार्ड बाकी', 'Start review': 'दोहराव शुरू करें',
  'reviewed today': 'आज दोहराए गए', retention: 'अवधारण दर', 'total cards →': 'कुल कार्ड →',
  'Quick actions': 'त्वरित कार्य', 'Look up a word': 'एक शब्द खोजें', 'Mining queue': 'माइनिंग कतार',
  'Practice cloze': 'क्लोज़ अभ्यास करें', Statistics: 'आँकड़े',
  'Recently added': 'हाल ही में जोड़े गए', 'See all': 'सभी देखें', 'No words yet': 'अभी तक कोई शब्द नहीं',
  'Look up a word to add your first card.': 'अपना पहला कार्ड जोड़ने के लिए एक शब्द खोजें।',

  'Type a German or English word…': 'जर्मन या अंग्रेज़ी शब्द टाइप करें…', 'Instant lookup': 'तुरंत खोज',
  'Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.':
    'जर्मन ("ausgeh…") या अंग्रेज़ी ("go out") में खोजें।\n"ging aus" जैसे रूपांतरित शब्द भी काम करते हैं।',
  '"{{term}}" is new': '"{{term}}" नया है',
  "This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.":
    'यह शब्द अभी तक आपकी लाइब्रेरी में नहीं है। AI से अर्थ, उदाहरण और समानार्थी शब्द बनाएं।',
  'Translating…': 'अनुवाद हो रहा है…', 'Generating…': 'बन रहा है…', 'Generate with AI': 'AI से बनाएं',
  'Add your OpenAI key in Settings to generate new words': 'नए शब्द बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें',
  'Generation came back incomplete': 'जनरेशन अधूरा वापस आया',
  'From your installed dictionary — free, no AI needed.': 'आपके इंस्टॉल किए गए शब्दकोश से — मुफ़्त, AI की ज़रूरत नहीं।',
  'Nothing was saved — try again.': 'कुछ भी सहेजा नहीं गया — फिर से कोशिश करें।',

  'Give the deck a name.': 'डेक को एक नाम दें।', 'Could not delete deck': 'डेक हटाया नहीं जा सका',
  'Delete deck?': 'डेक हटाएं?',
  'Cards that are only in this deck are deleted with it. Cards in other decks stay there.':
    'केवल इस डेक में मौजूद कार्ड इसके साथ हट जाएंगे। अन्य डेक में मौजूद कार्ड वहीं रहेंगे।',
  'No deck selected.': 'कोई डेक चयनित नहीं है।', 'Could not move deck': 'डेक ले जाया नहीं जा सका',
  'Could not merge deck': 'डेक मर्ज नहीं किया जा सका',
  'Merge into "{{name}}"?': '"{{name}}" में मर्ज करें?',
  'This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.':
    'इससे "{{source}}" हट जाएगा और इसके सभी कार्ड "{{target}}" में चले जाएंगे। इसे वापस नहीं लिया जा सकता।',
  'Export ready': 'निर्यात तैयार', 'Exported {{count}} cards.': '{{count}} कार्ड निर्यात किए गए।',
  'Saved to the folder you chose.': 'आपके चुने गए फ़ोल्डर में सहेजा गया।', 'Choose where to save it.': 'इसे कहाँ सहेजना है चुनें।',
  'Export failed': 'निर्यात विफल', 'No decks yet': 'अभी तक कोई डेक नहीं',
  'Create your first deck with the + button.': '+ बटन से अपना पहला डेक बनाएं।',
  'New deck': 'नया डेक', 'Deck name': 'डेक का नाम', 'Emoji (optional)': 'इमोजी (वैकल्पिक)',
  'Creating…': 'बनाया जा रहा है…', 'Create deck': 'डेक बनाएं',
  'Import into this deck': 'इस डेक में आयात करें', 'Export this deck': 'इस डेक को निर्यात करें',
  'Rename deck': 'डेक का नाम बदलें', 'Move to…': 'ले जाएं…', 'Merge into…': 'मर्ज करें…',
  'Delete deck': 'डेक हटाएं', 'Top level (no parent)': 'शीर्ष स्तर (कोई मूल डेक नहीं)',
  'No other deck to nest this one under.': 'इसे नेस्ट करने के लिए कोई अन्य डेक नहीं है।',
  'No other deck to merge into.': 'मर्ज करने के लिए कोई अन्य डेक नहीं है।',
  'Import into "{{name}}"': '"{{name}}" में आयात करें', 'Export "{{name}}"': '"{{name}}" निर्यात करें',
  '{{due}} due/{{total}} cards': '{{due}} बाकी/{{total}} कार्ड', '{{count}} due': '{{count}} बाकी',
  Deck: 'डेक', 'This deck no longer exists.': 'यह डेक अब मौजूद नहीं है।',
  cards: 'कार्ड', 'due now': 'अभी बाकी', 'Review {{count}} due cards': '{{count}} बाकी कार्ड दोहराएं',
  'Nothing due — study ahead': 'कुछ बाकी नहीं — आगे से पढ़ें', Cards: 'कार्ड',
  'No cards yet — add words from Search.': 'अभी तक कोई कार्ड नहीं — खोज से शब्द जोड़ें।',
  'Move "{{name}}" to…': '"{{name}}" को ले जाएं…', 'Merge "{{name}}" into…': '"{{name}}" को मर्ज करें…',

  'Could not discard capture': 'कैप्चर हटाया नहीं जा सका', 'Could not save capture': 'कैप्चर सहेजा नहीं जा सका',
  'Clipboard is empty': 'क्लिपबोर्ड खाली है', 'Copy some text first, then paste it here.': 'पहले कुछ टेक्स्ट कॉपी करें, फिर उसे यहाँ पेस्ट करें।',
  'Could not read clipboard': 'क्लिपबोर्ड पढ़ा नहीं जा सका',
  'Add your OpenAI key in Settings to generate cards.': 'कार्ड बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें।',
  'Add a sentence': 'एक वाक्य जोड़ें',
  'Paste or type a German sentence. It joins the queue below — nothing is sent to AI until you generate.':
    'एक जर्मन वाक्य पेस्ट करें या टाइप करें। यह नीचे कतार में जुड़ जाता है — जब तक आप जनरेट न करें, AI को कुछ नहीं भेजा जाता।',
  'Paste from clipboard': 'क्लिपबोर्ड से पेस्ट करें', 'Adding…': 'जोड़ा जा रहा है…', 'Add to queue': 'कतार में जोड़ें',
  'Queue is empty': 'कतार खाली है',
  'Add a sentence manually, paste one from your clipboard, or capture text from the share sheet — it lands here before any AI processing.':
    'मैन्युअल रूप से एक वाक्य जोड़ें, अपने क्लिपबोर्ड से पेस्ट करें, या शेयर शीट से टेक्स्ट कैप्चर करें — यह किसी भी AI प्रोसेसिंग से पहले यहाँ आता है।',
  '{{done}} of {{total}} generated': '{{total}} में से {{done}} बनाए गए', '{{count}} failed': '{{count}} विफल',
  'see Decks.': 'डेक देखें।',
  "Review your captures. Discard what you don't need, then generate cards for the rest — no API call is wasted on text you didn't ask for.":
    'अपने कैप्चर की समीक्षा करें। जिनकी ज़रूरत नहीं उन्हें हटाएं, फिर बाकी के लिए कार्ड बनाएं — जो टेक्स्ट आपने नहीं मांगा उस पर कोई API कॉल बर्बाद नहीं होती।',
  'Generate {{count}} cards with AI': 'AI से {{count}} कार्ड बनाएं',
  'Add your OpenAI key to generate cards': 'कार्ड बनाने के लिए अपनी OpenAI कुंजी जोड़ें',

  'Add your OpenAI key in Settings to generate examples.': 'उदाहरण बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें।',
  'This word has no card yet.': 'इस शब्द का अभी तक कोई कार्ड नहीं है।', 'Could not save your feedback': 'आपकी प्रतिक्रिया सहेजी नहीं जा सकी',
  'Could not save your report': 'आपकी रिपोर्ट सहेजी नहीं जा सकी', 'Could not change the primary meaning': 'मुख्य अर्थ बदला नहीं जा सका',
  'Could not update the flashcard example': 'फ्लैशकार्ड उदाहरण अपडेट नहीं हो सका',
  'This word has no meaning yet.': 'इस शब्द का अभी तक कोई अर्थ नहीं है।', 'Could not generate an explanation': 'स्पष्टीकरण बनाया नहीं जा सका',
  'AI not configured': 'AI कॉन्फ़िगर नहीं है',
  'Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.':
    'इस अर्थ के लिए स्पष्टीकरण बनाने हेतु सेटिंग्स में OpenAI, Mistral, Gemini या Claude कुंजी जोड़ें।',
  'Could not look up an explanation': 'स्पष्टीकरण खोजा नहीं जा सका', 'Could not save your changes': 'आपके बदलाव सहेजे नहीं जा सके',
  '"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.':
    '"{{form}}" अभी तक आपकी लाइब्रेरी में नहीं है। इसे बनाने के लिए खोज टैब से खोजें।',
  'No explanation yet.': 'अभी तक कोई स्पष्टीकरण नहीं।', 'Make primary: {{translation}}': 'मुख्य बनाएं: {{translation}}',
  Examples: 'उदाहरण', 'shown on flashcard': 'फ्लैशकार्ड पर दिखाया गया', 'use on flashcard': 'फ्लैशकार्ड पर उपयोग करें',
  'Advanced grammar options': 'उन्नत व्याकरण विकल्प', 'Active: {{selection}}': 'सक्रिय: {{selection}}',
  'Generate examples': 'उदाहरण बनाएं',
  'Add your OpenAI key in Settings to generate targeted examples.': 'लक्षित उदाहरण बनाने के लिए सेटिंग्स में अपनी OpenAI कुंजी जोड़ें।',
  Synonyms: 'समानार्थी शब्द', 'Phrases & collocations': 'वाक्यांश और सहचर्य',
  'Cloze card': 'क्लोज़ कार्ड', 'Cloze cards': 'क्लोज़ कार्ड',
  'Added ✓ — add to another deck': 'जोड़ा गया ✓ — किसी अन्य डेक में जोड़ें', 'Add to deck': 'डेक में जोड़ें',
  'Add "{{form}}" to…': '"{{form}}" को इसमें जोड़ें…',
  'Edit this card': 'इस कार्ड को संपादित करें', Meaning: 'अर्थ', 'Example sentence': 'उदाहरण वाक्य',
  'Example translation': 'उदाहरण अनुवाद', 'Save changes': 'बदलाव सहेजें',
  "What's wrong with this?": 'इसमें क्या गलत है?', 'Optional details…': 'वैकल्पिक विवरण…',
  'Send report': 'रिपोर्ट भेजें', 'Sending…': 'भेजा जा रहा है…',
  'Inaccurate translation': 'गलत अनुवाद', 'Unnatural phrasing': 'अस्वाभाविक वाक्य रचना',
  'Wrong CEFR level': 'गलत CEFR स्तर', 'Grammar error': 'व्याकरण त्रुटि', Other: 'अन्य',
  'Tense & mood': 'काल और मूड', 'Sentence structure': 'वाक्य संरचना', Conjunctions: 'संयोजक', 'Focus words': 'बल शब्द',

  GOOD: 'अच्छा', AGAIN: 'फिर से', EASY: 'आसान', HARD: 'कठिन',
  'No card to rate.': 'रेट करने के लिए कोई कार्ड नहीं।', 'Could not save your rating': 'आपकी रेटिंग सहेजी नहीं जा सकी',
  'No card to edit.': 'संपादित करने के लिए कोई कार्ड नहीं।',
  'Add your AI provider key in Settings to generate an explanation.': 'स्पष्टीकरण बनाने के लिए सेटिंग्स में अपनी AI प्रदाता कुंजी जोड़ें।',
  'Nothing due right now': 'अभी कुछ भी बाकी नहीं', 'Session complete!': 'सत्र पूरा हुआ!',
  'This deck has no cards due for review. Add words or check back later.':
    'इस डेक में दोहराने के लिए कोई कार्ड बाकी नहीं है। शब्द जोड़ें या बाद में देखें।',
  'You reviewed {{count}} cards. Great work — come back when the next cards are due.':
    'आपने {{count}} कार्ड दोहराए। शानदार काम — अगले कार्ड बाकी होने पर वापस आएं।',
  'Back to deck': 'डेक पर वापस जाएं', 'tap to reveal': 'दिखाने के लिए टैप करें', cloze: 'क्लोज़',
  'Basic inline HTML works too — {{bold}}, {{italic}}, {{colored}}.':
    'बुनियादी इनलाइन HTML भी काम करता है — {{bold}}, {{italic}}, {{colored}}।',

  'No stats yet': 'अभी तक कोई आँकड़े नहीं',
  'Add and review some words to see your learning statistics here.': 'यहाँ अपने सीखने के आँकड़े देखने के लिए कुछ शब्द जोड़ें और दोहराएं।',
  'retention (30 d)': 'अवधारण (30 दिन)', 'day streak': 'दिनों की लड़ी', 'total cards': 'कुल कार्ड',
  'new this week': 'इस सप्ताह नए', 'Review activity': 'दोहराव गतिविधि', less: 'कम', more: 'अधिक',
  'Vocabulary growth': 'शब्दावली वृद्धि', 'new words per week': 'प्रति सप्ताह नए शब्द',
  'Difficult words': 'कठिन शब्द', 'No lapses yet — nothing difficult to show.': 'अभी तक कोई चूक नहीं — दिखाने के लिए कुछ कठिन नहीं।',
  '{{count}} lapses': '{{count}} चूक',

  'Anki deck (.apkg)': 'Anki डेक (.apkg)',
  "Bring your existing decks. Review history isn't imported — cards start fresh.":
    'अपने मौजूदा डेक लाएं। दोहराव का इतिहास आयात नहीं होता — कार्ड नए सिरे से शुरू होते हैं।',
  'Choose .apkg file': '.apkg फ़ाइल चुनें', 'CSV with column mapping': 'कॉलम मैपिंग के साथ CSV',
  'From Quizlet, Memrise, or spreadsheets.': 'Quizlet, Memrise, या स्प्रेडशीट से।',
  'Choose CSV file': 'CSV फ़ाइल चुनें', 'A shared deck (.lin)': 'एक साझा किया गया डेक (.lin)',
  "Add a deck someone shared with you — full fidelity, including review history. Doesn't touch anything else on this device.":
    'किसी ने आपके साथ साझा किया गया डेक जोड़ें — पूरी निष्ठा के साथ, दोहराव इतिहास सहित। यह इस डिवाइस पर कुछ और नहीं छूता।',
  'Choose .lin file': '.lin फ़ाइल चुनें', 'Restore from Lingora backup (.lin)': 'Lingora बैकअप से पुनर्स्थापित करें (.lin)',
  'Replaces everything on this device with a previously exported backup.': 'यह पहले निर्यात किए गए बैकअप से इस डिवाइस पर सब कुछ बदल देता है।',
  'Restoring…': 'पुनर्स्थापित हो रहा है…', 'Choose backup file': 'बैकअप फ़ाइल चुनें',
  'Lingora backup (.lin)': 'Lingora बैकअप (.lin)',
  'Your full library — decks, cards, review history. Your data is always yours. API keys are never included.':
    'आपकी पूरी लाइब्रेरी — डेक, कार्ड, दोहराव इतिहास। आपका डेटा हमेशा आपका ही रहता है। API कुंजियाँ कभी शामिल नहीं होतीं।',
  'Export everything': 'सब कुछ निर्यात करें', CSV: 'CSV',
  'One row per card — the same columns CSV import reads, so this file re-imports as-is.':
    'प्रति कार्ड एक पंक्ति — वही कॉलम जो CSV आयात पढ़ता है, इसलिए यह फ़ाइल जैसी है वैसे ही फिर से आयात हो जाती है।',
  'Export as CSV': 'CSV के रूप में निर्यात करें',
  "Study your Lingora vocabulary in Anki/AnkiDroid. Cards start fresh — review history isn't carried over.":
    'Anki/AnkiDroid में अपनी Lingora शब्दावली पढ़ें। कार्ड नए सिरे से शुरू होते हैं — दोहराव इतिहास आगे नहीं बढ़ता।',
  'Export as .apkg': '.apkg के रूप में निर्यात करें', Markdown: 'Markdown',
  'A readable word — meaning — example list. Not meant to re-import.': 'एक पठनीय शब्द — अर्थ — उदाहरण सूची। फिर से आयात के लिए नहीं है।',
  'Export as Markdown': 'Markdown के रूप में निर्यात करें', 'Backup ready': 'बैकअप तैयार', 'Restore from backup?': 'बैकअप से पुनर्स्थापित करें?',
  'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.':
    'यह इस डिवाइस पर मौजूद सब कुछ "{{fileName}}" (निर्यात किया गया {{date}}) की सामग्री से बदल देता है। इसे वापस नहीं लिया जा सकता।',
  Restore: 'पुनर्स्थापित करें', 'Restore complete': 'पुनर्स्थापन पूरा हुआ', 'Restored {{count}} rows.': '{{count}} पंक्तियाँ पुनर्स्थापित की गईं।',
  'Restore failed': 'पुनर्स्थापन विफल', 'Invalid backup file': 'अमान्य बैकअप फ़ाइल',
  'Could not read file': 'फ़ाइल पढ़ी नहीं जा सकी',

  Preview: 'पूर्वावलोकन', 'Will import': 'आयात होगा', Duplicates: 'डुप्लिकेट', Errors: 'त्रुटियाँ', Selected: 'चयनित',
  'Import {{count}} rows': '{{count}} पंक्तियाँ आयात करें', 'Import {{count}} words': '{{count}} शब्द आयात करें',
  'Import from CSV': 'CSV से आयात करें',
  "From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.":
    'Quizlet, Memrise, या स्प्रेडशीट निर्यात से। इसके बाद आप चुनेंगे कि हर कॉलम का क्या मतलब है।',
  '{{count}} rows detected. Map each column below.': '{{count}} पंक्तियाँ मिलीं। नीचे हर कॉलम को मैप करें।',
  'Sample data': 'नमूना डेटा', 'The first few rows, so you can see what each column actually holds.':
    'पहली कुछ पंक्तियाँ, ताकि आप देख सकें कि हर कॉलम में वास्तव में क्या है।',
  'Column {{n}}': 'कॉलम {{n}}', 'Field mapping': 'फ़ील्ड मैपिंग',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes — they're derived from the example's cloze markup and its translation.":
    'सब कुछ वैकल्पिक है। क्लोज़-शैली नोट्स के लिए शब्द/अर्थ को अनमैप्ड छोड़ें — वे उदाहरण के क्लोज़ मार्कअप और उसके अनुवाद से निकाले जाते हैं।',
  None: 'कोई नहीं', 'Import into deck': 'डेक में आयात करें', '+ New deck': '+ नया डेक',
  'If the word already exists': 'यदि शब्द पहले से मौजूद है',
  'Applies to every duplicate row you leave checked in the next step.': 'यह अगले चरण में चेक की गई हर डुप्लिकेट पंक्ति पर लागू होता है।',
  'Checking…': 'जाँच हो रही है…', 'Preview import': 'आयात पूर्वावलोकन',
  'Importing…': 'आयात हो रहा है…', 'Import complete': 'आयात पूरा हुआ', 'Imported {{count}} words.': '{{count}} शब्द आयात किए गए।',
  Imported: 'आयातित', Skipped: 'छोड़े गए', Failed: 'विफल', 'Import another file': 'एक और फ़ाइल आयात करें',
  'Could not read this file': 'यह फ़ाइल पढ़ी नहीं जा सकी', 'Import failed': 'आयात विफल',
  'This file has no rows to import.': 'इस फ़ाइल में आयात करने के लिए कोई पंक्ति नहीं है।',
  Word: 'शब्द', Example: 'उदाहरण', Status: 'स्थिति', Issues: 'समस्याएं', Skip: 'छोड़ें',
  "Don't touch the existing word.": 'मौजूदा शब्द को न बदलें।', Merge: 'मर्ज करें',
  'Add this as another meaning on the existing card.': 'इसे मौजूदा कार्ड पर एक और अर्थ के रूप में जोड़ें।',
  'Keep both': 'दोनों रखें', 'Add a second, separate card for the same word.': 'उसी शब्द के लिए एक दूसरा, अलग कार्ड जोड़ें।',

  'Import from Anki': 'Anki से आयात करें',
  "Choose a `.apkg` export. Review history isn't imported — every card starts fresh — and media (audio/images) is stripped rather than copied.":
    'एक `.apkg` निर्यात चुनें। दोहराव इतिहास आयात नहीं होता — हर कार्ड नए सिरे से शुरू होता है — और मीडिया (ऑडियो/छवियाँ) कॉपी होने के बजाय हटा दिया जाता है।',
  '{{notes}} notes across {{decks}} decks. Map each field below — it applies to every note, so a note type without that many fields just leaves it empty.':
    '{{decks}} डेक में {{notes}} नोट्स। नीचे हर फ़ील्ड मैप करें — यह हर नोट पर लागू होता है, इतने फ़ील्ड न रखने वाला नोट प्रकार इसे बस खाली छोड़ देता है।',
  'The first few notes, so you can see what each field actually holds.': 'पहले कुछ नोट्स, ताकि आप देख सकें कि हर फ़ील्ड में वास्तव में क्या है।',
  "Everything is optional. Leave Word/Meaning unmapped for Cloze notes — they're derived from the example's cloze markup and its translation.":
    'सब कुछ वैकल्पिक है। क्लोज़ नोट्स के लिए शब्द/अर्थ को अनमैप्ड छोड़ें — वे उदाहरण के क्लोज़ मार्कअप और उसके अनुवाद से निकाले जाते हैं।',
  'Field {{n}}': 'फ़ील्ड {{n}}', 'This collection has no notes to import.': 'इस संग्रह में आयात करने के लिए कोई नोट नहीं है।',
  'Could not read this collection': 'यह संग्रह पढ़ा नहीं जा सका', '{{done}} of {{total}} notes': '{{total}} में से {{done}} नोट्स',
  'Import canceled': 'आयात रद्द किया गया',
  'The rest were left untouched — you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).':
    'बाकी को नहीं बदला गया — आप जहाँ छोड़ा था वहीं से जारी रखने के लिए वही फ़ाइल फिर से आयात कर सकते हैं (पहले से आयातित शब्द डुप्लिकेट के रूप में छोड़ दिए जाते हैं)।',
  Tags: 'टैग',

  'Import from a .lin file': '.lin फ़ाइल से आयात करें',
  'Choose a Lingora `.lin` file — a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.':
    'एक Lingora `.lin` फ़ाइल चुनें — किसी ने आपके साथ साझा किया गया डेक, या आपके अपने डेक निर्यातों में से एक। पूरी निष्ठा: अर्थ, उदाहरण, समानार्थी शब्द, क्लोज़ कार्ड, दोहराव इतिहास, और FSRS शेड्यूलिंग सब आ जाते हैं।',
  'This file has more than one deck. Which one do you want to import?': 'इस फ़ाइल में एक से अधिक डेक हैं। आप कौन सा आयात करना चाहते हैं?',
  'This file has no decks to import.': 'इस फ़ाइल में आयात करने के लिए कोई डेक नहीं है।',
  'Importing "{{name}}" ({{count}} cards).': '"{{name}}" आयात हो रहा है ({{count}} कार्ड)।',
  "Don't touch the word already in your library.": 'लाइब्रेरी में पहले से मौजूद शब्द को न बदलें।',
  'Imported {{words}} words ({{cards}} cards).': '{{words}} शब्द आयात किए गए ({{cards}} कार्ड)।',

  Vocabulary: 'शब्दावली', Cloze: 'क्लोज़', '+ New': '+ नया', Front: 'सामने',
  'actual review card size on this device': 'इस डिवाइस पर वास्तविक दोहराव कार्ड आकार',
  'Rendered with a sample cloze sentence through the same engine the review session uses.':
    'दोहराव सत्र द्वारा उपयोग किए जाने वाले उसी इंजन से एक नमूना क्लोज़ वाक्य के साथ रेंडर किया गया।',
  'Rendered with sample data ("ausgehen") through the same engine the review session uses.':
    'दोहराव सत्र द्वारा उपयोग किए जाने वाले उसी इंजन से नमूना डेटा ("ausgehen") के साथ रेंडर किया गया।',
  'Template name': 'टेम्पलेट नाम', Fields: 'फ़ील्ड',
  'Tap "Front" or "Back" to show a field on that side — a field can appear on both, or neither.':
    'उस तरफ़ फ़ील्ड दिखाने के लिए "सामने" या "पीछे" टैप करें — एक फ़ील्ड दोनों पर, या किसी पर भी नहीं दिख सकता है।',
  'Layout & style': 'लेआउट और शैली', 'Reset to default': 'डिफ़ॉल्ट पर रीसेट करें', 'Accent color': 'एक्सेंट रंग',
  'Stored as a': 'इस रूप में सहेजा गया', 'rule — reference it in your CSS below as': 'नियम — इसे अपने CSS में नीचे इस रूप में संदर्भित करें',
  CSS: 'CSS', 'Applied to both sides in the real WebView renderer.': 'वास्तविक WebView रेंडरर में दोनों तरफ़ लागू किया गया।',
  'Front (Liquid)': 'सामने (Liquid)', 'Back (Liquid)': 'पीछे (Liquid)',
  'Available template variables': 'उपलब्ध टेम्पलेट वेरिएबल', 'Conditional example': 'सशर्त उदाहरण',
  'Set default': 'डिफ़ॉल्ट सेट करें', 'Deleting…': 'हटाया जा रहा है…', 'Delete this template?': 'यह टेम्पलेट हटाएं?',
  '"{{name}}" will be removed.': '"{{name}}" हटा दिया जाएगा।', 'Create template': 'टेम्पलेट बनाएं',
  'Template editor help': 'टेम्पलेट संपादक सहायता', 'Fields tab': 'फ़ील्ड टैब', 'Style tab': 'शैली टैब',
  'Preview tab': 'पूर्वावलोकन टैब', 'Code tab': 'कोड टैब',
  'HTML & CSS without extra elements': 'बिना अतिरिक्त तत्वों के HTML और CSS',
  'Could not save template': 'टेम्पलेट सहेजा नहीं जा सका', 'Could not set default template': 'डिफ़ॉल्ट टेम्पलेट सेट नहीं हो सका',
  'Could not delete template': 'टेम्पलेट हटाया नहीं जा सका', 'New template': 'नया टेम्पलेट',
  'Reset to default layout & style?': 'डिफ़ॉल्ट लेआउट और शैली पर रीसेट करें?',
  'This replaces the front, back, and CSS in the editor — tap "Save changes" to keep it. Unsaved edits are lost.':
    'यह संपादक में सामने, पीछे, और CSS बदल देता है — इसे रखने के लिए "बदलाव सहेजें" टैप करें। असहेजे बदलाव खो जाते हैं।',
  Reset: 'रीसेट करें',

  'Speaking rate': 'बोलने की गति', Pitch: 'पिच', Normal: 'सामान्य', 'Voice (German)': 'आवाज़ (जर्मन)',
  'No German voices are installed on this device.': 'इस डिवाइस पर कोई जर्मन आवाज़ें इंस्टॉल नहीं हैं।',
  'Device default': 'डिवाइस डिफ़ॉल्ट', Enhanced: 'उन्नत',
  "Voices come from the device's own text-to-speech engine — install more from your phone's system settings if you don't see the one you want.":
    'आवाज़ें डिवाइस के अपने टेक्स्ट-टू-स्पीच इंजन से आती हैं — अगर वांछित आवाज़ नहीं दिखती तो अपने फ़ोन की सिस्टम सेटिंग्स से और इंस्टॉल करें।',
  'Playing…': 'चलाया जा रहा है…', Test: 'परीक्षण',

  'Could not install this chunk': 'यह हिस्सा इंस्टॉल नहीं हो सका', 'Could not remove this chunk': 'यह हिस्सा हटाया नहीं जा सका',
  'Word guides installed': 'शब्द गाइड इंस्टॉल हो गए', 'Installed {{count}} new chunks.': '{{count}} नए हिस्से इंस्टॉल किए गए।',
  'Could not install word guides': 'शब्द गाइड इंस्टॉल नहीं हो सके', 'German word guides': 'जर्मन शब्द गाइड',
  'A free, pre-written dictionary — install to get instant word explanations without an AI key.':
    'एक मुफ़्त, पहले से लिखा गया शब्दकोश — बिना AI कुंजी के तुरंत शब्द स्पष्टीकरण पाने के लिए इंस्टॉल करें।',
  '{{words}} words planned, {{chunks}} chunks of ~100.': '{{words}} शब्दों की योजना, ~100 के {{chunks}} हिस्से।',
  '{{installed}} installed · {{available}} available to install · {{pending}} not generated yet':
    '{{installed}} इंस्टॉल किए गए · {{available}} इंस्टॉल के लिए उपलब्ध · {{pending}} अभी तक नहीं बने',
  'Install all available': 'सभी उपलब्ध इंस्टॉल करें', Chunks: 'हिस्से',
  'Words {{start}}–{{end}}': 'शब्द {{start}}–{{end}}', '{{count}} words': '{{count}} शब्द', 'Not generated yet': 'अभी तक नहीं बना',
  'Uninstall all': 'सभी अनइंस्टॉल करें', 'Uninstalling…': 'अनइंस्टॉल हो रहा है…',
  'Word guides uninstalled': 'शब्द गाइड अनइंस्टॉल हो गए', 'Removed {{count}} chunks.': '{{count}} हिस्से हटा दिए गए।',
  'Could not uninstall word guides': 'शब्द गाइड अनइंस्टॉल नहीं हो सके',
  'Uninstall all word guides?': 'सभी शब्द गाइड अनइंस्टॉल करें?',
  'Removes every installed chunk from this device. Cards you already added to your deck are not affected.':
    'यह इस डिवाइस से हर इंस्टॉल किया हुआ हिस्सा हटा देता है। आपके डेक में पहले से जोड़े गए कार्ड प्रभावित नहीं होते।',
  'No translation to add.': 'जोड़ने के लिए कोई अनुवाद नहीं।', 'No dictionary entry to add.': 'जोड़ने के लिए कोई शब्दकोश प्रविष्टि नहीं।',
  Details: 'विवरण', 'More info': 'अधिक जानकारी', 'Hide details': 'विवरण छुपाएं',
  'Understanding the German {{wordClass}} "{{headword}}"': 'जर्मन {{wordClass}} "{{headword}}" को समझना',
  Usage: 'उपयोग', 'Examples of Usage': 'उपयोग के उदाहरण',
  Noun: 'संज्ञा', Verb: 'क्रिया', Adjective: 'विशेषण', Adverb: 'क्रिया-विशेषण', Preposition: 'पूर्वसर्ग',
  Conjunction: 'संयोजक', Pronoun: 'सर्वनाम', Article: 'आर्टिकल', Phrase: 'वाक्यांश',

  Connected: 'कनेक्टेड', 'No internet connection': 'इंटरनेट कनेक्शन नहीं है', 'DeepL validation failed': 'DeepL सत्यापन विफल',
  '{{provider}} validation failed': '{{provider}} सत्यापन विफल',
  'Delete all API keys?': 'सभी API कुंजियाँ हटाएं?',
  'This removes every provider key from this device. Vocabulary and progress are unaffected.':
    'यह इस डिवाइस से हर प्रदाता कुंजी हटा देता है। शब्दावली और प्रगति प्रभावित नहीं होती।',
  'Limited mode': 'सीमित मोड',
  'Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key to one of the providers below for the full experience.':
    'जनरेशन कुंजी के बिना, AI से कार्ड बनाना अक्षम है। अनुवाद और मैन्युअल कार्ड अभी भी काम करते हैं। पूर्ण अनुभव के लिए नीचे किसी प्रदाता में कुंजी जोड़ें।',
  "Couldn't load saved settings": 'सहेजी गई सेटिंग्स लोड नहीं हो सकीं',
  'Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key — nothing is sent until you generate a card.':
    'कार्ड जनरेशन (अर्थ, उदाहरण, समूह, वाक्यांश, क्लोज़) नीचे कॉन्फ़िगर और सक्षम किए गए प्रदाता का उपयोग करता है। अपनी खुद की API कुंजी लाएं — जब तक आप कार्ड जनरेट नहीं करते तब तक कुछ नहीं भेजा जाता।',
  'Active provider': 'सक्रिय प्रदाता', Model: 'मॉडल', 'Paste your {{provider}} API key…': 'अपनी {{provider}} API कुंजी पेस्ट करें…',
  'Hide {{provider}} API key': '{{provider}} API कुंजी छिपाएं', 'Show {{provider}} API key': '{{provider}} API कुंजी दिखाएं',
  'Validate key': 'कुंजी सत्यापित करें', Clear: 'साफ़ करें', 'Device-observed usage': 'डिवाइस पर देखा गया उपयोग',
  '{{count}} requests': '{{count}} अनुरोध', '{{count}} tokens': '{{count}} टोकन', 'Open {{provider}} usage ↗': '{{provider}} उपयोग खोलें ↗',
  'Google Translate': 'Google अनुवाद', 'Free tier, no key needed': 'मुफ़्त स्तर, कोई कुंजी आवश्यक नहीं',
  'Uses this provider’s key above': 'इस प्रदाता की ऊपर वाली कुंजी का उपयोग करता है', 'Add a key above to enable': 'सक्षम करने के लिए ऊपर एक कुंजी जोड़ें',
  Active: 'सक्रिय', 'Best German↔English quality — bring your own key': 'सर्वश्रेष्ठ जर्मन↔अंग्रेज़ी गुणवत्ता — अपनी खुद की कुंजी लाएं',
  'Hide DeepL settings': 'DeepL सेटिंग्स छिपाएं', 'Show DeepL settings': 'DeepL सेटिंग्स दिखाएं',
  'Paste your DeepL API key…': 'अपनी DeepL API कुंजी पेस्ट करें…', Enabled: 'सक्षम',
  'Open DeepL usage ↗': 'DeepL उपयोग खोलें ↗', 'v0.0.1 · offline-first · your data stays on device': 'v0.0.1 · ऑफ़लाइन-फर्स्ट · आपका डेटा डिवाइस पर ही रहता है',

  'Opening your vocabulary…': 'आपकी शब्दावली खोली जा रही है…', 'Import & Export': 'आयात और निर्यात', 'Import CSV': 'CSV आयात करें',
  'Import Anki deck': 'Anki डेक आयात करें', 'Card Templates': 'कार्ड टेम्पलेट',
}

export const resources = {
  en: { translation: english },
  de: { translation: complete(de) },
  fr: { translation: complete(fr) },
  es: { translation: complete(es) },
  hi: { translation: complete(hi) },
} as const
