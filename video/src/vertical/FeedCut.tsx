import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { C } from "../theme";
import { FONT } from "../fonts";
import { rgba, ramp } from "../util";
import { TimingProvider } from "../timing";
import { VT, STEPS } from "./timeline";
import { type FeedLayout, docBoxHeight, browserBoxHeight } from "./layouts";
import { SOURCE_FILE } from "../data";
import { DocumentPanel } from "../components/DocumentPanel";
import { BrowserWindow } from "../components/BrowserWindow";
import { HookWindow } from "../components/HookWindow";
import { FileCard } from "../components/FileCard";
import { FeedAudio } from "./FeedAudio";

const easeOut = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) } as const;
const easeIn = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) } as const;
const easeInOut = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) } as const;

export const FeedCut: React.FC<{
  layout: FeedLayout;
  withSound?: boolean;
  withMusic?: boolean;
}> = ({ layout: L, withSound = false, withMusic = false }) => {
  const f = useCurrentFrame();

  const DOC_H = docBoxHeight(L);
  const BROWSER_H = browserBoxHeight(L);

  const Stage: React.FC<{
    y: number;
    scale: number;
    opacity: number;
    x?: number;
    children: React.ReactNode;
  }> = ({ y, scale, opacity, x = 0, children }) =>
    opacity <= 0 ? null : (
      <div
        style={{
          position: "absolute",
          left: L.width / 2 + x,
          top: y,
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </div>
    );

  const Caption: React.FC<{ text: string; y: number; opacity: number }> = ({
    text,
    y,
    opacity,
  }) =>
    opacity <= 0 ? null : (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y,
          textAlign: "center",
          fontFamily: FONT.body,
          fontSize: L.captionSize,
          fontWeight: 500,
          color: C.muted,
          opacity,
        }}
      >
        {text}
      </div>
    );

  // ---- Hook -------------------------------------------------------------
  // Kein Einblenden am Anfang: im Hero startet das Video automatisch, und
  // ein leeres erstes Drittel einer Sekunde liest sich dort wie ein Ladefehler.
  const hookWindow = 1 - ramp(f, VT.hookWindowOut, VT.hookWindowOutEnd);

  /**
   * Kamerafahrt: Das Fenster startet kleiner und wächst, statt über die
   * Bildkante hinauszuwachsen. Eine frühere Fassung hat es beim Zoom oben
   * und seitlich angeschnitten – dann ist es kein ChatGPT-Fenster mehr,
   * sondern ein Ausschnitt. Es bleibt mittig, kein Versatz.
   */
  const zoom = interpolate(f, [VT.hookZoomAt, VT.hookZoomEnd], [0, 1], easeInOut);
  const hookScale = L.hookScale + (L.hookZoomScale - L.hookScale) * zoom;
  // Die Rechtsfolge kommt erst, wenn das Fenster weg ist – allein im Bild
  const hookLine =
    ramp(f, VT.hookLineAt, VT.hookLineAt + 16) *
    (1 - ramp(f, VT.hookLineOut, VT.hookLineOutEnd));

  const logo = ramp(f, VT.logoIn, VT.logoIn + 20) * (1 - ramp(f, VT.logoOut, VT.logoOutEnd));
  const cta = ramp(f, VT.ctaStart, VT.ctaStart + 22);

  // ---- custix-Fenster ---------------------------------------------------
  const docGone =
    ramp(f, VT.docOut, VT.docOutEnd) * (1 - ramp(f, VT.docIn, VT.docInEnd));
  const docOpacity =
    ramp(f, VT.dropIn - 12, VT.dropIn + 6) *
    (1 - ramp(f, VT.ctaStart - 16, VT.ctaStart + 20)) *
    (1 - docGone);
  const docY = L.stageY - docGone * (L.stageY + DOC_H / 2 + 60);

  const bIn = interpolate(f, [VT.browserIn, VT.browserInEnd], [0, 1], easeOut);
  const bOut = interpolate(f, [VT.browserOut, VT.browserOutEnd], [0, 1], easeIn);
  const browserTravel = L.height - L.stageY + BROWSER_H / 2 + 60;
  const browserY = L.stageY + (1 - bIn) * browserTravel + bOut * browserTravel;

  const dropP = interpolate(f, [VT.dropIn, VT.dropLand], [0, 1], easeOut);
  const dropOpacity =
    ramp(f, VT.dropIn, VT.dropIn + 12) * (1 - ramp(f, VT.dropLand - 8, VT.dropLand + 4));

  const docBottom = docY + DOC_H / 2;
  const browserBottom = browserY + BROWSER_H / 2;
  const cs = L.ctaScale;

  const step = STEPS.find((s) => f >= s.cardIn - 20 && f < s.titleTo + 20);
  const cardP = step
    ? ramp(f, step.cardIn, step.cardIn + 18) * (1 - ramp(f, step.cardOut, step.cardOutEnd))
    : 0;
  const titleP = step
    ? ramp(f, step.cardIn, step.cardIn + 18) * (1 - ramp(f, step.titleTo, step.titleTo + 16))
    : 0;

  return (
    <TimingProvider value={VT}>
      {withSound ? <FeedAudio withMusic={withMusic} /> : null}
      <AbsoluteFill style={{ background: C.stage }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(${L.width * 0.9}px ${L.height * 0.5}px at 70% 6%, ${rgba(
              C.royal,
              0.08
            )}, transparent 70%)`,
          }}
        />

        {/* ---------- Schritt-Titel, klein oben während der Animation ------- */}
        {step && titleP > 0 && cardP < 0.9 ? (
          <div
            style={{
              position: "absolute",
              left: 50,
              right: 50,
              top: L.wordTop,
              textAlign: "center",
              opacity: titleP * (1 - cardP),
            }}
          >
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: L.subSize * 0.8,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: C.royal,
                marginBottom: 12,
              }}
            >
              Schritt {step.n}
            </div>
            <div
              style={{
                fontFamily: FONT.heading,
                fontSize: L.wordSize,
                fontWeight: 700,
                letterSpacing: -2,
                color: C.navy,
              }}
            >
              {step.title}
            </div>
          </div>
        ) : null}

        {/* ---------- Fenster ---------- */}
        <Stage y={L.stageY} scale={hookScale} opacity={hookWindow}>
          <HookWindow />
        </Stage>

        <Stage y={docY} scale={L.docScale} opacity={docOpacity}>
          <DocumentPanel fontScale={L.docFontScale} />
        </Stage>
        <Caption
          text="custix  ·  lokal auf Ihrem Rechner"
          y={docBottom + L.captionGap}
          opacity={docOpacity * (1 - cardP)}
        />

        <Stage y={browserY} scale={L.browserScale} opacity={1}>
          <BrowserWindow slide="none" />
        </Stage>
        <Caption
          text="Externe KI  ·  erhält nur pseudonymisierten Text"
          y={browserBottom + L.captionGap}
          opacity={bIn * (1 - bOut) * (1 - cardP)}
        />

        <Stage
          y={interpolate(dropP, [0, 1], [-140, L.stageY])}
          scale={interpolate(dropP, [0, 1], [L.cardScale * 1.1, L.cardScale])}
          opacity={dropOpacity}
        >
          <FileCard kind="pdf" name={SOURCE_FILE} />
        </Stage>

        {/* Wiederholt die Kernaussage, falls jemand erst später einsteigt */}
        {L.badgesY !== null ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: L.badgesY,
              display: "flex",
              justifyContent: "center",
              gap: 18,
              opacity: ramp(f, VT.dropIn, VT.dropIn + 18) * (1 - cta) * (1 - cardP),
            }}
          >
            {["100 % lokal", "DSGVO-konform", "< 5 Sekunden"].map((b) => (
              <div
                key={b}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 22px",
                  borderRadius: 999,
                  background: C.surface,
                  border: `1px solid ${C.muted}33`,
                  fontFamily: FONT.body,
                  fontSize: 25,
                  fontWeight: 600,
                  color: C.navy,
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: 999, background: C.green }} />
                {b}
              </div>
            ))}
          </div>
        ) : null}

        {/* ---------- Rechtsfolge, allein im Bild ---------- */}
        {hookLine > 0 ? (
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: "0 56px",
              textAlign: "center",
              opacity: hookLine,
            }}
          >
            <div
              style={{
                fontFamily: FONT.heading,
                fontSize: L.hookLineSize,
                fontWeight: 700,
                lineHeight: 1.16,
                letterSpacing: -1.8,
                color: C.navy,
                transform: `translateY(${(1 - hookLine) * 22}px)`,
              }}
            >
              Mit diesem Prompt
              <br />
              verletzen Sie bereits
              <br />
              das Gesetz.
            </div>
            <div
              style={{
                marginTop: 34,
                fontFamily: FONT.body,
                fontSize: L.subSize,
                fontWeight: 600,
                color: "#B91C1C",
              }}
            >
              § 9 RAO — Verschwiegenheitspflicht
            </div>
          </AbsoluteFill>
        ) : null}

        {/* ---------- custix erklärt sich ---------- */}
        {logo > 0 ? (
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              opacity: logo,
              background: C.stage,
              padding: "0 56px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: L.logoWidth * 0.09,
                transform: `translateY(${(1 - logo) * 18}px)`,
                marginBottom: L.wordSize * 0.75,
              }}
            >
              <Img
                src={staticFile("icon-custix.png")}
                style={{ width: L.logoWidth * 0.22, height: L.logoWidth * 0.22 }}
              />
              <Img src={staticFile("logo-custix.png")} style={{ width: L.logoWidth * 0.84 }} />
            </div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: L.subSize * 1.16,
                fontWeight: 500,
                lineHeight: 1.5,
                color: C.slate,
                opacity: ramp(f, VT.logoIn + 14, VT.logoIn + 34),
              }}
            >
              hilft Ihnen dabei, durch Pseudonymisierung Ihrer Dokumente
              rechtskonform mit der KI Ihrer Wahl zu kommunizieren.
            </div>
            <div
              style={{
                marginTop: L.wordSize * 0.7,
                fontFamily: FONT.heading,
                fontSize: L.wordSize * 0.7,
                fontWeight: 700,
                letterSpacing: -1.2,
                color: C.navy,
                opacity: ramp(f, VT.logoIn + 46, VT.logoIn + 66),
              }}
            >
              Und so funktioniert’s:
            </div>
          </AbsoluteFill>
        ) : null}

        {/* ---------- Schrittkarte ---------- */}
        {step && cardP > 0 ? (
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              background: C.stage,
              opacity: cardP,
              padding: "0 56px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: L.subSize * 0.86,
                fontWeight: 700,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                color: C.royal,
                marginBottom: 20,
              }}
            >
              Schritt {step.n}
            </div>
            <div
              style={{
                fontFamily: FONT.heading,
                fontSize: L.wordSize * 1.05,
                fontWeight: 700,
                letterSpacing: -2.2,
                color: C.navy,
                transform: `translateY(${(1 - cardP) * 18}px)`,
              }}
            >
              {step.title}
            </div>
            <div
              style={{
                marginTop: 28,
                fontFamily: FONT.body,
                fontSize: L.subSize * 1.02,
                fontWeight: 500,
                lineHeight: 1.5,
                color: C.slate,
                maxWidth: L.width * 0.86,
                opacity: ramp(f, step.cardIn + 14, step.cardIn + 32),
              }}
            >
              {step.sub}
            </div>
          </AbsoluteFill>
        ) : null}

        {/* ---------- Abspann ---------- */}
        {cta > 0 ? (
          <AbsoluteFill
            style={{
              background: C.stage,
              opacity: cta,
              alignItems: "center",
              justifyContent: "center",
              padding: "0 60px",
              textAlign: "center",
            }}
          >
            {/* Greift die Zeile auf, die auf den Zielgruppenseiten schon
                steht („KI nutzen. Mandanten schützen."). Der Punkt statt
                „und" ist der Punkt: zwei vollständige Aussagen, kein
                Kompromiss. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: L.logoWidth * 0.09,
                marginBottom: 54 * cs,
                transform: `translateY(${(1 - cta) * 26}px)`,
              }}
            >
              <Img
                src={staticFile("icon-custix.png")}
                style={{ width: L.logoWidth * 0.22, height: L.logoWidth * 0.22 }}
              />
              <Img src={staticFile("logo-custix.png")} style={{ width: L.logoWidth * 0.84 }} />
            </div>

            <div
              style={{
                fontFamily: FONT.heading,
                fontSize: 68 * cs,
                fontWeight: 700,
                lineHeight: 1.18,
                letterSpacing: -2.2,
                color: C.navy,
                opacity: ramp(f, VT.ctaStart + 18, VT.ctaStart + 40),
              }}
            >
              KI nutzen.
              <br />
              Mandantendaten schützen.
            </div>

            <div
              style={{
                marginTop: 46 * cs,
                fontFamily: FONT.body,
                fontSize: 32 * cs,
                fontWeight: 600,
                letterSpacing: 0.6,
                color: C.slate,
                opacity: ramp(f, VT.ctaStart + 34, VT.ctaStart + 56),
              }}
            >
              custix.ai
            </div>
          </AbsoluteFill>
        ) : null}

        {/* Wortmarke durchgehend im Bild – aus auf den Karten, die das
            Logo ohnehin groß zeigen, sonst stünde es doppelt da. */}
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 40,
            display: "flex",
            alignItems: "center",
            gap: L.brandWidth * 0.12,
            opacity: 0.9 * (1 - logo) * (1 - cta),
          }}
        >
          <Img
            src={staticFile("icon-custix.png")}
            style={{ width: L.brandWidth * 0.26, height: L.brandWidth * 0.26 }}
          />
          <Img src={staticFile("logo-custix.png")} style={{ width: L.brandWidth }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 34,
            fontFamily: FONT.body,
            fontSize: 22,
            fontWeight: 500,
            color: C.muted,
            opacity: (1 - cta) * (1 - logo) * (1 - cardP) * (1 - hookLine),
          }}
        >
          Beispieldaten
        </div>
      </AbsoluteFill>
    </TimingProvider>
  );
};
