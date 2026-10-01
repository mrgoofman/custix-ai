import { Resend } from "resend";

/**
 * Benachrichtigung an den Partner nach einem Partner signup (ADR-0011).
 *
 * Bewusst OHNE personenbezogene Daten: kein Name, keine Kanzlei, keine
 * E-Mail-Adresse. Das Formular sagt „<Partner> erhält sie nicht“, und
 * Partner bekommen nur Summen (CONTEXT.md, „Partner attribution“). Die Mail
 * meldet nur, DASS sich jemand registriert hat, plus die laufende Summe.
 *
 * Ohne `@/…`-Importe, damit sich die Mail auch in blankem Node ansehen lässt.
 */
export type PartnerSignupNoticeInput = {
  /** Registrierungen über dieses Formular bisher, inklusive der neuen. */
  total: number;
};

const FROM = "custix.ai <info@custix.ai>";

export function renderPartnerSignupNotice(input: PartnerSignupNoticeInput): {
  subject: string;
  html: string;
} {
  const total = Math.max(1, Math.floor(input.total));
  const subject = "Neue Registrierung über Ihr custix-Formular";
  const html = `
<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:520px;width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;"><img src="https://custix.ai/logo-custix.png" alt="custix.ai" width="120"></td></tr>
<tr><td style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
<p style="margin:0 0 16px;font-size:16px;color:#1e293b;">Guten Tag,</p>
<p style="margin:0 0 16px;font-size:16px;color:#475569;">über das custix-Formular auf Ihrer Seite hat sich soeben eine Person registriert. Für sie läuft jetzt die 14-tägige Testphase.</p>
<p style="margin:0 0 24px;font-size:16px;color:#475569;">Registrierungen über Ihre Seite bisher: <strong style="color:#1e293b;">${total}</strong></p>
<p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">Name, Kanzlei und E-Mail-Adresse geben wir nicht weiter – so steht es im Formular. Fragen gern an info@custix.ai.</p>
<p style="margin:0;font-size:16px;color:#1e293b;">Mit freundlichen Grüßen,<br>Das custix.ai Team</p>
</td></tr></table></td></tr></table></body></html>`.trim();
  return { subject, html };
}

/** Verschickt die Benachrichtigung; ohne API-Key still übersprungen (lokal). */
export async function sendPartnerSignupNotice(
  apiKey: string | undefined,
  to: string,
  input: PartnerSignupNoticeInput,
): Promise<void> {
  if (!apiKey) return;
  const { subject, html } = renderPartnerSignupNotice(input);
  await new Resend(apiKey).emails.send({ from: FROM, to, subject, html });
}
