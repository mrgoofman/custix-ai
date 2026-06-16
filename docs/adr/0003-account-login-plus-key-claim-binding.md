# License binding: account login + first-entry key claim

To use the desktop app, a user logs in with any email they choose (creating/authenticating an
Account) and then enters the License key they received by email. On **first** entry the key is
**claimed** — bound to that Account (one key ↔ one Account, first-come). Thereafter the app
validates "is this Account's License active?"; a different Account entering an already-claimed
key is refused. The Admin panel can reset a claim.

We chose this over: device-fingerprint binding (rejected — the team decided to bind to the
account/email, not the machine), and key-only with no login (rejected — a bare key is freely
copyable and fails the "tied to a person, can't be shared" requirement). Login is the
anti-sharing mechanism: the key alone is useless to someone who can't log into the claiming
Account.

Recorded because it is a cross-repo contract — the desktop app (separate repo) must implement
an auth/login flow and a one-time key-claim step it does not have today — and because the
login email deliberately need NOT match the key-delivery email, which a future reader would
otherwise find surprising. Reversing it means re-releasing the app.

## Consequences

- Real Account authentication is required (e.g. Supabase Auth), used by the desktop app, not
  only the website.
- The backend owns the key→Account claim and exposes "is this Account's License active?".
- Admin must be able to reset a claim (wrong account, lost access).
