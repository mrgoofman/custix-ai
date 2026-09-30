# custix.ai × finditoo – Landingpage zum Einbauen

Stand: 30.09.2026 · Ansprechpartner custix.ai: Lorenz Kutschka

Diese Landingpage stellt custix.ai Ihren Kundinnen und Kunden vor und nimmt
Registrierungen für die 14-tägige Testphase direkt auf Ihrer Seite entgegen.
Konto, Testphase, E-Mails und Abrechnung laufen über custix.ai – Sie müssen
nichts betreiben.

## Was Sie bekommen

| Was | Wofür |
|---|---|
| **Vorschau:** https://custix.ai/finditoo/ | So sieht die Seite aus. Das Formular dort ist eine Demo und legt kein Konto an. |
| `landing.html` (liegt bei; auch in der Vorschau oben „Code herunterladen“) | Die ganze Seite als ein Block für ein Elementor-**HTML**-Widget: Hero mit Video, Vorteile, „So funktioniert's“, FAQ, Registrierung. |
| Einbettungscode (unten) | Nur das Formular – falls Sie die Inhalte lieber selbst in Elementor bauen. |

## Einbau in Elementor

1. Neue Seite anlegen, zunächst **als Entwurf** (nicht veröffentlichen). Die
   geplante Adresse teilen Sie uns bitte mit: `{{PAGE_URL}}`
2. Seitenlayout „Elementor – volle Breite“, einen Abschnitt mit **voller
   Breite und ohne Innenabstand** anlegen.
3. Ein **HTML**-Widget hineinziehen und den kompletten Inhalt von
   `landing.html` einfügen.
4. Speichern und in der Vorschau prüfen. Das Formular zeigt „in Kürze
   verfügbar“, bis wir es für Ihre Domain freischalten – sagen Sie uns
   Bescheid, sobald die Entwurfsseite steht.

Header und Footer kommen wie gewohnt von Ihrem Theme.

### Nur das Formular einbetten

```html
<div id="custix-signup" data-partner="finditoo"></div>
<script src="https://custix.ai/partner/signup.js" defer></script>
```

Farben und Schrift lassen sich über CSS-Variablen anpassen, z. B. in
Elementor unter „Benutzerdefiniertes CSS“:

```css
#custix-signup .cxs-root {
  --cxs-primary: #3D00FF;   /* Knöpfe, Fokus */
  --cxs-ink: #1B1635;       /* Überschriften, Labels */
  --cxs-radius: 6px;
  --cxs-font: Inter, sans-serif;
}
```

## Was Sie anpassen dürfen – und was nicht

- **Frei:** alle Texte, Bilder, Farben und die Reihenfolge der Abschnitte –
  es ist Ihre Seite.
- **Bitte unverändert lassen:** den Abschnitt „Registrierung“ (die
  `<div id="custix-signup">` und das `signup.js`-Skript). Das Formular pflegen
  wir zentral; Änderungen an Fehlermeldungen, Preisen oder Download-Links
  kommen so ohne Ihr Zutun bei Ihnen an.
- **Preisangaben** (15 € / Monat oder 150 € / Jahr pro Arbeitsplatz, inkl.
  USt.) bitte nur in Absprache ändern – sie müssen zu custix.ai passen.

## WP Rocket

Unter **Einstellungen → WP Rocket → Datei-Optimierung → JavaScript**:

- **„JavaScript-Ausführung verzögern“:** diese beiden Einträge bei den
  Ausnahmen ergänzen – sonst erscheint das Formular erst nach dem ersten
  Scrollen oder Klicken:
  ```
  custix.ai/partner/signup.js
  challenges.cloudflare.com
  ```
- **„JavaScript-Dateien kombinieren“** (falls aktiv): `custix.ai` ausnehmen.
- Nach dem Einbau den WP-Rocket-Cache der Seite leeren.

## Tracking: Formular bitte nicht mitschneiden

Das Formular fragt ein Passwort ab. Tracking-Werkzeuge dürfen Eingaben daraus
nicht erfassen – sonst stimmt die Zusage auf der Seite nicht mehr, dass die
Angaben nur an custix.ai gehen:

- **Google Analytics / Google Ads:** „Erweiterte Conversions“ mit automatischer
  Erkennung von Formularfeldern für diese Seite **nicht** verwenden.
- **Meta-Pixel:** „Automatischer erweiterter Abgleich“ für diese Seite aus.
- **Hotjar, Microsoft Clarity, PostHog:** Das Formular ist bereits für diese
  Tools markiert (`data-hj-suppress`, `data-clarity-mask`, `ph-no-capture`);
  bitte trotzdem „Eingaben aufzeichnen“ nicht aktivieren.
- Seitenaufrufe und Klicks auf „14 Tage kostenlos testen“ zu messen ist
  unproblematisch.

## Datenschutz auf Ihrer Seite

Das Formular lädt zwei Dienste, die in Ihrer Datenschutzerklärung (bzw. Ihrem
Cookie-Banner) genannt werden sollten. **Vorschlag – bitte von Ihrer
Datenschutzverantwortlichen prüfen lassen:**

> **custix.ai-Registrierung.** Auf dieser Seite binden wir ein
> Registrierformular der snekmedia GmbH (custix.ai) ein. Beim Laden werden
> Skript, Video und Vorschaubild von custix.ai abgerufen; dabei wird Ihre
> IP-Adresse an custix.ai übermittelt. Angaben, die Sie in das Formular
> eintragen, gehen direkt an custix.ai und werden nicht an uns übermittelt.
> Verantwortlich dafür ist die snekmedia GmbH; Einzelheiten in der
> Datenschutzerklärung unter https://custix.ai/datenschutz.
>
> **Cloudflare Turnstile.** Zum Schutz vor missbräuchlichen Registrierungen
> verwendet das Formular Cloudflare Turnstile (Cloudflare, Inc.). Dabei werden
> technische Merkmale Ihres Browsers und Ihre IP-Adresse an Cloudflare
> übermittelt. Turnstile setzt keine Cookies zu Werbezwecken.

custix.ai setzt über das Formular keine Cookies auf Ihrer Seite.

## Test vor dem Go-live

1. Sie legen die Entwurfsseite an und nennen uns Adresse und – falls
   vorhanden – Ihre Staging-Domain (`{{STAGING_HOST}}`).
2. Wir schalten das Formular für Ihre Domain frei.
3. Gemeinsame Testregistrierung mit einer Testadresse; wir prüfen die
   Zuordnung bei uns und löschen das Testkonto danach.
4. Seite veröffentlichen.

## Was passiert nach der Registrierung?

- Das Formular zeigt die Download-Knöpfe (Windows, macOS) – immer die
  aktuelle Version.
- Die Person bekommt eine Bestätigung per E-Mail von custix.ai, mit Link zur
  Download-Seite.
- In der App meldet sie sich mit E-Mail und Passwort an; die Testphase läuft
  14 Tage und endet automatisch. Ein Abo schließt sie bei Bedarf auf
  custix.ai ab.
- Bereits registrierte Adressen werden erkannt; die Person wird auf die
  Anmeldung in der App verwiesen.

Auswertungen (Registrierungen, genutzte Konten, Abschlüsse) bekommen Sie
von uns als Summen – personenbezogene Daten geben wir nicht weiter.
