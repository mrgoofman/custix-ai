import { NextResponse } from "next/server";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";
import { getSessionUser } from "@/lib/auth";

/**
 * In-app feedback intake (called from the desktop app). Authenticated via the
 * Better Auth session cookie the app already holds — the user's email is taken
 * from the session, NOT trusted from the body. Stores a 1-5 rating + optional
 * comment + app version; shown in the admin panel.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      rating?: number;
      comment?: string;
      appVersion?: string;
    };

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
    }
    // Trim + cap the free text so a runaway client can't write huge rows.
    const comment = (body.comment ?? "").trim().slice(0, 4000) || null;
    const appVersion = (body.appVersion ?? "").trim().slice(0, 32) || null;

    const db = getDb();
    await db
      .prepare(
        "INSERT INTO feedback (id, user_email, rating, comment, app_version, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(newId(), user.email, rating, comment, appVersion, nowEpoch())
      .run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("feedback error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
