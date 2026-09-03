# 📖 Wortdetails und Kartenersteller

Der Bildschirm **Wortdetails** ist der zentrale sprachliche Tiefgang in Lemmory. Es zerlegt jedes Wort in mehrere semantische Bedeutungen, Audioaussprachen, kontextbezogene Beispielsätze, gezielte Grammatikübungen, KI-Synonymnuancen, Redewendungen und Lückentext-Lernkarten.

![Der Wortdetails-Bildschirm für "laufen" mit seinen semantischen Kontexten und Beispielen](word-detail-card-creator)

---

## 🔍 Detaillierte Komponentenaufschlüsselung

### 1. Linguistische Kopfzeile und Grammatikinformationen
- **Stichwort- und Quellenabzeichen**: Zeigt das kanonische Lemma mit einem Symbol an, das seinen Ursprung angibt (Offline-Wortführer 📖, Übersetzungsmaschine 🌐 oder aktiver KI-Anbieter ✨).
- **Audio-Synthesizer (🔊)**: Sofortige native Text-to-Speech-Audioaussprache in der Zielsprache.
- **Einklappbare Grammatikinformationen („formsToggle“)**: Tippen Sie, um Wortarten, grammatikalisches Geschlecht, Pluralformen und alle bekannten flektierten/konjugierten Variationen (z. B. *schlendert*, *schlenderte*, *geschlendert*) zu erweitern oder zu reduzieren.
- **Automatische KI-Anreicherung im Hintergrund**: Beim Öffnen eines neu erstellten Wortes zeigt ein dezentes, nicht blockierendes Abzeichen (*✨ KI bereichert Bedeutungen und Beispiele...*) an, dass die KI im Hintergrund vollständige Sätze und Synonyme generiert.

---

### 2. Semantische Kontexte (Sense Switcher)

Viele Wörter haben mehrere völlig unterschiedliche Bedeutungen (zum Beispiel kann das deutsche Verb **einstellen** *einstellen*, *anpassen* oder *anhalten* bedeuten). Anstatt alle nicht zusammenhängenden Definitionen auf eine verwirrende Karte zu packen, teilt **Lemmory** sie automatisch in separate **Semantische Kontexte (Sinne)** auf.

#### Warum Sinnessegmentierung wichtig ist
- **Vermeidet Gedächtnisstörungen**: Der Versuch, sich einzuprägen, dass ein einzelnes Wort auf derselben Karteikarte sowohl „jemanden einstellen“ als auch „eine Maschine einstellen“ bedeutet, führt zu Verwirrung und verlangsamt die Erinnerung.
- **Isolierte Kontexte**: Jeder Sinn fungiert als eigenständige sprachliche Einheit. Wenn Sie auf eine Sinneskapsel tippen, wird der gesamte Bildschirm dynamisch aktualisiert, um nur diese spezifische Bedeutung anzuzeigen:
  - **Definitionen und Erläuterungen**: Direkt auf diese Verwendung zugeschnitten.
  - **Beispielsätze**: Speziell für diese Situation generiert.
  - **Synonyme und Nuancen**: Nur für diesen bestimmten Sinn relevant.
  - **CEFR Schwierigkeitsabzeichen**: Unabhängig bewertet (z. B. grundlegendes körperliches Verständnis bei „A2“ vs. idiomatisches oder geschäftliches Verständnis bei „B2“).

---

#### 📌 Konkretes Beispiel: Deutsches Verb *"einstellen"*

Betrachten Sie das deutsche Verb „einstellen“**, das mehrere völlig unterschiedliche Bedeutungen in der realen Welt hat:

| Sinneskapsel | Bedeutung & Nuance | Beispielsatz | Synonyme (AI Nuance) | Zieldeck |
| :--- | :--- | :--- | :--- | :--- |
| **Sinn 1: Beschäftigung** `[B1]` | *Um Personal einzustellen, zu rekrutieren oder zu beschäftigen.* | *"Das Unternehmen möchte neue Mitarbeiter **einstellen**."* (*Das Unternehmen möchte neue Mitarbeiter einstellen.*) | *anstellen*, *beschäftigen*, *rekrutieren* | 💼 *Geschäftsdeutsch* |
| **Sense 2: Anpassung / Einstellungen** `[A2]` | *Um ein Gerät anzupassen, zu konfigurieren oder abzustimmen.* | *"Kannst du bitte die Lautstärke am Radio **einstellen**?"* (*Können Sie bitte die Lautstärke am Radio einstellen?*) | *anpassen*, *justieren*, *regulieren* | 🏠 *Alltagsdeutsch* |
| **Sinn 3: Beendigung / Beendigung** `[B2]` | *Um eine Aktivität zu beenden, abzubrechen oder zu beenden.* | *"Wegen des Sturms musste die Bahn den Betrieb **einstellen**."* (*Wegen des Sturms musste der Zug den Betrieb einstellen.*) | *beenden*, *aufhören*, *stoppen* | 📰 *Lesung für Fortgeschrittene* |

---

