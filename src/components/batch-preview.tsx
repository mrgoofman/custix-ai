"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Archive, CheckCircle2, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

/**
 * Animierte Stapel-Vorschau für die Ärzte-Seite (mrgoofman/custix-ai#9):
 * Mehrere Befund-Karten laufen nacheinander durch die Status der Web-App
 * (wartet → wird gelesen → wird erkannt → wird geprüft → fertig), am Ende
 * erscheint der ZIP-Download. Reine Darstellung im Stil der bestehenden
 * Anonymisierungs-Vorschau: erfundene Dateinamen, nichts wird hochgeladen,
 * nichts verarbeitet, der „Download" ist kein Link.
 *
 * Reduzierte Bewegung: Statt der Animation steht der fertige Stapel.
 */
type Phase = "waiting" | "reading" | "detecting" | "checking" | "done";

/** Dauer je Phase in Millisekunden; eine Datei braucht zusammen 3 s. */
const PHASES: { phase: Exclude<Phase, "waiting" | "done">; ms: number }[] = [
  { phase: "reading", ms: 900 },
  { phase: "detecting", ms: 1400 },
  { phase: "checking", ms: 700 },
];
const FILE_MS = PHASES.reduce((sum, p) => sum + p.ms, 0);
/** Pause mit fertigem Stapel, bevor die Schleife von vorn beginnt. */
const REST_MS = 4000;
const TICK_MS = 100;

/** Zustand der Datei `index`, wenn seit Schleifenstart `elapsed` ms vergangen sind. */
function stateAt(elapsed: number, index: number): { phase: Phase; progress: number } {
  const local = elapsed - index * FILE_MS;
  if (local < 0) return { phase: "waiting", progress: 0 };
  if (local >= FILE_MS) return { phase: "done", progress: 100 };
  let acc = 0;
  let phase: Phase = PHASES[PHASES.length - 1].phase;
  for (const p of PHASES) {
    if (local < acc + p.ms) {
      phase = p.phase;
      break;
    }
    acc += p.ms;
  }
  return { phase, progress: Math.round((local / FILE_MS) * 100) };
}

export function BatchPreview() {
  const t = useTranslations("doctors.preview");
  const files = t.raw("files") as string[];
  const total = files.length;
  const cycleMs = total * FILE_MS + REST_MS;

  const [reduced, setReduced] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed((Date.now() - startedAt) % cycleMs);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [reduced, cycleMs]);

  // Bei reduzierter Bewegung steht die Schleife am Ende: alles fertig, ZIP sichtbar.
  const shownElapsed = reduced ? total * FILE_MS : elapsed;
  const states = files.map((_, i) => stateAt(shownElapsed, i));
  const doneCount = states.filter((s) => s.phase === "done").length;
  const allDone = doneCount === total;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-surface rounded-2xl border border-muted/20 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-snow border-b border-muted/20 flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden>
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-xs font-medium text-muted ml-2">custix</span>
          <span className="ml-auto text-xs font-semibold text-amber bg-amber-light rounded-full px-2.5 py-0.5">
            {t("sample")}
          </span>
        </div>

        {/* Bewusst keine Live-Region: eine Endlosschleife würde Screenreader
            dauerhaft mit Statuswechseln beschallen. Die Vorschau ist Illustration. */}
        <ul className="divide-y divide-muted/20">
          {files.map((name, i) => {
            const s = states[i];
            const isImage = /\.(jpe?g|png)$/i.test(name);
            const Icon = isImage ? ImageIcon : FileText;
            const nameId = `batch-preview-file-${i}`;
            return (
              <li key={name} className="px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                    s.phase === "done" ? "bg-green-50" : "bg-navy/5"
                  }`}
                >
                  {s.phase === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden />
                  ) : (
                    <Icon className="w-5 h-5 text-navy" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span id={nameId} className="truncate text-sm font-medium text-navy font-mono">
                      {name}
                    </span>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold ${
                        s.phase === "done"
                          ? "text-green-700"
                          : s.phase === "waiting"
                            ? "text-muted"
                            : "text-royal"
                      }`}
                    >
                      {s.phase !== "done" && s.phase !== "waiting" ? (
                        <Loader2
                          className={`w-3.5 h-3.5 ${reduced ? "" : "animate-spin"}`}
                          aria-hidden
                        />
                      ) : null}
                      {t(`status.${s.phase}`)}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 rounded-full bg-navy/5 overflow-hidden"
                    role="progressbar"
                    aria-labelledby={nameId}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={s.progress}
                  >
                    {/* Beim Neustart der Schleife springt der Balken ohne
                        Übergang auf 0, sonst liefe er kurz rückwärts. */}
                    <div
                      className={`h-full rounded-full ${
                        s.phase === "done" ? "bg-green-500" : "bg-royal"
                      } ${
                        reduced || s.phase === "waiting"
                          ? ""
                          : "transition-[width] duration-200 ease-linear"
                      }`}
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="px-4 sm:px-6 py-4 bg-snow border-t border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {t("progress", { done: doneCount, total })}
          </span>
          {/* Kein Link und kein Button: hier gibt es nichts herunterzuladen.
              Einblenden weich, ausblenden sofort – sonst stünde der ZIP-Knopf
              beim Neustart der Schleife noch neben „0 von 4 fertig". */}
          <span
            aria-hidden={!allDone}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-royal text-white text-sm font-semibold ${
              allDone
                ? "opacity-100 transition-opacity duration-500"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <Archive className="w-4 h-4" aria-hidden />
            {t("zip", { count: total })}
          </span>
        </div>
      </div>

      {reduced ? (
        <p className="mt-3 text-center text-xs text-muted">{t("reducedMotion")}</p>
      ) : null}
    </div>
  );
}
