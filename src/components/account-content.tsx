"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "./auth-form";
import { ResetPasswordForm } from "./reset-password-form";
import { signOut } from "@/lib/auth-client";

type License = {
  key: string | null;
  type?: string;
  status?: string;
  expires_at?: number | null;
};

const DAY = 86400;

export function AccountContent() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  /** Läuft gerade ein Stripe-/Trial-Aufruf? Enthält den Pfad, um Doppelklicks zu sperren. */
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Aus der Zurücksetzen-E-Mail: /konto?token=… zeigt das Passwortformular. */
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setResetToken(t);
  }, []);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/license/mine")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: License) => setLicense(d))
      .catch((s) => setError(s === 401 ? "unauthenticated" : "load_failed"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  /**
   * Ruft einen Endpunkt auf, der entweder mit einer Stripe-URL antwortet (dann
   * leiten wir weiter) oder die Lizenz anlegt (dann laden wir neu).
   */
  const postAndFollow = async (path: string, body?: unknown) => {
    setPendingPath(path);
    setError(null);
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = (await r.json()) as {
        url?: string;
        key?: string;
        error?: string;
      };
      if (d.url) window.location.href = d.url;
      else if (d.key) load();
      else setError(d.error ?? "failed");
    } catch {
      setError("failed");
    } finally {
      setPendingPath(null);
    }
  };

  if (loading) {
    return (
      <Shell>
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </Shell>
    );
  }

  // Nicht angemeldet: hier registrieren, nicht auf eine andere Seite schicken.
  // Die Preisseite verlinkt genau hierher.
  if (resetToken) {
    return (
      <Shell>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-navy mb-8">
          {t("title")}
        </h1>
        <ResetPasswordForm
          token={resetToken}
          onDone={() => {
            window.history.replaceState({}, "", window.location.pathname);
            setResetToken(null);
            load();
          }}
        />
      </Shell>
    );
  }

  if (error === "unauthenticated") {
    return (
      <Shell>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-navy mb-2">
          {t("title")}
        </h1>
        <p className="text-slate-text/80 mb-8">{t("signedOut")}</p>
        <AuthForm onDone={load} />
      </Shell>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const isSubscription = license?.type === "subscription";
  const expiresAt = license?.expires_at ?? null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt - now) / DAY) : null;
  const expired = expiresAt != null && now >= expiresAt;

  return (
    <Shell>
      <h1 className="text-3xl sm:text-4xl font-bold font-heading text-navy mb-8">
        {t("title")}
      </h1>

      {!license?.key ? (
        <Card>
          <h2 className="text-lg font-bold font-heading text-navy mb-2">
            {t("noLicense.heading")}
          </h2>
          <p className="text-slate-text/80 mb-6">{t("noLicense.body")}</p>
          <button
            onClick={() => postAndFollow("/api/trial/start", { locale })}
            disabled={pendingPath !== null}
            className="px-6 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60"
          >
            {t("noLicense.cta")}
          </button>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-muted mb-1">{t("status.label")}</p>
                <p className="text-xl font-bold font-heading text-navy">
                  {isSubscription
                    ? t("status.subscription")
                    : expired
                      ? t("status.trialExpired")
                      : t("status.trial")}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  expired
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {expired ? t("status.locked") : t("status.active")}
              </span>
            </div>

            {expiresAt ? (
              <p className="text-slate-text/80 mb-6">
                {expired
                  ? t("status.expiredOn", { date: fmt(expiresAt, locale) })
                  : isSubscription
                    ? t("status.renewsOn", { date: fmt(expiresAt, locale) })
                    : t("status.daysLeft", {
                        days: daysLeft ?? 0,
                        date: fmt(expiresAt, locale),
                      })}
              </p>
            ) : null}

            {/*
              Der Schlüssel ist kein Handgriff mehr: Die App holt ihn nach dem
              Login selbst über /api/license/mine. Er bleibt einklappbar
              sichtbar – für den Support und für die Beta-Lizenzen, die per
              E-Mail verschickt wurden, bevor es ein Konto gab.
            */}
            <details className="mb-6 group">
              <summary className="text-sm text-muted cursor-pointer hover:text-navy transition-colors list-none">
                {t("showKey")}
              </summary>
              <code className="mt-3 block font-mono text-base text-navy bg-snow rounded-lg px-4 py-3 select-all">
                {license.key}
              </code>
              <p className="mt-2 text-xs text-muted">{t("keyHint")}</p>
            </details>

            {isSubscription ? (
              <button
                onClick={() => postAndFollow("/api/stripe/portal")}
                disabled={pendingPath !== null}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors disabled:opacity-60"
              >
                {t("manage")}
                <ExternalLink className="w-4 h-4" />
              </button>
            ) : expired ? (
              // Erst nach Ablauf der Testphase geht es ums Bezahlen.
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    postAndFollow("/api/stripe/checkout", { interval: "annual" })
                  }
                  disabled={pendingPath !== null}
                  className="px-6 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60"
                >
                  {t("buy.annual")}
                </button>
                <button
                  onClick={() =>
                    postAndFollow("/api/stripe/checkout", { interval: "monthly" })
                  }
                  disabled={pendingPath !== null}
                  className="px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors disabled:opacity-60"
                >
                  {t("buy.monthly")}
                </button>
              </div>
            ) : (
              // Laufende Testphase: der nächste Schritt ist installieren, nicht kaufen.
              // /api/download verlangt token+platform (Waitlist-Strecke) — Konto-
              // Nutzer wählen ihre Plattform auf der Download-Seite.
              <Link
                href="/download"
                className="inline-flex items-center gap-2 px-6 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("download")}
              </Link>
            )}
          </Card>
        </>
      )}

      {license?.key ? (
        <button
          onClick={() => signOut().then(load)}
          className="mt-8 text-sm text-muted hover:text-navy transition-colors"
        >
          {t("signOut")}
        </button>
      ) : null}

      {error && error !== "unauthenticated" ? (
        <p className="mt-6 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
          {t("errors.generic")}
        </p>
      ) : null}
    </Shell>
  );
}

/** Datum in der aktiven Sprache, nicht fest österreichisch. */
function fmt(epoch: number, locale: string) {
  return new Date(epoch * 1000).toLocaleDateString(
    locale === "en" ? "en-GB" : "de-AT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[60vh] py-16 lg:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-muted/20 p-8">
      {children}
    </div>
  );
}
