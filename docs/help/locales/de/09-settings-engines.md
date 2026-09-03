# ⚙️ Einstellungen und Konfiguration

Der Bildschirm **Einstellungen** ist Ihr Kontrollzentrum in Lemmory. Damit können Sie alles an Ihren Lernstil anpassen – von Themen und Textgrößen bis hin zu Bring-Your-Own-Key (BYOK)-KI-Engines, hochauflösenden neuronalen Stimmen, FSRS-Algorithmen für räumliche Wiederholungen, Kartenvorlagen-Design und geräteübergreifender Cloud-Synchronisierung.

![Der Einstellungsbildschirm, gegliedert in Lernen & Sprechen, KI & Übersetzung, Bibliothek & Inhalte und System & Konto](settings-ai-engines)

---

## 🔍 Detaillierte Aufschlüsselung der Einstellungen

### 🔎 Suchleiste für Schnelleinstellungen
Oben im Einstellungsbildschirm indiziert eine Sofortsuchleiste alle Einstellungen und Schlüsselwörter in der App:
- Geben Sie **"voice"**, **"tts"** oder **"speed"** ein. $\rightarrow$ springt direkt zu Audio & Aussprache.
- Geben Sie **"anki"**, **"apkg"** oder **"csv"** ein. $\rightarrow$ springt zu den Import- und Export-Assistenten.
- Geben Sie **"gemini"**, **"claude"** oder **"api key"** ein. $\rightarrow$ springt zu KI-Anbietern.
- Geben Sie **"dark mode"** oder **"theme"** ein. $\rightarrow$ springt zu „Allgemeines und Erscheinungsbild“.

---

## 1. 🎓 Lernen und Sprechen

### A. 🔊 Audio und Aussprache
Konfigurieren Sie, wie Vokabeln, Phrasen und Beispielsätze in der gesamten App laut gesprochen werden.

- **Synthesizer-Engines**:
  - **Auf dem Gerät (natives Betriebssystem)**: Hochgeschwindigkeits-Text-zu-Sprache, 100 % offline, direkt über iOS oder Android. Kostenlos, zuverlässig und erfordert weder einen API-Schlüssel noch eine Internetverbindung.
  - **OpenAI Audio TTS**: Ultranatürliche neuronale Stimmen, unterstützt von „gpt-4o-mini-tts“, mit den neuesten High-Fidelity-Stimmen („marin“ ★, „cedar“ ★) neben Klassikern („alloy“, „echo“, „fable“, „onyx“, „nova“, „shimmer“).
  - **ElevenLabs**: Menschenähnliche ausdrucksstarke Stimmen („eleven_multilingual_v2“). Wählen Sie aus Ihrer persönlichen ElevenLabs-Sprachbibliothek oder fügen Sie manuell eine beliebige geklonte Sprach-ID ein.
  - **Deepgram**: Echtzeit-Sprachsynthesizer mit extrem geringer Latenz, angetrieben durch **Aura-2**-Modelle, die auf Englisch, Deutsch, Spanisch, Französisch und mehrsprachige Sprache zugeschnitten sind.
  - **Google Cloud TTS**: Globaler High-Fidelity-WaveNet- und Neural2-Sprachkatalog.
- **Stimmenauswahl und benutzerdefinierter Modus**: Wählen Sie bevorzugte männliche oder weibliche Stimmen aus, die auf Ihre Zielsprache zugeschnitten sind, oder wechseln Sie zur manuellen Eingabe, um benutzerdefinierte Stimmen-IDs einzufügen.
- **Geschwindigkeits- und Tonhöhensteuerung**: Passen Sie die Geschwindigkeit der Sprachwiedergabe an (vom 0,5-fachen langsamer Aussprache für Anfänger bis zum 2,0-fachen) und optimieren Sie die Stimmhöhe.
- **Echtzeit-Nutzungsverfolgung**: Überwachen Sie den Zeichenverbrauch und die Anzahl der Anfragen pro Anbieter mit einem einfachen Zurücksetzen.
- **Beispiel-Audiovorschau**: Tippen Sie auf **Diesen Anbieter testen** oder **Aktive Engine testen**, um die Beispielphrase Ihrer Zielsprache anzuhören, bevor Sie Änderungen übernehmen.
- **Automatischer Fallback auf das Gerät**: Wenn ein Cloud-Anbieter nicht erreichbar ist oder kein Guthaben mehr vorhanden ist, greift Lemmory automatisch auf die Gerätestimme zurück, sodass Ihr Karteikartenstudium nie durch Stille unterbrochen wird.
- **Audio-Cache-Verwaltung**: Cachet generierte Aussprachen auf Ihrem Gerät, um Latenz und Bandbreitenverbrauch zu minimieren. Tippen Sie auf **Audio-Cache löschen**, um jederzeit lokalen Speicher freizugeben.

