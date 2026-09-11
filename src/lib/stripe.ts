import Stripe from "stripe";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Interval = "monthly" | "annual";

type StripeEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_MONTHLY?: string;
  STRIPE_PRICE_ANNUAL?: string;
  NEXT_PUBLIC_BASE_URL?: string;
};

export function stripeEnv(): StripeEnv {
  const { env } = getCloudflareContext() as { env: StripeEnv };
  return env;
}

/**
 * Stripe-Client oder null, wenn der Schlüssel fehlt. Aufrufer antworten dann
 * mit 503 statt zu werfen – so bleibt die Seite benutzbar, solange Billing
 * noch nicht scharfgeschaltet ist.
 */
export function getStripe(env: StripeEnv): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export function priceIdFor(env: StripeEnv, interval: Interval): string | undefined {
  return interval === "annual" ? env.STRIPE_PRICE_ANNUAL : env.STRIPE_PRICE_MONTHLY;
}

export function baseUrl(env: StripeEnv): string {
  return env.NEXT_PUBLIC_BASE_URL ?? "https://custix.ai";
}
