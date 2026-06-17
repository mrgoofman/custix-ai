import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * The D1 database binding. On Workers the binding only exists inside a request,
 * so this must be called per-request (never cached at module top-level).
 * Binding name "DB" is declared in wrangler.jsonc d1_databases.
 */
export function getDb(): D1Database {
  const { env } = getCloudflareContext();
  const db = env.DB;
  if (!db) {
    throw new Error(
      "D1 binding 'DB' is not available. Create it with `wrangler d1 create custix-db` and set database_id in wrangler.jsonc."
    );
  }
  return db;
}

/** Current time as epoch seconds — the unit all timestamps use (see migrations). */
export function nowEpoch(): number {
  return Math.floor(Date.now() / 1000);
}
