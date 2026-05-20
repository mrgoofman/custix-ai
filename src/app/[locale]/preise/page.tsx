import { setRequestLocale } from "next-intl/server";
import { PricingContent } from "@/components/pricing-content";
import { SoftwareApplicationJsonLd } from "@/components/json-ld";
import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(locale, "pricing");
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SoftwareApplicationJsonLd locale={locale} />
      <PricingContent />
    </>
  );
}
