import type { Guide } from "./types";
import { pseudonymisierungVsAnonymisierung } from "./pseudonymisierung-vs-anonymisierung";

/** Alle Ratgeber in Anzeigereihenfolge (Übersicht und „Weitere Ratgeber"). */
export const GUIDES: readonly Guide[] = [pseudonymisierungVsAnonymisierung];

/** Die anderen Ratgeber – für „Weitere Ratgeber" unter einem Artikel. */
export function relatedGuides(guide: Guide): readonly Guide[] {
  return GUIDES.filter((g) => g.routeKey !== guide.routeKey);
}

/**
 * Wohin die Ratgeber-CTAs führen. Bis zum Ärzte-Go-live die Registrierung;
 * mrgoofman/custix-ai#11 stellt auf /fuer-aerzte um. Eine Stelle, damit der
 * Go-live nicht jeden Ratgeber anfassen muss.
 */
export const GUIDE_CTA_ROUTE = "/konto" as const;
