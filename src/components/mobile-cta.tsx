"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";

export function MobileCta() {
  const t = useTranslations("nav");
  const { data: session } = useSession();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[80] p-3 bg-surface/95 backdrop-blur border-t border-muted/20">
      <Link
        href="/konto"
        className="block w-full text-center py-3 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors text-sm"
      >
        {session ? t("account") : t("cta")}
      </Link>
    </div>
  );
}
