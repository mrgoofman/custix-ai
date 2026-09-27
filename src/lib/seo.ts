import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://custix.ai";

type Locale = (typeof routing.locales)[number];

// next-intl pathnames: key = internal path, value = string or { de, en }
const pathnames = routing.pathnames as Record<
  string,
  string | Record<Locale, string>
>;

/**
 * Absolute URL for an internal route key in a given locale, honouring the
 * `as-needed` prefix (default locale `de` has no prefix, `en` is prefixed).
 */
export function localizedUrl(routeKey: string, locale: string): string {
  const entry = pathnames[routeKey] ?? routeKey;
  const path = typeof entry === "string" ? entry : entry[locale as Locale];
  if (locale === routing.defaultLocale) {
    return BASE_URL + (path === "/" ? "" : path);
  }
  return BASE_URL + `/${locale}` + (path === "/" ? "" : path);
}

/**
 * Fertig gebaute, aber noch nicht freigeschaltete Seiten. Dieser Satz steuert
 * noindex (buildMetadata) und den Ausschluss aus der Sitemap; Navigation und
 * Footer sind von Hand verdrahtet und verlinken solche Seiten schlicht noch
 * nicht. Der Go-live (mrgoofman/custix-ai#11) nimmt den Schlüssel hier heraus
 * und ergänzt die Links in navbar.tsx, footer.tsx und audience-cards.tsx.
 */
export const HIDDEN_ROUTE_KEYS: ReadonlySet<string> = new Set(["/fuer-aerzte"]);

export function isHiddenRoute(routeKey: string): boolean {
  return HIDDEN_ROUTE_KEYS.has(routeKey);
}

/**
 * Alle Routenschlüssel für die Sitemap außer den verborgenen. (/download und
 * /konto stehen mit drin; /download sperrt robots.ts, /konto ist per eigener
 * Metadata noindex – so war es schon vor den verborgenen Seiten.)
 */
export const INDEXABLE_ROUTE_KEYS = Object.keys(pathnames).filter(
  (key) => !isHiddenRoute(key),
);

/**
 * Routen, die es nur auf Deutsch gibt (der Ratgeber-Bereich, siehe
 * mrgoofman/custix-ai#6). Sie haben eine kanonische DE-URL, keine hreflang-
 * Alternativen und stehen nur mit der DE-URL in der Sitemap; ein Aufruf unter
 * /en/… liefert den deutschen Text mit noindex.
 */
export function isGermanOnlyRoute(routeKey: string): boolean {
  return routeKey === "/ratgeber" || routeKey.startsWith("/ratgeber/");
}

export function buildMetadata({
  locale,
  routeKey,
  title,
  description,
  index = true,
}: {
  locale: string;
  routeKey: string;
  title: string;
  description: string;
  index?: boolean;
}): Metadata {
  const germanOnly = isGermanOnlyRoute(routeKey);
  const canonical = localizedUrl(routeKey, germanOnly ? "de" : locale);
  const ogImage = `${BASE_URL}/og-image.png`;
  // Die EN-Ausgabe einer deutschen Seite ist ein Duplikat: nicht indexieren,
  // Links aber verfolgen lassen. Verborgene Seiten sind bis zum Go-live
  // grundsätzlich noindex.
  const indexable =
    index && !isHiddenRoute(routeKey) && !(germanOnly && locale !== "de");

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical,
      languages: germanOnly
        ? undefined
        : {
            de: localizedUrl(routeKey, "de"),
            en: localizedUrl(routeKey, "en"),
            "x-default": localizedUrl(routeKey, "de"),
          },
    },
    openGraph: {
      type: "website",
      siteName: "custix",
      title,
      description,
      url: canonical,
      locale: germanOnly || locale === "de" ? "de_AT" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "custix" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    // Nicht indexieren, aber Links folgen lassen, solange die Seite an sich
    // öffentlich gedacht ist (verborgen bis Go-live, EN-Duplikat). Nur wer
    // ausdrücklich index=false verlangt, bekommt auch nofollow.
    robots: indexable ? undefined : { index: false, follow: index },
  };
}

/**
 * Convenience for a page's `generateMetadata`: pulls the localized title +
 * description from the `pageMeta` namespace and builds the full Metadata.
 */
export async function pageMetadata(
  locale: string,
  routeKey: string,
  metaKey: string,
  index = true,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pageMeta" });
  return buildMetadata({
    locale,
    routeKey,
    title: t(`${metaKey}.title`),
    description: t(`${metaKey}.description`),
    index,
  });
}
