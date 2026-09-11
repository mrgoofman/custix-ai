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

  if (!lic) return NextResponse.json({ key: null });
  return NextResponse.json({
    key: lic.license_key,
    type: lic.type,
    status: lic.status,
    expires_at: lic.expires_at,
  });
}
