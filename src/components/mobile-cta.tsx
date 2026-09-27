"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { trackEvent } from "@/lib/analytics";

export function MobileCta() {
  const t = useTranslations("nav");
  const tDoctors = useTranslations("doctors");
  const { data: session } = useSession();
  const pathname = usePathname();

  // Auf der Ärzte-Seite führt jeder CTA direkt in die kostenlose Web-App
  // (mrgoofman/custix-ai#9); der Umweg über /konto wäre dort irreführend.
  const onDoctorsPage = pathname === "/fuer-aerzte";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[80] p-3 bg-surface/95 backdrop-blur border-t border-muted/20">
      {onDoctorsPage ? (
        // eslint-disable-next-line @next/next/no-html-link-for-pages -- /app ist die statische Web-App, keine Next-Seite (siehe next.config.ts).
        <a
          href="/app/"
          onClick={() => trackEvent("doctors_cta_click", { position: "mobile" })}
          className="block w-full text-center py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors text-sm"
        >
          {tDoctors("cta")}
        </a>
      ) : (
        <Link
          href="/konto"
          className="block w-full text-center py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors text-sm"
        >
          {session ? t("account") : t("cta")}
        </Link>
      )}
    </div>
  );
}
