import { ChevronDown } from "lucide-react";

/**
 * Aufklappbare Fragen über <details>: funktioniert ohne JavaScript und damit
 * in Server- wie Client-Komponenten (Ratgeber, Ärzte-Seite). Die Startseite
 * hat mit components/faq.tsx eine ältere, zustandsbehaftete Variante.
 */
export function FaqAccordion({
  items,
  tone = "surface",
}: {
  items: { q: string; a: React.ReactNode }[];
  /** Kartenfarbe: `surface` auf hellem Grund, `snow` auf weißem Grund. */
  tone?: "surface" | "snow";
}) {
  const card = tone === "snow" ? "bg-snow" : "bg-surface";
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.q} className={`group ${card} rounded-xl border border-muted/20`}>
          <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-navy">
            {item.q}
            <ChevronDown
              className="w-5 h-5 text-muted shrink-0 transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="px-6 pb-5 text-sm text-slate-text/80 leading-relaxed">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
