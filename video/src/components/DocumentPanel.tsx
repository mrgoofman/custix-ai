import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { FONT } from "../fonts";
import { DOC, REIDENT_DOC, entityLines, totalLines } from "../data";
import { entityTiming } from "../timeline";
import { useTiming } from "../timing";
import { ramp, bell, rgba } from "../util";
import { RichText, type EntityState } from "./RichText";
import { WindowChrome } from "./WindowChrome";
import { StatusPill } from "./StatusPill";
import { ScanLine } from "./ScanLine";
import { Dropzone } from "./Dropzone";
import { CopyPill } from "./CopyPill";
import { Cursor } from "./Cursor";

export const DOC_WIDTH = 1000;
export const CHROME_HEIGHT = 56;

const BASE_BODY = 560;
const BASE_PAD = 30;
const BASE_FONT = 21;
const LINE_HEIGHT = 1.82;

/**
 * fontScale vergrößert Schrift, Innenabstand und Panelhöhe gemeinsam. Nötig
 * für die Feed-Cuts: auf einem Handy wäre die 21-px-Schrift sonst rund 6 pt
 * groß – also unlesbar. Bis ~1,5 bleibt der längste Zeilenumbruch erhalten.
 */
export const docHeight = (fontScale = 1) => CHROME_HEIGHT + BASE_BODY * fontScale;
export const DOC_HEIGHT = docHeight(1);

const LINES = entityLines(DOC);

