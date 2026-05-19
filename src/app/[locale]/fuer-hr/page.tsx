import { setRequestLocale } from "next-intl/server";
import { FunnelPageContent } from "@/components/funnel-page-content";

export default async function HRPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FunnelPageContent audienceKey="hr" />;
}
