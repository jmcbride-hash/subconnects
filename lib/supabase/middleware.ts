/**
 * Supabase middleware helper — refreshes the user session on every request.
 *
 * Wire into next.js middleware.ts:
 *   import { updateSession } from "@/lib/supabase/middleware";
 *   export async function middleware(request) { return updateSession(request); }
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully degrade when env not configured — useful pre-Supabase-setup.
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }: CookieToSet) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshing the auth token (mutates response cookies).
  // We don't read user here — server components do that closer to the action.
  await supabase.auth.getUser();

  return response;
}
