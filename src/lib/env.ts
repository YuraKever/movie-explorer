import { z } from "zod";

/**
 * Server environment contract. Everything here is read on the server only —
 * none of these names is prefixed with NEXT_PUBLIC_, so none reaches the client.
 */
const envSchema = z
  .object({
    DATABASE_URL: z.url("must be a Postgres connection string"),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "must be at least 32 characters (openssl rand -base64 32)"),
    BETTER_AUTH_URL: z.url("must be the full origin the app is served from"),
    TMDB_ACCESS_TOKEN: z.string().min(1).optional(),
    TMDB_API_KEY: z.string().min(1).optional(),
  })
  .refine((env) => env.TMDB_ACCESS_TOKEN || env.TMDB_API_KEY, {
    message: "set TMDB_ACCESS_TOKEN (v4) or TMDB_API_KEY (v3)",
    path: ["TMDB_ACCESS_TOKEN"],
  });

export type Env = z.infer<typeof envSchema>;

/** Throws with every problem at once rather than one variable per restart. */
export function validateEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Invalid environment:\n${problems}\n\nSee .env.example for the expected shape.`,
  );
}
