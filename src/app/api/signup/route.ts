import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { randomUUID } from "crypto";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function generateDownloadUrl(token: string, locale: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://custix.ai";
  return `${baseUrl}/${locale === "en" ? "en/" : ""}download?token=${token}`;
}

function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}

function buildDownloadEmailHtml(name: string, downloadUrl: string, locale: string): string {
  const isDE = locale === "de";

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 560px; width: 100%; border-collapse: collapse;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://custix.ai/logo-custix-transparent.png" alt="custix.ai" width="120" style="display: block;">
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

              <!-- Greeting -->
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #1e293b;">
                ${isDE ? `Guten Tag ${name},` : `Hello ${name},`}
              </p>

              <!-- Message -->
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">
                ${isDE
                  ? "vielen Dank für Ihr Interesse an custix. Klicken Sie auf den Button unten, um die Software herunterzuladen und Ihre 14-tägige Testversion zu starten."
                  : "Thank you for your interest in custix. Click the button below to download the software and start your 14-day free trial."}
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${downloadUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${isDE ? "Jetzt herunterladen" : "Download Now"}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features List -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1e293b;">
                  ${isDE ? "custix bietet Ihnen:" : "custix offers you:"}
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                  <li>${isDE ? "100% lokale Verarbeitung – Daten verlassen nie Ihren Rechner" : "100% local processing – data never leaves your computer"}</li>
                  <li>${isDE ? "Automatische Anonymisierung in unter 5 Sekunden" : "Automatic anonymization in under 5 seconds"}</li>
                  <li>${isDE ? "DSGVO-konform ohne Cloud-Abhängigkeit" : "GDPR-compliant without cloud dependency"}</li>
                  <li>${isDE ? "Kompatibel mit ChatGPT, Claude und anderen KI-Tools" : "Compatible with ChatGPT, Claude, and other AI tools"}</li>
                </ul>
              </div>

              <!-- Link expiry notice -->
              <p style="margin: 0 0 24px; font-size: 13px; color: #94a3b8;">
                ${isDE
                  ? "Dieser Download-Link ist 7 Tage gültig. Bei Fragen erreichen Sie uns unter kontakt@custix.ai."
                  : "This download link is valid for 7 days. If you have questions, reach us at contact@custix.ai."}
              </p>

              <!-- Signature -->
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1e293b;">
                ${isDE ? "Mit freundlichen Grüßen," : "Best regards,"}<br>
                ${isDE ? "Das custix.ai Team" : "The custix.ai Team"}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8;">
                custix.ai – ${isDE ? "Dokumente anonymisieren. KI sicher nutzen." : "Anonymize documents. Use AI safely."}
              </p>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                <a href="https://custix.ai/${isDE ? "datenschutz" : "en/privacy"}" style="color: #94a3b8; text-decoration: underline;">${isDE ? "Datenschutz" : "Privacy"}</a>
                &nbsp;·&nbsp;
                <a href="https://custix.ai/${isDE ? "impressum" : "en/legal-notice"}" style="color: #94a3b8; text-decoration: underline;">${isDE ? "Impressum" : "Legal Notice"}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, profession, locale } = body;

    if (!name || !email || !profession) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const token = randomUUID();
    const tokenExpiresAt = getTokenExpiry();
    let signupId: string | null = null;

    if (supabase) {
      // Try to insert new signup
      const { data: insertData, error: insertError } = await supabase
        .from("signups")
        .insert({
          name,
          email,
          profession,
          locale: locale || "de",
          download_token: token,
          token_expires_at: tokenExpiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Duplicate email - update existing record with new token
          const { data: updateData, error: updateError } = await supabase
            .from("signups")
            .update({
              download_token: token,
              token_expires_at: tokenExpiresAt.toISOString(),
            })
            .eq("email", email)
            .select("id")
            .single();

          if (updateError) {
            console.error("Supabase update error:", updateError);
          } else {
            signupId = updateData?.id;
          }
        } else {
          console.error("Supabase insert error:", insertError);
        }
      } else {
        signupId = insertData?.id;
      }

      // Log email_sent event
      if (signupId) {
        await supabase.from("download_events").insert({
          signup_id: signupId,
          event_type: "email_sent",
          metadata: { locale, profession },
        });
      }
    }

    // Send email with download link
    const downloadUrl = generateDownloadUrl(token, locale || "de");
    const resend = getResend();
    const isDE = locale === "de";

    await resend?.emails.send({
      from: "custix.ai <noreply@custix.ai>",
      to: email,
      subject: isDE
        ? "Ihr custix Download-Link"
        : "Your custix Download Link",
      html: buildDownloadEmailHtml(name, downloadUrl, locale || "de"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
