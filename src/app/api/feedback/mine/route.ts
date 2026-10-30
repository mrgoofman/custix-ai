import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { listOwnFeedback } from "@/lib/feedback";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * „Mein bisheriges Feedback“ (znerol74/custix#65): die eigenen Einträge des
 * angemeldeten Kontos, neueste zuerst, höchstens 50.
 *
 * Antwort 200: [{ id, created_at (Epoch-Sekunden), description, has_screenshot }]
 * Das Vorschaubild holt die App über /api/feedback/screenshot/<id>.
 */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json(await listOwnFeedback(getDb(), user.id), { headers: NO_STORE });
  } catch (error) {
    console.error("feedback mine error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500, headers: NO_STORE });
  }
}
