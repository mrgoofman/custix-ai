import { NextResponse } from "next/server";
import { getDb, nowEpoch, findLicenseForAccount } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateLicenseKey, newId } from "@/lib/license-key";
import { sendKeyEmail } from "@/lib/admin-actions";
import { GRACE, TRIAL_DAYS } from "@/lib/license-policy";

/**
 * Startet die 14-tägige Testphase: Lizenz mit type='trial' und
 * expires_at = jetzt + 14 Tage, gebunden an das angemeldete Konto.
 *
 * Die Sperre danach braucht keinen eigenen Code – /api/license/validate wertet
 * expires_at + grace_seconds aus und liefert danach valid:false.
 */
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = body.locale === "en" ? "en" : "de";

  const db = getDb();
  const now = nowEpoch();

  // Genau eine Testphase pro Konto – auch abgelaufene zählen.
  const existing = await findLicenseForAccount(user.id);
  if (existing) {
    return NextResponse.json(
      {
        error: "already_has_license",
        key: existing.license_key,
        type: existing.type,
      },
      { status: 409 },
    );
  }

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
      return NextResponse.json({ error: "trial_failed" }, { status: 500 });
    }
  }

  await upsertPerson(db, user, locale, now);

  // Schlüssel zusenden – die App fragt ihn beim ersten Start ab. Ein Fehlschlag
  // beim Versand darf die schon angelegte Lizenz nicht entwerten: der Schlüssel
  // steht auch in der Antwort und dauerhaft auf /konto.
  try {
    await sendKeyEmail(user.email, user.name ?? user.email, key, locale, {
      variant: "trial",
      expiresAt,
    });
  } catch (e) {
    console.error("trial key email failed:", e);
  }

  return NextResponse.json({ key, type: "trial", expires_at: expiresAt });
}

/**
 * PII gehört in den person-Vault, nicht nur auf die Better-Auth-Zeile (ADR-0008):
 * anonymizePerson() räumt ausschließlich dort auf. Ohne diesen Eintrag lägen
 * Selbstregistrierte außerhalb des Löschpfads.
 */
async function upsertPerson(
  db: ReturnType<typeof getDb>,
  user: {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
  },
  locale: string,
  now: number,
) {
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
