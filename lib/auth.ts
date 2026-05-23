/**
 * Server-side auth helpers.
 *
 * Use in Server Components, Server Actions, and Route Handlers.
 *
 *   const session = await requireUser();
 *   const ctx = await getSessionContext(); // null if not signed in
 *
 * "Active company" rules:
 *   - If users.last_active_company_id is set AND the user has an ACTIVE
 *     membership in that company → use it.
 *   - Otherwise pick the user's most recent ACTIVE membership.
 *   - Returns null if no ACTIVE membership exists.
 */

import "server-only";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  users,
  memberships,
  companies,
  contractorProfiles,
  subProfiles,
} from "@/db/schema";

export type SessionContext = {
  authUserId: string;
  user: typeof users.$inferSelect;
  membership: typeof memberships.$inferSelect | null;
  company: typeof companies.$inferSelect | null;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  // If env isn't configured (e.g. running locally without Supabase set up),
  // treat as unauthenticated rather than throwing — the gated pages will redirect to /sign-in.
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return null;
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [appUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!appUser) {
    // auth.users exists but mirror row is missing — sign-up sync failed somewhere.
    // Return a partial context so the caller can recover (e.g. by re-running the mirror).
    return {
      authUserId: authUser.id,
      user: {
        id: authUser.id,
        email: authUser.email ?? "",
        fullName: authUser.user_metadata?.full_name ?? null,
        phone: null,
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        isPlatformAdmin: false,
        status: "ACTIVE",
        lastActiveCompanyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      membership: null,
      company: null,
    };
  }

  // Pick the active company: last_active_company_id if still active, else most recent membership.
  let membership: typeof memberships.$inferSelect | null = null;
  let company: typeof companies.$inferSelect | null = null;

  if (appUser.lastActiveCompanyId) {
    const [row] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, appUser.id),
          eq(memberships.companyId, appUser.lastActiveCompanyId),
          eq(memberships.status, "ACTIVE")
        )
      )
      .limit(1);
    if (row) membership = row;
  }

  if (!membership) {
    const [row] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, appUser.id), eq(memberships.status, "ACTIVE")))
      .orderBy(desc(memberships.acceptedAt))
      .limit(1);
    if (row) membership = row;
  }

  if (membership) {
    const [row] = await db.select().from(companies).where(eq(companies.id, membership.companyId)).limit(1);
    if (row) company = row;
  }

  return { authUserId: authUser.id, user: appUser, membership, company };
}

export async function requireUser(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/sign-in");
  return ctx;
}

export async function requireContractor(): Promise<
  SessionContext & {
    membership: typeof memberships.$inferSelect;
    company: typeof companies.$inferSelect;
  }
> {
  const ctx = await requireUser();
  if (!ctx.company) redirect("/onboard");
  if (ctx.company.kind !== "CONTRACTOR") redirect("/sub");
  return ctx as SessionContext & {
    membership: typeof memberships.$inferSelect;
    company: typeof companies.$inferSelect;
  };
}

export async function requireSub(): Promise<
  SessionContext & {
    membership: typeof memberships.$inferSelect;
    company: typeof companies.$inferSelect;
  }
> {
  const ctx = await requireUser();
  if (!ctx.company) redirect("/onboard");
  if (ctx.company.kind !== "SUB") redirect("/contractor");
  return ctx as SessionContext & {
    membership: typeof memberships.$inferSelect;
    company: typeof companies.$inferSelect;
  };
}

export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await requireUser();
  if (!ctx.user.isPlatformAdmin) redirect("/");
  return ctx;
}

// Re-exports for convenience
export { contractorProfiles, subProfiles };
