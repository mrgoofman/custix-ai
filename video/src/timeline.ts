/**
 * Ein einziger Ort für das Timing. 30 fps, 818 Frames = 27,3 s.
 *
 * Der Loop ist nahtlos, weil der Endzustand exakt dem Startzustand entspricht:
 * leere Dropzone, Status "Bereit", kein Browser, Overlay unsichtbar.
 * Möglich wird das durch die Klammer PDF rein → fertiges .docx raus.
 * Wer am Timing dreht, muss diese Bedingung erhalten.
 */
export const FPS = 30;
export const DURATION = 818;

/**
 * Gemeinsame Timing-Form beider Schnitte (16:9-Loop und 9:16-Cut).
 * Die Panels lesen ihre Frames über useTiming() aus dem Context, damit
 * beide Formate dieselben Komponenten teilen können.
 */
export type Timing = {
  dropIn: number;
  dropLand: number;
  textIn: number;
  textInEnd: number;
  scanStart: number;
  scanEnd: number;
  swapStart: number;
  swapEnd: number;
  browserIn: number;
  browserInEnd: number;
  browserOut: number;
  browserOutEnd: number;
  /** Cursor klickt "Kopieren" im custix-Fenster */
  copyClickAt: number;
  /** Anonymisierter Text erscheint im Eingabefeld der KI */
  pasteAt: number;
  /** Cursor klickt "Senden" */
  sendClickAt: number;
  aiTypeStart: number;
  aiTypeEnd: number;
  /** Cursor klickt "Kopieren" an der KI-Antwort */
  replyCopyAt: number;
  reidStart: number;
  reidEnd: number;
  /** Wann das Dokumentfeld für die KI-Antwort geleert wird */
  clearAt: number;
  /** Wann die KI-Antwort dort eingefügt wird – noch mit Platzhaltern */
  pasteBackAt: number;
  exitStart: number;
  exitEnd: number;
};

export const T = {
  /** PDF-Karte fliegt herein und landet in der Dropzone */
  dropIn: 18,
  dropLand: 72,

  /** Extrahierter Text erscheint im Dokument */
  textIn: 84,
  textInEnd: 108,

  /** Scan + Highlight, Timer läuft sichtbar 0,0 → 4,2 s (= 126 Frames) */
  scanStart: 108,
  scanEnd: 234,

  /** Entitäten werden durch Platzhalter ersetzt */
  swapStart: 234,
  swapEnd: 288,

  /** Dokument rutscht nach links, um Platz für den Browser zu machen */
  shiftAt: 264,
  shiftEnd: 300,

  /** Browser mit den KI-Tabs fährt ein */
  browserIn: 300,
  browserInEnd: 342,

  /** Kopieren – als sichtbarer Klick, nicht als fliegende Karte */
  copyClickAt: 318,
  pasteAt: 372,
  sendClickAt: 414,

  /** Antwort tippt sich – im Browser, mit Platzhaltern */
  aiTypeStart: 426,
  aiTypeEnd: 522,

  /** Antwort kopieren; das Dokumentfeld wird dafür geleert */
  replyCopyAt: 546,
  clearAt: 564,
  pasteBackAt: 612,

  /** Browser fährt raus */
  browserOut: 570,
  browserOutEnd: 612,

  /**
   * Re-Identifizierung – ausschließlich in custix. Der Browser ist da schon
   * fast draußen: die externe KI bekommt die echten Daten nie zu sehen.
   */
  reidStart: 652,
  reidEnd: 714,

  /** Fertiges Dokument steht */
  holdEnd: 746,

  /** … und geht als .docx raus. Dropzone ist wieder leer = Startzustand. */
  exitStart: 746,
  exitEnd: 794,

  settleEnd: 818,
} as const;

/** Wann welches Wort der Overlay-Zeile erscheint */
export const WORDS = [
  { text: "Anonymisieren.", at: 126 },
  { text: "KI nutzen.", at: 330 },
  { text: "Re-identifizieren.", at: 640 },
] as const;

export const WORDS_OUT = 752;
export const WORDS_OUT_END = 788;

/**
 * Pro Entität: Highlight zündet genau dann, wenn die Scan-Linie sie erreicht
 * (deshalb y = vertikale Position im Panel, 0..1). Tausch und Rücktausch
 * laufen dagegen in Lesereihenfolge – das liest sich ruhiger.
 */
export const entityTiming = (t: Timing, order: number, y: number) => ({
  highlightAt: t.scanStart + y * (t.scanEnd - t.scanStart) - 3,
  highlightDur: 12,
  swapAt: t.swapStart + order * 8,
  swapDur: 12,
  restoreAt: t.reidStart + order * 9,
  restoreDur: 12,
});
