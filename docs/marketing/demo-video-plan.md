# Demo-Video — Plan (Zielgruppe: Anwälte)

**Status:** Planung. Noch nicht produziert.
**Zweck:** Ein Anwalt soll in 90 Sekunden verstehen, was custix macht — und glauben, dass das Dokument den Rechner nicht verlässt.

---

## 1. Entscheidungen (fix)

| Frage | Entscheidung |
|---|---|
| Länge Master | **90 Sekunden** |
| Ton | **Kein Voiceover.** Text-Overlays + dezente Musik |
| Einsatzorte | Website-Hero · Live im Sales-Gespräch · LinkedIn/Ads |
| Sprachen | DE zuerst, EN als Textaustausch (kein Neuschnitt) |

### Warum 90 Sekunden

- **Unter 60 s reicht nicht.** Anwälte kaufen kein Feature, sie geben ein Haftungsrisiko ab. Die Frage „verlässt mein Dokument den Rechner?" muss gezeigt, nicht behauptet werden.
- **Über 2 Minuten verliert die Zielgruppe.**
- **Der Demo-Kern braucht ~35 s** (4 Schritte, davon 2 mit echtem Aha-Moment). Schneller wirkt es wie ein Trick.

### Konsequenz aus „kein Voiceover"

Der Text trägt die gesamte Information. Daraus folgen harte Regeln:

- **Max. 8 Wörter pro Overlay-Card.**
- **Min. 2,0 s Standzeit** für kurze Cards, **3,0–3,5 s** für ganze Sätze.
- **Nie Text und wichtige Animation gleichzeitig** — der Zuschauer kann nur eines lesen.
- Ergibt ca. **14–16 Cards** über 90 s. Mehr passt nicht rein.

Vorteil: Das Video funktioniert stumm (Website-Autoplay, LinkedIn-Feed), der Sales-Präsentator kann live darüber sprechen, und DE→EN ist ein Textlayer-Tausch statt einer Neuproduktion.

---

## 2. Master-Skript (90 s, 16:9)

