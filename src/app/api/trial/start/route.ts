import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { startTrial } from "@/lib/trial";

/**
 * Startet die 14-tägige Testphase für das angemeldete Konto (/konto).
 * Die eigentliche Arbeit liegt in lib/trial.ts – derselbe Weg wie beim
 * Partner signup (CONTEXT.md).
 */
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = body.locale === "en" ? "en" : "de";

  const result = await startTrial(user, locale);

  if (!result.ok && result.error === "already_has_license") {
    return NextResponse.json(
      {
        error: "already_has_license",
        key: result.existing.license_key,
        type: result.existing.type,
      },
      { status: 409 },
    );
  }
  if (!result.ok)
    return NextResponse.json({ error: "trial_failed" }, { status: 500 });

  return NextResponse.json({
    key: result.key,
    type: "trial",
    expires_at: result.expiresAt,
  });
}
