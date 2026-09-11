import React from "react";
import { C } from "../theme";
import { FONT } from "../fonts";
import { rgba } from "../util";

/** Leerzustand des Dokumentfensters – Start und Ende des Loops. */
export const Dropzone: React.FC<{
  opacity: number;
  active: number;
  label?: string;
}> = ({ opacity, active, label = "PDF hier ablegen" }) => (
  <div
    style={{
      position: "absolute",
      inset: 22,
      borderRadius: 14,
      border: `2px dashed ${rgba(C.royal, 0.25 + active * 0.5)}`,
      background: rgba(C.royal, active * 0.05),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      opacity,
    }}
  >
    <svg width={46} height={46} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
        stroke={rgba(C.royal, 0.45 + active * 0.4)}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span
      style={{
        fontFamily: FONT.body,
        fontSize: 22,
        fontWeight: 500,
        color: rgba(C.navy, 0.45 + active * 0.35),
      }}
    >
      {label}
    </span>
  </div>
);
