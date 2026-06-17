# custix D1 Schema — Beta Access & Licensing (Phase 1 reference)

Cloudflare D1 (SQLite) schema for the waitlist / Account / License / admin system, designed
against the locked decisions in [CONTEXT.md](../../CONTEXT.md) and ADRs 0001–0008. Produced by a
multi-agent design+adversarial-critique pass; the critiques it survived are listed at the end.

> Status: **design reference, not yet applied.** No D1 binding exists in `wrangler.jsonc` yet.
> Phase 1 implementation work. Better Auth owns `user`/`session`/`account`/`verification` — those
> are **not** defined here; we reference `user(id)`.

## Conventions (and why)

- **Timestamps = INTEGER epoch seconds** (`unixepoch()`). Chosen over TEXT-ISO to eliminate a whole
  bug class: SQLite's `datetime(x,'+N days')` emits a space-separated, no-`T`/no-`Z` string that
  lexically mis-sorts against stored ISO strings, silently breaking the grace window. Grace math
  becomes pure integer addition. Convert epoch↔ISO **only** at the HTTP boundary (the ADR-0002
  contract returns `expires`/`grace_until` as ISO dates).
- **Booleans** = INTEGER 0/1 + `CHECK (col IN (0,1))`. **Enums** = TEXT + `CHECK (... IN (...))`
  (SQLite has no enum/uuid types). Enum lists pre-load future values (trial, full Stripe statuses)
  to avoid SQLite's 12-step table rebuild on the table the app validates "for life".
- **`license_key TEXT COLLATE NOCASE`** → the unique index and every compare are case-insensitive
  at the DB level. App still strips dashes/whitespace + uppercases before binding.
- **Integrity is in CHECKs + unique indexes, not FK cascades** (FK actions are best-effort on D1).

## DDL

