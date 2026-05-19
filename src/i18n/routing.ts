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
  },
});
