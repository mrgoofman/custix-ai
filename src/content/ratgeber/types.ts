import type { routing } from "@/i18n/routing";

/**
 * Inhaltsmodell der Ratgeber (mrgoofman/custix-ai#6). Die Texte liegen als
 * TypeScript-Module unter src/content/ratgeber/, nicht in messages/*.json:
 * Ratgeber gibt es nur auf Deutsch, und ein Artikel ist keine Übersetzungs-
 * einheit, sondern strukturierter Inhalt (Abschnitte, Tabellen, FAQ), aus dem
 * auch die strukturierten Daten (Article, FAQPage) erzeugt werden.
 *
 * Fließtext darf zwei Auszeichnungen enthalten, siehe components/rich-text.tsx:
 * `[Text](/pfad oder https://…)` für Links und `**Text**` für Hervorhebungen.
 */
export type InlineText = string;

export type GuideBlock =
  | { type: "p"; text: InlineText }
  | { type: "ul"; items: InlineText[] }
  | { type: "ol"; items: InlineText[] }
  | { type: "table"; head: string[]; rows: InlineText[][] }
  /** Hervorgehobener Kasten, z. B. die Kurzantwort oder ein Hinweis. */
  | { type: "callout"; title?: string; text: InlineText }
  /** Vorher/Nachher-Beispiel, z. B. ein Satz vor und nach der Pseudonymisierung. */
  | {
      type: "example";
      title: string;
      before: string;
      after: string;
      note?: InlineText;
    };

export type GuideSection = {
  /** Anker für Inhaltsverzeichnis und Deep-Links, z. B. "unterschied". */
  id: string;
  heading: string;
  blocks: GuideBlock[];
};

type RouteKey = keyof typeof routing.pathnames;
export type GuideRouteKey = Extract<RouteKey, `/ratgeber/${string}`>;

export type Guide = {
  /** Routenschlüssel aus src/i18n/routing.ts, z. B. "/ratgeber/…"; identifiziert den Ratgeber. */
  routeKey: GuideRouteKey;
  /** H1. */
  title: string;
  /** <title>; enthält das Kern-Keyword. */
  metaTitle: string;
  /** Meta-Description, rund 150 Zeichen. */
  description: string;
  /** Untertitel unter der H1 und Teaser in der Übersicht. */
  teaser: string;
  /** ISO-Datum, z. B. "2026-09-27". */
  published: string;
  updated: string;
  readingMinutes: number;
  /** Absätze vor dem ersten Abschnitt. */
  intro: InlineText[];
  sections: GuideSection[];
  faq: { q: string; a: InlineText }[];
};
