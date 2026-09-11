import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { AccountContent } from "@/components/account-content";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountContent />;
}
