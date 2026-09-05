# ⛏️ Mining Studio und Passagen-Mining

**Mining Studio** ist der Ort, an dem echter Text, den Sie gelesen haben – ein Artikel, eine Nachricht, ein Untertitel – in Lernmaterial umgewandelt wird. Erfassen Sie eine Passage, dann erhalten Sie mit einem Fingertipp die **Übersetzung**, die **Grammatik**, die auf Ihrem Niveau erklärt wird, und vorgefertigte **Lernkarten** für die Wörter, die es wert sind, gelernt zu werden. Keine manuelle Suche, kein Wörterbuch-Springen.

![Die Mining-Studio-Passagenbibliothek mit einer erfassten und einer bereits geminten Passage](mining-studio-passage-library)

---

## 🚀 Bildschirmarchitektur und Schlüsselkomponenten

Die Funktion besteht aus zwei Bildschirmen: der **Mining Studio**-Liste (erfasste Passagen) und **Study & Mine** (Analyse einer Passage).

---

## 📍 So öffnen Sie Mining Studio

1. **Über das Home-Dashboard**: Tippen Sie auf die Aktionskachel **Mining-Warteschlange** unter dem Banner für die tägliche Auslastung (immer noch die Beschriftung auf der Startseite, auch wenn der Bildschirm selbst jetzt „Mining Studio“ heißt).
2. **In der unteren Tab-Leiste**: Tippen Sie auf die Registerkarte **Meine**.

---

## 🔍 Detaillierte Komponentenaufschlüsselung

### 1. Mining Studio – die Passagenbibliothek

Ein Durchgang bleibt hier, nachdem er abgebaut wurde, sodass Sie ihn jederzeit wieder besuchen können. Sie können sie jedoch jederzeit löschen, indem Sie oben rechts auf **Alle löschen** klicken.

Verschiedene Komponenten dieses Bildschirms sind wie folgt:

- **Keine unmittelbaren KI-Kosten bei der Erfassung**: Eine Passage wird lokal als Rohtext gespeichert; AI wird erst aufgerufen, wenn Sie es in Study & Mine öffnen.
- **Quellenabzeichen und Zeitstempel**: Bei jeder Aufnahme wird angezeigt, woher sie stammt – 📰 Artikel, 📋 Zwischenablage, ✏️ Handbuch, 📤 Freigabeblatt, ⌨️ Prozesstext (Android „Teilen an Lemony“) sowie Erweiterung und PDF-Quellen.
- **Anzahl der Zeichen**: Jede Passage zeigt ihre Länge; Die Erfassung ist auf **1000 Zeichen** begrenzt.
- **Mined-Anzeige**: Aus einer Passage mit einem *getönten grünen Hintergrund* und einem **Mined**-Abzeichen wurde bereits mindestens eine Karte abgebaut – dieser Status wird sofort aktualisiert, sobald Sie ein Wort hinzufügen, ohne dass Sie den Bildschirm verlassen und erneut öffnen müssen.
- **Zum Öffnen auf eine beliebige Stelle tippen**: Durch Tippen auf den Kartenkörper (nicht auf das Kontrollkästchen oder das Löschsymbol) wird **Study & Mine** für diese Passage geöffnet. Es gibt keinen separaten „Study & Mine“-Button, nach dem man suchen muss – die gesamte Karte ist der Button.
- **Übersichtskarte**: Wenn die Bibliothek leer ist, wird in der Mitte ein „Was ist Mining Studio?“ angezeigt. Die Karte erklärt die Funktion – sie verschwindet, sobald Sie eine Passage erfasst haben.

---

### 2. 📥 Eine Passage einfangen

#### A. Einfügen in die Zwischenablage mit nur einem Fingertipp
Tippen Sie auf die Schaltfläche ***+** und dann auf **Aus Zwischenablage einfügen** – kopierter Text (aus einem E-Book, einer Nachricht, irgendwo anders) wird eingefügt und auf 1000 Zeichen gekürzt, wenn er länger ist.

#### B. Systemfreigabeblatt und Android-Prozesstext
- **Share Sheet**: Markieren Sie Text in jeder App → **Share** → **Lemony**.
- **Android-Prozesstext**: Markieren Sie Text → das Dreipunktmenü des Systems → **Teilen an Lemony**.

