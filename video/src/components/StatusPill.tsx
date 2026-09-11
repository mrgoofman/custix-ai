import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "../theme";
import { FONT } from "../fonts";
import { useTiming } from "../timing";
import { SOURCE_FILE } from "../data";
import { rgba, dipAt } from "../util";

/**
 * Der Timer ist der wichtigste Beweis im Loop: er belegt das
 * "<5 Sekunden"-Versprechen der Website, statt es zu behaupten.
 */
export const StatusPill: React.FC = () => {
  const f = useCurrentFrame();
  const t = useTiming();

  const seconds = interpolate(f, [t.scanStart, t.scanEnd], [0, 4.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fmt = (n: number) => n.toFixed(1).replace(".", ",");

  const FERTIG_END = t.exitStart + 20;

  let label: string;
  let dot: string;
  if (f < t.dropLand || f >= FERTIG_END) {
    label = "Bereit";
    dot = C.muted;
  } else if (f < t.scanStart) {
    label = SOURCE_FILE;
    dot = C.muted;
  } else if (f < t.swapStart) {
    label = `Pseudonymisiere …  ${fmt(seconds)} s`;
    dot = C.royal;
  } else if (f < t.clearAt) {
    label = "Pseudonymisiert  ·  4,2 s";
    dot = C.green;
  } else if (f < t.pasteBackAt) {
    // Feld ist geleert – hier wird die KI-Antwort erwartet
    label = "Bereit";
    dot = C.muted;
  } else if (f < t.reidStart) {
    label = "Eingefügt";
    dot = C.royal;
  } else if (f < t.reidEnd) {
    label = "Re-identifiziere …";
    dot = C.royal;
  } else {
    label = "Fertig";
    dot = C.green;
  }

  const opacity = dipAt(f, [
    t.dropLand,
    t.scanStart,
    t.swapStart,
    t.clearAt,
    t.pasteBackAt,
    t.reidStart,
    t.reidEnd,
    FERTIG_END,
  ]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 16px",
        borderRadius: 999,
        background: rgba(dot, 0.1),
        border: `1px solid ${rgba(dot, 0.28)}`,
        opacity,
      }}
    >
      <div style={{ width: 9, height: 9, borderRadius: 999, background: dot }} />
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 16,
          fontWeight: 600,
          color: dot === C.muted ? C.muted : C.navy,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
};
