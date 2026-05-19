"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function SignupModal() {
  const t = useTranslations("signup");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-signup", handler);
    return () => window.removeEventListener("open-signup", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          profession: form.get("profession"),
          locale,
        }),
      });
      setSubmitted(true);
    } catch {
      // silently handle — will add error state later
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={() => { setOpen(false); setSubmitted(false); }}
      />
      <div className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
        <button
          onClick={() => { setOpen(false); setSubmitted(false); }}
          className="absolute top-4 right-4 text-muted hover:text-navy transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-navy mb-2">{t("success")}</p>
            <p className="text-sm text-muted">{t("successSubtext")}</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold font-heading text-navy mb-1">
              {t("title")}
            </h2>
            <p className="text-sm text-muted mb-6">{t("subtitle")}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-slate-text mb-1">
                  {t("name")}
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-muted/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-slate-text mb-1">
                  {t("email")}
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 border border-muted/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal"
                />
              </div>
              <div>
                <label htmlFor="signup-profession" className="block text-sm font-medium text-slate-text mb-1">
                  {t("profession")}
                </label>
                <select
                  id="signup-profession"
                  name="profession"
                  required
                  className="w-full px-4 py-2.5 border border-muted/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal bg-surface"
                >
                  <option value="">{t("profession")}</option>
                  <option value="lawyer">{t("professionOptions.lawyer")}</option>
                  <option value="taxAdvisor">{t("professionOptions.taxAdvisor")}</option>
                  <option value="hr">{t("professionOptions.hr")}</option>
                  <option value="healthcare">{t("professionOptions.healthcare")}</option>
                  <option value="insurance">{t("professionOptions.insurance")}</option>
                  <option value="other">{t("professionOptions.other")}</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-50"
              >
                {loading ? "..." : t("submit")}
              </button>
              <p className="text-xs text-muted text-center">
                {t("privacy")}{" "}
                <Link href="/datenschutz" className="underline hover:text-navy">
                  →
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
