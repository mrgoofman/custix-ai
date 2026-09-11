import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { C } from "../theme";
import { FONT } from "../fonts";
import { AI_RESPONSE, HOOK_PROMPT, SENT_PROMPT } from "../data";
import { type Timing } from "../timeline";
import { useTiming } from "../timing";
import { ramp, bell, rgba } from "../util";
import { RichText, type EntityState } from "./RichText";
import { BrowserChrome } from "./BrowserChrome";
import { Cursor } from "./Cursor";

export const BROWSER_WIDTH = 620;
export const CHAT_BODY_HEIGHT = 380;
const BODY_HEIGHT = CHAT_BODY_HEIGHT;
export const BROWSER_HEIGHT = 52 + BODY_HEIGHT;

export const SIDEBAR = 126;
export const MAIN_X = SIDEBAR;
export const MAIN_W = BROWSER_WIDTH - SIDEBAR;
export const PAD = 18;

const RESPONSE_CHARS = AI_RESPONSE.reduce(
  (n, s) => n + (s.t === "text" ? s.text.length : s.token.length),
  0
);

/**
 * Im Browser stehen ausschließlich Platzhalter – und zwar dauerhaft.
 * Die externe KI bekommt die echten Daten nie zu sehen; re-identifiziert
 * wird erst wieder drüben in custix.
 */
const TOKEN_ONLY: EntityState = { bgAlpha: 0.85, showToken: true, dip: 1 };

export const browserPresence = (t: Timing, f: number) => {
  const inP = interpolate(f, [t.browserIn, t.browserInEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const outP = interpolate(f, [t.browserOut, t.browserOutEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return { opacity: inP * (1 - outP), x: (1 - inP) * 90 + outP * 90 };
};

/** Angedeutete Chat-Historie – auch vom Hook genutzt.
 * Angedeutet – abstrakt, damit nichts Erfundenes lesbar ist. */
export const ChatSidebar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: SIDEBAR,
      height: BODY_HEIGHT,
      background: "#F9F9F9",
      borderRight: "1px solid #ECECEC",
      padding: "14px 12px",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        height: 28,
        padding: "0 8px",
        borderRadius: 8,
        background: "#FFFFFF",
        border: "1px solid #E8E8E8",
        marginBottom: 16,
      }}
    >
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <path d="M6 1.6v8.8M1.6 6h8.8" stroke="#0D0D0D" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: "#0D0D0D",
          whiteSpace: "nowrap",
        }}
      >
        Neuer Chat
      </span>
    </div>
    {[74, 58, 82, 46, 66].map((w, i) => (
      <div
        key={i}
        style={{
          height: 7,
          width: w,
          borderRadius: 4,
          background: "#E4E4E4",
          margin: "0 8px 14px",
        }}
      />
    ))}
  </div>
);

