"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

/**
 * Browser-Client für Better Auth. Die Basis-URL bleibt leer: die Auth-Routen
 * liegen unter /api/auth auf derselben Domain, damit setzt der Browser das
 * Session-Cookie ohne Cross-Origin-Sonderfälle.
 *
 * `company` ist als zusätzliches Feld auf dem Benutzer konfiguriert
 * (siehe lib/auth.ts) – bei B2B-Verkauf ist der Firmenname keine Kür.
 */
export const authClient = createAuthClient({
  // Ohne diese Angabe kennt der Client das Zusatzfeld nicht und signUp.email
  // lehnt `company` typseitig ab.
  plugins: [inferAdditionalFields({ user: { company: { type: "string" } } })],
});

export const { useSession, signIn, signUp, signOut } = authClient;
