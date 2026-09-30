/**
 * Cloudflare Turnstile serverseitig prüfen (siteverify).
 *
 * Wichtig ist nicht nur `success`, sondern `hostname`: Cloudflare meldet,
 * auf welcher Seite das Widget gelöst wurde. Daran hängt die
 * Partner-Zuordnung (ADR-0011) – Browserangaben wie `Origin` lassen sich
 * außerhalb des Browsers beliebig setzen, das Turnstile-Ergebnis nicht.
 *
 * Testschlüssel (`1x0000…`) liefern immer `hostname: "example.com"` und
 * `metadata.result_with_testing_key: true`; ob das zählt, entscheidet der
 * Aufrufer (nur für die lokale Vorschau).
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; hostname: string; testing: boolean }
  | { ok: false; reason: "not_configured" | "missing_token" | "rejected" | "unreachable" };

export async function verifyTurnstile(
  secret: string | undefined,
  token: unknown,
  ip: string | null,
): Promise<TurnstileResult> {
  if (!secret) return { ok: false, reason: "not_configured" };
  if (typeof token !== "string" || !token) return { ok: false, reason: "missing_token" };

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    const data = (await res.json()) as {
      success?: boolean;
      hostname?: string;
      metadata?: { result_with_testing_key?: boolean };
    };
    if (!data.success || !data.hostname) return { ok: false, reason: "rejected" };
    return {
      ok: true,
      hostname: data.hostname,
      testing: data.metadata?.result_with_testing_key === true,
    };
  } catch (e) {
    console.error("turnstile siteverify failed:", e);
    return { ok: false, reason: "unreachable" };
  }
}
