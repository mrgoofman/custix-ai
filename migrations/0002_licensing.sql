-- ============================================================================
-- custix beta-access + licensing schema  |  Cloudflare D1 (SQLite)
-- Migration 0002. RUNS AFTER 0001 (Better Auth: user/session/account/verification).
-- Design + rationale: docs/schema/d1-licensing-schema.md ; ADRs 0002-0009.
-- Conventions: timestamps = INTEGER epoch seconds (unixepoch()); booleans = 0/1;
-- enums = TEXT + CHECK; license_key = TEXT COLLATE NOCASE.
-- ============================================================================

-- 1) person — THE PII VAULT (ADR-0008). Only place name/email/profession live.
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

-- 4) license — created BEFORE waitlist_entry because waitlist_entry FKs license(id).
--    THE single row the desktop app validates for life (ADR-0002/0003).
--    Unbound (account_id NULL) until first claim; one License per Account.
--    "active" is DERIVED at validate time, never stored.
CREATE TABLE license (
  id                     TEXT PRIMARY KEY,
  license_key            TEXT NOT NULL COLLATE NOCASE,
  type                   TEXT NOT NULL DEFAULT 'beta' CHECK (type IN ('beta','trial','subscription')),
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  expires_at             INTEGER,                 -- NULL == open-ended (beta default)
  grace_seconds          INTEGER NOT NULL DEFAULT 0 CHECK (grace_seconds >= 0),
  account_id             TEXT,                    -- Better Auth user.id; NULL == unbound. FK-less (D1 best-effort; integrity via indexes/CHECKs)
  claimed_at             INTEGER,
  last_validated_at      INTEGER,
  last_seen_ip           TEXT,
  last_seen_version      TEXT,
  issued_by              TEXT,                    -- admin user.id; NULL if Stripe-minted
  source_waitlist_id     TEXT,                    -- soft pointer (waitlist_entry.id)
  -- Phase-2 Stripe seams (columns only; no billing tables now) — ADR-0007
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  billing_interval       TEXT CHECK (billing_interval IS NULL OR billing_interval IN ('monthly','annual')),
  payment_method         TEXT CHECK (payment_method IS NULL OR payment_method IN ('card','invoice')),
  subscription_status    TEXT CHECK (subscription_status IS NULL OR subscription_status IN
                                     ('active','trialing','past_due','canceled','unpaid','incomplete')),
  last_stripe_event_at   INTEGER,                 -- webhook idempotency/ordering watermark
  created_at             INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at             INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((account_id IS NULL) = (claimed_at IS NULL)),
  CHECK (payment_method IS NULL OR payment_method <> 'invoice' OR billing_interval IS 'annual'), -- invoice => annual (NULL-safe IS)
  CHECK (stripe_subscription_id IS NULL OR type = 'subscription'),
  CHECK (subscription_status IS NULL OR type = 'subscription')
);
CREATE UNIQUE INDEX ux_license_key         ON license(license_key);
CREATE UNIQUE INDEX ux_license_account     ON license(account_id);   -- NULLs distinct => many unbound; bound is 1:1
CREATE UNIQUE INDEX ux_license_stripe_sub  ON license(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX        ix_license_stripe_cust ON license(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX        ix_license_status_type ON license(status, type);

-- 3) waitlist_entry — replaces Supabase `signups`. Workflow/provenance only; PII in person.
CREATE TABLE waitlist_entry (
  id                TEXT PRIMARY KEY,             -- preserves old signups.id verbatim on migration
  person_id         TEXT NOT NULL REFERENCES person(id) ON DELETE RESTRICT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by        TEXT,
  decided_at        INTEGER,
  issued_license_id TEXT REFERENCES license(id) ON DELETE SET NULL,
  download_token    TEXT,                         -- legacy funnel (NOT a License key), 7-day expiry
  token_expires_at  INTEGER,
  created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX ux_waitlist_person         ON waitlist_entry(person_id);
CREATE UNIQUE INDEX ux_waitlist_token          ON waitlist_entry(download_token) WHERE download_token IS NOT NULL;
CREATE UNIQUE INDEX ux_waitlist_issued_license ON waitlist_entry(issued_license_id) WHERE issued_license_id IS NOT NULL;
CREATE INDEX        ix_waitlist_status         ON waitlist_entry(status, created_at);

-- 5) admin_event — append-only audit (ADR-0006/0008). Soft (FK-less) subject pointers; NO PII in detail.
CREATE TABLE admin_event (
  id            TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,                    -- immutable attribution
  action        TEXT NOT NULL CHECK (action IN (
                  'waitlist_approved','waitlist_rejected','license_issued','license_revoked',
                  'license_reinstated','claim_reset','license_extended','license_typeflip',
                  'admin_granted','admin_revoked','person_anonymized','key_email_resent')),
  license_id        TEXT,
  waitlist_id       TEXT,
  subject_person_id TEXT,
  detail            TEXT,                          -- JSON; NO PII
  created_at        INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX ix_admin_event_actor   ON admin_event(actor_user_id, created_at);
CREATE INDEX ix_admin_event_license ON admin_event(license_id, created_at);

-- 6) license_event — replaces Supabase `download_events`. Prunable funnel/telemetry. Exactly one anchor.
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
