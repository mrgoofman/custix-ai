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
  claimed: number;
  last_seen: number | null;
}

interface LicenseRow {
  id: string;
  license_key: string;
  type: string;
  status: string;
  account_id: string | null;
  expires_at: number | null;
  last_validated_at: number | null;
  email: string | null;
  name: string | null;
  company: string | null;
  billing_interval: string | null;
  subscription_status: string | null;
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
                p.id AS person_id, p.email, p.name, p.company, p.profession, p.locale,
                (l.account_id IS NOT NULL) AS claimed, l.last_validated_at AS last_seen
           FROM waitlist_entry w
           JOIN person p ON p.id = w.person_id
           LEFT JOIN license l ON l.id = w.issued_license_id
          ORDER BY w.created_at DESC LIMIT 200`
      )
      .all<WaitlistRow>()
  ).results;

  const licenses = (
    await db
      .prepare(
        // Ohne den Join zeigt die Tabelle nur eine anonyme account_id –
        // Selbstregistrierte tauchen dann nirgends mit Namen auf, weil sie
        // (anders als Beta-Anfragen) keinen waitlist_entry haben.
        `SELECT l.id, l.license_key, l.type, l.status, l.account_id,
                l.expires_at, l.last_validated_at, l.billing_interval, l.subscription_status,
                COALESCE(u.email, p.email, wp.email)     AS email,
                COALESCE(u.name,  p.name,  wp.name)      AS name,
                COALESCE(u.company, p.company, wp.company) AS company
           FROM license l
           LEFT JOIN "user"  u ON u.id = l.account_id
           LEFT JOIN person  p ON p.user_id = l.account_id
           -- Beta-Lizenzen, die verschickt, aber nie beansprucht wurden: die
           -- Person hängt dort nur am Wartelisteneintrag.
           LEFT JOIN waitlist_entry w2 ON w2.issued_license_id = l.id
           LEFT JOIN person wp ON wp.id = w2.person_id
          ORDER BY l.created_at DESC LIMIT 200`
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
