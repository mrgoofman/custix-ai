import Stripe from "stripe";
import type { D1Database } from "@cloudflare/workers-types";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";
import { getStripe, stripeEnv } from "@/lib/stripe";
import { GRACE } from "@/lib/license-policy";

/**
 * Stripe-Webhook → Lizenzstatus (ADR-0007).
 *
 * Stripe garantiert KEINE Reihenfolge der Ereignisse. Deshalb darf kein
 * Handler voraussetzen, dass ein anderer schon gelaufen ist:
 *
 *  - Die Lizenz wird über drei Wege aufgelöst (siehe resolveLicenseId), nicht
 *    nur über die gestempelte stripe_subscription_id. Käme invoice.paid zuerst,
 *    liefe die Suche sonst ins Leere und der zahlende Kunde bliebe gesperrt.
 *  - Jeder Handler schreibt den vollständigen Zustand inklusive
 *    subscription_status. Sonst entstünde ein Fenster, in dem type schon
 *    'subscription' ist, der Status aber fehlt – und /api/license/validate
 *    verlangt einen der Werte active/trialing/past_due.
 *  - Ein Wasserzeichen (last_stripe_event_at) verwirft ältere Ereignisse, die
 *    nach neueren eintreffen.
 *
 * Workers: constructEventAsync (Web Crypto), NICHT constructEvent.
 */