```sql
PRAGMA foreign_keys = ON;
-- Better Auth tables (user/session/account/verification) are created by its migrator; referenced, never redefined.

-- 1) person — THE PII VAULT (ADR-0008). Only place name/email/profession live.
--    GDPR erasure = NULL the PII columns + set anonymized_at; everything else references person by opaque id.
CREATE TABLE person (
  id            TEXT PRIMARY KEY,
  email         TEXT COLLATE NOCASE,              -- PII; NULL after erasure
  name          TEXT,                             -- PII; NULL after erasure
  profession    TEXT,                             -- PII; NULL after erasure
  locale        TEXT NOT NULL DEFAULT 'de' CHECK (locale IN ('de','en')),
  user_id       TEXT,                             -- Better Auth user.id once registered (nullable)
  anonymized_at INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX ux_person_email ON person(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX ux_person_user  ON person(user_id) WHERE user_id IS NOT NULL;

-- 2) admin_role — presence of a row == admin (ADR-0006). Keyed by Better Auth user.id.
CREATE TABLE admin_role (
  user_id    TEXT PRIMARY KEY,
  role       TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 3) waitlist_entry — replaces Supabase `signups`. Workflow/provenance only; PII lives in person.
CREATE TABLE waitlist_entry (
  id                TEXT PRIMARY KEY,             -- preserves old signups.id verbatim on migration
  person_id         TEXT NOT NULL REFERENCES person(id) ON DELETE RESTRICT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by        TEXT,
  decided_at        INTEGER,
  issued_license_id TEXT,
  download_token    TEXT,                         -- legacy funnel (NOT a License key), 7-day expiry
  token_expires_at  INTEGER,
  created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (issued_license_id) REFERENCES license(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX ux_waitlist_person          ON waitlist_entry(person_id);
CREATE UNIQUE INDEX ux_waitlist_token           ON waitlist_entry(download_token) WHERE download_token IS NOT NULL;
CREATE UNIQUE INDEX ux_waitlist_issued_license  ON waitlist_entry(issued_license_id) WHERE issued_license_id IS NOT NULL;
CREATE INDEX        ix_waitlist_status          ON waitlist_entry(status, created_at);

-- 4) license — THE single row the desktop app validates for life (ADR-0002/0003).
--    Unbound (account_id NULL) until first claim; one License per Account; type flips beta->subscription in place.
--    "active" is DERIVED in active_query, never stored.
CREATE TABLE license (
  id                     TEXT PRIMARY KEY,
  license_key            TEXT NOT NULL COLLATE NOCASE,
  type                   TEXT NOT NULL DEFAULT 'beta' CHECK (type IN ('beta','trial','subscription')),
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  expires_at             INTEGER,                 -- NULL == open-ended
  grace_seconds          INTEGER NOT NULL DEFAULT 0 CHECK (grace_seconds >= 0),
  account_id             TEXT REFERENCES "user"(id) ON DELETE RESTRICT,
  claimed_at             INTEGER,
  last_validated_at      INTEGER,
  last_seen_ip           TEXT,
  last_seen_version      TEXT,
  issued_by              TEXT,                     -- admin user.id; NULL if Stripe-minted
  source_waitlist_id     TEXT REFERENCES waitlist_entry(id) ON DELETE SET NULL,
  -- Phase-2 Stripe seams (columns only; no billing tables now)
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  billing_interval       TEXT CHECK (billing_interval IS NULL OR billing_interval IN ('monthly','annual')),
  payment_method         TEXT CHECK (payment_method IS NULL OR payment_method IN ('card','invoice')),
  subscription_status    TEXT CHECK (subscription_status IS NULL OR subscription_status IN
                                     ('active','trialing','past_due','canceled','unpaid','incomplete')),
  last_stripe_event_at   INTEGER,                  -- webhook idempotency/ordering watermark (ADR-0007)
  created_at             INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at             INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((account_id IS NULL) = (claimed_at IS NULL)),
  CHECK (payment_method IS NULL OR payment_method <> 'invoice' OR billing_interval IS 'annual'), -- invoice => annual (NULL-safe IS)
  CHECK (stripe_subscription_id IS NULL OR type = 'subscription'),
  CHECK (subscription_status IS NULL OR type = 'subscription')
);
CREATE UNIQUE INDEX ux_license_key          ON license(license_key);
CREATE UNIQUE INDEX ux_license_account      ON license(account_id);   -- NULLs distinct => many unbound; bound is 1:1
CREATE UNIQUE INDEX ux_license_stripe_sub   ON license(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX        ix_license_stripe_cust  ON license(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX        ix_license_status_type  ON license(status, type);

-- 5) admin_event — append-only audit of privileged actions (ADR-0006/0008). Soft (FK-less) subject pointers
--    so it outlives erased subjects; actor_user_id NOT NULL (immutable attribution). No PII in detail JSON.
CREATE TABLE admin_event (
  id            TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  action        TEXT NOT NULL CHECK (action IN (
                  'waitlist_approved','waitlist_rejected','license_issued','license_revoked',
                  'license_reinstated','claim_reset','license_extended','license_typeflip',
                  'admin_granted','admin_revoked','person_anonymized')),
  license_id        TEXT,
  waitlist_id       TEXT,
  subject_person_id TEXT,
  detail            TEXT,                          -- JSON; NO PII
  created_at        INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX ix_admin_event_actor   ON admin_event(actor_user_id, created_at);
CREATE INDEX ix_admin_event_license ON admin_event(license_id, created_at);

-- 6) license_event — replaces Supabase `download_events`. Prunable funnel/telemetry. Exactly one anchor set.
CREATE TABLE license_event (
  id            TEXT PRIMARY KEY,
  license_id    TEXT REFERENCES license(id) ON DELETE CASCADE,
  waitlist_id   TEXT REFERENCES waitlist_entry(id) ON DELETE CASCADE,
  actor_user_id TEXT,
  event_type    TEXT NOT NULL CHECK (event_type IN (
                  'email_sent','link_clicked','downloaded',         -- migrated funnel
                  'claimed','claim_refused','validated','grace_entered','expired','revoked','typeflip','stripe_webhook')),
  metadata      TEXT,                              -- JSON; NO PII
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((license_id IS NULL) <> (waitlist_id IS NULL))
);
CREATE INDEX ix_license_event_license  ON license_event(license_id, created_at);
CREATE INDEX ix_license_event_waitlist ON license_event(waitlist_id, created_at);
CREATE INDEX ix_license_event_type     ON license_event(event_type, created_at);
```

## Validate query (ADR-0002 hot path)

One indexed point-lookup on `ux_license_key`. **All entitlement params are server-supplied** —
`:caller` (logged-in Better Auth user.id, required) and `:now` (server epoch) are NEVER taken
from the client. Arm order is load-bearing.

