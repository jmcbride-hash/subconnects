# SubConnects

The verified workforce network for roofing.

> Not a marketplace. Not a job board. Not a staffing company.

---

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** Supabase Postgres + Drizzle ORM
- **Auth:** Supabase Auth (SSR pattern)
- **Payments:** Dwolla (ACH only)
- **Storage:** AWS S3
- **Email:** Resend
- **Geocoding:** Mapbox
- **Hosting:** Vercel
- **Observability:** Sentry + PostHog

Full rationale in [docs/stack.md](docs/stack.md).

## Repository layout

```
app/                          Next.js App Router routes
  (marketing)/                Marketing site (landing page)
  (app)/                      Authenticated app (contractor + sub)
    contractor/
    sub/
  admin/                      Internal admin tooling (verification queue, disputes)
  api/                        Route handlers (health, webhooks)
  layout.tsx, globals.css     Root layout, brand tokens
components/                   Shared UI components (TBD)
db/
  schema.ts                   Drizzle schema (mirrors docs/data-model.md v0.3)
  index.ts                    Drizzle client
  migrations/                 Auto-generated SQL migrations (drizzle-kit)
lib/
  supabase/                   Server, browser, and middleware clients
docs/                         Living documents (data model, flows, decisions, brand)
web/                          Standalone HTML landing (legacy, kept as a preview)
middleware.ts                 Refreshes the auth session on every request
drizzle.config.ts             Drizzle Kit config
tailwind.config.ts            Brand colors + font tokens
.env.example                  Every env var the app needs
```

## Getting started

### Prerequisites

- Node.js 18.18+ (we test on 20+)
- npm 10+
- A Supabase project (free tier is fine for Stage 0)
- A business bank account ready for Dwolla settlement (Stage 1; not required for local dev)

### First-time setup

```bash
# Install dependencies
npm install

# Copy env template and fill in real values
cp .env.example .env.local
# Edit .env.local with your Supabase URL, anon key, DATABASE_URL, etc.
```

### Local development

```bash
# Start the dev server (Turbopack)
npm run dev
# → http://localhost:3000

# Type-check
npm run typecheck

# Lint
npm run lint
```

### File uploads (once AWS S3 is provisioned)

We use a private S3 bucket. Browsers PUT directly to S3 via presigned URLs — files never proxy through our Next.js server.

```bash
# AWS bucket setup (one-time, in the AWS Console or CLI):
#   1. Create a private bucket: subconnects-uploads (or whatever you set in AWS_S3_BUCKET)
#   2. Block all public access (default; verify)
#   3. Create an IAM user "subconnects-app" with this policy (scoped to the bucket):
#      {
#        "Version": "2012-10-17",
#        "Statement": [{
#          "Effect": "Allow",
#          "Action": ["s3:PutObject", "s3:GetObject"],
#          "Resource": "arn:aws:s3:::subconnects-uploads/*"
#        }]
#      }
#   4. Configure CORS on the bucket so the browser can PUT from our app:
#      [{
#        "AllowedHeaders": ["*"],
#        "AllowedMethods": ["PUT"],
#        "AllowedOrigins": ["http://localhost:3000", "https://subconnects.com"],
#        "ExposeHeaders": []
#      }]
#   5. Drop the IAM user's access key + secret into .env.local
```

Upload flow at runtime:
1. Browser → POST `/api/uploads/presign` with file metadata
2. Server validates ownership + file constraints, returns a 5-min presigned PUT URL
3. Browser PUTs the file directly to S3
4. Browser → POST `/api/uploads/attach` to save the resulting key on the verification row
5. Admin views via 10-min presigned GET URLs (signed at render time)

### Database (once Supabase is provisioned)

```bash
# Generate a new migration after editing db/schema.ts
npm run db:generate

# Apply migrations to the database
npm run db:migrate

# Or push the schema directly (dev convenience; skips the migration files)
npm run db:push

# Open Drizzle Studio to browse the DB
npm run db:studio
```

### Build

```bash
npm run build
npm run start
```

## Environment variables

See `.env.example`. The required-for-dev set:

- `DATABASE_URL` — Supabase Postgres pooled connection string (port 6543)
- `DIRECT_URL` — Supabase Postgres direct connection (port 5432) — used by Drizzle for migrations
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase auth (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server-only; secret)

For production / once we wire each service:

- `DWOLLA_*` — ACH billing (Stage 1)
- `AWS_*` — S3 file uploads (verification docs, message attachments)
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — transactional email
- `MAPBOX_*` — geocoding + service-area maps
- `SENTRY_DSN`, `POSTHOG_*` — observability

The app degrades gracefully when these are unset during local development — Supabase Auth simply skips refreshing, DB queries fail with a clear error, etc.

## What this codebase is NOT yet

- Auth flows (sign-up / sign-in pages) — clients are wired, pages are stubs
- Onboarding flows for contractors + crews
- Admin verification queue UI
- Search, inquiries, messaging, engagements, reviews — schema exists, UI doesn't
- Dwolla billing integration — schema exists, client doesn't
- Tally form embeds on the landing page — placeholders for now
- Email templates — schema exists, templates don't

Each of these is on the roadmap. See [docs/](docs/) for the full plan.

## Living documents

| Document | What it covers |
|---|---|
| [docs/data-model.md](docs/data-model.md) | Schema reference (v0.3) — every table, every column, every reason |
| [docs/flows.md](docs/flows.md) | Core user flows — onboarding, marketplace loop, admin, billing |
| [docs/stack.md](docs/stack.md) | Tech stack choices with rationale |
| [docs/decisions.md](docs/decisions.md) | All resolved design decisions (D1-D12 so far) |
| [docs/verification-playbook.md](docs/verification-playbook.md) | The manual verification ops playbook |
| [docs/landing-copy.md](docs/landing-copy.md) | The marketing copy (v0.2 locked) |
| [docs/partner-brief.md](docs/partner-brief.md) | Shareable summary for stakeholders |

When you change the schema, update `docs/data-model.md` in the same commit. When you make a design call, record it in `docs/decisions.md`. The docs and the code move together.

## Brand

Direct. Professional. Trust-driven. No buzzwords, no overselling.

- **Colors:** navy `#0A1530`, yellow `#F8BC01`, white text
- **Type:** Montserrat (headlines), Inter (body), JetBrains Mono (small caps / metadata)
- **Pillars:** Verified · Trusted · Performance-driven

## License

Proprietary — SubConnects. All rights reserved.
