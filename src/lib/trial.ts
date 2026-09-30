import { getDb, nowEpoch, findLicenseForAccount, type AccountLicense } from "@/lib/db";
import { generateLicenseKey, newId } from "@/lib/license-key";
import { sendKeyEmail } from "@/lib/admin-actions";
import { GRACE, TRIAL_DAYS } from "@/lib/license-policy";
import type { SessionUser } from "@/lib/auth";

export type TrialResult =
  | { ok: true; key: string; expiresAt: number }
  | { ok: false; error: "already_has_license"; existing: AccountLicense }
  | { ok: false; error: "trial_failed" };

/**
 * Startet die 14-tägige Testphase: Lizenz mit type='trial' und
 * expires_at = jetzt + 14 Tage, gebunden an das Konto, dazu der
 * person-Eintrag und die Testphasen-Mail.
 *
 * Gemeinsamer Weg für /konto (`/api/trial/start`, mit Sitzung) und die
 * Partner signup (`/api/partner/signup`, ohne Sitzung – ADR-0011).
 *
 * Die Sperre danach braucht keinen eigenen Code – /api/license/validate wertet
 * expires_at + grace_seconds aus und liefert danach valid:false.
 */
export async function startTrial(
  user: Pick<SessionUser, "id" | "email" | "name" | "company">,
  locale: "de" | "en",
  opts: { showWebApp?: boolean } = {},
): Promise<TrialResult> {
  const db = getDb();
  const now = nowEpoch();

  // Genau eine Testphase pro Konto – auch abgelaufene zählen.
  const existing = await findLicenseForAccount(user.id);
  if (existing) return { ok: false, error: "already_has_license", existing };

  const expiresAt = now + TRIAL_DAYS * 86400;
  let licenseId = newId();
  let key = generateLicenseKey();

  for (let attempt = 0; ; attempt++) {
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO license
               (id, license_key, type, status, expires_at, grace_seconds, account_id, claimed_at, created_at, updated_at)
             VALUES (?, ?, 'trial', 'active', ?, ?, ?, ?, ?, ?)`,
          )
          .bind(licenseId, key, expiresAt, GRACE.trial, user.id, now, now, now),
        db
          // 'claimed', nicht 'issued': license_event.event_type ist per CHECK auf
          // eine feste Liste begrenzt, in der 'issued' nicht vorkommt. Inhaltlich
          // passt es auch – die Lizenz wird hier zugleich angelegt und dem Konto
          // zugeordnet (account_id + claimed_at werden gesetzt).
          .prepare(
            "INSERT INTO license_event (id, license_id, actor_user_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'claimed', ?, ?)",
          )
          .bind(
            newId(),
            licenseId,
            user.id,
            JSON.stringify({ trial_days: TRIAL_DAYS }),
            now,
          ),
      ]);
      break;
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (/UNIQUE/i.test(msg) && /license_key/i.test(msg) && attempt < 2) {
        licenseId = newId();
        key = generateLicenseKey();
        continue;
      }
      console.error("trial start failed:", e);
      return { ok: false, error: "trial_failed" };
    }
  }

  await upsertPerson(user, locale, now);

  // Ein Fehlschlag beim Versand darf die schon angelegte Lizenz nicht
  // entwerten: die App holt den Schlüssel nach dem Login selbst
  // (/api/license/mine), und /konto zeigt ihn dauerhaft.
  try {
    await sendKeyEmail(user.email, user.name ?? user.email, key, locale, {
      variant: "trial",
      expiresAt,
      showWebApp: opts.showWebApp,
    });
  } catch (e) {
    console.error("trial key email failed:", e);
  }

  return { ok: true, key, expiresAt };
}

/**
 * PII gehört in den person-Vault, nicht nur auf die Better-Auth-Zeile (ADR-0008):
 * anonymizePerson() räumt ausschließlich dort auf. Ohne diesen Eintrag lägen
 * Selbstregistrierte außerhalb des Löschpfads.
 */
async function upsertPerson(
  user: Pick<SessionUser, "id" | "email" | "name" | "company">,
  locale: string,
  now: number,
) {
  const db = getDb();
  try {
    const existing = await db
      .prepare("SELECT id FROM person WHERE user_id = ? OR email = ? LIMIT 1")
      .bind(user.id, user.email)
      .first<{ id: string }>();

    if (existing) {
      await db
        .prepare(
          "UPDATE person SET user_id = ?, name = COALESCE(?, name), company = COALESCE(?, company), locale = ?, updated_at = ? WHERE id = ?",
        )
        .bind(user.id, user.name, user.company, locale, now, existing.id)
        .run();
      return;
    }

    await db
      .prepare(
        "INSERT INTO person (id, email, name, company, locale, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        newId(),
        user.email,
        user.name,
        user.company,
        locale,
        user.id,
        now,
        now,
      )
      .run();
  } catch (e) {
    // Der Vault-Eintrag darf die Testphase nicht scheitern lassen; er wird beim
    // nächsten Aufruf nachgeholt.
    console.error("person upsert failed:", e);
  }
}
