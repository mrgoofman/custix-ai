# Database is Cloudflare D1 (SQLite), replacing Supabase

The firm requirement is **"not Supabase"** (the founder explicitly does not want Supabase). This
is not a blanket ban on managed services — services already in use on the existing stack (Stripe,
Resend) remain, and managed databases on hosters are acceptable. We are removing Supabase and
using **Cloudflare D1** (SQLite) as the database, accessed via a Workers binding in the existing
OpenNext/Workers deploy — which keeps the data layer on the Cloudflare stack already in use.

Chosen over managed Postgres on Railway and self-run Postgres: D1 is native to the current
Cloudflare Workers deployment (no separate host, no connection string, no edge pooler/Hyperdrive),
lives in the team's own Cloudflare account, and imposes the least operational burden on a
three-founder pre-revenue team. The trade-offs accepted: SQLite dialect (not Postgres), and
D1's scale/feature ceiling versus Postgres.

Recorded because it is a stack-defining, hard-to-reverse choice that also contradicts the
currently-documented stack (CLAUDE.md says "Supabase PostgreSQL") and the live code (3 files use
`@supabase/supabase-js`). A future reader will otherwise assume Postgres + Supabase.

## Consequences

- Migrate the existing `signups` and `download_events` tables and the 3 files that use Supabase
  (`api/signup`, `api/download`, `download` page) to D1; drop `@supabase/supabase-js`; remove
  `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`; update CLAUDE.md.
- Auth cannot use Supabase Auth (Supabase is gone); it must be D1-backed (see auth ADR).
- SQL must be written in SQLite dialect; pick a D1-compatible query layer (e.g. Drizzle).
- EU data-residency for the "we control the data" GDPR story depends on D1's region behaviour —
  verify before leaning on it in marketing.
