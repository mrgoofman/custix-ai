/**
 * Datum in der aktiven Sprache: österreichisches Deutsch (27.09.2026) oder
 * britisches Englisch (27/09/2026). Eine Stelle, damit Konto, Ratgeber und
 * Mails dasselbe Format zeigen.
 */
export function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
