/**
 * FIKTIVE Beispieldaten. Bei einer Kanzlei-Zielgruppe darf hier nichts stehen,
 * was nach einem echten Akt aussieht – deshalb im Bild das Label "Beispieldaten".
 *
 * Der Text ist auf 13 Zeilen getrimmt, damit er ohne Scrollen ins Panel passt.
 * Wird er geändert, ändert sich automatisch auch das Scan-Timing (siehe
 * entityLines() – die Zeilennummer wird aus den Zeilenumbrüchen abgeleitet).
 */

export type Seg =
  | { t: "text"; text: string }
  | {
      t: "person" | "address" | "id";
      text: string;
      token: string;
      /** Reihenfolge, in der die Entität getauscht wird (Lesereihenfolge) */
      order: number;
    };

/** Kopf des Schriftsatzes – in beiden Fassungen identisch. */
const DOC_HEAD: Seg[] = [
  { t: "text", text: "An das Landesgericht Linz\n\nIn der Rechtssache\nKlägerin:   " },
  { t: "person", text: "Maria Hofer", token: "[PERSON_1]", order: 0 },
  { t: "text", text: "\n            " },
  { t: "address", text: "Hauptstraße 12, 4020 Linz", token: "[ADRESSE_1]", order: 1 },
  { t: "text", text: "\nBeklagter:  " },
  { t: "person", text: "Thomas Berger", token: "[PERSON_2]", order: 2 },
  { t: "text", text: "\n            " },
  { t: "address", text: "Wienerstraße 4, 4020 Linz", token: "[ADRESSE_2]", order: 3 },
  { t: "text", text: "\nGZ:         " },
  { t: "id", text: "4 Cg 112/25v", token: "[AKTENZEICHEN_1]", order: 4 },
];

/** Die Passage, wie sie aus dem PDF kommt. */
const DOC_TAIL: Seg[] = [
  {
    t: "text",
    text:
      "\n\nDie Klägerin begehrt Zahlung von EUR 24.800,– aus\n" +
      "dem Werkvertrag vom ",
  },
  { t: "id", text: "14.03.2025", token: "[DATUM_1]", order: 5 },
  {
    t: "text",
    text: ". Trotz Fälligkeit\nund mehrfacher Mahnung leistete der Beklagte keine\nZahlung.",
  },
];

/**
 * Dieselbe Passage, nachdem die KI sie überarbeitet hat – das ist es, was am
 * Ende zurück ins Dokument wandert. Der Originaltext bliebe sonst unverändert,
 * und der ganze Umweg über die KI wäre folgenlos.
 */
const DOC_TAIL_FINAL: Seg[] = [
  { t: "text", text: "\n\nDie Klägerin " },
  { t: "person", text: "Maria Hofer", token: "[PERSON_1]", order: 0 },
  { t: "text", text: " hat den Beklagten\n" },
  { t: "person", text: "Thomas Berger", token: "[PERSON_2]", order: 2 },
  { t: "text", text: " unter Setzung einer angemessenen\nNachfrist zur Zahlung aufgefordert. Zu " },
  { t: "id", text: "4 Cg 112/25v", token: "[AKTENZEICHEN_1]", order: 4 },
  { t: "text", text: "\nwird daher beantragt …" },
];

export const DOC: Seg[] = [...DOC_HEAD, ...DOC_TAIL];
export const DOC_FINAL: Seg[] = [...DOC_HEAD, ...DOC_TAIL_FINAL];

/**
 * Antwort der KI – enthält ausschließlich Platzhalter. Wortgleich mit
 * DOC_TAIL_FINAL, damit erkennbar ist, dass genau dieser Text zurückwandert.
 */
export const AI_RESPONSE: Seg[] = [
  { t: "text", text: "Die Klägerin " },
  { t: "person", text: "Maria Hofer", token: "[PERSON_1]", order: 0 },
  { t: "text", text: " hat den Beklagten\n" },
  { t: "person", text: "Thomas Berger", token: "[PERSON_2]", order: 1 },
  { t: "text", text: " unter Setzung einer angemessenen\nNachfrist zur Zahlung aufgefordert.\nZu " },
  { t: "id", text: "4 Cg 112/25v", token: "[AKTENZEICHEN_1]", order: 2 },
  { t: "text", text: " wird daher beantragt …" },
];

