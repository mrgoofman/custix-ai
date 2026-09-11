import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

// Identisch zur Website: Plus Jakarta Sans (Headlines) + Inter (Body).
// Mono für den Dokumenttext, damit es nach Dokument aussieht und nicht nach Werbung.
const { fontFamily: body } = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: heading } = loadJakarta("normal", {
  weights: ["600", "700"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});

export const FONT = { body, heading, mono };
