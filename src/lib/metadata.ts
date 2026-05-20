import type { Metadata } from "next";

const BASE_URL = "https://custix.ai";

const pathMap: Record<string, { de: string; en: string }> = {
  home: { de: "/", en: "/en" },
  lawyers: { de: "/fuer-anwaelte", en: "/en/for-lawyers" },
  taxAdvisors: { de: "/fuer-steuerberater", en: "/en/for-tax-advisors" },
  hr: { de: "/fuer-hr", en: "/en/for-hr" },
  healthcare: { de: "/fuer-gesundheitswesen", en: "/en/for-healthcare" },
  insurance: { de: "/fuer-versicherungen", en: "/en/for-insurance" },
  pricing: { de: "/preise", en: "/en/pricing" },
  about: { de: "/ueber-uns", en: "/en/about" },
  contact: { de: "/kontakt", en: "/en/contact" },
  imprint: { de: "/impressum", en: "/en/legal-notice" },
  privacy: { de: "/datenschutz", en: "/en/privacy" },
  terms: { de: "/agb", en: "/en/terms" },
};

export async function generatePageMetadata(
  locale: string,
  pageKey: string
): Promise<Metadata> {
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const seo = messages.seo?.[pageKey] ?? { title: messages.meta.title, description: messages.meta.description };
  const paths = pathMap[pageKey];
  const currentPath = paths?.[locale as "de" | "en"] ?? "/";

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}${currentPath}`,
      languages: paths
        ? { de: `${BASE_URL}${paths.de}`, en: `${BASE_URL}${paths.en}` }
        : undefined,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${BASE_URL}${currentPath}`,
      siteName: "custix.ai",
      locale: locale === "de" ? "de_DE" : "en_US",
      alternateLocale: locale === "de" ? ["en_US"] : ["de_DE"],
      type: "website",
      images: [{ url: "/icon.png", width: 512, height: 512, alt: "custix.ai" }],
    },
    twitter: {
      card: "summary",
      title: seo.title,
      description: seo.description,
      images: ["/icon.png"],
    },
  };
}
