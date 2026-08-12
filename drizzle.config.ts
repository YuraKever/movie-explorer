import { defineConfig } from "drizzle-kit";

// drizzle-kit does not pick up .env.local on its own. Node 22+ can do it
// natively. In production the file is absent — DATABASE_URL comes from the real
// environment (loadEnvFile never overrides variables already set there).
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — fine, the variables are already in the environment.
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
