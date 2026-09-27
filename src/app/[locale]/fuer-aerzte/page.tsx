import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata, localizedUrl } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { DoctorsPageContent } from "@/components/doctors-page-content";

/**
 * /fuer-aerzte bzw. /for-doctors (mrgoofman/custix-ai#9). Bis zum Go-live
 * (#11) verborgen: der Schlüssel steht in HIDDEN_ROUTE_KEYS (lib/seo.ts),
 * dadurch noindex und nicht in der Sitemap; in Navigation und Footer ist die
 * Seite noch nicht verlinkt.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "/fuer-aerzte", "doctors");
}

export default async function DoctorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "doctors" });
  const tMeta = await getTranslations({ locale, namespace: "pageMeta" });
  const faq = t.raw("faq.items") as { q: string; a: string }[];

  // Produkt (Web-App) und FAQ als strukturierte Daten. Preis 0, weil die
  // Web-App vorerst kostenlos ist (ADR-0010); mit der Bezahl-Phase anpassen.
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "custix",
    url: localizedUrl("/fuer-aerzte", locale),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires a current browser with WebAssembly",
    inLanguage: locale,
    description: tMeta("doctors.description"),
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <JsonLd data={softwareLd} />
      <JsonLd data={faqLd} />
      <DoctorsPageContent />
    </>
  );
}
