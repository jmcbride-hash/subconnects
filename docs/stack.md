# SubConnects — Tech Stack Recommendation

**Status:** Draft v0.1 · For Stages 0-1 (months -3 to 6)

This stack is sized for the operating principles: lean, fast to ship, narrow before broad, easy to operate at low volume. Every choice is reversible. Nothing here locks us in for Stage 4 (payments) or Stage 5 (financing); those layers slot in cleanly when we earn the right.

## The recommendation

| Layer | Choice | Why |
|---|---|---|
| **Framework** | **Next.js 15 (App Router) + TypeScript** | One codebase for the marketing site, the contractor/sub app, and the admin tool. Server actions handle forms cleanly. Largest ecosystem for hiring later |
| **Hosting** | **Vercel** | Zero-config deploys, preview URLs per branch, built-in cron for our daily jobs. Free tier covers Stage 0; we'll pay ~$20/seat at Stage 1 |
| **Database** | **Supabase Postgres** | Managed Postgres, single dashboard for DB + Auth. Free tier covers Stage 0; Pro ~$25/mo at Stage 1 |
| **ORM** | **Drizzle** | TypeScript-native, SQL-shaped (we'll write joins and haversine queries), Edge-runtime compatible. Easier to reason about than Prisma at this scale |
| **Auth** | **Supabase Auth** | Bundled with the DB. JWT sessions, magic-link + password + OAuth all available. Our `users` table mirrors `auth.users` via trigger or shared id |
| **Payments** | **Dwolla (ACH only)** | Pure-ACH processor. No card-network reserves, no Stripe-style holds. Funds settle to our bank in 1-3 days. Our scheduler drives recurring charges; webhooks update state. No card fallback — ACH-only at signup |
| **File storage** | **AWS S3** | Industry standard. COI/license uploads + message attachments. Tightly-scoped IAM roles, signed URLs for client uploads |
| **Email** | **Resend** | Best developer experience for transactional email. Free tier covers Stage 0 |
| **Geocoding** | **Mapbox** | Address → lat/lng during sub onboarding and inquiry creation. Generous free tier |
| **Background jobs** | **Vercel Cron** at Stage 0 → **Inngest** at Stage 1 | Daily cron is enough for now (renewal reminders, verification expiry, 30-day auto-complete). Move to Inngest if we need event-driven flows later |
| **Error monitoring** | **Sentry** | Catches errors in production before users report them. Free tier sufficient |
| **Product analytics** | **PostHog** | Funnels, retention, session replay. Free tier covers Stage 0/1 |
| **UI components** | **Tailwind CSS + shadcn/ui** | Brand-able to navy + yellow, copy-paste components (no library lock-in), Montserrat/Inter wire up cleanly |
| **Forms / validation** | **react-hook-form + Zod** | Standard pairing with App Router server actions |
| **Maps (sub service area)** | **Mapbox GL JS** | Same vendor as geocoding. Render service radius on a map |

## Why this shape

**One repo, one framework.** Next.js gives us marketing pages, the contractor app, the sub app, and the admin dashboard in one codebase. No microservices, no separate marketing site, no separate admin app. At Stage 0/1 volume this is operationally simpler than any split architecture.

**Postgres because the schema is relational.** Our data model is companies, users, verifications, engagements, reviews — classic relational shape with foreign keys, joins, and constraints. A document store (Mongo, DynamoDB) would fight us. Neon gives us Postgres without ops overhead.

**Drizzle because we'll write real queries.** Search filters subs by system intersection + haversine distance + verification status. That's a join across `sub_systems`, `sub_profiles`, `companies`. Drizzle lets us write that SQL-fluently. Prisma's query DSL hides too much for this kind of work.

**Auth.js because Stripe is the only thing we should outsource at Stage 0.** Auth, file storage, email — all of these have free or near-free tiers we can self-operate. Outsourcing every layer to a SaaS at this stage costs more than it saves.

**No payments rails beyond Stripe Billing.** Stripe Billing = monthly subscription charges. Stripe Connect / Treasury (for SubConnects Pay) doesn't come into the stack until Stage 4. We do not need it now. Adding it now would violate "premature fintech destroys marketplaces."

**No mobile app.** Web-responsive only at Stages 0-1, per the financial plan.

## Estimated monthly cost (Stage 0 → Stage 1)

| Item | Stage 0 (months -3 to 0) | Stage 1 (months 0-6, 100 contractors) |
|---|---|---|
| Vercel | $0 (hobby) | $20-40 (Pro, single seat) |
| Supabase (DB + Auth) | $0 (free) | $25 (Pro tier) |
| Dwolla | $0 | ~$300/mo platform + ~$50/mo transfer fees on $30K MRR (~100 ACH/mo at $0.50) |
| AWS S3 | $0-1 | ~$10-20 (storage + transfer at 100 contractors) |
| Resend | $0 (free tier) | $20 (Pro tier for higher volume) |
| Mapbox | $0 | $0-50 (depending on map loads) |
| Sentry | $0 | $26 (Team) |
| PostHog | $0 | $0 (free tier still fine) |
| Domain (subconnects.com) | ~$15/yr | ~$15/yr |
| **Total (excl. Stripe fees)** | **~$0/mo** | **~$100-200/mo** |

The dominant cost at Stage 1 is Stripe processing fees, which are a function of revenue. Everything else is sub-$200/mo.

## What this stack defers cleanly

- **Mobile app** — slot in React Native (sharing types via the monorepo) at Stage 2/3 without rewriting the backend.
- **Background jobs at volume** — Inngest plugs into the same codebase.
- **SubConnects Pay (Stage 4)** — Stripe Connect or a dedicated payments vendor; new tables (we have the seam in the engagement model), no rewrite of the marketplace.
- **PostGIS / dedicated search** — when sub count crosses a few thousand and haversine joins slow down. Plain Postgres holds the line for now.
- **Multi-trade** — schema change + UI surface; framework holds.
- **Second metro** — config + seeded metro row; framework holds.

## Decisions locked

- **Database:** Supabase Postgres
- **Auth:** Supabase Auth
- **ORM:** Drizzle (queries Supabase Postgres directly using the connection string; auth sessions handled by Supabase)
- **File storage:** AWS S3
- **Payments (Stage 1):** Dwolla — ACH only. No cards.
- **Payments (Stage 4, future):** Default to Dwolla unless we outgrow it. Modern Treasury is the upgrade path

**Note on Supabase + Drizzle:** we use Supabase Auth for sessions but Drizzle for all data queries. Our application `users` table will share its primary key with `auth.users` (or be linked via trigger). This gives us Supabase's auth UX without forcing our schema into Supabase Storage / Realtime / Edge Functions.

**Note on Dwolla:** we do NOT use Stripe. Past experience with Stripe shows reserve / extended-hold behavior on construction-adjacent categories that hurts cash flow. Dwolla settles to our business bank in 1-3 days without those dynamics. Trade-off: we manage the recurring-charge scheduler ourselves (Dwolla has no native "subscriptions" object). Worth it for cash flow control.

## Accounts/keys we'll need to set up

Before any code:
- subconnects.com domain (assume owned — confirm)
- Business bank account (Mercury / Relay / Brex) for Dwolla settlement
- Vercel team
- Supabase project
- Dwolla account (Sandbox first, then Production after KYC of the platform business)
- AWS account + S3 bucket + IAM user (scoped to the bucket only)
- Resend account + domain verification (DKIM/SPF on subconnects.com)
- Mapbox account
- Sentry org
- PostHog project
- GitHub repo

Each is ~5 minutes to create. Most are free at Stage 0.

## What this stack is NOT

- Not microservices (single Next.js app)
- Not a separate marketing site (same Next.js app, marketing routes are static)
- Not a separate admin app (same Next.js app, `/admin` routes gated to platform admins)
- Not multi-tenant in the SaaS sense (we have one platform, many companies — that's not multi-tenant infrastructure)
- Not built on a low-code platform (Bubble, Retool) — those struggle past MVP and we have specific UX needs from the brand guide
