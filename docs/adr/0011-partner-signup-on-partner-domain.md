# Partner signup auf der Partnerseite: Konto serverseitig, Zuordnung am Konto

**Status:** Accepted (Entscheidung Lorenz, 30.09.2026) · **Betrifft:** Website/Backend
(`/api/partner/*`, `/konto`, Trial-Mail, Admin-Panel, Stripe-Checkout) · **Erster Partner:**
finditoo (finditoo-marketing.com, WordPress + Elementor)

Ein Partner bettet unser Registrierformular in seine eigene Seite ein. Das Formular ist ein Skript
von custix.ai (`/partner/signup.js`); es schickt Name, Kanzlei, E-Mail und **Passwort** an
`POST /api/partner/signup`. Der Server legt dort in einem Schritt das Konto (Better Auth), die
14-Tage-Testlizenz und die Partner-Zuordnung `user.partner` an und verschickt die Testphasen-Mail.
Eine Sitzung entsteht auf der Partnerseite nicht: Angemeldet wird danach in der Desktop-App.

## Why / context

- finditoo will das Formular auf der eigenen Seite, in eigenem Design – ein Link auf `/konto`
  (unsere Empfehlung) kam nicht in Frage.
- Better-Auth-Sitzungscookies auf custix.ai wären auf finditoo-marketing.com Drittanbieter-Cookies;
  Safari und Firefox sperren sie. Ein Login quer über die Domain (Formular direkt auf
  `/api/auth/*` oder iframe) legt das Konto an, meldet aber nicht an – und `/api/trial/start`
  braucht die Sitzung. Deshalb ein eigener Endpunkt, der alles serverseitig erledigt.
- Die Markierung dient vorerst nur dem Reporting; Provision oder Sonderpreise sind nicht vereinbart.
  Sie wird trotzdem ab dem ersten Tag verlässlich gesetzt, damit eine spätere Abrechnung auch
  frühere Registrierungen erfasst.

## Entscheidungen

- **Zuordnungsregel:** Ein Konto zählt genau dann für einen Partner, wenn es über dessen Formular
  angelegt wurde. Einmal gesetzt, nie geändert; bestehende Konten werden nie umgeschrieben (die
  Adresse ist dann „schon registriert“); kein Cookie- oder `?ref`-Tracking.
- **Beweis der Herkunft:** der Partner ergibt sich aus dem von Cloudflare Turnstile bestätigten
  Hostnamen, nicht aus Browserangaben. CORS nur für die Ursprünge der Partner, ohne Cookies.
- **Speicherort:** `user.partner` (Better-Auth-Zusatzfeld, `input: false`) – am Konto, nicht an der
  Lizenz, weil eine Lizenz widerrufen und ersetzt werden kann. Beim Checkout zusätzlich in die
  Stripe-Metadaten von Kunde und Abo.
- **Passwort im Partnerformular:** bewusst so entschieden. Verworfen: Formular ohne Passwort mit
  „Passwort festlegen“-Link per Mail (weniger Risiko durch Skripte auf der Partnerseite, zugleich
  E-Mail-Bestätigung) – der Zusatzschritt war dem Nutzer zu viel. Ausgleich: Turnstile,
  Ratenbegrenzung pro IP, und die Übergabe verlangt, dass Tracking-Tools das Formular nicht
  mitschneiden.
- **Nur Desktop, kein Schlüssel:** das Erfolgsfeld zeigt Downloads (live aus dem Release-Manifest),
  keinen Web-App-Knopf und keinen Lizenzschlüssel.
- **Datenweitergabe:** der Partner bekommt nur Summen (Registrierungen, App genutzt, Testphase,
  zahlend), keine personenbezogenen Daten. Verantwortlich bleibt snekmedia GmbH (ADR-0001); das
  Formular sagt das.
- **Benachrichtigung (Ergänzung 01.10.2026):** bei jedem Partner signup geht eine Mail an die
  Adresse des Partners (`notifyEmail`, finditoo: info@finditoo.com) – nur „jemand hat sich
  registriert“ plus die laufende Summe, ohne Name, Kanzlei oder E-Mail. Nicht bei
  Testregistrierungen aus der lokalen Vorschau.

## Consequences

- Neue Spalte `user.partner` (Migration 0005), Partner-Register in `src/lib/partners.ts` mit
  Schalter `enabled`, neue Geheimnisse `TURNSTILE_SECRET_KEY` und Variable `TURNSTILE_SITE_KEY`,
  Ratenbegrenzung über das Workers-Rate-Limiting-Binding.
- Die Testphasen-Mail zeigt für alle Website-Konten keinen Schlüssel mehr (CONTEXT.md, „License
  key“); Partner-Konten bekommen sie ohne Web-App-Hinweis.
- `/konto` und das Partnerformular tragen denselben Hinweis auf AGB und Datenschutzerklärung.
- Kommen Provision oder Sonderpreise, ist dieses ADR zu ergänzen: die Zuordnung ist dafür da, die
  Regeln der Abrechnung sind es noch nicht.
