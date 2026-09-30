/**
 * Das aktuelle Desktop-Release (Tauri-Updater-Manifest aus custix-releases)
 * und die Installer-Links daraus. Rein – ohne `@/…`-Importe und ohne
 * Worker-Kontext, damit Download-Seite (Client) und Partner-Endpunkt
 * (Server) dieselbe Regel nutzen.
 */

const MANIFEST_URL =
  "https://github.com/znerol74/custix-releases/releases/latest/download/latest.json";

interface PlatformInfo {
  signature: string;
  url: string;
}

export interface ReleaseManifest {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<string, PlatformInfo>;
}

/**
 * Manifest holen; null bei jedem Fehler (die Seiten zeigen dann „kein
 * Release verfügbar“). `revalidate` in Sekunden – 0 heißt ungecacht.
 */
export async function fetchLatestRelease(
  revalidate = 300,
): Promise<ReleaseManifest | null> {
  try {
    const res = await fetch(
      MANIFEST_URL,
      revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" },
    );
    if (!res.ok) {
      console.error(`Failed to fetch release manifest: ${res.status}`);
      return null;
    }
    return (await res.json()) as ReleaseManifest;
  } catch (error) {
    console.error("Error fetching release manifest:", error);
    return null;
  }
}

/**
 * Der Link, den ein Mensch zum Installieren braucht.
 *
 * macOS: Die Manifest-URL zeigt auf das UPDATER-Archiv (custix.app.tar.gz),
 * das nur Tauris Hintergrund-Updater verwendet – kein Download für Menschen.
 * Für den manuellen Download liegt im selben Release die .dmg.
 */
export function installerUrl(
  release: ReleaseManifest,
  platformKey: string,
): string | null {
  const url = release.platforms[platformKey]?.url;
  if (!url) return null;
  if (platformKey.startsWith("darwin") && url.endsWith("custix.app.tar.gz")) {
    const arch = platformKey === "darwin-aarch64" ? "aarch64" : "x64";
    return url.replace("custix.app.tar.gz", `custix_${release.version}_${arch}.dmg`);
  }
  return url;
}
