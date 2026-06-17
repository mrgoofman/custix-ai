import Stripe from "stripe";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";

/**
 * Stripe webhook → License status/expiry (Phase 2, ADR-0007).
 *
 * STATUS: scaffold. The event→License mapping is implemented, but it is INERT
 * until Phase 2 wiring is done:
 *   - set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (wrangler secret put)
 *   - create the Stripe Products/Prices (monthly/annual; card + invoice-annual)
 *   - stamp license rows with stripe_customer_id / stripe_subscription_id at
 *     checkout so the lookups below resolve.
 * See docs/SETUP-PHASE2-STRIPE.md.
 *
 * Workers note: use constructEventAsync (Web Crypto), NOT constructEvent.
 */
export async function POST(request: Request) {
  const { env } = getCloudflareContext() as {
    env: { STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string };
  };
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe not configured", { status: 503 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`signature verification failed: ${String((e as Error).message)}`, {
      status: 400,
    });
  }

  const db = getDb();
  const eventCreated = event.created; // epoch seconds; idempotency/ordering watermark

  try {
    switch (event.type) {
      // Payment received (card OR reconciled bank transfer OR paid_out_of_band).
      case "invoice.paid": {
        // Field locations vary across Stripe API versions; read defensively.
        const inv = event.data.object as unknown as {
          subscription?: string | { id?: string };
          lines?: { data?: Array<{ period?: { end?: number } }> };
        };
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        if (subId) {
          await applyToLicenseBySub(db, subId, eventCreated, (l) => ({
            status: "active",
            subscription_status: "active",
            expires_at: inv.lines?.data?.[0]?.period?.end ?? l.expires_at,
          }));
        }
        break;
      }
      // Status changes (past_due / canceled / unpaid / active).
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as {
          id: string;
          status: string;
          current_period_end?: number;
        };
        await applyToLicenseBySub(db, sub.id, eventCreated, () => {
          const terminal = sub.status === "canceled" || sub.status === "unpaid";
          // Map to the values allowed by the license.subscription_status CHECK.
          const allowed = ["active", "trialing", "past_due", "canceled", "unpaid", "incomplete"];
          const subStatus = allowed.includes(sub.status) ? sub.status : "canceled";
          return {
            status: terminal ? "expired" : "active",
            subscription_status: subStatus,
            expires_at: sub.current_period_end ?? null,
          };
        });
        break;
      }
      default:
        // Ignore unhandled event types.
        break;
    }
  } catch (e) {
    console.error("stripe webhook handler error:", e);
    // 500 → Stripe retries; our updates are idempotent via the watermark.
    return new Response("handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

interface LicenseRow {
  id: string;
  expires_at: number | null;
  last_stripe_event_at: number | null;
}

/**
 * Apply a status change to the license bound to a Stripe subscription, guarded by
 * the advance-only watermark (last_stripe_event_at) so replays / out-of-order
 * events can't roll state backward (ADR-0007).
 */
async function applyToLicenseBySub(
  db: D1Database,
  stripeSubscriptionId: string,
  eventCreated: number,
  compute: (l: LicenseRow) => { status: string; subscription_status: string; expires_at: number | null }
) {
  const lic = await db
    .prepare(
      "SELECT id, expires_at, last_stripe_event_at FROM license WHERE stripe_subscription_id = ?"
    )
    .bind(stripeSubscriptionId)
    .first<LicenseRow>();
  if (!lic) return; // no matching license (sub created out-of-band / not yet stamped)

  if (lic.last_stripe_event_at != null && eventCreated <= lic.last_stripe_event_at) {
    return; // stale or replayed event — ignore
  }

  const next = compute(lic);
  const now = nowEpoch();
  await db.batch([
    db
      .prepare(
        "UPDATE license SET status = ?, subscription_status = ?, expires_at = ?, last_stripe_event_at = ?, updated_at = ? WHERE id = ?"
      )
      .bind(next.status, next.subscription_status, next.expires_at, eventCreated, now, lic.id),
    db
      .prepare(
        "INSERT INTO license_event (id, license_id, event_type, metadata, created_at) VALUES (?, ?, 'stripe_webhook', ?, ?)"
      )
      .bind(
        newId(),
        lic.id,
        JSON.stringify({ status: next.status, subscription_status: next.subscription_status }),
        now
      ),
  ]);
}
