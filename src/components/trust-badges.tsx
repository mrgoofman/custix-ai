"use client";

import { useTranslations } from "next-intl";
import { Shield, Server, Cloud, Zap } from "lucide-react";

const icons = [Shield, Server, Cloud, Zap];
const keys = ["local", "gdpr", "noCloud", "fast"] as const;

export function TrustBadges() {
  const t = useTranslations("trust");

  return (
    <section className="py-12 lg:py-16 bg-surface border-y border-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {keys.map((key, i) => {
            const Icon = icons[i];
            return (
              <div
                key={key}
                className="flex flex-col items-center text-center p-4"
              >
                <div className="w-12 h-12 rounded-xl bg-royal/10 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-royal" />
                </div>
                <div className="text-sm font-bold text-navy">{t(key)}</div>
                <div className="text-xs text-muted mt-1">{t(`${key}Desc`)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
