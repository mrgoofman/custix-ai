import { getDb } from "@/lib/db";

/**
 * Gemeinsames der drei Routen unter /api/signup (Registrierung „E-Mail
 * zuerst“, mrgoofman/custix-ai#15, ADR-0013). Bewusst ohne Better Auth: Nur
 * /api/signup/complete legt das Konto an und lädt dafür lib/auth.ts.
 */

/** Wie Better Auth: getrimmt, kleingeschrieben, plausible Form, höchstens 254 Zeichen. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/**
 * Nur Aufrufe von unserer eigenen Seite. Browser schicken bei POST immer
 * einen Origin-Header; fehlt er (Server, curl), gilt der Aufruf als eigen –
 * Schutz gegen Missbrauch geben Token und Ratenbegrenzung, nicht dieser Test.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/**
 * Lokale Vorschau (`wrangler dev`): nur dort und nur ohne RESEND_API_KEY gibt
 * /api/signup/start den Link aus der Mail an die Seite zurück, damit sich der
 * Weg ohne Postfach durchklicken lässt. Live ist der Host custix.ai (bzw.
 * workers.dev) und der Schlüssel gesetzt – beide Bedingungen schließen das aus.
 */
export function isLocalPreview(request: Request, resendKey: string | undefined): boolean {
  if (resendKey) return false;
  try {
    const host = new URL(request.url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
  } catch {
    return false;
  }
}

/** Gibt es für die Adresse schon ein Konto? (Better Auth speichert kleingeschrieben.) */
export async function accountExists(email: string): Promise<boolean> {
  const row = await getDb()
    .prepare('SELECT 1 AS hit FROM "user" WHERE email = ? LIMIT 1')
    .bind(email)
    .first<{ hit: number }>();
  return !!row;
}

/** Basis für Links in Mails: dort, wo Better Auth das Sitzungscookie setzt. */
export function siteBaseUrl(authUrl: string | undefined): string {
  return (authUrl || "https://custix.ai").replace(/\/$/, "");
}
