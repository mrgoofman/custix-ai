import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { FONT } from "../fonts";
import { HOOK_PROMPT } from "../data";
import { VT } from "../vertical/timeline";
import { ramp, rgba } from "../util";
import { RichText, type EntityState } from "./RichText";
import { BrowserChrome } from "./BrowserChrome";
import {
  BROWSER_WIDTH,
  CHAT_BODY_HEIGHT,
  ChatSidebar,
  ChatSendButton,
  MAIN_X,
  MAIN_W,
  PAD,
} from "./BrowserWindow";

export const HOOK_WIDTH = BROWSER_WIDTH;
export const hookHeight = () => 52 + CHAT_BODY_HEIGHT;

const PROMPT_CHARS = HOOK_PROMPT.reduce((n, s) => n + s.text.length, 0);

/**
 * Der Hook: derselbe ChatGPT-Nachbau wie in der Demo, aber mit ECHTEN Namen
 * im Eingabefeld. Genau das ist der Zustand, den custix verhindert – und
 * genau deshalb muss die Oberfläche hier identisch aussehen.
 */
export const HookWindow: React.FC = () => {
  const f = useCurrentFrame();

  const typing = f < VT.hookTypeEnd;
  const revealChars = typing
    ? Math.round(ramp(f, VT.hookTypeStart, VT.hookTypeEnd) * PROMPT_CHARS)
    : undefined;

  // Eine nach der anderen: bei gleichzeitigem Aufleuchten sieht man drei
  // rote Flecken, aber liest keinen einzigen davon.
  const stateFor = (order: number): EntityState => ({
    bgAlpha: 0,
    showToken: false,
    dip: 1,
    danger: ramp(f, VT.hookFlash + order * 16, VT.hookFlash + order * 16 + 10),
  });
  const danger = ramp(f, VT.hookFlash, VT.hookFlash + 10);

  const composerH = 190;

  return (
    <div
      style={{
        width: HOOK_WIDTH,
        background: C.surface,
        borderRadius: 18,
        border: `1px solid ${C.muted}30`,
        boxShadow: `0 24px 60px ${rgba(C.navy, 0.12)}`,
        overflow: "hidden",
      }}
    >
      <BrowserChrome />
      <div style={{ position: "relative", height: CHAT_BODY_HEIGHT, background: "#fff" }}>
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

        <div
          style={{
            position: "absolute",
            left: MAIN_X + PAD,
            top: CHAT_BODY_HEIGHT - 22 - composerH,
            width: MAIN_W - PAD * 2,
            height: composerH,
            boxSizing: "border-box",
            background: "#fff",
            border: `1px solid ${danger > 0.3 ? rgba("#DC2626", 0.5) : "#E3E3E3"}`,
            borderRadius: 26,
            boxShadow:
              danger > 0.3
                ? `0 1px 4px rgba(0,0,0,0.05), 0 0 ${danger * 18}px ${rgba("#DC2626", danger * 0.22)}`
                : "0 1px 4px rgba(0,0,0,0.05)",
            padding: "13px 14px 13px 16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <RichText
              segments={HOOK_PROMPT}
              stateFor={stateFor}
              revealChars={revealChars}
              fontSize={14}
              lineHeight={1.66}
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
                      opacity: Math.floor(f / 8) % 2 === 0 ? 1 : 0.15,
                      verticalAlign: "text-bottom",
                    }}
                  />
                ) : null
              }
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
            <svg width={17} height={17} viewBox="0 0 18 18" fill="none">
              <circle cx={9} cy={9} r={7.4} stroke="#9A9A9A" strokeWidth={1.4} />
              <path d="M9 5.6v6.8M5.6 9h6.8" stroke="#9A9A9A" strokeWidth={1.4} strokeLinecap="round" />
            </svg>
            <div style={{ marginLeft: "auto" }}>
              <ChatSendButton active={!typing} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
