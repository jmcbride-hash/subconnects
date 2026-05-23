/**
 * POST /api/uploads/presign
 *
 * Issues a 5-minute presigned S3 PUT URL for a specific verification owned by the
 * caller's company. The caller must be an ACTIVE member of the target company —
 * we never trust the client to tell us which company they belong to.
 *
 * Body: {
 *   verificationId: string,
 *   prefix: "coi" | "license" | "reference",
 *   filename: string,
 *   contentType: string,
 *   contentLength: number
 * }
 *
 * Returns: { ok: true, uploadUrl, key } | { ok: false, error }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { verifications, memberships } from "@/db/schema";
import {
  buildUploadKey,
  getPresignedPut,
  validateUploadInput,
} from "@/lib/s3";

const BodySchema = z.object({
  verificationId: z.string().uuid(),
  prefix: z.enum(["coi", "license", "reference"]),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  contentLength: z.number().int().positive(),
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
  const { verificationId, filename, contentType, contentLength, prefix } = parsed.data;

  const check = validateUploadInput({ prefix, contentType, contentLength });
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  }

  // Load the verification + confirm the caller owns the company it belongs to.
  const [verif] = await db.select().from(verifications).where(eq(verifications.id, verificationId)).limit(1);
  if (!verif) {
    return NextResponse.json({ ok: false, error: "Verification not found" }, { status: 404 });
  }

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

  // Cross-check: prefix must match verification kind.
  const expectedPrefix =
    verif.kind === "INSURANCE" ? "coi"
    : verif.kind === "LICENSE" ? "license"
    : verif.kind === "REFERENCE" ? "reference"
    : null;
  if (!expectedPrefix || prefix !== expectedPrefix) {
    return NextResponse.json({ ok: false, error: "Upload prefix doesn't match verification kind" }, { status: 400 });
  }

  const key = buildUploadKey({
    prefix: check.prefix,
    companyId: verif.subjectCompanyId,
    filename,
  });
  const uploadUrl = await getPresignedPut({ key, contentType });

  return NextResponse.json({ ok: true, uploadUrl, key });
}
