import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
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

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }

  // Validate token and check expiry
  const { data: signup, error } = await supabase
    .from("signups")
    .select("id, token_expires_at")
    .eq("download_token", token)
    .single();

  if (error || !signup) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 403 }
    );
  }

  // Check token expiry
  const expiresAt = new Date(signup.token_expires_at);
  if (expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Token has expired" },
      { status: 403 }
    );
  }

  // Get release manifest and find platform URL
  const release = await getLatestRelease();
  if (!release || !release.platforms[platform]) {
    return NextResponse.json(
      { error: "Platform not available" },
      { status: 404 }
    );
  }

  // Log downloaded event
  await supabase.from("download_events").insert({
    signup_id: signup.id,
    event_type: "downloaded",
    metadata: { platform, version: release.version },
  });

  // Redirect to actual download URL
  return NextResponse.redirect(release.platforms[platform].url);
}