export const ChatSendButton: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    style={{
      width: 30,
      height: 30,
      borderRadius: 999,
      background: active ? "#0D0D0D" : "#D7D7D7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <path
        d="M7 11.5V2.8M7 2.8 3.2 6.6M7 2.8l3.8 3.8"
        stroke="#fff"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

/** Aktionsleiste unter der Antwort – dort sitzt in ChatGPT das Kopier-Symbol. */
const MessageActions: React.FC<{ copied: boolean }> = ({ copied }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {copied ? (
        <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8.4 6.4 11.3 12.5 5.2" stroke="#0D0D0D" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
          <rect x={5.2} y={5.2} width={8.3} height={8.3} rx={2} stroke="#8E8E8E" strokeWidth={1.5} />
          <path
            d="M10.8 5.2V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5.3A1.5 1.5 0 0 0 4 10.8h1.2"
            stroke="#8E8E8E"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      )}
      {copied ? (
        <span style={{ fontFamily: FONT.body, fontSize: 12, fontWeight: 500, color: "#0D0D0D" }}>
          Kopiert
        </span>
      ) : null}
    </div>
    {["M2 8.6 5.4 5.2v2.2h6.6v2.4H5.4v2.2z", "M14 7.4 10.6 10.8V8.6H4V6.2h6.6V4z"].map((d, i) => (
      <svg key={i} width={15} height={15} viewBox="0 0 16 16" fill="none">
        <path d={d} stroke="#C6C6C6" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    ))}
  </div>
);

/** slide="none": in den Feed-Cuts kommt das Fenster von unten, nicht von rechts. */
export const BrowserWindow: React.FC<{ slide?: "x" | "none" }> = ({
  slide = "x",
}) => {
  const f = useCurrentFrame();
  const t = useTiming();
  if (f < t.browserIn - 2 || f > t.browserOutEnd + 2) return null;

  const { opacity, x } = browserPresence(t, f);

  const sent = f >= t.sendClickAt;
  const pasted = ramp(f, t.pasteAt, t.pasteAt + 6);
  const pasteFlash = bell(ramp(f, t.pasteAt - 2, t.pasteAt + 22));

  const typing = f >= t.aiTypeStart && f < t.aiTypeEnd;
  const revealChars = typing
    ? Math.round(ramp(f, t.aiTypeStart, t.aiTypeEnd) * RESPONSE_CHARS)
    : f < t.aiTypeStart
      ? 0
      : undefined;

  // Das Eingabefeld wächst beim Einfügen – wie in ChatGPT auch
  const composerH = 56 + pasted * 134;
  const composerTop = BODY_HEIGHT - 22 - composerH;

  return (
    <div
      style={{
        width: BROWSER_WIDTH,
        transform: slide === "x" ? `translateX(${x}px)` : undefined,
        opacity,
        background: C.surface,
        borderRadius: 18,
        border: `1px solid ${C.muted}30`,
        boxShadow: `0 24px 60px ${rgba(C.navy, 0.1)}`,
        overflow: "hidden",
      }}
    >
      <BrowserChrome />

      <div style={{ position: "relative", height: BODY_HEIGHT, background: "#fff" }}>
        <ChatSidebar />

        <div
          style={{
            position: "absolute",
            left: MAIN_X + PAD,
            top: 12,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: "#0D0D0D" }}>
            ChatGPT
          </span>
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path d="M2.4 3.8 5 6.4l2.6-2.6" stroke="#9A9A9A" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {sent ? (
          <>
            {/* Nutzernachricht: graue Blase, rechtsbündig */}
            <div
              style={{
                position: "absolute",
                left: MAIN_X + PAD,
                top: 44,
                width: MAIN_W - PAD * 2,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  maxWidth: "88%",
                  background: "#F4F4F4",
                  borderRadius: 20,
                  padding: "10px 16px",
                }}
              >
                <RichText
                  segments={SENT_PROMPT}
                  stateFor={() => TOKEN_ONLY}
                  fontSize={14}
                  lineHeight={1.62}
                  fontFamily={FONT.mono}
                  color="#0D0D0D"
                />
              </div>
            </div>

            {/* Antwort: kein Kasten, wie bei ChatGPT */}
            <div
              style={{
                position: "absolute",
                left: MAIN_X + PAD,
                top: 138,
                width: MAIN_W - PAD * 2,
              }}
            >
              <RichText
                segments={AI_RESPONSE}
                stateFor={() => TOKEN_ONLY}
                revealChars={revealChars}
                fontSize={15}
                lineHeight={1.72}
                fontFamily={FONT.mono}
                color="#0D0D0D"
                trailing={
                  typing ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 16,
                        marginLeft: 3,
                        background: "#0D0D0D",
                        verticalAlign: "text-bottom",
                      }}
                    />
                  ) : null
                }
              />
            </div>

            {f >= t.aiTypeEnd - 4 ? (
              <div style={{ position: "absolute", left: MAIN_X + PAD, top: 252 }}>
                <MessageActions copied={f >= t.replyCopyAt + 3} />
              </div>
            ) : null}

            <Cursor
              from={[430, 372]}
              to={[MAIN_X + PAD + 7, 266]}
              moveStart={t.replyCopyAt - 34}
              clickAt={t.replyCopyAt}
              linger={16}
            />
          </>
        ) : null}

        {/* Eingabefeld unten – hier landet der kopierte Text */}
        <div
          style={{
            position: "absolute",
            left: MAIN_X + PAD,
            top: sent ? BODY_HEIGHT - 22 - 56 : composerTop,
            width: MAIN_W - PAD * 2,
            height: sent ? 56 : composerH,
            boxSizing: "border-box",
            background: "#fff",
            border: `1px solid ${sent ? "#E3E3E3" : rgba(C.royal, 0.25 + pasteFlash * 0.5)}`,
            borderRadius: 26,
            boxShadow: sent
              ? "0 1px 4px rgba(0,0,0,0.05)"
              : `0 1px 4px rgba(0,0,0,0.05), 0 0 ${pasteFlash * 20}px ${rgba(C.royal, pasteFlash * 0.3)}`,
            padding: "13px 14px 13px 16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            {!sent && pasted > 0.4 ? (
              <div style={{ opacity: pasted }}>
                <RichText
                  segments={HOOK_PROMPT}
                  stateFor={() => TOKEN_ONLY}
                  fontSize={14}
                  lineHeight={1.66}
                  fontFamily={FONT.mono}
                  color="#0D0D0D"
                />
              </div>
            ) : (
              <span style={{ fontFamily: FONT.body, fontSize: 15, color: "#9A9A9A" }}>
                Frage irgendetwas
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
            <svg width={17} height={17} viewBox="0 0 18 18" fill="none">
              <circle cx={9} cy={9} r={7.4} stroke="#9A9A9A" strokeWidth={1.4} />
              <path d="M9 5.6v6.8M5.6 9h6.8" stroke="#9A9A9A" strokeWidth={1.4} strokeLinecap="round" />
            </svg>
            <div style={{ marginLeft: "auto" }}>
              <ChatSendButton active={!sent && pasted > 0.5} />
            </div>
          </div>
        </div>

        {!sent ? (
          <Cursor
            from={[300, 372]}
            to={[MAIN_W + MAIN_X - PAD - 26, composerTop + composerH - 27]}
            moveStart={t.pasteAt + 10}
            clickAt={t.sendClickAt}
            linger={8}
          />
        ) : null}
      </div>
    </div>
  );
};
