import s from "./landing.module.css";

export const metadata = {
  title: "SubConnects — The Verified Workforce Network for Roofing",
  description:
    "SubConnects is the verified workforce network for commercial roofing. We verify every crew's insurance, license, and references — by hand, by phone.",
};

export default function MarketingPage() {
  return (
    <>
      {/* Nav */}
      <nav className={s.nav} aria-label="Primary">
        <div className={`${s.container} ${s.navInner}`}>
          <a href="#top" className={s.logo}>
            <span className={s.logoMark} aria-hidden>SC</span>
            <span>SUB&nbsp;CONNECTS</span>
          </a>
          <div className={s.navLinks}>
            <a className={s.navLink} href="#for-contractors">For Contractors</a>
            <a className={s.navLink} href="#for-crews">For Crews</a>
            <a className={s.navLink} href="#how-verified">Verification</a>
            <a className={s.navLink} href="#faq">FAQ</a>
            <a className={s.navCta} href="#waitlist">Join Waitlist <span aria-hidden>→</span></a>
          </div>
        </div>
      </nav>

      <main id="main">
        {/* Hero */}
        <section className={s.hero} id="top">
          <div className={`${s.container} ${s.heroInner}`}>
            <span className={s.heroEyebrow}>
              <span className={s.heroDot} />
              THE VERIFIED WORKFORCE NETWORK FOR ROOFING
            </span>
            <h1 className={s.heroTitle}>
              Find roofing crews you can <span className={s.accent}>actually trust</span>.
            </h1>
            <p className={s.heroSub}>
              SubConnects is the verified workforce network for commercial roofing. We verify
              every crew&apos;s insurance, license, and references — by hand, by phone — so
              contractors stop hiring blind and good crews stop staying invisible.
            </p>
            <p className={s.heroMeta}>
              NOW BUILDING&nbsp;&nbsp;·&nbsp;&nbsp;FIRST METRO: <strong>DALLAS-FORT WORTH</strong>
            </p>
            <div className={s.heroCtas}>
              <a className={`${s.btn} ${s.btnPrimary}`} href="#contractor-form">
                I&apos;m a Contractor <span className={s.btnArrow} aria-hidden>→</span>
              </a>
              <a className={`${s.btn} ${s.btnSecondary}`} href="#crew-form">
                I&apos;m a Sub Crew <span className={s.btnArrow} aria-hidden>→</span>
              </a>
            </div>
            <div className={s.trustStrip}>
              <span>VERIFIED</span><span className={s.trustSep}>·</span>
              <span>TRUSTED</span><span className={s.trustSep}>·</span>
              <span>PERFORMANCE-DRIVEN</span>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className={`${s.section} ${s.divider}`} id="the-problem">
          <div className={s.container}>
            <div className={s.sectionHead}>
              <h4>THE PROBLEM</h4>
              <h2>Roofing labor is the most broken hiring market in construction.</h2>
            </div>
            <div className={s.problemGrid}>
              {[
                "Crews get found through Facebook groups, parking-lot conversations, and whisper networks.",
                "There's no shared standard for what \"qualified\" means.",
                "Workers' comp ghost policies are common and hard to detect.",
                "Manufacturer certifications go to contractors, not crews — leaving most of the working labor force without a portable credential.",
                "$200K mistakes are routine. Good crews stay invisible. Bad crews keep working.",
                "The industry runs on trust that doesn't scale.",
              ].map((t, i) => (
                <div key={i} className={s.problemCard}>
                  <span className={s.problemX}>✕</span>
                  <p>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className={`${s.section} ${s.divider}`} id="positioning">
          <div className={s.container}>
            <div className={`${s.sectionHead} ${s.sectionHeadCenter}`}>
              <h4>WHAT SUBCONNECTS IS</h4>
            </div>
            <p className={s.positioningLine}>
              <span className={`${s.strike} nowrap`}>Not a marketplace.</span>&nbsp;
              <span className={`${s.strike} nowrap`}>Not a job board.</span>&nbsp;
              <span className={`${s.strike} nowrap`}>Not a staffing company.</span>
              <br />
              The <span style={{ color: "var(--brand-yellow)" }} className="nowrap">trust infrastructure</span> for roofing labor.
            </p>
            <div className={s.pillarGrid}>
              {[
                { icon: "✓", title: "Verification", body: "Every crew, manually verified. Insurance, license, and references confirmed by phone." },
                { icon: "↗", title: "Performance", body: "Real job outcomes logged on the platform. Production rates, callbacks, completion — over time." },
                { icon: "⇆", title: "Accountability", body: "Two-way public reviews. Crews rate contractors on payment behavior. Contractors rate crews on quality." },
                { icon: "●", title: "Trust", body: "Standards that hold. Reviewed continuously, not once. The credential travels with the crew." },
              ].map((p) => (
                <div key={p.title} className={s.pillar}>
                  <div className={s.pillarIcon} aria-hidden>{p.icon}</div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Contractors */}
        <section className={`${s.section} ${s.divider}`} id="for-contractors">
          <div className={`${s.container} ${s.side}`}>
            <div className={s.sideAside}>
              <h4 style={{ color: "var(--brand-yellow)", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>FOR CONTRACTORS</h4>
              <h2>Hire roofing crews with the noise filtered out.</h2>
              <p>Only verified crews. Structured inquiries. Two-way accountability after every engagement.</p>
              <div className={s.pricingCard}>
                <div className={s.pricingLabel}>CONTRACTOR PRICING</div>
                <div className={s.pricingValue}>$299<span className={s.per}> / month</span></div>
                <div className={s.pricingMeta}>Full directory access · unlimited outreach · concierge onboarding · ACH only</div>
                <div className={s.pricingDisclaimer}>Pricing subject to change at launch.</div>
              </div>
              <a className={`${s.btn} ${s.btnPrimary} ${s.sideCta}`} href="#contractor-form">
                Join the Contractor Waitlist <span className={s.btnArrow} aria-hidden>→</span>
              </a>
            </div>
            <div className={s.steps}>
              {[
                { n: 1, t: "Search verified crews in your region.", b: "Filter by system (TPO, EPDM, BUR, modified bitumen, slate, metal, more), by service area, by verification status. See only crews we've personally verified." },
                { n: 2, t: "Inquire directly.", b: "Send a structured project inquiry. The crew sees the scope, the metro, the system, the budget band. They respond or they don't — no auctions, no spam." },
                { n: 3, t: "Engage with confidence.", b: "When you both agree, the engagement starts. Both sides confirm. Work happens off-platform. Both sides confirm completion." },
                { n: 4, t: "Review and be reviewed.", b: "Public reviews in both directions — quality, punctuality, communication; and payment behavior, fair treatment, scope clarity. Trust gets earned, not asserted." },
              ].map((st) => (
                <div key={st.n} className={s.step}>
                  <div className={s.stepNum}>{st.n}</div>
                  <div>
                    <h3>{st.t}</h3>
                    <p>{st.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Crews */}
        <section className={`${s.section} ${s.divider}`} id="for-crews">
          <div className={`${s.container} ${s.side}`}>
            <div className={s.sideAside}>
              <h4 style={{ color: "var(--brand-yellow)", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>FOR SUB CREWS</h4>
              <h2>Get verified. Get found. Get paid what your work is worth.</h2>
              <p>A verified profile that travels with you. Contractor inquiries built on trust, not auctions.</p>
              <div className={s.pricingCard}>
                <div className={s.pricingLabel}>CREW PRICING</div>
                <div className={s.pricingValue}>FREE</div>
                <div className={s.pricingMeta}>Verified profile · contractor inquiries · reputation building</div>
                <div className={s.pricingDisclaimer}>Premium tiers and skill-badge assessments will be paid options later — we&apos;ll tell you before anything changes.</div>
              </div>
              <a className={`${s.btn} ${s.btnPrimary} ${s.sideCta}`} href="#crew-form">
                Join the Crew Waitlist <span className={s.btnArrow} aria-hidden>→</span>
              </a>
            </div>
            <div className={s.steps}>
              {[
                { n: 1, t: "Build a verified profile.", b: "Upload your insurance, license, and references. We call every reference. When you pass, your profile goes live — and only verified crews appear in search." },
                { n: 2, t: "Get inquiries from real contractors.", b: "Verified commercial roofing contractors find you by system, location, and reputation. No auction bidding. No race to the bottom." },
                { n: 3, t: "Work, complete, get reviewed.", b: "Both sides leave reviews after every engagement. Your reputation compounds. Vet the contractor before you bid — payment behavior is in the open." },
                { n: 4, t: "Build a credential that travels with you.", b: "Today: verified status. Coming next: system-specific skill badges (TPO, EPDM, BUR, more) and tiered certifications — Bronze, Silver, Gold, Platinum. The credential belongs to your crew." },
              ].map((st) => (
                <div key={st.n} className={s.step}>
                  <div className={s.stepNum}>{st.n}</div>
                  <div>
                    <h3>{st.t}</h3>
                    <p>{st.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What "verified" means */}
        <section className={`${s.section} ${s.divider}`} id="how-verified">
          <div className={s.container}>
            <div className={`${s.sectionHead} ${s.sectionHeadCenter}`}>
              <h4>WHAT &ldquo;VERIFIED&rdquo; ACTUALLY MEANS</h4>
              <h2>We hate the word as much as you do. Here&apos;s what we actually do.</h2>
              <p>Most platforms throw &ldquo;verified&rdquo; around without backing it up. We check every claim, by hand, by phone.</p>
            </div>
            <div className={s.verifiedGrid}>
              {[
                { tag: "INSURANCE", body: "Certificate of insurance uploaded — then we contact the carrier to confirm the policy is active and not a ghost policy." },
                { tag: "LICENSE", body: "State contractor or business license, cross-checked against the state registry. Expiry dates tracked." },
                { tag: "REFERENCES", body: "Two or more contractor references — each one called by our team. We ask about quality, completion, and how the last job actually went." },
                { tag: "CURRENCY", body: "Verifications expire. Insurance renewals, license expiry — when documents lapse, crews fall out of search until they renew." },
              ].map((v) => (
                <div key={v.tag} className={s.verifiedCard}>
                  <span className={s.vcTag}>{v.tag}</span>
                  <p>{v.body}</p>
                </div>
              ))}
            </div>
            <div className={s.verifiedFoot}>
              No automated reference forms. No self-attestation. <strong>Every &ldquo;yes&rdquo; is a phone call.</strong>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className={`${s.section} ${s.divider}`} id="roadmap">
          <div className={s.container}>
            <div className={`${s.sectionHead} ${s.sectionHeadCenter}`}>
              <h4>THE ROADMAP</h4>
              <h2>Lean now. Earn the right to expand.</h2>
              <p>Procore didn&apos;t launch with embedded payments. ServiceTitan didn&apos;t launch with payment infrastructure. The strongest platforms become ecosystems gradually.</p>
            </div>
            <div className={s.roadmap}>
              <div className={`${s.roadmapCard} ${s.roadmapCardNow}`}>
                <span className={s.nowBadge}>NOW</span>
                <div className={s.roadmapStage}>STAGE 0 → 1</div>
                <h3>Hand-recruit + soft launch</h3>
                <div className={s.when}>Today through month 6</div>
                <p>First cohort of 50 verified crews + 15-20 paying contractors in Dallas-Fort Worth. Concierge verification, manual matching.</p>
              </div>
              <div className={s.roadmapCard}>
                <div className={s.roadmapStage}>STAGE 2</div>
                <h3>Density &amp; tiering</h3>
                <div className={s.when}>Months 6 to 12</div>
                <p>Tiered pricing. Premium crew visibility. First skill-specific badges — TPO, EPDM, BUR, modified bitumen.</p>
              </div>
              <div className={s.roadmapCard}>
                <div className={s.roadmapStage}>STAGE 3 → 4</div>
                <h3>Second metro + SubConnects Pay</h3>
                <div className={s.when}>Year 1 to 2</div>
                <p>Atlanta or Phoenix next. ACH payment rails between contractor and crew — embedded, audited, fast.</p>
              </div>
              <div className={s.roadmapCard}>
                <div className={s.roadmapStage}>STAGE 5</div>
                <h3>Quick Pay + national</h3>
                <div className={s.when}>Year 2 to 5+</div>
                <p>Embedded financing. Multi-metro rollout. The verified workforce infrastructure layer for construction.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={`${s.section} ${s.divider}`} id="faq">
          <div className={s.container}>
            <div className={`${s.sectionHead} ${s.sectionHeadCenter}`}>
              <h4>FAQ</h4>
              <h2>What you&apos;re probably wondering.</h2>
            </div>
            <div className={s.faqList}>
              {[
                { q: "What does verification actually mean?", a: "Insurance certificate confirmed with the carrier. License confirmed with the state. Two or more references called by phone. Documented in your file. Re-checked when documents expire.", open: true },
                { q: "How is this different from Labor Central?", a: "Labor Central went free in 2025 — a signal that contractors weren't paying for shallow verification. SubConnects charges $299/month because the verification is deep, the platform is moderated, and the reputation data is real. Different product, different standard." },
                { q: "Who's behind SubConnects?", a: "A team with deep commercial roofing expertise and an existing community of contractors through Executive Roof Coach. We've spent years inside this industry. We know which crews actually deliver. We're building this because the gap is obvious to anyone who's tried to hire a crew." },
                { q: "When do you launch?", a: "Soft launch begins as soon as we've hand-recruited 50 verified crews and 15-20 paying contractors in Dallas-Fort Worth. Waitlist signups go first." },
                { q: "What does $299 a month get a contractor?", a: "Full directory access. Unlimited inquiries to verified crews. Concierge onboarding from our team. Verified status on your own profile. Access to crew performance data and review history." },
                { q: "What do crews pay?", a: "Nothing at the baseline tier. Verified profile, contractor inquiries, reputation building — all free. Premium visibility and skill assessments are paid options we'll introduce later, after the platform earns the right." },
                { q: "Where can I see SubConnects in action?", a: "Today, only on the waitlist. We'll invite waitlist members in cohorts as the platform comes online. Sign up below to be in the first wave." },
              ].map((f) => (
                <details key={f.q} className={s.faq} open={f.open}>
                  <summary>{f.q}</summary>
                  <div className={s.faqA}>{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / forms */}
        <section className={`${s.cta} ${s.section}`} id="waitlist">
          <div className={s.container}>
            <div className={s.ctaInner}>
              <h4 style={{ color: "var(--brand-yellow)", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>JOIN THE WAITLIST</h4>
              <h2>Verified. Trusted. <span className="nowrap">Performance-driven.</span></h2>
              <p style={{ color: "var(--text-secondary)", marginTop: 16 }}>
                The verified labor lane for commercial roofing is open — and we&apos;re first. Pick your side.
              </p>
            </div>
            <div className={s.formGrid}>
              <div className={s.formCard} id="contractor-form">
                <h3>Contractor Waitlist</h3>
                <p>For commercial roofing contractors hiring labor-only crews.</p>
                <div className={s.formPlaceholder}>
                  <strong>TALLY FORM EMBED — CONTRACTOR</strong>
                  Replace this block with the Tally embed snippet.<br />
                  Fields: company name · work email · phone (opt) · metro · jobs/year · biggest sourcing pain (opt)
                </div>
              </div>
              <div className={s.formCard} id="crew-form">
                <h3>Crew Waitlist</h3>
                <p>For labor-only roofing crews looking for verified contractor work.</p>
                <div className={s.formPlaceholder}>
                  <strong>TALLY FORM EMBED — CREW</strong>
                  Replace this block with the Tally embed snippet.<br />
                  Fields: crew name · foreman name · work email · phone (opt) · base city · systems · years · crew size
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerInner}>
            <a href="#top" className={s.logo}>
              <span className={s.logoMark} aria-hidden>SC</span>
              <span>SUB&nbsp;CONNECTS</span>
            </a>
            <div className={s.footerLinks}>
              <a href="#for-contractors">Contractors</a>
              <a href="#for-crews">Crews</a>
              <a href="#how-verified">Verification</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
          <div className={s.footerTag}>VERIFIED · TRUSTED · PERFORMANCE-DRIVEN</div>
          <div className={s.footerCopy}>
            © 2026 SubConnects. All rights reserved. · subconnects.com<br />
            Privacy Policy · Terms of Service <em>(in draft)</em>
          </div>
        </div>
      </footer>
    </>
  );
}
