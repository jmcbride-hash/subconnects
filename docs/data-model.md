# SubConnects — Data Model (Stage 0/1)

**Status:** Draft v0.2 · Scope: Stage 0 (Pre-launch foundation) and Stage 1 (Soft launch, months 0-6)

This is the schema for the first six-plus months. It supports the Stage 0 MVP — profiles, search, messaging, admin verification — and the Stage 1 additions — billing, reviews, reputation, disputes. Everything past Stage 1 (payments, tier credentials, second metro, multi-trade) is explicitly out of scope, but the schema leaves clean seams for those layers.

## Changelog

- **v0.3** — switched payment processor from Stripe to Dwolla per [decisions.md](decisions.md) D12. `subscriptions` reshaped (Dwolla customer + funding source, no Stripe fields). Added `subscription_charges` for transfer-level audit. No native subscription object in Dwolla — our scheduler drives recurring charges.
- **v0.2** — applied [decisions.md](decisions.md): added `references`, `disputes`, `notifications` tables; `deleted_at` soft-delete on trust-bearing rows; `users.last_active_company_id`; `engagements.auto_completion_eligible_at`. Closed five open decisions.
- **v0.1** — initial draft.

## Design principles

1. **Companies are the unit.** Both supply (subs / crews) and demand (contractors) are companies. People are users who belong to a company.
2. **Verification is one extensible table.** Insurance, license, and references today; tier credentials and system badges later — same shape.
3. **Reviews require engagement completion.** No review without a contractor-sub engagement that both sides have marked complete.
4. **Trust requires receipts.** State changes on verification and profile status hit an `audit_log`. Hard-deletes never happen on trust-bearing rows.
5. **Roofing-shaped, not generalized.** No premature multi-trade abstraction. When we expand, we migrate.

## Entity overview

| Entity | Role | Stage |
|---|---|---|
| `users` | Auth identity | 0 |
| `companies` | Contractor or sub crew, shared shape | 0 |
| `contractor_profiles` | Contractor-specific fields | 0 |
| `sub_profiles` | Sub crew-specific fields (incl. service-area geo) | 0 |
| `memberships` | Joins users ↔ companies with roles | 0 |
| `metros` | Launch + future metros (seeded) | 0 |
| `roofing_systems` | TPO, EPDM, BUR, etc. (seeded taxonomy) | 0 |
| `sub_systems` | M:m — which systems a sub works | 0 |
| `verifications` | Insurance/license/reference now; credential seam later | 0 |
| `inquiries` | Contractor → sub outreach | 0 |
| `conversations` + `messages` | Threaded messaging on an inquiry | 0 |
| `engagements` | Tracked job from match to completion (gates reviews) | 1 |
| `reviews` | Bidirectional, public, post-completion | 1 |
| `subscriptions` | Contractor ACH billing via Dwolla ($299/mo) | 1 |
| `subscription_charges` | One row per Dwolla transfer attempt (audit + reconciliation) | 1 |
| `audit_log` | State-change log for trust-bearing rows | 0 |
| `references` | Structured reference contacts per sub (paired with a verifications row) | 0 |
| `disputes` | Dispute workflow on engagements | 1 |
| `notifications` | In-app + email notification log | 0 |

## Detailed tables

> **Soft-delete convention (v0.2):** every trust-bearing table — `messages`, `inquiries`, `engagements`, `reviews`, `verifications`, `memberships` — includes a `deleted_at timestamptz` column (nullable). Hard deletes happen only by admin action and are recorded in `audit_log`. Queries filter `WHERE deleted_at IS NULL` by default; admin queues can opt out.

### users

```
users
  id                       uuid pk            -- shares id with auth.users (Supabase Auth)
  email                    citext unique
  full_name                text
  phone                    text
  email_verified_at        timestamptz
  phone_verified_at        timestamptz
  is_platform_admin        boolean default false
  status                   enum: ACTIVE | SUSPENDED | DELETED
  last_active_company_id   uuid fk → companies (nullable)
  created_at, updated_at
```

Authentication (password hash, magic-link tokens, OAuth) lives in `auth.users` managed by Supabase Auth. Our public `users` row shares the same primary key and stores the application-level profile.

### companies

```
companies
  id              uuid pk
  kind            enum: CONTRACTOR | SUB
  legal_name      text
  display_name    text
  website         text
  primary_phone   text
  status          enum: DRAFT | PENDING_VERIFICATION | VERIFIED | SUSPENDED
  created_at, updated_at
```

Shared shape. Type-specific fields live in `*_profiles` tables below.

### contractor_profiles  (1:1 with companies where kind = CONTRACTOR)

