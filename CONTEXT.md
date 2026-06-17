# custix.ai — Beta Access & Billing

This context covers the controlled beta-access system and the subscription billing
that sits on top of it: how a person goes from interested visitor, to approved beta
user, to a paying subscriber. It is distinct from the marketing website (see PRD.md),
and from the desktop anonymization product (released from `znerol74/custix-releases`).

**Out of scope (for now):** Team tier / multi-seat licensing. Only single-Account
Licenses exist. (The public pricing's "Team" tier is deferred.)

**Phasing:**
- **Phase 1 (now):** Waitlist capture · Admin panel to approve & email a Beta key ·
  License model with Account login + Key claim + the "active" check · the desktop app's
  validate endpoint. No payments.
- **Phase 2 (deferred):** Stripe subscriptions (monthly/annual Card; annual-only Invoice
  payment), webhooks mapping Subscription status → License status/expiry, conversion of a
  beta License to `type=subscription` keeping the same key.

**Validation cadence:** the desktop app requires login and validates the License **online
once per month** (plus the one-time online key-claim at login); offline between checks. This
supersedes the app's "kein Cloud" design — see ADR-0004 and the app repo's ADR-0007.

**Erasure vs. retention (GDPR):** personal data (name, email, profession) is isolated to as
few columns/tables as possible. A DSGVO erasure request **anonymizes** that PII while
**retaining** the License (key/type/status/dates) and billing/invoice references with the
subject de-identified — because AT/DE tax law requires invoices be kept ~7–10 years. Erasure
= scrub PII, keep legal + entitlement records unlinkable to the person. Designed in from day 1.

**Infra constraint:** the firm requirement is **"not Supabase"** — Supabase is being
removed. It is NOT a blanket "no third-party services" rule: managed services on hosters
already in use (Cloudflare; Stripe and Resend remain) are acceptable. Database is
**Cloudflare D1** (SQLite); auth is a self-hostable library on D1 (Better Auth). These
satisfy "not Supabase" while staying on the existing Cloudflare stack.

## Language

### Access & identity

**Waitlist entry**:
A request for beta access, captured before any login exists. Demand capture only — name,
email, profession, locale. Pending the team's approval.
_Avoid_: signup, lead, registration

> **Migration note:** the existing public signup modal currently auto-emits a download-link
> email (self-serve, ungated — `api/signup`). During beta it is repurposed into a **waitlist
> request**: it stops emitting download links, creates a Waitlist entry, and shows a "we'll be
> in touch" confirmation. App access comes only after an Admin issues a Beta key. The legacy
> instant-download behaviour is retired for the beta.

**Account**:
A person's authenticated identity in the desktop app, created by logging in with any email
the user chooses (the login email need not match the email a key was delivered to). A claimed
License is bound to exactly one Account; using the app requires being logged into that Account.
_Avoid_: user (when identity is meant), profile

**Key claim**:
The act of entering a License key into the logged-in desktop app for the first time. On first
entry the key binds to that Account (one key ↔ one Account, first-come). A different Account
entering an already-claimed key is refused. This — plus the login requirement — is what makes a
key "tied to a person and not freely shared."
_Avoid_: activation, redemption

### Destructive admin operations (purposes are distinct — do not conflate)

**Reset claim** — unbinds a key from its Account so it can be re-claimed. **Rare.** NOT for device
changes (the License binds to the Account, so a user with a new laptop just logs in again). Only
for genuine mis-claims (wrong account claimed the key). Friction: one confirm; audited.

**Revoke** — removes access for a person who should no longer have it (abuse, lapsed non-payment,
refund). Sets `status='revoked'` and clears `account_id` (so the account could claim a replacement
key later). Login does NOT restore it — that's the point. Friction: one confirm; audited.

**Anonymize (person)** — the GDPR erasure mechanism (ADR-0008), **legally required on request**,
not a product feature. Nulls the person's PII; **irreversible**. Unrelated to licenses/login.
Friction: **type-the-email to confirm**; audited.

**License**:
The single entitlement the desktop app validates for an Account's entire lifetime. Has a
`type` (`beta` | `trial` | `subscription`) and a `status` (`active` | `expired` | `revoked`),
plus an expiry. The app always asks the backend "is this license valid right now?" — the
check never changes as the type flips beta → subscription. Stripe webhooks keep status/expiry
current. The app never talks to Stripe directly.
_Avoid_: license code, token, access code, entitlement

> `type=trial` is **reserved but not used during beta** — there is no self-serve trial.
> Beta access = a team-issued Beta key; otherwise a paid subscription. Real trial mechanics
> (and length) are decided at public launch.
> **Copy conflict to fix:** the site/emails say "14 Tage kostenlos testen" (and the legacy
> download token expires in 7) — both promise a trial that does not exist in the beta model.
> Remove/rephrase before launch.

**Beta key**:
A License with `type=beta` — the form a License takes during the beta phase, issued manually
from the Admin panel to approve a Waitlist entry ("the team confirms requests"). Not a
separate concept from License; just its beta-phase shape.
_Avoid_: access code (use "License" for the general concept)

**License key**:
The string the desktop app holds and sends to the backend to prove entitlement. Identifies a
License. Distinct from a Download token — a License key unlocks ongoing *use* of the app.
Format: `CUSTIX-XXXX-XXXX-XXXX` — Crockford base32 (no ambiguous 0/O/1/I), grouped in 4s,
≥100 bits of entropy, unguessable and collision-free. Stored normalized (uppercase); compared
case-insensitively (strip dashes/whitespace on input).
_Avoid_: token, activation code

**Active**:
A License is *active* when it currently entitles app use — NOT a synonym for "paid". A License
is active when its `status=active` and it has not passed expiry+grace, regardless of `type`:
- `type=beta` / `type=trial`: active by team grant / until expiry (no payment).
- `type=subscription`: active while the Stripe subscription is paid and current.
So: active = (within expiry+grace) AND (beta/trial granted, OR subscription paid/current).
_Avoid_: "paid = active" (beta and trial are active without payment)

**Grace window (past_due handling):**
When a subscription renewal invoice is issued but not yet paid (Stripe `past_due`), the License
stays **active until `grace_until`** (e.g. invoice due date + ~14 days), then expires. This keeps
committed annual-invoice customers (slow bank transfers) from being locked out mid-case; only
persistent non-payment (→ `canceled`/`unpaid`) deactivates. This is what the `grace_until` field
in the validate contract is for. (Whether grace differs by payment method — longer for
invoice/transfer, shorter for failed card — is an open refinement.)

**Download token**:
The existing one-time, 7-day credential that gates downloading the installer via
`/download?token=…`. It does NOT reach the desktop app and does NOT govern app usage. A
separate mechanism from a License key.
_Avoid_: key, license (it is neither)

**Admin panel**:
The internal, team-only surface where the team reviews Waitlist entries and issues Beta keys
("bestätigt Anfragen"), and resets key claims. Not visible to customers. Access gated by the
shared auth (Better Auth on D1); a founder is an Account whose row is flagged admin in a D1
roles/`admin_users` table.
_Avoid_: dashboard, backoffice

**Admin**:
A founder Account authorized for the Admin panel, identified by an admin flag/role in a D1
table — not a separate auth system. Same login mechanism as end-user Accounts.
_Avoid_: superuser, staff

**Approve (waitlist):**
One admin click that atomically: mints a beta License (open-ended), generates the key, emails it
to the person, marks the entry approved, and logs an `admin_event`. Mint+commit happens before the
email; if the email fails the admin gets a **resend** affordance (no half-approved state). The
admin's judgment is the gate — no second confirmation step.
_Avoid_: grant, invite (use "approve")

**Send key to email (direct):**
An admin can also mint + email a beta key to any address with **no prior Waitlist entry** — for
out-of-band access requests. Creates/links a `person`, mints an open-ended beta License, emails the
key. Same key/License model as approve; just not gated on a waitlist row.

**Admin visibility:**
Admins see full waitlist/customer PII (name/email/profession) plus aggregate usage metrics, to
triage. Mutating actions (approve/revoke/reset) are audited in `admin_event`; record *views* are
NOT logged (beta-appropriate for 3 founders; revisit at scale).

**Usage analytics:**
Content-free, aggregate, GA4-like telemetry from the desktop app (event names + counts only —
NEVER document text/entity values/filenames). Consent presented at onboarding as a visible
**default-on** toggle. Two legal specifics flagged for Laurenz: pre-checked-consent validity under
GDPR, and honest label wording ("documents never leave your device" is true for content, NOT for
the analytics counts). See ADR-0009.
_Avoid_: tracking, GA (it is first-party, content-free)

### Billing

**Subscription**:
A recurring paid plan on an Account. Has an interval (monthly or annual) and a payment
method (card or invoice). The public pricing already advertises this; beta precedes it.
_Avoid_: plan (when the recurring agreement is meant), abo

**Invoice payment**:
Paying a Subscription by bank transfer against a Stripe-issued invoice with a virtual IBAN
(Stripe `collection_method=send_invoice`). **Only available on the annual interval** — there
is no monthly invoice option. The customer transfers the money; Stripe auto-reconciles.
_Avoid_: Rechnung (ambiguous — this is NOT Stripe "payment on invoice"/BNPL, which is up-front
and one-off and cannot be recurring), pay-on-invoice, bank transfer (alone)

**Card payment**:
Paying a Subscription by card. Available on **both** monthly and annual intervals. Fully
automated collection.
_Avoid_: —

## License policy values (resolved; all are policy columns, no schema change to alter)

- **Beta key expiry:** open-ended now (`expires_at = NULL`, `grace_seconds = 0`). Two levers to
  invalidate later, both zero-migration: revoke one key (`status='revoked'` + clear `account_id`),
  or end a cohort/beta by stamping `expires_at` with a cutoff. The flexibility to "make them no
  longer valid later" is built in via the nullable `expires_at`.
- **Grace windows (`grace_seconds`):** beta/trial = **0**; card subscription = **7 days**;
  annual-invoice subscription = **30 days** (bank transfers settle slowly). Set per-license.
- **Beta→subscription flip:** `expires_at = MAX(existing beta expiry, Stripe period end)` — a beta
  user who buys early never loses remaining free runway.
- **Admin claim-reset effect:** takes effect at the displaced user's next monthly validate, bounded
  by `grace_until` (no server push; ADR-0002 is pull-only). No app re-release needed.

## License issuance rules

- **New buyer (never in beta)**: purchase mints a new License + key, emailed automatically.
- **Beta user who buys**: keeps the SAME key; purchase flips `type` beta → subscription and
  extends expiry. The email re-states the existing key — no new key, no key swap in the app.
- **Beta approval**: the Admin panel issues a License with `type=beta` and emails the key.
- The desktop app always validates the key it already holds; conversion never swaps the key.

## Buyable options (the only combinations offered)

1. Monthly + Card
2. Annual + Card
3. Annual + Invoice payment

(Monthly + Invoice payment does not exist. Invoice payment forces the annual interval.)
