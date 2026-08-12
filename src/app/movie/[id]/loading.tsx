/** Detail-page skeleton matching its real layout (poster + text column). */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="h-4 w-32 animate-pulse rounded bg-black/5 dark:bg-white/10" />
      <div className="mt-6 grid gap-8 sm:grid-cols-[220px_1fr]">
        <div className="aspect-[2/3] w-full max-w-[220px] animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
        <div className="space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-black/5 dark:bg-white/10" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-black/5 dark:bg-white/10" />
          <div className="mt-4 h-24 w-full animate-pulse rounded bg-black/5 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
