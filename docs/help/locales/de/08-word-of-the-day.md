# ✨Wort des Tages

> [!TIP]
> **Funktioniert mit oder ohne KI-Anbieter.** Mit einem konfigurierten und validierten Anbieter unter **Einstellungen → KI-Anbieter** wählt und erklärt die KI jeden Tag ein wirklich neues Wort. Ohne einen erscheint das tägliche Wort trotzdem, solange ein lokales Wörterbuchpaket installiert ist (**Einstellungen → Lokale Wörterbücher**) – nur wenn weder das eine noch das andere eingerichtet ist, zeigt der Startbildschirm stattdessen eine **Offline-Modus**-Karte ohne Wort und ohne tägliche Benachrichtigung.

**Wort des Tages** wählt ein Wort oder eine kurze Phrase pro Tag aus – wirklich neu für Sie, entsprechend Ihrem CEFR-Niveau – und zeigt es auf zwei Arten an: eine Karte auf dem Home-Dashboard und eine lokale tägliche Benachrichtigung, sodass Sie auch an einem Tag, an dem Sie die App nicht öffnen, etwas sehen, das es wert ist, gelernt zu werden.

![Das Wort-des-Tages-Popup mit Bedeutung, Erklärung und einem Beispielsatz im Kontext](word-of-the-day-popup)

---

## 🔍 Detaillierte Komponentenaufschlüsselung

### 1. Das Wort auswählen

- **Zuerst KI, dann lokales Wörterbuch**: Ist ein KI-Anbieter aktiv, wählt und schreibt die KI das heutige Wort komplett neu. Ohne einen wird stattdessen ein noch nicht gezeigtes Wort zufällig aus einem installierten Paket unter **Einstellungen → Lokale Wörterbücher** gewählt – mit dessen eigener Übersetzung, Erklärung und Beispiel, ganz ohne KI-Aufruf.
- **CEFR-maßgeschneidert** (nur KI): Die KI wird nach einem Wort gefragt, das zu Ihrer aktuellen Standardstufe passt (Einstellungen → Lernen), sodass ein Wort des Tages auf A2 nicht wie eines auf C1 aussieht. Installierte Wörterbuchpakete haben keine Niveaustufen, daher trägt ein Wort aus dem Wörterbuch kein CEFR-Abzeichen.
- **Niemals ein Wort, das Sie bereits haben**: Jedes Lemma, das sich bereits in Ihrer Bibliothek befindet, sowie eine fortlaufende 60-Wörter-Historie zuvor angezeigter Wörter des Tages werden ausgeschlossen – als explizite Ausschlussliste an die KI gesendet, oder direkt aus der Wörterbuchauswahl herausgefiltert. Dieselbe Ausschlussliste gilt für beide Quellen, sodass ein bereits gezeigtes Wort nicht wiederholt wird, egal welche Quelle das nächste liefert.
- **Verifiziert, nicht nur nett gefragt** (nur KI): Die App prüft das zurückgegebene Wort anhand derselben Ausschlussliste. Wenn die KI die Anweisung ignoriert und trotzdem etwas wiederholt, wird sie automatisch erneut versucht (bis zu drei Versuche, wobei das abgelehnte Wort jedes Mal zur Ausschlussliste hinzugefügt wird), bevor sie wieder das letzte Ergebnis akzeptiert.
- Ein KI-Wort enthält eine kurze Erklärung (≤30 Wörter) in Ihrer Muttersprache sowie einen Beispielsatz mit Übersetzung. Ein Wörterbuch-Wort zeigt die eigene Übersetzung/Erklärung dieses Pakets, und nur dann einen Beispielsatz, wenn der installierte Eintrag einen hat – das Popup lässt den Beispielabschnitt dann einfach weg, statt sich einen auszudenken.
- Hat keine der beiden Quellen heute noch etwas zu bieten (keine KI, und jedes installierte Wörterbuchwort wurde bereits gezeigt), bleibt das Wort vom Vortag stehen, statt dass die Karte leer wird.

### 2. Wenn es aktualisiert wird

