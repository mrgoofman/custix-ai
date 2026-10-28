import { NextResponse } from "next/server";
import { getDb, nowEpoch } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canonicalizeLicenseKey, newId } from "@/lib/license-key";
import { entitlementOf, epochToIsoDate } from "@/lib/entitlement";

/**
 * License validation — the desktop app's lifelong contract (ADR-0002).
 * Auth-gated: the caller's identity (:caller) and time (:now) are ALWAYS
 * server-supplied, never from the client. Response is the frozen shape:
 * { valid, type, status, expires, grace_until, message_key }.
 *
 * Resilience rule (enforced app-side, ADR-0002): the app treats any network
 * failure / non-200 as "keep working until grace_until", NEVER as invalid.
 * Only an explicit valid:false locks the app.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      // No session: the app must be logged in (ADR-0003). 401 is NOT "invalid".
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = (await request.json()) as { key?: string; version?: string };
    if (!body.key) {
      return NextResponse.json({ error: "missing key" }, { status: 400 });
    }

    const db = getDb();
    const key = canonicalizeLicenseKey(body.key);
    const now = nowEpoch();
    const caller = user.id;
    const ip = request.headers.get("cf-connecting-ip") ?? null;
    const version = body.version ?? null;

    const row = await db
      .prepare(
        `SELECT id, type, status, account_id, expires_at, grace_seconds, subscription_status
           FROM license WHERE license_key = ?`
      )
      .bind(key)
      .first<{
        id: string;
        type: string;
        status: string;
        account_id: string | null;
        expires_at: number | null;
        grace_seconds: number;
        subscription_status: string | null;
      }>();

    if (!row) {
      return NextResponse.json({ valid: false, message_key: "license.unknown" });
    }

    // Entitlement decision — arm order is load-bearing (see docs/schema).
    // Ownership first (ADR-0003), then the shared rule in lib/entitlement.ts,
    // which /api/license/mine uses for the web app too (ADR-0012).
    const { graceUntil, ...decision } = entitlementOf(row, now);
    let valid = false;
    let messageKey: string;
    if (row.account_id == null) {
      messageKey = "license.not_claimed";
    } else if (row.account_id !== caller) {
      messageKey = "license.claimed_elsewhere";
    } else {
      ({ valid, messageKey } = decision);
    }

    // Telemetry + per-check-in event — ONLY for the legitimate owner, and NEVER
    // mutating billing status (webhooks own that).
    if (row.account_id === caller) {
      await db.batch([
        db
          .prepare(
            "UPDATE license SET last_validated_at = ?, last_seen_ip = ?, last_seen_version = ?, updated_at = ? WHERE id = ?"
          )
          .bind(now, ip, version, now, row.id),
        db
          .prepare(
            "INSERT INTO license_event (id, license_id, actor_user_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'validated', ?, ?)"
          )
          .bind(newId(), row.id, caller, JSON.stringify({ ip, version }), now),
      ]);
    }

    return NextResponse.json({
      valid,
      type: row.type,
      status: row.status,
      expires: row.expires_at == null ? null : epochToIsoDate(row.expires_at),
      grace_until: graceUntil == null ? null : epochToIsoDate(graceUntil),
      message_key: messageKey,
    });
  } catch (error) {
    console.error("License validate error:", error);
    // Server error is NOT a license decision — return 500 so the app applies the
    // resilience rule (keep working until grace), rather than locking the user out.
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
