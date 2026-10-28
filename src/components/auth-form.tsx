"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, Loader2, Mail, MailCheck } from "lucide-react";
import { authClient, signIn } from "@/lib/auth-client";
import { SIGNUP_EMAIL_FROM, signupConfirmSubject } from "@/lib/signup-email";
import { Link } from "@/i18n/navigation";

export type AuthMode = "signup" | "signin" | "forgot";

/**
 * Registrierung, Anmeldung und Passwort-Zurücksetzen auf /konto.
 *
 * Registrierung „E-Mail zuerst“ (mrgoofman/custix-ai#15, ADR-0013): nur
 * E-Mail und Haken bei AGB/Datenschutz → „Bitte sehen Sie in Ihr Postfach“ →
 * Link in der Mail → Passwort wählen auf /willkommen. Das Konto entsteht erst
 * dort. Ein leerer Haken sperrt den Knopf nicht, sondern bekommt einen
 * freundlichen Hinweis – gesperrte Knöpfe verwirren.
 *
 * Wiederkehrende melden sich wie bisher mit E-Mail und Passwort an;
 * „Passwort vergessen“ läuft über Better Auth. `/konto?mode=signin` bzw.
 * `?mode=forgot` öffnet das Formular direkt dort (Links aus der Mail
 * „Sie haben bereits ein Konto“ und aus der Web-App).
 */
