import type { MetadataRoute } from "next";

const BASE_URL = "https://custix.ai";

const pages: {
  de: string;
  en: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { de: "/", en: "/en", priority: 1.0, changeFrequency: "weekly" },
  { de: "/fuer-anwaelte", en: "/en/for-lawyers", priority: 0.9, changeFrequency: "monthly" },
  { de: "/fuer-steuerberater", en: "/en/for-tax-advisors", priority: 0.9, changeFrequency: "monthly" },
  { de: "/fuer-hr", en: "/en/for-hr", priority: 0.9, changeFrequency: "monthly" },
  { de: "/fuer-gesundheitswesen", en: "/en/for-healthcare", priority: 0.9, changeFrequency: "monthly" },
  { de: "/fuer-versicherungen", en: "/en/for-insurance", priority: 0.9, changeFrequency: "monthly" },
  { de: "/preise", en: "/en/pricing", priority: 0.8, changeFrequency: "monthly" },
  { de: "/ueber-uns", en: "/en/about", priority: 0.7, changeFrequency: "monthly" },
  { de: "/kontakt", en: "/en/contact", priority: 0.7, changeFrequency: "monthly" },
  { de: "/impressum", en: "/en/legal-notice", priority: 0.3, changeFrequency: "yearly" },
  { de: "/datenschutz", en: "/en/privacy", priority: 0.3, changeFrequency: "yearly" },
  { de: "/agb", en: "/en/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((page) => [
    {
      url: `${BASE_URL}${page.de}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          de: `${BASE_URL}${page.de}`,
          en: `${BASE_URL}${page.en}`,
        },
      },
    },
    {
      url: `${BASE_URL}${page.en}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          de: `${BASE_URL}${page.de}`,
          en: `${BASE_URL}${page.en}`,
        },
      },
    },
  ]);
}
