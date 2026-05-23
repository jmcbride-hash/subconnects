/**
 * Supabase server client — for Server Components, Server Actions, Route Handlers.
 *
 * Reads the session from cookies; writes refresh tokens via the same cookies on
 * token rotation. Don't share between requests — create fresh inside each
 * request handler.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll throws when called from a Server Component (read-only).
            // The middleware handles refresh in that path — safe to swallow.
          }
        },
      },
    }
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. See .env.example.`);
  }
  return value;
}
