"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MailCheck } from "lucide-react";
import { authClient, signIn, signUp } from "@/lib/auth-client";

type Mode = "signup" | "signin" | "forgot";

/**
 * Registrierung, Anmeldung und Passwort-Zurücksetzen in einem Formular.
 * Bewusst auf /konto statt auf eigenen Seiten: die Preisseite schickt hierher,
 * und nach dem Anlegen steht der Nutzer direkt dort, wo die Testphase läuft.
 */
export function AuthForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== password2) {
      setError(t("errors.passwordMismatch"));
      return;
    }

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

      const res =
        mode === "signup"
          ? await signUp.email({ email, password, name, company })
          : await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message ?? t("errors.generic"));
        return;
      }

      // Direkter Einstieg: die Testphase startet mit der Registrierung, nicht
      // erst auf Knopfdruck. Schlägt sie fehl, bleibt der Knopf auf /konto.
      if (mode === "signup") {
        await fetch("/api/trial/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        }).catch(() => {});
      }
      onDone();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full px-4 py-3 rounded-lg border border-muted/30 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20";

  if (sent) {
    return (
      <div className="bg-surface rounded-2xl border border-muted/20 p-8 text-center">
        <MailCheck className="w-10 h-10 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-heading text-navy mb-2">
          {t("forgot.sentHeading")}
        </h2>
        <p className="text-slate-text/80 mb-2">{t("forgot.sentBody")}</p>
        <p className="text-sm text-muted">{t("spamHint")}</p>
        <button
          onClick={() => {
            setSent(false);
            setMode("signin");
          }}
          className="mt-6 text-sm text-royal underline hover:no-underline"
        >
          {t("toSignin")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-muted/20 p-8">
      <h2 className="text-xl font-bold font-heading text-navy mb-1">
        {t(`${mode}.heading`)}
      </h2>
      <p className="text-sm text-slate-text/80 mb-6">{t(`${mode}.sub`)}</p>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" ? (
          <>
            <input
              className={field}
              placeholder={t("fields.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
            <input
              className={field}
              placeholder={t("fields.company")}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              autoComplete="organization"
              required
            />
          </>
        ) : null}

        <input
          className={field}
          type="email"
          placeholder={t("fields.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {mode !== "forgot" ? (
          <input
            className={field}
            type="password"
            placeholder={t("fields.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        ) : null}

        {mode === "signup" ? (
          <input
            className={field}
            type="password"
            placeholder={t("fields.passwordRepeat")}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        ) : null}

        {error ? (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t(`${mode}.cta`)}
        </button>
      </form>

      <div className="mt-4 space-y-2 text-center">
        {mode === "signin" ? (
          <button
            onClick={() => {
              setMode("forgot");
              setError(null);
            }}
            className="block w-full text-sm text-muted hover:text-navy transition-colors"
          >
            {t("forgot.link")}
          </button>
        ) : null}
        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
          }}
          className="block w-full text-sm text-muted hover:text-navy transition-colors"
        >
          {mode === "signup" ? t("toSignin") : t("toSignup")}
        </button>
      </div>
    </div>
  );
}
