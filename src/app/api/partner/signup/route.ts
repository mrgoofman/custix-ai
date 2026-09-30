import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isAPIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { resolvePartnerRequest, partnerPreflight } from "@/lib/partners";
import { verifyTurnstile } from "@/lib/turnstile";
import { startTrial } from "@/lib/trial";

/**
 * Partner signup (ADR-0011, CONTEXT.md): Das Formular auf der Partnerseite
 * (`/partner/signup.js`) legt hier in einer Anfrage an, was auf /konto zwei
 * Schritte mit Sitzung sind – Konto, 14-Tage-Testlizenz, Testphasen-Mail –
 * und markiert das Konto mit dem Partner.
 *
 * Eine Sitzung entsteht dabei nicht: Das Cookie wäre auf der Partnerseite ein
 * Drittanbieter-Cookie, Safari und Firefox sperren es. Angemeldet wird danach
 * in der Desktop-App.
 *
 *   POST /api/partner/signup?partner=finditoo
 *   { name, company, email, password, turnstileToken }
 *
 * Antworten: 200 { ok, trialStarted, expiresAt } oder { error } mit
 *   400 invalid_input (+ field) · 403 origin_not_allowed | turnstile_failed
 *   409 email_taken · 429 rate_limited · 503 partner_disabled · 500 signup_failed
 */
export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const req = resolvePartnerRequest(request, env.PARTNER_DEV_ORIGINS);
  if (!req)
    return NextResponse.json({ error: "unknown_partner" }, { status: 404 });
  const { partner } = req;

  const reply = (body: object, status = 200) =>
    NextResponse.json(body, { status, headers: req.headers });

  if (!req.allowed) return reply({ error: "origin_not_allowed" }, 403);
  if (!partner.enabled && !req.isDev)
    return reply({ error: "partner_disabled" }, 503);

  const ip = request.headers.get("cf-connecting-ip");

  // Pro IP; eine Kanzlei hinter einem Anschluss registriert selten mehr als
  // fünf Personen in derselben Minute. Fehlt das Binding, läuft es ohne.
  if (env.PARTNER_SIGNUP_LIMITER) {
    const { success } = await env.PARTNER_SIGNUP_LIMITER.limit({
      key: `${partner.id}:${ip ?? "unknown"}`,
    });
    if (!success) return reply({ error: "rate_limited" }, 429);
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    company?: unknown;
    email?: unknown;
    password?: unknown;
    turnstileToken?: unknown;
  } | null;
  if (!body) return reply({ error: "invalid_input" }, 400);

  const name = text(body.name, 200);
  const company = text(body.company, 200);
  const email = text(body.email, 254)?.toLowerCase() ?? null;
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) return reply({ error: "invalid_input", field: "name" }, 400);
  if (!company) return reply({ error: "invalid_input", field: "company" }, 400);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return reply({ error: "invalid_input", field: "email" }, 400);
  // Dieselben Grenzen wie Better Auth (Standard 8–128), damit das Formular
  // den Fehler am Feld zeigen kann statt eines allgemeinen.
  if (password.length < 8 || password.length > 128)
    return reply({ error: "invalid_input", field: "password" }, 400);

  // Herkunft beweisen: Turnstile meldet den Hostnamen, auf dem das Widget
  // gelöst wurde. Testschlüssel (immer „example.com“) nur für die Vorschau.
  const ts = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken, ip);
  if (!ts.ok) {
    if (ts.reason === "not_configured")
      return reply({ error: "partner_disabled" }, 503);
    return reply({ error: "turnstile_failed" }, 403);
  }
  const hostOk = ts.testing
    ? req.isDev
    : partner.hostnames.includes(ts.hostname);
  if (!hostOk) {
    console.warn(`partner ${partner.id}: turnstile hostname ${ts.hostname} rejected`);
    return reply({ error: "turnstile_failed" }, 403);
  }

  // Konto anlegen – die Partner-Zuordnung schreibt der Create-Hook im selben
  // INSERT (lib/auth.ts, `stampPartner`).
  let user: { id: string; email: string; name: string };
  let sessionToken: string | null;
  try {
    const res = await getAuth({ stampPartner: partner.id }).api.signUpEmail({
      body: { email, password, name, company },
    });
    user = res.user;
    sessionToken = res.token;
  } catch (e) {
    if (isAPIError(e)) {
      const code = (e.body as { code?: string } | undefined)?.code;
      if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
        return reply({ error: "email_taken" }, 409);
      if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG")
        return reply({ error: "invalid_input", field: "password" }, 400);
      if (code === "INVALID_EMAIL")
        return reply({ error: "invalid_input", field: "email" }, 400);
    }
    console.error("partner signup failed:", e);
    return reply({ error: "signup_failed" }, 500);
  }

  // signUpEmail meldet serverseitig trotzdem an (autoSignIn). Diese Sitzung
  // hält niemand – das Cookie verlässt den Server nie –, also gleich weg.
  if (sessionToken) {
    await getDb()
      .prepare("DELETE FROM session WHERE token = ?")
      .bind(sessionToken)
      .run()
      .catch((e: unknown) => console.error("partner signup: session cleanup failed:", e));
  }

  // Partner verteilen nur die Desktop-App: Testphasen-Mail ohne Web-App-Hinweis.
  const trial = await startTrial(
    { id: user.id, email: user.email, name: user.name, company },
    "de",
    { showWebApp: false },
  );

  // Scheitert nur die Testphase, steht das Konto trotzdem: Auf /konto lässt
  // sie sich per Knopf nachholen. Das Formular sagt das.
  return reply({
    ok: true,
    trialStarted: trial.ok,
    expiresAt: trial.ok ? trial.expiresAt : null,
  });
}

export async function OPTIONS(request: Request) {
  return partnerPreflight(request, getCloudflareContext().env.PARTNER_DEV_ORIGINS);
}

/** Getrimmter, nicht leerer String mit Höchstlänge – sonst null. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t && t.length <= max ? t : null;
}
