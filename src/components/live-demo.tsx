"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { DEMO_DOCUMENTS, type DemoKind, type DemoSegment } from "@/content/live-demo";

/**
 * Live-Demo der Startseite (mrgoofman/custix-ai#15): Wer zögert, sieht das
 * Ergebnis, bevor er etwas eingibt – mit unserem eigenen, erfundenen Beispiel,
 * nicht mit einem eigenen Dokument. Vorbereitete Vorher/Nachher-Ansicht, keine
 * Erkennung im Browser. Zwei Dokumente einer Akte zeigen, dass dieselbe
 * Partei überall denselben Platzhalter trägt.
 *
 * Startet auf „Anonymisiert“: das Ergebnis ist die Botschaft. Kein
 * Automatik-Wechsel und keine Bewegung – der Schalter gehört dem Besucher.
 */
type View = "original" | "anonymized";

const MARK: Record<DemoKind, string> = {
  person: "bg-highlight-person",
  org: "bg-highlight-org",
  addr: "bg-highlight-address",
  id: "bg-highlight-id",
};

export function LiveDemo() {
  const t = useTranslations("demo");
  const locale = useLocale();
  const [view, setView] = useState<View>("anonymized");
  const documents = DEMO_DOCUMENTS[locale === "en" ? "en" : "de"];

  return (
    <div className="w-full bg-surface rounded-2xl border border-muted/20 shadow-xl shadow-navy/10 p-4 sm:p-5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm font-semibold text-navy">{t("heading")}</p>
        <div
          role="group"
          aria-label={t("view")}
          className="inline-flex rounded-lg bg-snow border border-muted/20 p-1"
        >
          {(["original", "anonymized"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                view === v ? "bg-royal text-white shadow-sm" : "text-slate-text hover:text-navy"
              }`}
            >
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <figure
            key={doc.file}
            className="rounded-xl border border-muted/20 bg-snow/60 overflow-hidden"
          >
            <figcaption className="flex items-center gap-2 px-3 py-2 border-b border-muted/20 bg-snow text-xs font-medium text-muted">
              <FileText className="w-3.5 h-3.5" aria-hidden />
              {doc.file}
            </figcaption>
            <p className="px-3 py-3 text-sm leading-relaxed text-slate-text">
              {doc.segments.map((segment, i) => (
                <Segment key={i} segment={segment} view={view} />
              ))}
            </p>
          </figure>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-text/80">
        {t.rich("shared", {
          ph: (chunks) => (
            <span className="font-mono font-semibold text-navy bg-highlight-person rounded px-1">
              {chunks}
            </span>
          ),
        })}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
        {(Object.keys(MARK) as DemoKind[]).map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${MARK[kind]}`} aria-hidden />
            {t(`legend.${kind}`)}
          </span>
        ))}
        <span className="ml-auto font-semibold text-amber-900 bg-amber-light rounded-full px-2.5 py-0.5">
          {t("sample")}
        </span>
      </div>
    </div>
  );
}

function Segment({ segment, view }: { segment: DemoSegment; view: View }) {
  if (typeof segment === "string") return <>{segment}</>;
  const anonymized = view === "anonymized";
  return (
    <span
      className={`${MARK[segment.k]} rounded px-0.5 text-navy ${
        anonymized ? "font-mono text-[0.92em] font-semibold" : ""
      }`}
    >
      {anonymized ? segment.ph : segment.t}
    </span>
  );
}
