import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  companies,
  contractorProfiles,
  subProfiles,
  verifications,
  references as referencesTable,
  subSystems,
  memberships,
  users,
  auditLog,
} from "@/db/schema";
import { ROOFING_SYSTEMS } from "@/lib/constants/roofing-systems";
import { getPresignedGet, internalUrlToKey } from "@/lib/s3";
import { approveVerificationForm, rejectVerificationForm } from "../../_actions";
import s from "../../admin.module.css";

export const dynamic = "force-dynamic";

const KIND_CLASS: Record<string, string> = {
  INSURANCE: "kindInsurance",
  LICENSE: "kindLicense",
  REFERENCE: "kindReference",
  SYSTEM_BADGE: "kindSystemBadge",
  TIER_ASSESSMENT: "kindTierAssessment",
};
const STATUS_CLASS: Record<string, string> = {
  PENDING: "statusPending",
  VERIFIED: "statusVerified",
  EXPIRED: "statusExpired",
  REJECTED: "statusRejected",
  DRAFT: "statusDraft",
  PENDING_VERIFICATION: "statusPending",
  SUSPENDED: "statusSuspended",
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

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  if (!company) notFound();

  // Type-specific profile
  const [contractor] =
    company.kind === "CONTRACTOR"
      ? await db.select().from(contractorProfiles).where(eq(contractorProfiles.companyId, id)).limit(1)
      : [null];
  const [sub] =
    company.kind === "SUB"
      ? await db.select().from(subProfiles).where(eq(subProfiles.companyId, id)).limit(1)
      : [null];

  // All verifications (active)
  const verifs = await db
    .select()
    .from(verifications)
    .where(and(eq(verifications.subjectCompanyId, id), isNull(verifications.deletedAt)))
    .orderBy(verifications.createdAt);

  // Resolve signed GET URLs for any uploaded evidence (10-min expiry).
  // Map of verification.id → temporary download URL.
  const evidenceUrls = new Map<string, string>();
  for (const v of verifs) {
    const key = internalUrlToKey(v.evidenceUrl);
    if (!key) continue;
    try {
      const url = await getPresignedGet({ key });
      evidenceUrls.set(v.id, url);
    } catch {
      // S3 not configured locally — fall through, the link just won't render.
    }
  }

  // References (for sub crews)
  const refs =
    company.kind === "SUB"
      ? await db.select().from(referencesTable).where(eq(referencesTable.subjectCompanyId, id))
      : [];

  // Systems (for sub crews)
  const sys =
    company.kind === "SUB"
      ? await db.select().from(subSystems).where(eq(subSystems.companyId, id))
      : [];

  // Owners / members
  const mems = await db
    .select({
      role: memberships.role,
      status: memberships.status,
      email: users.email,
      fullName: users.fullName,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.companyId, id), isNull(memberships.deletedAt)));

  // Recent audit on this company / its verifications
  const verifIds = verifs.map((v) => v.id);
  const recent = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      subjectTable: auditLog.subjectTable,
      createdAt: auditLog.createdAt,
      actorEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .where(
      or(
        and(eq(auditLog.subjectTable, "companies"), eq(auditLog.subjectId, id)),
        verifIds.length > 0
          ? and(eq(auditLog.subjectTable, "verifications"), sql`${auditLog.subjectId} in (${sql.join(verifIds.map((vid) => sql`${vid}`), sql`, `)})`)
          : sql`false`
      )
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(15);

  const systemNameById = new Map(ROOFING_SYSTEMS.map((rs) => [rs.id, rs.name]));

  return (
    <>
      <div className={s.crumbs} style={{ marginBottom: 12 }}>
        <Link href="/admin/verifications">← All verifications</Link>
      </div>

      <div className={s.pageHead}>
        <div className={s.pageEyebrow}>
          {company.kind === "CONTRACTOR" ? "CONTRACTOR" : "SUB CREW"} · COMPANY DETAIL
        </div>
        <h1 className={s.pageTitle}>{company.displayName}</h1>
        <p className={s.pageSub}>
          <span className={`${s.statusBadge} ${s[STATUS_CLASS[company.status]]}`}>
            {company.status}
          </span>{" "}
          {company.legalName && <span className={s.muted}>· legal: {company.legalName}</span>}
        </p>
      </div>

      <div className={s.detailGrid}>
        {/* LEFT — Verifications */}
        <div>
          <div className={s.panel} style={{ marginBottom: 20 }}>
            <div className={s.panelHead}>
              <h2 className={s.panelTitle}>Verifications</h2>
              <span className={s.panelHint}>{verifs.length} total</span>
            </div>
            {verifs.length === 0 ? (
              <div className={s.tableEmpty}>No verifications on file.</div>
            ) : (
              <div>
                {verifs.map((v) => {
                  const kindClass = KIND_CLASS[v.kind] ?? "kindReference";
                  const statusClass = STATUS_CLASS[v.status] ?? "statusPending";
                  const meta = (v.metadata ?? {}) as Record<string, unknown>;
                  const pairedRef = v.kind === "REFERENCE" ? refs.find((r) => r.verificationId === v.id) : null;
                  return (
                    <div key={v.id} className={s.verBlock}>
                      <div className={s.verHead}>
                        <div className={s.verHeadLeft}>
                          <span className={`${s.kindBadge} ${s[kindClass]}`}>{v.kind}</span>
                          <span className={`${s.statusBadge} ${s[statusClass]}`}>{v.status}</span>
                          {pairedRef && (
                            <span className={s.muted}>{pairedRef.contactName} · {pairedRef.contactPhone}</span>
                          )}
                        </div>
                        <span className={s.verAge}>submitted {ageString(v.createdAt)} ago</span>
                      </div>
                      {pairedRef && pairedRef.lastJobSummary && (
                        <div className={s.verEvidence}>
                          <strong style={{ color: "var(--text-secondary)" }}>Last job:</strong> {pairedRef.lastJobSummary}
                          {pairedRef.lastJobCompletedAt && <> · {new Date(pairedRef.lastJobCompletedAt).toLocaleDateString()}</>}
                        </div>
                      )}
                      {v.evidenceUrl && (
                        <div className={s.verEvidence}>
                          Evidence:{" "}
                          {evidenceUrls.has(v.id) ? (
                            <a href={evidenceUrls.get(v.id)} target="_blank" rel="noopener noreferrer">
                              View document ↗
                            </a>
                          ) : (
                            <span className={s.muted}>uploaded (S3 not configured — link unavailable)</span>
                          )}
                          <span className={s.muted} style={{ marginLeft: 8 }}>
                            link expires in 10 min
                          </span>
                        </div>
                      )}
                      {Object.keys(meta).length > 0 && (
                        <pre className={s.metaJson} style={{ marginTop: 8, marginBottom: 10 }}>
                          {JSON.stringify(meta, null, 2)}
                        </pre>
                      )}
                      {v.rejectionReason && (
                        <div className={s.verEvidence}>
                          <strong style={{ color: "var(--status-red)" }}>Rejected:</strong> {v.rejectionReason}
                        </div>
                      )}

                      {v.status === "PENDING" && (
                        <div className={s.actions}>
                          <form action={approveVerificationForm}>
                            <input type="hidden" name="verificationId" value={v.id} />
                            <button type="submit" className={s.btnApprove}>✓ Approve</button>
                          </form>
                          <form action={rejectVerificationForm} className={s.rejectForm}>
                            <input type="hidden" name="verificationId" value={v.id} />
                            <input
                              type="text"
                              name="reason"
                              className={s.rejectInput}
                              placeholder="Rejection reason (required)…"
                              required
                            />
                            <button type="submit" className={s.btnReject}>✕ Reject</button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent audit */}
          <div className={s.panel}>
            <div className={s.panelHead}>
              <h2 className={s.panelTitle}>Audit trail</h2>
              <span className={s.panelHint}>last {recent.length}</span>
            </div>
            {recent.length === 0 ? (
              <div className={s.tableEmpty}>No audit events yet.</div>
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
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.subjectTable}</td>
                      <td>{r.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT — Profile sidebar */}
        <div>
          <div className={s.panel} style={{ marginBottom: 20 }}>
            <div className={s.panelHead}>
              <h2 className={s.panelTitle}>Profile</h2>
            </div>
            <div className={s.panelBodyPad}>
              <div className={s.kv}>
                <div className={s.kvLabel}>DISPLAY</div>
                <div className={`${s.kvValue} ${s.strong}`}>{company.displayName}</div>
                {company.legalName && (
                  <>
                    <div className={s.kvLabel}>LEGAL</div>
                    <div className={s.kvValue}>{company.legalName}</div>
                  </>
                )}
                {company.website && (
                  <>
                    <div className={s.kvLabel}>WEBSITE</div>
                    <div className={s.kvValue}>
                      <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-yellow)" }}>
                        {company.website}
                      </a>
                    </div>
                  </>
                )}
                {company.primaryPhone && (
                  <>
                    <div className={s.kvLabel}>PHONE</div>
                    <div className={s.kvValue}>{company.primaryPhone}</div>
                  </>
                )}
                <div className={s.kvLabel}>CREATED</div>
                <div className={s.kvValue}>{new Date(company.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {contractor && (
            <div className={s.panel} style={{ marginBottom: 20 }}>
              <div className={s.panelHead}>
                <h2 className={s.panelTitle}>HQ + License</h2>
              </div>
              <div className={s.panelBodyPad}>
                <div className={s.kv}>
                  <div className={s.kvLabel}>STREET</div>
                  <div className={s.kvValue}>{contractor.hqStreet}</div>
                  <div className={s.kvLabel}>CITY / STATE</div>
                  <div className={s.kvValue}>
                    {contractor.hqCity}, {contractor.hqState} {contractor.hqPostalCode}
                  </div>
                  <div className={s.kvLabel}>LICENSE #</div>
                  <div className={`${s.kvValue} ${s.strong}`}>
                    {contractor.licenseNumber} ({contractor.licenseState})
                  </div>
                  {contractor.yearFounded && (
                    <>
                      <div className={s.kvLabel}>YEAR FOUNDED</div>
                      <div className={s.kvValue}>{contractor.yearFounded}</div>
                    </>
                  )}
                  {contractor.employeeCountBand && (
                    <>
                      <div className={s.kvLabel}>EMPLOYEES</div>
                      <div className={s.kvValue}>{contractor.employeeCountBand}</div>
                    </>
                  )}
                  {contractor.about && (
                    <>
                      <div className={s.kvLabel}>ABOUT</div>
                      <div className={s.kvValue}>{contractor.about}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {sub && (
            <>
              <div className={s.panel} style={{ marginBottom: 20 }}>
                <div className={s.panelHead}>
                  <h2 className={s.panelTitle}>Crew + base</h2>
                </div>
                <div className={s.panelBodyPad}>
                  <div className={s.kv}>
                    <div className={s.kvLabel}>FOREMAN</div>
                    <div className={`${s.kvValue} ${s.strong}`}>{sub.foremanName}</div>
                    <div className={s.kvLabel}>CREW SIZE</div>
                    <div className={s.kvValue}>{sub.crewSize}</div>
                    {sub.yearsInTrade !== null && (
                      <>
                        <div className={s.kvLabel}>YRS IN TRADE</div>
                        <div className={s.kvValue}>{sub.yearsInTrade}</div>
                      </>
                    )}
                    <div className={s.kvLabel}>BASE</div>
                    <div className={s.kvValue}>
                      {sub.baseStreet}<br />
                      {sub.baseCity}, {sub.baseState} {sub.basePostalCode}
                    </div>
                    <div className={s.kvLabel}>SERVICE RADIUS</div>
                    <div className={s.kvValue}>{sub.serviceRadiusMiles} miles</div>
                    <div className={s.kvLabel}>TRAVELS</div>
                    <div className={s.kvValue}>{sub.willingToTravel ? "Yes — overnight OK" : "Local only"}</div>
                    {sub.about && (
                      <>
                        <div className={s.kvLabel}>ABOUT</div>
                        <div className={s.kvValue}>{sub.about}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {sys.length > 0 && (
                <div className={s.panel} style={{ marginBottom: 20 }}>
                  <div className={s.panelHead}>
                    <h2 className={s.panelTitle}>Systems worked</h2>
                  </div>
                  <div className={s.panelBodyPad}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sys.map((s2) => (
                        <span key={s2.systemId} className={`${s.kindBadge} ${s.kindSystemBadge}`}>
                          {systemNameById.get(s2.systemId) ?? `#${s2.systemId}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className={s.panel}>
            <div className={s.panelHead}>
              <h2 className={s.panelTitle}>Members</h2>
              <span className={s.panelHint}>{mems.length}</span>
            </div>
            {mems.length === 0 ? (
              <div className={s.tableEmpty}>No members.</div>
            ) : (
              <div className={s.panelBodyPad}>
                {mems.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < mems.length - 1 ? "1px solid var(--border-color)" : "0" }}>
                    <div>
                      <div className={`${s.kvValue} ${s.strong}`}>{m.fullName || m.email}</div>
                      <div className={s.muted} style={{ fontSize: 11 }}>{m.email}</div>
                    </div>
                    <div className={s.muted} style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
                      {m.role} · {m.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
