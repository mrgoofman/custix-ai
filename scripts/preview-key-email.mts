/**
 * Schlüssel-Mail ansehen oder testweise verschicken, ohne den Worker anzuwerfen.
 *
 *   node scripts/preview-key-email.mts [ausgabeordner]
 *     schreibt alle Varianten (trial/partner/issued × de/en) als HTML-Dateien
 *     (Standard: .preview/emails, liegt im .gitignore).
 *
 *   RESEND_API_KEY=… node scripts/preview-key-email.mts --to name@example.com
 *     schickt zusätzlich die Testphasen-Mail (de und en) an diese Adresse –
 *     der „Testversand" aus der Abnahme-Checkliste.
 *
 * Braucht Node ≥ 22.18 (führt TypeScript direkt aus; die Warnung
 * MODULE_TYPELESS_PACKAGE_JSON ist harmlos). Absichtlich ohne `@/…`-Aliase:
 * das Skript läuft außerhalb von Next.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  KEY_EMAIL_FROM,
  renderKeyEmail,
  type KeyEmailInput,
} from "../src/lib/key-email.ts";

const args = process.argv.slice(2);
const toIndex = args.indexOf("--to");
const to = toIndex >= 0 ? (args[toIndex + 1] ?? null) : null;
if (toIndex >= 0 && !to) {
  console.error("--to braucht eine Empfängeradresse.");
  process.exit(1);
}
const positional = args.filter(
  (_, i) => toIndex < 0 || (i !== toIndex && i !== toIndex + 1),
);
const outDir = positional[0] ?? ".preview/emails";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://custix.ai";
const inFourteenDays = Math.floor(Date.now() / 1000) + 14 * 86400;

const variants: Array<KeyEmailInput & { file: string }> = [];
for (const locale of ["de", "en"]) {
  variants.push({
    file: `trial-${locale}.html`,
    name: locale === "de" ? "Dr. Maria Beispiel" : "Dr. Jane Example",
    key: "CUSTIX-TEST-0000-0000-0000",
    locale,
    variant: "trial",
    expiresAt: inFourteenDays,
    baseUrl,
  });
  // Partner signup (ADR-0011): Testphase ohne Web-App-Hinweis.
  variants.push({
    file: `partner-${locale}.html`,
    name: locale === "de" ? "Mag. Paul Kanzlei" : "Paul Counsel",
    key: "CUSTIX-TEST-0000-0000-0000",
    locale,
    variant: "trial",
    expiresAt: inFourteenDays,
    showWebApp: false,
    baseUrl,
  });
  variants.push({
    file: `issued-${locale}.html`,
    name: locale === "de" ? "Max Mustermann" : "Sam Sample",
    key: "CUSTIX-TEST-0000-0000-0000",
    locale,
    variant: "issued",
    baseUrl,
  });
}

mkdirSync(outDir, { recursive: true });
for (const v of variants) {
  const { subject, html } = renderKeyEmail(v);
  const path = join(outDir, v.file);
  writeFileSync(path, html);
  console.log(`${path}  (${subject})`);
}

if (to) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("--to braucht RESEND_API_KEY in der Umgebung.");
    process.exit(1);
  }
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  for (const v of variants.filter((x) => x.variant === "trial")) {
    const { subject, html } = renderKeyEmail(v);
    const res = await resend.emails.send({
      from: KEY_EMAIL_FROM,
      to,
      subject: `[Test ${v.locale}] ${subject}`,
      html,
    });
    console.log(`Testversand ${v.locale} → ${to}:`, res.error ?? res.data?.id);
  }
}
