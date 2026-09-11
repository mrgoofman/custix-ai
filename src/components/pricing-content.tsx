"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, ArrowRight } from "lucide-react";

/**
 * Zwei Tarife, ein Funktionsumfang. Die jährliche Karte ist bewusst die
 * hervorgehobene: 150 € gegen 12 × 15 € sind 30 € bzw. 17 % Ersparnis, und
 * genau das steht auch dran statt nur „günstiger".
 */
function PlanCard({
  name,
  price,
  unit,
  perSeat,
  note,
  badge,
  saving,
  cta,
  featured,
  href,
}: {
  name: string;
  price: string;
  unit: string;
  perSeat: string;
  note: string;
  badge?: string;
  saving?: string;
  cta: string;
  featured?: boolean;
  /** Typisiert wie der lokalisierte Link, sonst lehnt next-intl den Pfad ab. */
  href: React.ComponentProps<typeof Link>["href"];
}) {
  return (
    <div
      className={`relative bg-surface rounded-2xl p-8 flex flex-col ${
        featured
          ? "border-2 border-royal shadow-xl shadow-royal/10"
          : "border border-muted/20"
      }`}
    >
      {badge ? (
        <span className="absolute -top-3 left-8 px-3 py-1 bg-royal text-white text-xs font-semibold rounded-full">
          {badge}
        </span>
      ) : null}

      <h2 className="text-lg font-bold font-heading text-navy mb-4">{name}</h2>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl lg:text-5xl font-bold font-heading text-navy">
          {price}
        </span>
        <span className="text-muted">{unit}</span>
      </div>
      <p className="text-sm text-muted mb-1">{perSeat}</p>
      <p className="text-sm text-slate-text/70 mb-4">{note}</p>

      {saving ? (
        <p className="text-sm font-medium text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-6">
          {saving}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      <Link
        href={href}
        className={`mt-auto w-full py-3 font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 ${
          featured
            ? "bg-royal text-white hover:bg-royal-dark"
            : "border-2 border-navy/10 text-navy hover:bg-navy/5"
        }`}
      >
        {cta}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export function PricingContent() {
  const t = useTranslations("pricing");
  const points = t.raw("points") as string[];

  return (
    <>
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-slate-text/80">{t("subtitle")}</p>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 mb-6">
            <PlanCard
              name={t("monthly.name")}
              price={t("monthly.price")}
              unit={t("monthly.unit")}
              perSeat={t("perSeat")}
              note={t("monthly.note")}
              cta={t("monthly.cta")}
              href="/konto"
            />
            <PlanCard
              featured
              name={t("annual.name")}
              price={t("annual.price")}
              unit={t("annual.unit")}
              perSeat={t("perSeat")}
              note={t("annual.note")}
              badge={t("annual.badge")}
              saving={t("annual.saving")}
              cta={t("annual.cta")}
              href="/konto"
            />
          </div>

          <p className="text-sm text-muted text-center mb-12">{t("vatNote")}</p>

          <div className="bg-surface rounded-2xl border border-muted/20 p-8">
            <h3 className="text-lg font-bold font-heading text-navy mb-5">
              {t("includes")}
            </h3>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-text">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-2xl bg-navy/[0.03] border border-navy/5 p-8">
            <h3 className="text-lg font-bold font-heading text-navy mb-3">
              {t("trial.heading")}
            </h3>
            <p className="text-slate-text/80">{t("trial.body")}</p>
          </div>

          <p className="text-sm text-muted text-center mt-8">
            {t("haveKey")}{" "}
            <Link href="/download" className="text-royal underline hover:no-underline">
              {t("downloadLink")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
