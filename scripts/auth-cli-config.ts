/**
 * CLI-ONLY Better Auth config for schema generation (`@better-auth/cli generate`).
 * NOT used at runtime — the runtime config is src/lib/auth.ts (per-request, native D1).
 * This points at a throwaway local SQLite purely so the CLI can introspect and emit
 * the schema SQL. Keep the providers/options in sync with src/lib/auth.ts so the
 * generated tables match what the Worker expects.
 */
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database(":memory:"),
  emailAndPassword: {
    enabled: true,
  },
});
