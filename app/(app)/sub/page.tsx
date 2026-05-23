import { requireSub } from "@/lib/auth";
import { db } from "@/db";
import { verifications } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { VerificationUpload } from "@/components/VerificationUpload";

export const dynamic = "force-dynamic";

export default async function SubDashboard() {
  const { user, company } = await requireSub();

  const isPending = company.status === "PENDING_VERIFICATION" || company.status === "DRAFT";
  const isSuspended = company.status === "SUSPENDED";

  const verifs = await db
    .select()
    .from(verifications)
    .where(and(eq(verifications.subjectCompanyId, company.id), isNull(verifications.deletedAt)));

  const insurance = verifs.find((v) => v.kind === "INSURANCE");
  const license = verifs.find((v) => v.kind === "LICENSE");
  const refs = verifs.filter((v) => v.kind === "REFERENCE");
  const refsPending = refs.filter((v) => v.status === "PENDING").length;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs tracking-[0.18em] text-brand-yellow mb-2">CREW DASHBOARD</p>
        <h1 className="text-3xl font-bold mb-2">{company.displayName}</h1>
        <p className="text-text-secondary">Signed in as {user.email}.</p>
      </header>

      {isPending && (
        <section
          className="rounded-xl border p-6 space-y-5"
          style={{ background: "var(--bg-card-hi)", borderColor: "var(--brand-yellow)" }}
        >
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] text-brand-yellow mb-2">UNDER REVIEW</div>
            <h2 className="text-xl font-bold mb-2">Your crew is in the verification queue.</h2>
            <p className="text-text-secondary text-sm">
              Upload your documents below. Our team will call every reference and confirm your
              insurance with the carrier. Once you pass, your profile goes live in search.
            </p>
          </div>

          <div className="space-y-3">
            {insurance && (
              <VerificationUpload
                verificationId={insurance.id}
                prefix="coi"
                label="Certificate of Insurance (COI)"
                alreadyUploaded={Boolean(insurance.evidenceUrl)}
              />
            )}
            {license && (
              <VerificationUpload
                verificationId={license.id}
                prefix="license"
                label="Business registration or license"
                alreadyUploaded={Boolean(license.evidenceUrl)}
              />
            )}
            {refs.length > 0 && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{ background: "var(--bg)", border: "1px solid var(--border-color)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">References ({refs.length} submitted)</span>
                  <span className="text-xs text-text-muted">
                    {refsPending > 0 ? `${refsPending} pending call` : "All called"}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Our team contacts your references by phone. No document upload needed here.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {isSuspended && (
        <section className="rounded-xl border border-status-red p-6" style={{ background: "rgba(248, 113, 113, 0.05)" }}>
          <div className="font-mono text-[11px] tracking-[0.18em] text-status-red mb-2">SUSPENDED</div>
          <h2 className="text-xl font-bold mb-2">Account suspended.</h2>
          <p className="text-text-secondary text-sm">
            Reach out to support — your crew&apos;s profile is currently hidden from search.
          </p>
        </section>
      )}

      {!isPending && !isSuspended && (
        <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="font-mono text-[11px] tracking-[0.18em] text-brand-yellow mb-2">VERIFIED · LIVE</div>
          <h2 className="text-xl font-bold mb-2">You&apos;re live.</h2>
          <p className="text-text-secondary text-sm">
            Verified crews appear in contractor search. Inquiries, engagements, and reputation
            data build out from here. Coming soon.
          </p>
        </section>
      )}

      <footer className="pt-8 border-t border-[var(--border-color)] text-xs text-text-muted font-mono tracking-[0.18em] flex items-center justify-between">
        <span>VERIFIED · TRUSTED · PERFORMANCE-DRIVEN</span>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="text-text-muted hover:text-brand-yellow transition-colors" style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: "inherit", letterSpacing: "inherit" }}>
            SIGN OUT
          </button>
        </form>
      </footer>
    </div>
  );
}
