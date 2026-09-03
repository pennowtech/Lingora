import type { Phrase } from './en'

export const fr: Partial<Record<Phrase, string>> = {
Home: 'Accueil',
  Search: 'Recherche',
  Decks: 'Paquets',
  Mine: 'À moi',
  Mining: 'Minage',
  'Feature Guides': 'Guides des fonctionnalités',
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
  'Nice to See you back': 'Content de te revoir !',
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
  'Pick your active AI engine to generate word definitions, and for smart card creation. Be aware that third-party AI services might train on prompts under certain plans. Need help or have questions?':
    'Choisis ton moteur IA actif pour générer les définitions de mots et créer des cartes intelligentes. Note que les services IA tiers peuvent utiliser les invites pour l\'entraînement selon certains forfaits. Besoin d\'aide ou des questions ?',
  'Contact us →': 'Contacte-nous →',
  'Key configured': 'Clé configurée',
  'No key set': 'Aucune clé définie',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.':
    'Choisis quel moteur lit à voix haute - les voix de l\'appareil sont gratuites et fonctionnent hors ligne ; les fournisseurs cloud utilisent ta propre clé API.',
  'Always available': 'Toujours disponible',
  'Validated': 'Validée',
  'Active provider & automatic fallback': 'Fournisseur actif et secours automatique',
  'Adding and validating a key': 'Ajouter et valider une clé',
  'Which provider should I pick?': 'Quel fournisseur choisir ?',
  'What the usage numbers mean': 'Ce que signifient les chiffres d\'utilisation',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.':
    'C\'est ici qu\'un nouveau mot devient une carte complète - significations, phrases d\'exemple, groupes de sens, et plus encore. Dès que tu recherches un mot que Lingora ne connaît pas encore, l\'app le transmet au fournisseur que tu as marqué comme **Actif** ci-dessous et lui demande de construire la carte.',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.':
    'C\'est le principe **« apporte ta propre clé »** : Lingora ne fournit pas d\'abonnement IA partagé, donc rien n\'est généré tant que tu n\'as pas collé ta propre clé API pour l\'un des fournisseurs ci-dessous. Cela signifie aussi que rien n\'est jamais envoyé nulle part tant que tu ne recherches pas réellement un mot - avoir simplement une clé enregistrée ne déclenche aucune requête.',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.':
    'Tu n\'as pas besoin de remplir tous les fournisseurs. Une seule clé fonctionnelle et validée suffit - choisis le service pour lequel tu as déjà un compte, ou celui que tu as envie d\'essayer, et commence par là.',
  '**Active** is the primary engine currently generating your cards and word explanations. Only one provider is Active at a time, and tapping **Activate** on any validated card sets it as primary immediately.':
    '**Actif** est le moteur principal qui génère actuellement vos cartes et explications. Un seul fournisseur peut être Actif à la fois ; toucher **Activer** sur une carte validée le définit immédiatement comme moteur principal.',
  'As soon as you test and validate an API key, that provider is ready to use and automatically joins your fallback pool.':
    'Dès que vous testez et validez une clé API, ce fournisseur est prêt à l’emploi et rejoint automatiquement votre groupe de secours.',
  'If your Active key runs out of credits or encounters an unexpected rate limit, Lingora automatically falls back to your other validated providers so your card creation never fails.':
    'Si votre clé active est à court de crédits ou atteint une limite, Lingora bascule automatiquement sur vos autres fournisseurs validés afin que la création de cartes ne s’interrompe jamais.',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Test & Save Key** - this sends one small real request to confirm the key actually works before you rely on it for word generation.':
    'Touchez la carte d’un fournisseur, collez votre clé API et choisissez un modèle. Touchez ensuite **Tester et enregistrer la clé** pour vérifier son bon fonctionnement.',
  'A provider becomes eligible to be Active as soon as its key validates successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.':
    'Un fournisseur devient activable dès que sa clé est validée avec succès. Cela évite qu’une clé erronée ou expirée ne bloque la génération de cartes.',
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
  ACTIVE: 'ACTIF',
  Activate: 'Activer',
  'Active Model': 'Modèle actif',
  'Key saved': 'Clé enregistrée',
  'No key pasted yet': 'Aucune clé collée pour le moment',
  'Validated · Ready to use': 'Validé · Prêt à l’emploi',
  'Connected & Active': 'Connecté et actif',
  'Get key from {{portal}} ↗': 'Obtenir une clé sur {{portal}} ↗',
  'Test & Save Key': 'Tester et enregistrer la clé',
  'Key Validated': 'Clé validée',
  'Advanced Engine & Custom Models': 'Moteur avancé et modèles personnalisés',
  'Custom Model Identifier': 'Identifiant de modèle personnalisé',
  'Active Custom Model': 'Modèle personnalisé actif',
  Default: 'Par défaut',
  'e.g. {{defaultModel}}, custom fine-tune...': 'ex. {{defaultModel}}, modèle personnalisé...',
  '{{count}} cards generated': '{{count}} cartes générées',
  'Usage Console ↗': 'Console d’utilisation ↗',
  Paste: 'Coller',
  '⚡ Fastest': '⚡ Le plus rapide',
  '🧠 Deep Nuance': '🧠 Nuances approfondies',
  '🌐 Multilingual': '🌐 Multilingue',
  '🌟 Recommended': '🌟 Recommandé',
  '⚡ Fast': '⚡ Rapide',
  '🧠 Deep Quality': '🧠 Haute qualité',
  Legacy: 'Classique',
  '🆓 Free Tier / Fast': '🆓 Niveau gratuit / Rapide',
  '⚡ Ultra-Light': '⚡ Ultra-léger',
  '⚡ Fast & Smart': '⚡ Rapide et intelligent',
  '🧠 Best Nuance': '🧠 Meilleures nuances',
  '🧠 Deep Grammar': '🧠 Grammaire approfondie',
  '💰 Economical': '💰 Économique',
  '🧠 Deep Reasoning': '🧠 Raisonnement approfondi',
  'Ultra-low latency (~200ms) on Groq LPUs': 'Latence ultra-faible (~200 ms) sur les LPU Groq',
  'Massive open weights model for complex words': 'Grand modèle open-weights pour les termes complexes',
  'Strong multilingual translation & grammar': 'Excellente traduction multilingue et grammaire',
  'Multi-model routing for optimal accuracy': 'Routage multi-modèles pour une précision optimale',
  'Fast, accurate & cost-effective ($0.0001/card)': 'Rapide, précis et économique (0,0001 $/carte)',
  'Next-gen mini reasoning model': 'Modèle mini de raisonnement de nouvelle génération',
  'Highest quality reasoning & nuance': 'Qualité maximale pour le raisonnement et les nuances',
  'Classic lightweight model': 'Modèle léger classique',
  'High speed, generous free quota limits': 'Vitesse élevée, quotas gratuits généreux',
  'Fastest lightweight Gemini endpoint': 'Point de terminaison Gemini léger le plus rapide',
  'Rapid responses with Anthropic precision': 'Réponses rapides avec la précision Anthropic',
  'Gold standard for example sentences & idioms': 'Référence pour les phrases d’exemple et expressions',
  'Fast, cost-efficient European hosting': 'Hébergement européen rapide et économique',
  'Higher capacity for advanced linguistic queries': 'Capacité accrue pour les requêtes linguistiques complexes',
  'Very low cost with capable language generation': 'Très faible coût pour une génération solide',
  'Chain-of-thought analysis for complex grammar': 'Raisonnement pas à pas pour la grammaire complexe',
  '{{provider}} API Key': 'Clé API {{provider}}',
  'Engine profiles and custom models': 'Profils de moteur et modèles personnalisés',
  'Each provider offers curated **preset engine profiles** tagged with their strengths (such as speed, reasoning, or multilingual quality) so you can pick the best balance for your learning.':
    'Chaque fournisseur propose des **profils de moteur prédéfinis** accompagnés de leurs points forts (tels que la rapidité, le raisonnement ou la qualité multilingue) pour trouver le juste équilibre pour votre apprentissage.',
  'Under **Advanced Engine & Custom Models**, you can also access provider portal links or enter a **Custom Model Identifier** (e.g. newly released checkpoints, preview models, or private fine-tunes). Setting a custom model identifier automatically overrides the preset profiles.':
    'Sous **Moteur avancé et modèles personnalisés**, vous pouvez également accéder aux liens du portail fournisseur ou saisir un **Identifiant de modèle personnalisé** (ex. points de contrôle récents, modèles en aperçu ou affinages privés). La configuration d’un identifiant personnalisé remplace automatiquement les profils prédéfinis.',
  'How to get an API key': 'Comment obtenir une clé API',
  "Getting an API key takes about a minute. Each provider has a developer portal where you sign up, create a key, and copy it into Lingora. You can tap the **Get key from... ↗** link on any card to open that provider's official portal directly in your browser.":
    'Obtenir une clé API ne prend qu\'une minute. Chaque fournisseur dispose d\'un portail développeur où vous pouvez vous inscrire, créer une clé et la coller dans Lingora. Vous pouvez appuyer sur le lien **Obtenir une clé sur... ↗** sur n\'importe quelle carte pour ouvrir son portail officiel dans votre navigateur.',
  "**Free-tier options**: If you want to start without adding a payment method, **Google Gemini** (via Google AI Studio) and **Groq** (via Groq Console) offer generous free-tier quotas suitable for daily vocabulary lookups.":
    '**Options gratuites** : Si vous souhaitez démarrer sans ajouter de moyen de paiement, **Google Gemini** (via Google AI Studio) et **Groq** (via Groq Console) offrent des quotas gratuits généreux adaptés à l\'apprentissage quotidien.',
  "**Pay-as-you-go options**: Providers like **OpenAI**, **Anthropic (Claude)**, **Mistral**, and **DeepSeek** use pay-as-you-go billing with prepaid balances. Generating a full vocabulary card typically costs less than a tenth of a cent ($0.0001 - $0.001 per card), so a small credit can last for thousands of words.":
    '**Options payantes à l\'usage** : Les fournisseurs comme **OpenAI**, **Anthropic (Claude)**, **Mistral** et **DeepSeek** fonctionnent avec un solde prépayé. La génération d\'une carte de vocabulaire complète coûte généralement moins d\'un dixième de centime (0,0001 $ - 0,001 $ par carte), ainsi un petit crédit permet de générer des milliers de mots.',
  "Once a key is validated, the developer portal link remains readily accessible anytime under **Advanced Engine & Custom Models**.":
    'Une fois la clé validée, le lien vers le portail développeur reste accessible à tout moment sous **Moteur avancé et modèles personnalisés**.',
  'Selected Model': 'Modèle sélectionné',
  'Pending: {{model}}': 'En attente : {{model}}',
  'Needs Key Validation': 'Validation de clé requise',
  'Test & Switch Model': 'Tester et changer de modèle',
  'Fastest next-gen lightweight Gemini model': 'Modèle Gemini léger de nouvelle génération le plus rapide',
  'Lightweight ultra-fast model': 'Modèle léger ultra-rapide',
  'Next-gen lightweight model': 'Modèle léger de nouvelle génération',
  'When you tap **"Add to deck"**, small **icon badges** next to each deck show which *study formats* it practices with:':
    'Lorsque vous appuyez sur **« Ajouter au paquet »**, de petits **badges d\'icônes** à côté de chaque paquet indiquent les *formats d\'apprentissage* utilisés :',
  'AI Enrichment Incomplete': 'Enrichissement IA incomplet',
  "The AI's response for this word wasn't complete, so nothing was saved. Try Regenerate to try again.":
    'La réponse de l\'IA pour ce mot était incomplète, rien n\'a donc été enregistré. Appuyez sur Régénérer pour réessayer.',
  'Study Progress and Decks': 'Progression d\'étude et paquets',
  'Study Progress': 'Progression d\'étude',
  '{{rate}}% 30-day memory retention': '{{rate}} % de rétention mémorielle à 30 jours',
  'Review cards regularly to build retention': 'Révisez régulièrement pour consolider votre rétention',
  'Stats ↗': 'Stats ↗',
  'View study statistics': 'Voir les statistiques d\'apprentissage',
  '{{due}} cards due today': '{{due}} cartes à revoir aujourd\'hui',
  '{{total}} total cards in {{decks}} decks': '{{total}} cartes au total dans {{decks}} paquets',
  "OpenAI's open-weight model, fast on Groq LPUs": 'Modèle open-weight d\'OpenAI, rapide sur les LPU Groq',
  'Study & Mine': 'Étudier et extraire',
  'Mining Studio Help': 'Aide du Mining Studio',
  'Mining Studio & Captured Passages': 'Mining Studio et passages capturés',
  'Clearing passages': 'Supprimer des passages',
  'How Passage Mining works': "Comment fonctionne l'analyse de passages",
  'Adding words to your decks': 'Ajouter des mots à vos paquets',
  'The **Mining Studio** stores passages and sentences captured from your reading, browsing, and clipboard.':
    'Le **Mining Studio** conserve les passages et phrases capturés pendant vos lectures, votre navigation ou depuis le presse-papiers.',
  'Tap anywhere on a passage - or its **Study & Mine** button - to see its fluent translation, grammar breakdown, and extracted vocabulary.':
    'Touchez n\'importe où sur un passage - ou son bouton **Étudier et extraire** - pour voir sa traduction fluide, l\'analyse grammaticale et le vocabulaire extrait.',
  'A passage with a *tinted green background* and a **Mined** badge already had at least one card mined from it.':
    'Un passage avec un *fond teinté de vert* et le badge **Extrait** a déjà produit au moins une carte.',
  'Tap the checkbox on any passage to select it, then **Delete Selected** to remove just those.':
    'Cochez la case d\'un passage pour le sélectionner, puis **Supprimer la sélection** pour ne retirer que ceux-là.',
  '**Clear All** at the top removes every captured passage at once - your mined cards are *never* affected, only the captures themselves.':
    '**Tout supprimer**, en haut, retire tous les passages capturés d\'un coup - vos cartes déjà extraites ne sont *jamais* affectées, seules les captures le sont.',
  '**Passage Mining** analyzes the whole passage at once: a fluent translation, a grammar breakdown, and a shortlist of key vocabulary.':
    'L\'**analyse de passage** traite tout le texte en une fois : une traduction fluide, une analyse grammaticale et une sélection de vocabulaire clé.',
  'Grammar explanations and word difficulty are automatically tailored to *your CEFR level* from Settings.':
    'Les explications grammaticales et la difficulté des mots s\'adaptent automatiquement à *votre niveau CECR* défini dans les Réglages.',
  'A **tinted green background** on the passage means at least one card has already been mined from it.':
    "Un **fond teinté de vert** sur le passage signifie qu'au moins une carte en a déjà été extraite.",
  'Select any key words extracted from the passage and tap **Add to Deck**.':
    'Sélectionnez les mots clés extraits du passage et touchez **Ajouter au paquet**.',
  'Selected words are generated as full flashcards, with the source sentence saved as your example.':
    'Les mots sélectionnés sont générés en cartes complètes, avec la phrase source enregistrée comme exemple.',
  'A word you already have a card for is reported as **already present**, never as failed - nothing is duplicated or overwritten.':
    'Un mot pour lequel vous avez déjà une carte est signalé comme **déjà présent**, jamais comme échoué - rien n\'est dupliqué ni écrasé.',
  'Re-analyzing a passage': 'Réanalyser un passage',
  'Tap the refresh icon next to the passage to *regenerate* its translation and grammar breakdown.':
    "Touchez l'icône d'actualisation à côté du passage pour *régénérer* sa traduction et son analyse grammaticale.",
  'Useful if the first analysis missed something, or after you change your CEFR level in Settings.':
    'Utile si la première analyse a manqué quelque chose, ou après avoir changé votre niveau CECR dans les Réglages.',
  'What is Mining Studio?': "Qu'est-ce que le Mining Studio ?",
  'Capture any passage you read - an article, a message, a subtitle - and one tap turns it into a **translation**, a **grammar** breakdown at your level, and ready-made **flashcards** for the words worth learning. No manual lookup, no dictionary-hopping.':
    "Capturez n'importe quel passage que vous lisez - un article, un message, un sous-titre - et une simple pression vous donne sa **traduction**, une analyse de **grammaire** à votre niveau, et des **cartes** prêtes à l'emploi pour les mots qui valent la peine d'être appris. Pas de recherche manuelle, pas de va-et-vient entre dictionnaires.",
  'Instant Lookup and Card Generations': 'Recherche instantanée et création de cartes',
  'Look up any {{target}} or {{native}} word instantly - inflected and conjugated forms work too. Not in your library yet? One tap **generates a full flashcard** with meanings, examples, and pronunciation, so you never have to leave the app to look something up.':
    "Cherchez instantanément n'importe quel mot en {{target}} ou en {{native}} - les formes fléchies et conjuguées fonctionnent aussi. Pas encore dans votre bibliothèque ? Une pression **génère une carte complète** avec les sens, des exemples et la prononciation, pour ne jamais avoir à quitter l'application pour chercher un mot.",
  "**Search** is how you look up any word without leaving the app: type it and get results instantly, and if it's new to you, one tap **generates a full flashcard** with meanings, examples, and pronunciation.":
    "La **Recherche** permet de consulter n'importe quel mot sans quitter l'application : tapez-le et obtenez des résultats instantanément, et s'il est nouveau pour vous, une pression **génère une carte complète** avec les sens, des exemples et la prononciation.",
  'Feedback is posted as a public GitHub issue - this email will be visible to anyone who views it.':
    "Les retours sont publiés sous forme d'issue GitHub publique - cet e-mail sera visible par quiconque la consulte.",
  'Your email will be public': 'Votre e-mail sera public',
  "Feedback is posted as a public GitHub issue. The email address you entered will be visible there to anyone who views it - not just our team. Go back to remove it if you'd rather keep it private, or send it as-is if that's fine.":
    "Les retours sont publiés sous forme d'issue GitHub publique. L'adresse e-mail que vous avez saisie y sera visible par quiconque la consulte - pas seulement par notre équipe. Revenez en arrière pour la supprimer si vous préférez la garder privée, ou envoyez tel quel si cela vous convient.",
  'Go Back': 'Retour',
  'Send Anyway': 'Envoyer quand même',
}
