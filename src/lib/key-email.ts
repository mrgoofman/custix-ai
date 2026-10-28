/**
 * Die Schlüssel-Mail als reine Funktion: Eingaben rein, Betreff und HTML raus.
 *
 * Getrennt vom Versand (admin-actions.ts → Resend), damit sich die Mail ohne
 * API-Key und ohne echten Empfänger ansehen lässt:
 * `node scripts/preview-key-email.mts` schreibt alle Varianten als HTML-Dateien.
 * Hier darf deshalb nichts aus `@/…`, der Datenbank oder dem Worker-Kontext
 * importiert werden – das Skript läuft in blankem Node.
 */
export type KeyEmailInput = {
  /** Anrede; bei fehlendem Namen die E-Mail-Adresse. */
  name: string;
  /** Nur `issued` zeigt ihn; Website-Konten brauchen ihn nicht (CONTEXT.md, „License key“). */
  key: string;
  locale: string;
  /**
   *  - trial:   Willkommens-Mail nach der Registrierung. Das Konto existiert
   *             schon, die Testlizenz hängt daran. Verlinkt nur die Web-App –
   *             kein Schlüssel, kein Download (mrgoofman/custix-ai#14).
   *  - partner: dieselbe Testphase nach einem Partner signup. Partner
   *             verteilen die Desktop-App (ADR-0011): Download-Knopf, dann in
   *             der App anmelden, kein Web-App-Hinweis.
   *  - issued:  ein Schlüssel, den das Team verschickt (Admin-Panel). Hier gibt
   *             es noch kein Konto, der Zwei-Schritte-Weg mit Schlüssel stimmt.
   */
  variant?: "trial" | "partner" | "issued";
  /** Ablauf der Testphase (Unix-Sekunden), nur für `trial` und `partner`. */
  expiresAt?: number | null;
  /** z. B. https://custix.ai (ein abschließender Schrägstrich wird entfernt) */
  baseUrl: string;
};

/** Absender aller Schlüssel-Mails. */
export const KEY_EMAIL_FROM = "custix.ai <info@custix.ai>";

/** Für Text, der in das Mail-HTML eingesetzt wird (Name aus dem Formular). */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const P_BODY = "margin:0 0 24px;font-size:16px;color:#475569;";
const P_STEP = "margin:0 0 8px;font-size:14px;font-weight:700;color:#1e293b;";
const P_SMALL = "font-size:14px;color:#475569;";

