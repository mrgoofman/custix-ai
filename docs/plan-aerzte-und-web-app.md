# Plan — Web-App nachziehen & Zielgruppe Ärzte

**Stand:** 27.09.2026 · **Status:** Entwurf aus einer Grilling-Session ohne
Rückfragen. Alle Entscheidungen sind Empfehlungen und vom Team noch zu
bestätigen.
**Betrifft zwei Repos:** `custix` (Desktop + Web-App, GitHub `znerol74/custix`)
und `custix-ai` (Website, liefert die Web-App unter `/app` aus).

> **Grundregel (27.09.2026): nur Web — die Desktop-App bleibt unverändert.**
> Alles in diesem Plan betrifft die Web-App und die Website. Web-Arbeit läuft
> über die Web-Module und Web-Aliase; geteilter Code ändert sich nur, wo das
> Verhalten der Desktop-App nachweislich gleich bleibt. Ausgeliefert wird per
> Web-Redeploy; ein Desktop-Release ist dafür nicht nötig.

---

## Ausgangslage

- Die Web-App auf `custix.ai/app` entspricht der Desktop-Version **v0.4.6**
  (Redeploy 06.08.2026; seitdem keine Änderung an Frontend, Core oder wasm).
  Bereits vorhanden: PDF-Erkennung, Texterkennung für gescannte PDFs,
  Scan-Schwärzung mit Sicherheits-Prüflauf, Prozentanzeige beim Export,
  Vorkommens-Propagation, Seiten-Ansicht für manuelle Boxen.
- **Bild → Text (JPG/PNG) gibt es auf keiner Plattform.** Texterkennung läuft
  nur bei gescannten PDFs.
- Mehrere Dateien auf einmal gibt es auf keiner Plattform (Datei-Dialog und
  Drop nehmen je genau eine Datei).
- Die Web-App ist auf der Website nirgends verlinkt, nur in der
  Datenschutzerklärung erwähnt.

## Entscheidungen (Kurzfassung)

1. Ärzte nutzen **dieselbe Web-App, dieselbe Lizenz, denselben Preis**. Die
   Landingpage verarbeitet selbst keine Dateien.
2. **Stapel** = mehrere Dateien, jede ein eigenes Dokument mit eigener
   Zuordnung; nacheinander verarbeitet; Export sofort; Download einzeln oder als
   ZIP (nur anonymisierte Dateien); neutrale Dateinamen; kein Pflicht-Review,
   aber Kennzeichnung *ungeprüft*. Details: `custix/docs/adr/0013-stapelverarbeitung.md`.
3. Stapel gilt für **alle** Web-Nutzer (nicht nur Ärzte) — **nur in der
   Web-App**, nicht am Desktop.
4. Erkennung im Web: **ein** Regelwerk für alle Berufe. Eponyme (Morbus Crohn)
   werden nicht geschwärzt, die deutsche Krankenversichertennummer kommt dazu,
   Datumsangaben bleiben geschwärzt. Nur im Web-Build aktiv.
5. Bild-Eingabe JPG/PNG in der Web-App über den bestehenden Scan-Weg; heraus
   kommt dasselbe Format.
6. Landingpage `/fuer-aerzte` (EN `/for-doctors`); `/fuer-gesundheitswesen`
   leitet dorthin weiter.
7. **Go-live** der Ärzte-Seite erst nach Phase 1, 3 und 5.

Begriffe: `custix/CONTEXT.md` (Stapel, Fertig, Ungeprüft, Neutraler
Dateiname, Eponym).

---

## Phase 1 — Web-Fehler (custix) · [znerol74/custix#20](https://github.com/znerol74/custix/issues/20)

| Fehler | Folge | Stelle |
|---|---|---|
| Erstwarnung falsch herum abgefragt | Neue Web-Nutzer sehen den Datenverlust-Hinweis (ADR-0004) nie | `frontend/src/web/webBackend.ts:749` |
| Lizenzprüfung liest `expires_at`/`license_type` statt `expires`/`type` | Ablauf und Tarif immer leer; Server-500 sperrt Nutzer aus; keine Version gesendet | `frontend/src/web/webBackend.ts:834` |
| Löschen lässt die Zuordnung stehen | Personendaten bleiben gespeichert | `frontend/src/web/webBackend.ts:530` |
| Namenserkennung endet nach ~512 Wortstücken | Danach greifen nur noch die festen Muster; der Arztname am Ende eines Befunds geht durch | `frontend/src/web/ner/runner.ts:112` (nur Web; der Windows-Sidecar hat dieselbe Grenze, bleibt aber unverändert) |

