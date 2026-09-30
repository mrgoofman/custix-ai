-- Partner attribution (ADR-0011): through whose form the Account was created.
-- NULL == direct (/konto, desktop app). Set once by /api/partner/signup via a
-- Better Auth create hook, never updated. Kein CHECK auf die Partnerliste: die
-- lebt in src/lib/partners.ts, ein neuer Partner soll keine Migration brauchen.
-- Keine PII – bleibt bei einer DSGVO-Löschung stehen (ADR-0008).
ALTER TABLE "user" ADD COLUMN partner TEXT;
CREATE INDEX ix_user_partner ON "user"(partner) WHERE partner IS NOT NULL;
