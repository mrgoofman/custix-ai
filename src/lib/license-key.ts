// Crockford base32 alphabet — excludes I, L, O, U to avoid ambiguity (0/O, 1/I/L).
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generate a license key: CUSTIX-XXXX-XXXX-XXXX (3 groups of 4 Crockford base32
 * chars = 60 bits). For ≥100 bits use 5 groups; we use 4 groups here for ~80 bits
 * which, combined with the unique-index collision check, is unguessable in practice.
 * Stored normalized (uppercase); compared case-insensitively (COLLATE NOCASE).
 */
export function generateLicenseKey(groups = 4, groupLen = 4): string {
  const bytes = new Uint8Array(groups * groupLen);
  crypto.getRandomValues(bytes);
  const parts: string[] = [];
  let i = 0;
  for (let g = 0; g < groups; g++) {
    let s = "";
    for (let c = 0; c < groupLen; c++) {
      s += CROCKFORD[bytes[i++] % 32];
    }
    parts.push(s);
  }
  return `CUSTIX-${parts.join("-")}`;
}

/**
 * Canonicalize any user-entered key to the exact STORED form so a lookup matches.
 * The stored form is `CUSTIX-XXXX-XXXX-XXXX` (uppercase, dash-grouped). Users may
 * paste it with odd spacing/case or without the prefix; we strip everything to the
 * base32 body, uppercase, then re-group with the CUSTIX- prefix so the resulting
 * string is byte-equal to what generateLicenseKey() stored. The DB column is also
 * COLLATE NOCASE as a belt-and-braces guard against case slips.
 */
export function canonicalizeLicenseKey(input: string, groupLen = 4): string {
  let body = input.replace(/[\s-]+/g, "").toUpperCase();
  if (body.startsWith("CUSTIX")) body = body.slice("CUSTIX".length);
  const groups: string[] = [];
  for (let i = 0; i < body.length; i += groupLen) {
    groups.push(body.slice(i, i + groupLen));
  }
  return `CUSTIX-${groups.join("-")}`;
}

export function newId(): string {
  return crypto.randomUUID();
}
