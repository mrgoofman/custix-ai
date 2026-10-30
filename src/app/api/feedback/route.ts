import { NextResponse } from "next/server";
import { getDb, getFeedbackBucket, nowEpoch } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { FeedbackInputError, insertFeedback, parseFeedbackRequest } from "@/lib/feedback";

/**
 * Feedback aus der App (Web und Desktop), Vertrag mit znerol74/custix#65,
 * Speicherung und Löschung: ADR-0014.
 *
 * Angemeldet über die Better-Auth-Sitzung (Cookie), wie bisher: Konto und
 * E-Mail kommen aus der Sitzung, nie aus dem Body.
 *
 * Body (JSON oder multipart/form-data):
 *   description  Text ≤ 4000 Zeichen (länger wird gekürzt)
 *   screenshot?  PNG oder WebP ≤ 2 MB: Base64 (auch Data-URL) oder Datei-Teil
 *   context?     { platform: "web"|"desktop-mac"|"desktop-win", screen,
 *                  viewport: { w, h }, appVersion }; im Multipart als JSON-Text
 *   rating?      1..5, nur ältere Desktop-Versionen; dann darf `description`
 *                fehlen. Alte Clients senden `comment` statt `description` und
 *                `appVersion` auf oberster Ebene, beides wird angenommen.
 *
 * Antwort 200: { ok: true, id, has_screenshot }
 * Fehler: 401 unauthorized · 400 description_required | rating_invalid |
 * invalid_body | screenshot_invalid_base64 · 413 payload_too_large |
 * screenshot_too_large · 415 screenshot_unsupported_type · 429 too_many_requests
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const submission = await parseFeedbackRequest(request);
    const saved = await insertFeedback(
      getDb(),
      getFeedbackBucket(),
      { id: user.id, email: user.email },
      submission,
      nowEpoch(),
    );
    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    if (error instanceof FeedbackInputError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("feedback error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
