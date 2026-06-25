import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/**
 * Beta WAITLIST capture (Phase 1). Replaces the legacy self-serve download flow:
 * no download link is emitted — access is granted only when an admin approves the
 * entry and issues a License key. See CONTEXT.md (Waitlist entry migration note).
 *
 * Writes PII into `person` (the PII vault, ADR-0008) and workflow state into
 * `waitlist_entry`. Re-submission by an existing email updates the person's details
 * and leaves the existing pending entry in place.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, profession, businessConfirmed, locale } = body as {
      name?: string;
      email?: string;
      profession?: string;
      businessConfirmed?: boolean;
      locale?: string;
    };

    if (!name || !email || !profession) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // The AGB apply to businesses only (§ 1) — require the entrepreneur + terms
    // confirmation server-side too, not just via the form checkbox.
    if (businessConfirmed !== true) {
      return NextResponse.json({ error: "Business confirmation required" }, { status: 400 });
    }

    const db = getDb();
    const loc = locale === "en" ? "en" : "de";
    const now = nowEpoch();

    // Upsert the person by email (ux_person_email is UNIQUE where email IS NOT NULL).
    const existing = await db
      .prepare("SELECT id FROM person WHERE email = ?")
      .bind(email)
      .first<{ id: string }>();

    // A repeat request from a known email is a NO-OP: do nothing server-side
    // (no duplicate entry, no PII overwrite, no second email, no funnel event)
    // and return the same neutral "thanks" so the frontend popup looks identical.
    // This covers every existing-status case (pending = already requested;
    // approved = already has access — must NOT get a "you're on the waitlist"
    // mail; rejected = stays rejected) and avoids leaking status by email.
    if (existing) {
      return NextResponse.json({ success: true });
    }

    // Genuinely new email -> create person + waitlist entry and send the
    // confirmation mail. Guard the race where two simultaneous new-email
    // requests both pass the check above: the ux_person_email UNIQUE index makes
    // the loser's INSERT throw -> treat as "already exists" and no-op.
    const personId = newId();
    try {
      await db
        .prepare(
          "INSERT INTO person (id, email, name, profession, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(personId, email, name, profession, loc, now, now)
        .run();
    } catch (e) {
      if (/UNIQUE/i.test(String((e as Error)?.message ?? e))) {
        return NextResponse.json({ success: true });
      }
      throw e;
    }

    const waitlistId = newId();
    await db
      .prepare(
        "INSERT INTO waitlist_entry (id, person_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?)"
      )
      .bind(waitlistId, personId, now, now)
      .run();

    // Funnel event.
    await db
      .prepare(
        "INSERT INTO license_event (id, waitlist_id, event_type, metadata, created_at) VALUES (?, ?, 'email_sent', ?, ?)"
      )
      .bind(newId(), waitlistId, JSON.stringify({ kind: "waitlist_confirmation", profession, businessConfirmed: true, termsAcceptedAt: now }), now)
      .run();

    // Confirmation email — "we'll be in touch", NOT a download link.
    const resend = getResend();
    const isDE = loc === "de";
    await resend?.emails.send({
      from: "custix.ai <noreply@custix.ai>",
      to: email,
      subject: isDE ? "Ihre Anfrage für den custix Beta-Zugang" : "Your custix beta access request",
      html: buildWaitlistEmailHtml(name, loc),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildWaitlistEmailHtml(name: string, locale: string): string {
  const isDE = locale === "de";
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8fafc;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" style="max-width:560px;width:100%;border-collapse:collapse;">
        <tr><td align="center" style="padding-bottom:32px;">
          <img src="https://custix.ai/logo-custix.png" alt="custix.ai" width="120" style="display:block;">
        </td></tr>
        <tr><td style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#1e293b;">
            ${isDE ? `Guten Tag ${name},` : `Hello ${name},`}
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#475569;">
            ${
              isDE
                ? "vielen Dank für Ihr Interesse an custix. Wir befinden uns aktuell in einer geschlossenen Beta-Phase. Wir haben Ihre Anfrage erhalten und melden uns bei Ihnen, sobald wir Ihnen einen Zugang freischalten können."
                : "thank you for your interest in custix. We are currently in a closed beta phase. We have received your request and will get in touch as soon as we can grant you access."
            }
          </p>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#1e293b;">
            ${isDE ? "Mit freundlichen Grüßen," : "Best regards,"}<br>
            ${isDE ? "Das custix.ai Team" : "The custix.ai Team"}
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">
            custix.ai – ${isDE ? "Dokumente anonymisieren. KI sicher nutzen." : "Anonymize documents. Use AI safely."}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}
