-- Add company name to the PII vault (person) and the Better Auth user.
-- Additive, nullable: existing rows unaffected; new signups fill it (required
-- in the forms). Lets the admin see which company a registrant belongs to and
-- ensures they're a business, not a private individual.
ALTER TABLE person ADD COLUMN company TEXT;        -- waitlist signups
ALTER TABLE "user" ADD COLUMN company TEXT;        -- in-app account creation (Better Auth additionalField)
