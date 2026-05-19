import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function validateToken(token: string): Promise<{ valid: boolean; signupId?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { valid: false };

  const { data: signup, error } = await supabase
    .from("signups")
    .select("id, token_expires_at")
    .eq("download_token", token)
    .single();

  if (error || !signup) return { valid: false };

  const expiresAt = new Date(signup.token_expires_at);
  if (expiresAt < new Date()) return { valid: false };

  return { valid: true, signupId: signup.id };
}

async function logLinkClicked(signupId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("download_events").insert({
    signup_id: signupId,
    event_type: "link_clicked",
    metadata: {},
  });
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

  return { title, description };
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

  const { valid, signupId } = await validateToken(token);
  if (!valid) {
    redirect(locale === "en" ? "/en" : "/");
  }

  // Log link_clicked event
  if (signupId) {
    await logLinkClicked(signupId);
  }

  const release = await getLatestRelease();

  return <DownloadContent release={release} token={token} />;
}
