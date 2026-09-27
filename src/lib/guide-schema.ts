import { BASE_URL, localizedUrl } from "@/lib/seo";
import { plainText } from "@/lib/inline-markup";
import type { Guide } from "@/content/ratgeber/types";

/**
 * Strukturierte Daten der Ratgeber (mrgoofman/custix-ai#6): Article und
 * BreadcrumbList auf jeder Seite, FAQPage, wo es einen FAQ-Teil gibt. Alle
 * URLs sind die kanonischen deutschen, auch wenn die Seite unter /en/ gerendert
 * wird – dort ist sie ohnehin noindex.
 */
const publisher = {
  "@type": "Organization",
  name: "custix",
  url: BASE_URL,
  logo: { "@type": "ImageObject", url: `${BASE_URL}/icon.png` },
};

/** Brotkrumen Start → Ratgeber → (Artikel). `labels` sind die deutschen Namen. */
export function guideBreadcrumbLd(
  labels: { home: string; guides: string },
  guide?: Guide,
): Record<string, unknown> {
  const crumbs = [
    { name: labels.home, routeKey: "/" },
    { name: labels.guides, routeKey: "/ratgeber" },
    ...(guide ? [{ name: guide.title, routeKey: guide.routeKey }] : []),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: localizedUrl(c.routeKey, "de"),
    })),
  };
}

export function guideArticleLd(guide: Guide): Record<string, unknown> {
  const url = localizedUrl(guide.routeKey, "de");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "de",
    datePublished: guide.published,
    dateModified: guide.updated,
    author: { "@type": "Organization", name: "custix", url: BASE_URL },
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${BASE_URL}/og-image.png`,
  };
}

export function guideFaqLd(guide: Guide): Record<string, unknown> | null {
  if (guide.faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: plainText(item.a) },
    })),
  };
}
