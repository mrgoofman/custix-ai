import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format-date";
import { GUIDES } from "@/content/ratgeber";
import { Breadcrumb } from "./breadcrumb";

/** Übersicht aller Ratgeber unter /ratgeber. */
export async function GuideIndex({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guides" });

  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb home={t("breadcrumbHome")} guides={t("title")} />
        <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-slate-text/80">{t("indexIntro")}</p>

        <ul className="mt-10 space-y-4">
          {GUIDES.map((g) => (
            <li key={g.routeKey}>
              <Link
                href={g.routeKey}
                lang="de"
                className="group block rounded-2xl border border-muted/20 bg-surface p-6 sm:p-8 hover:border-royal/40 transition-colors"
              >
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-navy group-hover:text-royal transition-colors">
                  {g.title}
                </h2>
                <p className="mt-3 text-slate-text/80">{g.teaser}</p>
                <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span>{t("updated", { date: formatDate(new Date(g.updated), locale) })}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4" aria-hidden />
                    {t("readingTime", { minutes: g.readingMinutes })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-royal font-semibold">
                    {t("readGuide")}
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
