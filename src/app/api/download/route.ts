import { NextRequest, NextResponse } from "next/server";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";
import { fetchLatestRelease, installerUrl } from "@/lib/release";

// Legacy tokenized binary download, now backed by D1 (waitlist_entry.download_token).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const platform = searchParams.get("platform");

  if (!token || !platform) {
    return NextResponse.json(
      { error: "Missing token or platform parameter" },
      { status: 400 }
    );
  }

  const db = getDb();

  const row = await db
    .prepare("SELECT id, token_expires_at FROM waitlist_entry WHERE download_token = ?")
    .bind(token)
    .first<{ id: string; token_expires_at: number | null }>();

  if (!row || row.token_expires_at == null) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }
  if (row.token_expires_at < nowEpoch()) {
    return NextResponse.json({ error: "Token has expired" }, { status: 403 });
  }

  const release = await fetchLatestRelease(0);
  // installerUrl: für macOS die .dmg statt des Updater-Archivs.
  const url = release ? installerUrl(release, platform) : null;
  if (!release || !url) {
    return NextResponse.json({ error: "Platform not available" }, { status: 404 });
  }

  await db
    .prepare(
      "INSERT INTO license_event (id, waitlist_id, event_type, metadata, created_at) VALUES (?, ?, 'downloaded', ?, ?)"
    )
    .bind(newId(), row.id, JSON.stringify({ platform, version: release.version }), nowEpoch())
    .run();

  return NextResponse.redirect(url);
}
