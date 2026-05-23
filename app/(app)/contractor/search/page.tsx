import Link from "next/link";
import { and, eq, inArray, sql } from "drizzle-orm";
import { requireContractor } from "@/lib/auth";
import { db } from "@/db";
import { companies, subProfiles, subSystems } from "@/db/schema";
import { ROOFING_SYSTEMS, ROOFING_SYSTEMS_BY_CATEGORY, CATEGORY_LABELS } from "@/lib/constants/roofing-systems";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ systems?: string; city?: string; state?: string }>;

export default async function ContractorSearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company } = await requireContractor();
  const params = await searchParams;
  const selectedSystemIds = (params.systems ?? "")
    .split(",")
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n));
  const city = (params.city ?? "").trim();
  const state = (params.state ?? "").trim();

  const isContractorVerified = company.status === "VERIFIED";

  // Resolve crew IDs that match the selected systems (intersection)
  let matchedCrewIds: string[] | null = null;
  if (selectedSystemIds.length > 0) {
    const rows = await db
      .select({ companyId: subSystems.companyId, n: sql<number>`count(*)::int` })
      .from(subSystems)
      .where(inArray(subSystems.systemId, selectedSystemIds))
      .groupBy(subSystems.companyId)
      .having(sql`count(*) >= ${selectedSystemIds.length}`);
    matchedCrewIds = rows.map((r) => r.companyId);
    if (matchedCrewIds.length === 0) matchedCrewIds = ["00000000-0000-0000-0000-000000000000"];
  }

  const baseWhere = [
    eq(companies.kind, "SUB"),
    eq(companies.status, "VERIFIED"),
  ];
  if (matchedCrewIds) baseWhere.push(inArray(companies.id, matchedCrewIds));
  if (city) baseWhere.push(sql`lower(${subProfiles.baseCity}) = lower(${city})`);
  if (state) baseWhere.push(sql`lower(${subProfiles.baseState}) = lower(${state})`);

  const results = await db
    .select({
      id: companies.id,
      displayName: companies.displayName,
      foremanName: subProfiles.foremanName,
      crewSize: subProfiles.crewSize,
      yearsInTrade: subProfiles.yearsInTrade,
      baseCity: subProfiles.baseCity,
      baseState: subProfiles.baseState,
      serviceRadiusMiles: subProfiles.serviceRadiusMiles,
      willingToTravel: subProfiles.willingToTravel,
      about: subProfiles.about,
    })
    .from(companies)
    .innerJoin(subProfiles, eq(subProfiles.companyId, companies.id))
    .where(and(...baseWhere))
    .orderBy(sql`${companies.updatedAt} desc`)
    .limit(50);

  // Systems per matched crew (for the cards)
  const crewIds = results.map((r) => r.id);
  let systemsByCrew = new Map<string, number[]>();
  if (crewIds.length > 0) {
    const rows = await db
      .select({ companyId: subSystems.companyId, systemId: subSystems.systemId })
      .from(subSystems)
      .where(inArray(subSystems.companyId, crewIds));
    for (const r of rows) {
      const arr = systemsByCrew.get(r.companyId) ?? [];
      arr.push(r.systemId);
      systemsByCrew.set(r.companyId, arr);
    }
  }
  const systemNameById = new Map(ROOFING_SYSTEMS.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs tracking-[0.18em] text-brand-yellow mb-2">FIND VERIFIED CREWS</p>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-text-secondary text-sm">
          Verified roofing crews only. Filter by system worked and base location.
        </p>
      </header>

      {!isContractorVerified && (
        <div
          className="rounded-xl border p-5 text-sm"
          style={{ background: "rgba(248, 188, 1, 0.05)", borderColor: "var(--brand-yellow)" }}
        >
          <strong className="text-brand-yellow font-mono text-[10px] tracking-[0.18em] block mb-1">UNDER REVIEW</strong>
          Your contractor account is still in verification. You can browse the directory, but you&apos;ll be able to send inquiries once your account is verified.
        </div>
      )}

      <form method="get" className="grid gap-4 p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted mb-2">SYSTEMS</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {Object.entries(ROOFING_SYSTEMS_BY_CATEGORY).map(([cat, list]) =>
              list.length > 0 ? (
                <div key={cat}>
                  <div className="font-mono text-[9px] tracking-[0.12em] text-text-muted mb-1.5">
                    {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS].toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {list.map((sys) => (
                      <label key={sys.id} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          name="systems"
                          value={sys.id}
                          defaultChecked={selectedSystemIds.includes(sys.id)}
                          style={{ accentColor: "var(--brand-yellow)" }}
                        />
                        <span>{sys.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="city" className="font-mono text-[10px] tracking-[0.15em] text-text-muted block mb-1.5">CITY (base)</label>
            <input
              id="city" name="city" type="text" defaultValue={city}
              placeholder="Dallas"
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{ background: "var(--bg)", border: "1px solid var(--border-color)", color: "#fff" }}
            />
          </div>
          <div>
            <label htmlFor="state" className="font-mono text-[10px] tracking-[0.15em] text-text-muted block mb-1.5">STATE</label>
            <input
              id="state" name="state" type="text" defaultValue={state} maxLength={2}
              placeholder="TX"
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{ background: "var(--bg)", border: "1px solid var(--border-color)", color: "#fff" }}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-md font-mono text-xs tracking-[0.08em] font-bold"
              style={{ background: "var(--brand-yellow)", color: "var(--bg)", border: 0, cursor: "pointer" }}
            >
              SEARCH
            </button>
            {(selectedSystemIds.length > 0 || city || state) && (
              <Link
                href="/contractor/search"
                className="px-4 py-2 rounded-md text-xs"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)", textDecoration: "none" }}
              >
                Clear
              </Link>
            )}
          </div>
        </div>

        <p className="text-xs text-text-muted">
          Service-radius geo search lights up once we wire address geocoding. For now, city + state filters apply.
        </p>
      </form>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{results.length} verified crew{results.length === 1 ? "" : "s"}</h2>
          <span className="font-mono text-[10px] tracking-[0.15em] text-text-muted">SHOWING UP TO 50</span>
        </div>

        {results.length === 0 ? (
          <div className="p-10 rounded-xl text-center text-text-muted text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            No verified crews match those filters yet. Concierge launch is still seeding the directory in Dallas-Fort Worth — check back soon.
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {results.map((r) => {
              const sysIds = systemsByCrew.get(r.id) ?? [];
              return (
                <Link
                  key={r.id}
                  href={`/contractor/crews/${r.id}`}
                  className="block p-5 rounded-xl transition-colors"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", textDecoration: "none", color: "inherit" }}
                >
                  <div className="font-mono text-[10px] tracking-[0.15em] text-brand-yellow mb-2">VERIFIED · CREW</div>
                  <h3 className="text-lg font-bold mb-1">{r.displayName}</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    {r.foremanName ? <>Foreman: {r.foremanName} · </> : null}
                    Crew of {r.crewSize ?? "?"}
                    {r.yearsInTrade !== null ? <> · {r.yearsInTrade} yrs in trade</> : null}
                  </p>
                  <p className="text-xs text-text-muted mb-3">
                    Based in {r.baseCity}, {r.baseState} · {r.serviceRadiusMiles}mi radius
                    {r.willingToTravel ? " · Travels for overnight jobs" : ""}
                  </p>
                  {sysIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sysIds.map((sid) => (
                        <span
                          key={sid}
                          className="font-mono text-[10px] tracking-[0.08em] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(248, 188, 1, 0.1)", color: "var(--brand-yellow)" }}
                        >
                          {systemNameById.get(sid) ?? `#${sid}`}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="pt-8 border-t text-xs text-text-muted font-mono tracking-[0.18em] flex items-center justify-between" style={{ borderColor: "var(--border-color)" }}>
        <Link href="/contractor" style={{ color: "var(--text-muted)", textDecoration: "none" }}>← Back to dashboard</Link>
        <span>VERIFIED · TRUSTED · PERFORMANCE-DRIVEN</span>
      </footer>
    </div>
  );
}
