"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Download,
  EyeOff,
  FileScan,
  Globe,
  HardDrive,
  MessageSquareLock,
  Play,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BatchPreview } from "./batch-preview";
import { FaqAccordion } from "./faq-accordion";
import { rememberVisitSource } from "@/lib/visit-source";
import { trackEvent } from "@/lib/analytics";

/**
 * Ärzte-Landingpage (mrgoofman/custix-ai#9, Spec #5). Eigene Seite statt der
 * generischen Branchenvorlage: Stapel-Vorschau, Ablauf bis zum Arztbrief,
 * Vertrauensteil und FAQ sind ärztespezifisch.
 *
 * Entscheidung vom 27.09.2026: Die Web-App ist vorerst kostenlos (nur Login,
 * znerol74/custix#39). Deshalb kein Preis-Teaser, sondern „Derzeit kostenlos",
 * und der CTA führt direkt in die Web-App.
 *
 * Rechtliche Leitplanken (Spec #5): keine absolute DSGVO-Aussage – deshalb
 * nicht die geteilten Trust-Badges („vollständig konform") –, „pseudonymisiert"
 * wo es um die Zuordnung geht, kein Anschein eines Medizinprodukts.
 *
 * Zur Freigabe durch Laurenz markiert (messages/de.json und en.json): alle
 * Sätze, die Schweigepflicht oder Datenschutz berühren – pageMeta.doctors
 * (Title, Description), doctors.h1, doctors.intro, doctors.trust.items[1],
 * doctors.faq.items[0] (anonym vs. pseudonymisiert), doctors.faq.items[2],
 * doctors.faq.items[4] (§ 54 ÄrzteG, § 203 StGB, Art. 9 DSGVO) und
 * doctors.bottom.title.
 */
const TRUST_ICONS = [Globe, HardDrive, MessageSquareLock, Download] as const;

type CtaPosition = "hero" | "free" | "bottom";

/**
 * Haupt-CTA: führt direkt in die Web-App, wo Registrierung und Anmeldung
 * stattfinden. Das Klick-Ereignis geht nur mit GA4-Einwilligung raus und
 * enthält keine Inhalte, nur die Position auf der Seite (lib/analytics.ts).
 */
function StartCta({ position, className = "" }: { position: CtaPosition; className?: string }) {
  const t = useTranslations("doctors");
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- /app ist die statische Web-App, keine Next-Seite (siehe next.config.ts).
    <a
      href="/app/"
      onClick={() => trackEvent("doctors_cta_click", { position })}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors text-lg shadow-lg shadow-royal/20 ${className}`}
    >
      <Play className="w-5 h-5" aria-hidden />
      {t("cta")}
    </a>
  );
}

export function DoctorsPageContent() {
  const t = useTranslations("doctors");

  // Herkunft für die Sitzung merken: Wer später auf /konto landet, sieht
  // „Im Browser starten" als Hauptaktion (#7).
  useEffect(() => {
    rememberVisitSource("doctors");
  }, []);

  const removed = t.raw("redaction.removed") as string[];
  const kept = t.raw("redaction.kept") as string[];
  const steps = t.raw("flow.steps") as { title: string; description: string }[];
  const trust = t.raw("trust.items") as { title: string; description: string }[];
  const faq = t.raw("faq.items") as { q: string; a: string }[];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-amber uppercase tracking-wider mb-3">
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-6">
            {t("h1")}
          </h1>
          <p className="text-lg text-slate-text/80 max-w-2xl mx-auto mb-8">{t("intro")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <StartCta position="hero" />
            <a
              href="#ablauf"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-navy/10 text-navy font-semibold rounded-xl hover:bg-navy/5 transition-colors text-lg"
            >
              {t("secondaryCta")}
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">{t("ctaNote")}</p>
        </div>
      </section>

      {/* Stapel-Vorschau */}
      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading text-navy mb-3">
              {t("preview.title")}
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">{t("preview.subtitle")}</p>
          </div>
          <BatchPreview />
        </div>
      </section>

      {/* Geschwärzt / bleibt */}
      <section className="py-16 lg:py-20 bg-surface border-y border-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-heading text-navy text-center mb-12">
            {t("redaction.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="rounded-2xl border border-muted/20 bg-snow p-8">
              <h3 className="text-xl font-bold font-heading text-navy mb-6 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-royal" aria-hidden />
                {t("redaction.removedTitle")}
              </h3>
              <ul className="space-y-3">
                {removed.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="shrink-0 mt-0.5 rounded px-1.5 text-xs font-mono font-semibold bg-highlight-person text-navy">
                      [ ]
                    </span>
                    <span className="text-slate-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-green-200/60 bg-snow p-8">
              <h3 className="text-xl font-bold font-heading text-navy mb-6 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" aria-hidden />
                {t("redaction.keptTitle")}
              </h3>
              <ul className="space-y-3">
                {kept.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-green-600" aria-hidden />
                    </span>
                    <span className="text-slate-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-8 max-w-3xl mx-auto text-center text-sm text-muted">
            {t("redaction.dateNote")}
          </p>
        </div>
      </section>

      {/* Ablauf */}
      <section id="ablauf" className="py-16 lg:py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-navy text-center mb-12">
            {t("flow.title")}
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <li key={step.title} className="relative text-center">
                <div className="text-5xl font-bold text-royal/10 mb-2 font-heading" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-bold font-heading text-navy mb-2">{step.title}</h3>
                <p className="text-sm text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Vertrauen */}
      <section className="py-12 lg:py-16 bg-surface border-y border-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">{t("trust.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {trust.map((item, i) => {
              const Icon = TRUST_ICONS[i] ?? Check;
              return (
                <div key={item.title} className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-xl bg-royal/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-royal" aria-hidden />
                  </div>
                  <div className="text-sm font-bold text-navy">{item.title}</div>
                  <div className="text-xs text-muted mt-1">{item.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scans & Fotos + Derzeit kostenlos */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-muted/20 bg-surface p-8">
            <div className="w-12 h-12 rounded-xl bg-royal/10 flex items-center justify-center mb-4">
              <FileScan className="w-6 h-6 text-royal" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold font-heading text-navy mb-3">{t("scans.title")}</h2>
            <p className="text-slate-text/80 leading-relaxed">{t("scans.text")}</p>
          </div>
          <div className="rounded-2xl border border-royal/20 bg-royal/5 p-8 flex flex-col">
            <h2 className="text-2xl font-bold font-heading text-navy mb-3">{t("free.title")}</h2>
            <p className="text-slate-text/80 leading-relaxed mb-6">{t("free.text")}</p>
            <div className="mt-auto">
              <StartCta position="free" className="w-full sm:w-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-surface border-t border-muted/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-navy text-center mb-12">
            {t("faq.title")}
          </h2>
          <FaqAccordion tone="snow" items={faq} />
          <p className="mt-8 text-center">
            <Link
              href="/ratgeber/pseudonymisierung-vs-anonymisierung"
              className="inline-flex items-center gap-1 text-sm font-medium text-royal hover:gap-2 transition-all"
            >
              {t("guideLink")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-heading text-white mb-4">{t("bottom.title")}</h2>
          <p className="text-lg text-white/70 mb-8">{t("bottom.text")}</p>
          <StartCta position="bottom" className="shadow-royal/30" />
        </div>
      </section>
    </>
  );
}