Ausgeliefert per Web-Redeploy.

## Phase 2 — Qualitätslücken im Web (custix) · [znerol74/custix#21](https://github.com/znerol74/custix/issues/21)

- Erkennung in einen Worker verlegen, vorwärmen, COOP/COEP für `/app/*` in
  custix-ai (mehrere Threads, keine eingefrorene Oberfläche). Pflicht für den
  Stapel.
- Neu gesetzte PDFs mit Unicode-Schrift („Dvořák" wird heute zu „D?o?ák").
- Eingefügter Text: Formatwahl im Web (heute immer `.docx`).
- Veralteter Hinweis „Scans nicht unterstützt" in der Web-DropZone.
- Kleinere: Tabellen-Anhang beim PDF-Import, Silbentrennung bei der
  Glyphen-Schwärzung, 150 dpi für die Seiten-Ansicht, 25-MB-Grenze für
  gespeicherte Originale, Fortschritt beim Import, Hinweis „neue Version, bitte
  neu laden".

## Phase 3 — Erkennung für Befunde (custix core) · [znerol74/custix#22](https://github.com/znerol74/custix/issues/22)

- Eponym-Filter im Rust-Kern (`core/src/recognizers/orchestrator.rs`), nur im
  Web-Build aktiv (z. B. Feature, das nur der WASM-Build einschaltet).
- Muster für die deutsche Krankenversichertennummer (Buchstabe + 9 Ziffern).
- 20 synthetische Befunde (AT/DE) als Testkorpus im bestehenden Eval-Harness,
  gleiche Schwelle wie bisher; gemessen wird das Web-Modell (ONNX).

## Phase 4 — Bild-Eingabe (custix, nur Web) · [znerol74/custix#23](https://github.com/znerol74/custix/issues/23)

JPG/PNG intern als einseitiger Scan, Ausgabe im Eingangsformat. HEIC/TIFF
später.

## Phase 5 — Stapel (custix, nur Web) · [znerol74/custix#24](https://github.com/znerol74/custix/issues/24)

Nach ADR-0013: Mehrfach-Auswahl und Drop, Warteschlange, Status pro Datei
(wartet, wird gelesen, wird erkannt, wird geprüft, fertig, Fehler),
Gesamtfortschritt, ZIP und Einzel-Download, *ungeprüft*-Kennzeichnung,
höchstens 20 Dateien pro Stapel. Kein Stapel am Desktop.

## Phase 6 — Landingpage Ärzte (custix-ai, ab sofort baubar) · [mrgoofman/custix-ai#5](https://github.com/mrgoofman/custix-ai/issues/5)

- Route `/fuer-aerzte` / `/for-doctors` (`src/i18n/routing.ts`), Sitemap,
  Metadaten; Weiterleitung von `/fuer-gesundheitswesen`; Navbar, Branchen-Karten
  und Footer anpassen.
- Eigene Seitenkomponente mit animierter Stapel-Vorschau (Befunde werden
  nacheinander fertig, dann ZIP), fiktive Beispieldaten.
- Im Konto ein Knopf **„Im Browser starten"** → `/app`.
- Hinweis auf den einmaligen Modell-Download (~430 MB).
- **SEO:** Die Seite ist Conversion-Seite, kein Traffic-Bringer. Titel und H1
  nicht auf „Patientendaten anonymisieren" (0 Suchen), sondern auf Begriffe mit
  Volumen: Arztbrief, Befunde, ärztliche Schweigepflicht, KI. Zahlen:
  [marketing/seo-keywords-aerzte.md](marketing/seo-keywords-aerzte.md).
- Copy-Prüfung durch Laurenz (siehe offene Punkte).

## Phase 7 — Ratgeberseiten für Ärzte (custix-ai) · [mrgoofman/custix-ai#6](https://github.com/mrgoofman/custix-ai/issues/6)

Ziel: organischer Traffic von Ärzten über Suchen mit schwacher Konkurrenz, die
alle auf `/fuer-aerzte` verlinken. Nur DE (AT-taugliche Sprache); keine
EN-Fassung, solange keine EN-Recherche vorliegt. Zahlen und Begründung:
[marketing/seo-keywords-aerzte.md](marketing/seo-keywords-aerzte.md).

