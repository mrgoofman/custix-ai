import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { guideBreadcrumbLd } from "@/lib/guide-schema";
import { JsonLd } from "@/components/json-ld";
import { GuideIndex } from "@/components/guide-index";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "/ratgeber", "guides");
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Strukturierte Daten immer mit den deutschen Namen: kanonisch ist die DE-URL.
  const tDe = await getTranslations({ locale: "de", namespace: "guides" });

  return (
    <>
      <JsonLd
        data={guideBreadcrumbLd({ home: tDe("breadcrumbHome"), guides: tDe("title") })}
      />
      <GuideIndex locale={locale} />
    </>
  );
}