- Die Regeneration wird überprüft, **jedes Mal, wenn die App in den Vordergrund wechselt** – beim Kaltstart, beim Zurückwechseln von einer anderen App oder beim Fortsetzen aus dem Hintergrund – nicht nur beim ersten Öffnen der App an diesem Tag. Ein veraltetes lokales Kalenderdatum („JJJJ-MM-TT“, Geräteuhr) löst ein neues Wort aus; Sobald das heutige Wort bereits existiert, ist die Prüfung sofort ein No-Op, sodass keine zusätzlichen Kosten entstehen.
- Wenn Sie Ihr CEFR-Niveau oder Ihr Ziel-/Muttersprachenpaar in den Einstellungen ändern, wird auch sofort ein neues Wort auf dem neuen Niveau ausgelöst – Ihnen wird nie ein altes Wort angezeigt, das mit einem Niveau markiert ist, von dem Sie sich inzwischen entfernt haben.
- Nichts wird mehr als einmal pro Kalendertag generiert, egal wie oft die App geöffnet wird.

### 3. Die tägliche Benachrichtigung

- Eine **lokale, geräteinterne Benachrichtigung** (keine Server-/Push-Infrastruktur beteiligt) wird einmal täglich zu einer festen Zeit ausgelöst – **standardmäßig 9:00 Uhr**, änderbar unter **Einstellungen → Lernen → Wort-des-Tages-Erinnerung** (stündliche Optionen, 6:00–22:00 Uhr).
- Es handelt sich wirklich um einen sich täglich wiederholenden Alarm, der auch an einem Tag ausgelöst wird, an dem Sie die App nie öffnen – mit dem Wort, das zuletzt generiert wurde, da Inhalte nicht neu generiert werden können, ohne dass die App ausgeführt wird. Wenn Sie die App das nächste Mal öffnen, wird das Wort aktualisiert und die Benachrichtigung für den *nächsten* Tag wird mit neuen Inhalten neu geplant (die veraltete wird zuerst gelöscht, sodass Sie nie zwei gleichzeitig ausstehende Benachrichtigungen haben).
- Erfordert Benachrichtigungsberechtigung – Sie werden einmal dazu aufgefordert, wenn ein Wort zum ersten Mal für die Planung bereit ist; Wenn Sie es ablehnen, funktionieren die Home-Karte und das Popup immer noch, Sie erhalten nur keinen täglichen Anstoß.
- **Wenn Sie auf die Benachrichtigung tippen, wird das gleiche zusammenfassende Popup** wie oben beschrieben geöffnet (nicht direkt zum Bildschirm mit den vollständigen Wortdetails) – von dort aus ist **Alle Details anzeigen** nur noch einen Fingertipp entfernt, wenn Sie es möchten.

### 4. Die Home-Karte und das Popup

- **Wort aus der KI**: eine kompakte Karte mit dem Wort, ein einzeiliger Teaser und ein „AI Discovery“-Abzeichen. Wenn Sie darauf tippen, wird das Popup geöffnet – Stichwort mit Audio-Aussprache, die vollständige Erklärung, ein Beispielsatz mit seiner Übersetzung (falls vorhanden) und **Vollständige Details anzeigen**, um den Bildschirm mit den echten Wortdetails zu öffnen und es einem Stapel hinzuzufügen.
- **Wort aus dem Wörterbuch** (keine KI konfiguriert, ein lokales Paket installiert): dieselbe Karte und dasselbe Popup, nur mit einem „Wörterbuch“-Abzeichen statt dessen, und einem kleinen Hinweis **KI einrichten für bessere tägliche Wörter →** unter der Karte – ein Anstoß, keine Sperre, da bereits ein echtes Wort angezeigt wird. Ein Tipp auf den Link öffnet denselben unten beschriebenen KI-oder-Wörterbuch-Einrichtungsdialog.
- **Keines von beidem verfügbar**: stattdessen eine „Offline-Modus“-Karte ohne angezeigtes Wort. Wenn Sie darauf tippen, wird der Einrichtungsdialog geöffnet (einen KI-Schlüssel hinzufügen, z. B. die kostenlose Version von Gemini, oder ein lokales Wörterbuchpaket installieren) statt irgendeines Wortinhalts, da noch nichts angezeigt werden kann.