```sql
SELECT
  l.id, l.type, l.status, l.account_id,
  l.expires_at AS expires,
  CASE WHEN l.expires_at IS NULL THEN NULL ELSE l.expires_at + l.grace_seconds END AS grace_until,
  CASE
    WHEN l.account_id IS NULL              THEN 0   -- never claimed
    WHEN :caller IS NULL OR :caller = ''   THEN 0   -- no session
    WHEN l.account_id <> :caller           THEN 0   -- claimed_elsewhere
    WHEN l.status IN ('revoked','expired') THEN 0   -- forced downgrade: grace must NOT leak
    WHEN l.expires_at IS NOT NULL AND :now >= l.expires_at + l.grace_seconds THEN 0
    WHEN l.type IN ('beta','trial')        THEN 1
    WHEN l.type = 'subscription' AND l.subscription_status IN ('active','trialing','past_due') THEN 1
    ELSE 0
  END AS valid,
  CASE
    WHEN l.account_id IS NULL                     THEN 'license.not_claimed'
    WHEN :caller IS NULL OR :caller = ''          THEN 'license.no_session'
    WHEN l.account_id <> :caller                  THEN 'license.claimed_elsewhere'
    WHEN l.status = 'revoked'                      THEN 'license.revoked'
    WHEN l.status = 'expired'                      THEN 'license.expired'
    WHEN l.expires_at IS NOT NULL AND :now >= l.expires_at + l.grace_seconds THEN 'license.expired'
    WHEN l.expires_at IS NOT NULL AND :now >= l.expires_at THEN 'license.in_grace'
    WHEN l.type='subscription' AND l.subscription_status='past_due' THEN 'license.renewal_due'
    ELSE 'license.ok'
  END AS message_key
FROM license l
WHERE l.license_key = :key;   -- NOCASE index; one row or zero
```

Worker glue: zero rows → `{valid:false, message_key:'license.unknown'}`. Convert epoch→ISO date at the
boundary. Telemetry (`last_validated_at`, a `validated` license_event) is a **separate** statement
guarded `WHERE account_id = :caller` — the validate path never mutates billing status (webhooks own that).

## Key claim (ADR-0003) — race-safe compare-and-swap

```sql
UPDATE license
   SET account_id = :caller, claimed_at = :now, updated_at = :now
 WHERE license_key = :key AND account_id IS NULL AND status <> 'revoked';
```
Three outcomes: `changes==1` → success (+ `claimed` event in the same D1 batch); **UNIQUE error** on
`ux_license_account` → caller already owns a different license → `already_have_license`; `changes==0`
→ read the row to disambiguate unknown / revoked / idempotent-already-mine / `claimed_elsewhere`.
Admin reset clears `account_id` + `claimed_at` together (keeps the invariant). Revoke also clears
`account_id` so a revoked user can claim a replacement.

## Type-flip beta→subscription (ADR-0002 / ADR-0007) — same row, same key

Guarded, idempotent UPDATE driven by the first `invoice.paid` webhook: sets `type='subscription'`,
Stripe seams, `expires_at = MAX(existing, current_period_end)` (never shorten — see fork 4),
`last_stripe_event_at` watermark. `WHERE id=:id AND type='beta' AND (last_stripe_event_at IS NULL OR
last_stripe_event_at < :event_created)` makes replays/stale events safe no-ops. New buyer (never in
beta) = mint a fresh `type=subscription` license + key, claimed via the same flow.

## Migration from Supabase

`signups` → split into `person` (PII) + `waitlist_entry` (workflow), **preserving `signups.id` as
`waitlist_entry.id`** (it's the FK target of `download_events`). `download_events` → `license_event`
(folded, not dropped until backfill verified). Cutover code changes: `api/signup` duplicate-email
branch keys on `SQLITE_CONSTRAINT_UNIQUE` not Postgres `23505`, and stops emitting download links
(becomes waitlist capture); `api/download` expiry check becomes integer epoch compare; both read PII
via the `person` join. Dedupe emails before import (`ux_person_email` is hard-unique).

## Critiques this design survived (highlights)

Wrong-entitlement bugs fixed: subscription with NULL/stale Stripe status validating; grace leaking
past a fraud-cancel; unbound/leaked key validating for anyone; binding not enforced in SQL.
Integrity fixes: claim UNIQUE-violation as a third outcome; revoked user lockout; audit attribution
surviving user deletion; `ON DELETE SET NULL` unbinding a paid key (→ RESTRICT). Dialect/correctness:
epoch ints kill the `datetime()` mis-sort; `invoice => annual` CHECK uses null-safe `IS`; client
can't control `:now`. **And the big miss:** all four initial designs ignored ADR-0008 PII isolation
until the critique forced the dedicated `person` vault.
