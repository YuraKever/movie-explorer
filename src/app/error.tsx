"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundaries must be client components. Catches unexpected render errors
 * in the segment (e.g. a failed server-side TMDB request). `reset()` remounts
 * the segment — for transient failures that is the retry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl" aria-hidden>
        😕
      </p>
      <h1 className="mt-4 text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-foreground/60">
        This page could not be loaded. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-black/10 px-4 py-2 text-sm transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
