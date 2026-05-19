"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Scale, Calculator, Users, Heart, ShieldCheck, ArrowRight } from "lucide-react";

const audiences = [
  { key: "lawyers" as const, href: "/fuer-anwaelte" as const, Icon: Scale },
  { key: "taxAdvisors" as const, href: "/fuer-steuerberater" as const, Icon: Calculator },
  { key: "hr" as const, href: "/fuer-hr" as const, Icon: Users },
  { key: "healthcare" as const, href: "/fuer-gesundheitswesen" as const, Icon: Heart },
  { key: "insurance" as const, href: "/fuer-versicherungen" as const, Icon: ShieldCheck },
] as const;

export function AudienceCards() {
  const t = useTranslations("audiences");

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-navy mb-3">
            {t("title")}
          </h2>
          <p className="text-lg text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map(({ key, href, Icon }) => (
            <Link
              key={key}
              href={href}
              className="group bg-surface rounded-2xl border border-muted/20 p-6 hover:shadow-lg hover:border-royal/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-royal/10 flex items-center justify-center mb-4 group-hover:bg-royal/20 transition-colors">
                <Icon className="w-5 h-5 text-royal" />
              </div>
              <h3 className="text-lg font-bold font-heading text-navy mb-1">
                {t(`${key}.title`)}
              </h3>
              <p className="text-sm text-amber font-medium mb-2">
                {t(`${key}.tagline`)}
              </p>
              <p className="text-sm text-muted mb-4">
                {t(`${key}.description`)}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-royal group-hover:gap-2 transition-all">
                {t(`${key}.cta`)}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
