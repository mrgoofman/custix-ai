import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";
import { DownloadContent } from "@/components/download-content";
import type { Metadata } from "next";

const MANIFEST_URL =
  "https://github.com/znerol74/custix-releases/releases/latest/download/latest.json";

interface PlatformInfo {
  signature: string;
  url: string;
}

interface ReleaseManifest {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<string, PlatformInfo>;
}

// Legacy download-token flow, now backed by D1 (waitlist_entry.download_token).
// Kept working for any in-flight tokens during the beta transition.
async function validateToken(token: string): Promise<{ valid: boolean; waitlistId?: string }> {
  const db = getDb();
  const row = await db
    .prepare("SELECT id, token_expires_at FROM waitlist_entry WHERE download_token = ?")
    .bind(token)
    .first<{ id: string; token_expires_at: number | null }>();

  if (!row || row.token_expires_at == null) return { valid: false };
  if (row.token_expires_at < nowEpoch()) return { valid: false };

  return { valid: true, waitlistId: row.id };
}

async function logLinkClicked(waitlistId: string) {
  const db = getDb();
  await db
    .prepare(
      "INSERT INTO license_event (id, waitlist_id, event_type, metadata, created_at) VALUES (?, ?, 'link_clicked', '{}', ?)"
    )
    .bind(newId(), waitlistId, nowEpoch())
    .run();
}

async function getLatestRelease(): Promise<ReleaseManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Failed to fetch release manifest: ${res.status}`);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching release manifest:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === "de"
      ? "Download | custix.ai"
      : "Download | custix.ai";
  const description =
    locale === "de"
      ? "Laden Sie custix kostenlos herunter. 100% lokal, keine Cloud, DSGVO-konform."
      : "Download custix for free. 100% local, no cloud, GDPR-compliant.";

  return { title, description, robots: { index: false, follow: false } };
}

export default async function DownloadPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  // Validate token - redirect to home if missing or invalid
  if (!token) {
    redirect(locale === "en" ? "/en" : "/");
  }

  const { valid, waitlistId } = await validateToken(token);
  if (!valid) {
    redirect(locale === "en" ? "/en" : "/");
  }

  // Log link_clicked event
  if (waitlistId) {
    await logLinkClicked(waitlistId);
  }

  const release = await getLatestRelease();

  return <DownloadContent release={release} token={token} />;
}
