import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { requireContractor } from "@/lib/auth";
import { db } from "@/db";
import { verifications } from "@/db/schema";
import { VerificationUpload } from "@/components/VerificationUpload";

export const dynamic = "force-dynamic";

export default async function ContractorDashboard() {
  const { user, company } = await requireContractor();

  const isPending = company.status === "PENDING_VERIFICATION" || company.status === "DRAFT";
  const isSuspended = company.status === "SUSPENDED";

  // Load the active verifications for this company so we can drive the upload UI.
  const verifs = await db
    .select()
    .from(verifications)
    .where(and(eq(verifications.subjectCompanyId, company.id), isNull(verifications.deletedAt)));

  const insurance = verifs.find((v) => v.kind === "INSURANCE");
  const license = verifs.find((v) => v.kind === "LICENSE");

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-brand-yellow mb-2">CONTRACTOR DASHBOARD</p>
          <h1 className="text-3xl font-bold mb-2">{company.displayName}</h1>
          <p className="text-text-secondary">Signed in as {user.email}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/contractor/search"
            className="px-4 py-2 rounded-md text-sm font-bold"
            style={{ background: "var(--brand-yellow)", color: "var(--bg)", textDecoration: "none", fontFamily: "var(--font-montserrat)", letterSpacing: "0.02em" }}
          >
            Find crews →
          </Link>
          <Link
            href="/contractor/inquiries"
            className="px-4 py-2 rounded-md text-sm"
            style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)", textDecoration: "none" }}
          >
            Inquiries
          </Link>
        </div>
      </header>

      {isPending && (
        <section
          className="rounded-xl border p-6 space-y-5"
          style={{ background: "var(--bg-card-hi)", borderColor: "var(--brand-yellow)" }}
        >
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] text-brand-yellow mb-2">UNDER REVIEW</div>
            <h2 className="text-xl font-bold mb-2">Your company is in the verification queue.</h2>
            <p className="text-text-secondary text-sm">
              Upload your documents below. Our team will verify them within 1 business day and
              flip you to live access. While you wait, you can browse the directory.
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
                label="License or business registration"
                alreadyUploaded={Boolean(license.evidenceUrl)}
              />
            )}
          </div>
        </section>
      )}

      {isSuspended && (
        <section className="rounded-xl border border-status-red p-6" style={{ background: "rgba(248, 113, 113, 0.05)" }}>
          <div className="font-mono text-[11px] tracking-[0.18em] text-status-red mb-2">SUSPENDED</div>
          <h2 className="text-xl font-bold mb-2">Account suspended.</h2>
          <p className="text-text-secondary text-sm">
            Reach out to support — your account is currently restricted.
          </p>
        </section>
      )}

      {!isPending && !isSuspended && (
        <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="font-mono text-[11px] tracking-[0.18em] text-brand-yellow mb-2">VERIFIED · ACTIVE</div>
          <h2 className="text-xl font-bold mb-2">You&apos;re live.</h2>
          <p className="text-text-secondary text-sm">
            Search the directory and send inquiries. Engagements, reviews, and billing build out from here.
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
