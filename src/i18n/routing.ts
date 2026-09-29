import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/fuer-anwaelte": {
      de: "/fuer-anwaelte",
      en: "/for-lawyers",
    },
    "/fuer-steuerberater": {
      de: "/fuer-steuerberater",
      en: "/for-tax-advisors",
    },
    "/fuer-hr": {
      de: "/fuer-hr",
      en: "/for-hr",
    },
    "/fuer-gesundheitswesen": {
      de: "/fuer-gesundheitswesen",
      en: "/for-healthcare",
    },
    // Ärzte-Landingpage (mrgoofman/custix-ai#9). Bis zum Go-live (#11)
    // verborgen: noindex, nicht in Sitemap und Navigation – siehe
    // HIDDEN_ROUTE_KEYS in lib/seo.ts.
    "/fuer-aerzte": {
      de: "/fuer-aerzte",
      en: "/for-doctors",
    },
    "/fuer-versicherungen": {
      de: "/fuer-versicherungen",
      en: "/for-insurance",
    },
    "/preise": {
      de: "/preise",
      en: "/pricing",
    },
    "/ueber-uns": {
      de: "/ueber-uns",
      en: "/about",
    },
    "/kontakt": {
      de: "/kontakt",
      en: "/contact",
    },
    "/impressum": {
      de: "/impressum",
      en: "/legal-notice",
    },
    "/datenschutz": {
      de: "/datenschutz",
      en: "/privacy",
    },
    "/agb": {
      de: "/agb",
      en: "/terms",
    },
    "/download": "/download",
    "/konto": {
      de: "/konto",
      en: "/account",
    },
    // Ratgeber gibt es nur auf Deutsch (keine EN-Recherche, siehe
    // mrgoofman/custix-ai#6). Der Pfad ist in beiden Sprachen gleich; die
    // EN-Ausgabe zeigt den deutschen Text mit noindex, siehe lib/seo.ts.
    "/ratgeber": "/ratgeber",
    "/ratgeber/pseudonymisierung-vs-anonymisierung":
      "/ratgeber/pseudonymisierung-vs-anonymisierung",
    "/ratgeber/aerztliche-schweigepflicht-und-ki":
      "/ratgeber/aerztliche-schweigepflicht-und-ki",
    "/ratgeber/arztbrief-schreiben-mit-ki": "/ratgeber/arztbrief-schreiben-mit-ki",
  },
});
