"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { companies, contractorProfiles, memberships, verifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ContractorSchema = z.object({
  legalName: z.string().min(1, "Legal company name is required").max(200),
  displayName: z.string().min(1, "Display name is required").max(120),
  website: z.string().url("Website must be a valid URL").or(z.literal("")).optional(),
  primaryPhone: z.string().min(10, "Phone is required").max(40),
  hqStreet: z.string().min(1, "Street address is required").max(200),
  hqCity: z.string().min(1, "City is required").max(120),
  hqState: z.string().min(2, "State is required").max(40),
  hqPostalCode: z.string().min(3, "ZIP / postal code is required").max(20),
  licenseNumber: z.string().min(1, "License or business registration # is required").max(80),
  licenseState: z.string().min(2, "License state is required").max(40),
  yearFounded: z
    .string()
    .optional()
    .transform((v) => (v && v.length ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().min(1900).max(new Date().getFullYear()).optional()),
  employeeCountBand: z.enum(["1-10", "11-50", "51-200", "201+"]),
  about: z.string().max(2000).optional().or(z.literal("")),
});

export type ContractorOnboardState = { error?: string };

export async function createContractorCompany(
  _prev: ContractorOnboardState | undefined,
  formData: FormData
): Promise<ContractorOnboardState> {
  const ctx = await requireUser();

  const parsed = ContractorSchema.safeParse({
    legalName: formData.get("legalName"),
    displayName: formData.get("displayName"),
    website: formData.get("website") ?? "",
    primaryPhone: formData.get("primaryPhone"),
    hqStreet: formData.get("hqStreet"),
    hqCity: formData.get("hqCity"),
    hqState: formData.get("hqState"),
    hqPostalCode: formData.get("hqPostalCode"),
    licenseNumber: formData.get("licenseNumber"),
    licenseState: formData.get("licenseState"),
    yearFounded: formData.get("yearFounded") ?? "",
    employeeCountBand: formData.get("employeeCountBand"),
    about: formData.get("about") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;

  try {
    // Insert companies, contractor_profiles, memberships, verifications in one transaction.
    await db.transaction(async (tx) => {
      const [company] = await tx
        .insert(companies)
        .values({
          kind: "CONTRACTOR",
          legalName: d.legalName,
          displayName: d.displayName,
          website: d.website || null,
          primaryPhone: d.primaryPhone,
          status: "PENDING_VERIFICATION",
        })
        .returning();

      await tx.insert(contractorProfiles).values({
        companyId: company.id,
        licenseNumber: d.licenseNumber,
        licenseState: d.licenseState,
        hqStreet: d.hqStreet,
        hqCity: d.hqCity,
        hqState: d.hqState,
        hqPostalCode: d.hqPostalCode,
        yearFounded: d.yearFounded ?? null,
        employeeCountBand: d.employeeCountBand,
        about: d.about || null,
      });

      await tx.insert(memberships).values({
        userId: ctx.user.id,
        companyId: company.id,
        role: "OWNER",
        status: "ACTIVE",
        acceptedAt: new Date(),
      });

      // Two pending verifications. evidence_url stays null until file upload is wired (S3).
      // Admin team contacts the contractor for documents per docs/verification-playbook.md.
      await tx.insert(verifications).values([
        {
          subjectCompanyId: company.id,
          kind: "INSURANCE",
          status: "PENDING",
          metadata: { awaiting_upload: true },
        },
        {
          subjectCompanyId: company.id,
          kind: "LICENSE",
          status: "PENDING",
          metadata: {
            awaiting_upload: true,
            self_reported_number: d.licenseNumber,
            self_reported_state: d.licenseState,
          },
        },
      ]);

      // Set this as the user's active company.
      await tx
        .update(users)
        .set({ lastActiveCompanyId: company.id, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
    });
  } catch (err) {
    console.error("[onboard/contractor] insert failed:", err);
    return { error: "Something went wrong saving your company. Please try again." };
  }

  redirect("/contractor");
}
