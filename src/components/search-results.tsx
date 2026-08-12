"use client";

import { useSearchMovies } from "@/features/movies/queries";
import { InfiniteMovieGrid } from "@/components/infinite-movie-grid";

/**
 * Search results: the same infinite grid as discover, driven by the query.
 * An empty string is not searched — we show a hint instead.
 */
export function SearchResults({ query }: { query: string }) {
  const q = query.trim();
  const infinite = useSearchMovies(q);

  if (!q) {
    return (
      <p className="py-16 text-center text-foreground/60">
        Type a movie title to start searching.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <InfiniteMovieGrid
        query={infinite}
        emptyMessage={`No results for "${q}".`}
      />
    </div>
  );
}
