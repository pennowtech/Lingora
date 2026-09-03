# 🔍 Sofortige Suche und mehrmotoriges Wörterbuch

Der Bildschirm **Suchen & Wörterbuch** ist die Suchmaschine von Lemmory. Es ermöglicht Ihnen die Suche nach Wörtern in Ihrer Ziel- oder Muttersprache und bietet sofortige Offline-Übereinstimmungen mit der FTS5-Datenbank, zweisprachige Wörterbuchübersetzungen, eine Vorschau des Wortführers und die Generierung von KI-Lernkarten mit nur einem Tastendruck.

![Suche nach "laufen" mit der Wörterbuchübersetzung und der AI-Insights-Vorschau](search-dictionary)

---

## 🔍 Detaillierte Komponentenaufschlüsselung

### 1. Zweisprachige Suchleiste
- **Zweisprachige automatische Erkennung**: Geben Sie Ihre **Zielsprache** (z. B. Deutsch *schlendern*) oder Ihre **Muttersprache** (z. B. Englisch *Spaziergang*) ein.
- **Schnelle FTS5-Suche**: Verwendet die SQLite-Volltextsuche (FTS5) mit einer schnellen Entprellung von 250 ms, um Ihre Bibliothek und installierte Vokabelwörterbücher während der Eingabe abzufragen.
- **Konjugations- und Flexionsunterstützung**: Erkennt konjugierte Verbformen (z. B. *ging* $\rightarrow$ *gehen*) und flektierte Substantive/Adjektive.
- **Sitzungserhaltende Abfrage**: Die Suchabfrage wird beim Tab-Wechsel gespeichert, sodass Sie beim Wechseln zwischen Decks und Suche nicht Ihren Platz verlieren.

---

### 2. Mehrstufige neue Worterkennungspipeline
Wenn Sie nach einem Wort suchen, für das es in Ihrer Bibliothek noch keine exakte Übereinstimmung gibt, füllt Lemmory automatisch bis zu drei interaktive Entdeckungskarten über den Suchergebnissen aus:

#### A. 📖 Vorschau des Wortführers (Offline-Wörterbuch)
- **Quelle**: Kostenlose, offline installierte Sprachwörterbuchdatenbank.
- **Details**: Zeigt das kanonische Stichwort, die Wortart (Substantiv/Verb/Adj), das grammatikalische Geschlecht, die muttersprachliche Audioaussprache (🔊) und eine prägnante Einführung in die Verwendung an.
- **Aktionen**:
  - **Zum Deck hinzufügen**: Öffnet das **Deck Picker Modal**, um den Eintrag in eine Karteikarte umzuwandeln (mit optionaler Extraktion von Lückensätzen).
  - **Weitere Informationen**: Öffnet den vollständigen **Word Guide Modal** mit vollständigen Deklinations-/Konjugationstabellen und Beispielsätzen.

#### B. 🌐 Schnelle Übersetzungsvorschau (Google Translate / DeepL)
- **Quelle**: Live-Übersetzungs-Engine, konfiguriert in **Einstellungen $\rightarrow$ Übersetzung** (Google Translate, DeepL oder AI).
- **Zweisprachige Auflösung**: Automatische Übersetzung in die Gegensprache des Paares (Ziel $\leftrightarrow$ nativ).
- **Synonyme und Alternativen**: Bei Verwendung von Google Translate werden primäre Übersetzungen sowie alternative Synonymcluster angezeigt.
- **Statusanzeige**: Wenn das Wort bereits in Ihrer Bibliothek gespeichert ist, wird ein grünes Abzeichen **Bereits in Ihrer Bibliothek** angezeigt; Andernfalls wird eine direkte Schaltfläche **Zum Deck hinzufügen** bereitgestellt.

#### C. ✨ KI-Einblicke und One-Tap-Lernkartengenerierung
- **Wenn AI Provider konfiguriert ist (`tier === 'full'`)**:
  - **AI Insights Preview**: Erstellt eine schnelle, prägnante (ca. 50 Wörter) sprachliche Zusammenfassung, die die differenzierte Verwendung, den Ton und die Stimmlage des Wortes erklärt.
  - **Vollständige AI-Lernkarte erstellen**: Durch Tippen auf die Karte wird eine optimistische Kartenerstellung ausgelöst, die Definitionen, Beispielsätze, Synonyme, Kollokationen und Lückentexte erstellt und sofort zur **Wortdetailansicht** („/word/[form]“) navigiert.
- **Im Offline-Modus (`tier === 'offline'`)**:
  - Zeigt eine **Limited Mode**-Karte an, die Sie auffordert, einen API-Schlüssel in den Einstellungen für die KI-Generierung anzuschließen oder Offline-Wörterbücher zu installieren.

