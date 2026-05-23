import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireContractor } from "@/lib/auth";
import { db } from "@/db";
import { inquiries, companies, subProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  SENT: "var(--brand-yellow)",
  VIEWED: "var(--brand-yellow)",
  RESPONDED: "var(--status-green)",
  DECLINED: "var(--status-red)",
  ARCHIVED: "var(--text-muted)",
};

export default async function ContractorInquiriesList() {
  const { company } = await requireContractor();

  const rows = await db
    .select({
      id: inquiries.id,
      subject: inquiries.subject,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      crewName: companies.displayName,
      crewCity: subProfiles.baseCity,
      crewState: subProfiles.baseState,
    })
    .from(inquiries)
    .innerJoin(companies, eq(companies.id, inquiries.subCompanyId))
    .leftJoin(subProfiles, eq(subProfiles.companyId, inquiries.subCompanyId))
    .where(eq(inquiries.contractorCompanyId, company.id))
    .orderBy(desc(inquiries.createdAt))
    .limit(100);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs tracking-[0.18em] text-brand-yellow mb-2">YOUR INQUIRIES</p>
        <h1 className="text-3xl font-bold mb-2">Inquiries</h1>
        <p className="text-text-secondary text-sm">
          Everything you&apos;ve sent. {rows.length === 0 ? "Nothing yet — find a crew to inquire with." : `${rows.length} on file.`}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="p-10 rounded-xl text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-text-secondary mb-4">No inquiries yet.</p>
          <Link
            href="/contractor/search"
            className="inline-block px-5 py-2.5 rounded-md text-sm font-bold"
            style={{ background: "var(--brand-yellow)", color: "var(--bg)", textDecoration: "none", fontFamily: "var(--font-montserrat)" }}
          >
            Find a verified crew →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.15)" }}>
                <th className="text-left px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-text-muted">SUBJECT</th>
                <th className="text-left px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-text-muted">CREW</th>
                <th className="text-left px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-text-muted">SENT</th>
                <th className="text-left px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-text-muted">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid var(--border-color)" : "0" }}>
                  <td className="px-5 py-3 font-medium text-white">{r.subject ?? "(no subject)"}</td>
                  <td className="px-5 py-3 text-text-secondary">
                    {r.crewName}
                    {r.crewCity && <span className="text-text-muted text-xs"> · {r.crewCity}, {r.crewState}</span>}
                  </td>
                  <td className="px-5 py-3 text-text-muted text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className="font-mono text-[10px] tracking-[0.1em] px-2 py-0.5 rounded"
                      style={{ background: "rgba(248,188,1,0.08)", color: STATUS_COLORS[r.status] ?? "var(--text-muted)" }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="pt-6 border-t text-xs text-text-muted font-mono tracking-[0.18em] flex items-center justify-between" style={{ borderColor: "var(--border-color)" }}>
        <Link href="/contractor" style={{ color: "var(--text-muted)", textDecoration: "none" }}>← Back to dashboard</Link>
        <span>VERIFIED · TRUSTED · PERFORMANCE-DRIVEN</span>
      </footer>
    </div>
  );
}
