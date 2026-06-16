# Usage analytics: content-free, consent-at-onboarding (default-on toggle)

The desktop app will send **content-free, aggregate usage analytics** (GA4-like) so the team can
see how often the app is used and which features are used — event names + counts only
(app_launched, doc_anonymized count, reidentify_used, session length, app version, OS). **Never**
document text, entity values, filenames, or any client data.

Consent model: presented at **onboarding (first run)** as a visible toggle, **defaulted ON**, with
an explanatory note that it helps improve custix and that documents/content never leave the device.
The user can decline at onboarding.

## Why / context

- The app already makes **crash reporting opt-in, off by default** (PLAN.md, ADR-0003 "no-PII")
  and already keeps "entity-type counts, no PII text." This analytics decision extends that posture
  but is **more permissive** (default-on at onboarding rather than off). That shift must be recorded
  in the app repo too (it softens the app's prior opt-in stance).
- Boundary is load-bearing: capturing *what* was anonymized (text/entities) would betray the core
  "your documents never leave your device" promise and breach customers' Berufsverschwiegenheit.
  Only anonymous, content-free counts are permitted.

## Open items requiring Laurenz (legal) sign-off

1. **Pre-checked default validity.** Under GDPR (EU "Planet49"), pre-ticked consent for
   non-essential analytics is generally invalid consent. Default-ON at onboarding maximizes opt-in
   but is the legally weaker choice; default-OFF is bulletproof. Laurenz to decide.
2. **Label wording.** "No data leaves your PC" is true for document *content* but FALSE for the
   analytics stream (counts do leave). Use honest scoping, e.g.: "Send anonymous, content-free
   usage statistics to help improve custix. Your documents and their content never leave your
   device — only anonymous feature counts." Avoid implying nothing leaves.
3. **Pseudonymity.** If usage is tied to a license key/account it is pseudonymous personal data,
   not anonymous — needs a DSGVO legal basis and a privacy-policy entry. Prefer truly unlinked
   aggregate events where possible.

## Consequences

- App repo needs an ADR softening its opt-in stance + the onboarding consent UI.
- Backend needs a content-free analytics ingest endpoint (separate from license validation) and an
  admin view of aggregate metrics.
- Privacy policy must disclose the analytics processing and basis.
