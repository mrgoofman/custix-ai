/**
 * Lizenz-Richtwerte an einer Stelle (CONTEXT.md, „License policy values").
 *
 * Eigenes Modul, damit der Stripe-Webhook sie nutzen kann, ohne admin-actions
 * und damit den Resend-Client mitzuziehen.
 */

/** Kulanzfrist nach Ablauf, in Sekunden. */
export const GRACE = {
  /** Beta und Testphase: nichts bezahlt, also nichts zu stunden. */
  beta: 0,
  trial: 0,
  /** Kartenzahlung: 7 Tage, bis der Einzug erneut versucht wurde. */
  card: 7 * 86400,
  /** Rechnung: 30 Tage, weil Überweisungen laufen. */
  invoice: 30 * 86400,
} as const;

export const TRIAL_DAYS = 14;
