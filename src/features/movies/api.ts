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

/** Discover with filters (genre / year / sorting), paginated. */
export function discoverMovies(filters: DiscoverFilters, page = 1) {
  const params: Record<string, string> = {
    page: String(page),
    include_adult: "false",
    sort_by: filters.sort ?? "popularity.desc",
  };
  if (filters.genre) params.with_genres = filters.genre;
  if (filters.year) params.primary_release_year = filters.year;
  // When sorting by rating, cut off obscure movies with a handful of votes.
  if (filters.sort === "vote_average.desc") params["vote_count.gte"] = "200";

  return proxyFetch<PaginatedResponse<Movie>>("discover/movie", params);
}