export const AI_PROMPT = "Formuliere die Klage präziser.";

/**
 * Was beim Re-Identifizieren in custix eingefügt wird: die Antwort der KI,
 * noch mit Platzhaltern. Das Feld ist davor LEER – so läuft das Feature auch
 * in Wirklichkeit, man fügt die Antwort ein und bekommt die Originaldaten
 * zurück. Zeilenumbrüche auf die Breite des Dokumentfensters gesetzt.
 */
export const REIDENT_DOC: Seg[] = [
  { t: "text", text: "Die Klägerin " },
  { t: "person", text: "Maria Hofer", token: "[PERSON_1]", order: 0 },
  { t: "text", text: " hat den Beklagten\n" },
  { t: "person", text: "Thomas Berger", token: "[PERSON_2]", order: 2 },
  { t: "text", text: " unter Setzung einer\nangemessenen Nachfrist zur Zahlung\naufgefordert. Zu " },
  { t: "id", text: "4 Cg 112/25v", token: "[AKTENZEICHEN_1]", order: 4 },
  { t: "text", text: "\nwird daher beantragt …" },
];

/** Klammer des Loops: PDF geht rein, fertiges Dokument kommt raus. */
export const SOURCE_FILE = "Klage_Hofer.pdf";
export const RESULT_FILE = "Schriftsatz_final.docx";

/** Kurzfassung für die fliegenden Transportkarten – drei Zeilen reichen. */
export const CLIP_LINES = [
  { text: "In der Rechtssache" },
  { text: "[PERSON_1]", token: true },
  { text: "[ADRESSE_1]", token: true },
];

export const REPLY_LINES = [
  { text: "Die Klägerin" },
  { text: "[PERSON_1]", token: true },
  { text: "hat den Beklagten …" },
];

/**
 * Kompakte Fassung des abgeschickten Prompts – steht nach dem Senden als
 * Blase über der Antwort, wo für den vollen Text kein Platz ist.
 */
export const SENT_PROMPT: Seg[] = [
  { t: "text", text: "Formuliere die Klage präziser.\nIn der Rechtssache " },
  { t: "person", text: "Maria Hofer", token: "[PERSON_1]", order: 0 },
  { t: "text", text: " …" },
];

/**
 * Dieselbe Zeile zweimal – einmal ungeschützt, einmal mit Platzhaltern.
 * Das ist die ganze Aussage in einem Bild; sie steht direkt nach dem Hook,
 * bevor die Demo sie beweist.
 */
export const CONTRAST_LINE: Seg[] = [
  { t: "text", text: "In der Rechtssache " },
  { t: "person", text: "Maria Hofer", token: "[PERSON_1]", order: 0 },
  { t: "text", text: ", GZ " },
  { t: "id", text: "4 Cg 112/25v", token: "[AKTENZEICHEN_1]", order: 1 },
];

/** Prompt-Text für den Hook der Feed-Cuts – mit echten Namen, ungeschützt. */
export const HOOK_PROMPT: Seg[] = [
  { t: "text", text: "Formuliere die Klage präziser.\n\nIn der Rechtssache " },
  { t: "person", text: "Maria Hofer", token: "[PERSON_1]", order: 0 },
  { t: "text", text: ",\nGZ " },
  { t: "id", text: "4 Cg 112/25v", token: "[AKTENZEICHEN_1]", order: 1 },
  { t: "text", text: ", Werkvertrag\nvom " },
  { t: "id", text: "14.03.2025", token: "[DATUM_1]", order: 2 },
  { t: "text", text: " …" },
];

/**
 * In welcher Textzeile steht welche Entität? Wird aus den Zeilenumbrüchen
 * gezählt, damit das Scan-Timing bei Textänderungen nicht von Hand
 * nachgepflegt werden muss.
 */
export const entityLines = (segments: Seg[]) => {
  const lines = new Map<number, number>();
  let line = 0;
  for (const s of segments) {
    if (s.t === "text") {
      line += (s.text.match(/\n/g) ?? []).length;
    } else if (!lines.has(s.order)) {
      lines.set(s.order, line);
    }
  }
  return lines;
};

export const totalLines = (segments: Seg[]) =>
  segments.reduce((n, s) => n + (s.t === "text" ? (s.text.match(/\n/g) ?? []).length : 0), 0) + 1;
