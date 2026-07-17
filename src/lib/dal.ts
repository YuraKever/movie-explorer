import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Data Access Layer для сессии. Официальный путь Next: централизуем проверку
 * здесь, а не в layout (layout не перерисовывается на переходах).
 * `cache` мемоизирует результат в пределах одного серверного рендера —
 * getSession можно звать из нескольких мест без дублей запросов.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Требует залогиненного пользователя; иначе редирект на /login. Вернёт user. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}
