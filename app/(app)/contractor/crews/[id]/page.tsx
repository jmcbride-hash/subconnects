import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireContractor } from "@/lib/auth";
import { db } from "@/db";
import { companies, subProfiles, subSystems, verifications } from "@/db/schema";
import { ROOFING_SYSTEMS } from "@/lib/constants/roofing-systems";

export const dynamic = "force-dynamic";

export default async function CrewProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { company: contractorCompany } = await requireContractor();
  const { id } = await params;

  const [crew] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.kind, "SUB")))
    .limit(1);
  if (!crew) notFound();

  // Only show VERIFIED crews on the public-to-contractors profile route.
  if (crew.status !== "VERIFIED") notFound();

  const [profile] = await db.select().from(subProfiles).where(eq(subProfiles.companyId, id)).limit(1);
  const sys = await db.select().from(subSystems).where(eq(subSystems.companyId, id));

  // Verification badges (status only — never expose evidence_url or metadata to contractors).
  const verifs = await db
    .select({ kind: verifications.kind, status: verifications.status })
    .from(verifications)
    .where(eq(verifications.subjectCompanyId, id));
  const insuranceOK = verifs.some((v) => v.kind === "INSURANCE" && v.status === "VERIFIED");
  const licenseOK = verifs.some((v) => v.kind === "LICENSE" && v.status === "VERIFIED");
  const refCount = verifs.filter((v) => v.kind === "REFERENCE" && v.status === "VERIFIED").length;

  const systemNameById = new Map(ROOFING_SYSTEMS.map((s) => [s.id, s.name]));
  const canInquire = contractorCompany.status === "VERIFIED";

  return (
    <div className="space-y-8">
      <Link href="/contractor/search" className="text-sm" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
        ← Back to search
      </Link>

      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-brand-yellow mb-2">VERIFIED CREW</p>
          <h1 className="text-3xl font-bold mb-2">{crew.displayName}</h1>
          {profile && (
            <p className="text-text-secondary">
              {profile.foremanName ? <>Foreman: {profile.foremanName} · </> : null}
              Crew of {profile.crewSize ?? "?"}
              {profile.yearsInTrade !== null ? <> · {profile.yearsInTrade} years in the trade</> : null}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          {canInquire ? (
            <Link
              href={`/contractor/crews/${crew.id}/inquire`}
              className="px-6 py-3 rounded-md text-sm font-bold"
              style={{ background: "var(--brand-yellow)", color: "var(--bg)", textDecoration: "none", fontFamily: "var(--font-montserrat)", letterSpacing: "0.02em" }}
            >
              Send Inquiry →
            </Link>
          ) : (
            <div
              className="px-6 py-3 rounded-md text-sm font-bold opacity-60"
              style={{ background: "var(--bg-card-hi)", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontFamily: "var(--font-montserrat)" }}
              title="Your contractor account must be verified to send inquiries"
            >
              Send Inquiry (verify your account first)
            </div>
          )}
        </div>
      </header>

      <section className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted mb-1">INSURANCE</div>
          <div className="font-bold text-base">{insuranceOK ? <span className="text-status-green">✓ Verified</span> : <span className="text-text-muted">Pending</span>}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted mb-1">LICENSE / REGISTRATION</div>
          <div className="font-bold text-base">{licenseOK ? <span className="text-status-green">✓ Verified</span> : <span className="text-text-muted">Pending</span>}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted mb-1">REFERENCES CALLED</div>
          <div className="font-bold text-base">{refCount > 0 ? <span className="text-status-green">✓ {refCount} verified</span> : <span className="text-text-muted">Pending</span>}</div>
        </div>
      </section>

      {profile && (
        <section className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="font-bold text-lg mb-3">Base + service area</h2>
            <p className="text-sm text-text-secondary">
              {profile.baseCity}, {profile.baseState}<br />
              {profile.serviceRadiusMiles} mile service radius
              {profile.willingToTravel && (
                <><br /><span className="text-brand-yellow">Travels for overnight jobs</span></>
              )}
            </p>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="font-bold text-lg mb-3">Systems worked</h2>
            {sys.length === 0 ? (
              <p className="text-sm text-text-muted">No systems listed.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sys.map((s2) => (
                  <span
                    key={s2.systemId}
                    className="font-mono text-[10px] tracking-[0.08em] px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(248, 188, 1, 0.12)", color: "var(--brand-yellow)" }}
                  >
                    {systemNameById.get(s2.systemId) ?? `#${s2.systemId}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {profile?.about && (
        <section className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <h2 className="font-bold text-lg mb-3">About</h2>
          <p className="text-sm text-text-secondary whitespace-pre-line">{profile.about}</p>
        </section>
      )}

      <section className="p-8 rounded-xl text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h2 className="font-bold text-lg mb-2">Reviews</h2>
        <p className="text-sm text-text-muted mb-1">No engagements completed yet.</p>
        <p className="text-xs text-text-muted">Two-way public reviews appear here after both sides confirm a job is done.</p>
      </section>

      <footer className="pt-6 border-t text-xs text-text-muted font-mono tracking-[0.18em] text-center" style={{ borderColor: "var(--border-color)" }}>
        VERIFIED · TRUSTED · PERFORMANCE-DRIVEN
      </footer>
    </div>
  );
}