Beispieldaten sind **fiktiv** und werden im Bild einmal als solche gekennzeichnet (kleines Label „Beispieldaten"). Bei dieser Zielgruppe fällt sonst genau das auf.

### Beat 1 — Hook (0:00–0:08)

| Bild | Overlay |
|---|---|
| ChatGPT-Fenster. Ein Schriftsatz wird getippt: „…in der Rechtssache **Maria Hofer**, GZ **4 Cg 112/25v**…" | — |
| Cursor stoppt vor dem Senden-Button. Name und Aktenzeichen leuchten rot auf. | **„Dieser Prompt verlässt Ihre Kanzlei."** |

Die ersten 3 Sekunden entscheiden über den Feed-Scroll. Deshalb: keine Logo-Intro, kein Titel. Direkt in die Szene.

### Beat 2 — Einsatz (0:08–0:24)

| Bild | Overlay |
|---|---|
| Rotes Highlight bleibt, Hintergrund dimmt | **„§ 9 RAO. Verschwiegenheitspflicht."** |
| Drei Karten erscheinen nacheinander, jede wird durchgestrichen | „KI meiden" → *Wettbewerbsnachteil*<br>„Heimlich nutzen" → *Haftungsrisiko*<br>„Manuell schwärzen" → *30–60 Min pro Dokument* |
| Karten verblassen | **„Es gibt einen vierten Weg."** |

### Beat 3 — Demo, der Kern (0:24–0:59)

Das sind 35 der 90 Sekunden. Bewusst die längste Passage.

| Zeit | Bild | Overlay |
|---|---|---|
| 0:24–0:29 | Dokument wird in custix eingefügt | **„1 · Dokument einfügen"** |
| 0:29–0:38 | Entitäten leuchten auf und werden ersetzt:<br>`Maria Hofer` → `[PERSON_1]` (blau)<br>`Hauptstraße 12, 4020 Linz` → `[ADRESSE_1]` (grün)<br>`4 Cg 112/25v` → `[AKTENZEICHEN_1]` (amber)<br>Timer läuft sichtbar 0,0 → 4,2 s | **„2 · Automatisch anonymisiert"**<br>*„unter 5 Sekunden"* |
| 0:38–0:47 | Anonymisierter Text in ChatGPT, Antwort wird generiert — mit Platzhaltern darin | **„3 · KI nutzen — ohne Mandantendaten"** |
| 0:47–0:59 | Antwort zurück in custix. Platzhalter werden zu echten Namen. Fertiger Schriftsatz. | **„4 · Automatisch re-identifiziert"**<br>**„Echte Namen. Nie in der Cloud."** |

Der Timer in Schritt 2 ist wichtig: er belegt das „<5 Sekunden"-Versprechen der Website, statt es nur zu behaupten.

### Beat 4 — Vertrauen (0:59–1:14)

| Bild | Overlay |
|---|---|
| Kamera zieht auf: Laptop-Silhouette mit klarer Grenzlinie. Datenpfeile prallen an der Linie ab, verlassen das Gerät nicht. | **„100 % lokal"** |
| Grenzlinie leuchtet | **„Ihre Dokumente verlassen nie Ihren Rechner."** |
| Drei Logos: ChatGPT · Claude · Gemini | **„Funktioniert mit jeder KI."** |
| Badge | **„DSGVO-konform"** |

### Beat 5 — CTA (1:14–1:30)

| Bild | Overlay |
|---|---|
| custix-Logo auf Snow-Background | **„Geschlossene Beta — derzeit kostenlos."** |
| URL groß und ruhig stehen lassen (min. 4 s) | **„custix.ai"** |

---

## 3. Abgeleitete Schnitte

Beide entstehen aus demselben Material, kein neues Rendering von Grund auf.

### A) Website-Hero — 25,2 s, stumm, Loop  ·  **gebaut**

Prototyp liegt in [`video/`](../../video/README.md) (Remotion). Enthält
gegenüber der ursprünglichen 18-s-Planung zusätzlich den PDF-Import und den
sichtbaren Kopier-Schritt in eine externe KI:

`Klage_Hofer.pdf` rein → Scan mit mitlaufendem Timer → Platzhalter → Cursor
klickt **Kopieren** → der anonymisierte Prompt erscheint im Eingabefeld von
ChatGPT → Cursor klickt **Senden** → Antwort mit Platzhaltern → Cursor klickt
**Kopieren** → zurück in custix → Re-Identifizierung **in custix** → fertiges
`Schriftsatz_final.docx` raus. Ein einziges Overlay:
**„Anonymisieren. KI nutzen. Re-identifizieren."**

Kein CTA im Video — der Button steht als HTML daneben.

> Die Marken-Icons sind derzeit **Nachbauten**. Vor dem Livegang die offiziellen
> Assets von OpenAI, Anthropic und Google einsetzen (siehe offene Punkte).

> Ein 90-s-Autoplay im Hero ist zu lang. Der Loop ist der Hero, das 90-s-Video liegt hinter „So funktioniert's" ([hero.secondaryCta](messages/de.json) verlinkt schon dorthin).

### B) LinkedIn — 36,5 s, 9:16 und 1:1  ·  **gebaut**

Kompositionen `LinkedInCut` (1080×1920) und `SquareCut` (1080×1080) in
[`video/`](../../video/README.md). Beide teilen Szene und Timing und
unterscheiden sich nur im Layout-Objekt.

| Zeit | Inhalt |
|---|---|
| 0:00–0:08 | Hook: Prompt mit echten Mandantendaten tippt sich, Namen leuchten rot — „Dieser Prompt verlässt Ihre Kanzlei." · § 9 RAO |
| 0:08–0:11 | Übergang: custix-Lockup (Marke + Wortmarke) — „Verwende custix." |
| 0:11–0:19 | PDF rein, Scan mit Timer, Platzhalter |
| 0:19–0:23 | Klick auf „Kopieren", Browser übernimmt, Text wird eingefügt, Klick auf „Senden" |
| 0:23–0:27 | KI antwortet mit Platzhaltern, Klick auf „Kopieren" an der Antwort |
| 0:27–0:31 | Zurück in custix, Re-Identifizierung |
| 0:31–0:36 | „100 % lokal" · custix.ai · Geschlossene Beta |

Unter jedem Demo-Wort steht eine erklärende Zeile („Die KI sieht nur
Platzhalter – nie Ihre Mandantendaten"). Ohne Ton trägt sonst nichts die
Erklärung, und sie kostet keine Laufzeit.

**Kein Split-Screen.** Zwei gestapelte Fenster ergäben auf einem Handy rund
6 pt Schriftgröße. Deshalb steht immer nur ein Fenster im Bild, dafür groß;
den Kontrast lokal/extern tragen Bildunterschrift, Browser-Chrome und die
fliegende Karte. Im 9:16-Cut dauerhaft am unteren Rand: „100 % lokal · DSGVO-konform ·
< 5 Sekunden" — falls jemand nur die zweite Hälfte sieht. Quadratisch fehlt
dafür der Platz.

**Keine Marken-Logos im CTA.** Sie standen dort zunächst als „Funktioniert
mit" — das liest sich wie eine Integration, die es nicht gibt. Die Icons
bleiben nur in der Browser-Tableiste während der Demo.

---

## 4. Visuelle Sprache

Identisch zur Website, damit Video und Landingpage als ein Ding wirken. Referenz: [anonymization-mockup.tsx](src/components/anonymization-mockup.tsx).

| Rolle | Hex |
|---|---|
| Deep Navy (Headlines) | `#1E3A5F` |
| Royal Blue (CTA/Akzent) | `#2563EB` |
| Soft Amber (Trust/Highlight) | `#F59E0B` |
| Snow (Background) | `#F8FAFC` |
| Slate (Fließtext) | `#334155` |

Entitäten-Highlights: Personen `#DBEAFE` · Adressen `#DCFCE7` · Aktenzeichen `#FEF3C7`
Typo: Plus Jakarta Sans (Headlines) · Inter (Body) — wie auf der Website.

**Musik:** ruhig, sachlich, kein Corporate-Uplift-Klischee. Sie darf nie „Startup-Werbung" signalisieren — die Zielgruppe reagiert allergisch darauf. Ein Anschlag pro Beat-Wechsel reicht.

---

## 5. Produktionsweg

**Empfehlung: Remotion** (Video aus React) statt After Effects.

Begründung — bei dieser Konstellation ist das kein Geschmacksurteil:

1. Die UI im Demo-Kern muss **exakt** aussehen wie die echte App. Mit Remotion wird die bestehende React-Komponente wiederverwendet, statt sie in AE nachzubauen (und bei jedem UI-Update erneut nachzubauen).
2. **Drei Seitenverhältnisse** (16:9, 9:16, 1:1) aus einer Quelle — in AE sind das drei Kompositionen zum Pflegen.
3. **DE/EN** ist ein Austausch des Textlayers gegen `messages/en.json`, kein Neuschnitt.
4. Kein Voiceover heißt: keine Audio-Synchronisation nötig — der Hauptgrund, doch AE zu nehmen, entfällt.

Gegenargument, ehrlich: Remotion braucht Entwicklerzeit statt Designerzeit. Wenn ein Motion-Designer eingekauft werden soll, ist AE der richtige Weg — dann aber die UI-Screens als Screen-Recording der echten App liefern, nicht nachbauen lassen.

**Alternative für den Demo-Kern:** echte Bildschirmaufnahme der App, animierter Rahmen drumherum. Reine Animation sieht sauberer aus, *beweist* aber nichts — ein Anwalt sieht eine hübsche Grafik und denkt „Werbefilm". Die Mischung ist glaubwürdiger.

---

## 6. Offene Punkte

- [ ] Ist die App-UI im Demo-Kern schon vorzeigbar, oder muss der Screen gemockt werden?
- [ ] Fiktive Beispieldaten final festlegen (AT- oder DE-Aktenzeichenformat?)
- [ ] **Offizielle Marken-Assets** für ChatGPT/Claude/Gemini beschaffen und Nutzungsbedingungen prüfen — im Prototyp stehen Nachbauten (`video/src/components/BrandMarks.tsx`)
- [ ] Musiklizenz — Quelle und Budget
- [ ] Wer produziert: intern (Remotion) oder Freelancer (AE)?
