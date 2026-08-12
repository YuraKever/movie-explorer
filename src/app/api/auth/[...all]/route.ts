import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Single Better Auth endpoint: /api/auth/* (sign-in, sign-up, sign-out, session…).
 * Both the client (`auth-client.ts`) and the server (`dal.ts`) talk to it.
 */
export const { GET, POST } = toNextJsHandler(auth);
