"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-bold font-heading">custix.ai</div>
            <p className="mt-2 text-sm text-white/60">{t("tagline")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-3">
              {t("solutions")}
            </h3>
            <ul className="space-y-2">
              <li><Link href="/fuer-anwaelte" className="text-sm text-white/70 hover:text-white transition-colors">{t("lawyers")}</Link></li>
              <li><Link href="/fuer-steuerberater" className="text-sm text-white/70 hover:text-white transition-colors">{t("taxAdvisors")}</Link></li>
              <li><Link href="/fuer-hr" className="text-sm text-white/70 hover:text-white transition-colors">{t("hr")}</Link></li>
              <li><Link href="/fuer-gesundheitswesen" className="text-sm text-white/70 hover:text-white transition-colors">{t("healthcare")}</Link></li>
              <li><Link href="/fuer-versicherungen" className="text-sm text-white/70 hover:text-white transition-colors">{t("insurance")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-3">
              {t("company")}
            </h3>
            <ul className="space-y-2">
              <li><Link href="/ueber-uns" className="text-sm text-white/70 hover:text-white transition-colors">{t("about")}</Link></li>
              <li><Link href="/preise" className="text-sm text-white/70 hover:text-white transition-colors">{t("pricing")}</Link></li>
              <li><Link href="/kontakt" className="text-sm text-white/70 hover:text-white transition-colors">{t("contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-3">
              {t("legal")}
            </h3>
            <ul className="space-y-2">
              <li><Link href="/impressum" className="text-sm text-white/70 hover:text-white transition-colors">{t("imprint")}</Link></li>
              <li><Link href="/datenschutz" className="text-sm text-white/70 hover:text-white transition-colors">{t("privacy")}</Link></li>
              <li><Link href="/agb" className="text-sm text-white/70 hover:text-white transition-colors">{t("terms")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
