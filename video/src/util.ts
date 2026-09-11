import { interpolate } from "remotion";

export const rgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** 0 → 1 zwischen from und to, außerhalb geklemmt. */
export const ramp = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Glocke: 0 an den Rändern, 1 in der Mitte – für den Opacity-Dip beim Texttausch. */
export const bell = (p: number) => (p <= 0 || p >= 1 ? 0 : Math.sin(p * Math.PI));

/**
 * Opacity, die kurz vor/nach einer Zustandsgrenze auf 0 fällt.
 * Verhindert, dass Label-Wechsel im Status-Pill hart aufpoppen.
 */
export const dipAt = (frame: number, boundaries: number[], half = 5) => {
  let o = 1;
  for (const b of boundaries) {
    const d = Math.abs(frame - b);
    if (d < half) o = Math.min(o, d / half);
  }
  return o;
};
