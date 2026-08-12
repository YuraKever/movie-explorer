import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { searchMovies, discoverMovies } from "./api";
import type { DiscoverFilters, Movie, PaginatedResponse } from "./types";

/** Next TMDB page, or undefined once the end is reached. */
function getNextPageParam(last: PaginatedResponse<Movie>) {
  return last.page < last.total_pages ? last.page + 1 : undefined;
}

/**
 * Search with infinite loading. An empty query is not run (`enabled`), and
 * `keepPreviousData` keeps the feed from flickering as the query changes.
 */
export function useSearchMovies(query: string) {
  const q = query.trim();

  return useInfiniteQuery({
    queryKey: ["search-movies", q],
    queryFn: ({ pageParam }) => searchMovies(q, pageParam),
    enabled: q.length > 0,
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Discover with filters and infinite loading. Changing filters resets the feed. */
export function useDiscoverMovies(filters: DiscoverFilters) {
  return useInfiniteQuery({
    queryKey: ["discover-movies", filters],
    queryFn: ({ pageParam }) => discoverMovies(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
