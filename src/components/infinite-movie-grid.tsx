"use client";

import { useEffect, useRef } from "react";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { MovieGrid } from "./movie-grid";
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
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium">⚠️ Could not load results</p>
        <p className="mt-1 text-foreground/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
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

      {isFetchingNextPage && (
        <p className="py-6 text-center text-sm text-foreground/50">Loading…</p>
      )}
      {!hasNextPage && (
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] animate-pulse rounded-xl bg-black/5 dark:bg-white/10"
        />
      ))}
    </div>
  );
}
