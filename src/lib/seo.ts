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

/** Every indexable internal route key (download is excluded — it's token-gated). */
export const INDEXABLE_ROUTE_KEYS = Object.keys(pathnames);

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
  const canonical = localizedUrl(routeKey, locale);
  const ogImage = `${BASE_URL}/og-image.png`;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical,
      languages: {
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
      locale: locale === "de" ? "de_AT" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "custix" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: index ? undefined : { index: false, follow: false },
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
