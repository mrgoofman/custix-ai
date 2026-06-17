import { NextResponse } from "next/server";
import { getDb, nowEpoch } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canonicalizeLicenseKey, newId } from "@/lib/license-key";

/**
 * First-entry key claim (ADR-0003). The logged-in caller binds an UNBOUND key to
 * their Account. Race-safe via a conditional UPDATE (compare-and-swap on
 * account_id IS NULL); D1 is single-writer so exactly one concurrent claim wins.
 * Three outcomes (see docs/schema): success / already_have_license / disambiguate.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const body = (await request.json()) as { key?: string };
    if (!body.key) {
      return NextResponse.json({ ok: false, error: "missing key" }, { status: 400 });
    }

    const db = getDb();
    const key = canonicalizeLicenseKey(body.key);
    const caller = user.id;
    const now = nowEpoch();

    // STEP 1: atomic compare-and-swap — only an unbound, non-revoked key binds.
    let changes = 0;
    try {
      const res = await db
        .prepare(
          "UPDATE license SET account_id = ?, claimed_at = ?, updated_at = ? WHERE license_key = ? AND account_id IS NULL AND status <> 'revoked'"
        )
        .bind(caller, now, now, key)
        .run();
      changes = res.meta.changes ?? 0;
    } catch (e) {
      // UNIQUE on ux_license_account => caller already owns a different license.
      const msg = String((e as Error)?.message ?? e);
      if (/UNIQUE|constraint/i.test(msg)) {
        return NextResponse.json({ ok: false, message_key: "license.already_have_license" });
      }
      throw e;
    }

    if (changes === 1) {
      const lic = await db
        .prepare("SELECT id FROM license WHERE license_key = ?")
        .bind(key)
        .first<{ id: string }>();
      if (lic) {
        await db
          .prepare(
            "INSERT INTO license_event (id, license_id, actor_user_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'claimed', NULL, ?)"
          )
          .bind(newId(), lic.id, caller, now)
          .run();
      }
      return NextResponse.json({ ok: true });
    }

    // STEP 2: changes === 0 — disambiguate.
    const row = await db
      .prepare("SELECT id, account_id, status FROM license WHERE license_key = ?")
      .bind(key)
      .first<{ id: string; account_id: string | null; status: string }>();

    if (!row) {
      return NextResponse.json({ ok: false, message_key: "license.unknown" });
    }
    if (row.status === "revoked") {
      return NextResponse.json({ ok: false, message_key: "license.revoked" });
    }
    if (row.account_id === caller) {
      // Idempotent: already mine.
      return NextResponse.json({ ok: true });
    }
    // Claimed by someone else.
    await db
      .prepare(
        "INSERT INTO license_event (id, license_id, actor_user_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'claim_refused', ?, ?)"
      )
      .bind(newId(), row.id, caller, JSON.stringify({ reason: "claimed_elsewhere" }), now)
      .run();
    return NextResponse.json({ ok: false, message_key: "license.claimed_elsewhere" });
  } catch (error) {
    console.error("License claim error:", error);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
