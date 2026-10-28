# Registrierung „E-Mail zuerst“: Bestätigungslink, Konto erst mit dem Passwort

**Status:** Accepted (Entscheidung Lorenz, 28.10.2026) · **Betrifft:** `/konto`, `/willkommen`
(`/en/welcome`), `/api/signup/*`, `src/lib/auth.ts`, `src/lib/trial.ts`, Startseite ·
**Umsetzung:** mrgoofman/custix-ai#15 · **Spec:** znerol74/custix#43 (Klickdummy, Spur „Neu“) ·
**Ergänzt:** ADR-0006 (Better Auth, E-Mail + Passwort), ADR-0012 (Testlizenz per Create-Hook)

Die Registrierung auf der Website fragt zuerst nur die E-Mail-Adresse und den Haken bei AGB und
Datenschutz. Wir schicken genau eine Mail mit einem Knopf „Zugang bestätigen“ (24 Stunden gültig,
kein Schlüssel, kein Download). Der Link führt auf „Wählen Sie Ihr Passwort“ (mindestens
10 Zeichen, keine Sonderzeichen-Pflicht, Feld „Firma, Kanzlei oder Praxis“ freiwillig). Erst
dort entsteht das Konto; man ist danach angemeldet, sieht „So funktioniert custix“ und kommt mit
„custix öffnen“ in die Web-App. Anmelden und „Passwort vergessen“ bleiben, wie sie sind.

## Mechanismus

- **Link = verschlüsseltes Token, nichts gespeichert.** `/api/signup/start` verschlüsselt
  `{ email, locale }` mit `symmetricEncodeJWT` aus `better-auth/crypto` (JWE, Schlüssel per HKDF
  aus `BETTER_AUTH_SECRET` mit eigenem Salz, `src/lib/signup-token.ts`), Ablauf 24 Stunden. Das
  Token steht im Fragment (`/willkommen#token=…`): Es geht weder an Server-Logs noch an die
  Webanalyse; die Seite nimmt es sofort aus der Adresszeile. Unbestätigte Adressen landen nie in
  der Datenbank, eine Migration braucht es nicht.
- **Öffnen verbraucht nichts.** `/api/signup/check` sagt nur, wofür der Link gilt. Mail-Scanner,
  die Links vorab aufrufen (Microsoft „Safe Links“ ist in Kanzleien verbreitet), können ihn so
  nicht entwerten.
- **Das Konto entsteht über Better Auths eigenes `signUpEmail`** (`/api/signup/complete`, mit
  `returnHeaders`, das Sitzungscookie wird durchgereicht). Damit läuft derselbe Create-Hook wie bei
  jeder anderen Registrierung (ADR-0012): Testlizenz anlegen und binden. `getAuth({
  confirmedSignup })` setzt im selben INSERT `emailVerified = true` und unterdrückt die
  Willkommens-Mail. Einmalig ist der Link über das Konto: Die erste Verwendung legt es an, jede
  weitere endet bei „Ihr Zugang ist schon eingerichtet“.
- **Eine Mail pro Registrierung.** Die Bestätigungs-Mail ist die einzige; die Willkommens-Mail
  mit der Testphase entfällt auf diesem Weg (`startTrialForNewAccount(…, { welcomeMail: false
  })`). Das Ende der Testphase zeigt „So funktioniert custix“, danach `/konto`. Web-App,
  Desktop-App und Partnerformular registrieren weiter direkt und bekommen die Willkommens-Mail wie
  bisher.
- **Adresse schon registriert:** statt der Bestätigung eine Mail „Sie haben bereits ein
  custix-Konto“ mit „Anmelden“ (`/konto?mode=signin`) und „Passwort vergessen“
  (`/konto?mode=forgot`). Die Seite „Bitte sehen Sie in Ihr Postfach“ ist in beiden Fällen gleich
  – sie verrät nicht, ob eine Adresse registriert ist.
- **Missbrauch:** Jede Anfrage schickt eine Mail an eine frei gewählte Adresse. Begrenzung über
  Workers Rate Limiting: `SIGNUP_IP_LIMITER` (10 pro Minute und IP) und `SIGNUP_EMAIL_LIMITER`
  (2 pro Minute und Adresse – „Erneut senden“ geht einmal). Der Haken ist serverseitig Pflicht.
- **Passwortregel nur für diesen Weg:** 10 Zeichen prüfen Seite und Route
  (`src/lib/signup-rules.ts`). Better Auth bleibt bei 8, sonst scheiterten Registrierung und
  Zurücksetzen in Web- und Desktop-App mit kürzeren Passwörtern.
- **Kein Name.** Better Auth verlangt `name`; wir schreiben einen leeren String, unser Code liest
  leer als `null` (`getSessionUser`, `person`-Eintrag).
- **Lokale Vorschau:** Ohne `RESEND_API_KEY` und nur auf `localhost` gibt `/api/signup/start` den
  Link aus der Mail an die Seite zurück (Kasten „Nur in der lokalen Vorschau“) und ins Log. Live
  ist der Schlüssel gesetzt und der Host nicht `localhost`.

## Verworfen

- **Magic-Link-Plugin** (Konto beim Klick anlegen, dann Passwort setzen): verbraucht das Token
  beim GET – Mail-Scanner entwerten den Link, bevor der Mensch klickt; meldet schon vor dem
  Passwort an; bricht jemand auf der Passwort-Seite ab, bleibt ein Konto ohne Passwort; und es
  öffnet für alle Konten eine zusätzliche passwortlose Anmeldung.
- **E-Mail-OTP-Plugin:** dieselbe zusätzliche Anmeldeart, auf Codes statt Knopf ausgelegt, und
  Anlegen und Passwort wären zwei Aufrufe.
- **Registrierung mit Zufallspasswort + Bestätigung:** Konto, Testlizenz und Willkommens-Mail
  entstünden schon vor der Bestätigung (Konten für fremde Adressen), und ein Passwort ändern
  verlangt das alte.
- **Eigene Token-Tabelle:** ginge, speichert aber unbestätigte Adressen und braucht Migration und
  Aufräumen – das signierte Token kann dasselbe ohne Zustand.

## Consequences

- Ein neu angeforderter Link macht ältere nicht ungültig; bis zum Ablauf gewinnt der zuerst
  benutzte. Ein Wechsel von `BETTER_AUTH_SECRET` macht offene Links ungültig (und meldet ohnehin
  alle ab).
- `/konto` hat jetzt einen echten Haken für AGB und Datenschutz; das Partnerformular behält den
  Hinweis (ADR-0011). Der Zeitpunkt der Zustimmung wird nicht eigens gespeichert.
- Startseite: vorbereitete Vorher/Nachher-Ansicht einer erfundenen Akte mit zwei Dokumenten
  (`src/content/live-demo.ts`), keine Erkennung im Browser. Das Hero-Video steht jetzt bei
  „So funktioniert's“.
- Die Registriermaske der Web-App (znerol74/custix) bleibt vorerst; sie sollte für neue Konten
  auf `/konto` verweisen (Bericht zu #15).
- Passkeys und das Vorladen der Modelle sind bewusst nicht Teil davon.
