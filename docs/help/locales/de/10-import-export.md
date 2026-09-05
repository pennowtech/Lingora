# 📥 Karten importieren und exportieren

Mit den **Import/Export**-Werkzeugen bringen Sie Vokabeln in Lemony hinein und wieder hinaus, ohne etwas erneut abzutippen: Importieren Sie eine Tabelle, eine bestehende Anki-Sammlung oder ein Deck, das jemand aus seiner eigenen Lemony-App geteilt hat - und exportieren Sie jedes Deck auf demselben Weg wieder heraus, ob zur Sicherung, zum Teilen oder um es in Anki auf einem Desktop-Computer zu lernen.

![Der Import/Export-Ablauf mit den Schritten Datei auswählen, Felder zuordnen und Vorschau](import-export-wizard)

---

## 🔍 Detaillierte Funktionsübersicht

### 1. Die drei Importformate
- **CSV**: Eine einfache Tabelle, die Sie vollständig selbst kontrollieren - Spaltenüberschriften ordnen Sie selbst zu. Am besten für Wortlisten, die Sie in Excel/Google Sheets erstellt haben oder aus einem Lehrbuch/Kurs exportiert haben.
- **Anki (.apkg)**: Liest eine echte exportierte Anki-/AnkiDroid-/AnkiMobile-Sammlungsdatei. Bringt ein bestehendes Anki-Deck in Lemonys eigene Wiederholungs-Engine.
- **Lemony (.lem)**: Lemonys eigenes natives Format. Das einzige, das den **vollständigen Lernfortschritt** einer Karte (FSRS-Status und komplette Wiederholungshistorie) mitbringt - genutzt, wenn jemand ein Deck aus seiner eigenen Lemony-App teilt, oder wenn Sie eines Ihrer eigenen Decks auf ein neues Gerät übertragen.

### 2. Der Import-Assistent (CSV & Anki)
Beide Formate teilen sich denselben vierstufigen Assistenten:
1. **Datei auswählen**: Wählen Sie eine `.csv`- oder `.apkg`-Datei von Ihrem Gerät.
2. **Felder zuordnen & Kartentyp wählen**: Ordnen Sie die Spalten Ihrer Datei (CSV) bzw. die Notizfelder (Anki) den Feldern Wort / Bedeutung / Lückentextsatz / Beispiel / Beispielübersetzung / Synonyme zu, und wählen Sie, ob dieser Durchlauf **Normale (Wort/Bedeutung)**-Karten oder **Lückentext (Lücken ausfüllen)**-Karten erstellt. Wählen (oder erstellen) Sie hier auch das Zieldeck.
3. **Vorschau**: Jede Zeile ist markiert und zeigt **OK**, **Duplikat** (das Wort existiert bereits irgendwo in Ihrer Bibliothek) oder **Fehler** (fehlender erforderlicher Inhalt - nicht markiert und nicht importierbar, bis behoben). Deaktivieren Sie alles, was Sie nicht möchten.
4. **Importieren**: Bestätigen, und jede markierte Zeile wird zu einer echten Karte, mit Fortschrittsanzeige und einer abschließenden Zusammenfassung (importiert/übersprungen/fehlgeschlagen).

> [!NOTE]
> Die ursprüngliche Anki-Deckstruktur wird nicht nachgebildet - jede Notiz landet im **einen** Lemony-Deck, das Sie in Schritt 2 ausgewählt haben, unabhängig davon, aus welchem Anki-Deck sie stammt. Anki-Decknamen erscheinen in der Vorschau nur als Beschriftung, damit Sie sehen, woher jede Notiz ursprünglich stammt.

### 3. Normale Karten vs. Lückentextkarten - eine Wahl pro Durchlauf
Die Wahl zwischen Normal und Lückentext in Schritt 2 gilt für **die ganze Datei, jede Zeile, für diesen einen Import** - es gibt keinen Umschalter pro Zeile und kein automatisches Raten (Anki-Notiztypen variieren dafür zu stark). Wird Lückentext gewählt, benötigt jede Zeile echte `{{c1::wort}}`-Markierung in einer zugeordneten Spalte, sonst wird die Zeile als Fehler markiert.

