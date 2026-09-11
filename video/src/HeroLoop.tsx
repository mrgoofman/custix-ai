import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C } from "./theme";
import { FONT } from "./fonts";
import { rgba, ramp } from "./util";
import { T } from "./timeline";
import { SOURCE_FILE, RESULT_FILE } from "./data";
import { DocumentPanel, DOC_WIDTH } from "./components/DocumentPanel";
import { BrowserWindow, BROWSER_WIDTH, browserPresence } from "./components/BrowserWindow";
import { WordOverlay } from "./components/WordOverlay";
import { FileCard } from "./components/FileCard";

const CANVAS = 1920;
const GAP = 60;
const SIDE = 120;

const DOC_CX = SIDE + DOC_WIDTH / 2;
const DOC_CY = 486;

/**
 * Solange der Browser nicht da ist, steht das Dokument mittig – sonst klebt
 * es links im leeren Bild. Beim Einfahren rutscht es auf seinen Platz.
 */
const CENTERED_SHIFT = (CANVAS - DOC_WIDTH) / 2 - SIDE;

const easeInOut = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) } as const;
const easeOut = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) } as const;

const Floating: React.FC<{
  x: number;
  y: number;
  opacity: number;
  scale?: number;
  children: React.ReactNode;
}> = ({ x, y, opacity, scale = 1, children }) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </div>
  );

const Caption: React.FC<{ text: string; opacity?: number }> = ({ text, opacity = 1 }) => (
  <div
    style={{
      marginTop: 22,
      textAlign: "center",
      fontFamily: FONT.body,
      fontSize: 19,
      fontWeight: 500,
      color: C.muted,
      opacity,
    }}
  >
    {text}
  </div>
);

export const HeroLoop: React.FC = () => {
  const f = useCurrentFrame();

  const shift = interpolate(
    f,
    [T.shiftAt, T.shiftEnd, T.browserOut + 36, T.browserOutEnd + 24],
    [CENTERED_SHIFT, 0, 0, CENTERED_SHIFT],
    easeInOut
  );

  // PDF fliegt herein und wird geschluckt
  const dropP = interpolate(f, [T.dropIn, T.dropLand], [0, 1], easeOut);
  const dropOpacity =
    ramp(f, T.dropIn, T.dropIn + 14) * (1 - ramp(f, T.dropLand - 8, T.dropLand + 4));

  // Fertiges Dokument verlässt custix als .docx
  const exitP = interpolate(f, [T.exitStart, T.exitEnd], [0, 1], easeInOut);
  const exitOpacity =
    ramp(f, T.exitStart, T.exitStart + 14) * (1 - ramp(f, T.exitEnd - 22, T.exitEnd));

  const browser = browserPresence(T, f);

  return (
    <AbsoluteFill style={{ background: C.snow }}>
      {/* dezenter Lichtschein – nimmt dem Flat-Design die Härte */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 700px at 78% 8%, ${rgba(
            C.royal,
            0.07
          )}, transparent 70%)`,
        }}
      />

      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: `150px ${SIDE}px 0 ${SIDE}px`,
          gap: GAP,
          transform: `translateX(${shift}px)`,
        }}
      >
        <div style={{ width: DOC_WIDTH, flexShrink: 0 }}>
          <DocumentPanel />
          <Caption text="custix  ·  lokal auf Ihrem Rechner" />
        </div>
        <div style={{ paddingTop: 46, width: BROWSER_WIDTH, flexShrink: 0 }}>
          <BrowserWindow />
          <Caption
            text="Externe KI  ·  erhält nur anonymisierten Text"
            opacity={browser.opacity}
          />
        </div>
      </AbsoluteFill>

      {/* PDF rein, fertiges .docx raus – diese Klammer schließt den Loop */}
      <AbsoluteFill>
        <Floating
          x={interpolate(dropP, [0, 1], [640, DOC_CX + shift])}
          y={interpolate(dropP, [0, 1], [-120, DOC_CY])}
          scale={interpolate(dropP, [0, 1], [1.06, 0.92])}
          opacity={dropOpacity}
        >
          <FileCard kind="pdf" name={SOURCE_FILE} />
        </Floating>

        <Floating
          x={DOC_CX + shift}
          y={interpolate(exitP, [0, 1], [DOC_CY, 1260])}
          scale={interpolate(exitP, [0, 1], [0.96, 0.86])}
          opacity={exitOpacity}
        >
          <FileCard kind="docx" name={RESULT_FILE} />
        </Floating>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 96 }}>
        <WordOverlay />
      </AbsoluteFill>

      {/* Bei einer Kanzlei-Zielgruppe nicht verhandelbar */}
      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: 40 }}
      >
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: 17,
            fontWeight: 500,
            color: C.muted,
          }}
        >
          Beispieldaten
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
