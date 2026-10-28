import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";
import { createSignupToken } from "@/lib/signup-token";
import {
  SIGNUP_EMAIL_FROM,
  accountPath,
  renderExistingAccountEmail,
  renderSignupConfirmEmail,
  welcomePath,
} from "@/lib/signup-email";
import {
  accountExists,
  isLocalPreview,
  isSameOrigin,
  normalizeEmail,
  siteBaseUrl,
} from "@/lib/signup";

/**
 * Schritt 1 der Registrierung „E-Mail zuerst“ (mrgoofman/custix-ai#15,
 * ADR-0013): nur E-Mail + Haken bei AGB/Datenschutz. Legt nichts an, schickt
 * genau eine Mail:
 *   - neue Adresse → „Zugang bestätigen“ mit Link auf die Passwort-Seite
 *   - Konto existiert → „Sie haben bereits ein Konto“ mit „Anmelden“
 * Die Antwort ist in beiden Fällen gleich – die Seite verrät nicht, ob eine
 * Adresse registriert ist. „Erneut senden“ ruft dieselbe Route.
 *
 *   POST /api/signup/start  { email, locale, consent: true }
 *
 * Antworten: 200 { ok: true } (lokal ohne Resend zusätzlich `dev`), sonst
 * { error } mit 400 invalid_email | consent_required · 403 forbidden ·
 * 429 rate_limited · 502 send_failed · 500 not_configured
 */
export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    locale?: unknown;
    consent?: unknown;
  } | null;

  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  // Der Haken ist Pflicht – auch serverseitig, sonst entstünde über diese
  // Route ein Konto ohne Zustimmung zu AGB und Datenschutz.
  if (body?.consent !== true)
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  const locale = body?.locale === "en" ? "en" : "de";

  const secret = env.BETTER_AUTH_SECRET;
  if (!secret) {
    console.error("signup start: BETTER_AUTH_SECRET missing");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // Jede Anfrage verschickt eine Mail an eine frei gewählte Adresse – also
  // pro IP und pro Adresse begrenzen. Fehlen die Bindings, läuft es ohne.
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (env.SIGNUP_IP_LIMITER) {
    const { success } = await env.SIGNUP_IP_LIMITER.limit({ key: ip });
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (env.SIGNUP_EMAIL_LIMITER) {
    const { success } = await env.SIGNUP_EMAIL_LIMITER.limit({ key: email });
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const base = siteBaseUrl(env.BETTER_AUTH_URL);
  let exists: boolean;
  try {
    exists = await accountExists(email);
  } catch (e) {
    console.error("signup start: account lookup failed:", e);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  let mail: { subject: string; html: string; text: string };
  let link: string;
  if (exists) {
    link = `${base}${accountPath(locale)}?mode=signin`;
    mail = renderExistingAccountEmail({
      signInUrl: link,
      forgotUrl: `${base}${accountPath(locale)}?mode=forgot`,
      locale,
    });
  } else {
    const token = await createSignupToken(secret, { email, locale });
    link = `${base}${welcomePath(locale)}#token=${token}`;
    mail = renderSignupConfirmEmail({ url: link, locale });
  }

  if (!env.RESEND_API_KEY) {
    // Lokale Vorschau: Link an die Seite zurückgeben und ins Log schreiben,
    // damit sich der Weg ohne Postfach durchklicken lässt. Live nie.
    if (isLocalPreview(request, env.RESEND_API_KEY)) {
      console.log(`signup start (lokal, keine Mail): ${mail.subject} → ${link}`);
      return NextResponse.json({ ok: true, dev: { subject: mail.subject, link } });
    }
    console.error("signup start: RESEND_API_KEY missing");
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  const sent = await new Resend(env.RESEND_API_KEY).emails
    .send({
      from: SIGNUP_EMAIL_FROM,
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
    .catch((e: unknown) => ({ error: e }));
  if (sent.error) {
    console.error("signup start: email failed:", sent.error);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  // Ohne Personendaten – nur, welche der beiden Mails hinausging.
  console.log(`signup start: ${exists ? "existing-account" : "confirm"} mail sent`);
  return NextResponse.json({ ok: true });
}
