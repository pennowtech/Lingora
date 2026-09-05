# 🏠 Home Dashboard und tägliches Lernzentrum

Das **Home Dashboard** ist der tägliche Ausgangspunkt in Lemony. Es bietet Ihnen einen Echtzeitüberblick über Ihre Wiederholungslast bei räumlichen Wiederholungen, die aktuelle Lernserie, die kuratierte Wort-des-Tages-Entdeckung und sofortige Verknüpfungen zur Wörterbuchsuche und zum Satz-Mining.

![Das Home Dashboard mit der täglichen Ladeanzeige, den Schnellzugriff-Kacheln und der Wort-des-Tages-Karte](home-daily-study-hub)

---

## 🔍 Detaillierte Komponentenaufschlüsselung

### 1. Floating-Sprachpaar-Abzeichen
- **Standort**: Oberer sicherer Bereich oberhalb des Armaturenbretts.
- **Funktionalität**: Zeigt das aktuelle Muttersprachpaar zur Zielsprache an (z. B. 🇬🇧 `EN` $\rightarrow$ 🇩🇪 `DE`).
- **Interaktive Aktion**: Wenn Sie direkt auf dieses Abzeichen tippen, werden **Einstellungen $\rightarrow$ Lernen** (`/settings/learning`) geöffnet, wo Sie Ihre aktive Zielsprache oder Ihr Muttersprachenpaar wechseln können.

### 2. Zeitbewusste Begrüßung und Lernphase
- **Uhrzeitbezogene Begrüßung**: Rendert automatisch „Guten Morgen!“, „Guten Tag!“ oder „Guten Abend!“ basierend auf der Uhr Ihres Geräts.
- **Kontextueller Untertitel**:
  - „Schön, Sie wiederzusehen.“ (wenn Karten fällig sind)
  - „Alles aufgeholt – im Moment ist nichts fällig.“ (wenn 0 Karten fällig sind)
  - „Lass uns dein erstes Wort finden.“ (für brandneue Konten)
- **Streak Pill**: Zeigt 🔥 „X Tage“ an und verfolgt aufeinanderfolgende Tage mit mindestens einer abgeschlossenen Überprüfungssitzung.

---

### 3. Heldenabschnitt: Adaptive Zustände

#### A. Aktiver Lernstatus: Daily Load Hero
- **Fälligkeitszähler**: Zeigt deutlich die Gesamtzahl der Karten in allen Decks an, die derzeit basierend auf der FSRS-Planungs-Engine zur Überprüfung bereitstehen.
- **30-Tage-Aufbewahrungsring**: Zeigt Ihren 30-Tage-Speicheraufbewahrungsprozentsatz an (Prozentsatz der oben *erneut* bewerteten Bewertungen). Durch Tippen auf den Ring navigieren Sie zum vollständigen **Statistikbildschirm** („/stats“).
- **Schaltfläche „Überprüfung starten“**:
  - Wenn Karten fällig sind: Startet eine Überprüfungssitzung für alle Decks („/review/all-decks“).
  - Wenn 0 Karten fällig sind: Zeigt **Alle aufgeholt** an und ist deaktiviert.

#### B. Brandneuer Benutzerstatus: Banner „Erste Schritte“.
Wenn Sie 0 Karten in Ihrer Bibliothek haben, tauscht das Dashboard automatisch die fällige Karte gegen eine dreistufige Einführungsanleitung aus:
1. **Sprachen auswählen**: Wählen Sie Ihr Mutter- und Zielsprachenpaar.
2. **Suchen Sie ein Wort und fügen Sie es dem Stapel hinzu**: Suchen Sie nach Wörtern in Ihrer Zielsprache und erstellen Sie angereicherte Lernkarten.
3. **Überprüfen Sie Ihr Deck**: Lernen Sie mit der wissenschaftlich optimierten FSRS-Engine für räumliche Wiederholungen.
- **Primäre Aktionen**: **Ihr erstes Wort suchen** (öffnet „/search“) und **Hilfe und Videoanleitungen erkunden** (öffnet „/settings/help“).

---

### 4. Zwei-Tasten-Aktionszeile
- **🔍 Ein Wort nachschlagen**: Öffnet das **Such- und Sofortwörterbuch** („/search“) mit direktem Tastaturfokus.
- **📥 Mining-Warteschlange**: Öffnet die **Mine/Sentence Holding Queue** („/mine“), um erfasste Sätze und Wörter anzuzeigen, die zur Umwandlung in Karten bereitstehen.

---

### 5. Wort des Tages (WOTD)

> [!NOTE]
> Ausführliche Informationen – wie das Wort ausgewählt und nie wiederholt wird, wann es aktualisiert wird und wie die tägliche Benachrichtigung funktioniert – live im speziellen **[Wort des Tages-Leitfadens](08-word-of-the-day.md)**. In diesem Abschnitt wird nur die Startbildschirmkarte selbst behandelt.

