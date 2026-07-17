import { createAuthClient } from "better-auth/react";

/**
 * Клиент Better Auth для браузера. baseURL по умолчанию — текущий origin,
 * запросы идут на /api/auth/*. Используется в клиентских компонентах
 * (формы входа/регистрации, шапка).
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
