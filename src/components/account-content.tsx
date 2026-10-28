"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, ExternalLink, Loader2, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AuthForm, type AuthMode } from "./auth-form";
import { ResetPasswordForm } from "./reset-password-form";
import { signOut } from "@/lib/auth-client";
import { formatDate } from "@/lib/format-date";

/** Antwort von /api/license/mine (Vertrag in ADR-0012). */
type License = {
  key: string | null;
  type: string | null;
  /** Wirksamer Stand; null = das Konto hat keine Lizenz. */
  status: "active" | "expired" | "revoked" | null;
  /** Dieselbe Entscheidung wie /api/license/validate (lib/entitlement.ts). */
  valid: boolean;
  expires_at: number | null;
  /** Läuft die Lizenz schon in der Desktop-App? Nur dann Download und Schlüssel. */
  desktop_used: boolean;
};

const DAY = 86400;

/** Die URL meldet keine Änderungen; gelesen wird einmal pro Aufruf. */
const subscribeToNothing = () => () => {};
const tokenFromUrl = () => new URLSearchParams(window.location.search).get("token");
const noToken = () => null;
/**
 * `?mode=signin` / `?mode=forgot` öffnet direkt Anmeldung bzw. „Passwort
 * vergessen“ – für die Mail „Sie haben bereits ein Konto“ und die Web-App.
 */
const modeFromUrl = (): AuthMode => {
  const mode = new URLSearchParams(window.location.search).get("mode");
  return mode === "signin" || mode === "forgot" ? mode : "signup";
};
const defaultMode = (): AuthMode => "signup";