#### 🎯 Multi-Deck-Sense-Zuweisung („createCardForSense“)
- **Keine Überschreibungen**: Wenn Sie **Sinn 1 (*zum Anheuern*)** zu Ihrem *Geschäftsdeutsch*-Deck hinzufügen und später **Sinn 2 (*zur Anpassung*)** zu Ihrem *Alltagsdeutsch*-Deck hinzufügen, erstellt Lemmory zwei saubere, unabhängige Karteikarten.
- Jedes Deck übt den genauen Sinn, die Übersetzung, das Audio und den Beispielsatz, die für seine Lernziele relevant sind, während beide mit demselben zugrunde liegenden Wortlemma verknüpft bleiben.

---

### 3. Bedeutung Karte und Kartenaktionssymbolleiste

#### Primäre Bedeutungskarte
- Zeigt die kanonische Übersetzung in Ihrer Muttersprache an.
- Inline-Erklärung auf KI-Karten, die detailliert beschreibt, *wie*, *wann* und *in welchem ​​Ton* das Wort verwendet wird.

#### Aktionssymbolleiste („CardActionBar“)
- **ℹ️ Weitere Informationen/Erklärung**:
  - Auf KI-Karten: Öffnet das **KI-Erklärungsblatt** mit ausführlicher Etymologie, Verwendungsnuancen und Tonaufschlüsselungen.
  - Auf Wörterbuchkarten: Öffnet das umfangreiche **Word Guide Modal** mit vollständigen Konjugations-/Deklinationstabellen.
- **💬 Ask AI**: Öffnet das interaktive **Word-Chat-Blatt** („WordChatSheet“) – ein KI-Sprachtutor für dieses Wort, in dem Sie benutzerdefinierte Fragen stellen können (z. B. *„Was ist der Unterschied zwischen schlendern und bummeln?“*).
- **✨ Regenerieren**: Löst eine vollständige KI-Neugenerierung der Definitionen, Beispiele, Synonyme und Kollokationen der Karte mit Bestätigungsschutz aus.
- **✏️ Bearbeiten**: Öffnet einen Inline-Editor zum manuellen Anpassen von Übersetzungen und Sätzen mit einer integrierten Schaltfläche **Mit KI generieren**.
- **🗑️Löschen**: Entfernt das Wort, die Karte und den zugehörigen Rezensionsverlauf dauerhaft aus Ihrer Bibliothek.
- **🌐 Web durchsuchen**: Verknüpfung mit einem Fingertipp, um das Wort bei Google nachzuschlagen.

---

### 4. Kontextuelle Beispielsätze

- **Kontexttonfilter**: Filtern Sie Beispielsätze nach Situation mithilfe des Dropdown-Menüs:
  - **Alle Beispiele**
  - **Lässig** (☕)
  - **Formell** (🎖️)
  - **Geschäft** (💼)
  - **Reisen** (✈️)
  - **Alltag** (🏠)
  - **Slang** (✨)
- **Satz-Audio (🔊)**: Hören Sie sich vollständige Beispielsätze an, die in natürlicher Kadenz gesprochen werden.
- **`+` (Karte zum Deck hinzufügen)**: Wandelt diesen speziellen Beispielsatz direkt in eine spezielle Karteikarte in jedem Deck um.
- **`⋯` (Drei-Punkte-Menü)**:
  - **⭐ Auf Karteikarte verwenden**: Legen Sie fest, welcher Beispielsatz als primärer Kontext auf Ihrer Karteikarte angezeigt wird.
  - **Qualitätsbewertung (👍 / 👎)**: Bewerten Sie die Natürlichkeit des Beispiels, um zukünftige KI-Generationen zu kalibrieren.

---

### 5. Erweiterte Grammatikoptionen Modal
- Zugriff über die Schaltfläche **Erweiterte Grammatikoptionen** unter den Beispielen.
- **Grammatikstrukturauswahl**: Wählen Sie bestimmte Grammatikregeln aus, die Sie in Ihren Sätzen üben möchten (z. B. *Perfekt*, *Passiv*, *Konjunktiv II/Konjunktiv II*, *Nebensätze mit „weil/obwohl“*).
- **Benutzerdefinierte Grammatikregel**: Geben Sie Ihre eigene Eingabeaufforderungsregel ein (z. B. *„Mit zwei Dativpronomen verwenden“*) und tippen Sie auf „+“.
- **Gezielte Beispiele generieren**: KI generiert neue Sätze, die sich strikt an Ihre ausgewählten Grammatikmuster halten und mit hervorgehobenen Abzeichen gekennzeichnet sind.

---

### 6. Synonyme und On-Demand-KI-Nuancen
- **Synonymliste**: Verwandte Wörter im gleichen semantischen Kontext.
- **✨ KI-Nutzung und Nuance**: Tippen Sie auf das Glitzersymbol neben einem beliebigen Synonym, um eine sofortige KI-Aufschlüsselung mit folgenden Erläuterungen abzurufen:
  - Wie es sich in Formalität, Nuance und Konnotation vom Stichwort unterscheidet.
  - Formalitäts-Tags (z. B. *formal*, *umgangssprachlich*, *literarisch*).
