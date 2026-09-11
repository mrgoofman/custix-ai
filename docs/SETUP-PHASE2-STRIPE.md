# Phase 2 — Stripe (billing) setup & remaining work

Phase 2 turns the publicly-shown subscription into real billing. The schema already has the
seams (`stripe_customer_id`, `stripe_subscription_id`, `billing_interval`, `payment_method`,
`subscription_status`, `last_stripe_event_at`) and the **webhook handler is scaffolded**
(`src/app/api/stripe/webhook/route.ts`, implements ADR-0007 event→License mapping). It is INERT
until the steps below are done.

## Decisions already locked (CONTEXT.md / ADRs)
- Seller of record: **snekmedia GmbH** (ADR-0001) — invoices carry its legal data.
- Buyable options: **Monthly+Card, Annual+Card, Annual+Invoice** (invoice = annual only).
- Webhooks drive License status; listen to **`invoice.paid`** (+ `customer.subscription.updated/deleted`). Auto-reconciled bank transfers fire `invoice.paid` too (ADR-0007).
- Grace: card 7d, invoice 30d (CONTEXT policy values).
- Beta→paid keeps the SAME key; type flips beta→subscription, `expires_at = MAX(beta, period_end)`.

## You must do (Stripe account — can't be done from code)
1. In the **snekmedia GmbH** Stripe account, create Products + recurring Prices:
   - Monthly (card), Annual (card), Annual (invoice/bank-transfer via `collection_method=send_invoice` + `customer_balance`).
2. Set the company legal details + IBAN payout in Stripe (invoices show these).
3. Enable bank-transfer as an invoice payment method (Settings → Billing → Invoices).
4. Create a webhook endpoint → `https://custix.ai/api/stripe/webhook`, subscribe to
   `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
5. Set secrets:
   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

## BUILT (2026-09)

- **Checkout** — `src/app/api/stripe/checkout/route.ts`. Card only; interval
  chosen by the caller. Stamps `stripe_customer_id` and `billing_interval`
  BEFORE creating the session so the webhook can always resolve the license.
- **Trial** — `src/app/api/trial/start/route.ts`. 14 days, `grace_seconds = 0`,
  key emailed, `person` row written (ADR-0008).
- **Webhook** — resolves the license by client_reference_id → stamped
  subscription id → subscription `metadata.license_id` → customer id, so event
  ORDER DOES NOT MATTER. Writes `subscription_status`, `grace_seconds` (card:
  7d), `billing_interval`, `payment_method`, and applies the MAX rule to
  `expires_at`.
- **Self-service** — `/konto` (`src/components/account-content.tsx`) with status,
  key, checkout buttons and the **Stripe Billing Portal** for cancel + invoices.

  Deviation from the plan below: the portal replaces a hand-built cancel button
  and invoice list. Stripe already renders invoices with correct VAT, reverse
  charge and company details; rebuilding that means rendering a legal document
  ourselves.

### Additional Stripe-account steps this created
6. Create both Prices with **`tax_behavior: inclusive`** — prices are advertised
   including VAT. With Stripe's default (`exclusive`) plus `automatic_tax`, a
   customer would be charged 180 € instead of 150 €.
7. Enable **Stripe Tax**.
8. Configure the **Customer Portal** once (Settings → Billing → Customer Portal),
   otherwise "Abo verwalten" errors.
9. Subscribe the webhook to **four** events: `checkout.session.completed`
   (without it nothing else resolves), `invoice.paid`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
10. Set `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` in `wrangler.jsonc`.

## Still to BUILD
- **Invoice / bank-transfer payment (annual only)** — `collection_method=send_invoice`
  + `customer_balance`. Not built; checkout is card-only. ADR-0007's
  auto-reconciliation is therefore not in effect yet.
- **Beta→subscription flip for existing beta users**: works through the same
  webhook path, but has not been exercised against a real beta license.

## Note
The webhook handler verifies signatures with `constructEventAsync` (Web Crypto — required on
Workers; `constructEvent` would fail). It is idempotent via the `last_stripe_event_at` watermark.
