# Partner signup einrichten (ADR-0011)

Was auf unserer Seite nötig ist, damit ein Partner (zuerst finditoo) das
Formular `/partner/signup.js` einbetten kann. Die Übergabe an den Partner
steht in `partners/<partner>/README.md`.

## Einmalig: Cloudflare Turnstile

1. Cloudflare-Dashboard (Konto Moritz, `790369fbd60bd3d4d6e34bacbd0c854d`) →
   **Turnstile → Add widget**, Modus **Managed**.
2. Hostnamen: alle Partnerdomains, für finditoo
   `finditoo-marketing.com`, `www.finditoo-marketing.com` und – sobald
   bekannt – die Staging-Domain. Ein Widget reicht für alle Partner (bis zu
   10 Hostnamen).
3. Site-Key in `wrangler.jsonc` → `vars.TURNSTILE_SITE_KEY` eintragen
   (öffentlich).
4. Geheimnis setzen:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

Ohne Site-Key oder Geheimnis zeigt das Formular „in Kürze verfügbar“ und der
Endpunkt antwortet `partner_disabled`.

## Einmalig: Datenbank

```bash
npx wrangler d1 migrations apply custix-db --remote
```

(Migration `0005_partner.sql`: Spalte `user.partner`.)

## Go-live eines Partners

1. In `src/lib/partners.ts` Ursprünge und Hostnamen prüfen (Staging ergänzen),
   dieselben Hostnamen im Turnstile-Widget.
2. Deploy mit `enabled: false` – der Partner kann auf seiner Entwurfsseite
   einbauen, das Formular zeigt „in Kürze verfügbar“.
3. Für den gemeinsamen Test `enabled: true`, deployen, einmal mit einer
   Testadresse registrieren. Im Admin-Panel prüfen: Lizenz mit Partner
   „finditoo“, Trichter zählt 1. Testkonto danach löschen.
4. Partner veröffentlicht die Seite.

## Neuer Partner

Eintrag in `src/lib/partners.ts` (`PartnerId` erweitern), Hostnamen im
Turnstile-Widget, eigener Ordner `partners/<id>/` mit Landingpage und README.
Keine Migration nötig.

## Vorschau für den Partner

`public/finditoo/` wird mit der Website ausgeliefert: **custix.ai/finditoo/**
zeigt `landing.html` mit einem Hinweisbalken, das Formular im Vorschau-Modus
(`data-demo`: ohne Turnstile, legt kein Konto an). `landing.html` selbst ist
unter custix.ai/finditoo/landing.html abrufbar – das ist die Datei für den
Partner. `noindex`, nicht verlinkt.

## Lokale Vorschau

Demo-Modus: `http://localhost:8787/finditoo/` bei laufendem `custix-wrangler`.

Echte Registrierung gegen das lokale Backend (über Domaingrenze, wie beim
Partner): `.dev.vars` (nicht im Git) um Testschlüssel und den Vorschau-Ursprung
ergänzen:

```
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
PARTNER_DEV_ORIGINS=http://localhost:8090
```

Dann `npm run build:cf`, Launch-Configs `custix-wrangler` (8787) und
`finditoo-preview` (8090) starten und
`http://localhost:8090/?api=http://localhost:8787&live=1` öffnen. Für diesen
Ursprung gilt das Formular auch bei `enabled: false`; Turnstile-Testschlüssel
werden nur für `PARTNER_DEV_ORIGINS` akzeptiert.