- **↗ Karteikarte öffnen**: Tippen Sie auf das Symbol für den externen Link, um direkt zum vollständigen Wortdetailbildschirm des Synonyms zu springen.

---

### 7. Phrasen und idiomatische Kollokationen
- Gebräuchliche idiomatische Ausdrücke, zusammengesetzte Redewendungen und Kollokationen mit dem Wort.
- Zeigt Ausdruck, Bedeutung und einen vollständigen zweisprachigen Kontextsatz mit CEFR-Level-Tags an.
- **Mit KI erkunden / Mehr mit KI laden**: Generiert bei Bedarf zusätzliche natürliche Phrasen.

---

### 8. Lückentext-Löschungsvorschau und -Editor
- Zeigt aktive Lückentextkarten mit verdeckten Zielwörtern an („[...]“).
- Integriert in das **Cloze Editor Sheet**, um Sätze, Antworten und Kontexthinweise anzupassen.

---

### 9. Sticky Bottom Action Bar & Deck Picker
- **Zum Deck hinzufügen**: Markanter Sticky-Button am unteren Bildschirmrand.
- **DeckPickerModal-Integration**:
  - Zeigt alle Decks mit grünen Häkchen (** ✓ **) für Decks an, die diese Karte bereits enthalten.
  - Zeigt Deck **Review-Modus-Abzeichen** an (⇄ Vokabeln, ⮌ Umkehren, T Lückentext, ☰ Quiz, ✓ Richtig/Falsch).
  - **Interaktives Lückentext-Setup**: Wenn für das ausgewählte Deck Lückentextübungen aktiviert sind, erscheint nach der Auswahl des Decks sofort im nächsten Bildschirm eine leere Auswahl. Tippen Sie auf ein beliebiges Wort im Satz, um es in ein Leerzeichen umzuwandeln (tippen Sie erneut, um den Vorgang rückgängig zu machen). Sie können mehrere Leerzeichen im selben Satz markieren.
  - **Neues Deck erstellen**: Wenn Sie abschließend auf die Schaltfläche **Neues Deck erstellen** tippen, wird im Handumdrehen ein neues Deck erstellt, ohne die Wortseite zu verlassen.

---

### 10. Word-Detail-In-App-Hilfe (❓)
- Zugriff über das Fragezeichen-Symbol in der oberen Kopfzeile („HELP_SECTIONS“):
  - **Bedeutungs- und Sinnesumschaltung**
  - **Beispielsatzaktionen und Lernkartenauswahl**
  - **Erweiterte Grammatikoptionen und Eingabeaufforderungen für benutzerdefinierte Regeln**
  - **Symbolleistenaktionen (Erklären, AI fragen, Neu generieren, Bearbeiten)**
  - **Synonyme und KI-Nuancen**
  - **Lückentextkarten und Überprüfungsmodi**
  - **Mehrdeck-Zuordnung**

---

## 💡 Gemeinsame Arbeitsabläufe

1. **Erstellen einer benutzerdefinierten Lückentextkarte**:
   - Öffnen Sie den Wortdetailbildschirm.
   - Tippen Sie auf **Zum Stapel hinzufügen** $\rightarrow$. Wählen Sie einen Stapel mit Lückentext. $\rightarrow$ Tippen Sie auf Wörter im Satz, um Leerzeichen zu setzen. $\rightarrow$ Speichern.
2. **Spezifische Grammatikstrukturen üben**:
   - Tippen Sie auf **Erweiterte Grammatikoptionen**.
   - Wählen Sie *Konjunktiv II* und *Nebensätze*.
   - Tippen Sie auf **Gezielte Beispiele generieren**.
   - Wählen Sie Ihren Lieblingssatz aus und tippen Sie auf „+“, um ihn Ihrem *Grammatikübungs*-Deck hinzuzufügen.
3. **Mit KI über Nuancen chatten**:
   - Tippen Sie in der Aktionsleiste auf **💬 Ask AI**.
   - Fragen Sie: *„Darf ich dieses Wort in einem formellen Vorstellungsgespräch verwenden?“*
   - Erhalten Sie sofortige, kontextbezogene Ratschläge von Ihrem persönlichen KI-Tutor.

---

## ❓ Häufig gestellte Fragen

> [!TIP]
> **Was passiert, wenn ich „Auf Flashcard verwenden“ auswähle?**
> Wenn Sie ein Beispiel als primär festlegen, wird sichergestellt, dass ein bestimmter Satz und eine bestimmte Übersetzung während der täglichen Wiederholung auf Ihrer Haupt-Lernkarte mit räumlichen Wiederholungen erscheinen.

> [!NOTE]
> **Kann ich KI-generierte Karten bearbeiten, wenn ich einen Satz optimieren möchte?**
> Ja! Tippen Sie in der Aktionsleiste auf die Schaltfläche **✏️ Bearbeiten**, um Übersetzungen und Sätze anzupassen oder alternative Phrasen zu generieren.