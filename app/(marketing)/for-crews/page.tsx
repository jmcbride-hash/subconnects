import Link from "next/link";
import s from "../landing.module.css";

export const metadata = {
  title: "For Sub Crews · SubConnects",
  description:
    "Get verified. Get found by real contractors. Build a reputation that travels with your crew.",
};

export default function ForCrewsPage() {
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
          FOR ROOFING SUB CREWS
        </span>
        <h1 className={s.heroTitle} style={{ marginTop: 0 }}>
          Get verified. Get found. Get paid what your work is <span className={s.accent}>worth</span>.
        </h1>
        <p className={s.heroSub} style={{ maxWidth: 720, marginInline: "auto", marginTop: 20 }}>
          A verified profile that travels with you. Contractor inquiries built on trust — not auctions.
        </p>
      </div>

      {/* What you get */}
      <div className={s.pillarGrid} style={{ marginBottom: 56 }}>
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>✓</div>
          <h3>Verified by hand</h3>
          <p>We confirm your insurance with the carrier, check your license, and call every reference. No shortcuts.</p>
        </div>
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>↗</div>
          <h3>Real contractor inquiries</h3>
          <p>Verified contractors find you by system and region. Structured project briefs. No auction bidding.</p>
        </div>
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>⇆</div>
          <h3>Rate the contractor back</h3>
          <p>Public two-way reviews. Payment behavior, fair treatment, scope clarity — on the record.</p>
        </div>
        <div className={s.pillar}>
          <div className={s.pillarIcon} aria-hidden>●</div>
          <h3>Portable credential</h3>
          <p>Today: verified status. Coming next: system-specific skill badges and tiered certifications. Yours, not the platform&apos;s.</p>
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
          <div className={s.pricingLabel}>CREW PRICING</div>
          <div className={s.pricingValue}>FREE</div>
          <div className={s.pricingMeta}>
            Verified profile · contractor inquiries · reputation building
          </div>
          <div className={s.pricingDisclaimer}>
            Premium tiers and skill-badge assessments will be paid options later — we&apos;ll tell you before anything changes.
          </div>
        </div>
        <div
          className={s.formCard}
          style={{ margin: 0 }}
          id="crew-form"
        >
          <h3>Join the Crew Waitlist</h3>
          <p>Dallas-Fort Worth first. We&apos;ll call you within 1 business day.</p>
          <div className={s.formPlaceholder}>
            <strong>TALLY FORM EMBED — CREW</strong>
            Replace this block with the Tally embed snippet.<br />
            Fields: crew name · foreman name · work email · phone (opt) · base city · systems · years · crew size
          </div>
        </div>
      </div>

      <div className={s.verifiedFoot} style={{ marginTop: 0 }}>
        Curious what &ldquo;verified&rdquo; actually means? <Link href="/how-it-works" style={{ color: "var(--brand-yellow)", textDecoration: "underline" }}>See our verification process →</Link>
      </div>
    </section>
  );
}
