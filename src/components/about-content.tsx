"use client";

import { useTranslations } from "next-intl";
import { Scale, Code2, Compass } from "lucide-react";

const teamMembers = [
  { key: "legal" as const, Icon: Scale },
  { key: "tech" as const, Icon: Code2 },
  { key: "product" as const, Icon: Compass },
];

export function AboutContent() {
  const t = useTranslations("about");

  return (
    <>
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-xl text-muted mb-6">{t("subtitle")}</p>
          <p className="text-lg text-slate-text/80 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-heading text-navy text-center mb-12">
            {t("teamTitle")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map(({ key, Icon }) => (
              <div
                key={key}
                className="bg-surface rounded-2xl border border-muted/20 p-6 text-center"
              >
                <div className="w-28 h-28 rounded-full mx-auto mb-4 border-2 border-muted/20 bg-navy/[0.03] flex items-center justify-center">
                  <Icon className="w-12 h-12 text-royal" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold font-heading text-navy">
                  {t(`team.${key}.role`)}
                </h3>
                <p className="text-sm text-muted mt-2">
                  {t(`team.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
