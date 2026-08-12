import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for the browser. baseURL defaults to the current origin,
 * requests go to /api/auth/*. Used by client components (sign-in/sign-up forms,
 * the header).
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
