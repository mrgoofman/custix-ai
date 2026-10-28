"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Lock, MailWarning, ShieldCheck, UserCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { formatDate } from "@/lib/format-date";
import {
  SIGNUP_MAX_COMPANY,
  SIGNUP_MAX_PASSWORD,
  SIGNUP_MIN_PASSWORD,
} from "@/lib/signup-rules";

/**
 * Ziel des Links „Zugang bestätigen“ (Registrierung „E-Mail zuerst“,
 * mrgoofman/custix-ai#15, ADR-0013): Passwort wählen → angemeldet →
 * „So funktioniert custix“ → „custix öffnen“ führt in die Web-App (/app/).
 *
 * Das Token steht im Fragment (#token=…): Es geht nicht an den Server und
 * nicht an die Webanalyse. Die Seite liest es einmal, legt es für ein
 * Neuladen im sessionStorage ab und nimmt es aus der Adresszeile. Das Öffnen
 * verbraucht nichts (Mail-Scanner rufen Links vorab auf); angelegt wird erst
 * mit dem Passwort.
 */

type View =
  | { step: "loading" }
  | { step: "failed" }
  | { step: "invalid" }
  | { step: "exists" }
  | { step: "password"; email: string; token: string }
  | { step: "how"; trialEndsAt: number | null };

const TOKEN_KEY = "custix.signup.token";
/** Gesetzt nach dem Passwort: ein Neuladen zeigt wieder „So funktioniert custix“. */
const DONE_KEY = "custix.signup.done";

/** Einmal pro Seitenaufruf gelesen – übersteht das doppelte Mounten im Dev-Modus. */
let capturedToken: string | null | undefined;

function takeToken(): string | null {
  if (capturedToken !== undefined) return capturedToken;
  const match = /(?:^#|&)token=([^&]+)/.exec(window.location.hash);
  let token: string | null = null;
  if (match) {
    try {
      token = decodeURIComponent(match[1]);
    } catch {
      token = null;
    }
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Kein sessionStorage (strenger Privatmodus): dann eben ohne Neuladen.
    }
    // Aus der Adresszeile nehmen – nicht in Lesezeichen, Verlauf, Screenshots.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  } else {
    try {
      token = sessionStorage.getItem(TOKEN_KEY);
    } catch {
      token = null;
    }
  }
  capturedToken = token;
  return token;
}

function readDone(): { trialEndsAt: number | null } | null {
  try {
    const raw = sessionStorage.getItem(DONE_KEY);
    return raw ? (JSON.parse(raw) as { trialEndsAt: number | null }) : null;
  } catch {
    return null;
  }
}