---

### B. 🎓 Sprache & Niveau
Definieren Sie Ihr aktives Lernpaar, den Standardschwierigkeitsgrad, die Größe der Wiederholungssitzungen und tägliche Lernerinnerungen.

- **Sprachpaarkonfiguration**:
  - **„Ich spreche“ (Muttersprache)**: Die Sprache, die für Definitionen, Übersetzungen, Grammatikaufschlüsselungen, Etymologienotizen und Erklärungen von KI-Tutoren verwendet wird (z. B. Englisch, Deutsch, Spanisch, Französisch, Hindi, Vietnamesisch, Japanisch).
  - **„Ich lerne“ (Zielsprache)**: Die Sprache, die Sie aktiv lernen. Alle Wörterbuchsuchen, generierten Beispielsätze, Lückentexte und Text-to-Speech-Audio verwenden automatisch diese Sprache.
  - **Intelligente Synchronisierung der App-Sprache**: Wenn Sie Ihre Muttersprache ändern, bietet Lemmory eine One-Tap-Option, um die Sprache der gesamten App-Benutzeroberfläche entsprechend zu aktualisieren. Aber das ist nicht erforderlich. Sie können die Benutzeroberfläche Ihrer App auf eine beliebige Sprache einstellen. Sie können beispielsweise die Sprache Ihrer App auf Englisch einstellen, während Sie Erklärungen auf Hindi erhalten und Deutsch lernen.
- **Standard-CEFR-Kompetenzniveau**: Wählen Sie Ihren Grundschwierigkeitsgrad („A1“, „A2“, „B1“, „B2“, „C1“, „C2“):
  - **A1–A2 (Anfänger)**: KI generiert kurze, einfache Sätze mit grundlegendem Vokabular und gebräuchlichen Alltagsverben.
  - **B1–B2 (Mittelstufe)**: KI führt zusammengesetzte Sätze, Nebensätze und situative Redewendungen ein.
  - **C1–C2 (Fortgeschritten)**: KI erstellt anspruchsvolle literarische Kontexte, Fachterminologie und subtile semantische Nuancen.
- **Karten pro Sitzung (Sitzungslimit)**:
  - Begrenzt die Anzahl der fälligen Karten, die in eine einzelne Überprüfungssitzung eingezogen werden (z. B. 10, 20, 30, 50 oder No Limit), wobei die am längsten überfälligen Karten zuerst priorisiert werden.
  - Verhindert Lern-Burnout und ermöglicht Ihnen gleichzeitig, auf **Mehr üben** zu tippen, um sofort eine weitere konzentrierte Runde zu starten.
- **Tägliche Benachrichtigung zum Wort des Tages**:
  - Planen Sie eine stündliche Erinnerung (6:00 – 22:00 Uhr), um Ihr kuratiertes tägliches Vokabelwort genau dann zu liefern, wenn Sie es am liebsten lernen.
- **Abstandswiederholungsalgorithmus**:
  - **FSRS (Free Spaced Repetition Scheduler)** *(Empfohlen)*: Hochmoderner Algorithmus basierend auf Speicherstabilität und Abrufbarkeit, was zu deutlich weniger täglichen Bewertungen bei höherer Langzeiterinnerung führt.
  - **SM-2**: Der klassische 4-Tasten-Wiederholungsalgorithmus, der von herkömmlichen Lernkarten-Apps verwendet wird.
  - **Zielretention**: Passen Sie Ihre gewünschte Erinnerungsrate an (z. B. 90 %).

