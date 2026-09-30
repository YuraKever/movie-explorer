import type { Metadata } from "next";
import Link from "next/link";
import { AskAdvisor } from "@/components/ask-advisor";
import { getSession } from "@/lib/dal";

export const metadata: Metadata = { title: "Ask" };

/**
 * The movie advisor. Open to guests on purpose — the page explains itself and
 * invites a sign-in instead of bouncing to /login; the model call behind it
 * (`/api/ask`) is what requires the session.
 */
export default async function AskPage() {
  const session = await getSession();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ask the advisor</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground/60">
        Describe what you want to watch. Search finds the closest movies, and a
        AI model picks the ones that fit and says why.
      </p>

      <div className="mt-6">
        {session ? (
          <AskAdvisor />
        ) : (
          <div className="max-w-2xl rounded-xl border border-black/10 p-6 dark:border-white/15">
            <p className="text-sm text-foreground/70">
              The advisor runs an AI model for every question, so it is available to
              signed-in users.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href="/login?redirect=/ask"
                className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400"
              >
                Sign in to ask
              </Link>
              <Link
                href="/search?mode=meaning"
                className="rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                Or search by meaning — no account needed
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