export function AccountContent() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [license, setLicense] = useState<License | null>(null);
  /** Zeitpunkt der letzten Antwort (Unix-Sekunden) – für „noch X Tage“. */
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  /** Läuft gerade ein Stripe-/Trial-Aufruf? Enthält den Pfad, um Doppelklicks zu sperren. */
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Aus der Zurücksetzen-E-Mail: /konto?token=… zeigt das Passwortformular. */
  const urlToken = useSyncExternalStore(subscribeToNothing, tokenFromUrl, noToken);
  const initialMode = useSyncExternalStore(subscribeToNothing, modeFromUrl, defaultMode);
  const [resetDone, setResetDone] = useState(false);
  const resetToken = resetDone ? null : urlToken;

  /** Holt die Lizenz; setzt Zustand nur in den Rückrufen, nie synchron. */
  const refresh = useCallback(
    () =>
      fetch("/api/license/mine")
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d: License) => {
          setLicense(d);
          setLoadedAt(Math.floor(Date.now() / 1000));
          setError(null);
        })
        .catch((s) => setError(s === 401 ? "unauthenticated" : "load_failed"))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const load = () => {
    setLoading(true);
    setError(null);
    refresh();
  };

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
            setResetDone(true);
            load();
          }}
        />
      </Shell>
    );
  }

  // Nicht angemeldet: hier registrieren, nicht auf eine andere Seite schicken.
  // Startseite, Preisseite und Navigation verlinken genau hierher. Das
  // Formular trägt die Überschrift der Seite selbst („Kostenlos testen“ bzw.
  // „Anmelden“). Die Registrierung endet auf /willkommen und von dort in der
  // Web-App (#15); nach einer Anmeldung bleibt es beim Konto mit „custix im
  // Browser starten“ (#14). Die Web-App übernimmt die Sitzung (znerol74/custix#41).
  if (error === "unauthenticated") {
    return (
      <Shell>
        <AuthForm key={initialMode} initialMode={initialMode} onDone={load} />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-3xl sm:text-4xl font-bold font-heading text-navy mb-8">
        {t("title")}
      </h1>

      {license ? (
        <LicenseCard
          license={license}
          now={loadedAt}
          locale={locale}
          busy={pendingPath !== null}
          onStartTrial={() => postAndFollow("/api/trial/start", { locale })}
          onCheckout={(interval) =>
            postAndFollow("/api/stripe/checkout", { interval })
          }
          onPortal={() => postAndFollow("/api/stripe/portal")}
        />
      ) : null}

      {/* Beta-Schlüssel aus der Zeit vor der Registrierung einlösen. Ohne das
          kämen die noch nicht beanspruchten Beta-Lizenzen nie an ihr Konto. */}
      {license ? <ClaimKey onDone={load} /> : null}

      {license ? (
        <button
          onClick={() => signOut().then(load)}
          className="mt-8 block text-sm text-muted hover:text-navy transition-colors"
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

/**
 * Was das Konto zur Lizenz zeigt. Gültig oder nicht entscheidet der Server
 * (`valid` aus /api/license/mine, dieselbe Regel wie die Desktop-Prüfung) –
 * die Seite rechnet das nicht nach. Eine Lizenz deckt Web und Desktop
 * (ADR-0012):
 *  - keine Lizenz:   Testphase starten (Konten aus der kostenlosen Web-Phase)
 *  - widerrufen:     gesperrt, Kontakt – keine neue Testphase
 *  - gültig:         „custix im Browser starten“ (+ Download für Desktop-Konten)
 *  - abgelaufen:     Abo abschließen (Checkout); laufende Abos über das Portal
 */
function LicenseCard({
  license,
  now,
  locale,
  busy,
  onStartTrial,
  onCheckout,
  onPortal,
}: {
  license: License;
  now: number;
  locale: string;
  busy: boolean;
  onStartTrial: () => void;
  onCheckout: (interval: "annual" | "monthly") => void;
  onPortal: () => void;
}) {
  const t = useTranslations("account");

  if (license.status === null) {
    return (
      <Card>
        <h2 className="text-lg font-bold font-heading text-navy mb-2">
          {t("noLicense.heading")}
        </h2>
        <p className="text-slate-text/80 mb-6">{t("noLicense.body")}</p>
        <button
          onClick={onStartTrial}
          disabled={busy}
          className="px-6 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60"
        >
          {t("noLicense.cta")}
        </button>
      </Card>
    );
  }

  if (license.status === "revoked") {
    return (
      <Card>
        <h2 className="text-lg font-bold font-heading text-navy mb-2">
          {t("revoked.heading")}
        </h2>
        <p className="text-slate-text/80">{t("revoked.body")}</p>
      </Card>
    );
  }

  const valid = license.valid;
  const isSubscription = license.type === "subscription";
  const expiresAt = license.expires_at;
  const date = expiresAt ? formatDate(new Date(expiresAt * 1000), locale) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / DAY)) : 0;

  const label = isSubscription
    ? t("status.subscription")
    : license.type === "beta"
      ? t("status.beta")
      : valid
        ? t("status.trial")
        : t("status.trialExpired");

  const dateLine = !date
    ? null
    : !valid
      ? t("status.expiredOn", { date })
      : isSubscription
        ? t("status.renewsOn", { date })
        : license.type === "beta"
          ? t("status.validUntil", { date })
          : t("status.daysLeft", { days: daysLeft, date });

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted mb-1">{t("status.label")}</p>
          <p className="text-xl font-bold font-heading text-navy">{label}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {valid ? t("status.active") : t("status.locked")}
        </span>
      </div>

      {dateLine ? <p className="text-slate-text/80 mb-6">{dateLine}</p> : null}

      {/*
        Den Schlüssel braucht nur die Desktop-App, und auch die holt ihn
        nach dem Login selbst über /api/license/mine. Deshalb nur für
        Konten, die schon in der Desktop-App laufen – einklappbar, für
        den Support und die Beta-Lizenzen aus der Zeit vor den Konten.
        Neue Konten sehen keinen Schlüssel (mrgoofman/custix-ai#14).
      */}
      {license.desktop_used && license.key ? (
        <details className="mb-6 group">
          <summary className="text-sm text-muted cursor-pointer hover:text-navy transition-colors list-none">
            {t("showKey")}
          </summary>
          <code className="mt-3 block font-mono text-base text-navy bg-snow rounded-lg px-4 py-3 select-all">
            {license.key}
          </code>
          <p className="mt-2 text-xs text-muted">{t("keyHint")}</p>
        </details>
      ) : null}

      {valid ? (
        // Aktive Lizenz (Testphase, Beta oder laufendes Abo): der nächste
        // Schritt ist starten, nicht kaufen.
        <StartActions desktop={license.desktop_used} />
      ) : !isSubscription ? (
        // Testphase (oder befristete Beta) vorbei: jetzt geht es ums Abo. Es
        // gilt für Web und Desktop, gleicher Schlüssel (type wird umgestellt).
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onCheckout("annual")}
            disabled={busy}
            className="px-6 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60"
          >
            {t("buy.annual")}
          </button>
          <button
            onClick={() => onCheckout("monthly")}
            disabled={busy}
            className="px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors disabled:opacity-60"
          >
            {t("buy.monthly")}
          </button>
        </div>
      ) : null}

      {/* Abo: Zahlung nachholen, kündigen, Rechnungen – im Stripe-Portal. Ein
          abgelaufenes Abo landet ebenfalls dort, nicht in einem zweiten
          Checkout (sonst liefen zwei Abos nebeneinander). */}
      {isSubscription ? (
        <button
          onClick={onPortal}
          disabled={busy}
          className={`inline-flex items-center gap-2 px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors disabled:opacity-60 ${
            valid ? "mt-4" : ""
          }`}
        >
          {t("manage")}
          <ExternalLink className="w-4 h-4" />
        </button>
      ) : null}
    </Card>
  );
}

