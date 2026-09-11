# custix Demo-Video — Remotion

Zwei Schnitte aus [../docs/marketing/demo-video-plan.md](../docs/marketing/demo-video-plan.md):

| Komposition | Format | Länge | Zweck |
|---|---|---|---|
| `HeroLoop` | 1920×1080 | 27,3 s, nahtlose Schleife | Website-Hero, stumm |
| `LinkedInCut` | 1080×1920 | 58,3 s | Feed hochkant, stumm |
| `SquareCut` | 1080×1080 | 58,3 s | Feed quadratisch, stumm |
| `LandscapeCut` | 1920×1080 | 58,3 s | Website, YouTube, Sales-Gespräch |

Alle vier teilen dieselben Panels; die Frames kommen über `useTiming()` aus
dem Context, damit ein Fenster nicht viermal existiert.

Die Wortmarke steht in den drei Erklär-Schnitten **durchgehend** oben links —
ausgeblendet nur auf den beiden Karten, die das Logo ohnehin groß zeigen.
Im `HeroLoop` fehlt sie bewusst: der läuft auf custix.ai direkt unter dem
Logo der Navigation.

Eigener Workspace mit eigener `package.json` — bewusst **außerhalb** des
Next.js-Projekts, damit die Cloudflare-Worker-Dependencies unangetastet bleiben.

## ⚠️ Vor jeder Veröffentlichung

Die Marken-Icons in [`src/components/BrandMarks.tsx`](src/components/BrandMarks.tsx)
sind **Vektor-Nachbauten, keine offiziellen Assets**. Vor dem Livegang die
echten SVGs von den Brand-/Press-Seiten von OpenAI, Anthropic und Google
einsetzen und deren Nutzungsbedingungen prüfen. Die Datei ist der einzige Ort,
an dem dafür etwas geändert werden muss.

## Voraussetzung

Node ≥ 20 (Remotion-Renderer). Im Repo läuft die Website auf Node 18, dieser
Ordner braucht mehr:

```bash
nvm use 22
```

## Befehle

```bash
npm run dev
```

Remotion Studio öffnet sich, Timeline scrubbar — der schnellste Weg, Timings zu
beurteilen.

```bash
npm run render:web        # out/hero-loop-web.mp4   – Website-Hero, ~2 MB
npm run render:linkedin   # out/linkedin-9x16.mp4   – Feed hochkant
npm run render:square     # out/square-1x1.mp4      – Feed quadratisch
npm run render:landscape  # out/explainer-16x9.mp4  – Website / YouTube
```

Alle drei Erklär-Schnitte teilen Szene **und** Timing und unterscheiden sich
nur im Layout-Objekt (`src/vertical/layouts.ts`). Eine Timing-Änderung wirkt
automatisch auf alle drei.

`npm run render` erzeugt die verlustärmere Master-Datei des Hero-Loops,
`npm run render:webm` zusätzlich VP9.

## Ablauf (660 Frames, 30 fps)

| Sekunde | Was passiert |
|---|---|
| 0,6–2,8 | `Klage_Hofer.pdf` fliegt in die Dropzone, Text wird extrahiert |
| 3,6–7,8 | Scan-Linie läuft durch, Entitäten leuchten auf, Timer zählt 0,0 → 4,2 s |
| 7,8–9,6 | Entitäten werden zu Platzhaltern |
| 9,6–11,6 | „In die Zwischenablage kopiert" + Textkarte fliegt in den Browser |
| 11,6–14,8 | Externe KI (ChatGPT-Tab) antwortet — mit Platzhaltern |
| 15,0–16,4 | Antwortkarte fliegt zurück nach custix |
| 16,4–18,6 | Re-Identifizierung **in custix** |
| 19,6–21,2 | Fertiges `Schriftsatz_final.docx` verlässt das Fenster |

## Ton — aus

Alle drei Schnitte laufen **stumm**. Die Tonebene existiert noch im Code
(`scripts/make-sfx.py`, `src/vertical/FeedAudio.tsx`, `public/sfx/`), ist aber
per Default abgeschaltet. Wieder einschalten:

```bash
npx remotion render LinkedInCut out/x.mp4 --props='{"withSound":true,"withMusic":true}'
```

## Aufbau

