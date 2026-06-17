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

## Still to BUILD (code, after the above — not done yet)
- **Checkout**: wire the pricing-page CTAs to Stripe Checkout (interval-first; invoice option only on annual). On completion, create/stamp the License with `stripe_customer_id`/`stripe_subscription_id` so the webhook can resolve it.
- **Beta→subscription flip** at first `invoice.paid` for an existing beta user (same key; MAX-expiry).
- **New-buyer mint**: fresh `type=subscription` license + key, emailed, claimed via the normal flow.
- **User self-service** (the requested features):
  - Login as end user (Better Auth — already supported).
  - **Cancel subscription**: call `stripe.subscriptions.update(id, { cancel_at_period_end: true })`; webhook flips status.
  - **Download invoices**: list the customer's invoices via Stripe API and link to each `hosted_invoice_url` / `invoice_pdf` (Stripe hosts them — no PDF generation needed).
- A `/account` page surfacing license status + cancel + invoice list.

## Note
The webhook handler verifies signatures with `constructEventAsync` (Web Crypto — required on
Workers; `constructEvent` would fail). It is idempotent via the `last_stripe_event_at` watermark.
