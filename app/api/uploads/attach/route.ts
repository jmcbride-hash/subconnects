/**
 * POST /api/uploads/attach
 *
 * After a successful S3 PUT, the browser calls this to save the S3 key on the
 * verifications row. We don't trust the client to write the URL — we re-verify
 * ownership and rebuild the internal s3:// URL ourselves.
 *
 * Body: { verificationId: string, key: string }
 * Returns: { ok: true } | { ok: false, error }
 */

import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { verifications, memberships, auditLog } from "@/db/schema";
import { keyToInternalUrl } from "@/lib/s3";

const BodySchema = z.object({
  verificationId: z.string().uuid(),
  key: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireUser();
  } catch {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { verificationId, key } = parsed.data;

  const [verif] = await db.select().from(verifications).where(eq(verifications.id, verificationId)).limit(1);
  if (!verif) {
    return NextResponse.json({ ok: false, error: "Verification not found" }, { status: 404 });
  }

  // Re-check ownership.
  const [mem] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, ctx.user.id),
        eq(memberships.companyId, verif.subjectCompanyId),
        eq(memberships.status, "ACTIVE"),
        isNull(memberships.deletedAt)
      )
    )
    .limit(1);
  if (!mem) {
    return NextResponse.json({ ok: false, error: "Not a member of that company" }, { status: 403 });
  }

  // Confirm the key prefix matches the verification's company + kind, so a client
  // can't paste in someone else's key.
  const expectedPrefix =
    verif.kind === "INSURANCE" ? "coi/"
    : verif.kind === "LICENSE" ? "licenses/"
    : verif.kind === "REFERENCE" ? "references/"
    : null;
  if (!expectedPrefix || !key.startsWith(`${expectedPrefix}${verif.subjectCompanyId}/`)) {
    return NextResponse.json({ ok: false, error: "Key doesn't match verification" }, { status: 400 });
  }

  const internalUrl = keyToInternalUrl(key);

  const before = { ...verif };
  const newMetadata = {
    ...((verif.metadata as Record<string, unknown> | null) ?? {}),
    awaiting_upload: false,
    uploaded_by_user_id: ctx.user.id,
    uploaded_at: new Date().toISOString(),
  };

  const [after] = await db
    .update(verifications)
    .set({
      evidenceUrl: internalUrl,
      metadata: newMetadata,
      updatedAt: new Date(),
    })
    .where(eq(verifications.id, verificationId))
    .returning();

  await db.insert(auditLog).values({
    actorUserId: ctx.user.id,
    subjectTable: "verifications",
    subjectId: verificationId,
    action: "EVIDENCE_UPLOADED",
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
  });

  // Refresh the dashboards that show this state.
  if (verif.kind === "INSURANCE" || verif.kind === "LICENSE" || verif.kind === "REFERENCE") {
    revalidatePath("/contractor");
    revalidatePath("/sub");
    revalidatePath(`/admin/companies/${verif.subjectCompanyId}`);
  }

  return NextResponse.json({ ok: true });
}
