# Single License is the desktop app's entitlement contract

The desktop app (separate repo, `znerol74/custix-releases`) validates entitlement by asking
the backend about **one License key** for its entire lifetime — e.g.
`GET /api/license/validate?key=…` → `{ valid, type, expires }`. A License has a `type`
(`beta` | `trial` | `subscription`) and a `status`/`expiry` that change underneath; the app's
validation call never changes as a user moves beta → trial → paid. Stripe webhooks update the
License's status and expiry when the underlying Subscription changes. The app never talks to
Stripe directly.

We chose this over (a) making the app switch from key-validation to live Stripe-subscription
checks after conversion, and (b) keeping the beta key and the subscription as two coexisting
rows to reconcile.

This is recorded because it is a cross-repo integration contract that is expensive to reverse:
changing what the app validates against requires shipping a new desktop build — and the worst
time to do that is mid-conversion, exactly when option (a) would force it. A stable, lifelong
"validate this key" contract lets the backend evolve (beta, trial, billing) without ever
re-releasing the app for entitlement reasons.

## Validate endpoint response contract (frozen once the app ships)

```jsonc
{
  "valid": true,                 // ONLY an explicit false locks the app
  "type": "subscription",        // beta | trial | subscription
  "status": "active",            // active | expired | revoked | claimed_elsewhere
  "expires": "2027-06-16",       // ISO date; app enforces locally between monthly checks
  "grace_until": "2027-07-16",   // app keeps working until here even when offline
  "message_key": "renewal_due"   // optional i18n key for a user-facing reason
}
```

**Resilience rule (load-bearing):** the app treats any network failure / non-200 / unparseable
response as "keep working until `grace_until`," NEVER as invalid. Only an explicit `valid:false`
from the server locks the app. This ensures a backend outage or Stripe-webhook hiccup cannot
lock out paying users en masse.

## Consequences

- The backend owns the mapping from Stripe Subscription status → License status/expiry; the
  app stays ignorant of Stripe.
- "Beta key" is not a separate concept — it is a License with `type=beta`.
- The validate response shape above is a published contract between this repo and the
  desktop-app repo; treat changes to it as breaking. The app must implement the resilience rule.
