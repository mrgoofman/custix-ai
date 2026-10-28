import { betterAuth } from "better-auth";
import { getAsyncLocalStorage } from "@better-auth/core/async_hooks";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";
import type { PartnerId } from "@/lib/partners";
import { startTrialForNewAccount } from "@/lib/trial";

/*
 * Workers-Falle in better-auth < 1.7.8 (gefunden 15.10.2026):
 * `@better-auth/core/async_hooks` legt beim Laden ein Promise auf Modulebene an
 * (`import("node:async_hooks")`), auf das jede Datenbank-Transaktion wartet.
 * Auf Workers gehört es zu dem Request, der das Modul zuerst lädt. Endet der,
 * bevor der Import fertig ist – etwa ein CORS-Preflight, der sofort 204 liefert –,
 * verwirft workerd die Fortsetzung (Flag handle_cross_request_promise_resolution).
 * Das Promise wird nie erfüllt, und jede Registrierung und Anmeldung in diesem
 * Isolat hängt ohne Antwort. Deshalb hält der ladende Request per waitUntil
 * durch, bis Better Auth bereit ist.
 *
 * @better-auth/core steht exakt auf derselben Version wie better-auth in
 * package.json, damit es dasselbe Modul ist. Ab better-auth 1.7.8 gibt es das
 * Modul-Promise nicht mehr – dann fällt dieser Block samt Abhängigkeit weg.
 */
const betterAuthReady = getAsyncLocalStorage().then(
  () => true,
  () => false,
);
try {
  getCloudflareContext().ctx.waitUntil(betterAuthReady);
} catch {
  // Kein Request (Build, Prerender) – nichts festzuhalten.
}

/** Ist Better Auth in diesem Isolat nach spätestens `ms` bereit? */
export async function betterAuthReadyWithin(ms: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), ms);
  });
  try {
    return await Promise.race([betterAuthReady, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Per-request Better Auth instance. MUST be constructed inside a request — the D1
 * binding (env.DB) does not exist at module top-level on Workers (see research /
 * ADR-0006). Better Auth ≥1.5 has a native D1 driver: pass the binding directly.
 *
 * `stampPartner`: nur für /api/partner/signup (ADR-0011). Schreibt die
 * Partner-Zuordnung im selben INSERT wie das Konto – `partner` ist per
 * `input: false` für jede Eingabe gesperrt, auch serverseitig, und ein
 * nachgeschobenes UPDATE könnte zwischen Konto und Markierung scheitern.
 *
 * Nach jedem neuen Konto legt der Create-Hook die 14-Tage-Testlizenz an und
 * bindet sie ans Konto (ADR-0012) – für jede Registrierung, ob über /konto,
 * die Web-App, die Desktop-App oder ein Partnerformular. Better Auth führt ihn
 * aus, bevor die Registrierung antwortet; Fehler fängt er selbst ab.
 */
export function getAuth(opts: { stampPartner?: PartnerId } = {}) {
  const { env } = getCloudflareContext();
  const { stampPartner } = opts;

  return betterAuth({
    database: env.DB, // native D1 driver (better-auth >=1.5)
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? "https://custix.ai",
    // Long-lived session for the desktop app: log in once, valid ~400 days.
    // NOTE: do NOT exceed the browser cookie Max-Age ceiling (400 days). A larger
    // value (we tried 10y) makes session refresh emit an over-limit Max-Age and
    // 500s ALL sign-in/sign-up — see better-auth issue #9609. 400d-10s is the
    // verified safe maximum; the License (revocable, checked monthly) is the real
    // access control, not session length.
    session: {
      expiresIn: 400 * 86400 - 10, // ~400 days (just under the cookie ceiling)
      updateAge: 7 * 86400, // refresh weekly — comfortably inside the window
    },
    // Company name captured at in-app registration (required in the LicenseGate),
    // stored on the user row (migration 0003). Lets the admin see the registrant's
    // firm and confirms a business, not a private individual.
    user: {
      additionalFields: {
        company: { type: "string", required: false, input: true },
        // Partner-Zuordnung (migration 0005, ADR-0011): wird nie aus einer
        // Eingabe übernommen, nur über den Hook unten gesetzt.
        partner: { type: "string", required: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          ...(stampPartner
            ? {
                before: async (user: Record<string, unknown>) => ({
                  data: { ...user, partner: stampPartner },
                }),
              }
            : {}),
          after: async (user, context) => {
            const u = user as typeof user & {
              company?: string | null;
              partner?: string | null;
            };
            await startTrialForNewAccount(
              u,
              context?.headers ?? context?.request?.headers ?? null,
            );
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      // Password reset via Resend. The {url} is the tokenized reset link Better
      // Auth generates; we just deliver it. Failures are logged, not thrown.
      sendResetPassword: async ({ user, url }) => {
        const apiKey = (env as { RESEND_API_KEY?: string }).RESEND_API_KEY;
        if (!apiKey) {
          console.error("sendResetPassword: RESEND_API_KEY missing");
          return;
        }
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: "custix.ai <info@custix.ai>",
          to: user.email,
          subject: "custix — Passwort zurücksetzen / Reset your password",
          html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:520px;width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;"><img src="https://custix.ai/logo-custix.png" alt="custix.ai" width="120"></td></tr>
<tr><td style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
<p style="margin:0 0 24px;font-size:16px;color:#475569;">Klicken Sie auf den Button, um Ihr Passwort zurückzusetzen. / Click the button to reset your password.</p>
<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;"><tr><td align="center">
<a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:8px;">Passwort zurücksetzen / Reset password</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#94a3b8;">Wenn Sie das nicht angefordert haben, ignorieren Sie diese E-Mail. / If you didn't request this, ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`.trim(),
        });
      },
    },
  });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  /** Partner-Zuordnung (ADR-0011); null = direkt registriert. */
  partner: string | null;
}

/**
 * Resolve the logged-in user (Better Auth) for a request, or null.
 * Returns the Better Auth user id used as License.account_id and admin_role.user_id.
 */
export async function getSessionUser(
  request: Request
): Promise<SessionUser | null> {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const u = session.user as {
    id: string;
    email: string;
    name?: string;
    company?: string;
    partner?: string | null;
  };
  return {
    id: u.id,
    email: u.email,
    // Name und Firma werden bei der Registrierung erfasst; ohne sie landet die
    // E-Mail-Anrede bei der Adresse und der PII-Eintrag bliebe unvollständig.
    name: u.name ?? null,
    company: u.company ?? null,
    partner: u.partner ?? null,
  };
}