async function resolveView(token: string | null): Promise<View> {
  const done = readDone();
  if (done) return { step: "how", trialEndsAt: done.trialEndsAt };
  if (!token) return { step: "invalid" };
  try {
    const r = await fetch("/api/signup/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (r.status === 410) return { step: "invalid" };
    if (!r.ok) return { step: "failed" };
    const d = (await r.json()) as { status?: string; email?: string };
    if (d.status === "exists") return { step: "exists" };
    if (d.status === "new" && d.email) return { step: "password", email: d.email, token };
    return { step: "failed" };
  } catch {
    return { step: "failed" };
  }
}

export function WelcomeContent() {
  const [view, setView] = useState<View>({ step: "loading" });
  const headingRef = useRef<HTMLHeadingElement>(null);

  const load = useCallback(() => {
    let cancelled = false;
    resolveView(takeToken()).then((v) => {
      if (!cancelled) setView(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  // Neuer Schritt: Fokus auf die Überschrift, damit Screenreader ihn vorlesen.
  // Der Passwort-Schritt setzt den Fokus selbst ins Passwortfeld.
  useEffect(() => {
    if (view.step !== "loading" && view.step !== "password") headingRef.current?.focus();
  }, [view.step]);

  return (
    <section className="min-h-[60vh] py-12 sm:py-16 lg:py-24">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {view.step === "loading" ? (
          <LoadingState />
        ) : view.step === "password" ? (
          <PasswordStep
            email={view.email}
            token={view.token}
            onDone={(trialEndsAt) => {
              try {
                sessionStorage.removeItem(TOKEN_KEY);
                sessionStorage.setItem(DONE_KEY, JSON.stringify({ trialEndsAt }));
              } catch {
                // ohne sessionStorage: kein Neuladen-Komfort, sonst kein Unterschied
              }
              // Navigation und Konto sehen die neue Sitzung sofort.
              authClient.$store.notify("$sessionSignal");
              setView({ step: "how", trialEndsAt });
            }}
            onExists={() => setView({ step: "exists" })}
            onInvalid={() => setView({ step: "invalid" })}
          />
        ) : view.step === "how" ? (
          <HowStep headingRef={headingRef} trialEndsAt={view.trialEndsAt} />
        ) : view.step === "exists" ? (
          <ExistsStep headingRef={headingRef} />
        ) : view.step === "invalid" ? (
          <InvalidStep headingRef={headingRef} />
        ) : (
          <FailedStep
            headingRef={headingRef}
            onRetry={() => {
              setView({ step: "loading" });
              load();
            }}
          />
        )}
      </div>
    </section>
  );
}

const card = "bg-surface rounded-2xl border border-muted/20 p-6 sm:p-8";
const field =
  "w-full px-4 py-3 rounded-lg border border-muted/30 bg-surface text-navy focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20";
const primary =
  "w-full py-3.5 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 text-lg";
const heading = "text-2xl sm:text-3xl font-bold font-heading text-navy outline-none";

type HeadingRef = React.RefObject<HTMLHeadingElement | null>;

function LoadingState() {
  const t = useTranslations("welcome");
  return (
    <p role="status" className="flex items-center justify-center gap-2 text-muted py-16">
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      {t("loading")}
    </p>
  );
}

function PasswordStep({
  email,
  token,
  onDone,
  onExists,
  onInvalid,
}: {
  email: string;
  token: string;
  onDone: (trialEndsAt: number | null) => void;
  onExists: () => void;
  onInvalid: () => void;
}) {
  const t = useTranslations("welcome");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [show, setShow] = useState(false);
  const [tooShort, setTooShort] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const longEnough = password.length >= SIGNUP_MIN_PASSWORD;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!longEnough) {
      setTooShort(true);
      passwordRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, company: company.trim() }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        field?: string;
        trialEndsAt?: number | null;
      };
      if (d.ok) return onDone(d.trialEndsAt ?? null);
      if (d.error === "account_exists") return onExists();
      if (d.error === "invalid_token") return onInvalid();
      if (d.error === "invalid_input" && d.field === "password") {
        setTooShort(true);
        passwordRef.current?.focus();
        return;
      }
      setError(t("errors.generic"));
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={card}>
      <p
        role="status"
        className="flex items-center gap-2.5 text-green-800 bg-green-50 rounded-xl px-4 py-3 mb-6"
      >
        <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden />
        <span>{t.rich("verified", { b: (chunks) => <strong>{chunks}</strong> })}</span>
      </p>

      <h1 className={`${heading} mb-6`}>{t("heading")}</h1>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="welcome-email" className="block text-sm font-medium text-navy mb-1.5">
            {t("email")}
          </label>
          {/* Schreibgeschützt; autoComplete="username" lässt Passwort-Manager
              die neue Anmeldung unter der richtigen Adresse speichern. */}
          <input
            id="welcome-email"
            className={`${field} bg-snow text-slate-text`}
            type="email"
            value={email}
            readOnly
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="welcome-password" className="block text-sm font-medium text-navy mb-1.5">
            {t("password")}
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              id="welcome-password"
              className={`${field} pr-28`}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (tooShort && e.target.value.length >= SIGNUP_MIN_PASSWORD) setTooShort(false);
              }}
              autoComplete="new-password"
              minLength={SIGNUP_MIN_PASSWORD}
              maxLength={SIGNUP_MAX_PASSWORD}
              required
              aria-invalid={tooShort || undefined}
              aria-describedby={`welcome-password-rule${tooShort ? " welcome-password-error" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-controls="welcome-password"
              aria-label={show ? t("hideLabel") : t("showLabel")}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm font-medium text-royal rounded-md hover:bg-royal/5"
            >
              {show ? t("hide") : t("show")}
            </button>
          </div>
          {/* Live, aber nur beim Überschreiten der Grenze ändert sich der Text. */}
          <p
            id="welcome-password-rule"
            aria-live="polite"
            className={`mt-1.5 text-sm ${longEnough ? "text-green-700 font-semibold" : "text-muted"}`}
          >
            {longEnough
              ? `✓ ${t("ruleOk", { min: SIGNUP_MIN_PASSWORD })}`
              : t("rule", { min: SIGNUP_MIN_PASSWORD })}
          </p>
          {tooShort ? (
            <p id="welcome-password-error" role="alert" className="mt-1 text-sm text-red-700">
              {t("tooShort", { min: SIGNUP_MIN_PASSWORD })}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="welcome-company" className="block text-sm font-medium text-navy mb-1.5">
            {t("company")} <span className="font-normal text-muted">{t("optional")}</span>
          </label>
          <input
            id="welcome-company"
            className={field}
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="organization"
            maxLength={SIGNUP_MAX_COMPANY}
          />
        </div>

        <div className="flex gap-3 items-start bg-snow border border-muted/20 rounded-xl px-4 py-3 text-sm text-slate-text">
          <Lock className="w-5 h-5 text-royal shrink-0 mt-0.5" aria-hidden />
          <p>{t.rich("privacy", { b: (chunks) => <strong className="text-navy">{chunks}</strong> })}</p>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className={primary}>
          {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
          {t("cta")}
        </button>
        <p className="text-sm text-muted text-center">{t("staySignedIn")}</p>
      </form>
    </div>
  );
}

function OpenAppLink({ label }: { label: string }) {
  return (
    // /app liegt außerhalb der lokalisierten Routen (statische Web-App, siehe
    // next.config.ts) – ein gewöhnliches <a>, sonst würde next-intl auf
    // Englisch /en/app daraus machen.
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- /app ist keine Next-Seite; die Regel hält es für die dynamische [locale]-Route.
    <a href="/app/" className={primary}>
      {label}
    </a>
  );
}

function HowStep({ headingRef, trialEndsAt }: { headingRef: HeadingRef; trialEndsAt: number | null }) {
  const t = useTranslations("welcome.how");
  const locale = useLocale();
  // Drei Sätze, Schritt 1 im Plural: Mehrere Dokumente sind der Normalfall
  // (Akte, znerol74/custix#43).
  const steps: React.ReactNode[] = [
    t("step1"),
    t.rich("step2", {
      ph: (chunks) => (
        <span className="font-mono text-[0.95em] font-semibold text-navy bg-highlight-person rounded px-1">
          {chunks}
        </span>
      ),
    }),
    t("step3"),
  ];

  return (
    <div className={card}>
      <h1 ref={headingRef} tabIndex={-1} className={`${heading} mb-6`}>
        {t("heading")}
      </h1>
      <ol className="space-y-5 mb-8">
        {steps.map((text, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span
              aria-hidden
              className="w-9 h-9 shrink-0 rounded-full bg-royal text-white font-bold font-heading flex items-center justify-center"
            >
              {i + 1}
            </span>
            <span className="pt-1 text-lg text-slate-text">{text}</span>
          </li>
        ))}
      </ol>
      <OpenAppLink label={t("cta")} />
      <p className="mt-4 text-sm text-muted text-center">
        {trialEndsAt
          ? t("trial", { date: formatDate(new Date(trialEndsAt * 1000), locale) })
          : t("trialNoDate")}
      </p>
    </div>
  );
}

function ExistsStep({ headingRef }: { headingRef: HeadingRef }) {
  const t = useTranslations("welcome.exists");
  const { data: session } = useSession();

  return (
    <div className={`${card} text-center`}>
      <UserCheck className="w-12 h-12 text-royal mx-auto mb-4" aria-hidden />
      <h1 ref={headingRef} tabIndex={-1} className={`${heading} mb-3`}>
        {t("heading")}
      </h1>
      {session ? (
        <>
          <p className="text-slate-text/80 mb-6">{t("bodySignedIn")}</p>
          <OpenAppLink label={t("open")} />
        </>
      ) : (
        <>
          <p className="text-slate-text/80 mb-6">{t("body")}</p>
          <Link href={{ pathname: "/konto", query: { mode: "signin" } }} className={primary}>
            {t("signIn")}
          </Link>
          <Link
            href={{ pathname: "/konto", query: { mode: "forgot" } }}
            className="mt-4 inline-block text-sm text-muted hover:text-navy transition-colors"
          >
            {t("forgot")}
          </Link>
        </>
      )}
    </div>
  );
}

function InvalidStep({ headingRef }: { headingRef: HeadingRef }) {
  const t = useTranslations("welcome.invalid");
  return (
    <div className={`${card} text-center`}>
      <MailWarning className="w-12 h-12 text-amber mx-auto mb-4" aria-hidden />
      <h1 ref={headingRef} tabIndex={-1} className={`${heading} mb-3`}>
        {t("heading")}
      </h1>
      <p className="text-slate-text/80 mb-6">{t("body")}</p>
      <Link href="/konto" className={primary}>
        {t("cta")}
      </Link>
    </div>
  );
}

function FailedStep({ headingRef, onRetry }: { headingRef: HeadingRef; onRetry: () => void }) {
  const t = useTranslations("welcome");
  return (
    <div className={`${card} text-center`}>
      <h1 ref={headingRef} tabIndex={-1} className={`${heading} mb-3`}>
        {t("loadFailed")}
      </h1>
      <button type="button" onClick={onRetry} className={`${primary} mt-4`}>
        {t("retry")}
      </button>
    </div>
  );
}
