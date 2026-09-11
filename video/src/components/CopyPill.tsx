import React from "react";
import { C } from "../theme";
import { FONT } from "../fonts";
import { rgba } from "../util";

/** „Kopieren" → nach dem Klick „Kopiert". Der Zustandswechsel ist der Beleg. */
export const CopyPill: React.FC<{ copied: boolean; scale?: number }> = ({
  copied,
  scale = 1,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 9 * scale,
      padding: `${9 * scale}px ${17 * scale}px`,
      borderRadius: 999,
      background: copied ? rgba(C.green, 0.12) : C.surface,
      border: `1px solid ${copied ? rgba(C.green, 0.4) : C.muted + "44"}`,
      boxShadow: copied ? "none" : `0 2px 8px ${rgba(C.navy, 0.08)}`,
      fontFamily: FONT.body,
      fontSize: 17 * scale,
      fontWeight: 600,
      color: copied ? "#15803D" : C.navy,
      whiteSpace: "nowrap",
    }}
  >
    {copied ? (
      <svg width={16 * scale} height={16 * scale} viewBox="0 0 16 16" fill="none">
        <path
          d="M3.5 8.4 6.4 11.3 12.5 5.2"
          stroke="#15803D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg width={16 * scale} height={16 * scale} viewBox="0 0 16 16" fill="none">
        <rect x={5.2} y={5.2} width={8.3} height={8.3} rx={2} stroke={C.navy} strokeWidth={1.6} />
        <path
          d="M10.8 5.2V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5.3A1.5 1.5 0 0 0 4 10.8h1.2"
          stroke={C.navy}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </svg>
    )}
    {copied ? "Kopiert" : "Kopieren"}
  </div>
);
