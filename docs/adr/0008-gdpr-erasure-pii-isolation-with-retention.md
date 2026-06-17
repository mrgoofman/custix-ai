# GDPR erasure = anonymize isolated PII, retain License & invoice records

Personal data (name, email, profession) is isolated to the fewest possible columns/tables. A
DSGVO right-to-erasure request **anonymizes/nulls** that PII but **retains** the License row
(key, type, status, dates) and all billing/invoice references, with the data subject
de-identified (linked only by an opaque, non-personal id). Admin audit entries keep the actor
but de-identify the subject.

Chosen over hard-delete-cascade (which would destroy records we are legally required to keep)
and over deferring the design to Phase 2. AT/DE tax law requires invoices (issued by snekmedia
GmbH) be retained ~7–10 years, so we cannot delete a paying customer's billing trail; but we
must honor erasure of personal data. Isolating PII makes both possible.

Recorded because it is hard to reverse (it shapes where every personal field lives from day one;
retrofitting PII isolation after real users/payments exist is exactly the migration we want to
avoid), surprising without context (a reader sees erasure "keep" the License and would wonder
why), and a genuine trade-off (erasure vs. legal retention).

## Consequences

- The D1 schema must keep name/email/profession in a narrow, clearly-marked location, with the
  License/billing referencing the Account by an opaque id, not by embedding PII.
- An erasure routine anonymizes PII in place rather than deleting rows that carry legal/entitlement
  meaning.
- Privacy policy / AVV must state the retention basis (tax law) for kept invoice data.
- Applies even in beta (waitlist entries carry name/email/profession) — not just post-billing.
