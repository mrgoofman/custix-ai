"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, ArrowRight } from "lucide-react";

export function PricingContent() {
  const t = useTranslations("pricing");
  const points = t.raw("beta.points") as string[];

  const openSignup = () => {
    window.dispatchEvent(new CustomEvent("open-signup"));
  };

  return (
    <>
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-4">
            {t("beta.title")}
          </h1>
          <p className="text-lg text-muted">{t("beta.subtitle")}</p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface rounded-2xl border border-muted/20 p-8 lg:p-10">
            <span className="inline-block px-3 py-1 mb-4 bg-royal/10 text-royal text-xs font-semibold rounded-full">
              {t("beta.badge")}
            </span>
            <h2 className="text-2xl font-bold font-heading text-navy mb-3">
              {t("beta.heading")}
            </h2>
            <p className="text-slate-text/80 mb-6">{t("beta.body")}</p>

            <ul className="space-y-3 mb-8">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-text">{p}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={openSignup}
              className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors inline-flex items-center justify-center gap-2"
            >
              {t("beta.cta")}
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-sm text-muted text-center mt-4">
              {t("beta.haveKey")}{" "}
              <Link href="/download" className="text-royal underline hover:no-underline">
                {t("beta.downloadLink")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
