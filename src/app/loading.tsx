/**
 * Instant skeleton when navigating to server-rendered pages (home, discover).
 * Suspense fallback while the segment's content streams in.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-black/5 dark:bg-white/10" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] animate-pulse rounded-xl bg-black/5 dark:bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}
