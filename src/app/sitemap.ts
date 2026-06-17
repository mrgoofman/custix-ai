import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTE_KEYS, localizedUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return INDEXABLE_ROUTE_KEYS.map((routeKey) => ({
    url: localizedUrl(routeKey, "de"),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: routeKey === "/" ? 1 : 0.8,
    alternates: {
      languages: {
        de: localizedUrl(routeKey, "de"),
        en: localizedUrl(routeKey, "en"),
      },
    },
  }));
}
