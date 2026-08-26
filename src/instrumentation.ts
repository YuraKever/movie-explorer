import { validateEnv } from "@/lib/env";

/**
 * Runs once as a server instance boots — not during `next build`, so a clone
 * without credentials still builds. A deploy with a missing or malformed
 * variable fails here instead of turning into a 500 on the first request that
 * happens to need it.
 */
export function register() {
  validateEnv();
}
