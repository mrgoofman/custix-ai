# Project Context

## Tech Stack
- Next.js 16 with App Router
- Cloudflare Workers (via OpenNext)
- Supabase PostgreSQL
- Resend for email
- next-intl for i18n (de/en)

## Deployment

No CI/CD - deploy manually with:
```bash
npx wrangler deploy
```

Live URL: https://custix-ai.moritz-790.workers.dev
Production: https://custix.ai

## Environment Variables

Defined in `wrangler.jsonc` under `vars`:
- `NEXT_PUBLIC_BASE_URL` - base URL for email links

Secrets (set via Cloudflare dashboard or `wrangler secret put`):
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database

Supabase project. Key tables:
- `signups` - user signups with download tokens
- `download_events` - funnel tracking (email_sent, link_clicked, downloaded)

## Key Features

- Token-gated download page (`/download?token=xxx`)
- Download links sent via email after signup
- 7-day token expiry
