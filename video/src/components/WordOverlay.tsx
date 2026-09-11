import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C } from "../theme";
import { FONT } from "../fonts";
import { WORDS, WORDS_OUT, WORDS_OUT_END } from "../timeline";
import { ramp } from "../util";

/**
 * Das einzige Overlay im Hero-Loop. Drei Wörter, die mit den drei Beats
 * mitwachsen – ohne Voiceover trägt der Text alles.
 *
 * Die Zeile bleibt in jedem Zustand optisch mittig: Breiten werden gemessen
 * und die Wörter rutschen weich auf ihre neue Position, statt bei einem
 * einzelnen sichtbaren Wort links im Bild zu kleben.
 */
const FONT_SIZE = 60;
const GAP = 30;
const LETTER_SPACING = -1.5;

export const WordOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const out = 1 - ramp(f, WORDS_OUT, WORDS_OUT_END);

  const parts = WORDS.map((w) => ({
    text: w.text,
    width: measureText({
      text: w.text,
      fontFamily: FONT.heading,
      fontSize: FONT_SIZE,
      fontWeight: 700,
      letterSpacing: `${LETTER_SPACING}px`,
    }).width,
    p: interpolate(f, [w.at, w.at + 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  }));

  const total =
    parts.reduce((a, x) => a + x.p * (x.width + GAP), 0) - GAP * parts[0].p;

  let cursor = -total / 2;

  return (
    <div style={{ position: "relative", height: FONT_SIZE * 1.3, opacity: out }}>
      {parts.map((part) => {
        const left = cursor;
        cursor += part.p * (part.width + GAP);
        if (part.p === 0) return null;
        return (
          <span
            key={part.text}
            style={{
              position: "absolute",
              left: "50%",
              marginLeft: left,
              top: 0,
              whiteSpace: "nowrap",
              fontFamily: FONT.heading,
              fontSize: FONT_SIZE,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: LETTER_SPACING,
              color: C.navy,
              opacity: part.p,
              transform: `translateY(${(1 - part.p) * 20}px)`,
            }}
          >
            {part.text}
          </span>
        );
      })}
    </div>
  );
};
