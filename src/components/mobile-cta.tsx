"use client";

import { useTranslations } from "next-intl";

export function MobileCta() {
  const t = useTranslations("nav");

  const openSignup = () => {
    window.dispatchEvent(new CustomEvent("open-signup"));
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[80] p-3 bg-surface/95 backdrop-blur border-t border-muted/20">
      <button
        onClick={openSignup}
        className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors text-sm"
      >
        {t("cta")}
      </button>
    </div>
  );
}
