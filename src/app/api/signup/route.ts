import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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
    if (supabase) {
      const { error: dbError } = await supabase.from("signups").insert({
        name,
        email,
        profession,
        locale: locale || "de",
      });
      if (dbError && dbError.code !== "23505") {
        console.error("Supabase insert error:", dbError);
      }
    }

    const isDE = locale === "de";
    const resend = getResend();
    await resend?.emails.send({
      from: "custix.ai <noreply@custix.ai>",
      to: email,
      subject: isDE
        ? "Willkommen bei custix.ai — Ihre Testversion ist bereit"
        : "Welcome to custix.ai — Your trial is ready",
      html: isDE
        ? `<p>Hallo ${name},</p>
           <p>vielen Dank für Ihre Anmeldung zur 14-tägigen Testversion von custix.ai!</p>
           <p>Wir melden uns in Kürze mit Ihrem Zugang. In der Zwischenzeit können Sie sich auf unserer Website umsehen.</p>
           <p>Beste Grüße,<br>Das custix.ai Team</p>`
        : `<p>Hi ${name},</p>
           <p>Thank you for signing up for the 14-day free trial of custix.ai!</p>
           <p>We'll get back to you shortly with your access details. In the meantime, feel free to explore our website.</p>
           <p>Best regards,<br>The custix.ai Team</p>`,
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
