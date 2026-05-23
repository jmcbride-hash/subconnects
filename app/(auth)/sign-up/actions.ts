"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/db";
import { users } from "@/db/schema";
import { headers } from "next/headers";

const SignUpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password is too long"),
  fullName: z.string().min(1, "Full name is required").max(120),
});

export type SignUpState = {
  error?: string;
  ok?: boolean;
  email?: string;
};

export async function signUp(_prev: SignUpState | undefined, formData: FormData): Promise<SignUpState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, fullName } = parsed.data;
  const supabase = await createClient();

  // Build the redirect URL for email confirmation
  const reqHeaders = await headers();
  const origin =
    reqHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Sign-up failed — no user returned." };
  }

  // Mirror the auth.users row into our public.users table.
  // We use the admin client because the new user may not have a usable session yet.
  try {
    const admin = createAdminClient();
    // Use Drizzle for the insert so the column names and types stay in lock-step with the schema.
    void admin; // admin is held in case we need RLS-bypass elsewhere in this action later
    await db
      .insert(users)
      .values({
        id: data.user.id,
        email,
        fullName,
      })
      .onConflictDoNothing();
  } catch (err) {
    // Don't block sign-up on a sync hiccup — log it for follow-up. The auth user exists;
    // we can backfill the public.users row from the admin queue.
    console.error("[sign-up] failed to mirror users row:", err);
  }

  return { ok: true, email };
}
