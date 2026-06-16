# Authentication via a self-hostable library (Better Auth) on D1

Auth must be D1-backed since Supabase — and thus Supabase Auth — is being removed (ADR-0005).
The constraint is "not Supabase," not a ban on all dependencies; a self-hostable auth *library*
(no external auth service) fits this while keeping credentials in our own D1. We will use a self-hostable auth **library** (Better Auth or
equivalent) that runs inside our own Cloudflare Worker against our own D1 database, providing
vetted password hashing, sessions, magic links, password reset, and login throttling. Admin
status and roles live in a D1 table we define (e.g. `admin_users` / a role column).

Chosen over hand-rolling auth (own hashing/sessions/reset against a D1 `users` table). Both keep
everything on first-party infra, but hand-rolling makes us responsible for every
security-critical primitive — and a subtle auth bug in custix, a company selling data protection,
is an existential reputational risk. A vetted library satisfies "no third party" (it's a library,
not a service, with no external calls) AND "don't roll your own auth."

Recorded because it is a lock-in-bearing technology choice and the security foundation for both
the admin panel and end-user Accounts (ADR-0003), and because "self-hosted, no third party" could
be misread as a mandate to hand-write auth — this ADR records that it is not.

## Sign-in method

**Email + password** for the beta (Better Auth's email/password provider — it owns hashing,
sessions, reset; we do not hand-roll those). Serves both the admin panel and end-user Accounts.
Magic-link was considered (no password surface) but email+password was chosen for familiarity and
offline-friendlier re-login. Password reset + breach-surface are therefore Better Auth's
responsibility, not ours.

## Consequences

- One auth system serves both the admin panel (founder allowlist via the roles table) and
  end-user Accounts used by the desktop app.
- The library must be confirmed compatible with Workers + D1 before committing.
- No external auth provider; all credentials and sessions live in our D1.
