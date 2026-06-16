# Context Map — custix

custix spans two repositories with distinct contexts. Licensing, auth, and entitlement
decisions are **cross-context** and bind both.

## Contexts

- **Website & Backend** (this repo, `custix-ai`) — [CONTEXT.md](./CONTEXT.md) — marketing site,
  waitlist capture, admin panel, License issuance/tracking, auth, the License validate endpoint,
  and (Phase 2) Stripe billing. Next.js on Cloudflare Workers; DB is Cloudflare D1.
- **Desktop App** (`../custix`, GitHub `znerol74/custix`) — has its own `CONTEXT.md` and
  `docs/adr/`. Tauri (Rust) + React + Python NER sidecar. AT-lawyer anonymization tool;
  architected local-first. Must add login, key-claim, and monthly online License validation.

## Relationships

- **App → Backend (License validation):** the desktop app holds one License key, requires login,
  and validates **monthly** against the backend's validate endpoint. The endpoint response
  (`valid`, `type`, `expires`) is a published contract. See ADR-0002, ADR-0003, ADR-0004 here.
- **Backend → App (entitlement source of truth):** the backend owns Account, License, key-claim,
  and (Phase 2) the Stripe→License status mapping. The app never talks to Stripe.
- **Conflict resolved:** ADR-0004 (monthly online validation + login) **supersedes** the app
  repo's deliberate "kein Cloud / no network" design. That reversal must also be recorded in the
  app repo's PLAN.md and `docs/adr/` — mirrored as `docs/adr/00XX-online-license-validation.md`
  there. Until the app repo records it, the two repos disagree.

## Shared language

The License / Account / key-claim / "active" definitions in this repo's [CONTEXT.md](./CONTEXT.md)
are authoritative for both contexts. The app repo should reference them rather than redefining.
