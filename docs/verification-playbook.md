# SubConnects — Verification Operations Playbook (v0.1)

**Status:** Draft v0.1 · For Stage 0 / Stage 1 (manual concierge verification of every crew before they appear in search).

Verification is not a checkbox at SubConnects — it is the product. This document turns "we verify everything by hand" from a brand claim into a process anyone on the verification team can follow without us hand-holding them. Every step here exists for a reason. Read it before you make your first call.

---

## 1. Purpose & guardrails

**Goal:** confirm that a sub crew is who they say they are, insured for the work they do, licensed for the jurisdiction they operate in, and has a credible track record with the contractors they've worked for.

**What verification is NOT:**
- A guarantee of future performance
- A warranty against bad outcomes on jobs
- A substitute for the contractor's own due diligence

We make this explicit in our Terms of Service. Verification establishes a floor, not a ceiling.

**Standards we hold the line on:**
- Every reference is **called by phone**, not emailed.
- Every insurance certificate is **confirmed with the carrier**, not taken at face value.
- Every state/municipal license is **looked up in the registry**, not trusted from a screenshot.
- Every verification has a **named admin** who owns the approve/reject decision.
- Every approve/reject writes an **audit_log entry** (immutable).

If a step in this playbook feels slow or unnecessary, do it anyway. Slow on day one buys speed at scale.

---

## 2. Roles

| Role | Responsibility |
|---|---|
| **Verification Admin** | Owns the queue end-to-end for the crews assigned to them. Makes the approve/reject call on each `verifications` row. |
| **Operations Lead** | Reviews flagged or ambiguous cases. Final say on suspensions and reinstatements. |
| **Founder (Stage 0)** | Reviews every approval personally for the first 50 crews. Drops to spot-checks after 50. |

At Stage 0, one person may hold all three roles. The audit log captures who did what regardless.

---

## 3. What the sub submits during onboarding

Each new sub uploads:

1. **Insurance** — Certificate of Insurance (COI) PDF showing General Liability ($1M+ per occurrence / $2M aggregate is the typical floor) and, if they have employees, Workers' Compensation.
2. **License or business registration** — either a state contractor license OR a city/municipal contractor registration OR a Secretary of State business registration (LLC/corp filing).
3. **References** — minimum 2 (preferably 3) contractor contacts with: name, phone, contractor company name, last job summary, last job completion date.
4. **Optional supporting docs** — safety certifications (OSHA 10, OSHA 30), system-specific manufacturer training, prior performance records.

Each upload creates a `verifications` row with `status = PENDING`. References also create paired `references` rows.

---

## 4. Insurance verification

### 4a. What to confirm

| Field | Floor for VERIFIED |
|---|---|
| Policy status | Active, not lapsed |
| Named insured | Matches the crew/company name on file (or a clearly-related DBA) |
| Coverage type | General Liability required. Workers' Comp required if the crew has employees |
| GL limits | $1M per occurrence / $2M aggregate (lower OK with note; flag for Ops Lead if below) |
| Effective date | Current period covers today |
| Expiration date | Recorded into `verifications.expires_at` |
| Certificate holder | "SubConnects" listed is a plus, not required |

### 4b. The call (or portal lookup)

Most COIs have the carrier name and a phone number for verification. Some have an upload portal — use that if available, otherwise call.

**Opening line:**
> "Hi, this is [your name] from SubConnects. We're verifying a Certificate of Insurance issued by your office. Policy number is [###]. Can you confirm whether the policy is currently active?"

**Confirm:**
- Active policy status
- Named insured matches the crew
- Effective and expiration dates
- Coverage type and limits

**Document in `verifications.metadata`:**
```
{
  "carrier": "Hartford",
  "policy_number": "12-AB-3456",
  "agent_name": "Sara T.",
  "agent_phone": "(214) 555-0188",
  "verification_method": "phone",
  "call_date": "2026-06-12",
  "active": true,
  "named_insured_matches": true,
  "gl_limits": "1M/2M",
  "wc_required_and_present": true,
  "expires_at": "2027-03-15"
}
```

