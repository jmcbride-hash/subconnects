# SubConnects — Resolved Decisions (v0.1)

**Status:** Draft v0.1 · Closes out the open questions from [data-model.md](data-model.md) and [flows.md](flows.md). Schema bumps to v0.2 after this is signed off.

Each entry: **Decision** + short **Rationale**. Items marked **Proposed (awaiting confirmation)** are the genuine judgment calls — flagged for explicit sign-off.

## Schema additions (clear wins)

### D1. Soft delete on messages and trust-bearing rows
**Decision:** Soft delete. Add `deleted_at timestamptz` to `messages`, `inquiries`, `engagements`, `reviews`, `verifications`, `memberships`. Hard delete only on admin action, recorded in `audit_log`.
**Rationale:** Trust requires receipts. Disputes and fraud investigations need history. Storage cost is trivial.

### D2. Engagement auto-completion field
**Decision:** Add `engagements.auto_completion_eligible_at timestamptz`, set to `first_marked_complete_at + 30 days`. Daily cron scans for rows where this is past and the second side hasn't marked complete, then prompts admin (Stage 0/1 — manual). Stage 2 can auto-complete.
**Rationale:** Avoids stuck engagements. Lean — no auto-complete yet; admin intervenes after 30 days. Field is just a clean scan target.

### D3. Subscription write-gate field
**Decision:** Don't add a column. Derive `is_write_disabled` from `subscriptions.status NOT IN ('TRIALING', 'ACTIVE')`. API middleware checks this on every write endpoint. Banner UI reads the same.
**Rationale:** Less state to keep in sync. Status changes drive UX directly.

### D4. Promote references to their own table
**Decision:** Add a `references` table:
```
references
  id                   uuid pk
  subject_company_id   uuid fk → companies (kind = SUB)
  contact_name         text
  contact_phone        text
  contact_company      text         -- contractor's company name
  last_job_summary     text         -- what they did together
  last_job_completed_at date
  verification_id      uuid fk → verifications  -- the call result
  created_at, updated_at
```
A `verifications` row with `kind = REFERENCE` now points to one `references` row via a back-ref. Cleaner than jamming structured contact data into `verifications.metadata` jsonb.
**Rationale:** References are structured data we query against (e.g., "find subs with references from X contractor"). jsonb makes that harder.

### D5. Multi-company users helper
**Decision:** Add `users.last_active_company_id uuid fk → companies (nullable)`. UI top-bar reads this on login. User can switch via a dropdown.
**Rationale:** Most users will only ever belong to one company. The few that don't get a clean default.

### D6. Disputes as a small dedicated table
**Decision:** Add a `disputes` table:
```
disputes
  id                  uuid pk
  engagement_id       uuid fk → engagements unique
  opened_by_user_id   uuid fk → users
  opened_by_company_id uuid fk → companies
  reason              text
  status              enum: OPEN | UNDER_REVIEW | RESOLVED_FOR_CONTRACTOR | RESOLVED_FOR_SUB | WITHDRAWN
  resolution_notes    text
  resolved_by_user_id uuid fk → users (admin)
  resolved_at         timestamptz
  created_at, updated_at
```
Opening a dispute flips `engagements.status = DISPUTED` and blocks `reviews` until resolved.
**Rationale:** Disputes are a small but distinct workflow with their own state machine. Keeping them out of `engagements` keeps that table focused.

### D7. Notifications table
**Decision:** Add a `notifications` table:
```
notifications
  id              uuid pk
  user_id         uuid fk → users
  company_id      uuid fk → companies (nullable — for personal notifications)
  channel         enum: IN_APP | EMAIL | BOTH
  event_type      text           -- e.g., 'inquiry.received', 'engagement.completed', 'verification.approved'
  subject         text
  body            text
  link            text           -- in-app deep link
  payload         jsonb          -- event-specific data
  sent_at         timestamptz
  read_at         timestamptz
  created_at      timestamptz
```
Used both as the in-app inbox and the email send log. Email goes via Resend; we record the send here.
**Rationale:** One table covers in-app inbox + email audit. Simpler than separating.

## Operational decisions (judgment calls)

### D8. Engagement creation flow — **Confirmed**
**Proposed:** Either party can click **Propose Engagement** inside a conversation. The other party gets a **Confirm Engagement** prompt. On confirm, `engagements.status` flips PROPOSED → ACTIVE. No engagement gets created without mutual consent.
**Rationale:** Mutual consent matches the two-way trust model. Either side can initiate (some contractors will propose; some subs will propose).
**Alternative:** Only contractors can propose (sub agrees). Simpler but less symmetric. Not recommended.

