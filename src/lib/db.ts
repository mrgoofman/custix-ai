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
  /** Kulanzfrist nach expires_at in Sekunden (CONTEXT.md, „Grace window"). */
  grace_seconds: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  /** Stripe-Status des Abos; trägt bei type='subscription' die Gültigkeit (lib/entitlement.ts). */
  subscription_status: string | null;
  /**
   * Letzte Prüfung über /api/license/validate. Die ruft nur die Desktop-App
   * auf – die Web-App fragt /api/license/mine (ADR-0012; vor dem 27.09.2026
   * prüfte auch sie über validate). „Gesetzt“ heißt also: Diese Lizenz läuft
   * schon in der Desktop-App.
   */
  last_validated_at: number | null;
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
      `SELECT id, license_key, type, status, expires_at, grace_seconds,
              stripe_customer_id, stripe_subscription_id, subscription_status,
              last_validated_at
         FROM license
        WHERE account_id = ? AND status != 'revoked'
        ORDER BY created_at DESC LIMIT 1`
    )
    .bind(accountId)
    .first<AccountLicense>();
}

/**
 * Eine Lizenz, die dieses Konto hatte und die das Team widerrufen hat (Admin
 * „Revoke“). Der Widerruf löst account_id (CONTEXT.md, „Revoke“), deshalb
 * findet findLicenseForAccount sie nicht mehr; die Spur zum Konto bleibt im
 * 'claimed'-Ereignis (Trial-Start oder Schlüssel-Claim), der Widerruf im
 * admin_event. Testphasen, die ein eingelöster Beta-Schlüssel abgelöst hat
 * (Claim-Route, Schritt 0), zählen nicht – das war kein Widerruf.
 *
 * Damit melden /api/license/mine und /konto „gesperrt“ statt „keine Lizenz“,
 * und eine neue Testphase lässt sich nicht einfach nachstarten.
 */
export async function findRevokedLicenseForAccount(
  accountId: string
): Promise<{ id: string; type: string } | null> {
  return await getDb()
    .prepare(
      `SELECT l.id, l.type
         FROM license l
        WHERE l.status = 'revoked' AND l.account_id IS NULL
          AND EXISTS (SELECT 1 FROM license_event e
                       WHERE e.license_id = l.id AND e.event_type = 'claimed'
                         AND e.actor_user_id = ?)
          AND EXISTS (SELECT 1 FROM admin_event a
                       WHERE a.license_id = l.id AND a.action = 'license_revoked')
        ORDER BY l.updated_at DESC LIMIT 1`
    )
    .bind(accountId)
    .first<{ id: string; type: string }>();
}
