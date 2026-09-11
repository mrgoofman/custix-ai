import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { useTiming } from "../timing";
import { ramp, rgba } from "../util";

export const ScanLine: React.FC<{ height: number }> = ({ height }) => {
  const f = useCurrentFrame();
  const t = useTiming();
  if (f < t.scanStart - 4 || f > t.scanEnd + 6) return null;

  const p = ramp(f, t.scanStart, t.scanEnd);
  const fadeIn = ramp(f, t.scanStart - 4, t.scanStart + 6);
  const fadeOut = 1 - ramp(f, t.scanEnd - 10, t.scanEnd + 6);
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: p * height,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 90,
          background: `linear-gradient(to bottom, ${rgba(C.royal, 0)}, ${rgba(C.royal, 0.09)})`,
        }}
      />
      <div
        style={{
          height: 2,
          background: `linear-gradient(to right, ${rgba(C.royal, 0)}, ${rgba(
            C.royal,
            0.9
          )} 20%, ${rgba(C.royal, 0.9)} 80%, ${rgba(C.royal, 0)})`,
          boxShadow: `0 0 16px ${rgba(C.royal, 0.55)}`,
        }}
      />
    </div>
  );
};
