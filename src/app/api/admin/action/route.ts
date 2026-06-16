import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  approveWaitlist,
  rejectWaitlist,
  revokeLicense,
  resetClaim,
  anonymizePerson,
  resendKeyEmail,
} from "@/lib/admin-actions";

/**
 * Admin action dispatcher. Gated by admin_role (ADR-0006). Mutations only —
 * each underlying action writes an admin_event audit row.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    action?: string;
    waitlistId?: string;
    licenseId?: string;
    personId?: string;
    reason?: string;
    confirmEmail?: string;
  };

  try {
    switch (body.action) {
      case "approve":
        return NextResponse.json(await approveWaitlist(admin.id, must(body.waitlistId)));
      case "reject":
        return NextResponse.json(await rejectWaitlist(admin.id, must(body.waitlistId)));
      case "resend_key":
        return NextResponse.json(await resendKeyEmail(admin.id, must(body.licenseId)));
      case "revoke":
        return NextResponse.json(await revokeLicense(admin.id, must(body.licenseId), body.reason));
      case "reset_claim":
        return NextResponse.json(await resetClaim(admin.id, must(body.licenseId), body.reason));
      case "anonymize":
        // Server-side guard mirrors the UI type-to-confirm.
        if (!body.confirmEmail) {
          return NextResponse.json({ ok: false, error: "confirmation required" }, { status: 400 });
        }
        return NextResponse.json(await anonymizePerson(admin.id, must(body.personId)));
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("admin action error:", e);
    return NextResponse.json({ ok: false, error: String((e as Error)?.message ?? e) }, { status: 400 });
  }
}

function must(v: string | undefined): string {
  if (!v) throw new Error("missing id");
  return v;
}
