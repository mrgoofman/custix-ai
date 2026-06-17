import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/** True if the given Better Auth user id has an admin_role row (ADR-0006). */
export async function isAdmin(userId: string): Promise<boolean> {
  const db = getDb();
  const row = await db
    .prepare("SELECT 1 FROM admin_role WHERE user_id = ?")
    .bind(userId)
    .first();
  return row != null;
}

/**
 * Gate for admin endpoints/pages: returns the admin user, or null if not
 * authenticated or not an admin. Callers return 401/403 / redirect accordingly.
 */
export async function requireAdmin(
  request: Request
): Promise<{ id: string; email: string } | null> {
  const user = await getSessionUser(request);
  if (!user) return null;
  return (await isAdmin(user.id)) ? user : null;
}
