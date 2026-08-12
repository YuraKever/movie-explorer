import Link from "next/link";

/**
 * Root not-found: catches both `notFound()` (e.g. a movie that does not exist)
 * and any unmatched URL across the app.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-foreground/20" aria-hidden>
        404
      </p>
      <h1 className="mt-4 text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-foreground/60">
        The movie may not exist, or the link is out of date.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Go home
        </Link>
        <Link
          href="/discover"
          className="rounded-lg border border-black/10 px-4 py-2 text-sm transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Browse movies
        </Link>
      </div>
    </main>
  );
}
