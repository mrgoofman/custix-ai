import { betterAuth } from "better-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";

/**
 * Per-request Better Auth instance. MUST be constructed inside a request — the D1
 * binding (env.DB) does not exist at module top-level on Workers (see research /
 * ADR-0006). Better Auth ≥1.5 has a native D1 driver: pass the binding directly.
 */
export function getAuth() {
  const { env } = getCloudflareContext();

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
          from: "custix.ai <noreply@custix.ai>",
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

/**
 * Resolve the logged-in user (Better Auth) for a request, or null.
 * Returns the Better Auth user id used as License.account_id and admin_role.user_id.
 */
export async function getSessionUser(
  request: Request
): Promise<{ id: string; email: string } | null> {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email };
}
