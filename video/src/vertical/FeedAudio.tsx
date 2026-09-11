import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { VT } from "./timeline";

/**
 * Tonebene der Feed-Cuts. Bewusst NICHT im Hero-Loop: der läuft im Browser
 * stumm im Autoplay, eine Tonspur dort wäre verlorene Arbeit.
 *
 * Regel für diese Ebene: sie darf nie Träger der Information sein. LinkedIn
 * startet stumm; alles Wesentliche steht als Text im Bild. Der Ton ist Zugabe
 * für die Minderheit, die tippt.
 *
 * Die Dateien erzeugt `scripts/make-sfx.py` – synthetisiert, nicht gesampelt,
 * damit alles aus derselben Tonleiter kommt und lizenzfrei bleibt.
 */

/**
 * Gesamtpegel der Tonebene. Die erste Fassung lag bei -34,7 dBFS RMS und war
 * damit rund 15 dB zu leise für Social. Eine Zahl, an der man drehen kann.
 */
const GAIN = 2.3;

const Cue: React.FC<{ at: number; file: string; volume: number }> = ({
  at,
  file,
  volume,
}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={Math.min(volume * GAIN, 1)} />
  </Sequence>
);

/** Orders der Entitäten, die getauscht bzw. zurückgesetzt werden. */
const SWAP_ORDERS = [0, 1, 2, 3, 4, 5];
const RESTORE_ORDERS = [0, 1, 2, 3, 4];

export const FeedAudio: React.FC<{ withMusic?: boolean }> = ({
  withMusic = true,
}) => (
  <>
    {withMusic ? (
      <Sequence from={0} layout="none">
        <Audio src={staticFile("sfx/music-bed.wav")} volume={0.38} />
      </Sequence>
    ) : null}

    {/* Hook */}
    <Cue at={VT.hookTypeStart} file="typing-hook.wav" volume={0.38} />
    <Cue at={VT.hookFlash} file="flash.wav" volume={0.42} />

    {/* Dokument laden und scannen */}
    <Cue at={VT.dropLand - 3} file="file-drop.wav" volume={0.5} />
    <Cue at={VT.scanStart} file="scan.wav" volume={0.34} />

    {/* Die Kaskade beim Ersetzen – hier zahlt der Ton am meisten ein */}
    {SWAP_ORDERS.map((o) => (
      <Cue
        key={`s${o}`}
        at={VT.swapStart + o * 8}
        file="tick-swap.wav"
        volume={0.46}
      />
    ))}

    {/* Kopieren, einfügen, senden */}
    <Cue at={VT.copyClickAt} file="click.wav" volume={0.55} />
    <Cue at={VT.copyClickAt + 5} file="copied.wav" volume={0.42} />
    <Cue at={VT.pasteAt} file="paste.wav" volume={0.45} />
    <Cue at={VT.sendClickAt} file="click.wav" volume={0.55} />
    <Cue at={VT.sendClickAt + 3} file="send.wav" volume={0.4} />

    {/* Antwort und Rückweg */}
    <Cue at={VT.aiTypeStart} file="typing-ai.wav" volume={0.26} />
    <Cue at={VT.replyCopyAt} file="click.wav" volume={0.55} />
    <Cue at={VT.replyCopyAt + 5} file="copied.wav" volume={0.42} />

    {/* Re-Identifizierung: dieselbe Kaskade, wärmer */}
    {RESTORE_ORDERS.map((o) => (
      <Cue
        key={`r${o}`}
        at={VT.reidStart + o * 9}
        file="tick-restore.wav"
        volume={0.44}
      />
    ))}
    <Cue at={VT.reidEnd - 4} file="saved.wav" volume={0.46} />
  </>
);
