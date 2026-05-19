"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

export function PricingContent() {
  const t = useTranslations("pricing");
  const soloFeatures = t.raw("solo.features") as string[];
  const teamFeatures = t.raw("team.features") as string[];

  const openSignup = () => {
    window.dispatchEvent(new CustomEvent("open-signup"));
  };

  return (
    <>
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-muted">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Solo */}
            <div className="bg-surface rounded-2xl border border-muted/20 p-8 flex flex-col">
              <h2 className="text-2xl font-bold font-heading text-navy mb-1">
                {t("solo.name")}
              </h2>
              <p className="text-sm text-muted mb-6">{t("solo.description")}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-navy">
                  {t("solo.price")}
                </span>
                <span className="text-muted">{t("perMonth")}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {soloFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-text">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={openSignup}
                className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors"
              >
                {t("cta")}
              </button>
              <p className="text-xs text-muted text-center mt-3">
                {t("trial")}
              </p>
            </div>

            {/* Team */}
            <div className="bg-surface rounded-2xl border-2 border-royal p-8 flex flex-col relative">
              <div className="absolute -top-3 left-8 px-3 py-1 bg-royal text-white text-xs font-semibold rounded-full">
                Popular
              </div>
              <h2 className="text-2xl font-bold font-heading text-navy mb-1">
                {t("team.name")}
              </h2>
              <p className="text-sm text-muted mb-6">{t("team.description")}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-navy">
                  {t("team.price")}
                </span>
                <span className="text-muted">
                  {t("perMonth")} {t("team.priceNote")}
                </span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {teamFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-text">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={openSignup}
                className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors"
              >
                {t("cta")}
              </button>
              <p className="text-xs text-muted text-center mt-3">
                {t("trial")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
