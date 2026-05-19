"use client";

import { useTranslations } from "next-intl";

const pageMap = {
  imprint: { titleKey: "imprintTitle", contentKey: "imprintContent" },
  privacy: { titleKey: "privacyTitle", contentKey: "privacyContent" },
  terms: { titleKey: "termsTitle", contentKey: "termsContent" },
} as const;

export function LegalPageContent({
  pageKey,
}: {
  pageKey: keyof typeof pageMap;
}) {
  const t = useTranslations("legal");
  const { titleKey, contentKey } = pageMap[pageKey];

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-navy mb-8">
          {t(titleKey)}
        </h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-text/80">{t(contentKey)}</p>
        </div>
      </div>
    </section>
  );
}
