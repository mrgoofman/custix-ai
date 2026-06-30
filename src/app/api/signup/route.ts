import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";
import { autoApproveWaitlist } from "@/lib/admin-actions";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// Internal address that gets a heads-up for every new beta request so an admin
// knows to issue a license key. Kept here (not env) for now — change in one spot.
const ADMIN_NOTIFY_TO = "lorenz.kutschka74@gmail.com";

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
    const { name, email, company, profession, locale } = body as {
      name?: string;
      email?: string;
      company?: string;
      profession?: string;
      locale?: string;
    };

    // company is required: the AGB apply to businesses only (§ 1), and the
    // company name lets the admin see which firm a registrant belongs to.
    if (!name || !email || !company || !profession) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
          "INSERT INTO person (id, email, name, company, profession, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(personId, email, name, company, profession, loc, now, now)
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
      .bind(newId(), waitlistId, JSON.stringify({ kind: "auto_approved", profession, company }), now)
      .run();

    // Auto-approve: mint a license + email the access key immediately, instead
    // of the old "we'll be in touch" flow. The requester gets their key right
    // away; no manual admin approval needed.
    await autoApproveWaitlist(waitlistId).catch((e) =>
      console.error("signup: auto-approve failed (admin can approve manually):", e)
    );

    // Internal heads-up so an admin sees the new (already-approved) request.
    // Best-effort: a failure here must NOT fail the user's request.
    const resend = getResend();
    try {
      await resend?.emails.send({
        from: "custix.ai <noreply@custix.ai>",
        to: ADMIN_NOTIFY_TO,
        replyTo: email,
        subject: `Beta-Zugang automatisch freigegeben: ${company} (${name})`,
        html: buildAdminNotifyHtml({ name, email, company, profession }),
      });
    } catch (e) {
      console.error("Admin notify email failed (non-fatal):", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Internal notification (German, to the admin) for a new beta request. */
function buildAdminNotifyHtml(d: { name: string; email: string; company: string; profession: string }): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;font-size:14px;color:#64748b;">${label}</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${value}</td></tr>`;
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#f8fafc;">
  <table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" style="max-width:520px;width:100%;border-collapse:collapse;">
      <tr><td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e293b;">Neue Beta-Anfrage – automatisch freigegeben</p>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;">Diese Person hat den Lizenzschlüssel bereits automatisch per E-Mail erhalten. Im Admin-Panel könnt ihr den Zugang bei Bedarf widerrufen.</p>
        <table role="presentation" style="border-collapse:collapse;margin-bottom:24px;">
          ${row("Name", d.name)}
          ${row("Firma", d.company)}
          ${row("E-Mail", d.email)}
          ${row("Beruf", d.profession)}
        </table>
        <a href="https://custix.ai/admin" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">Zum Admin-Panel</a>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`.trim();
}