#### C. Manuelles Hinzufügen („+“)
Tippen Sie in der Ecke auf ***, geben Sie eine Passage oder einen Satz direkt ein oder fügen Sie sie ein und **Passage speichern**. Der Komponist zeigt einen Live-Zeichenzähler gegen die 1000-Zeichen-Obergrenze.

---

### 3. 🧹 Durchgänge freimachen

- **Auswählen und löschen**: Tippen Sie auf das Kontrollkästchen einer beliebigen Passage, um sie auszuwählen, und dann auf **Ausgewählte löschen**, um nur diese zu entfernen.
- **Alle löschen**: Entfernt alle erfassten Passagen auf einmal.
- **Karten werden nie berührt**: Durch das Löschen einer Passage wird nur der Eroberungsdatensatz entfernt. Alle Karten, die Sie bereits daraus gewonnen haben, bleiben genau dort, wo sie sind, in Ihren Decks.

---

### 4. ✨ Study & Mine – Analyse einer Passage

Das Öffnen einer Passage fordert die KI einmal auf, drei Dinge zusammen zu produzieren:

1. **Fließende Übersetzung** – eine natürliche Übersetzung der gesamten Passage in Ihre Muttersprache.
2. **Grammatikaufschlüsselung** – 2–4 Erklärungen, abgestimmt auf *Ihr CEFR-Niveau* (aus den Einstellungen): Wortstellung und Kasus bei A1–A2, Nebensätze und Passiv bei B1–B2, Nominalstil und feste Kollokationen bei C1–C2. Jeder Punkt kann neben der Erklärung einen kurzen Regel-/Musterchip enthalten.
3. **Schlüsselwortschatz** – eine Auswahlliste von Wörtern, die es wert sind, aus der Passage gelernt zu werden, jedes mit seinem Wortteil, seiner kontextuellen Bedeutung und dem genauen Satz, in dem es vorkommt.

![Study & Mine mit der erfassten Passage und ihrer fließenden Übersetzung](mining-studio-study-and-mine-1)

![Study & Mine mit der Grammatikaufschlüsselung und dem extrahierten Schlüsselwortschatz](mining-studio-study-and-mine-2)

Das CEFR-Abzeichen neben der Passage (und neben dem Grammatikabschnitt) verwendet denselben grünen → gelben → violetten Stufenverlauf wie der Rest der App – es handelt sich nicht um eine feste Farbe.

**Caching**: Nach der Analyse bleibt die Übersetzung/Grammatik/das Vokabular einer Passage für den Rest der App-Sitzung im Speicher, sodass beim erneuten Öffnen keine erneuten Kosten für den KI-Anbieter entstehen. Dieser Cache wird geleert, wenn die App das nächste Mal vollständig geschlossen und neu gestartet wird (nicht nur im Hintergrund) – eine bewusste Entscheidung, damit eine lange laufende Sitzung schnell bleibt, ein neuer App-Start jedoch nicht für immer veraltete Analysen enthält. Tippen Sie jederzeit auf das **Aktualisierungssymbol** neben der Passage, um eine neue Analyse zu erzwingen – nützlich, wenn beim ersten Durchgang etwas übersehen wurde oder nachdem Sie Ihr CEFR-Level geändert haben.

---

### 5. Wörter zu deinen Decks hinzufügen

Wählen Sie eines der extrahierten Vokabelwörter aus (alle sind standardmäßig ausgewählt; **Alle auswählen/Alle abwählen** schaltet die gesamte Liste um) und tippen Sie auf **N Wörter zum Deck hinzufügen**. Dadurch wird das gleiche „DeckPickerModal“ geöffnet, das in der gesamten App verwendet wird (wählen Sie ein vorhandenes Deck aus oder erstellen Sie ein neues mit eigenen Überprüfungsmodi).

Während die Wörter hinzugefügt werden, wird eine Fortschrittsanzeige angezeigt („Hinzufügen von N Wörtern zu Ihrem Deck ...“). Der Deckpicker selbst schließt sich sofort, sodass das Overlay nicht dahinter verborgen bleibt.

Jedes Ergebnis ist eines von drei, und der abschließende Toast nennt genau, welche Wörter wo gelandet sind:

- **Hinzugefügt** – eine brandneue Karteikarte wurde erstellt, wobei der eigene Satz der Passage als Beispiel gespeichert wurde.
- **Bereits im Deck** – Sie hatten bereits eine Karte für dieses Wort *und* sie war bereits in diesem Deck; nichts ändert sich. Dies wird als „bereits vorhanden“ gemeldet, niemals als Fehler.
- **Fehlgeschlagen** – ein echter Fehler (z. B. ein Netzwerkproblem) verhinderte die Verarbeitung dieses einen Wortes.

