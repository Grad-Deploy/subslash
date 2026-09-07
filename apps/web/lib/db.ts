import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

/**
 * The database backs email reminders only. Everything else in the app runs
 * against localStorage, so most requests never touch it — the connection is
 * created lazily on first use rather than at import time.
 *
 * Without TURSO_DATABASE_URL it falls back to a local SQLite file, which is
 * what `pnpm dev` uses.
 */

let cached: LibSQLDatabase<typeof schema> | null = null;
let client: Client | null = null;

export function getDb(): LibSQLDatabase<typeof schema> {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL || "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url.startsWith("libsql://") && !authToken) {
    throw new Error("TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL points at Turso.");
  }

  client = createClient({ url, authToken });
  cached = drizzle(client, { schema });
  return cached;
}

/**
 * Releases the underlying connection. Serverless functions never need this;
 * tests do, because an open SQLite handle keeps the file locked on Windows.
 */
export function closeDb(): void {
  client?.close();
  client = null;
  cached = null;
}

/** True when reminders can work at all; routes use this to fail with a clear message. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL) || process.env.NODE_ENV !== "production";
}

export type Database = LibSQLDatabase<typeof schema>;
