/**
 * GET /auth/confirm — handles the Supabase email-confirmation token.
 *
 * Supabase emails a link to this route with `token_hash` and `type=signup` (or
 * `recovery`, `invite`, `magiclink`, `email`). We call verifyOtp to mint the
 * session, then redirect to the app.
 */

import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/contractor";

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/sign-in?error=invalid_link", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
