import type { Timing } from "../timeline";

/**
 * Feed-Cuts (9:16 und 1:1). 30 fps, 1794 Frames = 59,8 s.
 *
 * Struktur nach Vorgabe: Hook → Rechtsfolge → custix erklärt → vier
 * Schrittkarten, jeweils gefolgt von der zugehörigen Animation → Abspann.
 *
 * Anders als vorher überlagert der Text die Animation nicht mehr durchgehend:
 * Jeder Schritt bekommt zuerst eine eigene Karte mit Titel und Erklärung,
 * danach läuft die Animation mit dem Titel klein am oberen Rand weiter.
 * Das war die Antwort auf „zu wenig Fokus" – nicht mehr Zeit, sondern
 * getrennte Momente für Erklären und Zeigen.
 *
 * Kein Loop: Feed-Videos brauchen Hook vorne und Abspann hinten.
 */
export const VDURATION = 1794;

export const VT: Timing & {
  hookTypeStart: number;
  hookTypeEnd: number;
  hookZoomAt: number;
  hookZoomEnd: number;
  hookFlash: number;
  hookWindowOut: number;
  hookWindowOutEnd: number;
  hookLineAt: number;
  hookLineOut: number;
  hookLineOutEnd: number;
  logoIn: number;
  logoOut: number;
  logoOutEnd: number;
  docOut: number;
  docOutEnd: number;
  docIn: number;
  docInEnd: number;
  ctaStart: number;
} = {
  // 0,0–6,8 s · Hook: der Prompt mit echten Mandantendaten tippt sich,
  // die Kamera fährt aufs Eingabefeld, dann leuchten die Daten NACHEINANDER
  // rot auf – gleichzeitig konnte man sie nicht einzeln erfassen.
  hookTypeStart: 8,
  hookTypeEnd: 88,
  hookZoomAt: 76,
  hookZoomEnd: 112,
  hookFlash: 106,
  hookWindowOut: 180,
  hookWindowOutEnd: 204,

  // 7,0–10,5 s · Erst wenn das Chatfenster weg ist, kommt die Rechtsfolge –
  // allein im Bild, damit sie ankommt
  hookLineAt: 210,
  hookLineOut: 294,
  hookLineOutEnd: 314,

  // 10,1–15,1 s · custix erklärt sich
  logoIn: 304,
  logoOut: 436,
  logoOutEnd: 454,

  // 17,0–19,1 s · Schritt 1: Datei landet, Text erscheint …
  dropIn: 510,
  dropLand: 542,
  textIn: 548,
  textInEnd: 574,

  // … und steht dann 1,4 s ruhig im Bild. Vorher waren es 0,4 s, bevor die
  // Schritt-2-Karte alles zudeckte – man sah gar nicht, dass die Datei
  // angekommen ist.

  // 23,9–29,4 s · Schritt 2: pseudonymisieren
  scanStart: 718,
  scanEnd: 844, // 4,2 s
  swapStart: 844,
  swapEnd: 882,

  // 38,5–47,8 s · Schritt 3: KI nutzen
  copyClickAt: 1156,
  docOut: 1186,
  docOutEnd: 1222,
  browserIn: 1198,
  browserInEnd: 1238,
  pasteAt: 1250,
  sendClickAt: 1304,
  aiTypeStart: 1314,
  aiTypeEnd: 1368,
  replyCopyAt: 1386,
  clearAt: 1398,
  browserOut: 1398,
  browserOutEnd: 1434,

  // 48,9–54,3 s · Schritt 4: leeres Feld, einfügen, re-identifizieren
  docIn: 1468,
  docInEnd: 1504,
  pasteBackAt: 1524,
  reidStart: 1572,
  reidEnd: 1628,

  // 55,3 s · Abspann
  ctaStart: 1660,

  // Im vertikalen Cut fliegt nichts als .docx raus – das Fenster blendet
  // für den Abspann ab. Werte außerhalb der Komposition schalten es aus.
  exitStart: 90000,
  exitEnd: 90100,
};

/**
 * Die vier Schritte. `cardIn/cardOut` = Vollbildkarte mit Titel und
 * Erklärung, `titleTo` = bis wann der Titel klein oben stehen bleibt,
 * während die Animation läuft.
 */
export const STEPS = [
  {
    n: 1,
    title: "Datei laden",
    sub: "Datei mit personenbezogenen Daten in custix laden",
    cardIn: 444,
    cardOut: 484,
    cardOutEnd: 500,
    titleTo: 616,
  },
  {
    n: 2,
    title: "Pseudonymisieren",
    sub: "Namen, Adressen und Aktenzeichen werden lokal ersetzt",
    cardIn: 616,
    cardOut: 692,
    cardOutEnd: 708,
    titleTo: 982,
  },
  {
    n: 3,
    title: "KI nutzen",
    sub: "Ob ChatGPT, Claude, Gemini oder eine andere KI – sie sehen nur den pseudonymisierten Text aus custix, nie Ihre Mandantendaten",
    cardIn: 982,
    cardOut: 1122,
    cardOutEnd: 1138,
    titleTo: 1412,
  },
  {
    n: 4,
    title: "Re-identifizieren",
    sub: "custix setzt die Originaldaten wieder ein",
    cardIn: 1412,
    cardOut: 1458,
    cardOutEnd: 1474,
    titleTo: 1656,
  },
] as const;

/** Pro Entität: gestaffelte Timings, abgeleitet aus der Lesereihenfolge. */
export const VSTEP_BY_TITLE = Object.fromEntries(STEPS.map((s) => [s.title, s]));
