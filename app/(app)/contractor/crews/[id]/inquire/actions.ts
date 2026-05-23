"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireContractor } from "@/lib/auth";
import { db } from "@/db";
import {
  companies,
  inquiries,
  conversations,
  messages,
  subSystems,
} from "@/db/schema";
import { ROOFING_SYSTEMS } from "@/lib/constants/roofing-systems";

const VALID_SYSTEM_IDS = new Set(ROOFING_SYSTEMS.map((s) => s.id));

type ValueBand = "LT_25K" | "25K_75K" | "75K_250K" | "250K_1M" | "GT_1M";
const VALUE_BAND_VALUES: readonly ValueBand[] = ["LT_25K", "25K_75K", "75K_250K", "250K_1M", "GT_1M"];

const InquirySchema = z.object({
  subCompanyId: z.string().uuid(),
  subject: z.string().min(1, "Subject is required").max(200),
  projectSummary: z.string().min(10, "Project summary should be at least a couple sentences").max(4000),
  estimatedValueBand: z
    .string()
    .optional()
    .transform((v): ValueBand | null => {
      if (!v) return null;
      return (VALUE_BAND_VALUES as readonly string[]).includes(v) ? (v as ValueBand) : null;
    }),
});

export type InquiryActionState = { error?: string };

export async function createInquiry(
  _prev: InquiryActionState | undefined,
  formData: FormData
): Promise<InquiryActionState> {
  const { user, company: contractorCompany } = await requireContractor();

  if (contractorCompany.status !== "VERIFIED") {
    return { error: "Your contractor account must be verified before sending inquiries." };
  }

  const rawSystems = formData
    .getAll("projectSystems")
    .map((v) => parseInt(String(v), 10))
    .filter((n) => Number.isFinite(n) && VALID_SYSTEM_IDS.has(n));

  const parsed = InquirySchema.safeParse({
    subCompanyId: formData.get("subCompanyId"),
    subject: formData.get("subject"),
    projectSummary: formData.get("projectSummary"),
    estimatedValueBand: formData.get("estimatedValueBand") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (rawSystems.length === 0) {
    return { error: "Pick at least one system this job involves." };
  }

  const d = parsed.data;

  // Confirm the target is a VERIFIED sub.
  const [target] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, d.subCompanyId), eq(companies.kind, "SUB")))
    .limit(1);
  if (!target || target.status !== "VERIFIED") {
    return { error: "That crew is not currently available for inquiries." };
  }

  let inquiryId: string | null = null;

  try {
    await db.transaction(async (tx) => {
      const [inq] = await tx
        .insert(inquiries)
        .values({
          contractorCompanyId: contractorCompany.id,
          subCompanyId: d.subCompanyId,
          initiatingUserId: user.id,
          subject: d.subject,
          projectSummary: d.projectSummary,
          projectSystems: rawSystems,
          estimatedValueBand: d.estimatedValueBand,
          status: "SENT",
        })
        .returning();

      const [conv] = await tx
        .insert(conversations)
        .values({ inquiryId: inq.id })
        .returning();

      await tx.insert(messages).values({
        conversationId: conv.id,
        senderUserId: user.id,
        body: `[Inquiry] ${d.subject}\n\n${d.projectSummary}`,
      });

      inquiryId = inq.id;
    });
  } catch (err) {
    console.error("[createInquiry] failed:", err);
    return { error: "Something went wrong sending the inquiry. Please try again." };
  }

  if (!inquiryId) return { error: "Inquiry was not created." };
  redirect(`/contractor/inquiries`);
}

// Helper used by the form: which systems does this crew work on?
// We restrict the project-systems multi-select to the intersection.
export async function getCrewSystemIds(crewCompanyId: string): Promise<number[]> {
  const rows = await db
    .select({ systemId: subSystems.systemId })
    .from(subSystems)
    .where(eq(subSystems.companyId, crewCompanyId));
  return rows.map((r) => r.systemId);
}
