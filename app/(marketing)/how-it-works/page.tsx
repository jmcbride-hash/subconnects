import Link from "next/link";
import s from "../landing.module.css";

export const metadata = {
  title: "How Verification Works · SubConnects",
  description:
    "What we check before a crew goes live in search. Insurance, license, references — by hand, by phone. Every \"yes\" is a phone call.",
};

export default function HowItWorksPage() {
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
          WHAT &ldquo;VERIFIED&rdquo; ACTUALLY MEANS
        </span>
        <h1 className={s.heroTitle} style={{ marginTop: 0 }}>
          We hate the word as much as <span className={s.accent}>you do</span>.
        </h1>
        <p className={s.heroSub} style={{ maxWidth: 720, marginInline: "auto", marginTop: 20 }}>
          Most platforms throw &ldquo;verified&rdquo; around without backing it up. Here&apos;s what we check
          on every crew, by hand.
        </p>
      </div>

      {/* 4 verification cards */}
      <div className={s.verifiedGrid} style={{ marginBottom: 48 }}>
        <div className={s.verifiedCard}>
          <span className={s.vcTag}>INSURANCE</span>
          <p>Certificate of insurance uploaded — then we contact the carrier to confirm the policy is active and not a ghost policy.</p>
        </div>
        <div className={s.verifiedCard}>
          <span className={s.vcTag}>LICENSE</span>
          <p>State contractor or business license cross-checked against the state registry. Expiry dates tracked.</p>
        </div>
        <div className={s.verifiedCard}>
          <span className={s.vcTag}>REFERENCES</span>
          <p>Two or more contractor references — each one called by our team. We ask about quality, completion, and how the last job actually went.</p>
        </div>
        <div className={s.verifiedCard}>
          <span className={s.vcTag}>CURRENCY</span>
          <p>Verifications expire. Insurance renewals, license expiry — when documents lapse, crews fall out of search until they renew.</p>
        </div>
      </div>

      {/* The anchor line */}
      <div className={s.verifiedFoot} style={{ marginBottom: 56 }}>
        No automated reference forms. No self-attestation.{" "}
        <strong>Every &ldquo;yes&rdquo; is a phone call.</strong>
      </div>

      {/* Process timeline */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          padding: "32px 28px",
          marginBottom: 56,
        }}
      >
        <h2 style={{ margin: "0 0 24px", fontSize: 22, fontFamily: "var(--font-montserrat)", fontWeight: 700 }}>
          The process, end to end
        </h2>
        <ol style={{ paddingLeft: 0, listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            { n: 1, t: "Crew submits profile", b: "Insurance, license, and 2+ references uploaded through the platform." },
            { n: 2, t: "Our team starts verification", b: "Within 1 business day. Documents reviewed. Carriers contacted. License registry checked." },
            { n: 3, t: "Every reference called", b: "Real phone calls, scripted but human. Notes documented in your file. No automated forms." },
            { n: 4, t: "Status flips to Verified", b: "Once everything checks out, the crew goes live in contractor search." },
            { n: 5, t: "Re-checked continuously", b: "Insurance renewals, license expiry — we track them. Lapsed docs pull a crew out of search until renewed." },
          ].map((step) => (
            <li key={step.n} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 16, alignItems: "start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--brand-yellow)",
                  color: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-montserrat)",
                  fontWeight: 800,
                  fontSize: 16,
                }}
                aria-hidden
              >
                {step.n}
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, fontFamily: "var(--font-montserrat)", fontWeight: 700 }}>{step.t}</h3>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>{step.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* CTA — pick your side */}
      <div
        style={{
          textAlign: "center",
          padding: "32px 24px",
          background: "linear-gradient(180deg, transparent, rgba(248,188,1,0.04) 50%, transparent)",
          borderTop: "1px solid var(--border-color)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.2em",
            color: "var(--brand-yellow)",
            marginBottom: 16,
          }}
        >
          READY TO START?
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className={`${s.btn} ${s.btnPrimary}`} href="/for-contractors">
            I&apos;m a Contractor <span className={s.btnArrow} aria-hidden>→</span>
          </Link>
          <Link className={`${s.btn} ${s.btnSecondary}`} href="/for-crews">
            I&apos;m a Sub Crew <span className={s.btnArrow} aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
