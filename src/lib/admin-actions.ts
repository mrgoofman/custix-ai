import { Resend } from "resend";
import { getDb, nowEpoch } from "@/lib/db";
import { generateLicenseKey, newId } from "@/lib/license-key";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/** Grace seconds by license type/method (CONTEXT policy values). */
const GRACE = { beta: 0, card: 7 * 86400, invoice: 30 * 86400 };

async function audit(
  actorUserId: string,
  action: string,
  fields: { licenseId?: string; waitlistId?: string; personId?: string; detail?: object }
) {
  const db = getDb();
  await db
    .prepare(
      "INSERT INTO admin_event (id, actor_user_id, action, license_id, waitlist_id, subject_person_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      newId(),
      actorUserId,
      action,
      fields.licenseId ?? null,
      fields.waitlistId ?? null,
      fields.personId ?? null,
      fields.detail ? JSON.stringify(fields.detail) : null,
      nowEpoch()
    )
    .run();
}

/**
 * Approve a waitlist entry: mint an open-ended beta License + key, mark approved,
 * audit — then email the key. Mint+commit happens BEFORE the email so an email
 * failure leaves a valid License (resend available), never a half-approved state.
 * Idempotent-ish: refuses if the entry already has an issued license.
 */
export async function approveWaitlist(
  adminUserId: string,
  waitlistId: string
): Promise<{ ok: boolean; key?: string; error?: string }> {
  const db = getDb();
  const now = nowEpoch();

  const entry = await db
    .prepare(
      `SELECT w.id, w.person_id, w.issued_license_id, p.email, p.name, p.locale
         FROM waitlist_entry w JOIN person p ON p.id = w.person_id WHERE w.id = ?`
    )
    .bind(waitlistId)
    .first<{
      id: string;
      person_id: string;
      issued_license_id: string | null;
      email: string | null;
      name: string | null;
      locale: string;
    }>();

  if (!entry) return { ok: false, error: "waitlist entry not found" };
  if (entry.issued_license_id) return { ok: false, error: "already approved" };
  if (!entry.email) return { ok: false, error: "person has no email (anonymized?)" };

  // Generate a collision-free key (retry a couple times against the unique index).
  let licenseId = newId();
  let key = generateLicenseKey();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db.batch([
        db
          .prepare(
            "INSERT INTO license (id, license_key, type, status, expires_at, grace_seconds, issued_by, source_waitlist_id, created_at, updated_at) VALUES (?, ?, 'beta', 'active', NULL, ?, ?, ?, ?, ?)"
          )
          .bind(licenseId, key, GRACE.beta, adminUserId, waitlistId, now, now),
        db
          .prepare(
            "UPDATE waitlist_entry SET status = 'approved', decided_by = ?, decided_at = ?, issued_license_id = ?, updated_at = ? WHERE id = ?"
          )
          .bind(adminUserId, now, licenseId, now, waitlistId),
      ]);
      break;
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (/UNIQUE/i.test(msg) && /license_key/i.test(msg) && attempt < 2) {
        licenseId = newId();
        key = generateLicenseKey();
        continue;
      }
      return { ok: false, error: msg };
    }
  }

  await audit(adminUserId, "waitlist_approved", { waitlistId, personId: entry.person_id, licenseId });
  await audit(adminUserId, "license_issued", { licenseId, waitlistId, personId: entry.person_id });

  // Email the key (after commit). Failure is non-fatal — admin can resend.
  await sendKeyEmail(entry.email, entry.name ?? "", key, entry.locale).catch((e) =>
    console.error("approve: key email failed (resend available):", e)
  );

  return { ok: true, key };
}

/**
 * Issue a beta key directly to an email address — NO prior waitlist entry needed.
 * For when someone asks for access out-of-band and the team just wants to fire a key.
 * Creates/links a person (PII vault), mints an open-ended beta License, emails the key.
 * If the email already has a person, reuses it; if that person already has an issued
 * License via a waitlist entry, still mints a fresh standalone key (a person can be
 * sent a key independent of the waitlist flow).
 */
export async function sendKeyToEmail(
  adminUserId: string,
  email: string,
  name: string,
  locale: string
): Promise<{ ok: boolean; key?: string; error?: string }> {
  const db = getDb();
  const now = nowEpoch();
  const loc = locale === "en" ? "en" : "de";

  if (!email) return { ok: false, error: "email required" };

  // Find or create the person (PII vault).
  let personId: string;
  const existing = await db
    .prepare("SELECT id FROM person WHERE email = ?")
    .bind(email)
    .first<{ id: string }>();
  if (existing) {
    personId = existing.id;
    if (name) {
      await db
        .prepare("UPDATE person SET name = COALESCE(NULLIF(?, ''), name), updated_at = ? WHERE id = ?")
        .bind(name, now, personId)
        .run();
    }
  } else {
    personId = newId();
    await db
      .prepare(
        "INSERT INTO person (id, email, name, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(personId, email, name || null, loc, now, now)
      .run();
  }

  // Mint an open-ended beta license (collision-retry on key).
  let licenseId = newId();
  let key = generateLicenseKey();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db
        .prepare(
          "INSERT INTO license (id, license_key, type, status, expires_at, grace_seconds, issued_by, created_at, updated_at) VALUES (?, ?, 'beta', 'active', NULL, ?, ?, ?, ?)"
        )
        .bind(licenseId, key, GRACE.beta, adminUserId, now, now)
        .run();
      break;
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (/UNIQUE/i.test(msg) && /license_key/i.test(msg) && attempt < 2) {
        licenseId = newId();
        key = generateLicenseKey();
        continue;
      }
      return { ok: false, error: msg };
    }
  }

  await audit(adminUserId, "license_issued", { licenseId, personId, detail: { direct_send: true } });

  await sendKeyEmail(email, name ?? "", key, loc).catch((e) =>
    console.error("sendKeyToEmail: email failed (resend available):", e)
  );

  return { ok: true, key };
}

