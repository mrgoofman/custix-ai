import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { AdminDashboard } from "./AdminDashboard";
import { LoginForm } from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — custix",
  robots: { index: false, follow: false },
};

interface WaitlistRow {
  id: string;
  status: string;
  email: string | null;
  name: string | null;
  company: string | null;
  profession: string | null;
  locale: string;
  person_id: string;
  issued_license_id: string | null;
  created_at: number;
}

interface LicenseRow {
  id: string;
  license_key: string;
  type: string;
  status: string;
  account_id: string | null;
  expires_at: number | null;
  last_validated_at: number | null;
}

interface FeedbackRow {
  id: string;
  user_email: string | null;
  rating: number;
  comment: string | null;
  app_version: string | null;
  created_at: number;
}

export default async function AdminPage() {
  // requireAdmin needs the request headers (Better Auth session).
  const reqHeaders = await headers();
  const admin = await requireAdmin(new Request("https://custix.ai/admin", { headers: reqHeaders }));

  if (!admin) {
    // Not authenticated (or not an admin) — show the login form.
    return <LoginForm />;
  }

  const db = getDb();

  const waitlist = (
    await db
      .prepare(
        `SELECT w.id, w.status, w.issued_license_id, w.created_at,
                p.id AS person_id, p.email, p.name, p.company, p.profession, p.locale
           FROM waitlist_entry w JOIN person p ON p.id = w.person_id
          ORDER BY w.created_at DESC LIMIT 200`
      )
      .all<WaitlistRow>()
  ).results;

  const licenses = (
    await db
      .prepare(
        `SELECT id, license_key, type, status, account_id, expires_at, last_validated_at
           FROM license ORDER BY created_at DESC LIMIT 200`
      )
      .all<LicenseRow>()
  ).results;

  const feedback = (
    await db
      .prepare(
        `SELECT id, user_email, rating, comment, app_version, created_at
           FROM feedback ORDER BY created_at DESC LIMIT 200`
      )
      .all<FeedbackRow>()
  ).results;

  return (
    <AdminDashboard
      adminEmail={admin.email}
      waitlist={waitlist}
      licenses={licenses}
      feedback={feedback}
    />
  );
}
