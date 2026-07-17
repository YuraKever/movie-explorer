import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Единый эндпоинт Better Auth: /api/auth/* (sign-in, sign-up, sign-out, session…).
 * Клиент (`auth-client.ts`) и сервер (`dal.ts`) ходят именно сюда.
 */
export const { GET, POST } = toNextJsHandler(auth);
