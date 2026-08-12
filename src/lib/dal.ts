import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Data Access Layer for the session. The path Next recommends: centralize the
 * check here rather than in a layout (layouts do not re-render on navigation).
 * `cache` memoizes the result within a single server render — getSession can be
 * called from several places without duplicate requests.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Requires a signed-in user; otherwise redirects to /login. Returns the user. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}
