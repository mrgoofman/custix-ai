import { NextResponse } from "next/server";
import {
  findLicenseForAccount,
  findRevokedLicenseForAccount,
  nowEpoch,
} from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { entitlementOf, epochToIsoDate } from "@/lib/entitlement";

/**
 * Die Lizenz des angemeldeten Kontos – ohne Schlüsseleingabe, allein über die
 * Sitzung. Antwortformat und Regeln: ADR-0012 (dort als Vertrag mit der
 * Web-App, znerol74/custix#54, festgehalten).
 *
 *  - Web-App: entscheidet hier, ob sie startet (`valid`). Sie ruft
 *    /api/license/validate nicht auf; das bleibt der Desktop-Vertrag.
 *  - Desktop-App: holt nur `key`, um ihn nach einer Neuinstallation ohne
 *    erneute Eingabe wiederherzustellen, und prüft dann über validate.
 *  - /konto: Status, Ablauf, Abo-Angebot, Download nur bei `desktop_used`.
 *
 * Den Schlüssel an den angemeldeten Besitzer zurückzugeben verrät nichts:
 * account_id bindet ihn schon an genau dieses Konto (ADR-0003).
 *
 * `valid` und `status` rechnet derselbe Code wie validate (lib/entitlement.ts).
 * `status` ist der wirksame Stand: Eine abgelaufene Testphase meldet „expired“,
 * auch wenn die Zeile noch 'active' sagt.
 */
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user)
      return NextResponse.json(
        { error: "unauthenticated" },
        { status: 401, headers: NO_STORE },
      );

    const lic = await findLicenseForAccount(user.id);
    if (lic) {
      const e = entitlementOf(lic, nowEpoch());
      return NextResponse.json(
        {
          key: lic.license_key,
          type: lic.type,
          status: e.state,
          valid: e.valid,
          message_key: e.messageKey,
          expires: lic.expires_at == null ? null : epochToIsoDate(lic.expires_at),
          grace_until: e.graceUntil == null ? null : epochToIsoDate(e.graceUntil),
          expires_at: lic.expires_at,
          grace_seconds: lic.grace_seconds,
          // Läuft die Lizenz schon in der Desktop-App? Nur dann zeigt /konto
          // den Download (mrgoofman/custix-ai#14).
          desktop_used: lic.last_validated_at != null,
        },
        { headers: NO_STORE },
      );
    }

    // Keine gebundene Lizenz: widerrufen (vom Team gesperrt) oder nie eine
    // gehabt (z. B. Konto aus der kostenlosen Web-Phase, ADR-0010).
    const revoked = await findRevokedLicenseForAccount(user.id);
    return NextResponse.json(
      {
        key: null,
        type: revoked?.type ?? null,
        status: revoked ? "revoked" : null,
        valid: false,
        message_key: revoked ? "license.revoked" : "license.none",
        expires: null,
        grace_until: null,
        expires_at: null,
        grace_seconds: 0,
        desktop_used: false,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("license mine error:", error);
    // Kein Lizenzurteil: Die Web-App läuft bei einem Serverfehler weiter
    // (ADR-0002, Resilienzregel), statt alle auszusperren.
    return NextResponse.json(
      { error: "internal error" },
      { status: 500, headers: NO_STORE },
    );
  }
}
