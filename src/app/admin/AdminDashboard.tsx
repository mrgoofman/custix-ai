"use client";

import { useState } from "react";

interface WaitlistRow {
  id: string;
  status: string;
  email: string | null;
  name: string | null;
  profession: string | null;
  locale: string;
  person_id: string;
  issued_license_id: string | null;
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

async function callAction(payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function fmt(epoch: number | null) {
  return epoch ? new Date(epoch * 1000).toISOString().slice(0, 10) : "—";
}

export function AdminDashboard({
  adminEmail,
  waitlist,
  licenses,
}: {
  adminEmail: string;
  waitlist: WaitlistRow[];
  licenses: LicenseRow[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(id: string, payload: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(id);
    setMsg(null);
    try {
      const r = await callAction(payload);
      setMsg(r.ok || r.success ? `✓ ${payload.action} done${r.key ? ` — key: ${r.key}` : ""}` : `✕ ${r.error ?? r.message_key ?? "failed"}`);
      if (r.ok || r.success) setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      setMsg(`✕ ${String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function anonymize(personId: string, email: string | null) {
    const typed = window.prompt(
      `IRREVERSIBLE GDPR erasure. Type the email to confirm:\n${email ?? "(no email)"}`
    );
    if (typed == null) return;
    if (typed !== email) {
      setMsg("✕ confirmation email did not match");
      return;
    }
    await run(personId, { action: "anonymize", personId, confirmEmail: typed });
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">custix admin</h1>
        <span className="text-sm text-slate-500">{adminEmail}</span>
      </div>
      {msg && <div className="mb-6 rounded-lg bg-slate-100 px-4 py-3 text-sm">{msg}</div>}

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-3">Waitlist ({waitlist.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Profession</th><th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((w) => (
                <tr key={w.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{w.name ?? <em className="text-slate-400">anonymized</em>}</td>
                  <td className="px-3 py-2">{w.email ?? "—"}</td>
                  <td className="px-3 py-2">{w.profession ?? "—"}</td>
                  <td className="px-3 py-2">{w.status}</td>
                  <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                    {w.status === "pending" && (
                      <>
                        <button disabled={busy === w.id} onClick={() => run(w.id, { action: "approve", waitlistId: w.id })}
                          className="rounded bg-blue-600 px-2 py-1 text-white disabled:opacity-50">Approve</button>
                        <button disabled={busy === w.id} onClick={() => run(w.id, { action: "reject", waitlistId: w.id }, "Reject this request?")}
                          className="rounded border px-2 py-1 disabled:opacity-50">Reject</button>
                      </>
                    )}
                    {w.email && (
                      <button onClick={() => anonymize(w.person_id, w.email)}
                        className="rounded border border-red-300 px-2 py-1 text-red-600">Anonymize</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Licenses ({licenses.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Key</th><th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th><th className="px-3 py-2">Claimed</th>
                <th className="px-3 py-2">Expires</th><th className="px-3 py-2">Last seen</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{l.license_key}</td>
                  <td className="px-3 py-2">{l.type}</td>
                  <td className="px-3 py-2">{l.status}</td>
                  <td className="px-3 py-2">{l.account_id ? "yes" : "no"}</td>
                  <td className="px-3 py-2">{fmt(l.expires_at)}</td>
                  <td className="px-3 py-2">{fmt(l.last_validated_at)}</td>
                  <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                    <button onClick={() => run(l.id, { action: "resend_key", licenseId: l.id })}
                      className="rounded border px-2 py-1">Resend</button>
                    {l.status !== "revoked" && (
                      <button onClick={() => run(l.id, { action: "revoke", licenseId: l.id }, "Revoke this license?")}
                        className="rounded border border-red-300 px-2 py-1 text-red-600">Revoke</button>
                    )}
                    {l.account_id && (
                      <button onClick={() => run(l.id, { action: "reset_claim", licenseId: l.id }, "Reset the device/account claim?")}
                        className="rounded border px-2 py-1">Reset claim</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
