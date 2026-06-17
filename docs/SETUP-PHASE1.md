# Phase 1 Setup — D1, Better Auth, secrets

Steps **you** must run (they create cloud resources / set secrets in your Cloudflare
account — these can't be done from the codebase). Run with Node ≥22 on PATH and the
custix-ai Cloudflare account selected (`CLOUDFLARE_ACCOUNT_ID=790369fbd60bd3d4d6e34bacbd0c854d`).

## 1. Create the D1 database

```bash
npx wrangler d1 create custix-db
```
Copy the printed `database_id` into `wrangler.jsonc` → `d1_databases[0].database_id`
(replace `PLACEHOLDER_RUN_WRANGLER_D1_CREATE`).

## 2. Generate Better Auth's schema (creates migrations/0001_*)

Better Auth ≥1.5 owns the `user`/`session`/`account`/`verification` tables. Generate them
as SQL and place as migration `0001` (must run BEFORE `0002_licensing.sql`):

```bash
npx @better-auth/cli generate          # outputs the Better Auth SQL
# put the generated SQL into migrations/0001_better_auth.sql
```
(If the CLI can't see D1, point it at the local miniflare sqlite — see
docs/schema/d1-licensing-schema.md notes, or generate against a local sqlite file.)

## 3. Apply migrations (local, then remote)

```bash
npx wrangler d1 migrations apply custix-db --local
npx wrangler d1 migrations apply custix-db --remote
```

## 4. Set secrets

```bash
# Auth signing secret
openssl rand -hex 32 | npx wrangler secret put BETTER_AUTH_SECRET
# Email (already used today)
npx wrangler secret put RESEND_API_KEY
```
`BETTER_AUTH_URL` and `NEXT_PUBLIC_BASE_URL` are plain vars already in wrangler.jsonc
(set to https://custix.ai). For local dev, override via .dev.vars if needed.

## 5. Seed the first admin (after you register once)

Better Auth has no admin yet (chicken-and-egg). Register your founder account via the app
once, find your `user.id`, then:

```bash
npx wrangler d1 execute custix-db --remote \
  --command "INSERT INTO admin_role (user_id) VALUES ('<your-better-auth-user-id>');"
```
The admin panel manages all further admins.

## 6. Remove Supabase secrets (after migration verified)

Once the D1 cutover is verified, the old `NEXT_PUBLIC_SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY` secrets are unused and can be deleted from the Cloudflare
dashboard.

## Local dev note

`getCloudflareContext()` (D1 access) requires the OpenNext/wrangler dev runtime, not plain
`next dev`. Use `wrangler dev` against the built worker, or the OpenNext preview, to exercise
D1 locally. `next dev` won't have the binding.
