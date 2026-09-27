"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, ExternalLink, Loader2, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "./auth-form";
import { ResetPasswordForm } from "./reset-password-form";
import { signOut } from "@/lib/auth-client";
import { formatDate } from "@/lib/format-date";
import {
  currentVisitSource,
  rememberVisitSource,
  visitSourceFromSearch,
  type VisitSource,
} from "@/lib/visit-source";

type License = {
  key: string | null;
  type?: string;
  status?: string;
  expires_at?: number | null;
  grace_seconds?: number;
};

const DAY = 86400;

/** sessionStorage meldet keine Änderungen; gelesen wird einmal pro Aufruf. */
const subscribeToNothing = () => () => {};
const noVisitSource = () => null;

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
  /**
   * Woher der Besuch kam – entscheidet, ob Web-App oder Download vorne steht.
   * Serverseitig unbekannt (null); im Browser aus URL oder sessionStorage.
   */
  const visitSource = useSyncExternalStore<VisitSource | null>(
    subscribeToNothing,
    currentVisitSource,
    noVisitSource,
  );

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setResetToken(t);
    // `?from=doctors` für die Sitzung merken, damit die Herkunft auch nach
    // Registrierung und Stripe-Rücksprung (beide ohne Parameter) noch gilt.
    const fromUrl = visitSourceFromSearch(window.location.search);
    if (fromUrl) rememberVisitSource(fromUrl);
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
        <AuthForm
          source={visitSource}
          onDone={() => {
            // Wer über die Ärzte-Seite kam, will in den Browser, nicht zum
            // Download: nach Registrierung oder Anmeldung direkt in die
            // Web-App (ADR-0010). Sie übernimmt die Website-Sitzung
            // (znerol74/custix#41), also kein zweites Login.
            if (visitSource === "doctors") window.location.href = "/app/";
            else load();
          }}
        />
      </Shell>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const isSubscription = license?.type === "subscription";
  const expiresAt = license?.expires_at ?? null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt - now) / DAY) : null;
  // „Aktiv" wie in CONTEXT.md und /api/license/validate: status=active und
  // noch innerhalb von expires_at + Kulanzfrist. Ein Abo mit offener
  // Zahlung ist in der Kulanzfrist also noch aktiv, ein per Webhook auf
  // status=expired gesetztes nicht – auch wenn expires_at in der Zukunft liegt.
  const graceUntil =
    expiresAt == null ? null : expiresAt + (license?.grace_seconds ?? 0);
  const expired =
    (license?.status ?? "active") !== "active" ||
    (graceUntil != null && now >= graceUntil);

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
                  ? t("status.expiredOn", { date: formatDate(new Date(expiresAt * 1000), locale) })
                  : isSubscription
                    ? t("status.renewsOn", { date: formatDate(new Date(expiresAt * 1000), locale) })
                    : t("status.daysLeft", {
                        days: daysLeft ?? 0,
                        date: formatDate(new Date(expiresAt * 1000), locale),
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

            {expired && !isSubscription ? (
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
              <>
                {/* Aktive Lizenz (Testphase, Beta oder laufende Subscription):
                    der nächste Schritt ist starten, nicht kaufen. */}
                {!expired ? <StartActions source={visitSource} /> : null}
                {isSubscription ? (
                  <button
                    onClick={() => postAndFollow("/api/stripe/portal")}
                    disabled={pendingPath !== null}
                    className={`inline-flex items-center gap-2 px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors disabled:opacity-60 ${
                      expired ? "" : "mt-4"
                    }`}
                  >
                    {t("manage")}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : null}
              </>
            )}
          </Card>
        </>
      )}

      {/* Beta-Schlüssel aus der Zeit vor der Registrierung einlösen. Ohne das
          kämen die noch nicht beanspruchten Beta-Lizenzen nie an ihr Konto. */}
      <ClaimKey onDone={load} />

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

/**
 * Die beiden Wege in die App für eine aktive Lizenz. Standard: Download zuerst,
 * Web-App als Alternative. Wer über die Ärzte-Seite kam, sieht es umgekehrt –
 * dort ist „nichts installieren" das Argument (siehe lib/visit-source.ts).
 */
function StartActions({ source }: { source: VisitSource | null }) {
  const t = useTranslations("account");
  const webFirst = source === "doctors";
  const primary =
    "inline-flex items-center justify-center gap-2 px-6 py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors";
  const secondary =
    "inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-navy/10 text-navy font-semibold rounded-lg hover:bg-navy/5 transition-colors";

  // /app liegt außerhalb der lokalisierten Routen (statische Web-App, siehe
  // next.config.ts). Deshalb ein gewöhnliches <a> statt des next-intl-Links,
  // der daraus auf Englisch /en/app machen würde.
  const web = (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- /app ist keine Next-Seite; die Regel hält es für die dynamische [locale]-Route.
    <a key="web" href="/app/" className={webFirst ? primary : secondary}>
      <Play className="w-4 h-4" />
      {t("startWeb")}
    </a>
  );
  // /api/download verlangt token+platform (Waitlist-Strecke) — Konto-Nutzer
  // wählen ihre Plattform auf der Download-Seite.
  const download = (
    <Link
      key="download"
      href="/download"
      className={webFirst ? secondary : primary}
    >
      <Download className="w-4 h-4" />
      {t("download")}
    </Link>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        {webFirst ? [web, download] : [download, web]}
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
