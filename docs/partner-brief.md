# SubConnects — How It Works

**A partner brief on the operating mechanics, the current state, and what comes next.**

---

## What we're building

SubConnects is the **verified workforce network for roofing**. It's the trust layer between commercial roofing contractors and labor-only crews — built on verification, accountability, and performance.

Not a marketplace. Not a job board. Not a staffing company.

## How it works, end to end

A commercial roofing contractor needs a verified crew in their region. They open SubConnects, filter by system (TPO, EPDM, BUR, modified bitumen, etc.), filter by service area, and see only crews we have personally verified — insurance, license, and references.

They send a structured inquiry. The crew responds. They message back and forth, agree to work together, and either side clicks **Start Engagement**. The other side confirms. The job runs in the real world. When it's done, either side marks it complete. The other confirms.

Then both sides leave reviews. **Both directions are public.** Contractors rate crews on quality, punctuality, and communication. Crews rate contractors on payment behavior, fair treatment, and scope clarity. This two-way accountability is the part nobody else in roofing labor offers — and it's the thing that makes the platform impossible to replicate retroactively.

Over hundreds and then thousands of completed engagements, this becomes a **performance graph**: production rates by system, callback rates, payment timeliness, safety patterns. That dataset is the long-term moat.

## Who pays whom

- **Contractors pay SubConnects $299/month** for verified-crew access. Unlimited search and outreach. Concierge onboarding.
- **Crews are free.** They get a verified profile, contractor inquiries, and a reputation that compounds over time.
- **The work itself is paid contractor → crew off-platform** at launch. We don't touch the job money yet.
- **In year two, SubConnects Pay launches** — contractor pays through the platform, we take a small percentage, funds route to the crew via ACH in 1-3 days. That's the second revenue line, and only after the first one is proven.

## How we accept money

Direct ACH via a processor called **Dwolla**. Contractor links their business bank account, $299 debits monthly, funds settle to our business account in 1-3 days. We deliberately avoided card processors and Stripe-style platforms — past experience showed they impose reserves and extended holds on construction-adjacent merchants that punish cash flow. With Dwolla, no holds, clean monthly cash, predictable economics.

No cards at signup. Forces a verified business bank account, which also doubles as a quality filter on serious buyers.

## Verification is the product

This is what separates SubConnects from Labor Central and the rest of the noise:

- Every crew uploads insurance documentation, a license (or business registration), and provides 2+ contractor references.
- Our team verifies every document and **calls every reference**. No automated reference forms. No self-attestation that passes for verified.
- Only verified crews appear in search. Crews that let their insurance lapse fall out of search until they renew.
- Over time, the verification stack deepens — system-specific skill badges, tiered certifications (Bronze, Silver, Gold, Platinum). The schema is already built to accept those layers without a rewrite.

## What's deliberately out of scope at launch

This list is as important as what we are building:

- No mobile app (web-responsive only)
- No embedded payments yet
- No AI matching
- No second metro until the first one works
- No second trade until roofing is dominant in the launch metro
- No sponsored placement
- No tier credentials yet

Discipline is the strategy. Procore didn't launch with Procore Pay. ServiceTitan didn't launch with embedded payments. Shopify didn't launch with Shopify Capital. The strongest platforms become ecosystems gradually — and the ones that try to do it all at once die.

## The roadmap

| Stage | When | What |
|---|---|---|
| **0** | Now → launch | Hand-recruit 50 verified crews + 15-20 contractors in one launch metro. Build the website. Concierge verification |
| **1** | Months 0-6 | Open to paying contractors at $299/mo. Target: 100 paying, 90%+ retention, 150+ verified crews |
| **2** | Months 6-12 | Tiered pricing, premium crew visibility, first skill-specific badges |
| **3** | Months 12-18 | Second metro. Prove the playbook replicates |
| **4** | Months 18-24 | SubConnects Pay launches — embedded ACH payments between contractor and crew |
| **5** | Year 2-5+ | Quick Pay financing, national rollout, adjacent trades |

Launch metro: **Dallas-Fort Worth.** Deepest crew labor pool, year-round work, biggest commercial market of our candidates. Atlanta and Phoenix queue up as metros #2 and #3 in Stage 3.

## Where we are today

- Strategic vision, financial plan, and brand guidelines locked
- Database schema designed — 18 tables, supports profiles, search, messaging, verification, engagement, reviews, billing, disputes, notifications, audit log
- Tech stack chosen and costed: ~$100-200/month all-in at Stage 1, plus payment processing fees
- Payment processor selected and integrated into the plan (Dwolla, ACH only)
- 11 open design questions resolved and documented
- Internal progress deck built and reviewed

## What's next, in order

1. **Lock down the foundation.** Set up the business bank account (Mercury or Relay), domain, hosting, database, payment processor sandbox, email vendor, and code repo.
2. **Scaffold the application.** One codebase, three surfaces: the marketing site, the contractor/crew app, and the admin verification dashboard.
3. **Build the landing page first.** Brand-correct waitlist capture for both contractors and crews. Starts collecting interest while we build the rest.
4. **Build the onboarding and verification flows.** This is where the manual concierge work meets the software — admin verifies, crew goes live in search.
5. **Soft launch to the chosen metro** with the hand-recruited cohort.

## The bottom line

We're building the credential, the platform, and the data layer for a market that has been running on whisper networks and parking-lot deals for decades. The window is open because nobody else has committed to the verified-labor lane in commercial roofing — Labor Central went free in 2025 (signaling weak willingness to pay for shallow verification); manufacturer programs certify contractors, not crews; the project-management platforms aren't built for labor-only matching.

We have an unfair distribution advantage through Executive Roof Coach. We have the operating discipline to launch lean. We have the brand discipline to mean what we say when we say "verified."

The plan is to win one metro, prove the model, and earn the right to expand. Not the other way around.

---

**VERIFIED · TRUSTED · PERFORMANCE-DRIVEN**

*SubConnects · subconnects.com*