---

## 2. 🤖 KI & Übersetzung

### A. ✨ KI-Anbieter und -Modelle (Bring-Your-Own-Key)
Verbinden Sie persönliche API-Schlüssel von führenden KI-Anbietern. Lemmory verarbeitet Generationen direkt von Ihrem Gerät zum KI-Anbieter, ohne Zwischenserver.

![Der Bildschirm KI-Anbieter mit einem validierten OpenAI-Schlüssel, aktiv neben Groq, Mistral und Gemini](ai-providers-settings)

> **Datenschutzerklärung**: Wählen Sie Ihre aktive KI-Engine zur Generierung von Wortdefinitionen und zur Smartcard-Erstellung. Beachten Sie, dass KI-Dienste von Drittanbietern bei bestimmten Plänen (insbesondere bei kostenlosen Tarifen und ausgewählten kostenpflichtigen Konten) auf Eingabeaufforderungen trainieren können. Haben Sie Fragen? Sie können uns direkt über das In-App-Feedback-Formular kontaktieren („Einstellungen > Über & Support > Feedback senden**).

- **Unterstützte KI-Anbieter**:
  - **Google Gemini**: Großzügige Free-Tier-Limits über Google AI Studio („gemini-3.5-flash-lite“, „gemini-2.5-flash“).
  - **Groq**: Offene Modelle mit extrem niedriger Latenz, die auf LPU-Chips laufen („llama-3.3-70b-versatile“, „llama-3.1-8b-instant“).
  - **OpenAI**: Strukturierte Sprachausgabe nach Industriestandard („gpt-4o-mini“, „gpt-4.1-mini“, „gpt-4o“, „gpt-3.5-turbo“).
  - **Mistral**: In Europa gehostete, datenschutzbewusste Modelle („mistral-small-latest“, „mistral-medium-latest“).
  - **Claude (Anthropic)**: Außergewöhnliches sprachliches Denken und natürliche Redewendungserklärungen („claude-haiku-4-5-20251001“, „claude-sonnet-5“).
  - **DeepSeek**: Hohe Leistungsfähigkeit und günstige Preise („deepseek-chat“, „deepseek-reasoner“).
- **Kuratierte Modellprofile**: Wählen Sie voreingestellte Profile aus, die nach Leistung gekennzeichnet sind (z. B. *⚡ Ultra-Light*, *🌟 Empfohlen*, *🧠 Deep Quality*).
- **Benutzerdefinierte Modellüberschreibung**: Fortgeschrittene Benutzer können jede vom Anbieter unterstützte benutzerdefinierte Modellkennungszeichenfolge eingeben.
- **Entwurfsmodellauswahl**: Die Auswahl eines neuen Modells in der Schublade fungiert als zerstörungsfreier Entwurf. Ihre bestehende aktive Verbindung läuft ununterbrochen weiter, bis Sie auf **`Modell testen und wechseln** tippen.
- **Direkte Portal-Links („Schlüssel abrufen von... ↗`)**: Eine Tastenkombination öffnet das Entwicklerportal des Anbieters in Ihrem Browser, um einen Schlüssel zu generieren. Sobald ein Schlüssel validiert ist, wird der Setup-Link automatisch in einer erweiterten Schublade ausgeblendet.
- **Sicherheit und Datenschutz**: API-Schlüssel werden ausschließlich im nativen, hardwaregestützten sicheren Speicher Ihres Geräts gespeichert (**Apple Schlüsselbund** auf iOS, **Android Keystore** auf Android).
- **Alle AI-Schlüssel löschen**: Eine spezielle Sicherheitstaste mit nur einem Tastendruck, um alle gespeicherten API-Schlüssel sicher aus dem Gerätespeicher zu löschen.

---

### B. 🌐 Übersetzungsdienste
Wählen Sie aus, welche Engine sofortige Übersetzungen ermöglicht, wenn Sie in der Suche nach neuen Wörtern suchen:
- **Google Translate**: Schnelle, kostenlose zweisprachige Übersetzungsmaschine mit umfassender Sprachunterstützung.
- **DeepL**: Bekannt für natürliche Phrasierung in europäischen Sprachen. Unterstützt benutzerdefinierte DeepL Free- und DeepL Pro API-Schlüssel.
- **KI-Übersetzung**: Verwendet Ihren aktiven KI-Anbieter für kontextbezogene Übersetzungen.