export async function POST(request: Request) {
  const env = stripeEnv();
  const stripe = getStripe(env);
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe not configured", { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    return new Response(
      `signature verification failed: ${String((e as Error).message)}`,
      {
        status: 400,
      },
    );
  }

  const db = getDb();
  const at = event.created;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as unknown as {
          client_reference_id?: string | null;
          customer?: string | { id?: string } | null;
          subscription?: string | { id?: string } | null;
        };
        const subId = idOf(s.subscription);
        const customerId = idOf(s.customer);
        const licenseId = await resolveLicenseId(db, stripe, {
          licenseId: s.client_reference_id ?? undefined,
          subId,
          customerId,
        });
        if (!licenseId || !subId) break;

        // Status direkt aus dem Abo lesen, statt ihn zu erraten – damit ist die
        // Lizenz sofort gültig und nicht erst nach invoice.paid.
        const sub = await stripe.subscriptions
          .retrieve(subId)
          .catch(() => null);
        await applyToLicense(db, licenseId, at, {
          type: "subscription",
          status: "active",
          subscription_status: mapStatus(sub?.status ?? "active"),
          expires_at: periodEndOf(sub),
          stripe_subscription_id: subId,
          stripe_customer_id: customerId ?? null,
          billing_interval: intervalOf(sub),
          payment_method: "card",
          grace_seconds: GRACE.card,
        });
        break;
      }

      // Zahlung eingegangen (Karte, abgeglichene Überweisung oder manuell).
      case "invoice.paid": {
        const inv = event.data.object as unknown as {
          subscription?: string | { id?: string } | null;
          customer?: string | { id?: string } | null;
          lines?: { data?: Array<{ period?: { end?: number } }> };
        };
        const subId = idOf(inv.subscription);
        const customerId = idOf(inv.customer);
        if (!subId) break;

        const licenseId = await resolveLicenseId(db, stripe, {
          subId,
          customerId,
        });
        if (!licenseId) break;

        await applyToLicense(db, licenseId, at, {
          type: "subscription",
          status: "active",
          subscription_status: "active",
          expires_at: inv.lines?.data?.[0]?.period?.end ?? null,
          stripe_subscription_id: subId,
          stripe_customer_id: customerId ?? null,
          // Intervall nicht überschreiben: die Rechnung kennt es nicht
          // zuverlässig, checkout.session.completed hat es schon gesetzt.
          billing_interval: null,
          payment_method: "card",
          grace_seconds: GRACE.card,
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as {
          id: string;
          status: string;
          customer?: string | { id?: string } | null;
          current_period_end?: number;
        };
        const customerId = idOf(sub.customer);
        const licenseId = await resolveLicenseId(db, stripe, {
          subId: sub.id,
          customerId,
        });
        if (!licenseId) break;

        const terminal = sub.status === "canceled" || sub.status === "unpaid";
        await applyToLicense(db, licenseId, at, {
          type: "subscription",
          status: terminal ? "expired" : "active",
          subscription_status: mapStatus(sub.status),
          expires_at: sub.current_period_end ?? null,
          stripe_subscription_id: sub.id,
          stripe_customer_id: customerId ?? null,
          billing_interval: null,
          payment_method: "card",
          grace_seconds: GRACE.card,
        });
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("stripe webhook handler error:", e);
    // 500 → Stripe wiederholt; die Updates sind über das Wasserzeichen idempotent.
    return new Response("handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const idOf = (
  v: string | { id?: string } | null | undefined,
): string | undefined => (typeof v === "string" ? v : (v?.id ?? undefined));

const ALLOWED_SUB_STATUS = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
] as const;

/** Auf die Werte abbilden, die der CHECK auf license.subscription_status zulässt. */
function mapStatus(s: string): string {
  return (ALLOWED_SUB_STATUS as readonly string[]).includes(s) ? s : "canceled";
}

/** Stripe liefert 'month'/'year'; die Spalte erlaubt nur 'monthly'/'annual'. */
function intervalOf(sub: Stripe.Subscription | null): string | null {
  const iv = sub?.items?.data?.[0]?.price?.recurring?.interval;
  if (iv === "year") return "annual";
  if (iv === "month") return "monthly";
  return null;
}

function periodEndOf(sub: Stripe.Subscription | null): number | null {
  if (!sub) return null;
  const withPeriod = sub as unknown as { current_period_end?: number };
  if (typeof withPeriod.current_period_end === "number")
    return withPeriod.current_period_end;
  // Neuere API-Versionen führen die Periode je Abo-Position.
  const item = sub.items?.data?.[0] as unknown as
    | { current_period_end?: number }
    | undefined;
  return item?.current_period_end ?? null;
}

/**
 * Findet die Lizenz zu einem Stripe-Ereignis – in dieser Reihenfolge:
 *   1. client_reference_id aus Checkout (direkt die license_id)
 *   2. bereits gestempelte stripe_subscription_id
 *   3. metadata.license_id am Abo (setzt Checkout beim Anlegen)
 *   4. stripe_customer_id (Checkout stempelt sie VOR dem Anlegen der Session)
 *
 * Schritt 3 und 4 sind der eigentliche Schutz gegen vertauschte Reihenfolge.
 */
async function resolveLicenseId(
  db: D1Database,
  stripe: Stripe,
  opts: { licenseId?: string; subId?: string; customerId?: string },
): Promise<string | null> {
  if (opts.licenseId) {
    const hit = await db
      .prepare("SELECT id FROM license WHERE id = ?")
      .bind(opts.licenseId)
      .first<{ id: string }>();
    if (hit) return hit.id;
  }

  if (opts.subId) {
    const bySub = await db
      .prepare("SELECT id FROM license WHERE stripe_subscription_id = ?")
      .bind(opts.subId)
      .first<{ id: string }>();
    if (bySub) return bySub.id;

    const sub = await stripe.subscriptions
      .retrieve(opts.subId)
      .catch(() => null);
    const fromMeta = sub?.metadata?.license_id;
    if (fromMeta) {
      const hit = await db
        .prepare("SELECT id FROM license WHERE id = ?")
        .bind(fromMeta)
        .first<{ id: string }>();
      if (hit) return hit.id;
    }
    if (!opts.customerId) opts.customerId = idOf(sub?.customer as never);
  }

  if (opts.customerId) {
    const byCustomer = await db
      .prepare(
        "SELECT id FROM license WHERE stripe_customer_id = ? ORDER BY created_at DESC LIMIT 1",
      )
      .bind(opts.customerId)
      .first<{ id: string }>();
    if (byCustomer) return byCustomer.id;
  }

  return null;
}

interface LicensePatch {
  type: string;
  status: string;
  subscription_status: string;
  expires_at: number | null;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  /** 'monthly' | 'annual' – aus dem Abo gelesen, nicht geraten. */
  billing_interval: string | null;
  payment_method: string | null;
  grace_seconds: number;
}

/**
 * Schreibt den Zustand, geschützt durch das Wasserzeichen (nur vorwärts) und
 * die MAX-Regel auf expires_at (CONTEXT.md): eine bereits längere Laufzeit
 * darf ein später eintreffendes Ereignis nicht verkürzen.
 */
async function applyToLicense(
  db: D1Database,
  licenseId: string,
  eventCreated: number,
  patch: LicensePatch,
) {
  const lic = await db
    .prepare(
      "SELECT id, expires_at, last_stripe_event_at FROM license WHERE id = ?",
    )
    .bind(licenseId)
    .first<{
      id: string;
      expires_at: number | null;
      last_stripe_event_at: number | null;
    }>();
  if (!lic) return;

  if (
    lic.last_stripe_event_at != null &&
    eventCreated <= lic.last_stripe_event_at
  ) {
    return; // veraltet oder wiederholt
  }

  const expires =
    patch.expires_at == null
      ? lic.expires_at
      : lic.expires_at == null
        ? patch.expires_at
        : Math.max(lic.expires_at, patch.expires_at);

  const now = nowEpoch();
  await db.batch([
    db
      .prepare(
        `UPDATE license
            SET type = ?, status = ?, subscription_status = ?, expires_at = ?,
                stripe_subscription_id = ?,
                stripe_customer_id = COALESCE(?, stripe_customer_id),
                billing_interval = COALESCE(?, billing_interval),
                payment_method = COALESCE(?, payment_method),
                grace_seconds = ?,
                last_stripe_event_at = ?, updated_at = ?
          WHERE id = ?`,
      )
      .bind(
        patch.type,
        patch.status,
        patch.subscription_status,
        expires,
        patch.stripe_subscription_id,
        patch.stripe_customer_id,
        patch.billing_interval,
        patch.payment_method,
        patch.grace_seconds,
        eventCreated,
        now,
        licenseId,
      ),
    db
      .prepare(
        "INSERT INTO license_event (id, license_id, event_type, metadata, created_at) VALUES (?, ?, 'stripe_webhook', ?, ?)",
      )
      .bind(
        newId(),
        licenseId,
        JSON.stringify({
          status: patch.status,
          subscription_status: patch.subscription_status,
          expires_at: expires,
        }),
        now,
      ),
  ]);
}
