"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const ORIGINAL_DATA = {
  legal: [
    { text: "Re: Claim of ", type: "text" },
    { text: "John Smith", type: "person" },
    { text: " (Case ", type: "text" },
    { text: "#2024-1847", type: "id" },
    { text: ")\n\nDear colleagues,\n\nOur client, ", type: "text" },
    { text: "John Smith", type: "person" },
    { text: ", residing at ", type: "text" },
    { text: "42 Oak Street, Vienna", type: "address" },
    { text: ", has instructed us to file a claim regarding the contract dated ", type: "text" },
    { text: "15.03.2024", type: "id" },
    { text: ". The opposing party, ", type: "text" },
    { text: "Maria Weber", type: "person" },
    { text: ", failed to deliver...", type: "text" },
  ],
  tax: [
    { text: "Tax Return ", type: "text" },
    { text: "2024", type: "id" },
    { text: "\n\nTaxpayer: ", type: "text" },
    { text: "Thomas Müller", type: "person" },
    { text: "\nTax ID: ", type: "text" },
    { text: "DE-198-472-391", type: "id" },
    { text: "\nAddress: ", type: "text" },
    { text: "Hauptstraße 15, Munich", type: "address" },
    { text: "\n\nIncome from employment at ", type: "text" },
    { text: "Tech Solutions GmbH", type: "person" },
    { text: ": €78,500\nCapital gains: €3,200...", type: "text" },
  ],
};

const ANON_DATA = {
  legal: [
    { text: "Re: Claim of ", type: "text" },
    { text: "[PERSON-1]", type: "person" },
    { text: " (Case ", type: "text" },
    { text: "[ID-001]", type: "id" },
    { text: ")\n\nDear colleagues,\n\nOur client, ", type: "text" },
    { text: "[PERSON-1]", type: "person" },
    { text: ", residing at ", type: "text" },
    { text: "[ADDRESS-1]", type: "address" },
    { text: ", has instructed us to file a claim regarding the contract dated ", type: "text" },
    { text: "[DATE-1]", type: "id" },
    { text: ". The opposing party, ", type: "text" },
    { text: "[PERSON-2]", type: "person" },
    { text: ", failed to deliver...", type: "text" },
  ],
  tax: [
    { text: "Tax Return ", type: "text" },
    { text: "[YEAR-1]", type: "id" },
    { text: "\n\nTaxpayer: ", type: "text" },
    { text: "[PERSON-1]", type: "person" },
    { text: "\nTax ID: ", type: "text" },
    { text: "[TAX-ID-1]", type: "id" },
    { text: "\nAddress: ", type: "text" },
    { text: "[ADDRESS-1]", type: "address" },
    { text: "\n\nIncome from employment at ", type: "text" },
    { text: "[ORG-1]", type: "person" },
    { text: ": €78,500\nCapital gains: €3,200...", type: "text" },
  ],
};

type Phase = "original" | "highlighting" | "anonymized";

const highlightColor: Record<string, string> = {
  person: "bg-highlight-person",
  address: "bg-highlight-address",
  id: "bg-amber-light",
};

function DocumentCard({
  title,
  data,
  phase,
}: {
  title: string;
  data: { text: string; type: string }[];
  phase: Phase;
}) {
  return (
    <div className="bg-surface rounded-xl border border-muted/20 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-snow border-b border-muted/20 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="text-xs font-medium text-muted ml-2">{title}</span>
      </div>
      <div className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap min-h-[200px]">
        {data.map((segment, i) => {
          const isEntity = segment.type !== "text";
          const shouldHighlight = isEntity && (phase === "highlighting" || phase === "anonymized");
          return (
            <span
              key={i}
              className={`transition-all duration-500 ${
                shouldHighlight
                  ? `${highlightColor[segment.type]} rounded px-0.5 py-0.5`
                  : ""
              } ${
                isEntity && phase === "highlighting"
                  ? "animate-pulse"
                  : ""
              }`}
            >
              {segment.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function AnonymizationMockup() {
  const t = useTranslations("mockup");
  const [phase, setPhase] = useState<Phase>("original");

  useEffect(() => {
    const cycle = () => {
      setPhase("original");
      setTimeout(() => setPhase("highlighting"), 1500);
      setTimeout(() => setPhase("anonymized"), 3500);
    };
    cycle();
    const interval = setInterval(cycle, 7000);
    return () => clearInterval(interval);
  }, []);

  const data = phase === "anonymized" ? ANON_DATA : ORIGINAL_DATA;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Phase indicator */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {(["original", "highlighting", "anonymized"] as const).map((p) => (
          <div
            key={p}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              phase === p
                ? "bg-royal text-white"
                : "bg-snow text-muted"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                phase === p ? "bg-white" : "bg-muted/40"
              }`}
            />
            {p === "original" && t("original")}
            {p === "highlighting" && "..."}
            {p === "anonymized" && t("anonymized")}
          </div>
        ))}
      </div>

      {/* Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocumentCard
          title={t("legalBrief")}
          data={data.legal}
          phase={phase}
        />
        <DocumentCard
          title={t("taxFiling")}
          data={data.tax}
          phase={phase}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-highlight-person" />
          <span>Persons</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-highlight-address" />
          <span>Addresses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-light" />
          <span>IDs / Dates</span>
        </div>
      </div>

      {/* Re-identify button */}
      {phase === "anonymized" && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setPhase("original")}
            className="px-4 py-2 text-sm font-medium text-royal border border-royal/30 rounded-lg hover:bg-royal/5 transition-colors animate-pulse-glow"
          >
            ↩ {t("reidentify")}
          </button>
        </div>
      )}
    </div>
  );
}