### 4c. Pass / fail / flag

- **PASS:** all floor criteria met → `verifications.status = VERIFIED`, `expires_at` set.
- **FLAG:** below GL floor, named insured looks off, or carrier won't confirm → assign to Ops Lead, do not approve.
- **FAIL:** policy lapsed, fraudulent, or doesn't exist → `verifications.status = REJECTED` with `rejection_reason`. Email the crew with the specific reason and what's needed to re-submit.

### 4d. Red flags

- COI uploaded as an image with low resolution → request PDF original.
- Certificate holder listed as a name the crew won't explain → investigate.
- Carrier doesn't recognize the policy number → likely fraudulent. Reject.
- "Ghost policy" pattern: WC policy that excludes the owners/managers and lists 0-1 covered employees while the crew claims 10+ → reject, escalate to Ops Lead.

---

## 5. License verification

### 5a. Texas (launch market)

Texas does **not** require a state-level contractor license for roofing in most cases. Verification at launch focuses on:

1. **Secretary of State business registration** — confirm the LLC, corp, or DBA is in good standing.
   - Tool: https://www.sos.state.tx.us/corp/sosda/index.shtml (Texas SOS Business Inquiry)
   - Confirm: entity name, filing date, status = "in existence"
2. **Local municipal registration** — many Texas cities (Dallas, Fort Worth, Arlington, Plano) require contractors to register with the city before pulling permits.
   - For Dallas: Building Inspection Permits → registered contractor lookup
   - For Fort Worth: city contractor registration database
3. **Roofing-specific designations** (optional, captured in metadata if present):
   - Texas Roofing Contractors Association (TRCA) member?
   - NRCA member?
   - Manufacturer-certified installer? (GAF Master, Carlisle ESA, Firestone Master, etc.)

### 5b. What to confirm

| Field | Floor for VERIFIED |
|---|---|
| Entity status | In good standing with TX SOS |
| Entity name | Matches the crew's submitted business name |
| Filing date | Operating long enough to support claimed years in trade (not a hard rule; flag major mismatches) |
| Local registration | Present in launch metro's primary cities the crew operates in |
| License expiry (where applicable) | Recorded into `verifications.expires_at` |

### 5c. Document

```
{
  "entity_type": "LLC",
  "entity_name": "Lone Star Roofing Crews LLC",
  "tx_sos_file_number": "1234567890",
  "status": "in existence",
  "filing_date": "2020-04-12",
  "municipal_registrations": ["Dallas: #C12345", "Fort Worth: #R0987"],
  "verified_via": "TX SOS public search + Dallas permit registry",
  "verified_at": "2026-06-12"
}
```

### 5d. Pass / fail / flag

- **PASS:** entity in good standing + at least one municipal registration in the launch metro → VERIFIED.
- **FLAG:** entity not found OR municipal registration missing → contact crew for clarification before rejecting.
- **FAIL:** entity dissolved, forfeited, or fraudulent name → REJECTED.

### 5e. Future metros

Each new metro requires a license-verification appendix (which state requires what, which cities require what). Atlanta (Stage 3) and Phoenix (Stage 3+) will each get their own section.

---

## 6. Reference verification

This is the highest-leverage verification we do. **Every reference is called.** No exceptions, no email forms, no "we'll get back to you" voicemail-only verifications.

### 6a. Before the call

Pull the `references` row for the contact. You should have:
- Contact name and phone
- Their company name
- Last job summary and completion date

Read the crew's profile. Know what systems they work on, what they claim about themselves. You want to be able to ask informed follow-ups, not robotic checklist questions.

### 6b. The reference call script

Call between 9am–4pm local time. Identify yourself in the first sentence. Get to the point fast — contractors are busy.

**Opening:**
> "Hi [contact name], this is [your name] with SubConnects. [Crew name] listed you as a reference for our verified workforce network for roofing. I have five quick questions, takes about three minutes. Got a moment?"

