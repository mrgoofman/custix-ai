import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readSignupToken } from "@/lib/signup-token";
import { accountExists, isSameOrigin } from "@/lib/signup";

/**
 * Die Passwort-Seite fragt beim Öffnen, wofür der Link aus der Mail gilt
 * (mrgoofman/custix-ai#15). Verbraucht nichts – E-Mail-Programme, die Links
 * vorab aufrufen (z. B. Microsoft „Safe Links“), können ihn nicht entwerten.
 * Angelegt wird erst mit dem Passwort (/api/signup/complete).
 *
 *   POST /api/signup/check  { token }
 *
 * 200 { status: "new", email } – Passwort wählen
 * 200 { status: "exists" }     – Konto gibt es schon (Link schon benutzt)
 * 410 { error: "invalid_token" } – abgelaufen oder ungültig
 *
 * POST statt GET, damit das Token in keiner URL und keinem Log steht. Ob ein
 * Konto existiert, erfährt nur, wer den Link aus dem Postfach hat.
 */
export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!env.BETTER_AUTH_SECRET)
    return NextResponse.json({ error: "not_configured" }, { status: 500 });

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const data = await readSignupToken(env.BETTER_AUTH_SECRET, body?.token);
  if (!data) return NextResponse.json({ error: "invalid_token" }, { status: 410 });

  try {
    if (await accountExists(data.email))
      return NextResponse.json({ status: "exists" }, noStore);
  } catch (e) {
    console.error("signup check: account lookup failed:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ status: "new", email: data.email }, noStore);
}

const noStore = { headers: { "Cache-Control": "no-store" } };
