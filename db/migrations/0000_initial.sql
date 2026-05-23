CREATE TYPE "public"."charge_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."company_kind" AS ENUM('CONTRACTOR', 'SUB');--> statement-breakpoint
CREATE TYPE "public"."company_status" AS ENUM('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED_FOR_CONTRACTOR', 'RESOLVED_FOR_SUB', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."employee_band" AS ENUM('1-10', '11-50', '51-200', '201+');--> statement-breakpoint
CREATE TYPE "public"."engagement_status" AS ENUM('PROPOSED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('SENT', 'VIEWED', 'RESPONDED', 'DECLINED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('INVITED', 'ACTIVE', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('CONTRACTOR_BASIC');--> statement-breakpoint
CREATE TYPE "public"."review_direction" AS ENUM('CONTRACTOR_RATES_SUB', 'SUB_RATES_CONTRACTOR');--> statement-breakpoint
CREATE TYPE "public"."review_visibility" AS ENUM('PUBLIC', 'HIDDEN_BY_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('PENDING_VERIFICATION', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."system_category" AS ENUM('COMMERCIAL_FLAT', 'COMMERCIAL_STEEP', 'RESIDENTIAL', 'SPECIALTY');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."value_band" AS ENUM('LT_25K', '25K_75K', '75K_250K', '250K_1M', 'GT_1M');--> statement-breakpoint
CREATE TYPE "public"."verification_kind" AS ENUM('INSURANCE', 'LICENSE', 'REFERENCE', 'SYSTEM_BADGE', 'TIER_ASSESSMENT');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_user_id" uuid,
	"subject_table" text NOT NULL,
	"subject_id" uuid,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "company_kind" NOT NULL,
	"legal_name" text,
	"display_name" text NOT NULL,
	"website" text,
	"primary_phone" text,
	"logo_url" text,
	"status" "company_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contractor_profiles" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"license_number" text,
	"license_state" text,
	"hq_street" text,
	"hq_city" text,
	"hq_state" text,
	"hq_postal_code" text,
	"hq_lat" numeric(10, 7),
	"hq_lng" numeric(10, 7),
	"year_founded" integer,
	"employee_count_band" "employee_band",
	"about" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"opened_by_user_id" uuid NOT NULL,
	"opened_by_company_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "dispute_status" DEFAULT 'OPEN' NOT NULL,
	"resolution_notes" text,
	"resolved_by_user_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "engagements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"contractor_company_id" uuid NOT NULL,
	"sub_company_id" uuid NOT NULL,
	"proposed_by_user_id" uuid,
	"confirmed_by_user_id" uuid,
	"status" "engagement_status" DEFAULT 'PROPOSED' NOT NULL,
	"agreed_systems" integer[],
	"job_site_city" text,
	"job_site_state" text,
	"job_site_metro_id" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"contractor_marked_complete_at" timestamp with time zone,
	"sub_marked_complete_at" timestamp with time zone,
	"auto_completion_eligible_at" timestamp with time zone,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_company_id" uuid NOT NULL,
	"sub_company_id" uuid NOT NULL,
	"initiating_user_id" uuid NOT NULL,
	"subject" text,
	"project_summary" text,
	"project_metro_id" uuid,
	"project_systems" integer[],
	"estimated_value_band" "value_band",
	"status" "inquiry_status" DEFAULT 'SENT' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'MEMBER' NOT NULL,
	"invited_by_user_id" uuid,
	"invited_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"status" "membership_status" DEFAULT 'INVITED' NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb,
	"read_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"slug" text NOT NULL,
	"centroid_lat" numeric(10, 7),
	"centroid_lng" numeric(10, 7),
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid,
	"channel" "notification_channel" DEFAULT 'IN_APP' NOT NULL,
	"event_type" text NOT NULL,
	"subject" text,
	"body" text,
	"link" text,
	"payload" jsonb,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_company_id" uuid NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text,
	"contact_company" text,
	"last_job_summary" text,
	"last_job_completed_at" date,
	"verification_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"reviewer_company_id" uuid NOT NULL,
	"reviewee_company_id" uuid NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"direction" "review_direction" NOT NULL,
	"overall_rating" integer NOT NULL,
	"metadata" jsonb,
	"body" text,
	"visibility" "review_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roofing_systems" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "system_category" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sub_profiles" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"foreman_name" text,
	"crew_size" integer,
	"base_street" text,
	"base_city" text,
	"base_state" text,
	"base_postal_code" text,
	"base_lat" numeric(10, 7),
	"base_lng" numeric(10, 7),
	"service_radius_miles" integer,
	"years_in_trade" integer,
	"about" text,
	"willing_to_travel" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sub_systems" (
	"company_id" uuid NOT NULL,
	"system_id" integer NOT NULL,
	"years_experience" integer,
	CONSTRAINT "sub_systems_company_id_system_id_pk" PRIMARY KEY("company_id","system_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"dwolla_transfer_id" text,
	"amount_cents" integer NOT NULL,
	"status" charge_status DEFAULT 'PENDING' NOT NULL,
	"ach_return_code" text,
	"failure_reason" text,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_company_id" uuid NOT NULL,
	"dwolla_customer_id" text,
	"dwolla_funding_source_id" text,
	"plan" "plan_tier" DEFAULT 'CONTRACTOR_BASIC' NOT NULL,
	"status" "subscription_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"amount_cents" integer DEFAULT 29900 NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"next_charge_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"phone" text,
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_active_company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_company_id" uuid NOT NULL,
	"kind" "verification_kind" NOT NULL,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"evidence_url" text,
	"metadata" jsonb,
	"verified_by_user_id" uuid,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"rejection_reason" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contractor_profiles" ADD CONSTRAINT "contractor_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_user_id_users_id_fk" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_company_id_companies_id_fk" FOREIGN KEY ("opened_by_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_contractor_company_id_companies_id_fk" FOREIGN KEY ("contractor_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_sub_company_id_companies_id_fk" FOREIGN KEY ("sub_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_proposed_by_user_id_users_id_fk" FOREIGN KEY ("proposed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_confirmed_by_user_id_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_job_site_metro_id_metros_id_fk" FOREIGN KEY ("job_site_metro_id") REFERENCES "public"."metros"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_contractor_company_id_companies_id_fk" FOREIGN KEY ("contractor_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_sub_company_id_companies_id_fk" FOREIGN KEY ("sub_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_initiating_user_id_users_id_fk" FOREIGN KEY ("initiating_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_project_metro_id_metros_id_fk" FOREIGN KEY ("project_metro_id") REFERENCES "public"."metros"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "references" ADD CONSTRAINT "references_subject_company_id_companies_id_fk" FOREIGN KEY ("subject_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "references" ADD CONSTRAINT "references_verification_id_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."verifications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_company_id_companies_id_fk" FOREIGN KEY ("reviewer_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_company_id_companies_id_fk" FOREIGN KEY ("reviewee_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sub_profiles" ADD CONSTRAINT "sub_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sub_systems" ADD CONSTRAINT "sub_systems_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sub_systems" ADD CONSTRAINT "sub_systems_system_id_roofing_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."roofing_systems"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_charges" ADD CONSTRAINT "subscription_charges_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_contractor_company_id_companies_id_fk" FOREIGN KEY ("contractor_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verifications" ADD CONSTRAINT "verifications_subject_company_id_companies_id_fk" FOREIGN KEY ("subject_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verifications" ADD CONSTRAINT "verifications_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_subject_idx" ON "audit_log" USING btree ("subject_table","subject_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_kind_status_idx" ON "companies" USING btree ("kind","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "disputes_engagement_uq" ON "disputes" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagements_contractor_idx" ON "engagements" USING btree ("contractor_company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagements_sub_idx" ON "engagements" USING btree ("sub_company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagements_status_idx" ON "engagements" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagements_auto_complete_idx" ON "engagements" USING btree ("auto_completion_eligible_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiries_contractor_idx" ON "inquiries" USING btree ("contractor_company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiries_sub_idx" ON "inquiries" USING btree ("sub_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "memberships_user_company_uq" ON "memberships" USING btree ("user_id","company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_company_idx" ON "memberships" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "metros_slug_uq" ON "metros" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_event_idx" ON "notifications" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "references_subject_idx" ON "references" USING btree ("subject_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_engagement_direction_uq" ON "reviews" USING btree ("engagement_id","direction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_reviewee_idx" ON "reviews" USING btree ("reviewee_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roofing_systems_slug_uq" ON "roofing_systems" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_profiles_base_geo_idx" ON "sub_profiles" USING btree ("base_lat","base_lng");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_systems_system_idx" ON "sub_systems" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_charges_subscription_idx" ON "subscription_charges" USING btree ("subscription_id","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_charges_dwolla_uq" ON "subscription_charges" USING btree ("dwolla_transfer_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_contractor_uq" ON "subscriptions" USING btree ("contractor_company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_next_charge_idx" ON "subscriptions" USING btree ("status","next_charge_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verifications_subject_idx" ON "verifications" USING btree ("subject_company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verifications_status_idx" ON "verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verifications_expiry_idx" ON "verifications" USING btree ("expires_at");