import { docHeight } from "../components/DocumentPanel";
import { BROWSER_HEIGHT } from "../components/BrowserWindow";

/**
 * Alle drei Erklär-Schnitte (9:16, 1:1, 16:9) nutzen dieselbe Szene und
 * dasselbe Timing – sie unterscheiden sich nur in der Geometrie. Quadratisch
 * und quer sind vertikal enger, deshalb kleinere Schrift und keine
 * Badge-Zeile.
 */
export type FeedLayout = {
  width: number;
  height: number;

  wordTop: number;
  wordSize: number;
  /** Erklärende Zeile unter dem Wort */
  subSize: number;
  hookLineSize: number;
  /** Breite des custix-Logos im Übergang */
  logoWidth: number;

  /** Vertikale Mitte, auf der alle Fenster sitzen */
  stageY: number;

  docFontScale: number;
  docScale: number;
  browserScale: number;
  /**
   * Startgröße des Hook-Fensters. Bewusst schon groß: das Fenster soll von
   * der ersten Sekunde an wie ein echtes ChatGPT-Fenster wirken, nicht wie
   * ein kleines Element im leeren Bild.
   */
  hookScale: number;
  /**
   * … und Größe am Ende der Kamerafahrt. Muss so gewählt sein, dass das
   * Fenster (620×476) vollständig im Bild bleibt – ein angeschnittenes
   * ChatGPT-Fenster ist als solches nicht mehr erkennbar, und genau darum
   * geht es im Hook. Der Abstand zur Startgröße ist absichtlich klein: eine
   * dezente Fahrt, keine Vergrößerung aus dem Nichts.
   */
  hookZoomScale: number;
  /** Höhe des Prompt-Felds im Hook – quadratisch ist vertikal viel enger */
  hookBodyHeight: number;
  cardScale: number;

  captionGap: number;
  captionSize: number;

  /** y der Vertrauens-Badges, oder null wenn kein Platz ist */
  badgesY: number | null;

  /** Breite der dauerhaft eingeblendeten Wortmarke oben links */
  brandWidth: number;

  ctaScale: number;
};

export const PORTRAIT: FeedLayout = {
  width: 1080,
  height: 1920,
  wordTop: 150,
  wordSize: 78,
  subSize: 33,
  hookLineSize: 68,
  logoWidth: 500,
  stageY: 1010,
  docFontScale: 1.45,
  docScale: 0.96,
  browserScale: 1.5,
  hookScale: 1.45,
  hookZoomScale: 1.60,
  hookBodyHeight: 430,
  cardScale: 1.22,
  captionGap: 34,
  captionSize: 26,
  badgesY: 1618,
  brandWidth: 132,
  ctaScale: 1,
};

export const SQUARE: FeedLayout = {
  width: 1080,
  height: 1080,
  wordTop: 46,
  wordSize: 62,
  subSize: 27,
  hookLineSize: 54,
  logoWidth: 400,
  stageY: 560,
  docFontScale: 1.2,
  docScale: 0.95,
  browserScale: 1.5,
  hookScale: 1.40,
  hookZoomScale: 1.55,
  hookBodyHeight: 300,
  cardScale: 1.05,
  captionGap: 26,
  captionSize: 23,
  badgesY: null,
  brandWidth: 116,
  ctaScale: 0.9,
};

/** Höhe des Dokumentfensters im jeweiligen Layout, in Bildschirmpixeln. */
export const docBoxHeight = (l: FeedLayout) =>
  docHeight(l.docFontScale) * l.docScale;

export const browserBoxHeight = (l: FeedLayout) =>
  BROWSER_HEIGHT * l.browserScale;

/**
 * 16:9 für Website, YouTube und Sales-Gespräch. Vertikal am engsten – die
 * Fenster stehen deshalb fast in Originalgröße, die Badge-Zeile entfällt.
 */
export const LANDSCAPE: FeedLayout = {
  width: 1920,
  height: 1080,
  wordTop: 72,
  wordSize: 64,
  subSize: 30,
  hookLineSize: 62,
  logoWidth: 460,
  stageY: 622,
  docFontScale: 1,
  docScale: 1.15,
  browserScale: 1.55,
  hookScale: 1.65,
  hookZoomScale: 1.82,
  hookBodyHeight: 300,
  cardScale: 1,
  captionGap: 28,
  captionSize: 24,
  badgesY: null,
  brandWidth: 128,
  ctaScale: 1.05,
};
