"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { verifications, companies, auditLog } from "@/db/schema";

export type ActionResult = { ok?: boolean; error?: string };

const ApproveSchema = z.object({
  verificationId: z.string().uuid(),
});

const RejectSchema = z.object({
  verificationId: z.string().uuid(),
  reason: z.string().min(1, "Rejection reason is required").max(2000),
});

/**
 * Approve a verification, write audit_log, and recompute the company's verified status.
 *
 * Threshold for COMPANIES.status = VERIFIED:
 *  - CONTRACTOR: 1+ INSURANCE VERIFIED (non-expired) AND 1+ LICENSE VERIFIED
 *  - SUB:        the above + 2+ REFERENCE VERIFIED
 */
export async function approveVerification(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = ApproveSchema.safeParse({
    verificationId: formData.get("verificationId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { verificationId } = parsed.data;
  let touchedCompanyId: string | null = null;

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(verifications)
        .where(eq(verifications.id, verificationId))
        .limit(1);
      if (!current) throw new Error("Verification not found");
      if (current.status === "VERIFIED") return; // idempotent — already approved

      const now = new Date();
      const before = { ...current };
      const [after] = await tx
        .update(verifications)
        .set({
          status: "VERIFIED",
          verifiedAt: now,
          verifiedByUserId: admin.user.id,
          rejectionReason: null,
          updatedAt: now,
        })
        .where(eq(verifications.id, verificationId))
        .returning();

      await tx.insert(auditLog).values({
        actorUserId: admin.user.id,
        subjectTable: "verifications",
        subjectId: verificationId,
        action: "STATUS_CHANGE",
        before: before as Record<string, unknown>,
        after: after as Record<string, unknown>,
      });

      touchedCompanyId = current.subjectCompanyId;
      await recomputeCompanyStatus(tx, current.subjectCompanyId, admin.user.id);
    });
  } catch (err) {
    console.error("[admin/approveVerification] failed:", err);
    return { error: err instanceof Error ? err.message : "Approve failed" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/verifications");
  if (touchedCompanyId) revalidatePath(`/admin/companies/${touchedCompanyId}`);
  return { ok: true };
}

/** Void-returning wrapper for direct <form action={}> usage. */
export async function approveVerificationForm(formData: FormData): Promise<void> {
  await approveVerification(undefined, formData);
}

export async function rejectVerification(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = RejectSchema.safeParse({
    verificationId: formData.get("verificationId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { verificationId, reason } = parsed.data;
  let touchedCompanyId: string | null = null;

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(verifications)
        .where(eq(verifications.id, verificationId))
        .limit(1);
      if (!current) throw new Error("Verification not found");
      if (current.status === "REJECTED") return; // idempotent

      const now = new Date();
      const before = { ...current };
      const [after] = await tx
        .update(verifications)
        .set({
          status: "REJECTED",
          rejectionReason: reason,
          verifiedAt: null,
          verifiedByUserId: null,
          updatedAt: now,
        })
        .where(eq(verifications.id, verificationId))
        .returning();

      await tx.insert(auditLog).values({
        actorUserId: admin.user.id,
        subjectTable: "verifications",
        subjectId: verificationId,
        action: "STATUS_CHANGE",
        before: before as Record<string, unknown>,
        after: after as Record<string, unknown>,
      });

      touchedCompanyId = current.subjectCompanyId;
      // A rejection can drop a previously-VERIFIED company below threshold; recompute.
      await recomputeCompanyStatus(tx, current.subjectCompanyId, admin.user.id);
    });
  } catch (err) {
    console.error("[admin/rejectVerification] failed:", err);
    return { error: err instanceof Error ? err.message : "Reject failed" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/verifications");
  if (touchedCompanyId) revalidatePath(`/admin/companies/${touchedCompanyId}`);
  return { ok: true };
}

/** Void-returning wrapper for direct <form action={}> usage. */
export async function rejectVerificationForm(formData: FormData): Promise<void> {
  await rejectVerification(undefined, formData);
}

/**
 * Threshold logic. Compares the company's current verifications to the floor.
 * Promotes to VERIFIED if met; demotes to PENDING_VERIFICATION if previously VERIFIED but now short.
 * Idempotent — safe to call after any verification status change.
 */
async function recomputeCompanyStatus(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  companyId: string,
  actorUserId: string
): Promise<void> {
  const [company] = await tx
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) return;
  if (company.status === "SUSPENDED") return; // don't auto-flip suspended accounts

  const activeVerifs = await tx
    .select()
    .from(verifications)
    .where(and(eq(verifications.subjectCompanyId, companyId), isNull(verifications.deletedAt)));

  const now = Date.now();
  const verifiedNonExpired = activeVerifs.filter(
    (v) => v.status === "VERIFIED" && (!v.expiresAt || new Date(v.expiresAt).getTime() > now)
  );

  const hasInsurance = verifiedNonExpired.some((v) => v.kind === "INSURANCE");
  const hasLicense = verifiedNonExpired.some((v) => v.kind === "LICENSE");
  const refsCount = verifiedNonExpired.filter((v) => v.kind === "REFERENCE").length;

  const meetsThreshold =
    hasInsurance &&
    hasLicense &&
    (company.kind === "CONTRACTOR" || refsCount >= 2);

  let nextStatus: typeof company.status | null = null;
  if (meetsThreshold && company.status !== "VERIFIED") {
    nextStatus = "VERIFIED";
  } else if (!meetsThreshold && company.status === "VERIFIED") {
    nextStatus = "PENDING_VERIFICATION";
  }

  if (!nextStatus) return;

  const before = { ...company };
  const [after] = await tx
    .update(companies)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(companies.id, companyId))
    .returning();

  await tx.insert(auditLog).values({
    actorUserId,
    subjectTable: "companies",
    subjectId: companyId,
    action: "STATUS_CHANGE",
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    // sql is imported so this stays typed even if we pivot to fragments later
    ...({} as Record<string, never>),
  });

  // sql import retained for future computed-column uses; suppress unused warning
  void sql;
}
