import React from "react";
import { C } from "../theme";
import { FONT } from "../fonts";
import { rgba } from "../util";

const KINDS = {
  pdf: { label: "PDF", color: "#DC2626" },
  docx: { label: "DOCX", color: C.royal },
} as const;

/** Die Datei, die rein- bzw. rausfliegt. PDF rein, fertiges .docx raus. */
export const FileCard: React.FC<{
  kind: keyof typeof KINDS;
  name: string;
}> = ({ kind, name }) => {
  const k = KINDS[kind];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 24px 16px 16px",
        background: C.surface,
        borderRadius: 14,
        border: `1px solid ${C.muted}30`,
        boxShadow: `0 18px 44px ${rgba(C.navy, 0.16)}`,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: 44,
          height: 52,
          borderRadius: 8,
          background: rgba(k.color, 0.1),
          border: `1px solid ${rgba(k.color, 0.3)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.body,
          fontSize: 12,
          fontWeight: 700,
          color: k.color,
          letterSpacing: 0.3,
        }}
      >
        {k.label}
      </div>
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 21,
          fontWeight: 500,
          color: C.navy,
        }}
      >
        {name}
      </span>
    </div>
  );
};
