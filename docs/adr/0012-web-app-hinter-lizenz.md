# Web-App hinter Lizenz: Testphase und Abo wie die Desktop-App

**Status:** Accepted (Entscheidung Lorenz, 28.10.2026) · **Ersetzt:** ADR-0010 · **Betrifft:**
Web-App unter custix.ai/app, Website (Registrierung, `/konto`, Ärzte-Seite, Willkommens-Mail),
`/api/license/mine` · **Umsetzung:** mrgoofman/custix-ai#13, #14; Web-App znerol74/custix#54 ·
**Spec:** znerol74/custix#43

Die Web-App prüft wieder die Lizenz des angemeldeten Kontos. Eine Lizenz deckt Web und Desktop
(CONTEXT.md, „License“); es gibt keinen eigenen Web-Tarif und keinen eigenen Web-Preis: 14 Tage
Testphase, danach 15 €/Monat oder 150 €/Jahr pro Arbeitsplatz inkl. USt. Nach der Registrierung
sieht man nur noch die Web-App; der Download bleibt für Konten, deren Lizenz schon in der
Desktop-App läuft.

(Das Ticket nannte die Nummer 0011; die war schon durch den Partner signup vergeben.)

## Why / context

- ADR-0010 hat die Web-App am 27.09.2026 vorübergehend freigegeben, damit Ärztinnen und Ärzte
  sie ohne Bezahlung testen konnten. Das ADR sah selbst vor, ersetzt zu werden, sobald die
  Bezahlung für das Web feststeht. Das ist mit der Entscheidung vom 28.10.2026 der Fall: Das Web
  ist der Hauptweg (znerol74/custix#43), also muss es auch der bezahlte Weg sein.
- Die Lizenz-Endpunkte sind seit ADR-0010 unverändert geblieben; die Web-App hat den Prüfcode
  hinter einem Schalter behalten. Es geht also nicht um ein neues Modell, sondern darum, das
  bestehende für das Web wieder einzuschalten – ohne Schlüsseleingabe.

## Entscheidungen

- **Die Lizenz hängt ab der Registrierung am Konto.** Ein Better-Auth-Hook nach dem Anlegen des
  Kontos (`databaseHooks.user.create.after`, `src/lib/auth.ts` → `startTrialForNewAccount` in
  `src/lib/trial.ts`) legt die 14-Tage-Testlizenz an und bindet sie sofort (`account_id`,
  `claimed_at`). Das gilt für jede Registrierung: `/konto`, Web-App, Desktop-App und
  Partnerformular. Bisher legte nur `/konto` (per Folgeaufruf aus dem Browser) und der Partner
  signup eine Testlizenz an; wer sich in der Web- oder Desktop-App registrierte, hatte keine.
  Der Hook lässt die Registrierung nie scheitern; fehlt die Lizenz doch, bietet `/konto`
  „Testphase starten“ (`/api/trial/start`).
- **Die Web-App fragt `/api/license/mine`, nie `/api/license/validate`.** Sie hat keinen
  Schlüssel und braucht keinen: Die Sitzung genügt, die Antwort enthält die Entscheidung
  (`valid`). `/api/license/validate` und `/api/license/claim` bleiben unverändert der Vertrag der
  Desktop-App (ADR-0002, ADR-0003). Folge: `license.last_validated_at` gesetzt heißt „läuft in
  der Desktop-App“ – daran hängt, ob `/konto` den Download zeigt (`desktop_used`).
- **Eine Regel für beide.** Ob eine Lizenz gültig ist, rechnet `src/lib/entitlement.ts`; validate
  und mine benutzen sie beide. Web und Desktop können für dieselbe Lizenz nicht Verschiedenes
  sagen.
- **Widerruf bleibt Widerruf.** Ein Admin-Widerruf löst `account_id`. `/api/license/mine` findet
  die widerrufene Lizenz trotzdem (über das `claimed`-Ereignis des Kontos und das
  `license_revoked`-Admin-Ereignis) und meldet `revoked`; `/konto` zeigt „Zugang gesperrt“ und
  `/api/trial/start` verweigert eine neue Testphase. Bisher konnte ein widerrufenes Konto per
  Knopf eine frische Testphase starten.
- **`/konto`:** gültig → genau eine Hauptaktion „custix im Browser starten“ (+ Download und
  Schlüssel nur bei `desktop_used`); abgelaufene Testphase → „Jahresabo / Monatsabo“ (Checkout,
  gleicher Schlüssel, `type` wird auf `subscription` umgestellt); Abo → Stripe-Portal; keine
  Lizenz → „Testphase starten“; widerrufen → gesperrt mit Kontaktadresse.

## Vertrag `GET /api/license/mine` (Web-App, znerol74/custix#54)

Authentifiziert über das Better-Auth-Sitzungscookie (gleiche Herkunft custix.ai). Antworten
werden nicht zwischengespeichert (`Cache-Control: no-store`).

```jsonc
// 200 – das Konto hat eine Lizenz
{
  "key": "CUSTIX-XXXX-XXXX-XXXX-XXXX", // nur für die Desktop-App (Schlüssel wiederherstellen)
  "type": "trial",                     // beta | trial | subscription
  "status": "active",                  // active | expired | revoked – WIRKSAMER Stand (s. u.)
  "valid": true,                       // die Entscheidung; nur false sperrt
  "message_key": "license.ok",         // license.ok | license.in_grace | license.renewal_due | license.expired
  "expires": "2026-11-11",             // ISO-Datum oder null (unbefristete Beta)
  "grace_until": "2026-11-11",         // expires + Kulanzfrist, ISO-Datum oder null
  "expires_at": 1762819200,            // dasselbe in Unix-Sekunden (für /konto)
  "grace_seconds": 0,
  "desktop_used": false                // Lizenz wurde schon von der Desktop-App geprüft
}

// 200 – Lizenz vom Team widerrufen
{ "key": null, "type": "trial", "status": "revoked", "valid": false,
  "message_key": "license.revoked", "expires": null, "grace_until": null,
  "expires_at": null, "grace_seconds": 0, "desktop_used": false }

// 200 – keine Lizenz (z. B. Konto aus der kostenlosen Web-Phase)
{ "key": null, "type": null, "status": null, "valid": false,
  "message_key": "license.none", "expires": null, "grace_until": null,
  "expires_at": null, "grace_seconds": 0, "desktop_used": false }

// 401 { "error": "unauthenticated" }   – keine Sitzung → Anmeldemaske
// 500 { "error": "internal error" }    – Serverfehler, KEIN Lizenzurteil
```

- **`valid`** ist dieselbe Entscheidung wie `valid` in `/api/license/validate` für den Besitzer
  der Lizenz: `status='active'`, innerhalb von `expires_at + grace_seconds`, bei einem Abo ein
  Stripe-Status `active`/`trialing`/`past_due` (CONTEXT.md, „Active“).
- **`status`** ist anders als in validate der *wirksame* Stand: Eine Testphase nach Ablauf meldet
  `expired`, obwohl die Zeile noch `active` sagt (kein Job stellt sie um). `valid` ⇔
  `status == "active"`.
- **`message_key`** benutzt dieselben Schlüssel wie validate, dazu `license.none`.
- Die Felder sind gegenüber der bisherigen Antwort (`key`, `type`, `status`, `expires_at`,
  `grace_seconds`) nur ergänzt. `key` bleibt, die Desktop-App liest nur ihn.

**Verhalten der Web-App** (wie ADR-0002, Resilienzregel):

| Antwort | Web-App |
|---|---|
| 200, `valid: true` | startet |
| 200, `valid: false` | gesperrt, Knopf „Abo abschließen“ → `custix.ai/konto` (dort Checkout bzw. Testphase) |
| 401 | Anmeldemaske |
| Netzwerkfehler, 5xx, unlesbare Antwort | läuft weiter; erneute Prüfung beim nächsten Start |

Nur ein ausdrückliches `valid: false` sperrt. Ein Serverausfall oder ein hängender Stripe-Webhook
darf zahlende Nutzer nicht aussperren.

## Offene Entscheidung vor dem Go-live (nicht umgesetzt)

Konten aus der kostenlosen Web-Phase (seit 27.09.2026):

- **In der Web-App registriert:** haben gar keine Lizenz (die Web-App legte keine an). `/konto`
  bietet ihnen „Testphase starten“ – also 14 frische Tage auf Knopfdruck. Die gesperrte Web-App
  schickt sie dorthin.
- **Auf `/konto` registriert:** haben eine Testlizenz aus der Registrierung, die meist schon
  abgelaufen ist. Mit dem Go-live sind sie sofort gesperrt und sehen nur das Abo-Angebot.
  Empfehlung im Ticket: frische 14 Tage ab Go-live. Das wäre ein einmaliges
  `UPDATE license SET expires_at = <Go-live + 14 Tage> WHERE type = 'trial' AND …` (mit
  `admin_event`), keine Code-Änderung. Ob und für wen, entscheidet Lorenz.

## Consequences

- Website zuerst ausrollen ist gefahrlos: Die laufende Web-App (Build nach ADR-0010) ruft
  `/api/license/*` nicht auf, die neuen Felder sind nur Ergänzungen. Gesperrt wird erst mit dem
  Web-Redeploy aus znerol74/custix#54.
- Desktop-App unverändert. Nebenwirkung des Hooks: Wer sich in der Desktop-App registriert, hat
  jetzt sofort eine Testlizenz, die die App über `/api/license/mine` findet – bisher landete er
  bei der Schlüsseleingabe. Wer einen vom Team verschickten Beta-Schlüssel hat und sich zuerst in
  der App registriert, ist damit zunächst in der Testphase; den Schlüssel löst er auf `/konto`
  ein („Ich habe bereits einen Lizenzschlüssel“, die Testlizenz wird dabei abgelöst).
- Willkommens-Mail nach der Registrierung: nur die Web-App, kein Schlüssel, kein Download
  (mrgoofman/custix-ai#14). Partner signups behalten die Desktop-Variante; Formular und Mail der
  Partner folgen ADR-0011 („Nur Desktop“), bis dort anders entschieden wird. *Update 28.10.2026:
  anders entschieden – auch Partner signups bekommen nur die Web-App (ADR-0011, Update).*
- Die Partner-Auswertung im Admin zählt als „App genutzt“ weiter nur Desktop-Prüfungen
  (`last_validated_at`); Web-Nutzung erscheint dort nicht, weil `/api/license/mine` nichts
  protokolliert.
- Ärzte-Seite, Preisseite und `/konto` versprechen keine kostenlose Web-App mehr, sondern
  „14 Tage kostenlos testen“ mit Preis.
