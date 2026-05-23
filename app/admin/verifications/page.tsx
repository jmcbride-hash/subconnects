import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { verifications, companies } from "@/db/schema";
import s from "../admin.module.css";

export const dynamic = "force-dynamic";

const KIND_CLASS: Record<string, string> = {
  INSURANCE: "kindInsurance",
  LICENSE: "kindLicense",
  REFERENCE: "kindReference",
  SYSTEM_BADGE: "kindSystemBadge",
  TIER_ASSESSMENT: "kindTierAssessment",
};

function ageString(d: Date | string): string {
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(ms / 60000);
  return `${mins}m`;
}

export default async function VerificationsQueue() {
  const rows = await db
    .select({
      id: verifications.id,
      kind: verifications.kind,
      status: verifications.status,
      createdAt: verifications.createdAt,
      metadata: verifications.metadata,
      companyId: companies.id,
      companyName: companies.displayName,
      companyKind: companies.kind,
    })
    .from(verifications)
    .innerJoin(companies, eq(companies.id, verifications.subjectCompanyId))
    .where(and(eq(verifications.status, "PENDING"), isNull(verifications.deletedAt)))
    .orderBy(asc(verifications.createdAt))
    .limit(200);

  return (
    <>
      <div className={s.pageHead}>
        <div className={s.pageEyebrow}>VERIFICATION QUEUE</div>
        <h1 className={s.pageTitle}>Pending verifications.</h1>
        <p className={s.pageSub}>
          Sorted oldest first. Click a company to open the detail view and approve or reject.
        </p>
      </div>

      <div className={s.panel}>
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>{rows.length} pending</h2>
          <span className={s.panelHint}>showing up to 200</span>
        </div>
        {rows.length === 0 ? (
          <div className={s.tableEmpty}>
            No pending verifications. Queue is clear.
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>SIDE</th>
                <th>KIND</th>
                <th>SUBMITTED</th>
                <th>AGE</th>
                <th style={{ textAlign: "right" }}>OPEN</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const kindClass = KIND_CLASS[r.kind] ?? "kindReference";
                return (
                  <tr key={r.id}>
                    <td>
                      <Link className={s.companyLink} href={`/admin/companies/${r.companyId}`}>
                        {r.companyName}
                      </Link>
                    </td>
                    <td className={s.muted}>{r.companyKind}</td>
                    <td>
                      <span className={`${s.kindBadge} ${s[kindClass]}`}>{r.kind}</span>
                    </td>
                    <td className={s.muted}>{new Date(r.createdAt).toLocaleString()}</td>
                    <td className={s.muted}>{ageString(r.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/admin/companies/${r.companyId}`}
                        style={{ color: "var(--brand-yellow)", textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em" }}
                      >
                        OPEN →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
