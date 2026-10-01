/**
 * Partner-Register (ADR-0011, CONTEXT.md „Partner“).
 *
 * Ein Partner bettet unser Registrierformular (`/partner/signup.js`) in seine
 * eigene Seite ein. Hier steht, von welchen Seiten aus das erlaubt ist – im
 * Code statt in D1, solange es nur eine Handvoll gibt und ein neuer Partner
 * ohnehin einen Deploy braucht (Turnstile-Hostnamen, Übergabe).
 *
 * `origins` steuert CORS, `hostnames` die Herkunftsprüfung: Turnstile meldet
 * serverseitig, auf welchem Hostnamen das Widget gelöst wurde. Erst diese
 * Bestätigung macht ein Konto zu einem Partner-Konto – nicht der Name im
 * Request, den kann jeder hineinschreiben.
 */

export type PartnerId = "finditoo";

export interface Partner {
  id: PartnerId;
  /** Anzeigename, z. B. im Datenschutzhinweis des Formulars. */
  name: string;
  /** Solange `false`, lehnt der Endpunkt ab und das Formular zeigt einen Hinweis. */
  enabled: boolean;
  /** Erlaubte Ursprünge für CORS, exakt (Schema + Host, ohne Pfad). */
  origins: readonly string[];
  /** Hostnamen, die Turnstile für diesen Partner bestätigen darf. */
  hostnames: readonly string[];
  /**
   * Bekommt bei jedem Partner signup eine Mail – ohne personenbezogene Daten
   * (lib/partner-email.ts). Weglassen == keine Benachrichtigung.
   */
  notifyEmail?: string;
}

/**
 * Staging-Domain von finditoo ist noch offen – sobald sie feststeht, unter
 * `origins` und `hostnames` ergänzen und im Turnstile-Widget eintragen.
 */
const PARTNERS: Record<PartnerId, Partner> = {
  finditoo: {
    id: "finditoo",
    name: "finditoo",
    enabled: false,
    origins: [
      "https://www.finditoo-marketing.com",
      "https://finditoo-marketing.com",
    ],
    hostnames: ["www.finditoo-marketing.com", "finditoo-marketing.com"],
    notifyEmail: "info@finditoo.com",
  },
};

/** Alle Partner-IDs, z. B. für den Filter im Admin-Panel. */
export const PARTNER_IDS = Object.keys(PARTNERS) as PartnerId[];

function findPartner(id: string | null): Partner | null {
  return id != null && id in PARTNERS ? PARTNERS[id as PartnerId] : null;
}

/**
 * CORS-Kopfzeilen für die Partner-Endpunkte. Ohne Cookies
 * (`Access-Control-Allow-Credentials` fehlt absichtlich): Über die
 * Domaingrenze entsteht keine Sitzung, das Konto wird serverseitig angelegt.
 */
function corsHeaders(allowedOrigin: string | null): HeadersInit {
  if (!allowedOrigin) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export interface PartnerRequest {
  partner: Partner;
  /** Darf der Ursprung das Formular dieses Partners einbetten? */
  allowed: boolean;
  /**
   * Ursprung der lokalen Vorschau (`.dev.vars`, `PARTNER_DEV_ORIGINS`, steht
   * nie in wrangler.jsonc). Nur hier gilt das Formular auch vor dem Go-live,
   * und nur hier zählen Turnstile-Testschlüssel, die als Hostnamen immer
   * „example.com“ melden.
   */
  isDev: boolean;
  /** CORS-Kopfzeilen für die Antwort (leer außer `Vary`, wenn nicht erlaubt). */
  headers: HeadersInit;
}

/**
 * Partner aus `?partner=` und Ursprung einer Anfrage an `/api/partner/*`
 * einordnen – null bei unbekanntem Partner.
 */
export function resolvePartnerRequest(
  request: Request,
  devOriginsRaw: string | undefined,
): PartnerRequest | null {
  const partner = findPartner(new URL(request.url).searchParams.get("partner"));
  if (!partner) return null;
  const origin = request.headers.get("origin");
  const dev = (devOriginsRaw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isDev = origin != null && dev.includes(origin);
  const allowed = origin != null && (partner.origins.includes(origin) || isDev);
  return { partner, allowed, isDev, headers: corsHeaders(allowed ? origin : null) };
}

/** CORS-Preflight der Partner-Endpunkte. */
export function partnerPreflight(
  request: Request,
  devOriginsRaw: string | undefined,
): Response {
  const req = resolvePartnerRequest(request, devOriginsRaw);
  if (!req) return new Response(null, { status: 404 });
  return new Response(null, {
    status: req.allowed ? 204 : 403,
    headers: req.headers,
  });
}
