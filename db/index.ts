/**
 * Drizzle client — Postgres via the `postgres` driver (works with Supabase pooler)
 *
 * Use in Server Components and route handlers:
 *   import { db } from "@/db";
 *   const rows = await db.select().from(users).limit(10);
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Lazy connection: don't construct the postgres client at import time.
// next build collects page data with NODE_ENV=production but no real DB connection;
// throwing during that collection would block the build. Throw on first use instead.
let _client: ReturnType<typeof postgres> | null = null;
function getClient() {
  if (_client) return _client;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection string."
    );
  }
  _client = postgres(connectionString, {
    prepare: false, // Required for Supabase's transaction pooler
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return _client;
}

// drizzle() proxies through the client; we wrap so the connection only opens on first query.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const realDb = drizzle(getClient(), { schema });
    const value = (realDb as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(realDb) : value;
  },
});

export * from "./schema";
