/**
 * Supabase admin client — service-role key, server-only.
 *
 * Use ONLY in server-side code (server actions, route handlers, cron).
 * NEVER import from a Client Component. The service-role key bypasses RLS.
 *
 * Use cases:
 *  - Creating the public.users row after auth.users is created
 *  - Admin moderation (suspending accounts, force-completing engagements)
 *  - Background jobs (renewal cron, expiry sweeps)
 */

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. See .env.example."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
