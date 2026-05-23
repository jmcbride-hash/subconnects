/**
 * SubConnects — Drizzle schema (v0.3)
 *
 * Mirrors docs/data-model.md v0.3. When the doc changes, this file moves with it.
 *
 * Conventions:
 *  - UUID primary keys via defaultRandom() unless seeded reference data (int pk)
 *  - Soft-delete via `deleted_at` on trust-bearing rows (messages, inquiries, engagements,
 *    reviews, verifications, memberships)
 *  - created_at / updated_at on all mutable tables
 *  - Enums declared once, reused
 *  - Indexes added for the search patterns described in docs/data-model.md §Search
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  date,
  bigserial,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const userStatus = pgEnum("user_status", [
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);

export const companyKind = pgEnum("company_kind", ["CONTRACTOR", "SUB"]);
export const companyStatus = pgEnum("company_status", [
  "DRAFT",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "SUSPENDED",
]);

export const employeeBand = pgEnum("employee_band", [
  "1-10",
  "11-50",
  "51-200",
  "201+",
]);

export const membershipRole = pgEnum("membership_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
]);
export const membershipStatus = pgEnum("membership_status", [
  "INVITED",
  "ACTIVE",
  "REVOKED",
]);

export const systemCategory = pgEnum("system_category", [
  "COMMERCIAL_FLAT",
  "COMMERCIAL_STEEP",
  "RESIDENTIAL",
  "SPECIALTY",
]);

export const verificationKind = pgEnum("verification_kind", [
  "INSURANCE",
  "LICENSE",
  "REFERENCE",
  // Future (Stage 2+) — declared now so we can add rows without migration drama
  "SYSTEM_BADGE",
  "TIER_ASSESSMENT",
]);
export const verificationStatus = pgEnum("verification_status", [
  "PENDING",
  "VERIFIED",
  "EXPIRED",
  "REJECTED",
]);

export const inquiryStatus = pgEnum("inquiry_status", [
  "SENT",
  "VIEWED",
  "RESPONDED",
  "DECLINED",
  "ARCHIVED",
]);
export const valueBand = pgEnum("value_band", [
  "LT_25K",
  "25K_75K",
  "75K_250K",
  "250K_1M",
  "GT_1M",
]);

export const engagementStatus = pgEnum("engagement_status", [
  "PROPOSED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
]);

export const reviewDirection = pgEnum("review_direction", [
  "CONTRACTOR_RATES_SUB",
  "SUB_RATES_CONTRACTOR",
]);
export const reviewVisibility = pgEnum("review_visibility", [
  "PUBLIC",
  "HIDDEN_BY_ADMIN",
]);

export const disputeStatus = pgEnum("dispute_status", [
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED_FOR_CONTRACTOR",
  "RESOLVED_FOR_SUB",
  "WITHDRAWN",
]);

export const planTier = pgEnum("plan_tier", ["CONTRACTOR_BASIC"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "PENDING_VERIFICATION",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
]);

export const chargeStatus = pgEnum("charge_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "RETURNED",
]);

export const notificationChannel = pgEnum("notification_channel", [
  "IN_APP",
  "EMAIL",
  "BOTH",
]);

// ─────────────────────────────────────────────────────────────────────────────
// users — shares id with auth.users (Supabase Auth)
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // mirrors auth.users.id
    email: text("email").notNull(),
    fullName: text("full_name"),
    phone: text("phone"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
    status: userStatus("status").notNull().default("ACTIVE"),
    lastActiveCompanyId: uuid("last_active_company_id"), // soft FK to companies; set in app code to avoid circular
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUq: uniqueIndex("users_email_uq").on(t.email),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// companies + type-specific profiles
// ─────────────────────────────────────────────────────────────────────────────

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: companyKind("kind").notNull(),
    legalName: text("legal_name"),
    displayName: text("display_name").notNull(),
    website: text("website"),
    primaryPhone: text("primary_phone"),
    logoUrl: text("logo_url"),
    status: companyStatus("status").notNull().default("DRAFT"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    kindStatusIdx: index("companies_kind_status_idx").on(t.kind, t.status),
  })
);

export const contractorProfiles = pgTable("contractor_profiles", {
  companyId: uuid("company_id")
    .primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number"),
  licenseState: text("license_state"),
  hqStreet: text("hq_street"),
  hqCity: text("hq_city"),
  hqState: text("hq_state"),
  hqPostalCode: text("hq_postal_code"),
  hqLat: numeric("hq_lat", { precision: 10, scale: 7 }),
  hqLng: numeric("hq_lng", { precision: 10, scale: 7 }),
  yearFounded: integer("year_founded"),
  employeeCountBand: employeeBand("employee_count_band"),
  about: text("about"),
});

export const subProfiles = pgTable(
  "sub_profiles",
  {
    companyId: uuid("company_id")
      .primaryKey()
      .references(() => companies.id, { onDelete: "cascade" }),
    foremanName: text("foreman_name"),
    crewSize: integer("crew_size"),
    baseStreet: text("base_street"),
    baseCity: text("base_city"),
    baseState: text("base_state"),
    basePostalCode: text("base_postal_code"),
    baseLat: numeric("base_lat", { precision: 10, scale: 7 }),
    baseLng: numeric("base_lng", { precision: 10, scale: 7 }),
    serviceRadiusMiles: integer("service_radius_miles"),
    yearsInTrade: integer("years_in_trade"),
    about: text("about"),
    willingToTravel: boolean("willing_to_travel").notNull().default(false),
  },
  (t) => ({
    // Spatial-ish: lookup by base point for "near a job site"
    baseGeoIdx: index("sub_profiles_base_geo_idx").on(t.baseLat, t.baseLng),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// memberships — users ↔ companies (many-to-many with role)
// ─────────────────────────────────────────────────────────────────────────────

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("MEMBER"),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    status: membershipStatus("status").notNull().default("INVITED"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    userCompanyUq: uniqueIndex("memberships_user_company_uq").on(t.userId, t.companyId),
    companyIdx: index("memberships_company_idx").on(t.companyId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Reference data (seeded)
// ─────────────────────────────────────────────────────────────────────────────

export const metros = pgTable("metros", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  slug: text("slug").notNull(),
  centroidLat: numeric("centroid_lat", { precision: 10, scale: 7 }),
  centroidLng: numeric("centroid_lng", { precision: 10, scale: 7 }),
  active: boolean("active").notNull().default(false),
}, (t) => ({
  slugUq: uniqueIndex("metros_slug_uq").on(t.slug),
}));

export const roofingSystems = pgTable("roofing_systems", {
  id: integer("id").primaryKey(), // seeded with stable ids
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  category: systemCategory("category").notNull(),
}, (t) => ({
  slugUq: uniqueIndex("roofing_systems_slug_uq").on(t.slug),
}));

// ─────────────────────────────────────────────────────────────────────────────
// sub_systems — junction (which systems a sub works)
// ─────────────────────────────────────────────────────────────────────────────

export const subSystems = pgTable(
  "sub_systems",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    systemId: integer("system_id")
      .notNull()
      .references(() => roofingSystems.id),
    yearsExperience: integer("years_experience"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.systemId] }),
    systemIdx: index("sub_systems_system_idx").on(t.systemId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// verifications — extensible (insurance/license/reference now; badges/tiers later)
// ─────────────────────────────────────────────────────────────────────────────

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectCompanyId: uuid("subject_company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    kind: verificationKind("kind").notNull(),
    status: verificationStatus("status").notNull().default("PENDING"),
    evidenceUrl: text("evidence_url"),
    metadata: jsonb("metadata"),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    subjectIdx: index("verifications_subject_idx").on(t.subjectCompanyId),
    statusIdx: index("verifications_status_idx").on(t.status),
    expiryIdx: index("verifications_expiry_idx").on(t.expiresAt),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// references — structured contact info, paired with a REFERENCE verification row
// ─────────────────────────────────────────────────────────────────────────────

export const references = pgTable(
  "references",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectCompanyId: uuid("subject_company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email"),
    contactCompany: text("contact_company"),
    lastJobSummary: text("last_job_summary"),
    lastJobCompletedAt: date("last_job_completed_at"),
    verificationId: uuid("verification_id").references(() => verifications.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    subjectIdx: index("references_subject_idx").on(t.subjectCompanyId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// inquiries — contractor → sub outreach
// ─────────────────────────────────────────────────────────────────────────────

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractorCompanyId: uuid("contractor_company_id")
      .notNull()
      .references(() => companies.id),
    subCompanyId: uuid("sub_company_id")
      .notNull()
      .references(() => companies.id),
    initiatingUserId: uuid("initiating_user_id")
      .notNull()
      .references(() => users.id),
    subject: text("subject"),
    projectSummary: text("project_summary"),
    projectMetroId: uuid("project_metro_id").references(() => metros.id),
    projectSystems: integer("project_systems").array(), // roofing_systems.id list
    estimatedValueBand: valueBand("estimated_value_band"),
    status: inquiryStatus("status").notNull().default("SENT"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    contractorIdx: index("inquiries_contractor_idx").on(t.contractorCompanyId),
    subIdx: index("inquiries_sub_idx").on(t.subCompanyId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// conversations + messages
// ─────────────────────────────────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  inquiryId: uuid("inquiry_id")
    .notNull()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    attachments: jsonb("attachments"), // [{ s3_key, name, size, mime }]
    readAt: timestamp("read_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    conversationIdx: index("messages_conversation_idx").on(t.conversationId, t.createdAt),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// engagements — the trust anchor; reviews gate on completion
// ─────────────────────────────────────────────────────────────────────────────

export const engagements = pgTable(
  "engagements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inquiryId: uuid("inquiry_id")
      .notNull()
      .references(() => inquiries.id),
    contractorCompanyId: uuid("contractor_company_id")
      .notNull()
      .references(() => companies.id),
    subCompanyId: uuid("sub_company_id")
      .notNull()
      .references(() => companies.id),
    proposedByUserId: uuid("proposed_by_user_id").references(() => users.id),
    confirmedByUserId: uuid("confirmed_by_user_id").references(() => users.id),
    status: engagementStatus("status").notNull().default("PROPOSED"),
    agreedSystems: integer("agreed_systems").array(),
    jobSiteCity: text("job_site_city"),
    jobSiteState: text("job_site_state"),
    jobSiteMetroId: uuid("job_site_metro_id").references(() => metros.id),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    contractorMarkedCompleteAt: timestamp("contractor_marked_complete_at", { withTimezone: true }),
    subMarkedCompleteAt: timestamp("sub_marked_complete_at", { withTimezone: true }),
    autoCompletionEligibleAt: timestamp("auto_completion_eligible_at", { withTimezone: true }),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    contractorIdx: index("engagements_contractor_idx").on(t.contractorCompanyId),
    subIdx: index("engagements_sub_idx").on(t.subCompanyId),
    statusIdx: index("engagements_status_idx").on(t.status),
    autoCompleteIdx: index("engagements_auto_complete_idx").on(t.autoCompletionEligibleAt),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// reviews — bidirectional, public, post-completion
// ─────────────────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    reviewerCompanyId: uuid("reviewer_company_id")
      .notNull()
      .references(() => companies.id),
    revieweeCompanyId: uuid("reviewee_company_id")
      .notNull()
      .references(() => companies.id),
    reviewerUserId: uuid("reviewer_user_id")
      .notNull()
      .references(() => users.id),
    direction: reviewDirection("direction").notNull(),
    overallRating: integer("overall_rating").notNull(), // 1-5
    metadata: jsonb("metadata"), // direction-specific dimensions
    body: text("body"),
    visibility: reviewVisibility("visibility").notNull().default("PUBLIC"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    engagementDirectionUq: uniqueIndex("reviews_engagement_direction_uq").on(t.engagementId, t.direction),
    revieweeIdx: index("reviews_reviewee_idx").on(t.revieweeCompanyId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// disputes — small dedicated workflow on engagements
// ─────────────────────────────────────────────────────────────────────────────

export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    openedByUserId: uuid("opened_by_user_id")
      .notNull()
      .references(() => users.id),
    openedByCompanyId: uuid("opened_by_company_id")
      .notNull()
      .references(() => companies.id),
    reason: text("reason").notNull(),
    status: disputeStatus("status").notNull().default("OPEN"),
    resolutionNotes: text("resolution_notes"),
    resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    engagementUq: uniqueIndex("disputes_engagement_uq").on(t.engagementId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// subscriptions — contractor ACH billing via Dwolla ($299/mo)
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractorCompanyId: uuid("contractor_company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    dwollaCustomerId: text("dwolla_customer_id"),
    dwollaFundingSourceId: text("dwolla_funding_source_id"),
    plan: planTier("plan").notNull().default("CONTRACTOR_BASIC"),
    status: subscriptionStatus("status").notNull().default("PENDING_VERIFICATION"),
    amountCents: integer("amount_cents").notNull().default(29900),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    nextChargeAt: timestamp("next_charge_at", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    failureCount: integer("failure_count").notNull().default(0),
    lastFailureCode: text("last_failure_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    contractorUq: uniqueIndex("subscriptions_contractor_uq").on(t.contractorCompanyId),
    nextChargeIdx: index("subscriptions_next_charge_idx").on(t.status, t.nextChargeAt),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// subscription_charges — one row per Dwolla transfer attempt
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionCharges = pgTable(
  "subscription_charges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    dwollaTransferId: text("dwolla_transfer_id"),
    amountCents: integer("amount_cents").notNull(),
    status: chargeStatus("status").notNull().default("PENDING"),
    achReturnCode: text("ach_return_code"),
    failureReason: text("failure_reason"),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    subscriptionIdx: index("subscription_charges_subscription_idx").on(t.subscriptionId, t.attemptedAt),
    dwollaTransferUq: uniqueIndex("subscription_charges_dwolla_uq").on(t.dwollaTransferId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// notifications — in-app inbox + email send log
// ─────────────────────────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    channel: notificationChannel("channel").notNull().default("IN_APP"),
    eventType: text("event_type").notNull(),
    subject: text("subject"),
    body: text("body"),
    link: text("link"),
    payload: jsonb("payload"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userUnreadIdx: index("notifications_user_unread_idx").on(t.userId, t.readAt),
    eventIdx: index("notifications_event_idx").on(t.eventType),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// audit_log — state-change log for trust-bearing rows
// ─────────────────────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    subjectTable: text("subject_table").notNull(),
    subjectId: uuid("subject_id"),
    action: text("action").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    subjectIdx: index("audit_log_subject_idx").on(t.subjectTable, t.subjectId, t.createdAt),
    actorIdx: index("audit_log_actor_idx").on(t.actorUserId, t.createdAt),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Convenience type exports
// ─────────────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Engagement = typeof engagements.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
