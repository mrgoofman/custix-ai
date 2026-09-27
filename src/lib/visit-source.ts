/**
 * Herkunft eines Besuchs, für die Dauer der Browser-Sitzung gemerkt.
 *
 * Bisher ändert genau eine Herkunft etwas: Wer über die Ärzte-Seite kommt, wird
 * im Konto nach der Praxis statt nach der Kanzlei gefragt, kommt nach
 * Registrierung oder Anmeldung direkt in die Web-App und sieht sonst
 * „Im Browser starten" als Hauptaktion und den Download nur als Alternative –
 * Praxis-Rechner erlauben oft keine Installation (mrgoofman/custix-ai#12).
 * Alle anderen behalten die bisherige Gewichtung (Download zuerst).
 *
 * Gesetzt wird die Herkunft von der Ärzte-Seite selbst (mrgoofman/custix-ai#9,
 * `rememberVisitSource("doctors")`) oder über `/konto?from=doctors`, damit auch
 * Links aus Anzeigen und Mails sie mitgeben können und ein in neuem Tab
 * geöffneter Link sie nicht verliert.
 *
 * sessionStorage statt localStorage: Die Gewichtung soll nur für den Besuch
 * gelten, der auf der Ärzte-Seite begann, nicht dauerhaft am Gerät kleben.
 *
 * „VisitSource" statt „Origin", weil `origin` im Browser schon die
 * Same-Origin-Herkunft (`location.origin`) meint.
 */
export type VisitSource = "doctors";

const STORAGE_KEY = "custix-visit-source";
/** Name des Query-Parameters, z. B. `/konto?from=doctors`. */
export const VISIT_SOURCE_PARAM = "from";

function asVisitSource(value: string | null): VisitSource | null {
  return value === "doctors" ? "doctors" : null;
}

export function rememberVisitSource(source: VisitSource) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, source);
  } catch {
    // Privater Modus oder gesperrter Speicher: dann gilt die Standardgewichtung.
  }
}

function readVisitSource(): VisitSource | null {
  try {
    return asVisitSource(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Herkunft aus einem Query-String (`?from=doctors`), sonst null. */
export function visitSourceFromSearch(search: string): VisitSource | null {
  return asVisitSource(new URLSearchParams(search).get(VISIT_SOURCE_PARAM));
}

/**
 * Herkunft dieses Aufrufs: Query-Parameter vor gemerktem Wert. Nur im Browser
 * aufrufen (z. B. als Snapshot für useSyncExternalStore, serverseitig null).
 */
export function currentVisitSource(): VisitSource | null {
  return visitSourceFromSearch(window.location.search) ?? readVisitSource();
}
