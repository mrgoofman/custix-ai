# Feedback-Screenshots: privater R2-Bucket, Zugriff nur für Eigentümer und Admins, 90 Tage, DSGVO

**Status:** Accepted (Entscheidung Lorenz, 30.10.2026) · **Betrifft:** `/api/feedback`,
`/api/feedback/mine`, `/api/feedback/screenshot/<id>`, Admin-Panel, `anonymizePerson`,
`wrangler.jsonc` (Bucket, Cron, `main`) · **Umsetzung:** mrgoofman/custix-ai#16 ·
**App-Seite:** znerol74/custix#65 · **Ergänzt:** ADR-0008 (DSGVO-Löschung), ADR-0006 (Admin-Rolle)

Feedback aus der App (Web und Desktop) besteht ab 0.8.0 aus einer Beschreibung („Was ist das
Problem oder die Idee?“), einem optionalen Screenshot der eigenen custix-Oberfläche und dem
Kontext (Plattform, Bildschirm/Schritt, Fenstergröße, App-Version). Sterne gibt es nicht mehr;
ältere Desktop-Versionen (0.6.x/0.7.x) senden sie weiter und werden angenommen.

Der Screenshot ist schon in der App geschwärzt: Dateinamen, Dokumentinhalte, automatische
Akte-Namen und die E-Mail des Nutzers werden graue Balken (znerol74/custix#65). Er kann trotzdem
Personenbezug tragen (selbst vergebene Akte-Namen, eine Schwärzung, die etwas übersieht). Deshalb
behandeln wir ihn wie personenbezogene Daten.

## Entscheidungen

- **Speicher:** eigener privater R2-Bucket `custix-feedback` (Binding `FEEDBACK`), getrennt vom
  öffentlich ausgelieferten Modell-Bucket `custix-models`. Kein öffentlicher Zugang, keine
  r2.dev-URL, keine eigene Domain. Schlüssel `screenshots/<feedback-id>.png|webp`; der Verweis
  steht in `feedback.screenshot_key`.
- **Nur PNG oder WebP, höchstens 2 MB.** Der Typ wird an den ersten Bytes erkannt, nicht am
  angegebenen Content-Type. Größere oder andere Bilder lehnt der Server ab (413/415).
- **Zugriff:** nur über `/api/feedback/screenshot/<id>` mit Sitzung. Der Eigentümer
  (`feedback.user_id` = Konto der Sitzung) sieht seine Bilder („Mein bisheriges Feedback“),
  Admins (`admin_role`) alle, sonst niemand: ohne Anmeldung 401, fremdes Konto 403.
  Antwort mit `Cache-Control: private, no-store`, damit weder Browser noch Cloudflare das Bild
  zwischenspeichern. Ein Vorschaubild rechnen wir nicht eigens aus; das Admin-Panel verkleinert
  das Bild per CSS und lädt es erst beim Hinsehen (`loading="lazy"`).
- **Zuordnung über das Konto.** Neue Zeilen tragen `user_id` aus der Sitzung, die Migration
  0006 trägt sie für alte Zeilen über die E-Mail nach. `user_email` bleibt für die Anzeige im
  Admin-Panel.
- **Aufbewahrung 90 Tage.** Ein Cron Trigger (täglich 03:17 UTC) löscht Bilder, deren Eintrag
  älter als 90 Tage ist; die Zeile bleibt, `screenshot_key` wird `NULL`. Reihenfolge: erst R2,
  dann D1. Bricht ein Lauf dazwischen ab, löscht der nächste dasselbe Bild noch einmal (in R2
  harmlos); ein Bild ohne Verweis entsteht so nicht. Je Lauf höchstens 5000 Bilder, der Rest
  folgt am nächsten Tag.
- **DSGVO-Löschung:** `anonymizePerson` löscht vor dem Leeren der Person alle Bilder ihrer
  Feedback-Zeilen (Treffer über `user_id` oder E-Mail, ohne Groß-/Kleinschreibung) und löst die
  Zeilen von ihr: `user_id`, `user_email`, `description` und `screenshot_key` werden `NULL`,
  `anonymized_at` gesetzt. Die Beschreibung ist Freitext und kann Personenbezug enthalten, sie
  hat keine gesetzliche Aufbewahrungsgrundlage (anders als Rechnungen, ADR-0008), also geht sie
  mit. Sterne, Kontext, Version und Datum bleiben für die Statistik. Fehlt das Bucket-Binding
  und gibt es Bilder, bricht die Löschung ab, bevor die Person angefasst wird, damit ein zweiter
  Versuch alles erwischt. Das `admin_event` nennt nur Anzahlen, keine Inhalte.
- **Missbrauch:** höchstens 20 Einträge pro Konto in 24 Stunden (429), damit ein Konto den
  Bucket nicht vollschreiben kann. Konten sind frei registrierbar (Testphase).

## Cron unter OpenNext

OpenNext erzeugt `.open-next/worker.js` nur mit `fetch`. Für `scheduled` beschreibt OpenNext
selbst einen eigenen Einstieg (https://opennext.js.org/cloudflare/howtos/custom-worker):
`custom-worker.ts` im Projektwurzelverzeichnis reicht `fetch` des erzeugten Workers durch und
ergänzt `scheduled`; `wrangler.jsonc` zeigt mit `main` darauf. Durable Objects nutzt das
Projekt nicht, also gibt es keine Re-Exporte. Die Löschlogik (`src/lib/feedback.ts`) kommt ohne
`getCloudflareContext` aus und bekommt D1 und R2 als Parameter, weil es im Cron keinen
Next-Request gibt. Lokal: `wrangler dev --test-scheduled`, dann
`curl "http://localhost:8787/__scheduled?cron=17+3+*+*+*"`.

## Verworfen

- **R2-Lebenszyklusregel allein** (Objekte nach 90 Tagen automatisch löschen): einfacher, aber
  D1 wüsste davon nichts; `has_screenshot` und das Admin-Panel zeigten dann Bilder, die es nicht
  mehr gibt. Als zusätzliches Netz (z. B. 92 Tage) ist sie möglich, siehe Deploy-Schritte im
  Ticket.
- **Löschen nur bei Schreibzugriffen oder per Admin-Button:** hängt davon ab, dass jemand Feedback
  sendet oder daran denkt; der Cron ist mit dem eigenen Einstieg sauber möglich.
- **Bild in D1 (BLOB):** D1-Zeilen sind auf 2 MB begrenzt und die Datenbank wird mit jedem Bild
  größer; R2 ist für Dateien gemacht und trennt Löschung und Zugriff sauber.
- **Bild als öffentliche R2-URL mit schwer erratbarem Namen:** wer den Link hat, sieht das Bild,
  ohne Anmeldung und ohne Möglichkeit, das zurückzunehmen.
