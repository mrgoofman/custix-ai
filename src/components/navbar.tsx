"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Menu, X, ChevronDown, Globe } from "lucide-react";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  const switchLocale = () => {
    const next = locale === "de" ? "en" : "de";
    router.replace(pathname, { locale: next });
  };

  const openSignup = () => {
    window.dispatchEvent(new CustomEvent("open-signup"));
    setMobileOpen(false);
  };

  const primaryLinks = [
    {
      label: t("forYourIndustry"),
      items: [
        { href: "/fuer-anwaelte" as const, label: t("lawyers") },
        { href: "/fuer-steuerberater" as const, label: t("taxAdvisors") },
      ],
    },
    {
      label: t("moreIndustries"),
      items: [
        { href: "/fuer-hr" as const, label: t("hr") },
        { href: "/fuer-gesundheitswesen" as const, label: t("healthcare") },
        { href: "/fuer-versicherungen" as const, label: t("insurance") },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-muted/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold font-heading text-navy">
          custix.ai
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Solutions dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-text hover:text-navy rounded-lg hover:bg-snow transition-colors">
              {t("solutions")}
              <ChevronDown className="w-4 h-4" />
            </button>
            {solutionsOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-surface rounded-xl shadow-lg border border-muted/20 py-2 z-50">
                {primaryLinks.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-slate-text hover:bg-snow hover:text-navy transition-colors"
                        onClick={() => setSolutionsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/preise"
            className="px-3 py-2 text-sm font-medium text-slate-text hover:text-navy rounded-lg hover:bg-snow transition-colors"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/ueber-uns"
            className="px-3 py-2 text-sm font-medium text-slate-text hover:text-navy rounded-lg hover:bg-snow transition-colors"
          >
            {t("about")}
          </Link>

          <button
            onClick={switchLocale}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted hover:text-navy rounded-lg hover:bg-snow transition-colors ml-2"
          >
            <Globe className="w-4 h-4" />
            {locale === "de" ? "EN" : "DE"}
          </button>

          <button
            onClick={openSignup}
            className="ml-2 px-5 py-2.5 bg-royal text-white text-sm font-semibold rounded-lg hover:bg-royal-dark transition-colors"
          >
            {t("cta")}
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-navy"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-muted/20 px-4 py-4 space-y-1">
          {primaryLinks.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2.5 text-sm font-medium text-slate-text hover:text-navy hover:bg-snow rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href="/preise"
            className="block px-3 py-2.5 text-sm font-medium text-slate-text hover:text-navy hover:bg-snow rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            {t("pricing")}
          </Link>
          <Link
            href="/ueber-uns"
            className="block px-3 py-2.5 text-sm font-medium text-slate-text hover:text-navy hover:bg-snow rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            {t("about")}
          </Link>
          <button
            onClick={switchLocale}
            className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-muted hover:text-navy hover:bg-snow rounded-lg w-full"
          >
            <Globe className="w-4 h-4" />
            {locale === "de" ? "EN" : "DE"}
          </button>
        </div>
      )}
    </header>
  );
}