#### Wenn ein KI-Anbieter konfiguriert ist (`tier === 'full'`):
- **Bento-Karte**: Zeigt das Wort, eine zweizeilige Erklärung und das Abzeichen „AI Discovery“ an.
- **Interaktives Popup-Modal**: Durch Tippen auf die Karte wird der vollständige Entdeckungsdialog geöffnet:
  - **Stichwort & Audio**: Sofortige Wiedergabe der nativen Aussprache über die Schaltfläche „Lautstärke2“.
  - **Bedeutung und Erklärung**: Formatierte Markdown-Erklärung des Wortes und seiner Nuancen.
  - **Beispiel im Kontext**: Natürlicher zweisprachiger Beispielsatz mit Übersetzungen.
  - **Alle Details erkunden ↗**: Öffnet den umfassenden **Wortdetails**-Bildschirm (`/word/[form]`), um es zu Ihren Decks hinzuzufügen.

#### Wenn offline / kein KI-Anbieter konfiguriert (`tier === 'offline'`):
- **Offline-Bento-Karte**: Zeigt ein ℹ️ „Offline-Modus“-Abzeichen an.
- **Aktion**: Durch Tippen auf die Karte wird das **AI-Setup-Modal** mit Anweisungen zum Anschließen eines kostenlosen oder kostenpflichtigen AI-Schlüssels oder zum Herunterladen lokaler Offline-Wörterbücher geöffnet.

---

### 6. Kürzlich gesucht
- **Zuletzt verwendete Liste**: Zeigt die letzten 3 gesuchten Wörter mit ihren Übersetzungen, CEFR-Stufen (z. B. „A1“, „B2“) und Lückenzeichen an.
- **Navigation**:
  - Durch Tippen auf eine Wortzeile gelangen Sie direkt zum vollständigen **Wortdetails**-Bildschirm.
  - Wenn Sie auf **Alle anzeigen** tippen, wird der vollständige Verlaufsbildschirm **Zuletzt gesucht** geöffnet.
- **Leerer Status**: Gibt eine Eingabeaufforderung für den leeren Status aus, wenn noch keine Wörter nachgeschlagen wurden.

---

### 7. App-Updates und In-App-Hilfe
- **Was ist neu Modal**: Wird automatisch einmal pro Version angezeigt, wenn eine neue Version von Lemony gestartet wird, und fasst neu eingeführte Funktionen zusammen.
- **Heimhilfe-Akkordeon**: Über das Fragezeichen-Symbol in der Kopfzeile zugänglich, bietet es schnelle Antworten zu täglichen Fälligkeitszählungen, Aufbewahrungsstatistiken, Wort des Tages und Verknüpfungen.

---

## 💡 Gemeinsame Arbeitsabläufe

1. **Täglicher Morgenrückblick**:
   - Überprüfen Sie die **Tägliche Ladung**-Nummer.
   - Tippen Sie auf **Überprüfungssitzung starten**, um alle fälligen Karten in allen Ihren Decks in einem kontinuierlichen Lernablauf zu löschen.
2. **Das heutige Wort des Tages lernen**:
   - Tippen Sie auf die Karte **Wort des Tages**.
   - Hören Sie sich die Audioaussprache an und lesen Sie den Kontextsatz.
   - Tippen Sie auf **Alle Details erkunden ↗**, um es Ihrem Lerndeck hinzuzufügen.
3. **Zielsprachen ändern**:
   - Tippen Sie oben auf dem Bildschirm auf die **Sprachpaar-Pille** (z. B. 🇬🇧 EN $\rightarrow$ 🇩🇪 DE).
   - Wählen Sie in den Einstellungen ein anderes Sprachpaar aus.

---

## ❓ Häufig gestellte Fragen

> [!NOTE]
> **Warum steht im Wort des Tages „Offline-Modus“?**
> Word of the Day erfordert einen KI-Anbieter – ohne einen ist es träge. Fügen Sie einen API-Schlüssel (z. B. das kostenlose Kontingent von Google Gemini oder OpenAI) in **Einstellungen $\rightarrow$ AI-Anbieter** hinzu und die Karte schaltet automatisch um. Sehen Sie sich den **[Wort des Tages-Leitfadens](08-word-of-the-day.md)** an, um zu erfahren, wie das Wort selbst ausgewählt und aktualisiert wird.

> [!TIP]
> **Wie wird die Retention-Rate berechnet?**
> Der Retention-Prozentsatz auf der Heldenkarte berechnet den Anteil erfolgreicher Bewertungen (Bewertungen *Schwer*, *Gut* oder *Einfach*) in den letzten 30 Tagen für alle Ihre Decks.