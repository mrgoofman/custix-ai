import { NextResponse } from "next/server";
import { findLicenseForAccount } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * The signed-in account's claimed license (or null). Lets a client restore
 * its key after local storage was lost (web: cleared site data; desktop:
 * reinstall) WITHOUT asking the user to re-enter it — the claim already
 * binds license.account_id to this account, so returning the key to its
 * authenticated owner leaks nothing.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const lic = await findLicenseForAccount(user.id);

  if (!lic) return NextResponse.json({ key: null, desktop_used: false });
  return NextResponse.json({
    key: lic.license_key,
    type: lic.type,
    status: lic.status,
    expires_at: lic.expires_at,
    // Damit das Konto „aktiv" so rechnet wie /api/license/validate:
    // innerhalb von expires_at + Kulanzfrist (CONTEXT.md, „Active").
    grace_seconds: lic.grace_seconds,
    // Läuft die Lizenz schon in der Desktop-App? Nur dann zeigt /konto den
    // Download (mrgoofman/custix-ai#14); neue Konten sehen nur die Web-App.
    desktop_used: lic.last_validated_at != null,
  });
}
