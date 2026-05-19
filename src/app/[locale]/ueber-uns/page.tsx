import { setRequestLocale } from "next-intl/server";
import { AboutContent } from "@/components/about-content";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutContent />;
}