/**
 * Der Weg in die App für eine aktive Lizenz: für alle „custix im Browser
 * starten“ (mrgoofman/custix-ai#14). Den Download sieht nur, wessen Lizenz
 * schon in der Desktop-App läuft (`desktop`) – als Nebenaktion; neue Konten
 * bekommen ihn nicht angeboten. /download selbst bleibt per Link erreichbar.
 */
function StartActions({ desktop }: { desktop: boolean }) {
  const t = useTranslations("account");

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* /app liegt außerhalb der lokalisierten Routen (statische Web-App,
            siehe next.config.ts). Deshalb ein gewöhnliches <a> statt des
            next-intl-Links, der daraus auf Englisch /en/app machen würde. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- /app ist keine Next-Seite; die Regel hält es für die dynamische [locale]-Route. */}
        <a
          href="/app/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors"
        >
          <Play className="w-4 h-4" />
          {t("startWeb")}
        </a>
        {desktop ? (
          // /api/download verlangt token+platform (Waitlist-Strecke) — Konto-
          // Nutzer wählen ihre Plattform auf der Download-Seite.
          <Link
            href="/download"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("download")}
          </Link>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-muted">{t("startWebHint")}</p>
    </div>
  );
}

function ClaimKey({ onDone }: { onDone: () => void }) {
  const t = useTranslations("account");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/license/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const d = (await r.json()) as { ok?: boolean; message_key?: string };
      if (d.ok) onDone();
      else setMsg(d.message_key ?? "failed");
    } catch {
      setMsg("failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="mt-8">
      <summary className="text-sm text-muted cursor-pointer hover:text-navy transition-colors list-none">
        {t("claim.link")}
      </summary>
      <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-3">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="CUSTIX-XXXX-XXXX-XXXX-XXXX"
          className="flex-1 px-4 py-3 rounded-lg border border-muted/30 font-mono text-sm focus:border-royal focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors disabled:opacity-60"
        >
          {t("claim.cta")}
        </button>
      </form>
      {msg ? <p className="mt-2 text-sm text-muted">{t("claim.failed")}</p> : null}
    </details>
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
