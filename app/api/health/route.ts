/**
 * GET /api/health — liveness probe for uptime monitors.
 *
 * Does NOT touch the database (that's a separate /api/ready endpoint we'll
 * add when we wire monitoring properly). This just confirms the Next.js app
 * is responsive.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "subconnects",
    timestamp: new Date().toISOString(),
  });
}
