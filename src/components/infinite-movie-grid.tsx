"use client";

import { useEffect, useRef } from "react";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { ErrorTile } from "./error-tile";
import { MovieGrid, SkeletonGrid } from "./movie-grid";
import type { Movie, PaginatedResponse } from "@/features/movies/types";

type Props = {
  query: UseInfiniteQueryResult<
    InfiniteData<PaginatedResponse<Movie>>,
    Error
  >;
  emptyMessage?: string;
};

/**
 * Infinite movie grid on top of `useInfiniteQuery`. The next page is fetched
 * when an invisible sentinel approaches the viewport (IntersectionObserver with
 * a 600px margin — load ahead of time, no stutter at the very bottom).
 *
 * The sentinel is a scroll trigger, so it is unreachable without a pointer or a
 * scrolling gesture: the "Load more" button is how a keyboard-only user gets to
 * page 2, and a live region announces what arrived.
 *
 * Reused by both discover and search: the only difference is the query passed in.
 */
export function InfiniteMovieGrid({
  query,
  emptyMessage = "No results.",
}: Props) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <SkeletonGrid />;

  if (isError) {
    return <ErrorTile title="Could not load results" error={error} />;
  }

  const movies = dedupeById(data?.pages.flatMap((page) => page.results) ?? []);
  const total = data?.pages[0]?.total_results ?? 0;

  if (movies.length === 0) {
    return <p className="py-16 text-center text-foreground/60">{emptyMessage}</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-foreground/60">
        {total.toLocaleString("en-US")} results
      </p>
      <MovieGrid movies={movies} priority />

      {/* Infinite-scroll sentinel */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      <p aria-live="polite" className="sr-only">
        {isFetchingNextPage
          ? "Loading more results"
          : `Showing ${movies.length} of ${total.toLocaleString("en-US")} results`}
      </p>

      {hasNextPage ? (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-foreground/40">
          You&apos;ve reached the end 🎬
        </p>
      )}
    </div>
  );
}

/** Deduped list: TMDB sometimes repeats the same movie across pages. */
function dedupeById(movies: Movie[]): Movie[] {
  const seen = new Set<number>();
  const out: Movie[] = [];
  for (const movie of movies) {
    if (!seen.has(movie.id)) {
      seen.add(movie.id);
      out.push(movie);
    }
  }
  return out;
}
