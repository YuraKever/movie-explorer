"use client";

import { useDiscoverMovies } from "@/features/movies/queries";
import { InfiniteMovieGrid } from "./infinite-movie-grid";
import type { DiscoverFilters } from "@/features/movies/types";

/**
 * Discover feed: an infinite grid for the current filters. Changing a filter
 * changes `filters` (from the URL) → new queryKey → the feed restarts at page 1.
 */
export function DiscoverFeed({ filters }: { filters: DiscoverFilters }) {
  const query = useDiscoverMovies(filters);
  return (
    <InfiniteMovieGrid
      query={query}
      emptyMessage="Nothing matches these filters."
    />
  );
}
