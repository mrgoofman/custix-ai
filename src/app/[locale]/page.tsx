import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata, BASE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "/", "home");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tFaq = await getTranslations({ locale, namespace: "faq" });
  const tMeta = await getTranslations({ locale, namespace: "pageMeta" });
  const faqItems = tFaq.raw("items") as { q: string; a: string }[];

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "custix",
    url: BASE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Windows, macOS",
    browserRequirements: "Requires a current browser with WebAssembly",
    description: tMeta("home.description"),
    // Wie /fuer-aerzte: 15 €/Monat, 150 €/Jahr, inkl. USt.
    offers: [
      { unit: "MON", price: "15" },
      { unit: "ANN", price: "150" },
    ].map(({ unit, price }) => ({
      "@type": "Offer",
      price,
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency: "EUR",
        unitCode: unit,
        valueAddedTaxIncluded: true,
      },
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <JsonLd data={softwareLd} />
      <JsonLd data={faqLd} />
      <HomeContent />
    </>
  );
}
