"use client";

import { useTranslations } from "next-intl";
import { Mail, Calendar } from "lucide-react";

export function ContactContent() {
  const t = useTranslations("contact");

  return (
    <>
      <section className="bg-gradient-to-b from-navy/[0.03] to-snow pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-navy leading-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-muted">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact form */}
            <div>
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-slate-text mb-1"
                  >
                    {t("form.name")}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-muted/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-slate-text mb-1"
                  >
                    {t("form.email")}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    className="w-full px-4 py-2.5 border border-muted/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-medium text-slate-text mb-1"
                  >
                    {t("form.message")}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    className="w-full px-4 py-2.5 border border-muted/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors"
                >
                  {t("form.send")}
                </button>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <div className="bg-surface rounded-2xl border border-muted/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-royal/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-royal" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-navy">
                    {t("booking.title")}
                  </h3>
                </div>
                <p className="text-sm text-muted mb-4">
                  {t("booking.description")}
                </p>
                <a
                  href="https://www.cal.eu/moritz-1xki/15min?overlayCalendar=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Cal.com
                </a>
              </div>

              <div className="bg-surface rounded-2xl border border-muted/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-royal/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-royal" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-navy">
                    {t("email.title")}
                  </h3>
                </div>
                <a
                  href={`mailto:${t("email.address")}`}
                  className="text-sm text-royal hover:underline"
                >
                  {t("email.address")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
