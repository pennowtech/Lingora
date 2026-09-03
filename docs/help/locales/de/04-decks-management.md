# 🗂️ Lernfortschritt und Decks

Auf der Registerkarte **Decks** können Sie den gesamten Lernfortschritt verfolgen, Vokabelsammlungen organisieren, Wiederholungsmodi anpassen und Ihre Lernkarten verwalten. In Lemony sind Decks nicht nur statische Ordner – sie sind intelligente Studiensammlungen, die definieren, welche Überprüfungsmodi Sie anwenden, ihre eigenen Aufbewahrungsstatistiken verfolgen und hierarchische Verschachtelung, Tabellenansichten in Tabellenkalkulationen und Massenaktionen unterstützen.

![Der Decks-Bildschirm mit dem gesamten Lernfortschritt und den Wiederholungsmodus-Abzeichen pro Deck](decks-study-progress)

---

## 🔍 Detaillierte Komponentenaufschlüsselung

### 1. Deckübersicht und Lernfortschrittsbanner
- **Studienfortschrittskarte**: Zeigt die Gesamtzahl der fälligen Karten aller Sammlungen zusammen mit einem Live-Fortschrittsbalken für die Speichererhaltung für 30 Tage an.
- **Statistik-Aktionsschaltfläche (📊 Statistiken ↗)**: Tippen Sie auf die Statistikschaltfläche in der Kopfzeile der Karte, um direkt zum vollständigen Bildschirm **Lernstatistik** zu springen (Heatmap überprüfen, 7-Tage-Vorhersage und Übungen zu schwierigen Wörtern).
- **Kopfzeile Cloud-Synchronisierung (🔄)**: Tippen Sie auf die Schaltfläche „Aktualisieren“, um eine sofortige Cloud-Synchronisierung auf Ihren Mobil- und Desktop-Geräten auszulösen.
- **Header-Hilfe (❓)**: In-App-Anleitung mit Erläuterungen zu Deck-Hierarchien, Überprüfungsmodi und Menüoptionen.

---

### 2. Deckhierarchie und Unterdecks (Verschachtelung)
- **Unter-Deck-Organisation**: Sie können Decks in anderen Decks verschachteln (zum Beispiel: *Deutsch $\rightarrow$ B1-Vokabular $\rightarrow$ Konjunktivverben*).
- **Eingerückter visueller Baum**: Untergeordnete Decks werden unter ihrem übergeordneten Deck eingerückt angezeigt.
- **Aggregierte Zählungen**: Ein übergeordnetes Deck enthält automatisch die Kartenanzahlen und fälligen Überprüfungen aller seiner Unterdecks.

---

### 3. Überprüfen Sie die Modi pro Deck
Beim Erstellen oder Bearbeiten eines Decks wählen Sie aus, welche **Studienformate** dieses Deck während der Überprüfungssitzungen verwendet:
- **Vokabeln (⇄)**: Klassische Karteikarten mit Aufforderung zur Übersetzung.
- **Umgekehrt (⮌)**: Muttersprachliche Übersetzungsaufforderung, die Sie auffordert, sich an das Zielwort zu erinnern.
- **Lückentext (T)**: Übung zum Ausfüllen von Lücken in Beispielsätzen.
- **Multiple Choice (☰)**: Schnelle Erkennungsquiz mit generierten Ablenkern.
- **Richtig/Falsch ( ✓ )**: Schnelle Verifizierungsfragen.

> [!NOTE]
> Die automatische Kartengenerierung im Test nutzt automatisch jeden aktivierten Modus, den eine Karte unterstützt!

---

