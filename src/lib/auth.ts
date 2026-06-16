import { betterAuth } from "better-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
    emailAndPassword: {
      enabled: true,
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
