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
    operatingSystem: "Windows",
    description: tMeta("home.description"),
    offers: {
      "@type": "Offer",
      price: "49",
      priceCurrency: "EUR",
    },
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
