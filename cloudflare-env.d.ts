// Augments the CloudflareEnv used by @opennextjs/cloudflare's getCloudflareContext()
// with this project's bindings and vars. Keep in sync with wrangler.jsonc.
import type { D1Database, RateLimit } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    NEXT_PUBLIC_BASE_URL?: string;
    RESEND_API_KEY?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    // Partner signup (ADR-0011)
    TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    /** Nur lokal (.dev.vars): zusätzliche Ursprünge für die Vorschau, kommagetrennt. */
    PARTNER_DEV_ORIGINS?: string;
    PARTNER_SIGNUP_LIMITER?: RateLimit;
  }
}

export {};