```
contractor_profiles
  company_id          uuid pk, fk → companies
  license_number      text
  license_state       text
  hq_street, hq_city, hq_state, hq_postal_code
  hq_lat, hq_lng      numeric          -- for "near me" filters later
  year_founded        int
  employee_count_band enum: 1-10 | 11-50 | 51-200 | 201+
  about               text
```

### sub_profiles  (1:1 with companies where kind = SUB)

```
sub_profiles
  company_id              uuid pk, fk → companies
  foreman_name            text
  crew_size               int                -- self-reported
  base_street, base_city, base_state, base_postal_code
  base_lat, base_lng      numeric            -- service-area center
  service_radius_miles    int                -- e.g., 75
  years_in_trade          int
  about                   text
  willing_to_travel       boolean default false   -- overnight jobs
```

**Service-area model:** base point + radius. At Stage 0 volume (≤500 subs in one metro), haversine in SQL is fine — no PostGIS yet.

### memberships  (users ↔ companies)

```
memberships
  id          uuid pk
  user_id     uuid fk → users
  company_id  uuid fk → companies
  role        enum: OWNER | ADMIN | MEMBER
  invited_by  uuid fk → users (nullable)
  invited_at  timestamptz
  accepted_at timestamptz
  status      enum: INVITED | ACTIVE | REVOKED
  unique(user_id, company_id)
```

A user can belong to multiple companies (rare, but real — e.g., a sole-proprietor estimator who also runs a small crew). Roles are flat at Stage 0/1; granular roles (PM, estimator) defer to Stage 2+.

### metros

```
metros
  id          uuid pk
  name        text         -- "Dallas-Fort Worth"
  state       text
  slug        text unique
  centroid_lat, centroid_lng numeric
  active      boolean
```

Seeded. Stage 0 = one active row. Used for marketing/search filters; sub_profile service area is the source of truth for coverage.

### roofing_systems  (seeded taxonomy)

```
roofing_systems
  id     int pk
  slug   text unique     -- "tpo", "epdm", "bur", "mod-bit", "shingle", "metal-standing-seam", "slate", "tile", "coatings", "foam"
  name   text
  category enum: COMMERCIAL_FLAT | COMMERCIAL_STEEP | RESIDENTIAL | SPECIALTY
```

### sub_systems  (sub ↔ roofing_systems)

```
sub_systems
  company_id      uuid fk → companies (kind = SUB)
  system_id       int fk → roofing_systems
  years_experience int
  pk(company_id, system_id)
```

Stage 0/1: self-attested. Stage 2+: each row can be promoted to a verified badge via `verifications.kind = SYSTEM_BADGE` referencing this pair.

### verifications  (the credential seam)

```
verifications
  id                  uuid pk
  subject_company_id  uuid fk → companies
  kind                enum: INSURANCE | LICENSE | REFERENCE
                            -- future: SYSTEM_BADGE | TIER_ASSESSMENT
  status              enum: PENDING | VERIFIED | EXPIRED | REJECTED
  evidence_url        text                 -- uploaded doc, call notes
  metadata            jsonb                -- carrier, policy #, system_id, score, etc.
  verified_by_user_id uuid fk → users      -- admin who approved
  verified_at         timestamptz
  expires_at          timestamptz          -- insurance renewal, license expiry
  rejection_reason    text
  created_at, updated_at
```

A company's overall `verification_status` (denormalized on `companies.status` or computed) becomes `VERIFIED` when:
- 1+ `INSURANCE` row with `status = VERIFIED` and not expired
- 1+ `LICENSE` row with `status = VERIFIED` and not expired
- 2+ `REFERENCE` rows with `status = VERIFIED`

**Future extension (no rewrite):** add `SYSTEM_BADGE` and `TIER_ASSESSMENT` enum values + interpret `metadata.tier` (BRONZE/SILVER/GOLD/PLATINUM) and `metadata.system_id`.

### inquiries

```
inquiries
  id                  uuid pk
  contractor_company_id  uuid fk → companies
  sub_company_id      uuid fk → companies
  initiating_user_id  uuid fk → users
  subject             text       -- short title
  project_summary     text       -- what, where, when
  project_metro_id    uuid fk → metros (nullable)
  project_systems     int[]      -- references roofing_systems.id
  estimated_value_band enum: <25K | 25-75K | 75-250K | 250K-1M | 1M+   (nullable, optional)
  status              enum: SENT | VIEWED | RESPONDED | DECLINED | ARCHIVED
  created_at, updated_at
```

Stage 3 hook: placement fee attaches to the inquiry/engagement chain.

### conversations + messages

```
conversations
  id           uuid pk
  inquiry_id   uuid fk → inquiries   -- 1:1 for now
  created_at

messages
  id              uuid pk
  conversation_id uuid fk → conversations
  sender_user_id  uuid fk → users
  body            text
  attachments     jsonb     -- list of s3 keys, file names
  read_at         timestamptz
  created_at
```

