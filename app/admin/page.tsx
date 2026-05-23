import Link from "next/link";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { verifications, companies, auditLog, users } from "@/db/schema";
import s from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminIndex() {
  // KPIs — single round-trip-ish set of aggregates.
  const [pendingTotalRow] = await db
    .select({ n: count() })
    .from(verifications)
    .where(and(eq(verifications.status, "PENDING"), isNull(verifications.deletedAt)));

  const [pendingCompaniesRow] = await db
    .select({ n: count() })
    .from(companies)
    .where(eq(companies.status, "PENDING_VERIFICATION"));

  const [verifiedCompaniesRow] = await db
    .select({ n: count() })
    .from(companies)
    .where(eq(companies.status, "VERIFIED"));

  const [oldestPendingRow] = await db
    .select({ createdAt: verifications.createdAt })
    .from(verifications)
    .where(and(eq(verifications.status, "PENDING"), isNull(verifications.deletedAt)))
    .orderBy(verifications.createdAt)
    .limit(1);

  // Recent activity — last 8 audit-log entries that touched verifications or companies.
  const recent = await db
    .select({
      id: auditLog.id,
      actorEmail: users.email,
      subjectTable: auditLog.subjectTable,
      action: auditLog.action,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .where(sql`${auditLog.subjectTable} in ('verifications', 'companies')`)
    .orderBy(desc(auditLog.createdAt))
    .limit(8);

  const oldestAgeDays = oldestPendingRow?.createdAt
    ? Math.floor((Date.now() - new Date(oldestPendingRow.createdAt).getTime()) / 86400000)
    : null;

  return (
    <>
      <div className={s.pageHead}>
        <div className={s.pageEyebrow}>VERIFICATION QUEUE</div>
        <h1 className={s.pageTitle}>Internal admin.</h1>
        <p className={s.pageSub}>
          Work the queue per <span className="font-mono" style={{ color: "var(--brand-yellow)" }}>docs/verification-playbook.md</span>.
          Every approve/reject writes an audit log entry. Trust requires receipts.
        </p>
      </div>

      <div className={s.kpiGrid}>
        <div className={s.kpi}>
          <div className={s.kpiTop} />
          <div className={s.kpiLabel}>PENDING VERIFICATIONS</div>
          <div className={s.kpiValue}>{pendingTotalRow?.n ?? 0}</div>
          <div className={s.kpiSub}>across all companies</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiTop} />
          <div className={s.kpiLabel}>COMPANIES UNDER REVIEW</div>
          <div className={s.kpiValue}>{pendingCompaniesRow?.n ?? 0}</div>
          <div className={s.kpiSub}>awaiting verified status</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiTop} />
          <div className={s.kpiLabel}>VERIFIED COMPANIES</div>
          <div className={s.kpiValue}>{verifiedCompaniesRow?.n ?? 0}</div>
          <div className={s.kpiSub}>live in search</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiTop} />
          <div className={s.kpiLabel}>OLDEST PENDING</div>
          <div className={s.kpiValue}>{oldestAgeDays === null ? "—" : oldestAgeDays}</div>
          <div className={s.kpiSub}>{oldestAgeDays === null ? "queue empty" : `day${oldestAgeDays === 1 ? "" : "s"} since submission`}</div>
        </div>
      </div>

      <div className={s.panel} style={{ marginBottom: 20 }}>
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>Quick links</h2>
        </div>
        <div className={s.panelBodyPad}>
          <Link
            href="/admin/verifications"
            className={s.btnApprove}
            style={{ marginRight: 12, textDecoration: "none" }}
          >
            Open verification queue →
          </Link>
          <span className={s.muted}>
            Or jump to a specific company by ID in the URL bar.
          </span>
        </div>
      </div>

      <div className={s.panel}>
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>Recent activity</h2>
          <span className={s.panelHint}>Last 8 entries · audit_log</span>
        </div>
        {recent.length === 0 ? (
          <div className={s.tableEmpty}>No activity yet.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>WHEN</th>
                <th>ACTOR</th>
                <th>SUBJECT</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className={s.muted}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{r.actorEmail ?? <span className={s.muted}>system</span>}</td>
                  <td className="font-mono" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.subjectTable}</td>
                  <td>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
