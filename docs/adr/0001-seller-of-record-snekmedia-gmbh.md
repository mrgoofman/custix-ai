# Seller-of-record for custix subscriptions is snekmedia GmbH

The connected Stripe account is **snekmedia GmbH** (`acct_1ThUYkRzSfInmwUA`), not a
"custix" entity or a founder entity. We decided snekmedia GmbH is the intended
seller-of-record: its legal name, UID/VAT, Firmenbuch/registration, registered address,
and IBAN will appear on Stripe-issued invoices and must match the website's Impressum.

This is recorded because the seller (snekmedia GmbH) differs from the product brand
(custix.ai) and from the founders — a future reader will reasonably wonder why payments
flow to a differently-named company. It is hard to reverse: invoices are legal commercial
documents, and re-issuing finalized invoices under a different entity is costly and erodes
trust with the lawyer/tax-advisor audience who scrutinize invoices closely.

## Consequences

- Before billing launches, the site's currently-placeholder Impressum, Datenschutz, and
  AGB must be completed with snekmedia GmbH's real legal details and kept consistent with
  Stripe's invoice/branding settings.
- If snekmedia GmbH is later judged the *wrong* seller, the Stripe account, invoice
  branding, and all legal pages must change together — treat that as a deliberate migration,
  not an incremental edit.