### 4. Schwebende Aktionsschaltfläche („+“ FAB)
Durch Tippen auf das Hauptmenü **`+` FAB** am unteren Rand des Decks-Bildschirms wird ein Schnellmenü mit drei Optionen geöffnet:
1. **➕ Deck hinzufügen**: Öffnet das Dialogfeld *Neues Lerndeck erstellen*, um einen Namen und Überprüfungsmodi festzulegen.
2. **📝 Karte hinzufügen**: Öffnet eine Deckauswahl und führt Sie direkt zum manuellen Kartenersteller.
3. **📥 Datei importieren**: Wählen Sie ein Deck und importieren Sie Karten aus den Dateien **Anki (.apkg)**, **CSV/Spreadsheets** oder **Lemony (.lem)**.

---

### 5. Das Deck-Kontextmenü („⋮“ 3-Punkte-Menü)
Durch Tippen auf das **⋮**-Menü in einer Deckzeile (oder durch langes Drücken des Decks) wird eine umfassende Verwaltungsleiste geöffnet:

#### Was jede Aktion bewirkt:
- **➕ Karte hinzufügen**: Springe direkt zur manuellen Kartenerstellung für dieses Deck.
- **📂 Offenes Deck**: Öffnet die vollständige Studienübersicht des Decks.
- **📥 Importieren**: Importieren Sie vorhandene Karten aus den Dateien Anki „.apkg“, CSV oder „.lem“ in dieses Deck.
- **📤 Exportieren**: Exportieren Sie dieses Deck als „.lem“-Paket, Anki-Deck oder CSV-Tabelle mit einem benutzerdefinierten Dateinamen.
- **✏️ Deck umbenennen**: Ändern Sie den Titel des Decks.
- **📂 Deck verschieben**: Wählen Sie ein neues übergeordnetes Deck aus, unter dem dieses Deck verschachtelt werden soll, oder verschieben Sie es zurück auf die oberste Ebene.
- **🔀 In ein anderes Deck zusammenführen**: Verschiebt alle Karten von diesem Deck in ein anderes Zieldeck und entfernt den leeren Deckbehälter.
- **🔄 Fortschritt zurücksetzen**: Setzt die Abstandswiederholungsintervalle (FSRS) für alle Karten in diesem Deck zurück, um sie als brandneue Karten zu behandeln.
- **🗑️ Deck löschen**: Löscht den Deck-Container dauerhaft (Bestätigung erforderlich).

---

### 6. In einem Deck: Deck-Detailbildschirm
Wenn Sie auf ein beliebiges Deck in der Liste tippen, gelangen Sie zu dessen Studien- und Inspektionsbildschirm:

- **Deck-Statistikzeile**:
  - **Karten**: Gesamtzahl der Vokabelkarten in diesem Deck.
  - **Jetzt fällig**: Karten sind jetzt zur Überprüfung bereit.
  - **Aufbewahrung**: Durchschnittliche 30-Tage-Erinnerungsrate.
- **▶ Schaltfläche „Überprüfen“**: Startet Ihre Lernsitzung mit räumlichen Wiederholungen für dieses Deck.
- **Interaktive Kartenliste**:
  - **Einmaliges Tippen auf eine Zeile (Kartenvorschau)**: Wenn Sie auf eine beliebige Karte tippen, wird diese im **Studienvorschaumodus** geöffnet – Sie sehen die Karte genau so, wie sie in der Überprüfung angezeigt wird (tippen Sie, um die Vorder-/Rückseite umzudrehen und Lückentexte anzuzeigen), und nicht in einem einschüchternden Bearbeitungsformular.
  - **Langes Drücken (Mehrfachauswahlmodus)**: Durch langes Drücken einer beliebigen Karte wird der Mehrfachauswahlmodus mit Kontrollkästchen aktiviert. Wählen Sie mehrere Karten aus und tippen Sie auf **Entfernen {count}** („Trash2“), um sie in großen Mengen aus dem Stapel zu entfernen.
  - **`+` FAB**: Füge eine weitere manuelle Karte direkt zu diesem Deck hinzu.

---

### 7. Tabellenansicht der Tabellenkalkulation
Die **Tabellenansicht** ist über das Deck-Menü zugänglich und stellt ein tabellenartiges Datenraster jeder Karte in Ihrer Sammlung dar:

