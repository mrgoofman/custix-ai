import { NextResponse } from "next/server";
import { findLicenseForAccount } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getStripe, stripeEnv, baseUrl } from "@/lib/stripe";

/**
 * Öffnet das Stripe-Kundenportal: Kündigung, Zahlungsmittel, alle Rechnungen.
 *
 * Bewusst das Portal statt eigener Masken – Rechnungen mit korrekt
 * ausgewiesener USt., Reverse-Charge-Hinweis und Firmendaten erzeugt Stripe
 * ohnehin. Die nachzubauen hieße, ein juristisch heikles Dokument selbst zu
 * rendern.
 */
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const env = stripeEnv();
  const stripe = getStripe(env);
  if (!stripe) return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });

  const lic = await findLicenseForAccount(user.id);

  if (!lic?.stripe_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 409 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: lic.stripe_customer_id,
    return_url: `${baseUrl(env)}/konto`,
  });

  return NextResponse.json({ url: session.url });
}