| Datei | Zweck |
|---|---|
| `src/timeline.ts` | **Einziger Ort für Timings.** Alle Frames zentral |
| `src/data.ts` | Fiktiver Schriftsatz + KI-Antwort als Segmente mit Platzhaltern |
| `src/theme.ts` | Farbtokens 1:1 aus `src/app/globals.css` der Website |
| `src/components/RichText.tsx` | Segmente, Highlight, Platzhaltertausch, Tipp-Effekt |
| `src/components/DocumentPanel.tsx` | custix-Fenster inkl. Dropzone, Scan-Linie, Timer |
| `src/components/BrowserWindow.tsx` | Browser mit den KI-Tabs — das *externe* Fenster |
| `src/components/BrandMarks.tsx` | ⚠️ Platzhalter-Icons, siehe oben |
| `src/components/FileCard.tsx` | PDF rein / .docx raus |
| `src/components/TransferCard.tsx` | Der sichtbare Weg zwischen custix und KI |
| `src/components/WordOverlay.tsx` | Die drei Overlay-Wörter (16:9) |
| `src/components/HookWindow.tsx` | Der Prompt mit echten Namen — nur Feed-Cuts |
| `src/components/Cursor.tsx` | Mauszeiger mit Klick — liegt im jeweiligen Fenster |
| `src/components/CopyPill.tsx` | „Kopieren" → „Kopiert" |
| `src/timing.tsx` | Context, über den beide Schnitte ihre Frames beziehen |
| `src/vertical/timeline.ts` | Timings beider Feed-Cuts |
| `src/vertical/FeedCut.tsx` | Die gemeinsame Feed-Szene |
| `src/vertical/layouts.ts` | Geometrie für 9:16 und 1:1 |

## Fokus: Erklären und Zeigen sind getrennt

Rückmeldung zur zweiten Fassung: *„optisch gut, aber die Message kommt nicht
an, ist zu schnell, zu wenig Fokus."* Ursache war, dass Text und Animation
gleichzeitig liefen — der Zuschauer musste lesen und zusehen zugleich.

Die Feed-Cuts sind deshalb umgebaut: **Vollbildkarte, dann Animation.** Jeder
der vier Schritte bekommt zuerst eine eigene Karte mit Nummer, Titel und
Erklärung; danach läuft die Animation, mit dem Titel klein am oberen Rand.

Struktur (55 s):

| Zeit | Inhalt |
|---|---|
| 0–6,8 s | Hook: Prompt in ChatGPT, Kamera fährt aufs Eingabefeld, Mandantendaten leuchten **nacheinander** rot |
| 5,6–9,3 s | Chatfenster ist weg, allein im Bild: „Mit diesem Prompt verletzen Sie bereits das Gesetz." · § 9 RAO |
| 8,9–13,9 s | custix erklärt sich · „Und so funktioniert’s:" |
| 13,6–18,2 s | Schritt 1 · Datei laden |
| 18,2–30,0 s | Schritt 2 · Pseudonymisieren |
| 30,0–43,5 s | Schritt 3 · KI nutzen |
| 43,5–52,4 s | Schritt 4 · leeres Feld, einfügen, re-identifizieren |
| 52,6–57,0 s | Abspann |

Die Rechtsfolge kommt **nach** dem Ausblenden des Chatfensters, nicht darüber
— sonst konkurriert sie mit dem Bild, das sie erklärt.

## Warum der Loop nahtlos ist

Der Endzustand ist **exakt** der Startzustand: leere Dropzone, Status „Bereit",
Dokument mittig, kein Browser, Overlay unsichtbar. Möglich wird das durch die
Klammer **PDF rein → fertiges .docx raus**. Ab Frame 636 steht alles still.
Kein Crossfade nötig.

Wer am Timing dreht, muss diese Bedingung erhalten — sonst ruckelt der Loop
beim Zurückspringen sichtbar.

## Drei Entscheidungen, die im Bild stecken

**Der Timer ist der Beweis.** Die Pill zählt sichtbar 0,0 → 4,2 s mit. Das
belegt das „< 5 Sekunden"-Versprechen der Website, statt es zu behaupten.

**Re-identifiziert wird ausschließlich in custix.** Der Browser zeigt von der
ersten bis zur letzten Sekunde nur Platzhalter — die externe KI bekommt die
echten Daten nie zu sehen. Die Re-Identifizierung läuft erst, wenn die Antwort
zurück im custix-Fenster ist. Das ist der ganze Produktversprechen; es im Bild
zu verletzen wäre der teuerste denkbare Fehler.