function button(href: string, label: string, marginBottom: number): string {
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:${marginBottom}px;"><tr><td align="center">
<a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:8px;">${label}</a>
</td></tr></table>`;
}

export function renderKeyEmail(input: KeyEmailInput): {
  subject: string;
  html: string;
} {
  const { locale } = input;
  const name = escapeHtml(input.name);
  const key = escapeHtml(input.key);
  const baseUrl = input.baseUrl.replace(/\/$/, "");
  const isDE = locale === "de";
  const variant = input.variant ?? "issued";
  const isTrial = variant === "trial" || variant === "partner";

  const until = input.expiresAt
    ? new Date(input.expiresAt * 1000).toLocaleDateString(
        isDE ? "de-AT" : "en-GB",
        { day: "2-digit", month: "2-digit", year: "numeric" },
      )
    : null;

  const downloadUrl = `${baseUrl}/${isDE ? "" : "en/"}download`;
  const webAppUrl = `${baseUrl}/app/`;
  const accountUrl = `${baseUrl}/${isDE ? "konto" : "en/account"}`;

  const footer = isTrial
    ? isDE
      ? `Status und Abo verwalten Sie jederzeit unter <a href="${accountUrl}" style="color:#2563eb;">custix.ai/konto</a>.`
      : `You can check your status and manage your plan any time at <a href="${accountUrl}" style="color:#2563eb;">custix.ai/account</a>.`
    : "";

  let body: string;
  if (variant === "trial") {
    /**
     * Nur die Web-App: Nach der Registrierung gibt es genau einen Weg, und der
     * führt in den Browser (mrgoofman/custix-ai#14). Kein Schlüssel – die
     * Lizenz hängt am Konto, die Web-App findet sie über die Anmeldung
     * (ADR-0012). Kein Download – die Desktop-App bewirbt die Mail nicht mehr.
     */
    const intro = isDE
      ? `Ihr Konto ist angelegt, Ihre 14-tägige Testphase läuft${until ? ` bis zum ${until}` : ""}. custix läuft direkt im Browser – ohne Installation, Ihre Dokumente bleiben auf Ihrem Gerät.`
      : `Your account is ready and your 14-day trial is running${until ? ` until ${until}` : ""}. custix runs right in your browser – nothing to install, and your documents stay on your device.`;
    const signIn = isDE
      ? "Fragt custix nach Ihren Zugangsdaten, melden Sie sich mit der E-Mail-Adresse und dem Passwort an, die Sie bei der Registrierung gewählt haben. Einen Lizenzschlüssel brauchen Sie nicht."
      : "If custix asks you to sign in, use the email address and password you chose when registering. You don't need a licence key.";
    body = `<p style="${P_BODY}">${intro}</p>
${button(webAppUrl, isDE ? "custix im Browser starten" : "Start custix in your browser", 24)}
<p style="margin:0 0 24px;${P_SMALL}">${signIn}</p>`;
  } else {
    const intro =
      variant === "partner"
        ? isDE
          ? `Ihre 14-tägige Testphase läuft${until ? ` bis zum ${until}` : ""}. In zwei Schritten loslegen:`
          : `Your 14-day trial is running${until ? ` until ${until}` : ""}. Get started in two steps:`
        : isDE
          ? "Ihr Zugang ist freigeschaltet. In zwei Schritten loslegen:"
          : "Your access is ready. Get started in two steps:";

    const step2Title =
      variant === "partner"
        ? isDE
          ? "2. In der App anmelden"
          : "2. Sign in to the app"
        : isDE
          ? "2. Konto erstellen und Lizenzschlüssel eingeben"
          : "2. Create an account and enter your licence key";

    /**
     * Kein Schlüssel in der Partner-Mail: Die Lizenz hängt schon am Konto,
     * die App holt den Schlüssel nach dem Login selbst (/api/license/mine).
     */
    const step2Body =
      variant === "partner"
        ? isDE
          ? "Melden Sie sich mit der E-Mail-Adresse und dem Passwort an, die Sie bei der Registrierung gewählt haben. Die App erkennt Ihre Testphase automatisch – einen Lizenzschlüssel brauchen Sie nicht."
          : "Sign in with the email address and password you chose when registering. The app recognises your trial automatically – you don't need a licence key."
        : isDE
          ? "Erstellen Sie beim ersten Start ein Konto (E-Mail + Passwort) und geben Sie dann diesen Schlüssel ein:"
          : "On first launch, create an account (email + password), then enter this key:";

    body = `<p style="${P_BODY}">${intro}</p>
<p style="${P_STEP}">${isDE ? "1. App herunterladen" : "1. Download the app"}</p>
${button(downloadUrl, isDE ? "custix herunterladen" : "Download custix", 24)}
<p style="${P_STEP}">${step2Title}</p>
<p style="margin:0 0 ${variant === "partner" ? "24" : "12"}px;${P_SMALL}">${step2Body}</p>
${variant === "partner" ? "" : `<div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;font-family:monospace;font-size:20px;font-weight:700;letter-spacing:1px;color:#1e3a5f;">${key}</div>`}`;
  }

  const subject = isTrial
    ? isDE
      ? "Ihre custix Testphase läuft"
      : "Your custix trial is running"
    : isDE
      ? "Ihr custix Lizenzschlüssel"
      : "Your custix licence key";

  const html = `
<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:560px;width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;"><img src="https://custix.ai/logo-custix.png" alt="custix.ai" width="120"></td></tr>
<tr><td style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
<p style="margin:0 0 24px;font-size:16px;color:#1e293b;">${isDE ? `Guten Tag ${name},` : `Hello ${name},`}</p>
${body}
${footer ? `<p style="margin:0 0 24px;${P_SMALL}">${footer}</p>` : ""}
<p style="margin:0;font-size:16px;color:#1e293b;">${isDE ? "Mit freundlichen Grüßen," : "Best regards,"}<br>${isDE ? "Das custix.ai Team" : "The custix.ai Team"}</p>
</td></tr></table></td></tr></table></body></html>`.trim();

  return { subject, html };
}
