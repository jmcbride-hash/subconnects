import Link from "next/link";
import s from "../landing.module.css";

export const metadata = {
  title: "For Contractors · SubConnects",
  description:
    "Find verified roofing crews in your region. $299/month. ACH only. No auctions. No spam.",
};

export default function ForContractorsPage() {
  return (
    <section
      style={{
        padding: "clamp(48px, 8vw, 96px) clamp(20px, 4vw, 56px)",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <span className={s.heroEyebrow}>
          <span className={s.heroDot} />
          FOR COMMERCIAL ROOFING CONTRACTORS
        </span>
        <h1 className={s.heroTitle} style={{ marginTop: 0 }}>
          Hire roofing crews with the <span className={s.accent}>noise filtered out</span>.
        </h1>
        <p className={s.heroSub} style={{ maxWidth: 720, marginInline: "auto", marginTop: 20 }}>
          Only verified crews. Structured inquiries. Two-way accountability after every engagement.
        </p>
      </div>

      {/* What you get — 4 blocks */}
      <div
        className={s.pillarGrid}
        style={{ marginBottom: 56 }}
      >
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>✓</div>
          <h3>Verified directory</h3>
          <p>Every crew&apos;s insurance, license, and references are confirmed by hand, by phone. Only verified crews appear in search.</p>
        </div>
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>↗</div>
          <h3>Structured inquiries</h3>
          <p>Send a project brief with scope, system, metro, and budget band. The crew responds or doesn&apos;t. No auctions. No race to the bottom.</p>
        </div>
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>⇆</div>
          <h3>Two-way reviews</h3>
          <p>Rate crews on quality and punctuality. They rate you on payment behavior and scope clarity. Earned trust, on the record.</p>
        </div>
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>●</div>
          <h3>Concierge onboarding</h3>
          <p>Our team walks you through your first match. Verification, first inquiry, first engagement. Real people, not a chatbot.</p>
        </div>
      </div>

      {/* Pricing + CTA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 24,
          marginBottom: 56,
        }}
      >
        <div className={s.pricingCard} style={{ margin: 0 }}>
          <div className={s.pricingLabel}>CONTRACTOR PRICING</div>
          <div className={s.pricingValue}>$299<span className={s.per}> / month</span></div>
          <div className={s.pricingMeta}>
            Full directory access · unlimited outreach · concierge onboarding · ACH only
          </div>
          <div className={s.pricingDisclaimer}>Pricing subject to change at launch.</div>
        </div>
        <div
          className={s.formCard}
          style={{ margin: 0 }}
          id="contractor-form"
        >
          <h3>Join the Contractor Waitlist</h3>
          <p>First metro: Dallas-Fort Worth. We&apos;ll reach out within 1 business day.</p>
          <div className={s.formPlaceholder}>
            <strong>TALLY FORM EMBED — CONTRACTOR</strong>
            Replace this block with the Tally embed snippet.<br />
            Fields: company name · work email · phone (opt) · metro · jobs/year · biggest sourcing pain (opt)
          </div>
        </div>
      </div>

      {/* Verification anchor */}
      <div
        className={s.verifiedFoot}
        style={{ marginTop: 0 }}
      >
        Curious what &ldquo;verified&rdquo; actually means? <Link href="/how-it-works" style={{ color: "var(--brand-yellow)", textDecoration: "underline" }}>See our verification process →</Link>
      </div>
    </section>
  );
}
