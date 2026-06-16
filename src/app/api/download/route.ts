import { NextRequest, NextResponse } from "next/server";
import { getDb, nowEpoch } from "@/lib/db";
import { newId } from "@/lib/license-key";

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

async function getLatestRelease(): Promise<ReleaseManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

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

  const release = await getLatestRelease();
  if (!release || !release.platforms[platform]) {
    return NextResponse.json({ error: "Platform not available" }, { status: 404 });
  }

  await db
    .prepare(
      "INSERT INTO license_event (id, waitlist_id, event_type, metadata, created_at) VALUES (?, ?, 'downloaded', ?, ?)"
    )
    .bind(newId(), row.id, JSON.stringify({ platform, version: release.version }), nowEpoch())
    .run();

  return NextResponse.redirect(release.platforms[platform].url);
}
