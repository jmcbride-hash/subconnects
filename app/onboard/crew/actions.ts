"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import {
  companies,
  subProfiles,
  memberships,
  verifications,
  references,
  subSystems,
  users,
} from "@/db/schema";
import { ROOFING_SYSTEMS } from "@/lib/constants/roofing-systems";

const VALID_SYSTEM_IDS = new Set(ROOFING_SYSTEMS.map((s) => s.id));

const ReferenceSchema = z.object({
  name: z.string().min(1, "Reference name is required").max(120),
  phone: z.string().min(10, "Reference phone is required").max(40),
  company: z.string().max(200).optional().or(z.literal("")),
  summary: z.string().max(500).optional().or(z.literal("")),
  completedAt: z
    .string()
    .optional()
    .transform((v) => (v && v.length ? v : undefined))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

const CrewSchema = z.object({
  legalName: z.string().min(1, "Crew / company legal name is required").max(200),
  displayName: z.string().min(1, "Display name is required").max(120),
  website: z.string().url("Website must be a valid URL").or(z.literal("")).optional(),
  primaryPhone: z.string().min(10, "Phone is required").max(40),

  foremanName: z.string().min(1, "Foreman name is required").max(120),
  crewSize: z
    .string()
    .min(1, "Crew size is required")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(500)),
  yearsInTrade: z
    .string()
    .optional()
    .transform((v) => (v && v.length ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().min(0).max(80).optional()),
  willingToTravel: z.string().optional().transform((v) => v === "on" || v === "true"),

  baseStreet: z.string().min(1, "Base street is required").max(200),
  baseCity: z.string().min(1, "Base city is required").max(120),
  baseState: z.string().min(2, "Base state is required").max(40),
  basePostalCode: z.string().min(3, "ZIP / postal code is required").max(20),
  serviceRadiusMiles: z
    .string()
    .min(1, "Service radius is required")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(500)),

  systems: z
    .array(z.number().int())
    .min(1, "Pick at least one system you work on"),

  about: z.string().max(2000).optional().or(z.literal("")),
});

export type CrewOnboardState = { error?: string };

export async function createCrewCompany(
  _prev: CrewOnboardState | undefined,
  formData: FormData
): Promise<CrewOnboardState> {
  const ctx = await requireUser();

  // FormData → primitives. systems[] arrives as repeated values.
  const rawSystems = formData
    .getAll("systems")
    .map((v) => parseInt(String(v), 10))
    .filter((n) => Number.isFinite(n) && VALID_SYSTEM_IDS.has(n));

  const parsed = CrewSchema.safeParse({
    legalName: formData.get("legalName"),
    displayName: formData.get("displayName"),
    website: formData.get("website") ?? "",
    primaryPhone: formData.get("primaryPhone"),
    foremanName: formData.get("foremanName"),
    crewSize: formData.get("crewSize") ?? "",
    yearsInTrade: formData.get("yearsInTrade") ?? "",
    willingToTravel: formData.get("willingToTravel") ?? "",
    baseStreet: formData.get("baseStreet"),
    baseCity: formData.get("baseCity"),
    baseState: formData.get("baseState"),
    basePostalCode: formData.get("basePostalCode"),
    serviceRadiusMiles: formData.get("serviceRadiusMiles") ?? "",
    systems: rawSystems,
    about: formData.get("about") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Parse the references (we accept 2-3; fewer than 2 = reject).
  const refs: Array<z.infer<typeof ReferenceSchema>> = [];
  for (let i = 0; i < 3; i++) {
    const name = String(formData.get(`ref_name_${i}`) ?? "").trim();
    const phone = String(formData.get(`ref_phone_${i}`) ?? "").trim();
    if (!name && !phone) continue; // skip empty slot

    const refParsed = ReferenceSchema.safeParse({
      name,
      phone,
      company: formData.get(`ref_company_${i}`) ?? "",
      summary: formData.get(`ref_summary_${i}`) ?? "",
      completedAt: formData.get(`ref_completed_${i}`) ?? "",
    });
    if (!refParsed.success) {
      return { error: `Reference #${i + 1}: ${refParsed.error.issues[0]?.message ?? "invalid"}` };
    }
    refs.push(refParsed.data);
  }

  if (refs.length < 2) {
    return { error: "We need at least 2 contractor references to verify a crew." };
  }

  const d = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [company] = await tx
        .insert(companies)
        .values({
          kind: "SUB",
          legalName: d.legalName,
          displayName: d.displayName,
          website: d.website || null,
          primaryPhone: d.primaryPhone,
          status: "PENDING_VERIFICATION",
        })
        .returning();

      await tx.insert(subProfiles).values({
        companyId: company.id,
        foremanName: d.foremanName,
        crewSize: d.crewSize,
        baseStreet: d.baseStreet,
        baseCity: d.baseCity,
        baseState: d.baseState,
        basePostalCode: d.basePostalCode,
        serviceRadiusMiles: d.serviceRadiusMiles,
        yearsInTrade: d.yearsInTrade ?? null,
        about: d.about || null,
        willingToTravel: d.willingToTravel,
      });

      await tx.insert(memberships).values({
        userId: ctx.user.id,
        companyId: company.id,
        role: "OWNER",
        status: "ACTIVE",
        acceptedAt: new Date(),
      });

      // sub_systems junction
      if (d.systems.length > 0) {
        await tx.insert(subSystems).values(
          d.systems.map((systemId) => ({ companyId: company.id, systemId }))
        );
      }

      // Insurance + License verifications (PENDING, awaiting upload)
      await tx.insert(verifications).values([
        { subjectCompanyId: company.id, kind: "INSURANCE", status: "PENDING", metadata: { awaiting_upload: true } },
        { subjectCompanyId: company.id, kind: "LICENSE",   status: "PENDING", metadata: { awaiting_upload: true } },
      ]);

      // For each reference: create a verifications row (REFERENCE, PENDING), then a paired references row.
      for (const ref of refs) {
        const [refVerification] = await tx
          .insert(verifications)
          .values({
            subjectCompanyId: company.id,
            kind: "REFERENCE",
            status: "PENDING",
            metadata: {
              contact_name: ref.name,
              contact_phone: ref.phone,
              contact_company: ref.company || null,
              awaiting_call: true,
            },
          })
          .returning();

        await tx.insert(references).values({
          subjectCompanyId: company.id,
          contactName: ref.name,
          contactPhone: ref.phone,
          contactCompany: ref.company || null,
          lastJobSummary: ref.summary || null,
          lastJobCompletedAt: ref.completedAt ?? null,
          verificationId: refVerification.id,
        });
      }

      await tx
        .update(users)
        .set({ lastActiveCompanyId: company.id, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
    });
  } catch (err) {
    console.error("[onboard/crew] insert failed:", err);
    return { error: "Something went wrong saving your crew. Please try again." };
  }

  redirect("/sub");
}