export async function resendKeyEmail(
  adminUserId: string,
  licenseId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const row = await db
    .prepare(
      `SELECT l.license_key, l.source_waitlist_id, p.email, p.name, p.locale, p.id AS person_id
         FROM license l
         LEFT JOIN waitlist_entry w ON w.id = l.source_waitlist_id
         LEFT JOIN person p ON p.id = w.person_id
        WHERE l.id = ?`
    )
    .bind(licenseId)
    .first<{
      license_key: string;
      source_waitlist_id: string | null;
      email: string | null;
      name: string | null;
      locale: string | null;
      person_id: string | null;
    }>();
  if (!row || !row.email) return { ok: false, error: "no email on file" };
  await sendKeyEmail(row.email, row.name ?? "", row.license_key, row.locale ?? "de");
  await audit(adminUserId, "key_email_resent", { licenseId, personId: row.person_id ?? undefined });
  return { ok: true };
}

export async function rejectWaitlist(adminUserId: string, waitlistId: string) {
  const db = getDb();
  await db
    .prepare(
      "UPDATE waitlist_entry SET status = 'rejected', decided_by = ?, decided_at = ?, updated_at = ? WHERE id = ?"
    )
    .bind(adminUserId, nowEpoch(), nowEpoch(), waitlistId)
    .run();
  await audit(adminUserId, "waitlist_rejected", { waitlistId });
  return { ok: true };
}

/** Revoke: remove access. Clears account_id so the account can claim a replacement. */
export async function revokeLicense(adminUserId: string, licenseId: string, reason?: string) {
  const db = getDb();
  await db
    .prepare(
      "UPDATE license SET status = 'revoked', account_id = NULL, claimed_at = NULL, updated_at = ? WHERE id = ?"
    )
    .bind(nowEpoch(), licenseId)
    .run();
  await audit(adminUserId, "license_revoked", { licenseId, detail: { reason: reason ?? null } });
  return { ok: true };
}

/** Reset claim: unbind the key so it can be re-claimed (rare; mis-claim fix). */
export async function resetClaim(adminUserId: string, licenseId: string, reason?: string) {
  const db = getDb();
  const prev = await db
    .prepare("SELECT account_id FROM license WHERE id = ?")
    .bind(licenseId)
    .first<{ account_id: string | null }>();
  await db
    .prepare(
      "UPDATE license SET account_id = NULL, claimed_at = NULL, updated_at = ? WHERE id = ?"
    )
    .bind(nowEpoch(), licenseId)
    .run();
  await audit(adminUserId, "claim_reset", {
    licenseId,
    detail: { prev_account: prev?.account_id ?? null, reason: reason ?? null },
  });
  return { ok: true };
}

/** GDPR erasure (ADR-0008): anonymize PII in place; License/billing retained. Irreversible. */
export async function anonymizePerson(adminUserId: string, personId: string) {
  const db = getDb();
  await db
    .prepare(
      "UPDATE person SET email = NULL, name = NULL, profession = NULL, anonymized_at = ?, updated_at = ? WHERE id = ?"
    )
    .bind(nowEpoch(), nowEpoch(), personId)
    .run();
  await audit(adminUserId, "person_anonymized", { personId });
  return { ok: true };
}

async function sendKeyEmail(email: string, name: string, key: string, locale: string) {
  const resend = getResend();
  if (!resend) return;
  const isDE = locale === "de";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://custix.ai";
  await resend.emails.send({
    from: "custix.ai <noreply@custix.ai>",
    to: email,
    subject: isDE ? "Ihr custix Beta-Zugang" : "Your custix beta access",
    html: `
<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:560px;width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;"><img src="https://custix.ai/logo-custix.png" alt="custix.ai" width="120"></td></tr>
<tr><td style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
<p style="margin:0 0 24px;font-size:16px;color:#1e293b;">${isDE ? `Guten Tag ${name},` : `Hello ${name},`}</p>
<p style="margin:0 0 24px;font-size:16px;color:#475569;">${
      isDE
        ? "Ihr Beta-Zugang ist freigeschaltet. In zwei Schritten loslegen:"
        : "Your beta access is ready. Get started in two steps:"
    }</p>
<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1e293b;">${isDE ? "1. App herunterladen" : "1. Download the app"}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;"><tr><td align="center">
<a href="${baseUrl}/${isDE ? "" : "en/"}download" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:8px;">${isDE ? "custix herunterladen" : "Download custix"}</a>
</td></tr></table>
<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1e293b;">${isDE ? "2. Konto erstellen und Lizenzschlüssel eingeben" : "2. Create an account and enter your license key"}</p>
<p style="margin:0 0 12px;font-size:14px;color:#475569;">${
      isDE
        ? "Erstellen Sie beim ersten Start ein Konto (E-Mail + Passwort) und geben Sie dann diesen Schlüssel ein:"
        : "On first launch, create an account (email + password), then enter this key:"
    }</p>
<div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;font-family:monospace;font-size:20px;font-weight:700;letter-spacing:1px;color:#1e3a5f;">${key}</div>
<p style="margin:0;font-size:16px;color:#1e293b;">${isDE ? "Mit freundlichen Grüßen," : "Best regards,"}<br>${isDE ? "Das custix.ai Team" : "The custix.ai Team"}</p>
</td></tr></table></td></tr></table></body></html>`.trim(),
  });
}