export function AuthForm({
  initialMode = "signup",
  onDone,
}: {
  initialMode?: AuthMode;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  return mode === "signup" ? (
    <SignupForm onSignin={() => setMode("signin")} />
  ) : (
    <PasswordForms key={mode} mode={mode} onDone={onDone} onMode={setMode} />
  );
}

const card = "bg-surface rounded-2xl border border-muted/20 p-6 sm:p-8";
const field =
  "w-full px-4 py-3 rounded-lg border border-muted/30 bg-surface text-navy focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20";
const primaryButton =
  "w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2";
const quietButton = "text-sm text-muted hover:text-navy transition-colors";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Schritt 1: E-Mail + Haken. Danach dieselbe Komponente als „Bitte ins Postfach“. */
function SignupForm({ onSignin }: { onSignin: () => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [consentHint, setConsentHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Adresse, an die die Mail ging – gesetzt heißt „Bitte ins Postfach“. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  /** Nur lokale Vorschau ohne Resend: der Link aus der Mail. */
  const [devLink, setDevLink] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const checkHeadingRef = useRef<HTMLHeadingElement>(null);

  // Wechsel zu „Bitte ins Postfach“: Fokus auf die Überschrift, damit
  // Screenreader den neuen Inhalt vorlesen.
  useEffect(() => {
    if (sentTo) checkHeadingRef.current?.focus();
  }, [sentTo]);

  /** Fordert die Mail an; true bei Erfolg, sonst steht der Fehler in `error`. */
  const request = async (address: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, locale, consent: true }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        dev?: { link: string };
      };
      if (d.ok) {
        setDevLink(d.dev?.link ?? null);
        return true;
      }
      if (d.error === "invalid_email") {
        setEmailError(true);
        emailRef.current?.focus();
      } else if (d.error === "rate_limited") setError(t("signup.rateLimited"));
      else setError(t("signup.sendFailed"));
      return false;
    } catch {
      setError(t("signup.sendFailed"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    const emailOk = EMAIL_SHAPE.test(address);
    setEmailError(!emailOk);
    setConsentHint(!consent);
    if (!emailOk) {
      emailRef.current?.focus();
      return;
    }
    if (!consent) {
      consentRef.current?.focus();
      return;
    }
    if (await request(address)) {
      setResent(false);
      setSentTo(address);
    }
  };

  const resend = async () => {
    if (!sentTo) return;
    setResent(false);
    if (await request(sentTo)) setResent(true);
  };

  if (sentTo) {
    return (
      <div className={`${card} text-center`}>
        <MailCheck className="w-12 h-12 text-royal mx-auto mb-4" aria-hidden />
        <h1
          ref={checkHeadingRef}
          tabIndex={-1}
          className="text-2xl sm:text-3xl font-bold font-heading text-navy mb-3 outline-none"
        >
          {t("check.heading")}
        </h1>
        <p className="text-slate-text/80 mb-6 break-words">
          {t.rich("check.body", {
            email: sentTo,
            b: (chunks) => <strong className="text-navy">{chunks}</strong>,
          })}
        </p>

        {/* Absender und Betreff, damit niemand im Postfach suchen muss. */}
        <div className="flex gap-3 items-start text-left bg-snow border border-muted/20 rounded-xl px-4 py-3 mb-6">
          <Info className="w-5 h-5 text-royal shrink-0 mt-0.5" aria-hidden />
          <dl className="text-sm text-slate-text grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 min-w-0">
            <dt>{t("check.sender")}</dt>
            <dd className="font-semibold text-navy break-words">{SIGNUP_EMAIL_FROM}</dd>
            <dt>{t("check.subject")}</dt>
            <dd className="font-semibold text-navy break-words">
              {signupConfirmSubject(locale)}
            </dd>
          </dl>
        </div>

        <p className="text-sm text-slate-text/80">
          {t("check.spam")}{" "}
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="text-royal font-medium underline underline-offset-2 hover:no-underline disabled:opacity-60"
          >
            {t("check.resend")}
          </button>
          {busy ? <Loader2 className="inline w-4 h-4 ml-2 animate-spin" aria-hidden /> : null}
        </p>
        <p role="status" className="mt-2 min-h-5 text-sm text-green-700">
          {resent ? t("check.resent") : ""}
        </p>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setSentTo(null);
            setResent(false);
            setError(null);
            setDevLink(null);
          }}
          className={`mt-4 ${quietButton}`}
        >
          {t("check.otherEmail")}
        </button>

        {devLink ? (
          <div className="mt-6 text-left text-sm border-2 border-dashed border-amber rounded-xl px-4 py-3 bg-amber-light/50">
            <p className="text-slate-text mb-1">{t("check.devNote")}</p>
            <a href={devLink} className="font-semibold text-royal underline break-all">
              {t("check.devLink")}
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={card}>
      <h1 className="text-2xl sm:text-3xl font-bold font-heading text-navy mb-2">
        {t("signup.heading")}
      </h1>
      <p className="text-slate-text/80 mb-6">{t("signup.sub")}</p>

      {/* noValidate: Wir erklären selbst, was fehlt – statt der Browser-Blasen. */}
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-navy mb-1.5">
            {t("signup.email")}
          </label>
          <input
            ref={emailRef}
            id="signup-email"
            className={field}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(false);
            }}
            required
            aria-invalid={emailError || undefined}
            aria-describedby={emailError ? "signup-email-error" : undefined}
          />
          {emailError ? (
            <p id="signup-email-error" className="mt-1.5 text-sm text-red-700">
              {t("signup.emailInvalid")}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex gap-3 items-start">
            <input
              ref={consentRef}
              id="signup-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentHint(false);
              }}
              className="mt-0.5 w-5 h-5 shrink-0 accent-royal"
              required
              aria-invalid={consentHint || undefined}
              aria-describedby={consentHint ? "signup-consent-hint" : undefined}
            />
            {/* Klicks auf die Links öffnen das Dokument, ohne den Haken zu setzen. */}
            <label htmlFor="signup-consent" className="text-sm text-slate-text">
              {t.rich("signup.consent", {
                terms: (chunks) => (
                  <Link href="/agb" target="_blank" className="underline hover:text-navy">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/datenschutz" target="_blank" className="underline hover:text-navy">
                    {chunks}
                  </Link>
                ),
              })}
            </label>
          </div>
          {consentHint ? (
            <p
              id="signup-consent-hint"
              role="alert"
              className="mt-2 text-sm text-amber-900 bg-amber-light rounded-lg px-4 py-2.5"
            >
              {t("signup.consentHint")}
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Mail className="w-4 h-4" aria-hidden />
          )}
          {t("signup.cta")}
        </button>
      </form>

      <p className="mt-5 text-center">
        <button type="button" onClick={onSignin} className={quietButton}>
          {t("toSignin")}
        </button>
      </p>
    </div>
  );
}

/** Anmelden und „Passwort vergessen“ – wie bisher über Better Auth. */
function PasswordForms({
  mode,
  onDone,
  onMode,
}: {
  mode: "signin" | "forgot";
  onDone: () => void;
  onMode: (mode: AuthMode) => void;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        await authClient.requestPasswordReset({
          email,
          redirectTo: locale === "en" ? "/en/account" : "/konto",
        });
        // Immer Erfolg melden – ob die Adresse existiert, verraten wir nicht.
        setSent(true);
        return;
      }

      const res = await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message ?? t("errors.generic"));
        return;
      }
      onDone();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={`${card} text-center`}>
        <MailCheck className="w-10 h-10 text-green-600 mx-auto mb-4" aria-hidden />
        <h1 className="text-xl font-bold font-heading text-navy mb-2">
          {t("forgot.sentHeading")}
        </h1>
        <p className="text-slate-text/80 mb-2">{t("forgot.sentBody")}</p>
        <p className="text-sm text-muted">{t("spamHint")}</p>
        <button
          type="button"
          onClick={() => onMode("signin")}
          className="mt-6 text-sm text-royal underline hover:no-underline"
        >
          {t("toSignin")}
        </button>
      </div>
    );
  }

  return (
    <div className={card}>
      <h1 className="text-2xl sm:text-3xl font-bold font-heading text-navy mb-1">
        {t(`${mode}.heading`)}
      </h1>
      <p className="text-sm text-slate-text/80 mb-6">{t(`${mode}.sub`)}</p>

      <form onSubmit={submit} className="space-y-4">
        <input
          className={field}
          type="email"
          placeholder={t("fields.email")}
          aria-label={t("fields.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {mode === "signin" ? (
          <input
            className={field}
            type="password"
            placeholder={t("fields.password")}
            aria-label={t("fields.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
          {t(`${mode}.cta`)}
        </button>
      </form>

      <div className="mt-4 space-y-2 text-center">
        {mode === "signin" ? (
          <>
            <button type="button" onClick={() => onMode("forgot")} className={`block w-full ${quietButton}`}>
              {t("forgot.link")}
            </button>
            <button type="button" onClick={() => onMode("signup")} className={`block w-full ${quietButton}`}>
              {t("toSignup")}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => onMode("signin")} className={`block w-full ${quietButton}`}>
            {t("toSignin")}
          </button>
        )}
      </div>
    </div>
  );
}
