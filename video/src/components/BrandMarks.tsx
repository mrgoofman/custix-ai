import React from "react";

/**
 * ⚠️ PLATZHALTER – vor jeder Veröffentlichung ersetzen.
 *
 * Das sind Vektor-Nachbauten, keine offiziellen Marken-Assets. Vor dem Live-
 * gang müssen die echten SVGs von den Brand-/Press-Seiten von OpenAI,
 * Anthropic und Google eingesetzt und deren Nutzungsbedingungen geprüft
 * werden. Das ist der einzige Ort, an dem dafür etwas geändert werden muss:
 * gleiche Props (size), gleicher Aufrufort in BrowserWindow.tsx.
 */

type MarkProps = { size?: number };

export const OpenAiMark: React.FC<MarkProps> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3.4 18.4 7.1v7.4L12 18.2 5.6 14.5V7.1z"
      stroke="#0D0D0D"
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <path
      d="M12 3.4v7.4m0 0 6.4 3.7M12 10.8l-6.4 3.7M12 10.8v7.4"
      stroke="#0D0D0D"
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </svg>
);

export const ClaudeMark: React.FC<MarkProps> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {Array.from({ length: 12 }).map((_, i) => (
      <rect
        key={i}
        x={11.15}
        y={i % 2 === 0 ? 2.2 : 4.4}
        width={1.7}
        height={i % 2 === 0 ? 7.4 : 5.4}
        rx={0.85}
        fill="#D97757"
        transform={`rotate(${i * 30} 12 12)`}
      />
    ))}
  </svg>
);

export const GeminiMark: React.FC<MarkProps> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="52%" stopColor="#9B72CB" />
        <stop offset="100%" stopColor="#D96570" />
      </linearGradient>
    </defs>
    <path
      d="M12 1.8c0 5.6 4.6 10.2 10.2 10.2-5.6 0-10.2 4.6-10.2 10.2 0-5.6-4.6-10.2-10.2-10.2C7.4 12 12 7.4 12 1.8z"
      fill="url(#gemini-grad)"
    />
  </svg>
);

export const AI_TOOLS = [
  { name: "ChatGPT", host: "chatgpt.com", Mark: OpenAiMark },
  { name: "Claude", host: "claude.ai", Mark: ClaudeMark },
  { name: "Gemini", host: "gemini.google.com", Mark: GeminiMark },
] as const;