### engagements  (Stage 1)

```
engagements
  id                  uuid pk
  inquiry_id          uuid fk → inquiries
  contractor_company_id uuid fk → companies
  sub_company_id      uuid fk → companies
  proposed_by_user_id uuid fk → users          -- who clicked Propose
  confirmed_by_user_id uuid fk → users         -- who clicked Confirm
  status              enum: PROPOSED | ACTIVE | COMPLETED | CANCELLED | DISPUTED
  agreed_systems      int[]                 -- roofing_systems.id
  job_site_city, job_site_state, job_site_metro_id
  started_at, completed_at
  contractor_marked_complete_at timestamptz
  sub_marked_complete_at        timestamptz
  auto_completion_eligible_at   timestamptz  -- set to first_marked_complete_at + 30d; cron scan target
  notes               text
  created_at, updated_at
  deleted_at          timestamptz
```

Either party can call **Propose** inside an active conversation. Status flips PROPOSED → ACTIVE when the counterparty calls **Confirm**. No engagement without mutual consent (per [D8](decisions.md#d8-engagement-creation-flow--confirmed)).

**Completion rule:** an engagement is `COMPLETED` only when both `contractor_marked_complete_at` AND `sub_marked_complete_at` are non-null. Either party can mark; status flips when both mark. Reviews unlock at this point.

Future hook (Stage 3): `placement_fee_status`, `placement_fee_amount` columns or a `placement_fees` side table — clean addition.

### reviews

```
reviews
  id                  uuid pk
  engagement_id       uuid fk → engagements  -- required; no orphan reviews
  reviewer_company_id uuid fk → companies
  reviewee_company_id uuid fk → companies
  reviewer_user_id    uuid fk → users        -- who clicked submit
  direction           enum: CONTRACTOR_RATES_SUB | SUB_RATES_CONTRACTOR
  overall_rating      int (1-5)
  -- direction-specific dimensions in metadata for now; promote to columns once stable
  metadata            jsonb     -- {quality, punctuality, communication} OR {payment_speed, fair_treatment, scope_clarity}
  body                text
  visibility          enum: PUBLIC | HIDDEN_BY_ADMIN
  created_at, updated_at
  unique(engagement_id, direction)   -- one review per direction per engagement
```

Both directions are **public** (per the strategic doc's two-way accountability moat). Admins can hide for ToS violations but not edit content.

### subscriptions  (Stage 1)

```
subscriptions
  id                          uuid pk
  contractor_company_id       uuid fk → companies
  dwolla_customer_id          text         -- verified business customer in Dwolla
  dwolla_funding_source_id    text         -- linked bank account (funding source)
  plan                        enum: CONTRACTOR_BASIC      -- only plan at Stage 1; tiers in Stage 2
  status                      enum: PENDING_VERIFICATION | TRIALING | ACTIVE | PAST_DUE | CANCELED
  amount_cents                int          -- 29900 at Stage 1
  current_period_start        timestamptz
  current_period_end          timestamptz
  next_charge_at              timestamptz  -- our scheduler scans this
  cancel_at_period_end        boolean
  failure_count               int default 0   -- consecutive ACH returns
  last_failure_code           text            -- e.g., R01, R02
  created_at, updated_at
```

ACH billing via Dwolla. $299/mo. Dwolla has no native "subscription" object — our daily cron scans `next_charge_at <= now AND status = ACTIVE` and calls Dwolla's `/transfers` endpoint. Tiered plans (Starter/Pro/etc.) introduced in Stage 2 — add rows to a `plans` table and migrate `plan` from enum to fk then.

### subscription_charges  (Stage 1, paired with subscriptions)

```
subscription_charges
  id                  uuid pk
  subscription_id     uuid fk → subscriptions
  dwolla_transfer_id  text          -- Dwolla's transfer id, for reconciliation
  amount_cents        int
  status              enum: PENDING | COMPLETED | FAILED | RETURNED
  ach_return_code     text          -- R01..R85 when applicable
  failure_reason      text
  attempted_at        timestamptz
  settled_at          timestamptz
  created_at
```

One row per Dwolla transfer attempt. Webhooks (`customer_transfer_completed`, `customer_transfer_failed`) update `status`, `settled_at`, and `ach_return_code`. This is our audit trail for every payment attempt — required for trust and for dispute responses.

### audit_log

```
audit_log
  id              bigserial pk
  actor_user_id   uuid fk → users         -- nullable for system events
  subject_table   text                    -- 'verifications', 'companies', etc.
  subject_id      uuid
  action          text                    -- 'STATUS_CHANGE', 'CREATED', etc.
  before          jsonb
  after           jsonb
  created_at      timestamptz
```

Captures every status change on `verifications`, `companies`, `engagements`, and `memberships`. Trust requires receipts.

### references  (v0.2)

```
references
  id                    uuid pk
  subject_company_id    uuid fk → companies (kind = SUB)
  contact_name          text
  contact_phone         text
  contact_email         text                       -- optional
  contact_company       text                       -- the contractor's company name
  last_job_summary      text
  last_job_completed_at date
  verification_id       uuid fk → verifications    -- the paired verification row
  created_at, updated_at
```

Subs enter 2+ references at onboarding. Admin calls each, marks the paired `verifications` row VERIFIED or REJECTED with call notes.

### disputes  (v0.2, Stage 1)

```
disputes
  id                     uuid pk
  engagement_id          uuid fk → engagements unique
  opened_by_user_id      uuid fk → users
  opened_by_company_id   uuid fk → companies
  reason                 text
  status                 enum: OPEN | UNDER_REVIEW | RESOLVED_FOR_CONTRACTOR | RESOLVED_FOR_SUB | WITHDRAWN
  resolution_notes       text
  resolved_by_user_id    uuid fk → users    -- admin
  resolved_at            timestamptz
  created_at, updated_at
```

Opening a dispute flips `engagements.status = DISPUTED` and blocks `reviews` until resolved.

### notifications  (v0.2)

```
notifications
  id              uuid pk
  user_id         uuid fk → users
  company_id      uuid fk → companies (nullable)
  channel         enum: IN_APP | EMAIL | BOTH
  event_type      text          -- 'inquiry.received', 'engagement.completed', etc.
  subject         text
  body            text
  link            text          -- in-app deep link
  payload         jsonb
  sent_at         timestamptz
  read_at         timestamptz
  created_at      timestamptz
```

Powers both the in-app inbox and the email send log (via Resend).

## Relationships (text ERD)

```
users  ─┬─< memberships >─┬─  companies ─┬─ (kind=CONTRACTOR) ─ contractor_profiles
        │                  │              │
        │                  │              └─ (kind=SUB) ────────┬─ sub_profiles
        │                  │                                     ├─< sub_systems >── roofing_systems
        │                  │                                     └─< verifications
        │                  │
        │                  └─ verifications (any company)
        │
        ├─< inquiries (initiating_user_id)
        ├─< messages (sender)
        └─< reviews (reviewer_user_id)

inquiries ── 1:1 ── conversations ──< messages
inquiries ── 0..1 ── engagements ──< reviews (max 2: one per direction)
engagements ── 0..1 ── disputes

sub_profiles ──< references ── 1:1 ── verifications (kind=REFERENCE)

users ──< notifications
companies ──< notifications

companies (kind=CONTRACTOR) ── 1:1 ── subscriptions (Stage 1)

metros ── seeded reference
roofing_systems ── seeded reference
```

## Search (Stage 0/1)

Stage 0/1 search is contractor → sub:
- Filter by `roofing_systems` (intersection with `sub_systems`)
- Filter by location: haversine from job site lat/lng vs `sub_profiles.base_lat/lng` within `service_radius_miles`
- Filter by `companies.status = VERIFIED`
- Sort by: verification recency, review average (once data exists), recency of activity

At Stage 0 volumes (≤500 subs), this is plain SQL. PostGIS / dedicated search engine is a Stage 2+ decision.

## What's intentionally absent

- **Payments / escrow / lien waivers** — Stage 4. No tables until then.
- **Placement-fee ledger** — Stage 3. Engagement table has a clean hook.
- **Tier credentials, system badges** — Stage 2+. Verifications table has a clean hook.
- **Sponsored placement, premium sub tiers** — Stage 2. New `feature_flags` or `entitlements` table when needed.
- **Multi-trade entities** — defer. When SubConnects expands to siding/gutters/solar, the trade is a new dimension; `roofing_systems` becomes `trades.systems` via migration.
- **Mobile-specific tables** — none. Web-responsive only at Stages 0-1.
- **Granular RBAC** — flat OWNER/ADMIN/MEMBER for now.

## Resolved decisions

All v0.1 open questions and v0.2 schema deltas resolved in [decisions.md](decisions.md). Summary:

- **D1** Soft delete on trust-bearing rows (`deleted_at`)
- **D2** `engagements.auto_completion_eligible_at` for the 30-day cron
- **D3** Subscription write-gate derived from `subscriptions.status`, no extra column
- **D4** `references` promoted to own table
- **D5** `users.last_active_company_id` for multi-membership users
- **D6** `disputes` as own table
- **D7** `notifications` as one unified table (in-app + email log)
- **D8** Engagement: either party proposes, both confirm
- **D9** References: sub enters contacts, admin calls
- **D10** Stripe customer created at first subscribe, not signup
- **D11** Reviews public immediately on submit; 14-day window to submit
- **Logos/photos:** S3, separate prefix per type
