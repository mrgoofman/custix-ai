# License validated online monthly — supersedes the app's zero-network design

The desktop app requires **login** and performs an **online License validation once per month**
(plus the one-time online key-claim at login). Between monthly checks it runs offline. We chose
this over claim-once-then-fully-offline (weaker revocation) and every-launch validation (heavier
network use). Monthly online validation enforces revocation and lapsed/expired subscriptions
within ~30 days while keeping daily use offline-tolerant.

**This supersedes a deliberate decision in the desktop app repo (`../custix`).** That repo's
PLAN.md states the app is "Alles lokal, kein Cloud" and lists cloud/network use as out of v1
scope (only the Tauri auto-updater touches the network). The new licensing requirement reverses
that zero-network stance. The reversal MUST be recorded in the app's own `docs/adr/` and PLAN.md,
or an engineer working there will build against the stale "no network" assumption.

Recorded because it directly contradicts the marketing promise of "100% lokal / keine
Cloud-Abhängigkeit". The reconciliation: **document content never leaves the device — only a
small license check does.** The public copy must be corrected from "no cloud dependency" to a
precise claim like "Ihre Dokumente verlassen nie Ihren Rechner" / "your documents never leave
your computer." A blanket "no cloud" claim becomes false once the app phones home for licensing,
and false trust claims to a lawyer/tax-advisor audience are worse than none.

## Consequences

- A user who is offline for >~1 month at validation time is blocked until the app can re-validate.
  (Accepted; daily use is offline between monthly checks.)
- Marketing/site copy and PRD claims about "no cloud / kein Cloud" must be corrected to "your
  documents never leave your device" — the app now makes a licensing network call. The app repo's
  install-time / first-run "no cloud" UX copy must be reconciled too.
- The app repo (`../custix`) must amend its PLAN.md and add an ADR reversing its zero-network
  stance, and schedule net-new work (login client, key-claim, monthly validate) that is not in
  its current 16-week build plan.
- The validate endpoint is a published contract with the desktop-app repo (see ADR-0002).
