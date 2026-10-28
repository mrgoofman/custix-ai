/**
 * Ist eine Lizenz gerade gültig? Eine Regel für beide Clients: die
 * Desktop-App fragt /api/license/validate (ADR-0002), die Web-App
 * /api/license/mine (ADR-0012). Stünde die Regel zweimal da, könnten Web und
 * Desktop für dieselbe Lizenz Verschiedenes sagen.
 *
 * Rein, ohne Datenbank und ohne Uhr: Ob die Lizenz dem Aufrufer gehört, klärt
 * der Aufrufer vorher; `now` kommt immer vom Server (Unix-Sekunden).
 *
 * „Aktiv“ wie in CONTEXT.md: status=active, noch innerhalb von
 * expires_at + Kulanzfrist, und bei einem Abo ein laufender Stripe-Status.
 */
export type EntitlementInput = {
  type: string;
  status: string;
  expires_at: number | null;
  grace_seconds: number;
  subscription_status: string | null;
};

export type Entitlement = {
  valid: boolean;
  /** Dieselben Schlüssel wie im validate-Vertrag (license.ok, license.expired …). */
  messageKey: string;
  /** expires_at + Kulanzfrist; null = unbefristet. */
  graceUntil: number | null;
  /**
   * Der wirksame Stand – nicht die gespeicherte Spalte: Eine Testphase, deren
   * Frist abgelaufen ist, steht in der Datenbank noch auf 'active' (kein Job
   * stellt sie um), ist aber „expired“.
   */
  state: "active" | "expired" | "revoked";
};

/** Stripe-Status, unter denen ein Abo die Nutzung trägt (ADR-0007). */
const CURRENT_SUBSCRIPTION = ["active", "trialing", "past_due"];

export function entitlementOf(lic: EntitlementInput, now: number): Entitlement {
  const graceUntil =
    lic.expires_at == null ? null : lic.expires_at + lic.grace_seconds;
  const inGrace = lic.expires_at != null && now >= lic.expires_at;

  // Reihenfolge wie bisher in /api/license/validate – sie trägt die Antwort.
  let valid = false;
  let messageKey: string;
  if (lic.status === "revoked") {
    messageKey = "license.revoked";
  } else if (lic.status === "expired") {
    messageKey = "license.expired";
  } else if (graceUntil != null && now >= graceUntil) {
    messageKey = "license.expired";
  } else if (lic.type === "beta" || lic.type === "trial") {
    valid = true;
    messageKey = inGrace ? "license.in_grace" : "license.ok";
  } else if (
    lic.type === "subscription" &&
    lic.subscription_status != null &&
    CURRENT_SUBSCRIPTION.includes(lic.subscription_status)
  ) {
    valid = true;
    messageKey =
      lic.subscription_status === "past_due"
        ? "license.renewal_due"
        : inGrace
          ? "license.in_grace"
          : "license.ok";
  } else {
    messageKey = "license.expired";
  }

  return {
    valid,
    messageKey,
    graceUntil,
    state: valid ? "active" : lic.status === "revoked" ? "revoked" : "expired",
  };
}

/** Unix-Sekunden → ISO-Datum (YYYY-MM-DD), wie im validate-Vertrag. */
export function epochToIsoDate(epoch: number): string {
  return new Date(epoch * 1000).toISOString().slice(0, 10);
}
