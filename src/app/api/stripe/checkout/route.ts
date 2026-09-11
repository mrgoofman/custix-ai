import { NextResponse } from "next/server";
import { getDb, nowEpoch, findLicenseForAccount } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  getStripe,
  stripeEnv,
  priceIdFor,
  baseUrl,
  type Interval,
} from "@/lib/stripe";

/**
 * Startet Stripe Checkout für ein Abo (15 €/Monat oder 150 €/Jahr, je Arbeitsplatz).
 *
 * Angemeldung erforderlich: die Lizenz hängt am Better-Auth-Konto (ADR-0003).
 * Die Zuordnung Abo→Lizenz passiert NICHT hier, sondern im Webhook
 * (checkout.session.completed) – die Session kann abgebrochen werden und die
 * Zahlung asynchron eintreffen. Nur der Webhook weiß verlässlich, dass sie
 * zustande kam. client_reference_id trägt die license_id dorthin.
 */
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const env = stripeEnv();
  const stripe = getStripe(env);
  if (!stripe)
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );

  const body = (await request.json().catch(() => ({}))) as {
    interval?: string;
  };
  const interval: Interval = body.interval === "annual" ? "annual" : "monthly";
  const price = priceIdFor(env, interval);
  if (!price) {
    return NextResponse.json(
      { error: "price_not_configured", interval },
      { status: 503 },
    );
  }

  const db = getDb();
  const lic = await findLicenseForAccount(user.id);

  if (!lic) return NextResponse.json({ error: "no_license" }, { status: 409 });

  // Kunde einmal anlegen und wiederverwenden – sonst entsteht pro Checkout ein
  // neuer Stripe-Kunde und die Rechnungsliste im Konto zerfällt.
  let customerId = lic.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { license_id: lic.id, account_id: user.id },
    });
    customerId = customer.id;
    await db
      .prepare(
        "UPDATE license SET stripe_customer_id = ?, updated_at = ? WHERE id = ?",
      )
      .bind(customerId, nowEpoch(), lic.id)
      .run();
  }

  // Gewähltes Intervall festhalten. Der Webhook schreibt es später aus dem
  // tatsächlichen Abo nach – hier steht es schon, falls der Kunde abbricht und
  // die Kontoseite den zuletzt gewählten Tarif zeigen soll.
  {
    await db
      .prepare(
        "UPDATE license SET billing_interval = ?, payment_method = 'card', updated_at = ? WHERE id = ?",
      )
      .bind(interval, nowEpoch(), lic.id)
      .run();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: lic.id,
    subscription_data: {
      metadata: { license_id: lic.id, account_id: user.id },
    },
    // B2B: UID erfassen, damit Reverse Charge und Rechnungsangaben stimmen.
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    billing_address_collection: "required",
    success_url: `${baseUrl(env)}/konto?checkout=ok`,
    cancel_url: `${baseUrl(env)}/preise?checkout=abgebrochen`,
  });

  return NextResponse.json({ url: session.url });
}
