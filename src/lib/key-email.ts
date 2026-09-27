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
  key: string;
  locale: string;
  /**
   *  - trial:  der Empfänger hat sich gerade auf der Website registriert, das
   *            Konto existiert also schon. Ihn zum Anlegen eines Kontos
   *            aufzufordern, wäre schlicht falsch.
   *  - issued: ein Schlüssel, den das Team verschickt (Admin-Panel). Hier gibt
   *            es noch kein Konto, der Zwei-Schritte-Weg stimmt.
   */
  variant?: "trial" | "issued";
  /** Ablauf der Testphase (Unix-Sekunden), nur für `trial`. */
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

export function renderKeyEmail(input: KeyEmailInput): {
  subject: string;
  html: string;
} {
  const { locale } = input;
  const name = escapeHtml(input.name);
  const key = escapeHtml(input.key);
  const baseUrl = input.baseUrl.replace(/\/$/, "");
  const isDE = locale === "de";
  const trial = input.variant === "trial";

  const until = input.expiresAt
    ? new Date(input.expiresAt * 1000).toLocaleDateString(
        isDE ? "de-AT" : "en-GB",
        { day: "2-digit", month: "2-digit", year: "numeric" },
      )
    : null;

  const intro = trial
    ? isDE
      ? `Ihre 14-tägige Testphase läuft${until ? ` bis zum ${until}` : ""}. In zwei Schritten loslegen:`
      : `Your 14-day trial is running${until ? ` until ${until}` : ""}. Get started in two steps:`
    : isDE
      ? "Ihr Zugang ist freigeschaltet. In zwei Schritten loslegen:"
      : "Your access is ready. Get started in two steps:";

  const downloadUrl = `${baseUrl}/${isDE ? "" : "en/"}download`;

  const step2Title = trial
    ? isDE
      ? "2. In der App anmelden"
      : "2. Sign in to the app"
    : isDE
      ? "2. Konto erstellen und Lizenzschlüssel eingeben"
      : "2. Create an account and enter your licence key";

  const step2Body = trial
    ? isDE
      ? "Melden Sie sich mit der E-Mail-Adresse und dem Passwort an, die Sie soeben gewählt haben. Falls die App nach einem Lizenzschlüssel fragt, verwenden Sie diesen:"
      : "Sign in with the email address and password you just chose. If the app asks for a licence key, use this one:"
    : isDE
      ? "Erstellen Sie beim ersten Start ein Konto (E-Mail + Passwort) und geben Sie dann diesen Schlüssel ein:"
      : "On first launch, create an account (email + password), then enter this key:";

  const footer = trial
    ? isDE
      ? `Status und Abo verwalten Sie jederzeit unter <a href="${baseUrl}/konto" style="color:#2563eb;">custix.ai/konto</a>.`
      : `You can check your status and manage your plan any time at <a href="${baseUrl}/en/account" style="color:#2563eb;">custix.ai/account</a>.`
    : "";

  const subject = isDE ? "Ihr custix Lizenzschlüssel" : "Your custix licence key";

  const html = `
<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:560px;width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;"><img src="https://custix.ai/logo-custix.png" alt="custix.ai" width="120"></td></tr>
<tr><td style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
<p style="margin:0 0 24px;font-size:16px;color:#1e293b;">${isDE ? `Guten Tag ${name},` : `Hello ${name},`}</p>
<p style="margin:0 0 24px;font-size:16px;color:#475569;">${intro}</p>
<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1e293b;">${isDE ? "1. App herunterladen" : "1. Download the app"}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;"><tr><td align="center">
<a href="${downloadUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:8px;">${isDE ? "custix herunterladen" : "Download custix"}</a>
</td></tr></table>
<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1e293b;">${step2Title}</p>
<p style="margin:0 0 12px;font-size:14px;color:#475569;">${step2Body}</p>
<div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;font-family:monospace;font-size:20px;font-weight:700;letter-spacing:1px;color:#1e3a5f;">${key}</div>
${footer ? `<p style="margin:0 0 24px;font-size:14px;color:#475569;">${footer}</p>` : ""}
<p style="margin:0;font-size:16px;color:#1e293b;">${isDE ? "Mit freundlichen Grüßen," : "Best regards,"}<br>${isDE ? "Das custix.ai Team" : "The custix.ai Team"}</p>
</td></tr></table></td></tr></table></body></html>`.trim();

  return { subject, html };
}