**If they say yes, work through these — in order:**

1. **Confirm the job.**
   > "Can you confirm you worked with [Crew name] on a roofing job around [date], roughly [scope] — does that match what you remember?"

2. **Quality of work.**
   > "How was the quality of the work — A-tier, solid, or did you have issues?"

3. **Completion behavior.**
   > "Did they finish on time and on the original scope, or were there delays or surprises?"

4. **Safety and site presence.**
   > "Anything stand out about how they ran the site? Safety, cleanliness, professionalism?"

5. **Would you hire them again?**
   > "If you had another job tomorrow that fit their systems, would you call them back?"

6. **Anything we should know.** *(open-ended — the most valuable question)*
   > "Is there anything else we should know about working with this crew — good or bad — before we put our name behind them?"

7. **Close.**
   > "Last thing — would you be open to being contacted again in the next year or two if another contractor asks about them? It's the same one-call format, no obligation."

### 6c. What to listen for

- **Specific stories** (good or bad) > generic praise. "They were great" is weaker than "They finished the warehouse roof in Plano in two weeks despite the rain."
- **Hesitations** matter. If the contact pauses on "would you hire them again," push gently — "any reservations?"
- **Pattern flags:** payment disputes, scope arguments, no-shows, safety incidents, mid-job walk-offs.
- **Bonus signals:** the contact volunteers another crew this one has worked with, or asks how SubConnects works — sign they're engaged.

### 6d. Document

```
{
  "reference_id": "<references.id>",
  "call_date": "2026-06-12",
  "call_duration_min": 4,
  "contact_reached": true,
  "job_confirmed": true,
  "quality": "A-tier",
  "completion": "On time, on scope",
  "safety_notes": "Crew brought their own fall protection, ran clean site",
  "would_hire_again": "Yes, without hesitation",
  "open_comments": "Foreman is the real asset — keeps the crew tight",
  "reference_open_to_future_calls": true,
  "verbatim_quote": "If I had a job tomorrow, they'd be the first call."
}
```

### 6e. Pass / fail / flag

- **PASS:** call completed, job confirmed, quality at least "solid," would hire again is yes (or yes-with-minor-caveat) → VERIFIED.
- **FLAG:** lukewarm answer on "would hire again," vague quality answer, mention of payment or scope dispute → assign to Ops Lead. Do not approve unilaterally.
- **FAIL:** contact denies the job ever happened, recounts a serious dispute or incident, OR explicitly says they would not hire again → REJECTED.

### 6f. Bad-faith patterns to watch for

- All references from same area code with same handwriting on submission → likely friends/family. Push for at least one independent contractor reference.
- Reference is "the crew's foreman's cousin" → not a valid reference. Reject and request a real one.
- Reference number doesn't pick up after 3 attempts across 5 business days → reach out to the crew, request alternate. Don't approve from voicemails.
- Crew can't provide 2 references → not ready for verified status. Park them in PENDING_VERIFICATION until they can.

---

## 7. Verified-status threshold

A company's `companies.status` flips to **VERIFIED** when ALL of the following are true:

- At least 1 `verifications` row with `kind = INSURANCE`, `status = VERIFIED`, `expires_at > now()`
- At least 1 `verifications` row with `kind = LICENSE`, `status = VERIFIED`
- At least 2 `verifications` rows with `kind = REFERENCE`, `status = VERIFIED`

If any of these drop below threshold (expiry, revoked, etc.), `companies.status` drops back to **PENDING_VERIFICATION** automatically (via the cron in §8). The crew is hidden from search until they restore the threshold.

---

## 8. Expiry handling (system + admin)

### 8a. Automated (daily cron)

- For every `verifications` row where `expires_at < now() + 30 days`, send a reminder email to the crew (T-30, T-14, T-7, T-1).
- For every `verifications` row where `expires_at < now()`, set `status = EXPIRED`, write to `audit_log`.
- For every company that drops below the verified threshold, set `companies.status = PENDING_VERIFICATION`, write to `audit_log`, email both the crew and any contractor with an open inquiry/engagement that they're temporarily unverified.

