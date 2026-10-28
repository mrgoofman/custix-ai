/**
 * Regeln der Registrierung „E-Mail zuerst“ (mrgoofman/custix-ai#15), geteilt
 * zwischen Passwort-Seite (Browser) und /api/signup/complete (Server).
 */

/**
 * Mindestens 10 Zeichen, keine Sonderzeichen-Pflicht (Entscheidung Lorenz,
 * 28.10.2026). Gilt nur für diesen Weg: Better Auth selbst bleibt bei 8, sonst
 * scheiterten Registrierung und Zurücksetzen in Web- und Desktop-App.
 */
export const SIGNUP_MIN_PASSWORD = 10;

/** Höchstlänge wie Better Auth. */
export const SIGNUP_MAX_PASSWORD = 128;

/** Höchstlänge des freiwilligen Felds „Firma, Kanzlei oder Praxis“. */
export const SIGNUP_MAX_COMPANY = 200;
