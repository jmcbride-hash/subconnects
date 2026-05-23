import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { requireContractor } from "@/lib/auth";
import { db } from "@/db";
import { companies, subProfiles } from "@/db/schema";
import { ROOFING_SYSTEMS } from "@/lib/constants/roofing-systems";
import { getCrewSystemIds } from "./actions";
import InquiryForm from "./InquiryForm";

export const dynamic = "force-dynamic";

export default async function InquirePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { company: contractorCompany } = await requireContractor();
  const { id } = await params;

  const [crew] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.kind, "SUB"), eq(companies.status, "VERIFIED")))
    .limit(1);
  if (!crew) notFound();

  const [profile] = await db.select().from(subProfiles).where(eq(subProfiles.companyId, id)).limit(1);
  const crewSystemIds = await getCrewSystemIds(id);
  const crewSystems = ROOFING_SYSTEMS.filter((s) => crewSystemIds.includes(s.id));

  const canSubmit = contractorCompany.status === "VERIFIED";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href={`/contractor/crews/${id}`} className="text-sm" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
        ← Back to crew profile
      </Link>

      <header>
        <p className="font-mono text-xs tracking-[0.18em] text-brand-yellow mb-2">SEND INQUIRY</p>
        <h1 className="text-3xl font-bold mb-2">Inquire with {crew.displayName}.</h1>
        <p className="text-text-secondary text-sm">
          {profile?.foremanName ? <>Foreman {profile.foremanName} · </> : null}
          Based in {profile?.baseCity}, {profile?.baseState}
        </p>
      </header>

      {!canSubmit && (
        <div
          className="rounded-xl border p-5 text-sm"
          style={{ background: "rgba(248, 188, 1, 0.05)", borderColor: "var(--brand-yellow)" }}
        >
          Your contractor account is still under review. You can preview the inquiry form but cannot send it until you&apos;re verified.
        </div>
      )}

      <InquiryForm
        crewCompanyId={crew.id}
        crewSystems={crewSystems}
        disabled={!canSubmit}
      />
    </div>
  );
}