### 5. Speicherung und Datenschutz

– Das heutige Wort, die eigene ID der Benachrichtigung (damit die alte durch eine Aktualisierung sauber gelöscht werden kann) und der 60-Wörter-Verlauf sind alle nur im SecureStore auf dem Gerät verfügbar – nichts darüber, welche Wörter Sie gesehen haben, verlässt das Gerät außer der Generierungsanforderung selbst, die an den von Ihnen konfigurierten KI-Anbieter gesendet wird.

---

## 💡 Gemeinsame Arbeitsabläufe

1. **Morgenroutine**: Die Benachrichtigung kommt zur von Ihnen gewählten Zeit an → tippen Sie darauf → lesen Sie das Popup → tippen Sie auf **Vollständige Details anzeigen**, wenn es sich lohnt, sie zu einem Deck hinzuzufügen, oder schließen Sie sie einfach und machen Sie weiter.
2. **Änderung bei Ankunft**: Einstellungen → Lernen → **Erinnerung an das Wort des Tages** → eine neue Stunde auswählen. Wenn das heutige Wort bereits existiert, wird die Dauerbenachrichtigung sofort auf die neue Zeit verschoben.
3. **Verwandeln Sie es in eine echte Karteikarte**: Vom Popup gelangen Sie mit **Vollständige Details anzeigen** zum vollständigen Wortdetailbildschirm, wo sich das Wort wie jede andere Suche verhält – fügen Sie es von dort aus einem Stapel hinzu.

---

## ❓ Häufig gestellte Fragen

> [!NOTE]
> **Warum steht auf meiner Karte „Wort des Tages“ „Offline-Modus“?**
> Weder ein KI-Anbieter noch ein installiertes lokales Wörterbuchpaket ist verfügbar. Fügen Sie unter **Einstellungen → KI-Anbieter** einen Schlüssel hinzu (Google Gemini hat eine kostenlose Stufe), oder installieren Sie ein Paket unter **Einstellungen → Lokale Wörterbücher** – eines von beiden genügt, damit ein echtes Wort erscheint.

> [!NOTE]
> **Mein Wort des Tages zeigt ein „Wörterbuch“-Abzeichen statt „AI Discovery“ – stimmt etwas nicht?**
> Nein – das ist ohne konfigurierten KI-Anbieter normal. Das Wort stammt aus einem installierten lokalen Wörterbuchpaket statt von der KI, hat also kein CEFR-Niveau und eventuell keinen Beispielsatz. Richten Sie einen KI-Anbieter ein für ein täglich vollständig KI-kuratiertes Wort, oder ignorieren Sie den Hinweis und nutzen Sie weiterhin die Wörterbuchquelle.

> [!TIP]
> **Ich habe mehrere Tage hintereinander dasselbe Wort gesehen, obwohl die Benachrichtigung ständig ausgelöst wurde – ist das ein Fehler?**
> Ja, ein veraltetes Wort konnte tagelang bestehen bleiben, wenn die App einfach im Hintergrund fortgesetzt und nicht vollständig neu gestartet wurde, da die Regenerationsprüfung früher nur einmal pro App-Sitzung ausgeführt wurde. Es führt jetzt jedes Mal eine erneute Überprüfung durch, wenn die App in den Vordergrund tritt, sodass dies nicht mehr passieren sollte. Wenn dies der Fall ist, wird die App durch erzwungenes Beenden und erneutes Öffnen immer sofort neu generiert.

> [!NOTE]
> **Kosten die tägliche Benachrichtigung zusätzliche KI-Nutzung, die über das hinausgeht, was ich bereits in der App sehe?**
> Nein. Die Benachrichtigung zeigt immer nur das an, was zuletzt während einer normalen In-App-Aktualisierung generiert wurde – sie löst nie selbst eine Generierung aus.