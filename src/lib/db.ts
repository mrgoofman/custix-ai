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

export interface AccountLicense {
  id: string;
  license_key: string;
  type: string;
  status: string;
  expires_at: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

/**
 * Die aktuelle Lizenz eines Kontos. Stand vorher wortgleich in vier Routen –
 * jede Änderung an der Auswahlregel hätte sonst vier Stellen gebraucht.
 */
export async function findLicenseForAccount(
  accountId: string
): Promise<AccountLicense | null> {
  return await getDb()
    .prepare(
      `SELECT id, license_key, type, status, expires_at,
              stripe_customer_id, stripe_subscription_id
         FROM license
        WHERE account_id = ? AND status != 'revoked'
        ORDER BY created_at DESC LIMIT 1`
    )
    .bind(accountId)
    .first<AccountLicense>();
}
