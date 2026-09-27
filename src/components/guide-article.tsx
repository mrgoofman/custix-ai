import { getTranslations } from "next-intl/server";
import { ChevronDown, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format-date";
import { RichText } from "./rich-text";
import { Breadcrumb } from "./breadcrumb";
import { GUIDE_CTA_ROUTE, relatedGuides } from "@/content/ratgeber";
import type { Guide, GuideBlock } from "@/content/ratgeber/types";

/**
 * Darstellung eines Ratgebers (mrgoofman/custix-ai#6). Server-Komponente:
 * kein Zustand, die FAQ klappt über <details> ohne JavaScript auf.
 *
 * Der Artikel ist deutsch, auch unter /en/… (dort noindex, siehe lib/seo.ts);
 * deshalb `lang="de"` am Artikel und ein Hinweis für englische Besucher.
 */
export async function GuideArticle({
  guide,
  locale,
}: {
  guide: Guide;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "guides" });
  const others = relatedGuides(guide);

  return (
    <>
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-12 pb-10 lg:pt-16 lg:pb-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            home={t("breadcrumbHome")}
            guides={t("title")}
            current={guide.title}
          />
          {/* Überschrift und Teaser sind deutsch, auch unter /en/… */}
          <h1
            lang="de"
            className="mt-6 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-heading text-navy leading-tight"
          >
            {guide.title}
          </h1>
          <p lang="de" className="mt-4 text-lg text-slate-text/80">
            {guide.teaser}
          </p>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>{t("byline")}</span>
            <span>
              {t("updated", { date: formatDate(new Date(guide.updated), locale) })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden />
              {t("readingTime", { minutes: guide.readingMinutes })}
            </span>
          </p>
        </div>
      </section>

      <article lang="de" className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {locale !== "de" ? (
            <p
              lang={locale}
              className="mb-8 rounded-xl bg-amber-light text-navy text-sm px-4 py-3"
            >
              {t("germanOnly")}
            </p>
          ) : null}

          {guide.intro.map((text, i) => (
            <p key={i} className="mb-5 text-lg leading-relaxed text-slate-text/90">
              <RichText text={text} />
            </p>
          ))}

          <nav
            aria-label={t("toc")}
            className="my-10 rounded-2xl bg-surface border border-muted/20 p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
              {t("toc")}
            </p>
            <ol className="space-y-2">
              {guide.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-navy hover:text-royal transition-colors"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
              {guide.faq.length ? (
                <li>
                  <a href="#faq" className="text-navy hover:text-royal transition-colors">
                    {t("faqTitle")}
                  </a>
                </li>
              ) : null}
            </ol>
          </nav>

          {guide.sections.map((s) => (
            <section key={s.id} className="mt-12 first:mt-0">
              <h2
                id={s.id}
                className="scroll-mt-24 text-2xl sm:text-3xl font-bold font-heading text-navy mb-5"
              >
                {s.heading}
              </h2>
              {s.blocks.map((b, i) => (
                <Block key={i} block={b} before={t("before")} after={t("after")} />
              ))}
            </section>
          ))}

          {guide.faq.length ? (
            <section className="mt-14">
              <h2
                id="faq"
                className="scroll-mt-24 text-2xl sm:text-3xl font-bold font-heading text-navy mb-6"
              >
                {t("faqTitle")}
              </h2>
              <div className="space-y-3">
                {guide.faq.map((item) => (
                  <details
                    key={item.q}
                    className="group bg-surface rounded-xl border border-muted/20"
                  >
                    <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-navy">
                      {item.q}
                      <ChevronDown
                        className="w-5 h-5 text-muted shrink-0 transition-transform duration-200 group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="px-6 pb-5 text-sm text-slate-text/80 leading-relaxed">
                      <RichText text={item.a} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <p className="mt-12 text-sm text-muted border-t border-muted/20 pt-6">
            {t("disclaimer")}
          </p>
        </div>
      </article>

      {others.length ? (
        <section className="py-12 lg:py-16 bg-surface border-t border-muted/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold font-heading text-navy mb-6">
              {t("moreGuides")}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {others.map((g) => (
                <li key={g.routeKey}>
                  <Link
                    href={g.routeKey}
                    className="block h-full rounded-2xl border border-muted/20 bg-snow p-6 hover:border-royal/40 transition-colors"
                  >
                    <span className="block font-bold font-heading text-navy">
                      {g.title}
                    </span>
                    <span className="mt-2 block text-sm text-muted">{g.teaser}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="bg-navy py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold font-heading text-white mb-4">
            {t("cta.heading")}
          </h2>
          <p className="text-lg text-white/70 mb-8">{t("cta.text")}</p>
          <Link
            href={GUIDE_CTA_ROUTE}
            className="inline-block px-8 py-4 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors text-lg shadow-lg shadow-royal/30"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>
    </>
  );
}

function Block({
  block,
  before,
  after,
}: {
  block: GuideBlock;
  before: string;
  after: string;
}) {
  switch (block.type) {
    case "p":
      return (
        <p className="mb-5 leading-relaxed text-slate-text/90">
          <RichText text={block.text} />
        </p>
      );
    case "ul":
    case "ol": {
      const List = block.type === "ul" ? "ul" : "ol";
      return (
        <List
          className={`mb-6 space-y-3 pl-6 leading-relaxed text-slate-text/90 ${
            block.type === "ul" ? "list-disc" : "list-decimal"
          } marker:text-royal marker:font-semibold`}
        >
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <RichText text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "table":
      return (
        <div className="my-8 rounded-2xl border border-muted/20 bg-surface overflow-hidden">
          {/* Auf schmalen Bildschirmen (375 px) passen drei Spalten nicht
              nebeneinander: dort wird jede Zeile zu einem Block mit den
              Spaltenüberschriften als Beschriftung. */}
          <div className="sm:hidden divide-y divide-muted/20">
            {block.rows.map((row, r) => (
              <div key={r} className="p-4">
                <p className="font-semibold text-navy mb-2">
                  <RichText text={row[0]} />
                </p>
                <dl className="space-y-2 text-sm">
                  {row.slice(1).map((cell, c) => (
                    <div key={c}>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {block.head[c + 1]}
                      </dt>
                      <dd className="text-slate-text/90">
                        <RichText text={cell} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <table className="hidden sm:table w-full text-sm border-collapse">
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="bg-navy/5 px-4 py-3 text-left font-semibold text-navy"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={`px-4 py-3 border-t border-muted/20 align-top ${
                        c === 0 ? "font-semibold text-navy" : "text-slate-text/90"
                      }`}
                    >
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <div className="my-8 rounded-2xl border border-royal/20 bg-royal/5 p-6">
          {block.title ? (
            <p className="font-bold font-heading text-navy mb-2">{block.title}</p>
          ) : null}
          <p className="leading-relaxed text-slate-text/90">
            <RichText text={block.text} />
          </p>
        </div>
      );
    case "example":
      return (
        <figure className="my-8 rounded-2xl border border-muted/20 bg-surface overflow-hidden">
          <figcaption className="px-6 py-3 bg-navy/5 text-sm font-semibold text-navy">
            {block.title}
          </figcaption>
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-muted/20">
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {before}
              </p>
              <p className="text-sm leading-relaxed text-slate-text/90">
                {block.before}
              </p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {after}
              </p>
              <p className="text-sm leading-relaxed text-slate-text/90">
                <Placeholders text={block.after} />
              </p>
            </div>
          </div>
          {block.note ? (
            <p className="px-6 py-4 border-t border-muted/20 text-sm text-muted leading-relaxed">
              <RichText text={block.note} />
            </p>
          ) : null}
        </figure>
      );
  }
}

/** Platzhalter wie [Person 1] farblich hervorheben, wie in der App. */
function Placeholders({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((part, i) =>
        /^\[[^\]]+\]$/.test(part) ? (
          <mark
            key={i}
            className="rounded px-1 bg-highlight-person text-navy font-medium"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
