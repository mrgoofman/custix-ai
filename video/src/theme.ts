/**
 * Farbtokens 1:1 aus src/app/globals.css der Website.
 * Video und Landingpage müssen als ein Ding wirken – hier nichts erfinden.
 */
export const C = {
  navy: "#1E3A5F",
  royal: "#2563EB",
  royalDark: "#1D4ED8",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  snow: "#F8FAFC",
  /** Hintergrund der Erklär-Schnitte: dunkler als Snow, damit die weißen
   *  Fenster darauf als Fenster lesbar bleiben statt zu verschwimmen. */
  stage: "#E7EDF6",
  surface: "#FFFFFF",
  slate: "#334155",
  muted: "#94A3B8",

  // Entitäten-Highlights
  person: "#DBEAFE",
  address: "#DCFCE7",
  id: "#FEF3C7",

  // Schriftfarben in den Chips (dunkler als der Hintergrund, damit lesbar)
  personInk: "#1E40AF",
  addressInk: "#166534",
  idInk: "#92400E",

  green: "#16A34A",
} as const;

export const ENTITY_BG: Record<string, string> = {
  person: C.person,
  address: C.address,
  id: C.id,
};

export const ENTITY_INK: Record<string, string> = {
  person: C.personInk,
  address: C.addressInk,
  id: C.idInk,
};