---

## 3. 📦 Bibliothek und Inhalte

### A. 📦 Importieren und Exportieren
Übertragen Sie Ihre Vokabeldecks nahtlos zwischen Apps, Tabellenkalkulationen und Geräten.

- **Anki (.apkg) Import-Assistent**:
  - Importiert Anki-Decks unter vollständiger Beibehaltung von Vorder-/Rückseitentext, Medien, benutzerdefinierten Tags und Deckstruktur.
  - Die automatische Duplikaterkennung verhindert, dass Ihre Sammlung mit vorhandenen Wörtern überladen wird.
  - Mit der interaktiven Vorschautabelle können Sie importierte Karten vor der Fertigstellung überprüfen.
- **CSV / Assistent zum Importieren von Tabellenkalkulationen**:
  - Importieren Sie Vokabellisten aus Excel-, Google Sheets- oder CSV-Dateien.
  - **Visual Column Mapper**: Ordnen Sie ganz einfach Ihre Tabellenspalten zu (z. B. *Spalte A $\rightarrow$ Word*, *Spalte B $\rightarrow$ Übersetzung*, *Spalte C $\rightarrow$ Beispiel*).
  - Das Vorschau-Datenraster überprüft die korrekte Ausrichtung vor dem Import.
- **Export und Import des Lemmory-Pakets (.lem)**:
  – Das native Backup-Format für Lemmory.
  - Exportiert komplette Decks, benutzerdefinierte Notizen, Lückentexte und Lernverläufe mit räumlichen Wiederholungen (FSRS) für verlustfreie Sicherung und geräteübergreifende gemeinsame Nutzung.

---

### B. 🎨 Kartenvorlagen
Passen Sie an, wie Karteikarten während der Überprüfung aussehen und gerendert werden:
- **Liquid Template Engine**: Karteikarten verwenden Standard-Liquid-Markup-Tags (`{{word}}`, `{{meaning}}`, `{{example}}`, `{{audio}}`, `{{synonyms}}`, `{{partOfSpeech}}`).
- **Vorder- und Rückseite-Editor**: Passen Sie die Frage- und Antwortseiten Ihrer Karten unabhängig an.
- **Live-Vorschaufenster**: Sehen Sie sich beim Bearbeiten des Vorlagencodes sofort ein visuelles Feedback zu Ihrem Kartenlayout an.
- **Standardeinstellungen wiederherstellen**: Jederzeit sicheres Zurücksetzen auf die saubere Standardkartenvorlage von Lemmory.

---

### C. 📚 Lokale Wörterbücher (Wortführer)
- Verwalten und laden Sie Offline-Sprachdatenbanken und kuratierte Starter-Decks herunter.
- Ermöglicht vollständige Wörterbuchsuchen, Flexionstabellen und die Suche nach grammatikalischen Geschlechtern, ohne dass Internet- oder AI API-Anrufe erforderlich sind.

---

## 4. 🎛️ System & Konto

### A. 🔄 Cloud-Synchronisierung
Halten Sie Ihren Lernfortschritt auf Ihrem Telefon, Tablet und Desktop synchronisiert:
- **Google-Kontoverbindung**: Melden Sie sich sicher bei Google an, um die automatische Cloud-Synchronisierung zu aktivieren.
- **Kontinuierliche Synchronisierung**: Lädt automatisch neue Karten, Deckänderungen und Rezensionsbewertungen hoch.
- **Schaltfläche für manuelle Synchronisierung**: Tippen Sie auf **Jetzt synchronisieren**, um eine sofortige Synchronisierung zwischen Ihrem Gerät und der Cloud zu erzwingen.
- **Konfliktlösung**: Die intelligente Zusammenführungslogik stellt sicher, dass der Überprüfungsverlauf beim Offline-Lernen auf mehreren Geräten nie verloren geht.

---

