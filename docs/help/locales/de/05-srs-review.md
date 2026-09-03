# 🧠 Spaced Repetition (SRS) Review Engine

Auf dem **Überprüfungsbildschirm** findet die Speicherkonsolidierung statt. Lemmory verwendet moderne kognitionswissenschaftliche Algorithmen (FSRS und SM-2), um Karten genau dann zu präsentieren, wenn Sie sie gerade vergessen, und maximiert so die langfristige Erinnerung bei minimaler Lernzeit.

![Standard-Flip-Modus mit einer Wort/Bedeutung-Karte und den Bewertungstasten Erneut/Schwer/Gut/Einfach](srs-review-word-meaning)

---

## 🚀 Hauptmerkmale

### 1. Erweiterte Scheduling-Engines (FSRS & SM-2)
- **FSRS (Free Spaced Repetition Scheduler)**: Modernste, auf maschinellem Lernen basierende Intervallberechnung, die sich an den Kartenschwierigkeitsgrad und Ihr persönliches Bindungsratenziel (80 %–95 %) anpasst.
- **SM-2 (Classic SuperMemo)**: Bewährter klassischer Intervallalgorithmus für Benutzer, die mit traditionellen Anki-Workflows vertraut sind.

### 2. Multimodale Überprüfungsmodi
- **Standard-Flip-Modus**: Frage/Eingabeaufforderung anzeigen $\rightarrow$ Tippen, um die Antwort anzuzeigen $\rightarrow$ Rückruf bewerten:
  - **Noch einmal**: Vollständiger Fehler, Karte wird bald wiederholt.
  - **Schwer**: Schwieriges Erinnern, Intervall verlängert sich leicht.
  - **Gut**: Normaler Rückruf, optimales Intervall berechnet.
  - **Einfach**: Müheloses Abrufen, Intervall verlängert sich deutlich.
- **Lückentext-Lückentext**: Verborgene Wörter werden durch Tippen oder Tippen angezeigt.
- **Audio-First-Modus**: Hören Sie die native Aussprache des Satzes/Worts, bevor Sie den geschriebenen Text preisgeben.
- **Multiple-Choice-Modus**: Schneller Erkennungstest mit generierten Distraktoren.

![Multiple-Choice-Modus, der das Erinnern von "zurückkehren" gegen drei generierte Distraktoren testet](srs-review-mcq)

![Multiple-Choice-Modus bei einer zweiten Karte, "Information", mit neuen Distraktoren](srs-review-mcq-2)

### 3. Gestensteuerung und Tastenkombinationen
- **Mobile Gesten**:
  - Wischen Sie nach links $\rightarrow$ **Erneut**
  - Nach rechts wischen $\rightarrow$ **Gut**
  - Wischen Sie nach oben $\rightarrow$ **Einfach**
- **Desktop- und Tastaturkürzel**:
  - „Leertaste“ / „Enter“ $\rightarrow$ Antwort anzeigen
  - `1` $\rightarrow$ Nochmal | `2` $\rightarrow$ Schwer | `3` $\rightarrow$ Gut | `4` $\rightarrow$ Einfach
  - `Z` / `Cmd+Z` $\rightarrow$ Letzte Bewertung rückgängig machen

### 4. Sicherheit überprüfen und rückgängig machen
- Wenn Sie auf **Rückgängig** tippen, wird die letzte Bewertung zurückgesetzt, das vorherige Intervall wiederhergestellt und Sie können die Karte sofort neu bewerten.

### 5. Sitzungszusammenfassung und Analyse
- Bericht nach der Sitzung, der die untersuchten Karten, den Aufbewahrungsprozentsatz, die verstrichene Zeit und die Prognose des nächsten Überprüfungsplans anzeigt.

---

## 💡 Anwendung

1. **Eine Lernsitzung starten**:
   - Tippen Sie auf der Startseite auf **Tägliche Überprüfung starten**, um alle fälligen Karten zu studieren, oder tippen Sie auf einem bestimmten Deck auf **Überprüfen**.
2. **Bewerten Sie Ihren Rückruf ehrlich**:
   - Sehen Sie sich die vordere Eingabeaufforderung an. Versuchen Sie, sich vor dem Tippen an die Bedeutung, das Geschlecht und die Aussprache zu erinnern.
   - Tippen Sie auf **Antwort anzeigen**, um die Definition, Audio- und Beispielsätze anzuzeigen.
   - Wählen Sie die Note, die Ihre wahre Anstrengung widerspiegelt (**Noch einmal**, **Schwer**, **Gut**, **Einfach**).
3. **Audio-Autoplay verwenden**:
   - Konfigurieren Sie in den Einstellungen, ob die Aussprache automatisch abgespielt wird, wenn die Antwort angezeigt wird.

---

## ❓ Häufig gestellte Fragen

> [!IMPORTANT]
> **Was soll ich benoten, wenn ich die Bedeutung richtig, aber das grammatikalische Geschlecht falsch verstanden habe?**
> In geschlechtsspezifischen Sprachen (wie Deutsch oder Französisch) ist es am besten, die Bewertung „Noch einmal“ oder „Schwer“ zu vergeben, damit Sie den Artikel früher lesen.

> [!TIP]
> **Wie unterscheidet sich FSRS von SM-2?**
> FSRS modelliert die Speicherabrufbarkeit und -stabilität dynamisch, was zu bis zu 30 % weniger Bewertungen führt und gleichzeitig Ihren angestrebten Aufbewahrungsprozentsatz beibehält.