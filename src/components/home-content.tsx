"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AutoplayVideo } from "./autoplay-video";
import { TrustBadges } from "./trust-badges";
import { AudienceCards } from "./audience-cards";
import { HowItWorks } from "./how-it-works";
import { FAQ } from "./faq";

export function HomeContent() {
  const t = useTranslations();

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy/[0.03] to-snow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold font-heading text-navy leading-tight mb-4">
                {t("hero.headline")}
              </h1>
              <p className="text-xl sm:text-2xl text-royal font-medium mb-4">
                {t("hero.subheadline")}
              </p>
              <p className="text-lg text-slate-text/80 mb-8 lg:max-w-xl">
                {t("hero.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/konto"
                  className="px-8 py-4 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors text-lg shadow-lg shadow-royal/20"
                >
                  {t("hero.cta")}
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 border-2 border-navy/10 text-navy font-semibold rounded-xl hover:bg-navy/5 transition-colors text-lg text-center"
                >
                  {t("hero.secondaryCta")}
                </a>
              </div>
            </div>

            {/*
            Eigene, leichtere Fassung fürs Web: 1280×720, ohne die stumme
            Tonspur, die Remotion sonst mitschreibt – das drückt die Datei von
            3,3 MB auf unter 1 MB. Über der Falz zählt jedes KB, deshalb auch
            preload="auto": das Video steht sofort im Bild.
          */}
            <div>
              <AutoplayVideo
                className="w-full aspect-video rounded-2xl shadow-xl shadow-navy/10 bg-snow"
                src="/videos/hero-16x9-web.mp4"
                poster="/videos/poster-16x9.jpg"
                preload="auto"
              />
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />
      <AudienceCards />

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <FAQ />

      <section className="bg-navy py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white mb-4">
            {t("hero.headline")}
          </h2>
          <p className="text-lg text-white/70 mb-8">{t("hero.description")}</p>
          <Link
            href="/konto"
            className="px-8 py-4 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors text-lg shadow-lg shadow-royal/30"
          >
            {t("hero.cta")}
          </Link>
        </div>
      </section>
    </>
  );
}