/** Vertikale Position einer Entität im Panel als Anteil 0..1 (skalenunabhängig). */
const yOf = (order: number) => {
  const line = LINES.get(order) ?? 0;
  return (BASE_PAD + (line + 0.5) * BASE_FONT * LINE_HEIGHT) / BASE_BODY;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const DocumentPanel: React.FC<{ fontScale?: number }> = ({
  fontScale = 1,
}) => {
  const BODY_HEIGHT = BASE_BODY * fontScale;
  const PAD_TOP = BASE_PAD * fontScale;
  const FONT_SIZE = BASE_FONT * fontScale;

  const f = useCurrentFrame();
  const t = useTiming();

  /**
   * Zwei Phasen im selben Fenster:
   *  A – der geladene Schriftsatz wird pseudonymisiert
   *  B – leeres Feld, KI-Antwort einfügen, re-identifizieren
   * Phase B endet vor dem Ausblenden wieder, damit der Hero-Loop im
   * Startzustand schließt (leere Dropzone mit „PDF hier ablegen").
   */
  const reidentPhase = f >= t.clearAt && f < t.exitStart + 24;

  const stateFor = (order: number): EntityState => {
    const et = entityTiming(t, order, yOf(order));
    const hl = ramp(f, et.highlightAt, et.highlightAt + et.highlightDur);
    const swap = ramp(f, et.swapAt, et.swapAt + et.swapDur);

    return {
      bgAlpha: hl,
      showToken: swap >= 0.5,
      dip: 1 - 0.82 * bell(swap),
    };
  };

  /** In Phase B stehen zuerst Platzhalter, dann die Originaldaten. */
  const stateForReident = (order: number): EntityState => {
    const et = entityTiming(t, order, 0);
    const restore = ramp(f, et.restoreAt, et.restoreAt + et.restoreDur);
    return {
      bgAlpha: 0.85 * (1 - restore),
      showToken: restore < 0.5,
      dip: 1 - 0.82 * bell(restore),
    };
  };

  const textOpacity = reidentPhase
    ? ramp(f, t.pasteBackAt, t.pasteBackAt + 8) *
      (1 - ramp(f, t.exitStart, t.exitStart + 22))
    : ramp(f, t.textIn, t.textInEnd) * (1 - ramp(f, t.clearAt, t.clearAt + 12));

  // Dropzone: vor dem Laden, zwischen Leeren und Einfügen, und ganz am Ende
  const dropzoneOpacity = reidentPhase
    ? clamp01(
        ramp(f, t.clearAt, t.clearAt + 12) -
          ramp(f, t.pasteBackAt - 8, t.pasteBackAt + 4) +
          ramp(f, t.exitStart + 16, t.exitEnd)
      )
    : // Nach dem Ausblenden zurück in den Startzustand – daran hängt die
      // Nahtlosigkeit des Hero-Loops.
      clamp01(
        1 -
          ramp(f, t.dropLand - 8, t.dropLand + 4) +
          ramp(f, t.exitStart + 16, t.exitEnd)
      );
  const dropzoneActive = reidentPhase
    ? ramp(f, t.pasteBackAt - 26, t.pasteBackAt - 8)
    : ramp(f, t.dropIn, t.dropIn + 18) * (1 - ramp(f, t.dropLand - 10, t.dropLand));

  const copyUi =
    ramp(f, t.swapEnd - 14, t.swapEnd + 6) *
    (1 - ramp(f, t.copyClickAt + 52, t.copyClickAt + 72));
  const PILL_LEFT = DOC_WIDTH - 34 - 152 * fontScale;
  const pillTop = BODY_HEIGHT - 18 - 44 * fontScale;

  return (
    <div
      style={{
        width: DOC_WIDTH,
        background: C.surface,
        borderRadius: 18,
        border: `1px solid ${C.muted}30`,
        boxShadow: `0 24px 60px ${rgba(C.navy, 0.1)}, 0 2px 6px ${rgba(C.navy, 0.05)}`,
        overflow: "hidden",
      }}
    >
      <WindowChrome title="custix  —  Dokument" right={<StatusPill />} />
      <div
        style={{
          position: "relative",
          height: BODY_HEIGHT,
          padding: `${PAD_TOP}px 34px`,
          overflow: "hidden",
        }}
      >
        <div style={{ opacity: textOpacity }}>
          <RichText
            segments={reidentPhase ? REIDENT_DOC : DOC}
            stateFor={reidentPhase ? stateForReident : stateFor}
            fontSize={FONT_SIZE}
            lineHeight={LINE_HEIGHT}
            fontFamily={FONT.mono}
          />
        </div>
        <ScanLine height={BODY_HEIGHT} />

        {/* Kopieren als sichtbarer Klick: der Zuschauer soll den Schritt
            sehen, nicht erraten. */}
        {copyUi > 0 ? (
          <>
            <div
              style={{
                position: "absolute",
                left: PILL_LEFT,
                top: pillTop,
                opacity: copyUi,
              }}
            >
              <CopyPill copied={f >= t.copyClickAt + 3} scale={fontScale} />
            </div>
            <Cursor
              from={[PILL_LEFT - 340 * fontScale, pillTop - 70 * fontScale]}
              to={[PILL_LEFT + 34 * fontScale, pillTop + 20 * fontScale]}
              moveStart={t.copyClickAt - 40}
              clickAt={t.copyClickAt}
              linger={16}
              scale={fontScale}
            />
          </>
        ) : null}

        {dropzoneOpacity > 0 ? (
          <Dropzone
            opacity={dropzoneOpacity}
            active={dropzoneActive}
            label={reidentPhase ? "KI-Antwort hier einfügen" : "PDF hier ablegen"}
          />
        ) : null}
      </div>
    </div>
  );
};

// Sanity-Check beim Bundling: passen beide Fassungen noch ins Panel?
for (const [name, doc] of [["DOC", DOC], ["REIDENT_DOC", REIDENT_DOC]] as const) {
  const needed = BASE_PAD * 2 + totalLines(doc) * BASE_FONT * LINE_HEIGHT;
  if (needed > BASE_BODY) {
    console.warn(
      `[custix-video] ${name} ist zu hoch für die Panelhöhe – ` +
        `benötigt ${Math.ceil(needed)}px.`
    );
  }
}
