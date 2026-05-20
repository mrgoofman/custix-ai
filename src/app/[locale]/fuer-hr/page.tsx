import { setRequestLocale } from "next-intl/server";
import { FunnelPageContent } from "@/components/funnel-page-content";
import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(locale, "hr");
}

export default async function HRPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FunnelPageContent audienceKey="hr" />;
}