---

### 3. Liste mit übereinstimmenden Bibliotheksergebnissen
- **Präfix und exakte Übereinstimmung**: Listet alle Karten und Wörterbuch-Lemmas auf, die mit der Suchanfrage übereinstimmen.
- **Kartenmetadaten**:
  - Kanonische Form und Übersetzung.
  - Quellsymbol (Offline Word Guide 📖, Translation Engine 🌐 oder AI Provider ✨).
  - Grünes Häkchen (** ✓ **), wenn sich die Karte bereits in einem Ihrer Decks befindet.
  - **Details**-Chip: Öffnet direkt die detaillierte Sprachkartenansicht.

---

### 4. Integration von Deck Picker und Review-Modus
- **Deck-Auswahl**: Wenn Sie bei einer Übersetzung oder einem Word Guide-Eintrag auf **Zum Deck hinzufügen** tippen, wird das „DeckPickerModal“ geöffnet.
- **Review-Modus-Abzeichen**: Jedes Deck zeigt Symbole an, die die Lernmodi repräsentieren, die es praktiziert:
  - **Vokabeln** (⇄): Wort-zu-Übersetzung-Erinnerung.
  - **Umgekehrt** (⮌): Übersetzung-zu-Wort-Erinnerung.
  - **Lückentext** (T): Übung zum Ausfüllen von Lücken in Kontextsätzen.
  - **Multiple Choice** (☰): Schnelle Quizübungen mit Ablenkern.
  - **Richtig/Falsch** ( ✓): Schnelle Überprüfung.
- **Neues Deck erstellen**: Ermöglicht das Erstellen eines neuen Decks mit benutzerdefinierten Fragetypkonfigurationen direkt aus der Auswahl.

---

### 5. Von überall aus suchen (Systemfreigabe und Text verarbeiten)
- **Android Process Text**: Markieren Sie ein beliebiges Wort in einem Webbrowser, E-Book oder einer Messaging-App und tippen Sie auf die drei Punkte $\rightarrow$ **„Suche in Lemmory“**, um direkt in die Suche zu springen und das Wort vorinstalliert zu haben.
- **Systemfreigabeblatt**: Geben Sie Text oder Phrasen aus externen Apps direkt an Lemmory weiter.

---

### 6. Suchhilfe Akkordeon
- Durch Tippen auf das Symbol **CircleQuestionMark** (❓) in der nativen Kopfzeile wird das **Hilfeblatt zur Suche** geöffnet, in dem Folgendes erklärt wird:
  - Sofortige Suchregeln und zweisprachige Erkennung.
  - So funktionieren Wörterbuchkarten für neue Wörter.
  - Bedeutung der Symbole im Deck-Review-Modus.
  - So suchen Sie von externen Apps aus.

---

## 💡 Gemeinsame Arbeitsabläufe

1. **Ein unbekanntes Wort nachschlagen**:
   - Geben Sie das Wort in die Suchleiste ein (z. B. *schlendern*).
   - Sehen Sie sich die Definition und Audioaussprache des **Wortführers** an.
   - Tippen Sie auf **Zum Deck hinzufügen**. $\rightarrow$ Wählen Sie Ihr Zieldeck aus (z. B. *Deutsch B1*). Die $\rightarrow$-Karte wird sofort gespeichert.
2. **Umgekehrte Suche aus der Muttersprache**:
   - Geben Sie ein englisches Wort ein (z. B. *coziness*).
   - Die Schnellübersetzungsvorschau erkennt Englisch und löst das deutsche Ziellemma (*Gemütlichkeit*) auf.
   - Tippen Sie auf **Vollständige KI-Karteikarte generieren**, um eine vollständige zweisprachige Karteikarte zu erstellen.
3. **Grammatik und Konjugation erforschen**:
   - Suchen Sie nach einem unregelmäßigen Verb (z. B. *sprechen*).
   - Tippen Sie auf der Karte „Wortführer“ auf **Weitere Informationen**, um die vollständigen Tempustabellen (Präsens, Präteritum, Perfekt) im Modal anzuzeigen.

---

## ❓ Häufig gestellte Fragen

> [!TIP]
> **Kann ich suchen, wenn ich keine Internetverbindung habe?**
> Ja! Die lokale SQLite-Suche und die installierten **Word Guides** funktionieren vollständig offline, ohne dass WLAN oder mobile Daten erforderlich sind.

> [!NOTE]
> **Warum sehe ich Google Translate über Wörtern, die bereits in meiner Bibliothek vorhanden sind?**
> Google Translate wird als dauerhafte Kurzreferenz gespeichert, sodass Sie sofort eine schnelle Bedeutung überprüfen können, ohne die vollständige Karte öffnen zu müssen.