Hinzufügen ist immer additiv: Ein Wort, das bereits an anderer Stelle existiert, wird an den neuen Stapel angehängt (nie dupliziert, niemals überschrieben), und ein Wort, das bereits im Zielstapel vorhanden ist, wird einfach in Ruhe gelassen. Sogar eine flektierte Form, die die App noch nie gesehen hat (ein Partizip Perfekt, eine seltene Konjugation), die die KI auf ein Wort zurückführt, das Sie bereits haben, wird als „bereits vorhanden“ erkannt und nicht fälschlicherweise als Fehler gemeldet.

---

### 6. Helfen Sie Akkordeons

Durch Tippen auf das **❓**-Symbol in der Kopfzeile eines der Bildschirme wird das eigene Hilfeblatt dieses Bildschirms geöffnet (beide tragen den Titel „Mining Studio-Hilfe“, ihr Inhalt ist jedoch spezifisch für den Bildschirm, von dem aus Sie sie geöffnet haben):

- **Auf der Mining-Studio-Liste**: wofür das Studio gedacht ist, wie das Mining-Abzeichen/Highlight funktioniert und wie man Passagen freiräumt.
- **On Study & Mine**: Wie die Passagenanalyse funktioniert, wie das Hinzufügen von Wörtern zu Decks die Ergebnisse meldet und wie die erneute Analyse einer Passage funktioniert.

---

## 💡 Gemeinsame Arbeitsabläufe

1. **Lesesitzungs-Mining**:
   - Kopieren Sie beim Lesen eines Artikels oder Buches in Ihrer Zielsprache einen Absatz, den Sie interessant oder schwierig finden.
   - Fügen Sie es über die Schaltfläche ***** in Mining Studio ein.
   - Öffnen Sie es in **Study & Mine**, lesen Sie die Übersetzungs- und Grammatiknotizen und fügen Sie dann die Vokabeln, die es wert ist, aufbewahrt zu werden, zu einem Stapel hinzu.
2. **Überprüfung einer Passage für weitere Wörter**:
   - Öffnen Sie eine Passage, die bereits das Abzeichen **Mined** aufweist – ihre Übersetzung und Grammatik sind noch vorhanden (aus dem Cache oder werden sofort neu generiert, wenn die Sitzung neu gestartet wurde).
   - Wählen Sie alle Wörter aus, die Sie beim ersten Mal übersprungen haben, und fügen Sie sie hinzu. Bereits ermittelte Wörter werden als „bereits vorhanden“ gemeldet, sodass keine Gefahr besteht, dass etwas dupliziert wird.
3. **Aufräumen der Bibliothek**:
   - Wählen Sie eine Reihe von Passagen aus, die Sie vollständig abgebaut haben und die Sie nicht mehr erneut besuchen müssen, und **Ausgewählte löschen** – die Karten, die sie erstellt haben, bleiben unberührt in Ihren Decks.

---

## ❓ Häufig gestellte Fragen

> [!TIP]
> **Werden durch das Löschen einer Passage die Lernkarten gelöscht, die ich daraus erstellt habe?**
> Nein. Durch das Löschen wird nur der erfasste Passagentext aus Mining Studio entfernt. Bereits zu einem Deck hinzugefügte Karten sind völlig unabhängig und bleiben an Ort und Stelle.

> [!NOTE]
> **Warum hat meine zweite Analyse derselben Passage nicht einen weiteren KI-Anruf gekostet?**
> Mining Studio speichert die Analyse einer Passage für den Rest der aktuellen App-Sitzung zwischen. Beim erneuten Öffnen wird aus diesem Cache gelesen, anstatt die KI erneut aufzurufen. Mit dem Aktualisierungssymbol neben der Passage können Sie jederzeit einen neuen Cache erzwingen.

> [!NOTE]
> **Ein Wort, das ich hinzugefügt habe, wird als „bereits vorhanden“ angezeigt, anstatt hinzugefügt zu werden – ist das ein Fehler?**
> Nein. Das bedeutet, dass Sie bereits eine Karteikarte für dieses Wort im ausgewählten Stapel haben, sodass keine Änderungen erforderlich sind. Es wird getrennt von einem echten Fehler gemeldet, sodass Sie immer genau wissen, was mit jedem Wort passiert ist.