**Möchten Sie sowohl eine normale als auch eine Lückentextkarte für dieselben Wörter?** Importieren Sie dieselbe Datei zweimal: einmal als Normal, einmal als Lückentext, und wählen Sie beim zweiten Durchlauf **Beide behalten** als Duplikat-Regel (siehe [Abschnitt 5](#5-umgang-mit-duplikaten)). Jedes Wort erhält so zwei unabhängige Karten, die sich denselben Vokabeleintrag teilen, aber jeweils einen eigenen Wiederholungsplan haben.

### 4. Der Lemony (.lem)-Import-Assistent
Ein kürzerer Ablauf, da die Datei bereits echte, strukturierte Lemony-Daten enthält:
1. **Datei auswählen**.
2. **Quelldeck auswählen** (nur sichtbar, wenn die Datei mehr als ein Deck enthält).
3. **Zieldeck auswählen** (bestehend oder neu).
4. **Vorschau**, dann **Importieren**.

Es gibt keine Feldzuordnung und keine Wahl des Kartentyps - der `.lem`-Import bringt jede Bedeutung, jedes Beispiel, jedes Synonym, jede Redewendung und jede Lückentextvariante mit, die eine Karte bereits hatte, **plus den vollständigen FSRS-Status und die Wiederholungshistorie**. Es ist das einzige Importformat, das das tut.

### 5. Umgang mit Duplikaten
Existiert ein importiertes Wort bereits irgendwo in Ihrer Bibliothek, wählen Sie eine Regel für den gesamten Import:
- **Überspringen** (Standard): das vorhandene Wort bleibt unangetastet.
- **Beide behalten**: eine zweite, unabhängige Karte für dasselbe Wort wird hinzugefügt.

Einzelne Duplikat-Zeilen können in der Vorschau weiterhin abgewählt werden, um eine Ausnahme von der gewählten Regel zu machen.

### 6. Wie importierte Karten zu den Wiederholungsmodi Ihres Decks passen
Die Wiederholungsmodi eines Decks (Vokabeln, Umgekehrt, Lückentext, Multiple Choice, Richtig/Falsch) und das, was Sie tatsächlich importiert haben, passen nicht immer perfekt zusammen - das wird jedoch elegant gehandhabt, nie als Sackgasse:
- **Lückentext im Deck aktiviert, aber normale Karten importiert**: Diese Karten werden einfach automatisch als Vokabelkarten abgefragt, da es keinen zu füllenden Lückensatz gibt.
- **Nur Vokabeln im Deck aktiviert, aber Lückentextkarten importiert**: keine Lücke - der Lückentext-Import erstellt immer auch eine echte Übersetzung, sodass diese Karten ohne zusätzlichen Schritt als Vokabelkarten funktionieren.
- **Multiple Choice / Richtig-Falsch**: Dafür gibt es überhaupt nichts zu importieren - sie werden zur Wiederholungszeit live aus der eigenen Übersetzung der Karte plus den Übersetzungen anderer Karten als falsche Antworten erzeugt. Sie schalten sich automatisch ein, sobald Ihr Deck genug andere Karten hat (3 für Multiple Choice, 1 für Richtig/Falsch).

> [!TIP]
> Der Import-Bildschirm warnt Sie jetzt **bevor Sie importieren**, wenn der gewählte Kartentyp nicht zu den Wiederholungsmodi des Zieldecks passt - genau dort, wo Sie in Schritt 2 Deck und Kartentyp auswählen.

### 7. Ein Deck exportieren
Im „⋮“-Menü jedes Decks bietet **Exportieren**:
- **CSV**: Eine wieder importierbare Tabelle - Wort, Bedeutung, Beispiel und mehr.
- **Anki (.apkg)**: Eine Standard-Anki-Deckdatei, die in Anki auf PC/Mac oder in AnkiDroid/AnkiMobile geöffnet werden kann. Karten starten dort neu - Anki kennt Lemonys FSRS-Status nicht.
- **Markdown**: Eine lesbare Liste aus Wort - Bedeutung - Beispiel, zum Teilen oder Ausdrucken. Nicht wieder importierbar.
- **Lemony (.lem)**: Das Format mit voller Wiedergabetreue - jede Bedeutung, jedes Beispiel, jede Lückentextvariante, jeder Tag und die komplette FSRS-/Wiederholungshistorie des Decks, in einer Datei. Nur für den Export eines einzelnen Decks gedacht.

---

## 💡 Typische Arbeitsabläufe

1. **Sowohl normale als auch Lückentextkarten aus einer Datei erhalten**:
   - Importieren Sie die Datei als **Normal** in Ihr Deck.
   - Importieren Sie *dieselbe Datei erneut*, diesmal als **Lückentext**, und wählen Sie **Beide behalten** als Duplikat-Regel.
   - Jedes Wort hat nun zwei unabhängig geplante Karten.
2. **Ein Deck (mit Ihrem Fortschritt) auf ein neues Telefon übertragen**:
   - Auf dem alten Gerät: **⋮** $\rightarrow$ **Exportieren** $\rightarrow$ **Lemony (.lem)**.
   - Auf dem neuen Gerät: **Importieren** $\rightarrow$ **Lemony (.lem)** $\rightarrow$ Datei auswählen.
   - Ihre Wiederholungshistorie und FSRS-Planung kommen genau so an, wie sie waren.
3. **Ein bestehendes Anki-Deck in Lemony übernehmen**:
   - Exportieren Sie Ihre Anki-Sammlung als `.apkg` aus Anki Desktop (oder teilen Sie sie aus AnkiDroid/AnkiMobile).
   - **Importieren** $\rightarrow$ **Anki (.apkg)** $\rightarrow$ Felder Ihrer Notiz zuordnen $\rightarrow$ Lemony-Deck auswählen.
   - Jede Notiz startet in Lemonys eigenem FSRS-Planer neu.

---

## ❓ Häufig gestellte Fragen

> [!NOTE]
> **Bringt der Import eines Anki-Decks mit, wie gut ich diese Wörter schon kannte?**
> Nein. Ankis eigene Planungsdaten lassen sich nicht zuverlässig auf Lemonys FSRS-Algorithmus übertragen, daher startet jede CSV- oder Anki-importierte Karte völlig neu. Nur der `.lem`-Import bringt echten Lernfortschritt mit, da es Lemonys eigenes natives Format ist.

> [!TIP]
> **Die Wiederholungsmodi meines Decks sind nur Lückentext, aber ich habe nur eine einfache Wort/Bedeutung-Tabelle - muss ich erst Lückentext-Inhalte erstellen, bevor ich dieses Deck nutzen kann?**
> Nein. Importieren Sie als Normal; diese Karten werden einfach als Vokabelkarten abgefragt statt als Lückentext, bis auch dafür Lückentext-Inhalte existieren (ein zweiter Importdurchlauf oder ein von Hand erstellter Lückentext über die Wortdetailseite).

> [!NOTE]
> **Kann ich CSV-, Anki- und Lemony-Importe in dasselbe Deck mischen?**
> Ja - ein Deck merkt sich nicht und interessiert sich nicht dafür, welches Importformat eine bestimmte Karte erzeugt hat.
