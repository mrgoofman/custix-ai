import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { guideArticleLd, guideBreadcrumbLd, guideFaqLd } from "@/lib/guide-schema";
import { JsonLd } from "@/components/json-ld";
import { GuideArticle } from "@/components/guide-article";
import { arztbriefSchreibenMitKi as guide } from "@/content/ratgeber/arztbrief-schreiben-mit-ki";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    routeKey: guide.routeKey,
    title: guide.metaTitle,
    description: guide.description,
  });
}

export default async function ArztbriefSchreibenMitKiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tDe = await getTranslations({ locale: "de", namespace: "guides" });
  const faqLd = guideFaqLd(guide);

  return (
    <>
      <JsonLd data={guideArticleLd(guide)} />
      <JsonLd
        data={guideBreadcrumbLd(
          { home: tDe("breadcrumbHome"), guides: tDe("title") },
          guide,
        )}
      />
      {faqLd ? <JsonLd data={faqLd} /> : null}
      <GuideArticle guide={guide} locale={locale} />
    </>
  );
}
