import React from "react";
import { C } from "../theme";
import { FONT } from "../fonts";
import { AI_TOOLS } from "./BrandMarks";

/**
 * Tab-Leiste. Die Adresszeile ist bewusst weg: „ChatGPT" steht im Tab, im
 * Modellwähler und im Eingabefeld – eine URL darunter sagt nichts Neues und
 * kostet 44 px Fensterhöhe.
 */
export const BROWSER_CHROME_HEIGHT = 52;

export const BrowserChrome: React.FC = () => {
  return (
    <>
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          padding: "0 12px",
          background: "#E9EEF5",
        }}
      >
        {AI_TOOLS.map((tool, i) => {
          const isActive = i === 0;
          return (
            <div
              key={tool.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 15px",
                borderRadius: "9px 9px 0 0",
                background: isActive ? C.surface : "transparent",
                opacity: isActive ? 1 : 0.62,
              }}
            >
              <tool.Mark size={17} />
              <span
                style={{
                  fontFamily: FONT.body,
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? C.navy : C.slate,
                }}
              >
                {tool.name}
              </span>
            </div>
          );
        })}
      </div>

    </>
  );
};
