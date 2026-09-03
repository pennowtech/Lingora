import type { Phrase } from './en'

export const es: Partial<Record<Phrase, string>> = {
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

  // Newly added — the redesigned AI Providers help sheet and its matching Audio Settings labels
  'Active Generation Provider': 'Proveedor de generación activo',
  'Pick your active AI engine to generate word definitions, and for smart card creation. Be aware that third-party AI services might train on prompts under certain plans. Need help or have questions?':
    'Elige tu motor de IA activo para generar definiciones de palabras y crear tarjetas inteligentes. Ten en cuenta que los servicios de IA de terceros pueden usar los mensajes para entrenar modelos según ciertos planes. ¿Necesitas ayuda o tienes preguntas?',
  'Contact us →': 'Contáctanos →',
  'Key configured': 'Clave configurada',
  'No key set': 'Sin clave configurada',
  'Select which engine speaks aloud - device voices are free and offline; cloud providers are bring-your-own-key.':
    'Elige qué motor habla en voz alta - las voces del dispositivo son gratuitas y funcionan sin conexión; los proveedores en la nube usan tu propia clave API.',
  'Always available': 'Siempre disponible',
  'Validated': 'Validada',
  'Active provider & automatic fallback': 'Proveedor activo y respaldo automático',
  'Adding and validating a key': 'Añadir y validar una clave',
  'Which provider should I pick?': '¿Qué proveedor debería elegir?',
  'What the usage numbers mean': 'Qué significan las cifras de uso',
  'This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn\'t already know, it hands that word to whichever provider you\'ve marked **Active** below and asks it to build the card.':
    'Aquí es donde una palabra nueva se convierte en una tarjeta completa - significados, frases de ejemplo, grupos de sentido y más. Cada vez que buscas una palabra que Lingora aún no conoce, la entrega al proveedor que hayas marcado como **Activo** abajo y le pide que construya la tarjeta.',
  'It\'s **bring-your-own-key**: Lingora doesn\'t ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn\'t trigger any requests.':
    'Funciona con el principio de **"trae tu propia clave"**: Lingora no incluye una suscripción de IA compartida, así que no se genera nada hasta que pegues tu propia clave API en uno de los proveedores de abajo. Eso también significa que nunca se envía nada a ningún sitio hasta que realmente busques una palabra - guardar una clave por sí sola no dispara ninguna solicitud.',
  'You don\'t need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you\'re curious to try, and start there.':
    'No necesitas rellenar todos los proveedores. Con una sola clave que funcione y esté validada es suficiente - elige el servicio con el que ya tengas cuenta, o el que te dé curiosidad probar, y empieza por ahí.',
  '**Active** is the primary engine currently generating your cards and word explanations. Only one provider is Active at a time, and tapping **Activate** on any validated card sets it as primary immediately.':
    '**Activo** es el motor principal que actualmente genera tus tarjetas y explicaciones de palabras. Solo un proveedor puede estar Activo a la vez; tocar **Activar** en cualquier tarjeta validada lo establece como principal inmediatamente.',
  'As soon as you test and validate an API key, that provider is ready to use and automatically joins your fallback pool.':
    'Tan pronto como pruebes y valides una clave API, ese proveedor estará listo para usarse y se unirá automáticamente a tu grupo de respaldo.',
  'If your Active key runs out of credits or encounters an unexpected rate limit, Lingora automatically falls back to your other validated providers so your card creation never fails.':
    'Si tu clave activa se queda sin créditos o encuentra un límite de frecuencia, Lingora cambia automáticamente a tus otros proveedores validados para que la creación de tarjetas nunca falle.',
  'Tap a provider\'s card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Test & Save Key** - this sends one small real request to confirm the key actually works before you rely on it for word generation.':
    'Toca la tarjeta de un proveedor, pega tu clave API y elige un modelo. Luego pulsa **Probar y guardar clave** para verificar que funciona correctamente.',
  'A provider becomes eligible to be Active as soon as its key validates successfully. That\'s deliberate - it stops a typo\'d or expired key from silently becoming the one thing standing between you and a new card.':
    'Un proveedor puede activarse tan pronto como su clave se valide con éxito. Esto evita que una clave errónea o caducada impida la generación de tarjetas.',
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
  ACTIVE: 'ACTIVO',
  Activate: 'Activar',
  'Active Model': 'Modelo activo',
  'Key saved': 'Clave guardada',
  'No key pasted yet': 'Aún no se ha pegado ninguna clave',
  'Validated · Ready to use': 'Validado · Listo para usar',
  'Connected & Active': 'Conectado y activo',
  'Get key from {{portal}} ↗': 'Obtener clave en {{portal}} ↗',
  'Test & Save Key': 'Probar y guardar clave',
  'Key Validated': 'Clave validada',
  'Advanced Engine & Custom Models': 'Motor avanzado y modelos personalizados',
  'Custom Model Identifier': 'Identificador de modelo personalizado',
  'Active Custom Model': 'Modelo personalizado activo',
  Default: 'Predeterminado',
  'e.g. {{defaultModel}}, custom fine-tune...': 'ej. {{defaultModel}}, modelo personalizado...',
  '{{count}} cards generated': '{{count}} tarjetas generadas',
  'Usage Console ↗': 'Consola de uso ↗',
  Paste: 'Pegar',
  '⚡ Fastest': '⚡ Más rápido',
  '🧠 Deep Nuance': '🧠 Matices profundos',
  '🌐 Multilingual': '🌐 Multilingüe',
  '🌟 Recommended': '🌟 Recomendado',
  '⚡ Fast': '⚡ Rápido',
  '🧠 Deep Quality': '🧠 Alta calidad',
  Legacy: 'Clásico',
  '🆓 Free Tier / Fast': '🆓 Nivel gratuito / Rápido',
  '⚡ Ultra-Light': '⚡ Ultraligero',
  '⚡ Fast & Smart': '⚡ Rápido e inteligente',
  '🧠 Best Nuance': '🧠 Mejores matices',
  '🧠 Deep Grammar': '🧠 Gramática profunda',
  '💰 Economical': '💰 Económico',
  '🧠 Deep Reasoning': '🧠 Razonamiento profundo',
  'Ultra-low latency (~200ms) on Groq LPUs': 'Latencia ultrabaja (~200 ms) en LPUs de Groq',
  'Massive open weights model for complex words': 'Modelo open-weights masivo para palabras complejas',
  'Strong multilingual translation & grammar': 'Gran traducción multilingüe y gramática',
  'Multi-model routing for optimal accuracy': 'Enrutamiento multimodelo para máxima precisión',
  'Fast, accurate & cost-effective ($0.0001/card)': 'Rápido, preciso y económico (0.0001 $/tarjeta)',
  'Next-gen mini reasoning model': 'Modelo mini de razonamiento de última generación',
  'Highest quality reasoning & nuance': 'Máxima calidad en razonamiento y matices',
  'Classic lightweight model': 'Modelo ligero clásico',
  'High speed, generous free quota limits': 'Alta velocidad y generosos límites gratuitos',
  'Fastest lightweight Gemini endpoint': 'Extremo de Gemini ligero más rápido',
  'Rapid responses with Anthropic precision': 'Respuestas rápidas con precisión Anthropic',
  'Gold standard for example sentences & idioms': 'El estándar de oro para frases de ejemplo y modismos',
  'Fast, cost-efficient European hosting': 'Alojamiento europeo rápido y económico',
  'Higher capacity for advanced linguistic queries': 'Mayor capacity para consultas lingüísticas avanzadas',
  'Very low cost with capable language generation': 'Costo muy bajo con generación sólida de lenguaje',
  'Chain-of-thought analysis for complex grammar': 'Análisis paso a paso para gramática compleja',
  '{{provider}} API Key': 'Clave API de {{provider}}',
  'Engine profiles and custom models': 'Perfiles de motor y modelos personalizados',
  'Each provider offers curated **preset engine profiles** tagged with their strengths (such as speed, reasoning, or multilingual quality) so you can pick the best balance for your learning.':
    'Cada proveedor ofrece **perfiles de motor predefinidos** con etiquetas que destacan sus fortalezas (como velocidad, razonamiento o calidad multilingüe) para que elijas el equilibrio ideal para tu aprendizaje.',
  'Under **Advanced Engine & Custom Models**, you can also access provider portal links or enter a **Custom Model Identifier** (e.g. newly released checkpoints, preview models, or private fine-tunes). Setting a custom model identifier automatically overrides the preset profiles.':
    'En **Motor avanzado y modelos personalizados**, también puedes acceder a los enlaces del portal del proveedor o introducir un **Identificador de modelo personalizado** (ej. versiones recién lanzadas, modelos de vista previa o ajustes privados). Configurar un identificador personalizado anula automáticamente los perfiles predefinidos.',
  'How to get an API key': 'Cómo obtener una clave API',
  "Getting an API key takes about a minute. Each provider has a developer portal where you sign up, create a key, and copy it into Lingora. You can tap the **Get key from... ↗** link on any card to open that provider's official portal directly in your browser.":
    'Obtener una clave API solo toma un minuto. Cada proveedor tiene un portal para desarrolladores donde te registras, creas una clave y la pegas en Lingora. Puedes tocar el enlace **Obtener clave en... ↗** en cualquier tarjeta para abrir su portal oficial en el navegador.',
  "**Free-tier options**: If you want to start without adding a payment method, **Google Gemini** (via Google AI Studio) and **Groq** (via Groq Console) offer generous free-tier quotas suitable for daily vocabulary lookups.":
    '**Opciones gratuitas**: Si deseas comenzar sin añadir un método de pago, **Google Gemini** (mediante Google AI Studio) y **Groq** (mediante Groq Console) ofrecen cuotas gratuitas generosas para el estudio diario.',
  "**Pay-as-you-go options**: Providers like **OpenAI**, **Anthropic (Claude)**, **Mistral**, and **DeepSeek** use pay-as-you-go billing with prepaid balances. Generating a full vocabulary card typically costs less than a tenth of a cent ($0.0001 - $0.001 per card), so a small credit can last for thousands of words.":
    '**Opciones de pago por uso**: Proveedores como **OpenAI**, **Anthropic (Claude)**, **Mistral** y **DeepSeek** utilizan saldo prepagado por uso. Generar una tarjeta completa suele costar menos de una décima de centavo ($0.0001 - $0.001 por tarjeta), por lo que un crédito pequeño rinde para miles de palabras.',
  "Once a key is validated, the developer portal link remains readily accessible anytime under **Advanced Engine & Custom Models**.":
    'Una vez validada la clave, el enlace al portal para desarrolladores permanece siempre accesible en **Motor avanzado y modelos personalizados**.',
  'Selected Model': 'Modelo seleccionado',
  'Pending: {{model}}': 'Pendiente: {{model}}',
  'Needs Key Validation': 'Requiere validación de clave',
  'Test & Switch Model': 'Probar y cambiar modelo',
  'Fastest next-gen lightweight Gemini model': 'Modelo Gemini ligero de última generación más rápido',
  'Lightweight ultra-fast model': 'Modelo ligero ultrarrápido',
  'Next-gen lightweight model': 'Modelo ligero de nueva generación',
  'When you tap **"Add to deck"**, small **icon badges** next to each deck show which *study formats* it practices with:':
    'Al tocar **"Añadir al mazo"**, pequeñas **insignias de iconos** junto a cada mazo muestran con qué *formatos de estudio* se practica:',
  'AI Enrichment Incomplete': 'Enriquecimiento por IA incompleto',
  "The AI's response for this word wasn't complete, so nothing was saved. Try Regenerate to try again.":
    'La respuesta de la IA para esta palabra no fue completa, por lo que no se guardó nada. Toca Regenerar para volver a intentarlo.',
  'Study Progress and Decks': 'Progreso de estudio y mazos',
  'Study Progress': 'Progreso de estudio',
  '{{rate}}% 30-day memory retention': '{{rate}}% de retención a 30 días',
  'Review cards regularly to build retention': 'Repasa tarjetas con frecuencia para consolidar la memoria',
  'Stats ↗': 'Estadísticas ↗',
  'View study statistics': 'Ver estadísticas de estudio',
  '{{due}} cards due today': '{{due}} tarjetas pendientes hoy',
  '{{total}} total cards in {{decks}} decks': '{{total}} tarjetas en total en {{decks}} mazos',
  "OpenAI's open-weight model, fast on Groq LPUs": 'Modelo de pesos abiertos de OpenAI, rápido en LPUs de Groq',
  'Study & Mine': 'Estudiar y Extraer',
  'Mining Studio Help': 'Ayuda de Mining Studio',
  'Mining Studio & Captured Passages': 'Mining Studio y pasajes capturados',
  'Clearing passages': 'Borrar pasajes',
  'How Passage Mining works': 'Cómo funciona el análisis de pasajes',
  'Adding words to your decks': 'Añadir palabras a tus mazos',
  'The **Mining Studio** stores passages and sentences captured from your reading, browsing, and clipboard.':
    'El **Mining Studio** guarda los pasajes y frases que capturas al leer, navegar o desde el portapapeles.',
  'Tap anywhere on a passage - or its **Study & Mine** button - to see its fluent translation, grammar breakdown, and extracted vocabulary.':
    'Toca en cualquier parte de un pasaje - o su botón **Estudiar y Extraer** - para ver su traducción fluida, el desglose gramatical y el vocabulario extraído.',
  'A passage with a *tinted green background* and a **Mined** badge already had at least one card mined from it.':
    'Un pasaje con *fondo verde* y la insignia **Extraído** ya ha generado al menos una tarjeta.',
  'Tap the checkbox on any passage to select it, then **Delete Selected** to remove just those.':
    'Toca la casilla de cualquier pasaje para seleccionarlo y luego **Eliminar selección** para quitar solo esos.',
  '**Clear All** at the top removes every captured passage at once - your mined cards are *never* affected, only the captures themselves.':
    '**Borrar todo**, arriba, elimina todos los pasajes capturados a la vez - tus tarjetas ya generadas *nunca* se ven afectadas, solo las capturas en sí.',
  '**Passage Mining** analyzes the whole passage at once: a fluent translation, a grammar breakdown, and a shortlist of key vocabulary.':
    'El **análisis de pasajes** analiza todo el texto a la vez: una traducción fluida, un desglose gramatical y una selección de vocabulario clave.',
  'Grammar explanations and word difficulty are automatically tailored to *your CEFR level* from Settings.':
    'Las explicaciones gramaticales y la dificultad de las palabras se ajustan automáticamente a *tu nivel MCER* desde Ajustes.',
  'A **tinted green background** on the passage means at least one card has already been mined from it.':
    'Un **fondo verde** en el pasaje significa que ya se ha generado al menos una tarjeta a partir de él.',
  'Select any key words extracted from the passage and tap **Add to Deck**.':
    'Selecciona las palabras clave extraídas del pasaje y toca **Añadir al mazo**.',
  'Selected words are generated as full flashcards, with the source sentence saved as your example.':
    'Las palabras seleccionadas se generan como tarjetas completas, guardando la frase de origen como tu ejemplo.',
  'A word you already have a card for is reported as **already present**, never as failed - nothing is duplicated or overwritten.':
    'Una palabra para la que ya tienes una tarjeta se marca como **ya presente**, nunca como fallida - nada se duplica ni se sobrescribe.',
  'Re-analyzing a passage': 'Volver a analizar un pasaje',
  'Tap the refresh icon next to the passage to *regenerate* its translation and grammar breakdown.':
    'Toca el icono de actualizar junto al pasaje para *regenerar* su traducción y desglose gramatical.',
  'Useful if the first analysis missed something, or after you change your CEFR level in Settings.':
    'Útil si el primer análisis se saltó algo, o después de cambiar tu nivel MCER en Ajustes.',
  'What is Mining Studio?': '¿Qué es Mining Studio?',
  'Capture any passage you read - an article, a message, a subtitle - and one tap turns it into a **translation**, a **grammar** breakdown at your level, and ready-made **flashcards** for the words worth learning. No manual lookup, no dictionary-hopping.':
    'Captura cualquier pasaje que leas - un artículo, un mensaje, un subtítulo - y con un toque obtienes su **traducción**, un desglose de **gramática** a tu nivel y **tarjetas** listas para las palabras que vale la pena aprender. Sin búsquedas manuales, sin saltar de diccionario en diccionario.',
  'Instant Lookup and Card Generations': 'Búsqueda instantánea y creación de tarjetas',
  'Look up any {{target}} or {{native}} word instantly - inflected and conjugated forms work too. Not in your library yet? One tap **generates a full flashcard** with meanings, examples, and pronunciation, so you never have to leave the app to look something up.':
    'Busca cualquier palabra en {{target}} o {{native}} al instante - las formas flexionadas y conjugadas también funcionan. ¿Aún no está en tu biblioteca? Un toque **genera una tarjeta completa** con significados, ejemplos y pronunciación, para que nunca tengas que salir de la app para buscar algo.',
  "**Search** is how you look up any word without leaving the app: type it and get results instantly, and if it's new to you, one tap **generates a full flashcard** with meanings, examples, and pronunciation.":
    '**Buscar** es la forma de consultar cualquier palabra sin salir de la app: escríbela y obtén resultados al instante, y si es nueva para ti, un toque **genera una tarjeta completa** con significados, ejemplos y pronunciación.',
  'Feedback is posted as a public GitHub issue - this email will be visible to anyone who views it.':
    'Los comentarios se publican como un issue público de GitHub - este correo será visible para cualquiera que lo vea.',
  'Your email will be public': 'Tu correo será público',
  "Feedback is posted as a public GitHub issue. The email address you entered will be visible there to anyone who views it - not just our team. Go back to remove it if you'd rather keep it private, or send it as-is if that's fine.":
    'Los comentarios se publican como un issue público de GitHub. La dirección de correo que introdujiste será visible allí para cualquiera que lo vea, no solo para nuestro equipo. Vuelve atrás para eliminarla si prefieres mantenerla privada, o envíala tal cual si te parece bien.',
  'Go Back': 'Volver',
  'Send Anyway': 'Enviar de todos modos',
}
