import { setRequestLocale } from "next-intl/server";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";
import { DownloadContent } from "@/components/download-content";
import { fetchLatestRelease } from "@/lib/release";
import type { Metadata } from "next";

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

  // Open download: the app is gated by the license key + login (ADR-0003), not the
  // download. Anyone may fetch the installer. A legacy token, if present and valid,
  // is still honoured for funnel tracking — but its absence no longer blocks access.
  if (token) {
    const { valid, waitlistId } = await validateToken(token);
    if (valid && waitlistId) {
      await logLinkClicked(waitlistId);
    }
  }

  const release = await fetchLatestRelease();

  return <DownloadContent release={release} token={token ?? null} />;
}