**Der Weg zur KI läuft über echte Klicks.** Cursor klickt „Kopieren" in
custix, der Text erscheint im Eingabefeld von ChatGPT, Cursor klickt „Senden",
die Antwort tippt sich, Cursor klickt „Kopieren" an der Antwort. Eine frühere
Fassung ließ stattdessen eine Karte mit dem Text zwischen den Fenstern
herumfliegen — der Text stand dann zweimal im Bild und der eigentliche
Handgriff blieb unsichtbar.

**Der Prompt im Browser ist wortgleich mit dem Hook.** Im Hook steht er mit
echten Namen, nach custix mit Platzhaltern. Derselbe Satz, einmal ungeschützt
und einmal geschützt — das ist die ganze Aussage in einem Bild.

**Re-identifiziert wird in ein leeres Feld hinein.** Nach dem Kopieren der
KI-Antwort wird das Dokumentfeld geleert und zeigt „KI-Antwort hier
einfügen". Erst dann erscheint die Antwort — mit Platzhaltern — und erst
danach setzt custix die Originaldaten ein (`REIDENT_DOC` in `data.ts`).

Das ist der tatsächliche Ablauf des Features: man fügt die Antwort ein und
bekommt die Originaldaten zurück. Eine frühere Fassung tauschte stattdessen
im bereits gefüllten Dokument eine Passage aus — das sah aus, als würde
custix den Text selbst umschreiben.

Die Phasenumschaltung sitzt in `DocumentPanel` (`reidentPhase`). Sie endet
bewusst vor dem Ausblenden wieder, damit der Hero-Loop mit „PDF hier
ablegen" schließt statt mit „KI-Antwort hier einfügen".

**In den Feed-Cuts steht immer nur ein Fenster im Bild.** Zwei gestapelte
Fenster ergäben auf einem Handy rund 6 pt Schriftgröße. Sequenziell bleibt
beides lesbar; den Kontrast lokal/extern tragen dort Bildunterschrift,
Browser-Chrome und die fliegende Karte. Dafür hat das Dokument `fontScale`.

**Der Hook läuft bewusst langsam.** Tippen 3 s, dann rote Markierung, dann
3 s Standzeit für „Dieser Prompt verlässt Ihre Kanzlei." In der ersten Fassung
stand die Schlagzeile nur eine Sekunde — man konnte sie nicht lesen, bevor der
Schnitt weiterlief. Danach trennt die Logo-Karte („Verwende custix.") das
Problem sichtbar von der Lösung.

**Jedes Demo-Wort hat eine erklärende Zeile.** Ohne Ton trägt sonst nichts
die Erklärung; die Unterzeilen stehen in `VWORDS` (`src/vertical/timeline.ts`)
und kosten keine zusätzliche Laufzeit.

**Der Szenenhintergrund ist dunkler als Snow.** `C.stage` (`#E7EDF6`) statt
`C.snow` (`#F8FAFC`). Solange die Fenster klein waren, hat der Schatten zur
Abgrenzung gereicht; seit sie das Bild füllen, verschwimmt Weiß auf Fast-Weiß
zu einer Fläche. Der **HeroLoop bleibt auf Snow** – der läuft eingebettet auf
custix.ai, wo der Seitenhintergrund Snow ist, und würde sonst als Kasten auf
der Seite kleben.

**Drei Tabs, kein „+".** ChatGPT, Claude und Gemini genügen, um „jede KI" zu
sagen; das Neuer-Tab-Symbol trägt nichts bei.

**Keine Marken-Logos im CTA.** „Funktioniert mit ChatGPT / Claude / Gemini"
plus Logos liest sich wie eine Integration oder Partnerschaft — die es nicht
gibt. In der Tab-Leiste während der Demo bleiben die Icons: dort zeigen sie
den Browser des Nutzers und behaupten nichts.

## Bekannte Grenzen des Prototyps

- **Die UI ist nachgebaut, nicht die echte App.** Für den finalen Schnitt
  sollte der Demo-Kern eine Bildschirmaufnahme der echten App sein — eine
  Animation sieht sauberer aus, beweist aber nichts. Siehe Plan, Abschnitt 5.
- **Nur DE.** Für EN müssen `data.ts` und die `WORDS` in `timeline.ts`
  übersetzt werden — der Rest bleibt unverändert.
- **Nur 16:9.** Der 9:16-Schnitt für LinkedIn ist ein eigener Cut (25 s) und
  braucht ein anderes Layout, keine bloße Skalierung.
- **Der Hero-Loop ist 22 s statt der geplanten 18 s.** Der PDF-Import und der
  sichtbare Kopier-Schritt kosten Zeit. Wer zurück auf ~18 s will, kürzt die
  Klammer (PDF rein / .docx raus).
