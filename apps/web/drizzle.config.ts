import { defineConfig } from "drizzle-kit";

/**
 * `generate` works offline; `migrate`/`push` need real credentials. Falling back
 * to the local SQLite file keeps the dev loop working without a Turso account.
 */
const url = process.env.TURSO_DATABASE_URL || "file:local.db";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
