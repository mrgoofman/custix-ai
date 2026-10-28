import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { WelcomeContent } from "@/components/welcome-content";

// Persönliche Seite hinter dem Bestätigungslink (#15): nie indexieren.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WelcomeContent />;
}
