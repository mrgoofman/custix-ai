import type { Guide } from "./types";
import { pseudonymisierungVsAnonymisierung } from "./pseudonymisierung-vs-anonymisierung";
import { aerztlicheSchweigepflichtUndKi } from "./aerztliche-schweigepflicht-und-ki";
import { arztbriefSchreibenMitKi } from "./arztbrief-schreiben-mit-ki";

/** Alle Ratgeber in Anzeigereihenfolge (Übersicht und „Weitere Ratgeber"). */
export const GUIDES: readonly Guide[] = [
  arztbriefSchreibenMitKi,
  aerztlicheSchweigepflichtUndKi,
  pseudonymisierungVsAnonymisierung,
];

/** Veröffentlichte Ratgeber – die Übersicht unter /ratgeber zeigt nur diese. */
export function publicGuides(): readonly Guide[] {
  return GUIDES.filter((g) => !g.hidden);
}

/**
 * Die anderen Ratgeber für „Weitere Ratgeber" unter einem Artikel. Verborgene
 * Ratgeber erscheinen nur unter ebenfalls verborgenen – so lassen sich die
 * Entwürfe gegenlesen, ohne dass eine veröffentlichte Seite auf sie zeigt.
 */
export function relatedGuides(guide: Guide): readonly Guide[] {
  return GUIDES.filter(
    (g) => g.routeKey !== guide.routeKey && (!g.hidden || guide.hidden === true),
  );
}

/** Routenschlüssel der verborgenen Ratgeber – für noindex und Sitemap (lib/seo.ts). */
export function hiddenGuideRouteKeys(): string[] {
  return GUIDES.filter((g) => g.hidden).map((g) => g.routeKey);
}

/**
 * Wohin die Ratgeber-CTAs führen: bis zum Ärzte-Go-live die Registrierung auf
 * /konto, dort steht danach für alle „custix im Browser starten“
 * (mrgoofman/custix-ai#14); mrgoofman/custix-ai#11 stellt auf /fuer-aerzte um.
 * Eine Stelle, damit der Go-live nicht jeden Ratgeber anfassen muss.
 */
export const GUIDE_CTA_HREF = "/konto";
