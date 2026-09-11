import React from "react";
import { C } from "../theme";
import { FONT } from "../fonts";

export const WindowChrome: React.FC<{
  title: string;
  right?: React.ReactNode;
}> = ({ title, right }) => (
  <div
    style={{
      height: 56,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 20px",
      background: C.snow,
      borderBottom: `1px solid ${C.muted}33`,
    }}
  >
    <div style={{ display: "flex", gap: 8 }}>
      {["#F87171", C.amber, "#4ADE80"].map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />
      ))}
    </div>
    <span
      style={{
        fontFamily: FONT.body,
        fontSize: 17,
        fontWeight: 500,
        color: C.muted,
        marginLeft: 6,
      }}
    >
      {title}
    </span>
    <div style={{ marginLeft: "auto" }}>{right}</div>
  </div>
);