### B. 🎛️ Allgemeines und Aussehen
- **Themenauswahl**:
  - **Lichtmodus**: Klare, kontrastreiche Tagesoberfläche.
  - **Dunkler Modus**: Schlanke dunkle Benutzeroberfläche, die die Belastung der Augen reduziert.
  - **System OLED Black**: Tiefschwarzes Design, optimiert für OLED-Bildschirme und Batterieschonung.
  - **Match-System**: Wechselt das Thema automatisch basierend auf Ihren Geräteeinstellungen.
- **App-Sprache**: Ändern Sie die gesamte Sprache der Benutzeroberfläche zwischen Englisch, Deutsch, Hindi, Französisch, Spanisch und Vietnamesisch.
- **Anzeige- und Schriftskalierung**: Passen Sie die Textgröße an, um eine höhere Informationsdichte oder eine größere, angenehmere Lesbarkeit zu erzielen.

---

### C. 💬 Feedback und Diagnose senden
- **Feedback und Fehlerberichte einreichen**: Senden Sie Funktionsanfragen oder melden Sie Fehler direkt an das Open-Source-Repository GitHub.
- **Diagnoseprotokoll-Bündelung**: Verpackt automatisch anonymisierte Fehlerprotokolle und Gerätespezifikationen, um eine schnelle Fehlerbehebung zu ermöglichen.

![Das Feedback-Formular mit der Kategorie Hilfe & Support und dem optionalen Diagnose-Schalter](send-feedback)

---

### D. ℹ️ Über Lemmory
- Zeigen Sie die installierte App-Version und Build-Nummer an.
- **Was ist neu Modal**: Sehen Sie sich Versionshinweise und Änderungsprotokolle an, die neue Funktionen zusammenfassen.
- Open-Source-Lizenzen und GitHub-Repository-Links.

---

## 💡 Allgemeine Setup-Workflows

1. **Kostenloses KI-Setup (Google Gemini)**:
   - Gehen Sie zu **Einstellungen $\rightarrow$ KI-Anbieter und -Modelle**.
   - Tippen Sie auf **Schlüssel von Google Gemini erhalten ↗** $\rightarrow$ Erstellen Sie einen kostenlosen Schlüssel in Google AI Studio.
   - Fügen Sie den Schlüssel in Lemmory ein und tippen Sie auf **Schlüssel testen und speichern** $\rightarrow$ tippen Sie auf **Aktivieren**.
   - Sie haben jetzt kostenlose KI-Wortaufschlüsselungen, Grammatik-Targeting und Beispielsätze!
2. **Importieren eines Anki-Decks**:
   - Gehen Sie zu **Einstellungen $\rightarrow$ Importieren und Exportieren $\rightarrow$ Anki-Paket (.apkg)**.
   - Wählen Sie Ihre „.apkg“-Datei aus $\rightarrow$ wählen Sie das Zieldeck aus $\rightarrow$ tippen Sie auf **Karten importieren**.
3. **Umstellung auf High-Fidelity-Audio**:
   - Gehen Sie zu **Einstellungen $\rightarrow$ Audio & Aussprache**.
   - Schalten Sie die Engine von *On-Device* auf *OpenAI Audio* oder *ElevenLabs* um.
   - Tippen Sie auf das Lautsprechersymbol, um Beispielstimmen in Ihrer Zielsprache zu testen.

---

## ❓ Häufig gestellte Fragen

> [!NOTE]
> **Werden meine API-Schlüssel an Server von Drittanbietern gesendet?**
> Nein. Lemmory ist vollständig lokal und datenschutzorientiert. Ihre API-Schlüssel werden ausschließlich im Hardware-Schlüsselbund Ihres Telefons gespeichert und nur an den offiziellen KI-Endpunkt (z. B. „api.openai.com“ oder „generativesprache.googleapis.com“) übertragen, wenn Sie eine Wortgenerierung anfordern.

> [!TIP]
> **Was soll ich tun, wenn meine KI-Generationen langsam sind?**
> Versuchen Sie, Ihren aktiven KI-Anbieter auf **Groq** oder **Google Gemini Flash** umzustellen, um nahezu sofortige Reaktionszeiten zu erhalten.