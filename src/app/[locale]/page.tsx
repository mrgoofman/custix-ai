import { setRequestLocale } from "next-intl/server";
import { HomeContent } from "@/components/home-content";
import { OrganizationJsonLd, WebSiteJsonLd, FAQJsonLd } from "@/components/json-ld";
import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(locale, "home");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <FAQJsonLd items={messages.faq.items} />
      <HomeContent />
    </>
  );
}
