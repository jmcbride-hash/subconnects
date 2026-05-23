# SubConnects — Core User Flows (Stage 0/1)

**Status:** Draft v0.1 · Scope: every flow needed to launch in one metro with one trade.

There are four actors:
- **Contractor** (demand) — pays $299/mo at Stage 1
- **Sub crew** (supply) — free baseline
- **Admin** (us) — manual verification + dispute mediation
- **System** (cron/jobs) — billing renewal, expiry reminders, auto-completion

Each flow lists the entities it touches (`like this`), the status transitions it drives, and the audit_log events it emits.

---

## 1. Contractor onboarding

**Goal:** get a contractor from landing page to first sub inquiry.

1. Lands on subconnects.com → CTA "Find verified roofing subs."
2. **Sign up** — email, password, full name → creates `users` row (status=ACTIVE).
3. **Create company** — legal name, display name, primary phone → creates `companies` row (kind=CONTRACTOR, status=DRAFT) + `contractor_profiles` (license #, HQ address, employee band, about) + `memberships` row (role=OWNER).
4. **Verification upload** — license PDF, COI PDF → creates two `verifications` rows (kind=LICENSE, kind=INSURANCE, status=PENDING).
5. **Subscribe** — Dwolla flow: (a) link business bank via Dwolla's IAV / Plaid → `dwolla_funding_source_id`; (b) submit beneficial-owner + EIN for Dwolla verified-customer KYC → `dwolla_customer_id`; (c) `subscriptions` row created (status=TRIALING for 7 days, `next_charge_at` = day 7); (d) status flips to ACTIVE on first successful transfer. Concierge onboarding call scheduled out-of-band (Stage 0 = manual, Calendly link).
6. **Status flips to VERIFIED** once admin approves both verifications → companies.status = VERIFIED, audit_log entry.
7. **Search unlocks** — contractor can now search subs, view full profiles, send inquiries.

**Status path:** users(ACTIVE) → companies(DRAFT→PENDING_VERIFICATION→VERIFIED) → subscriptions(TRIALING→ACTIVE).

**Important nuance:** at Stage 0 the trial exists so a contractor can browse with concierge support before payment lands. We may shorten or remove the trial after we see how Stage 0 cohort behaves.

---

## 2. Sub crew onboarding

**Goal:** get a sub from landing page to "verified, searchable, accepting inquiries."

1. Lands on subconnects.com → CTA "Get verified. Get found."
2. **Sign up** — email, password, full name → `users` row.
3. **Create crew** — crew/company name, foreman name, crew size → `companies` (kind=SUB, status=DRAFT) + `sub_profiles` (base address geocoded to lat/lng, service_radius_miles, years_in_trade, about) + `memberships` (OWNER).
4. **Declare systems worked** — select from `roofing_systems` (TPO, EPDM, BUR, etc.) + years experience per system → `sub_systems` rows.
5. **Verification submission:**
   - Upload COI (insurance) → `verifications` kind=INSURANCE, status=PENDING.
   - Upload license OR proof of business registration → kind=LICENSE, status=PENDING.
   - Enter 2+ references (contractor name, phone, last job) → `verifications` kind=REFERENCE × N, status=PENDING (admin will call).
6. **Submitted** — companies.status = PENDING_VERIFICATION. Sub sees a "Pending review (1-3 business days)" state.
7. **Admin verifies** (see Admin flow). On approval → companies.status = VERIFIED, audit_log entry.
8. **Profile goes live** — sub is now in contractor search results.

**Status path:** companies(DRAFT→PENDING_VERIFICATION→VERIFIED).

**Important nuance:** references are the slowest verification (admin must phone-call). At Stage 0 with 50 subs, that's ~100-150 calls. Operationally heavy but it IS the product — see brand guide page 03: "Not a Job Board."

---

## 3. The core marketplace loop

**Goal:** contractor finds sub → message → engage → complete → review. This is the loop the entire business runs on.

### 3a. Search & profile view

1. Contractor on subscribed account opens **Find Subs** page.
2. Filters: `roofing_systems` (multi-select) + job location (typed address, geocoded) + max distance (defaults to "show subs whose radius covers this point") + verified-only toggle (default ON).
3. Server returns subs where:
   - `companies.kind=SUB` AND `companies.status=VERIFIED`
   - `sub_systems` intersects selected systems
   - Haversine: distance(`sub_profiles.base`, job_location) ≤ `sub_profiles.service_radius_miles`
4. Sorted by: verification recency, then review average (once data exists), then last activity.
5. Contractor clicks a result → full sub profile: verifications, systems + years, reviews (Stage 1+), service area map.

### 3b. Inquiry

1. Contractor clicks **Send Inquiry** → form: subject, project summary, project metro, project systems (multi-select), optional value band.
2. Submit → `inquiries` row (status=SENT) + `conversations` row (1:1 with inquiry) + first system `messages` row that contains the structured inquiry payload.
3. Sub receives notification (email + in-app).
4. Sub views inquiry → inquiries.status = VIEWED (auto on open).
5. Sub responds via message OR declines → status RESPONDED or DECLINED.

### 3c. Conversation

1. Threaded messages within the conversation. Attachments via S3 signed URLs.
2. Read receipts via `messages.read_at`.
3. Either party can attach docs (scope sheets, photos, drawings).

### 3d. Engagement

1. Inside the conversation, either party clicks **Start Engagement** → form: agreed systems, job site address (geocoded to metro_id), expected start date.
2. Creates `engagements` row (status=PROPOSED, the clicker fills `started_at` only after confirmation).
3. Other party sees "Confirm engagement" prompt → confirms → engagement.status = ACTIVE, started_at = now.
4. Both parties can edit notes during ACTIVE.
5. Either side clicks **Mark Complete** → sets `contractor_marked_complete_at` or `sub_marked_complete_at`.
6. When both timestamps are non-null → engagement.status = COMPLETED, completed_at = now, audit_log entry.

### 3e. Review

1. On completion, both parties get a "Leave a review" prompt (in-app + email).
2. Review form by direction:
   - **Contractor → sub:** overall (1-5) + quality, punctuality, communication (each 1-5) + free text.
   - **Sub → contractor:** overall (1-5) + payment speed, fair treatment, scope clarity (each 1-5) + free text.
3. Submit → `reviews` row (visibility=PUBLIC).
4. 14-day window after completion to submit; after that, the slot expires (no review for that direction).
5. Reviews are public immediately — no "embargo until both submit" gate at Stage 0/1 (revisit if we see retaliation patterns).

**Status path:** inquiries(SENT→VIEWED→RESPONDED) → engagements(PROPOSED→ACTIVE→COMPLETED) → reviews(PUBLIC).

**Important nuance:** the engagement model is the trust anchor. No engagement = no review. This is what stops Yelp-style drive-by reviews and grounds the performance graph in real jobs. Stage 3+ placement fees attach here.

---

## 4. Admin verification workflow

**Goal:** turn a PENDING_VERIFICATION company into VERIFIED reliably, with receipts.

1. Admin opens **Verification Queue** — list of all `verifications` rows where status=PENDING, sorted oldest first.
2. Click a row → side panel shows: uploaded doc, metadata, company context, links to related verifications for same company.
3. Admin acts:
   - **LICENSE:** verify against state contractor license registry (external lookup). Mark VERIFIED + record license expiry → `verifications.expires_at`. Or REJECTED with reason.
   - **INSURANCE:** verify against carrier (call or upload-portal). Mark VERIFIED + record COI expiry. Or REJECTED with reason.
   - **REFERENCE:** call the reference. Notes pasted into `evidence_url` or `metadata.notes`. Mark VERIFIED or REJECTED.
4. Every approve/reject writes an `audit_log` row (actor = admin user, before/after JSON).
5. When a company meets the threshold (1 INSURANCE + 1 LICENSE + 2 REFERENCES, all VERIFIED, none expired) → background job flips `companies.status` to VERIFIED + audit_log entry + email to the company.
6. Rejections email the company with the rejection_reason and a link to re-upload.

**Expiry handling (system flow):**
- Daily cron: for any `verifications` where expires_at < now+30d, send reminder email.
- When `expires_at < now` → `verifications.status` = EXPIRED automatically.
- If a company drops below the verified threshold → `companies.status` → PENDING_VERIFICATION (no longer in search). Audit log entry + email.

---

## 5. Subscription billing (Stage 1)

**Goal:** keep contractor subscriptions current; degrade access gracefully when payment fails.

### 5a. Initial subscribe

Covered in §1.5.

### 5b. Renewal

Dwolla has no native "subscription" concept — our cron drives charges, webhooks confirm outcomes.

1. **Daily cron** scans `subscriptions WHERE status=ACTIVE AND next_charge_at <= now()`. For each row, calls Dwolla `POST /transfers` (source = contractor's funding source → destination = SubConnects business bank). Creates a `subscription_charges` row (status=PENDING).
2. **On `customer_transfer_completed` webhook** → `subscription_charges.status=COMPLETED`, `settled_at=now`, `subscriptions.current_period_start/end` advance one month, `next_charge_at` += 30 days. Audit log entry.
3. **On `customer_transfer_failed` webhook** → `subscription_charges.status=RETURNED` with `ach_return_code`. `subscriptions.failure_count++`, `last_failure_code = R-code`. UI banner. Behavior depends on R-code:
   - `R01` (NSF), `R09` (uncollected funds): retry in 3 days (Dwolla supports up to 2 retries per NACHA rules). Status stays ACTIVE during retry window.
   - `R02`, `R03`, `R04`, `R07`, `R08`, `R10`, `R16`, `R20`, `R29` (account closed / invalid / authorization revoked): no auto-retry. Status → PAST_DUE. Contractor must re-link bank.
4. **After 14 days PAST_DUE without success** → `subscriptions.status=CANCELED`. Contractor drops to **read-only** (can see existing conversations but cannot send new inquiries or messages).

### 5c. Cancel

1. Contractor self-serve cancels from billing settings → set `cancel_at_period_end=true` on our row.
2. The renewal cron honors this: when `current_period_end` arrives, instead of charging, set `status=CANCELED`.
3. Subscription remains ACTIVE until period end. Then status=CANCELED, account read-only.
4. Re-subscribe anytime — re-link bank if needed, re-verify, status returns to ACTIVE, write access restored.

### 5d. Past-due read-only state

- Can view: existing conversations, engagements, reviews, profile.
- Cannot: send new inquiries, send messages, start new engagements.
- Can still mark existing engagements complete and submit reviews.

---

## 6. Edge cases & failure modes

| Scenario | Behavior |
|---|---|
| Sub never responds to an inquiry within 14 days | inquiries.status auto-flips to ARCHIVED; contractor sees "no response" badge; can find another sub |
| Engagement marked complete by one side; other side ghosts | After 30 days from first mark, admin can force-complete (or auto-complete with a flag); reviews unlock |
| Engagement dispute (work not done / not paid) | Either party clicks "Dispute" → engagements.status=DISPUTED → admin queue; reviews blocked until resolved |
| Sub COI expires mid-engagement | Sub keeps the engagement (don't yank trust mid-job); contractor gets a notice; sub must renew to be search-visible to NEW contractors |
| User belongs to two companies | Top-bar company switcher; one active company context at a time |
| Admin needs to revoke verification (fraud discovered) | Manual `verifications.status` → REJECTED on the specific row → companies.status auto-drops to PENDING_VERIFICATION → audit log |
| Contractor cancels mid-engagement | Engagement continues; cancellation only restricts new outreach |
| Sub wants to delete account | Soft-delete only at Stage 0/1; account hidden from search but historical engagements/reviews persist. Hard-delete requires admin action and is recorded |

---

## 7. Notifications (cross-cutting)

In-app + email at minimum for Stage 0/1. SMS is Stage 2+.

Events that notify:
- Inquiry received (sub)
- Inquiry responded (contractor)
- Engagement proposed (other party)
- Engagement confirmed (initiating party)
- Engagement marked complete by counterparty
- Review left on you
- Verification approved / rejected (your company)
- Verification expiry reminder (your company)
- Subscription past-due (contractor)
- Subscription canceled (contractor)
- New message in conversation

---

## 8. What's not yet a flow (deferred)

- **Placement fees** — Stage 3. Will hook into engagement completion.
- **SubConnects Pay** — Stage 4. Payment rails between contractor and sub.
- **Skill badges / tier assessments** — Stage 2. New verification kinds + a separate "earn a badge" flow with an assessment partner.
- **Crew profiles for individual workers** — out of scope (crew = company is the unit).
- **Second metro onboarding** — Stage 3. Operational playbook, not a user flow.
- **Sponsored placement / featured listings** — Stage 2.
- **GC access** — Phase 3 / Year 3+.

---

## 9. Schema gaps surfaced by these flows

Things that should land in v0.2 of the schema based on writing these flows:

1. **`engagements.dispute_reason`** + a `disputes` mini-table to capture the dispute conversation (or keep it in the existing conversation, tagged).
2. **`engagements.auto_completion_eligible_at`** so the 30-day force-complete cron has a clean field to scan.
3. **`subscriptions.read_only_since`** or a derivable `is_write_disabled` — used by the API gateway to gate new inquiries/messages when PAST_DUE.
4. **`notifications` table** — channel (EMAIL/IN_APP), event_type, payload, sent_at, read_at. Needed for the in-app inbox.
5. **`company_switcher_last_active_company_id` on users** — small UX helper for multi-membership users.
6. **`references` could be its own table** vs being a row in `verifications` — a reference has a contact name + phone + last job context that doesn't fit cleanly in `metadata` jsonb. Consider promoting in v0.2.

These are the deltas. None invalidate v0.1; all are additive.
