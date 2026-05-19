"use client";

import { useTranslations } from "next-intl";
import { FileText, Wand2, Bot, RotateCcw } from "lucide-react";

const steps = [
  { key: "step1" as const, Icon: FileText, number: "01" },
  { key: "step2" as const, Icon: Wand2, number: "02" },
  { key: "step3" as const, Icon: Bot, number: "03" },
  { key: "step4" as const, Icon: RotateCcw, number: "04" },
];

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section className="py-16 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-navy text-center mb-12">
          {t("title")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {steps.map(({ key, Icon, number }) => (
            <div key={key} className="relative text-center">
              <div className="text-5xl font-bold text-royal/10 mb-2 font-heading">
                {number}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-royal/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-royal" />
              </div>
              <h3 className="text-lg font-bold font-heading text-navy mb-2">
                {t(`${key}.title`)}
              </h3>
              <p className="text-sm text-muted">{t(`${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
