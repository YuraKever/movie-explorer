import { defineConfig } from "drizzle-kit";

// drizzle-kit не подхватывает .env.local сам. Node 22+ умеет это встроенно.
// В проде файла нет — DATABASE_URL приходит из настоящего окружения.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local отсутствует — ок, значит переменные уже в окружении.
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
