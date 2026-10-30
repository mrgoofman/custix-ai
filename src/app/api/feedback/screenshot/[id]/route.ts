import { NextResponse } from "next/server";
import { getDb, getFeedbackBucket } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Screenshot eines Feedback-Eintrags (ADR-0014). Nur für den Eigentümer
 * (`feedback.user_id` = Konto der Sitzung) und Admins; ohne Anmeldung nie.
 * Weder Browser noch Cloudflare dürfen das Bild zwischenspeichern.
 *
 * 200 Bild (image/png | image/webp) · 401 unauthorized · 403 forbidden ·
 * 404 not_found (kein Eintrag, kein Bild oder schon gelöscht)
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
    }

    const { id } = await params;
    const row = await getDb()
      .prepare("SELECT user_id, screenshot_key FROM feedback WHERE id = ?")
      .bind(id)
      .first<{ user_id: string | null; screenshot_key: string | null }>();
    if (!row?.screenshot_key) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    }
    if (row.user_id !== user.id && !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
    }

    const bucket = getFeedbackBucket();
    const obj = bucket ? await bucket.get(row.screenshot_key) : null;
    if (!obj) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    }

    return new Response(await obj.arrayBuffer(), {
      headers: {
        ...NO_STORE,
        "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("feedback screenshot error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500, headers: NO_STORE });
  }
}