- **Registerkarte „Wortkarten“**: Spalten für Wort, Bedeutung, Beispielsatz, Übersetzung, Synonyme, Tags, Wortart und CEFR-Ebene.
- **Registerkarte „Lückentextkarten“**: Spalten für Wort, Bedeutung, Lückentext (`[...]`), Übersetzung, Synonyme, Tags und CEFR-Ebene.
- **Anwendungsfall**: Ideal zum schnellen Überprüfen Ihrer Vokabelliste, Überprüfen von Übersetzungen oder Überprüfen von Tags auf Hunderten von Karten gleichzeitig.

---

### 8. Manueller Kartenersteller
Ermöglicht das Erstellen benutzerdefinierter Karteikarten von Grund auf, ohne das Wörterbuch durchsuchen zu müssen:

- **Wortkartenmodus (Grundkenntnisse)**:
  - Geben Sie das Stichwort, das grammatikalische Geschlecht (männlich, weiblich, neutral) und die Bedeutung ein.
  - Fügen Sie einen Beispielsatz und eine Übersetzung hinzu (oder tippen Sie auf **✨ Mit KI generieren**, damit die KI einen natürlichen Satz für Sie schreibt!).
  - Fügen Sie optionale Synonyme und Redewendungen hinzu.
- **Lückenkartenmodus (Lücken ausfüllen)**:
  - Verfassen Sie einen Kontextsatz.
  - Tippen Sie auf ein beliebiges Wort, um es in ein Lückentext-Lückenzeichen („[...]“) umzuwandeln.

---

## 💡 Gemeinsame Arbeitsabläufe

1. **Erstellen eines verschachtelten Unterdecks**:
   - Tippen Sie auf ***+** $\rightarrow$ **Deck hinzufügen** $\rightarrow$ und erstellen Sie *"Medizinische Verben"*.
   - Tippen Sie **⋮** auf *"Medizinische Verben"* $\rightarrow$ tippen Sie auf **Deck verschieben** $\rightarrow$ wählen Sie *"Deutsch B2"*.
   - *„Medizinische Verben“* erscheint nun übersichtlich verschachtelt unter *„Deutsch B2“*.
2. **Vorschau einer Karte vor dem Lernen**:
   - Öffne ein Deck. $\rightarrow$ tippe auf eine beliebige Kartenzeile in der Liste.
   - Die Karte wird im Lernvorschaumodus geöffnet, sodass Sie ihre Bedeutung und Aussprache selbst testen können, bevor Sie eine formelle Überprüfungssitzung beginnen.
3. **Zwei Decks zusammenführen**:
   - Tippen Sie auf **⋮** auf dem Deck, das Sie verschieben möchten. $\rightarrow$ tippen Sie auf **In ein anderes Deck zusammenführen**. $\rightarrow$ wählen Sie das Zieldeck aus.
   - Alle Karten werden sicher übertragen, ohne dass ihr Bewertungsverlauf verloren geht.

---

## ❓ Häufig gestellte Fragen

> [!TIP]
> **Was ist der Unterschied zwischen dem Löschen eines Decks und dem Zurücksetzen des Fortschritts?**
> Beim Löschen wird der Deckcontainer vollständig entfernt. Durch das Zurücksetzen des Fortschritts bleiben alle Karten im Stapel, ihre FSRS-Überprüfungsintervalle werden jedoch auf Tag 1 zurückgesetzt, sodass Sie sie von Grund auf neu lernen können.

> [!NOTE]
> **Kann ich ein Deck zum Lernen in Anki auf dem Desktop exportieren?**
> Ja! Tippen Sie auf **⋮** $\rightarrow$ **Exportieren** $\rightarrow$ und wählen Sie **Anki (.apkg)**. Lemony generiert eine Standard-Anki-Deckdatei, die Sie in Anki auf einem PC oder Mac öffnen können.