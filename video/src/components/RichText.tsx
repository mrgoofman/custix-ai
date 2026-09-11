import React from "react";
import type { Seg } from "../data";
import { ENTITY_BG, ENTITY_INK, C } from "../theme";
import { rgba } from "../util";

export type EntityState = {
  /** 0..1 – wie stark der Highlight-Hintergrund sichtbar ist */
  bgAlpha: number;
  /** Platzhalter statt echtem Wert anzeigen */
  showToken: boolean;
  /** 0..1 – Opacity-Dip während des Tauschs */
  dip: number;
  /** 0..1 – rot markieren statt normal einfärben (Hook des 9:16-Cuts) */
  danger?: number;
};

const NEUTRAL: EntityState = { bgAlpha: 0, showToken: false, dip: 1 };

export const RichText: React.FC<{
  segments: Seg[];
  stateFor?: (order: number) => EntityState;
  /** Anzahl sichtbarer Zeichen (Tipp-Effekt). Weglassen = alles sichtbar. */
  revealChars?: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  color?: string;
  /** Inline am Textende – z. B. der Tipp-Cursor. */
  trailing?: React.ReactNode;
}> = ({
  segments,
  stateFor,
  revealChars,
  fontSize,
  lineHeight,
  fontFamily,
  color = C.slate,
  trailing,
}) => {
  const reveal = revealChars ?? Number.POSITIVE_INFINITY;
  let consumed = 0;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        lineHeight,
        color,
        whiteSpace: "pre-wrap",
        letterSpacing: -0.2,
      }}
    >
      {segments.map((seg, i) => {
        const st = seg.t === "text" ? NEUTRAL : (stateFor?.(seg.order) ?? NEUTRAL);
        const full =
          seg.t === "text" ? seg.text : st.showToken ? seg.token : seg.text;

        const start = consumed;
        consumed += full.length;

        const visibleCount = Math.max(0, Math.min(full.length, reveal - start));
        if (visibleCount === 0) return null;
        const visible = full.slice(0, visibleCount);

        if (seg.t === "text") {
          return <span key={i}>{visible}</span>;
        }

        const danger = st.danger ?? 0;
        return (
          <span
            key={i}
            style={{
              backgroundColor:
                danger > 0
                  ? rgba("#DC2626", 0.16 * danger)
                  : rgba(ENTITY_BG[seg.t], st.bgAlpha),
              color:
                danger > 0.35
                  ? "#B91C1C"
                  : st.bgAlpha > 0.5
                    ? ENTITY_INK[seg.t]
                    : color,
              borderRadius: 6,
              padding: `3px ${(5 * Math.max(st.bgAlpha, danger)).toFixed(2)}px`,
              opacity: st.dip,
              fontWeight: st.showToken ? 500 : 400,
              transition: "none",
            }}
          >
            {visible}
          </span>
        );
      })}
      {trailing}
    </div>
  );
};
