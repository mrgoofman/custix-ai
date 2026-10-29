/**
 * Die Mails der Registrierung „E-Mail zuerst“ (mrgoofman/custix-ai#15) als
 * reine Funktionen: Eingaben rein, Betreff, HTML und Text raus.
 *
 * Wie key-email.ts ohne `@/…`-Importe und ohne Worker-Kontext, damit
 * `node scripts/preview-key-email.mts` sie in blankem Node rendern kann. Die
 * Seite „Bitte sehen Sie in Ihr Postfach“ zeigt Absender und Betreff aus
 * diesem Modul – so stimmen Seite und Mail immer überein.
 *
 * Bei der Registrierung geht genau eine Mail hinaus:
 *  - confirm: neue Adresse → ein Knopf „Zugang bestätigen“, kein Schlüssel,
 *    kein Download. Die Willkommens-Mail mit der Testphase entfällt für diesen
 *    Weg (lib/trial.ts) – die Passwort-Seite zeigt das Ende der Testphase.
 *  - existing: Für die Adresse gibt es schon ein Konto → „Anmelden“ statt
 *    eines zweiten Kontos. Die Seite sagt in beiden Fällen dasselbe, damit
 *    sie nicht verrät, ob eine Adresse registriert ist.
 */

/** Absender – derselbe wie bei den Schlüssel-Mails (key-email.ts). */
export const SIGNUP_EMAIL_FROM = "custix.ai <info@custix.ai>";

type Locale = "de" | "en";

export function signupConfirmSubject(locale: string): string {
  return locale === "en"
    ? "Please confirm your custix access"
    : "Bitte bestätigen Sie Ihren custix-Zugang";
}

/** Pfade der Website je Sprache (siehe src/i18n/routing.ts). */
export function welcomePath(locale: string): string {
  return locale === "en" ? "/en/welcome" : "/willkommen";
}

export function accountPath(locale: string): string {
  return locale === "en" ? "/en/account" : "/konto";
}

type Rendered = { subject: string; html: string; text: string };

const P_BODY = "margin:0 0 24px;font-size:16px;color:#475569;";
const P_SMALL = "margin:0 0 16px;font-size:14px;color:#64748b;";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(href: string, label: string): string {
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;"><tr><td align="center">
<a href="${escapeHtml(href)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:8px;">${label}</a>
</td></tr></table>`;
}

function shell(locale: Locale, inner: string): string {
  const isDE = locale === "de";
  return `
<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:520px;width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;"><img src="https://custix.ai/logo-custix.png" alt="custix.ai" width="120"></td></tr>
<tr><td style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
<p style="margin:0 0 24px;font-size:16px;color:#1e293b;">${isDE ? "Guten Tag," : "Hello,"}</p>
${inner}
<p style="margin:0;font-size:16px;color:#1e293b;">${isDE ? "Mit freundlichen Grüßen," : "Best regards,"}<br>${isDE ? "Das custix.ai Team" : "The custix.ai Team"}</p>
</td></tr></table></td></tr></table></body></html>`.trim();
}

const CONTACT = "contact@custix.ai";

/**
 * Bestätigungs-Mail: genau ein Knopf. `url` führt auf die Passwort-Seite,
 * das Token steht im Fragment (#token=…) und geht so weder an Server-Logs
 * noch an die Webanalyse.
 */
export function renderSignupConfirmEmail(input: {
  url: string;
  locale: string;
}): Rendered {
  const locale: Locale = input.locale === "en" ? "en" : "de";
  const isDE = locale === "de";
  const subject = signupConfirmSubject(locale);

  const intro = isDE
    ? "bitte bestätigen Sie mit einem Klick, dass diese E-Mail-Adresse Ihnen gehört. Danach wählen Sie ein Passwort und können sofort loslegen."
    : "please confirm with one click that this email address belongs to you. Then choose a password and you can get started right away.";
  const cta = isDE ? "Zugang bestätigen" : "Confirm access";
  const validity = isDE
    ? "Der Knopf funktioniert 24 Stunden lang. Sie haben custix nicht angefordert? Dann ignorieren Sie diese E-Mail einfach. Ohne Bestätigung legen wir kein Konto an."
    : "The button works for 24 hours. Didn't request custix? Simply ignore this email. Without confirmation we won't create an account.";
  const questions = isDE
    ? `Fragen? Schreiben Sie uns an <a href="mailto:${CONTACT}" style="color:#2563eb;">${CONTACT}</a>.`
    : `Questions? Write to us at <a href="mailto:${CONTACT}" style="color:#2563eb;">${CONTACT}</a>.`;

  const html = shell(
    locale,
    `<p style="${P_BODY}">${intro}</p>
${button(input.url, cta)}
<p style="${P_SMALL}">${validity}</p>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;">${questions}</p>`,
  );

  const text = [
    isDE ? "Guten Tag," : "Hello,",
    "",
    intro,
    "",
    `${cta}: ${input.url}`,
    "",
    validity,
    isDE ? `Fragen? Schreiben Sie uns an ${CONTACT}.` : `Questions? Write to us at ${CONTACT}.`,
    "",
    isDE ? "Mit freundlichen Grüßen" : "Best regards",
    isDE ? "Das custix.ai Team" : "The custix.ai Team",
  ].join("\n");

  return { subject, html, text };
}

/**
 * Für die Adresse gibt es schon ein Konto: kein zweites anlegen, sondern zur
 * Anmeldung schicken – mit dem Weg über „Passwort vergessen“, falls es fehlt.
 */
export function renderExistingAccountEmail(input: {
  signInUrl: string;
  forgotUrl: string;
  locale: string;
}): Rendered {
  const locale: Locale = input.locale === "en" ? "en" : "de";
  const isDE = locale === "de";
  const subject = isDE
    ? "Sie haben bereits ein custix-Konto"
    : "You already have a custix account";

  const intro = isDE
    ? "Sie wollten custix testen. Für diese E-Mail-Adresse gibt es bereits ein custix-Konto. Melden Sie sich einfach mit Ihrem Passwort an."
    : "You asked to try custix. There is already a custix account for this email address. Simply sign in with your password.";
  const cta = isDE ? "Anmelden" : "Sign in";
  const forgot = isDE
    ? `Passwort vergessen? Dann <a href="${escapeHtml(input.forgotUrl)}" style="color:#2563eb;">setzen Sie es hier neu</a>.`
    : `Forgot your password? <a href="${escapeHtml(input.forgotUrl)}" style="color:#2563eb;">Reset it here</a>.`;
  const ignore = isDE
    ? "Sie haben nichts angefordert? Dann ignorieren Sie diese E-Mail einfach."
    : "Didn't request anything? Simply ignore this email.";

  const html = shell(
    locale,
    `<p style="${P_BODY}">${intro}</p>
${button(input.signInUrl, cta)}
<p style="${P_SMALL}">${forgot}</p>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;">${ignore}</p>`,
  );

  const text = [
    isDE ? "Guten Tag," : "Hello,",
    "",
    intro,
    "",
    `${cta}: ${input.signInUrl}`,
    isDE
      ? `Passwort vergessen? ${input.forgotUrl}`
      : `Forgot your password? ${input.forgotUrl}`,
    "",
    ignore,
    "",
    isDE ? "Mit freundlichen Grüßen" : "Best regards",
    isDE ? "Das custix.ai Team" : "The custix.ai Team",
  ].join("\n");

  return { subject, html, text };
}
