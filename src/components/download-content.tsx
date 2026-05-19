"use client";

import { useTranslations, useLocale } from "next-intl";
import { Monitor, Apple, Download } from "lucide-react";

interface PlatformInfo {
  signature: string;
  url: string;
}

interface ReleaseManifest {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<string, PlatformInfo>;
}

interface DownloadContentProps {
  release: ReleaseManifest | null;
  token: string;
}

const PLATFORM_CONFIG: Record<
  string,
  { label: string; labelEn: string; icon: typeof Monitor; hint: string; hintEn: string }
> = {
  "windows-x86_64": {
    label: "Windows",
    labelEn: "Windows",
    icon: Monitor,
    hint: "Beim ersten Start zeigt Windows die SmartScreen-Warnung 'Windows hat Ihren PC geschützt'. Klick auf 'Weitere Informationen' → 'Trotzdem ausführen'.",
    hintEn:
      "On first launch, Windows shows SmartScreen warning 'Windows protected your PC'. Click 'More info' → 'Run anyway'.",
  },
  "darwin-aarch64": {
    label: "macOS Apple Silicon (M1/M2/M3/M4)",
    labelEn: "macOS Apple Silicon (M1/M2/M3/M4)",
    icon: Apple,
    hint: "Beim ersten Start zeigt macOS Gatekeeper eine Warnung. Im Finder Rechtsklick auf custix.app → 'Öffnen' → 'Öffnen' im Dialog bestätigen.",
    hintEn:
      "On first launch, macOS Gatekeeper shows a warning. In Finder, right-click custix.app → 'Open' → confirm 'Open' in the dialog.",
  },
  "darwin-x86_64": {
    label: "macOS Intel",
    labelEn: "macOS Intel",
    icon: Apple,
    hint: "Beim ersten Start zeigt macOS Gatekeeper eine Warnung. Im Finder Rechtsklick auf custix.app → 'Öffnen' → 'Öffnen' im Dialog bestätigen.",
    hintEn:
      "On first launch, macOS Gatekeeper shows a warning. In Finder, right-click custix.app → 'Open' → confirm 'Open' in the dialog.",
  },
  "linux-x86_64": {
    label: "Linux",
    labelEn: "Linux",
    icon: Monitor,
    hint: "Nach dem Download die AppImage-Datei ausführbar machen: chmod +x custix.AppImage",
    hintEn: "After download, make the AppImage executable: chmod +x custix.AppImage",
  },
};

function formatDate(isoDate: string, locale: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match) {
    return match[1].toUpperCase();
  }
  return "";
}

export function DownloadContent({ release, token }: DownloadContentProps) {
  const t = useTranslations("download");
  const locale = useLocale();

  const hasPlatforms = release && Object.keys(release.platforms).length > 0;

  const getDownloadUrl = (platformKey: string) => {
    return `/api/download?token=${token}&platform=${platformKey}`;
  };

  return (
    <>
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-xl text-muted">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasPlatforms ? (
            <div className="bg-surface rounded-2xl border border-muted/20 p-8 text-center">
              <p className="text-lg text-slate-text">{t("unavailable")}</p>
            </div>
          ) : (
            <>
              {/* Version info */}
              <div className="text-center mb-10">
                <p className="text-lg text-muted">
                  {t("version")} {release.version} · {t("published")}{" "}
                  {formatDate(release.pub_date, locale)}
                </p>
              </div>

              {/* Platform cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {Object.entries(release.platforms).map(([platformKey, platformData]) => {
                  const config = PLATFORM_CONFIG[platformKey];
                  if (!config) return null;

                  const Icon = config.icon;
                  const label = locale === "de" ? config.label : config.labelEn;
                  const hint = locale === "de" ? config.hint : config.hintEn;
                  const ext = getFileExtension(platformData.url);

                  return (
                    <div
                      key={platformKey}
                      className="bg-surface rounded-2xl border border-muted/20 p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-navy" />
                        </div>
                        <div>
                          <h3 className="font-semibold font-heading text-navy">
                            {label}
                          </h3>
                          {ext && (
                            <span className="text-sm text-muted">{ext}</span>
                          )}
                        </div>
                      </div>

                      <a
                        href={getDownloadUrl(platformKey)}
                        className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors mb-4"
                      >
                        <Download className="w-5 h-5" />
                        {t("downloadButton")} v{release.version}
                      </a>

                      <p className="text-sm text-muted leading-relaxed">{hint}</p>
                    </div>
                  );
                })}
              </div>

              {/* Generic note */}
              <div className="bg-navy/5 rounded-xl p-6 text-center">
                <p className="text-slate-text">{t("localNote")}</p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
