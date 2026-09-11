"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

/**
 * Neues Passwort setzen. Wird von /konto gezeigt, sobald in der URL ein
 * ?token= steht – dorthin führt der Link aus der Zurücksetzen-E-Mail.
 */
export function ResetPasswordForm({
  token,
  onDone,
}: {
  token: string;
  onDone: () => void;
}) {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError(t("errors.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const res = await authClient.resetPassword({ newPassword: password, token });
      if (res.error) {
        setError(res.error.message ?? t("errors.resetFailed"));
        return;
      }
      onDone();
    } catch {
      setError(t("errors.resetFailed"));
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full px-4 py-3 rounded-lg border border-muted/30 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20";

  return (
    <div className="bg-surface rounded-2xl border border-muted/20 p-8">
      <h2 className="text-xl font-bold font-heading text-navy mb-1">
        {t("reset.heading")}
      </h2>
      <p className="text-sm text-slate-text/80 mb-6">{t("reset.sub")}</p>

      <form onSubmit={submit} className="space-y-4">
        <input
          className={field}
          type="password"
          placeholder={t("fields.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
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
        {error ? (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t("reset.cta")}
        </button>
      </form>
    </div>
  );
}
