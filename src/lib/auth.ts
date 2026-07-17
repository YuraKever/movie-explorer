import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "./db";

/**
 * Инстанс Better Auth: email + пароль, сессии в httpOnly-cookie.
 * Хранилище — Postgres через Drizzle-адаптер (таблицы user/session/account/
 * verification из `db/auth-schema.ts`, сгенерированы CLI).
 * Секрет и базовый URL берутся из BETTER_AUTH_SECRET / BETTER_AUTH_URL.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
});
