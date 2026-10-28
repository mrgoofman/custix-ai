import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isAPIError } from "better-auth/api";
import { getAuth, betterAuthReadyWithin } from "@/lib/auth";
import { findLicenseForAccount } from "@/lib/db";
import { readSignupToken } from "@/lib/signup-token";
import { isSameOrigin } from "@/lib/signup";
import {
  SIGNUP_MAX_COMPANY,
  SIGNUP_MAX_PASSWORD,
  SIGNUP_MIN_PASSWORD,
} from "@/lib/signup-rules";

/**
 * Letzter Schritt der Registrierung „E-Mail zuerst“ (mrgoofman/custix-ai#15,
 * ADR-0013): Link aus der Mail + gewähltes Passwort → Konto anlegen und
 * anmelden.
 *
 * Angelegt wird über Better Auths eigenes signUpEmail – derselbe Weg wie jede
 * andere Registrierung. Damit läuft auch derselbe Create-Hook (lib/auth.ts):
 * Er legt die 14-Tage-Testlizenz an und bindet sie ans Konto (ADR-0012).
 * `confirmedSignup` sorgt dafür, dass das Konto als bestätigt angelegt wird
 * und keine Willkommens-Mail hinausgeht – die Bestätigungs-Mail war schon die
 * eine Mail dieser Registrierung.
 *
 *   POST /api/signup/complete  { token, password, company? }
 *
 * 200 { ok: true, trialEndsAt } + Sitzungscookie
 * 400 { error: "invalid_input", field } · 403 forbidden · 409 account_exists
 * 410 invalid_token · 503/500 signup_failed
 */
export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!env.BETTER_AUTH_SECRET)
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });

  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    password?: unknown;
    company?: unknown;
  } | null;

  const data = await readSignupToken(env.BETTER_AUTH_SECRET, body?.token);
  if (!data) return NextResponse.json({ error: "invalid_token" }, { status: 410 });

  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < SIGNUP_MIN_PASSWORD || password.length > SIGNUP_MAX_PASSWORD)
    return NextResponse.json({ error: "invalid_input", field: "password" }, { status: 400 });

  // Optional. Leer → nicht gesetzt (null in der Datenbank).
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  if (company.length > SIGNUP_MAX_COMPANY)
    return NextResponse.json({ error: "invalid_input", field: "company" }, { status: 400 });

  // Hängt ein Isolat doch in Better Auth (Workers-Falle, lib/auth.ts), lieber
  // gleich scheitern als die Seite ohne Antwort warten zu lassen.
  if (!(await betterAuthReadyWithin(3000))) {
    console.error("signup complete: better-auth not ready, isolate stuck");
    return NextResponse.json({ error: "signup_failed" }, { status: 503 });
  }

  let userId: string;
  let setCookies: string[];
  try {
    const { headers, response } = await getAuth({
      confirmedSignup: { email: data.email, locale: data.locale },
    }).api.signUpEmail({
      // Der Name wird nicht mehr abgefragt (#15). Better Auth verlangt das
      // Feld; leer heißt „unbekannt“ (getSessionUser liefert dann null).
      body: { email: data.email, password, name: "", ...(company ? { company } : {}) },
      // Für IP und User-Agent der Sitzung; Better Auth liest daraus nichts
      // anderes. Die Sprache kommt aus dem Token, nicht aus den Headern.
      headers: request.headers,
      returnHeaders: true,
    });
    userId = response.user.id;
    setCookies = headers.getSetCookie();
  } catch (e) {
    if (isAPIError(e)) {
      const code = (e.body as { code?: string } | undefined)?.code;
      if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
        return NextResponse.json({ error: "account_exists" }, { status: 409 });
      if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG")
        return NextResponse.json({ error: "invalid_input", field: "password" }, { status: 400 });
    }
    console.error("signup complete failed:", e);
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }

  // Die Testlizenz hat der Create-Hook angelegt; ihr Ende zeigt die Seite
  // „So funktioniert custix“ – die Willkommens-Mail entfällt auf diesem Weg.
  // Fehlt sie (Hook gescheitert), bietet /konto „Testphase starten“.
  const license = await findLicenseForAccount(userId).catch((e: unknown) => {
    console.error("signup complete: license lookup failed:", e);
    return null;
  });
  console.log(`signup complete: account created, trial ${license ? "bound" : "missing"}`);

  const res = NextResponse.json(
    { ok: true, trialEndsAt: license?.expires_at ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
  for (const cookie of setCookies) res.headers.append("Set-Cookie", cookie);
  return res;
}
