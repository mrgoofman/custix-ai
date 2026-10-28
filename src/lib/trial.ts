import {
  getDb,
  nowEpoch,
  findLicenseForAccount,
  findRevokedLicenseForAccount,
  type AccountLicense,
} from "@/lib/db";
import { generateLicenseKey, newId } from "@/lib/license-key";
import { sendKeyEmail } from "@/lib/admin-actions";
import { GRACE, TRIAL_DAYS } from "@/lib/license-policy";
import type { SessionUser } from "@/lib/auth";

export type TrialResult =
  | { ok: true; key: string; expiresAt: number }
  | { ok: false; error: "already_has_license"; existing: AccountLicense }
  | { ok: false; error: "revoked" }
  | { ok: false; error: "trial_failed" };

/**
 * Startet die 14-tägige Testphase: Lizenz mit type='trial' und
 * expires_at = jetzt + 14 Tage, sofort an das Konto gebunden (account_id), dazu
 * der person-Eintrag und die Willkommens-Mail. Die Bindung ist der Punkt: Web-
 * und Desktop-App finden die Lizenz über die Anmeldung, ohne Schlüssel
 * (/api/license/mine, ADR-0012).
 *
 * Normalfall ist startTrialForNewAccount() direkt beim Anlegen des Kontos. Von
 * Hand nur noch über /konto (`/api/trial/start`, Knopf „Testphase starten“) –
 * für Konten ohne Lizenz, etwa aus der kostenlosen Web-Phase (ADR-0010).
 *
 * Die Sperre danach braucht keinen eigenen Code – lib/entitlement.ts wertet
 * expires_at + grace_seconds aus, validate und mine liefern danach valid:false.
 */
export async function startTrial(
  user: Pick<SessionUser, "id" | "email" | "name" | "company">,
  locale: "de" | "en",
  opts: {
    variant?: "trial" | "partner";
    /** false: keine Willkommens-Mail (Registrierung „E-Mail zuerst“, #15). */
    sendMail?: boolean;
  } = {},
): Promise<TrialResult> {
  const db = getDb();
  const now = nowEpoch();

  // Genau eine Testphase pro Konto – auch abgelaufene zählen.
  const existing = await findLicenseForAccount(user.id);
  if (existing) return { ok: false, error: "already_has_license", existing };
  // Ein Widerruf löst die Lizenz vom Konto. Eine neue Testphase auf Knopfdruck
  // höbe ihn auf – „Login does NOT restore it“ (CONTEXT.md, „Revoke“).
  if (await findRevokedLicenseForAccount(user.id))
    return { ok: false, error: "revoked" };

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

  // Registrierung „E-Mail zuerst“ (#15): Die Bestätigungs-Mail war schon die
  // eine Mail; das Ende der Testphase zeigt die Seite nach dem Passwort.
  if (opts.sendMail === false) return { ok: true, key, expiresAt };

  // Ein Fehlschlag beim Versand darf die schon angelegte Lizenz nicht
  // entwerten: Die Lizenz hängt am Konto, Web- und Desktop-App finden sie
  // nach dem Login über /api/license/mine.
  try {
    await sendKeyEmail(user.email, user.name ?? user.email, key, locale, {
      variant: opts.variant ?? "trial",
      expiresAt,
    });
  } catch (e) {
    console.error("trial key email failed:", e);
  }

  return { ok: true, key, expiresAt };
}

/**
 * Jede neue Registrierung bekommt sofort ihre Testlizenz – egal wo das Konto
 * entsteht: /konto, Web-App (/app), Desktop-App oder Partnerformular. Läuft als
 * Better-Auth-Hook nach dem Anlegen des Kontos (lib/auth.ts, ADR-0012), also
 * bevor die Antwort auf die Registrierung beim Client ist; die App findet die
 * Lizenz danach über /api/license/mine.
 *
 * Darf die Registrierung nie scheitern lassen: Fehler werden nur geloggt. Fehlt
 * die Lizenz dann, bietet /konto „Testphase starten“ an.
 *
 * Partner-Konten (`user.partner`, ADR-0011) bekommen die Desktop-Variante der
 * Mail, alle anderen die Willkommens-Mail mit der Web-App – außer bei der
 * Registrierung „E-Mail zuerst“ auf der Website (`welcomeMail: false`, #15):
 * Dort war die Bestätigungs-Mail schon die eine Mail der Registrierung, und
 * die Sprache steht im Bestätigungslink (`locale`).
 */
export async function startTrialForNewAccount(
  user: {
    id: string;
    email: string;
    name?: string | null;
    company?: string | null;
    partner?: string | null;
  },
  headers: Headers | null | undefined,
  opts: { locale?: "de" | "en"; welcomeMail?: boolean } = {},
): Promise<void> {
  try {
    const result = await startTrial(
      {
        id: user.id,
        email: user.email,
        // Leer (Registrierung ohne Namen) heißt unbekannt.
        name: user.name || null,
        company: user.company || null,
      },
      opts.locale ?? localeFromHeaders(headers),
      {
        variant: user.partner ? "partner" : "trial",
        sendMail: opts.welcomeMail !== false,
      },
    );
    if (!result.ok && result.error !== "already_has_license")
      console.error(`trial at signup not started: ${result.error}`);
  } catch (e) {
    console.error("trial at signup failed:", e);
  }
}

/**
 * Sprache der Willkommens-Mail aus der Registrierungsanfrage. Der Hook kennt
 * keine Locale; /konto schickt sie nicht mit, Web- und Desktop-App auch nicht.
 *   1. Referer auf einer Website-Seite: /en/… = Englisch, sonst Deutsch.
 *   2. Sonst (Web-App unter /app, Desktop-App, Server-Aufruf): Accept-Language.
 *   3. Standard Deutsch – die Zielgruppe ist AT/DE.
 */
export function localeFromHeaders(headers: Headers | null | undefined): "de" | "en" {
  if (!headers) return "de";
  const referer = headers.get("referer");
  if (referer) {
    try {
      const path = new URL(referer).pathname;
      if (path === "/en" || path.startsWith("/en/")) return "en";
      if (!path.startsWith("/app")) return "de";
    } catch {
      // Kein gültiger Referer – weiter mit Accept-Language.
    }
  }
  const lang = headers.get("accept-language")?.trim().toLowerCase() ?? "";
  return lang.startsWith("en") ? "en" : "de";
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