### D9. Reference collection process at Stage 0 — **Confirmed**
**Proposed:**
1. Sub enters reference contacts (name, phone, contractor company, last job summary, date) into a form on profile setup.
2. Each entry creates a `references` row + a paired `verifications` row (kind=REFERENCE, status=PENDING).
3. Admin sees these in the verification queue.
4. Admin calls the reference, takes notes, pastes them into `verifications.metadata.call_notes` (or uploads as evidence_url), marks VERIFIED or REJECTED.
5. No reference portal, no automated reference outreach at Stage 0/1.
**Rationale:** Concierge by design. Direct human verification IS the brand promise. A reference portal at Stage 0 is over-engineering — we have ~50 subs × 2 refs = 100 calls total. Doable manually.

### D10. Dwolla customer creation timing
**Decision:** Create the Dwolla verified business customer **at first subscribe**, not at signup. A contractor who creates an account but never subscribes never gets KYC'd in Dwolla.
**Rationale:** Verified-customer KYC requires SSN/DOB of a beneficial owner + EIN. We do not want to ask for that info at email-password signup — it kills conversion. Defer it to the subscribe step when the contractor has already decided to pay.

### D11. Review visibility timing — **Confirmed**
**Proposed:** Reviews are **public immediately** on submission. No "embargo until both sides submit" hold. 14-day window after engagement completion to submit; after that, the slot expires.
**Rationale:** Public immediate matches the two-way accountability moat from the strategic doc — and the brand voice ("Direct. Professional. Built on Trust."). If retaliation patterns emerge in Stage 1, we revisit.
**Alternative:** Embargo until both submit (or 14-day timer expires, then release what's been submitted). Reduces retaliation risk but slows the feedback loop. Trade-off worth flagging.

### D12. Payments processor — Dwolla, not Stripe
**Decision:** Use **Dwolla (ACH only)** for the $299/mo contractor subscription. No card backup at signup. No Stripe.
**Rationale:**
- Past experience with Stripe shows reserve / extended-hold behavior on construction-adjacent merchant categories that hurts cash flow.
- Dwolla is a pure-ACH processor — no card-network risk model, no rolling reserves, funds settle to our business bank in 1-3 days.
- ACH at $299 is ~$0.50 per transfer; cards would be ~$9. The fee math also favors ACH.
- Cards are out at signup. Forces contractor to have a verified business bank — also a quality filter on serious buyers.
- For Stage 4 (SubConnects Pay, contractor→sub payouts), Dwolla scales up to the same use case. Modern Treasury is the upgrade path if we outgrow it.

**Trade-off:** Dwolla has no native "subscription" object like Stripe Billing. Our daily cron drives recurring charges by scanning `subscriptions.next_charge_at`. More code on our side; full cash-flow control in exchange.

**Implementation notes (Stage 1):**
- Bank link: Dwolla IAV or Plaid → returns `funding_source_id`.
- Customer KYC: collect beneficial owner SSN + DOB + EIN at the subscribe step (D10); call Dwolla create-verified-customer.
- Recurring charges: daily cron, `POST /transfers` per due subscription, log to `subscription_charges`.
- Retries: NACHA-compliant (max 2 auto-retries for R01/R09; no retry for hard returns like R02/R03/R08).
- Webhooks: `customer_transfer_completed`, `customer_transfer_failed`, `customer_funding_source_removed`.

**What this changes downstream:**
- [stack.md](stack.md): Stripe removed; Dwolla added with cost estimate; business bank account required.
- [data-model.md](data-model.md) v0.3: `subscriptions` reshaped (Dwolla fields, scheduler-driven); new `subscription_charges` table for transfer-level audit.
- [flows.md](flows.md) §5: Renewal cron + R-code retry behavior documented.

## Profile photos / company logos hosting
**Decision:** AWS S3 (already chosen in [stack.md](stack.md)). Signed-URL uploads from the client; CloudFront in front for serving. Same bucket as other uploads, separate prefix (`logos/`, `coi/`, `licenses/`, `messages/`).
**Rationale:** No reason to split.

## Summary of schema deltas (going into v0.2)

- Add `deleted_at` to: `messages`, `inquiries`, `engagements`, `reviews`, `verifications`, `memberships`
- Add `engagements.auto_completion_eligible_at`
- Add `users.last_active_company_id`
- New table: `references`
- New table: `disputes`
- New table: `notifications`
- New `engagements.status` value: `DISPUTED` (already in v0.1)

No breaking changes to v0.1 — these are all additive.

## Items requiring your sign-off

All resolved. Schema bumps to v0.2.
