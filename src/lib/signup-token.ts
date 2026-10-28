import { symmetricDecodeJWT, symmetricEncodeJWT } from "better-auth/crypto";

/**
 * Bestätigungslink der Registrierung „E-Mail zuerst“ (mrgoofman/custix-ai#15,
 * ADR-0013). Der Link trägt die Adresse verschlüsselt und signiert in sich;
 * vor der Bestätigung speichern wir nichts – unbestätigte Adressen landen nie
 * in der Datenbank.
 *
 * Verschlüsseltes JWT (JWE, A256CBC-HS512) aus better-auth/crypto, Schlüssel
 * per HKDF aus BETTER_AUTH_SECRET mit eigenem Salz. Damit ist der Link weder
 * lesbar (die Adresse steht nicht im Klartext in der URL) noch mit Better
 * Auths eigenen Tokens verwechselbar: /api/auth/verify-email nimmt ein
 * HS256-JWT mit demselben Geheimnis, dieses hier passt dort nicht.
 *
 * Einmalig ist der Link über das Konto: Die erste Verwendung legt es an, jede
 * weitere scheitert an „Konto existiert schon“. Ein neu angeforderter Link
 * macht alte nicht ungültig – das schadet nicht, gewinnen kann nur der erste.
 */

/** So steht es in der Mail: „Der Knopf funktioniert 24 Stunden lang.“ */
export const SIGNUP_TOKEN_TTL_SECONDS = 24 * 3600;

/** Trennt diese Tokens von allem anderen, was mit dem Auth-Geheimnis verschlüsselt wird. */
const SALT = "custix.signup-confirmation.v1";

export type SignupTokenData = {
  /** Kleingeschrieben, wie Better Auth sie speichert. */
  email: string;
  /** Sprache des Formulars – Passwort-Seite und Konto übernehmen sie. */
  locale: "de" | "en";
};

export async function createSignupToken(
  secret: string,
  data: SignupTokenData,
): Promise<string> {
  return symmetricEncodeJWT(
    { email: data.email, locale: data.locale },
    secret,
    SALT,
    SIGNUP_TOKEN_TTL_SECONDS,
  );
}

/** Inhalt eines gültigen, nicht abgelaufenen Tokens – sonst null (auch bei Unsinn). */
export async function readSignupToken(
  secret: string,
  token: unknown,
): Promise<SignupTokenData | null> {
  if (typeof token !== "string" || !token || token.length > 4096) return null;
  const payload = await symmetricDecodeJWT<Record<string, unknown>>(token, secret, SALT);
  if (!payload || typeof payload.email !== "string" || !payload.email) return null;
  return {
    email: payload.email.toLowerCase(),
    locale: payload.locale === "en" ? "en" : "de",
  };
}
