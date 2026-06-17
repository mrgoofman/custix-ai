# Stripe webhooks drive License status — including auto-tracked bank transfers (Phase 2)

License entitlement is updated automatically from Stripe webhooks; no one manually checks bank
statements or invoice status. This holds for both card payments and **bank-transfer (invoice)
payments**, which is what makes the "annual + invoice payment" option viable without manual
accounts-receivable work.

## Mechanism (verified against Stripe docs)

- Invoice-payment subscriptions use `collection_method=send_invoice` with `customer_balance` /
  bank-transfer. Stripe issues a virtual IBAN per customer and **auto-reconciles** incoming
  transfers to the matching invoice (by reference/amount).
- On successful payment (card OR reconciled transfer OR a manual `paid_out_of_band`), Stripe
  fires **`invoice.paid`** → backend sets the License `active` and extends `expires`.
  Listen to `invoice.paid` (not `invoice.payment_succeeded`) so manual reconciliation is covered.
- On non-payment by due date, the subscription goes `past_due` → then `canceled` or `unpaid`
  (per Dashboard setting). Listen to `customer.subscription.updated` / `invoice.payment_failed`
  → backend sets the License `expired`. The app enforces this at its next monthly check.

## Consequences

- The backend needs a verified Stripe webhook endpoint mapping events → License status/expiry;
  this is the single source of truth feeding the validate endpoint (ADR-0002).
- Idempotency + signature verification on the webhook are required (standard Stripe practice).
- Invoice-payment is operationally hands-off; the only manual case is a transfer Stripe can't
  auto-reconcile (rare), handled via Dashboard.
- Phase 2 only; not built until billing is in scope.
