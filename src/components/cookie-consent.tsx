"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export function CookieConsent() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    } else if (consent === "accepted") {
      loadGA4();
    }
  }, []);

  const loadGA4 = () => {
    // GA4 will be injected here once the tracking ID is configured
  };

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
    loadGA4();
  };

  const reject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-surface rounded-2xl shadow-lg border border-muted/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-navy mb-1">
            {t("title")}
          </h3>
          <p className="text-sm text-muted">{t("description")}</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm font-medium text-slate-text border border-muted/30 rounded-lg hover:bg-snow transition-colors"
          >
            {t("reject")}
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium text-white bg-royal rounded-lg hover:bg-royal-dark transition-colors"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