### 8b. Manual (admin review)

When a sub re-submits an updated COI or license:
1. Read the new doc. Confirm it's a renewal of the prior policy / license (same carrier, same number, new dates) OR a legitimate replacement (new carrier, new policy).
2. Run the same verification flow as if it were new (§4 or §5).
3. On VERIFIED: the company auto-flips back to VERIFIED if the threshold is now met.

---

## 9. Suspensions and revocations

When a verification needs to be **revoked** mid-period (fraud discovered after the fact, complaint filed by a contractor, safety incident reported):

1. Admin opens the `verifications` row, sets `status = REJECTED`, fills `rejection_reason`. Audit log entry.
2. Companies drops to `PENDING_VERIFICATION`. Crew is removed from search immediately.
3. Crew receives an email with the specific reason and the path to remediation.
4. If the issue is severe (fraud, misrepresentation, safety violation that endangered others), the Operations Lead may suspend the entire account: `companies.status = SUSPENDED`. This is a heavier state — no search visibility, no new inquiries, no new engagements. Existing engagements continue until completed or admin intervenes.
5. SUSPENDED is reversible only by the Operations Lead, with documented justification.

---

## 10. Service-level expectations (Stage 0/1)

- **Time to first contact** after upload: same business day
- **Time to verified status** after a complete submission (all 3 verification types submitted): 3-5 business days
- **Reference call attempts** before requesting a new reference: 3 attempts across 5 business days
- **Rejection turnaround**: rejections sent within 1 business day of decision, with specific reason and remediation path

At 50 crews × 2-3 references each, this is roughly 100-150 reference calls and 50 insurance/license verifications for the launch cohort. Realistic: 2-3 weeks of focused admin work for one person.

---

## 11. Tools the admin needs

- Access to the SubConnects admin dashboard (verification queue, audit log, doc viewer)
- A phone number that displays a real caller ID (not "unknown") — references won't pick up unknown numbers
- Access to the Texas SOS business inquiry tool
- Access to Dallas, Fort Worth, Arlington, Plano (and other launch-metro cities) contractor registration databases
- A document scanner or PDF reader for COIs and licenses
- Note-taking surface (admin dashboard's metadata fields, or a structured Notion doc backed up to the audit log)

---

## 12. What gets logged (every verification, no exceptions)

Every approve or reject writes an `audit_log` row with:
- `actor_user_id` (the admin who decided)
- `subject_table` = "verifications"
- `subject_id` = the verification row id
- `action` = "STATUS_CHANGE"
- `before` = previous row state
- `after` = new row state

Trust requires receipts. If we ever have to defend a verification decision in dispute, the audit log is the record.

---

## 13. What this playbook does NOT cover (yet)

- **Skill-badge assessments** (TPO, EPDM, BUR, etc.) — Stage 2. Different process, different vendor partners (NRCA, RCAT, manufacturer programs). Separate playbook when we get there.
- **Tier assessments** (Bronze/Silver/Gold/Platinum) — Stage 2+. Requires defined criteria for each tier and an assessment delivery mechanism. Separate doc.
- **Contractor verification** — at Stage 1, contractors are verified more lightly (license + COI uploaded, no reference calls), since they are paying us. If a contractor's behavior pattern emerges as problematic in reviews, the Operations Lead can require additional verification. Detailed playbook TBD before contractor cohort #2.
- **Second-metro expansion** — playbook gets a metro-specific appendix per launch (license/registration requirements vary).
- **Dispute mediation** — separate playbook for the `disputes` workflow once we hit volume.

---

**VERIFIED · TRUSTED · PERFORMANCE-DRIVEN**

This playbook is a living document. If you do a verification and something here doesn't match reality, flag it. The process improves by surfacing the gaps, not papering over them.
