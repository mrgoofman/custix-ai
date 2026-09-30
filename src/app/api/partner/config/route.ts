import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resolvePartnerRequest, partnerPreflight } from "@/lib/partners";
import { fetchLatestRelease, installerUrl } from "@/lib/release";

/** Plattformen, die das Partnerformular anbietet (Desktop, ADR-0011). */
const PARTNER_PLATFORMS = ["windows-x86_64", "darwin-aarch64", "darwin-x86_64"];

/**
 * Alles, was `/partner/signup.js` vor dem Anzeigen braucht, in einer Anfrage:
 * ob das Formular aktiv ist, den Turnstile-Site-Key und die aktuellen
 * Installer-Links. Die Links kommen live aus dem Release-Manifest, damit die
 * Partnerseite nach einem Release nicht auf eine alte Version zeigt.
 *
 *   GET /api/partner/config?partner=finditoo
 *
 * Fehler gehen mit `Access-Control-Allow-Origin: *` hinaus: Sie enthalten
 * nichts Schützenswertes, und nur so kann das Formular auf einer noch nicht
 * freigeschalteten Seite (z. B. Staging) „nicht freigeschaltet“ sagen statt
 * „keine Verbindung“.
 */
export async function GET(request: Request) {
  const { env } = getCloudflareContext();
  const readable = { "Access-Control-Allow-Origin": "*" };
  const req = resolvePartnerRequest(request, env.PARTNER_DEV_ORIGINS);
  if (!req)
    return NextResponse.json(
      { error: "unknown_partner" },
      { status: 404, headers: readable },
    );
  // Die Vorschau auf custix.ai selbst (custix.ai/finditoo/) liest die Daten
  // für ihr Demo-Formular mit. Gleicher Ursprung schickt kein `Origin`, daher
  // `Sec-Fetch-Site`. Registrieren kann sie nicht: `enabled` bleibt false, und
  // /api/partner/signup nimmt custix.ai nicht als Partner-Ursprung an.
  const sameOrigin = request.headers.get("sec-fetch-site") === "same-origin";
  if (!req.allowed && !sameOrigin)
    return NextResponse.json(
      { error: "origin_not_allowed" },
      { status: 403, headers: readable },
    );

  const siteKey = env.TURNSTILE_SITE_KEY || null;
  const enabled =
    req.allowed &&
    (req.partner.enabled || req.isDev) &&
    siteKey != null &&
    Boolean(env.TURNSTILE_SECRET_KEY);

  const release = await fetchLatestRelease();
  const downloads = release
    ? PARTNER_PLATFORMS.flatMap((platform) => {
        const url = installerUrl(release, platform);
        return url ? [{ platform, url }] : [];
      })
    : [];

  return NextResponse.json(
    {
      enabled,
      partnerName: req.partner.name,
      siteKey: enabled ? siteKey : null,
      version: release?.version ?? null,
      downloads,
    },
    {
      headers: {
        ...req.headers,
        // Kurz, damit ein Go-live oder ein Release schnell ankommt.
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

export async function OPTIONS(request: Request) {
  return partnerPreflight(request, getCloudflareContext().env.PARTNER_DEV_ORIGINS);
}
