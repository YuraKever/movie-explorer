import { DEFAULT_SORT } from "./filters";
import type { DiscoverFilters, Movie, PaginatedResponse } from "./types";

/**
 * Client-side TMDB requests through our own `/api/tmdb/*` proxy.
 * The key is injected on the server inside the Route Handler — the client
 * never sees it.
 *
 * Server-side requests (RSC / generateMetadata) live separately in
 * `api.server.ts`, so the server TMDB client (and its env vars) stay out of the
 * client bundle.
 */
async function proxyFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/tmdb/${path}${qs ? `?${qs}` : ""}`);

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/** Search movies by title (paginated). */
export function searchMovies(query: string, page = 1) {
  return proxyFetch<PaginatedResponse<Movie>>("search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

/** Discover with filters (genres / years / rating / sorting), paginated. */
export function discoverMovies(filters: DiscoverFilters, page = 1) {
  const params: Record<string, string> = {
    page: String(page),
    include_adult: "false",
    sort_by: filters.sort ?? DEFAULT_SORT,
  };
  // Comma is AND in TMDB: several genres narrow the feed rather than widen it.
  if (filters.genres?.length) params.with_genres = filters.genres.join(",");
  if (filters.yearFrom) params["primary_release_date.gte"] = `${filters.yearFrom}-01-01`;
  if (filters.yearTo) params["primary_release_date.lte"] = `${filters.yearTo}-12-31`;
  if (filters.minRating) params["vote_average.gte"] = filters.minRating;
  // A score is meaningless on a handful of votes, whether it is being sorted
  // by or filtered on — one 10/10 vote would otherwise top the feed.
  if (filters.sort === "vote_average.desc" || filters.minRating) {
    params["vote_count.gte"] = "200";
  }

  return proxyFetch<PaginatedResponse<Movie>>("discover/movie", params);
}
