import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { C } from "../theme";
import { ramp, bell, rgba } from "../util";

/**
 * Mauszeiger, der zu einem Ziel fährt und dort klickt. Liegt bewusst INNERHALB
 * des jeweiligen Fensters – so stimmen Position und Größe automatisch, egal in
 * welchem Format oder mit welchem fontScale das Fenster gerade steht.
 */
export const Cursor: React.FC<{
  from: [number, number];
  to: [number, number];
  moveStart: number;
  clickAt: number;
  /** Wie lange der Zeiger nach dem Klick noch steht */
  linger?: number;
  scale?: number;
}> = ({ from, to, moveStart, clickAt, linger = 30, scale = 1 }) => {
  const f = useCurrentFrame();

  const opacity =
    ramp(f, moveStart - 12, moveStart + 4) *
    (1 - ramp(f, clickAt + linger, clickAt + linger + 16));
  if (opacity <= 0) return null;

  const p = interpolate(f, [moveStart, clickAt - 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p;

  // Druckpunkt: kurzes Einsinken plus auslaufender Ring
  const press = bell(ramp(f, clickAt - 2, clickAt + 10));
  const ring = ramp(f, clickAt, clickAt + 22);

  return (
    <>
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: "absolute",
            left: to[0] - 30 * ring * scale,
            top: to[1] - 30 * ring * scale,
            width: 60 * ring * scale,
            height: 60 * ring * scale,
            borderRadius: 999,
            border: `${3 * scale}px solid ${rgba(C.royal, 0.55 * (1 - ring))}`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          opacity,
          transform: `scale(${(1 - press * 0.16) * scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <svg width={30} height={38} viewBox="0 0 24 30" fill="none">
          <path
            d="M4 2.5 19.5 15.2 12.6 15.9 16.4 24.2 13.1 25.7 9.3 17.4 4 21.9z"
            fill={C.navy}
            stroke="#fff"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};