| # | Seite | Ziel-Keywords (DE/Monat, SD) | Kann live gehen |
|---|---|---|---|
| 7.1 | **Arztbrief mit KI schreiben — ohne Patientendaten preiszugeben**, mit kostenlosem Beispiel-Arztbrief als Vorlage zum Download | arztbrief schreiben (260, 14), arztbrief vorlage (260, 11), arztbrief beispiel(e) / beispiel arztbrief (320–480, 10–19), textbausteine arztbrief (110, 5), formulierungshilfen arztbrief (70), epikrise schreiben (70), chatgpt arztbrief (50) — Cluster rund 2.000 | mit `/fuer-aerzte` (der Ablauf „mehrere Befunde → ein Arztbrief" braucht den Stapel) |
| 7.2 | **Ärztliche Schweigepflicht und KI** | ärztliche schweigepflicht (720, 31; AT 70, 18), schweigepflicht arzt (260), 203 stgb schweigepflicht (140), ärztliche schweigepflicht ausnahmen (140), dsgvo schweigepflicht (90) | sofort, nach Rechtsprüfung |
| 7.3 | **Pseudonymisierung vs. Anonymisierung** | pseudonymisierung vs anonymisierung (110, 14), unterschied … (90, 9 / 70, 20), anonymisierung und pseudonymisierung (110, 19); langfristig pseudonymisierung (2.400, 33; AT 320, 16) | sofort |

**Inhaltliche Leitplanken**

- **7.1** zeigt den echten Ablauf: Befunde in custix → anonymisiert →
  ChatGPT entwirft den Arztbrief → custix setzt die Namen wieder ein. Der
  Beispiel-Arztbrief ist fiktiv, als „Beispieldaten" gekennzeichnet und zeigt,
  wie ein Brief mit Platzhaltern aussieht. Er ist zugleich das Material, auf das
  andere Seiten verlinken sollen.
- **7.2** ist ein Rechtstext und geht nur nach Freigabe durch Laurenz live
  (§ 54 ÄrzteG, § 203 StGB, Art. 9 DSGVO).
- **7.3** sagt ehrlich, dass custix technisch **pseudonymisiert** (die
  Zuordnung bleibt lokal) und was das für die Weitergabe an eine KI bedeutet.

**Technik**

- Eigener Bereich, z. B. `/ratgeber/…`, in `src/i18n/routing.ts`; nur DE
  indexieren (EN-Pfad weglassen oder `noindex`), Sitemap und Metadaten.
- Artikel-Schema (JSON-LD, `src/components/json-ld.tsx`), interne Links auf
  `/fuer-aerzte` und untereinander.
- Search Console für custix.ai einrichten bzw. prüfen, um die Rankings zu
  messen.

**Backlinks** (der eigentliche Engpass, Domain Authority 1): Ärztekammern
(Newsletter, Mitteilungsblätter), Fachgesellschaften, Ärzteforen und
Medizinjournalismus; der Beispiel-Arztbrief aus 7.1 als verlinkbares Material.

**Anzeigen-Tests** (günstig, Kaufabsicht): anonymisierung (13,45 €, PD 1),
gesundheitsdaten (11,02 €, PD 2), chatgpt datenschutz (7,58 €, PD 20),
pseudonymisierung vs anonymisierung (7,25 €, PD 6). Nicht: „ki für ärzte",
„ki arztpraxis" (PD 75–80).

**Bewusst nicht:** Ratgeber „Befund mit KI verstehen" (Patienten, zahlen
nicht; siehe Keyword-Datei, Abschnitt 6).

---

## Reihenfolge

1. Phase 1 → Web-Redeploy.
2. Phase 3 (Go-live-Bedingung für Ärzte).
3. Phase 5 (Stapel, Web).
4. Phase 6 und 7 parallel ab sofort bauen. 7.2 und 7.3 können vorher live
   gehen; `/fuer-aerzte` und 7.1 erst, wenn 1, 3 und 5 live sind.
5. Phase 2 und 4 dazwischen, nach Aufwand.

## Offen für das Team

- **Rechtliche Aussagen (Laurenz):** Art. 9 DSGVO, § 54 ÄrzteG / § 203 StGB;
  „anonymisiert" oder „pseudonymisiert" (seltene Diagnose plus Klinik kann
  trotzdem auf eine Person schließen lassen); kein Anschein eines
  Medizinprodukts; „Vollständig konform mit EU-Datenschutzrecht" nicht für Ärzte
  übernehmen.
- **Annahme prüfen:** Praxis-Rechner erlauben oft keine Installation (Grund
  dafür, dass Ärzte über die Web-App einsteigen).
- **ADR-0013** bestätigen (steht auf „Proposed").
- **Kostenlose Tool-Seite** für „pdf schwärzen" (6.600 Suchen pro Monat) ja
  oder nein? Das braucht eine Nutzung ohne Konto und damit eine Ausnahme vom
  Lizenzmodell.
