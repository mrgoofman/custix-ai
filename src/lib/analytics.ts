/**
 * Ereignisse an GA4 – ausschließlich nach Einwilligung über den Cookie-Banner
 * (components/cookie-consent.tsx lädt gtag nur, wenn die Einwilligung im
 * localStorage steht). Ohne Einwilligung gibt es kein `window.gtag`, und
 * trackEvent tut nichts. Es werden nie Inhalte übertragen, nur der Name des
 * Ereignisses und grobe Parameter – dieselbe Linie wie ADR-0009 für die App.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** localStorage-Schlüssel und Wert der Einwilligung, geteilt mit dem Banner. */
export const CONSENT_STORAGE_KEY = "cookie-consent";
export const CONSENT_ACCEPTED = "accepted";

/** Alle Ereignisnamen an einer Stelle: nur Namen, keine Inhalte. */
export type AnalyticsEvent = "doctors_cta_click";

export function hasAnalyticsConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_ACCEPTED;
  } catch {
    // Kein Speicherzugriff (privater Modus): dann eben keine Messung.
    return false;
  }
}

export function trackEvent(
  name: AnalyticsEvent,
  params: Record<string, string | number | boolean> = {},
) {
  if (!hasAnalyticsConsent()) return;
  window.gtag?.("event", name, params);
}
