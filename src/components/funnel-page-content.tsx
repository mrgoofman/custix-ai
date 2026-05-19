"use client";

import { useTranslations } from "next-intl";
import { Check, X, ArrowRight } from "lucide-react";

type FunnelKey = "lawyers" | "taxAdvisors" | "hr" | "healthcare" | "insurance";

export function FunnelPageContent({ audienceKey }: { audienceKey: FunnelKey }) {
  const t = useTranslations(`funnel.${audienceKey}`);
  const pains = t.raw("pains") as string[];
  const solutions = t.raw("solutions") as string[];
  const useCases = t.raw("useCases.items") as {
    title: string;
    description: string;
  }[];

  const openSignup = () => {
    window.dispatchEvent(new CustomEvent("open-signup"));
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-amber uppercase tracking-wider mb-3">
            {t("subtitle")}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-6">
            {t("h1")}
          </h1>
          <p className="text-lg text-slate-text/80 max-w-2xl mx-auto mb-8">
            {t("intro")}
          </p>
          <button
            onClick={openSignup}
            className="px-8 py-4 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors text-lg shadow-lg shadow-royal/20"
          >
            {t("cta")}
          </button>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            {/* Problem */}
            <div className="bg-surface rounded-2xl border border-red-200/50 p-8">
              <h2 className="text-2xl font-bold font-heading text-navy mb-6">
                {t("painTitle")}
              </h2>
              <ul className="space-y-4">
                {pains.map((pain, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <X className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <span className="text-sm text-slate-text">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-surface rounded-2xl border border-green-200/50 p-8">
              <h2 className="text-2xl font-bold font-heading text-navy mb-6">
                {t("solutionTitle")}
              </h2>
              <ul className="space-y-4">
                {solutions.map((solution, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-text">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 lg:py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-heading text-navy text-center mb-12">
            {t("useCases.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <div
                key={i}
                className="bg-snow rounded-2xl border border-muted/20 p-6"
              >
                <div className="text-3xl font-bold text-royal/10 mb-2 font-heading">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-bold font-heading text-navy mb-2">
                  {uc.title}
                </h3>
                <p className="text-sm text-muted">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-heading text-white mb-4">
            {t("h1")}
          </h2>
          <p className="text-lg text-white/70 mb-8">{t("intro")}</p>
          <button
            onClick={openSignup}
            className="px-8 py-4 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors text-lg shadow-lg shadow-royal/30"
          >
            {t("cta")}
          </button>
        </div>
      </section>
    </>
  );
}
