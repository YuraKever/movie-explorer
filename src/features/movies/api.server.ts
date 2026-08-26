import { tmdbFetch } from "@/lib/tmdb";
import type { Genre, Movie, MovieDetail, PaginatedResponse, PersonDetail } from "./types";

/**
 * Server-side TMDB requests (RSC and `generateMetadata`): straight through the
 * server client, with the key and without a network hop into our own proxy.
 *
 * Do NOT import from client components: `tmdbFetch` reads server env vars.
 * Client-side requests live in `api.ts` (through `/api/tmdb`).
 */
export function getMovieDetail(id: string | number) {
  // append_to_response pulls cast, videos and similar in a single request.
  return tmdbFetch<MovieDetail>(`movie/${id}`, {
    append_to_response: "credits,videos,similar",
  });
}

/** A person and everything they acted in, in one request. */
export function getPerson(id: string | number) {
  return tmdbFetch<PersonDetail>(`person/${id}`, {
    append_to_response: "movie_credits",
  });
}

/** One of TMDB's curated movie lists (`now_playing`, `top_rated`, `upcoming`). */
export function getMovieList(list: "now_playing" | "top_rated" | "upcoming") {
  return tmdbFetch<PaginatedResponse<Movie>>(`movie/${list}`);
}

/** Genre list for the discover filters. Cached long — the list is stable. */
export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>("genre/movie/list", {}, {
    revalidate: 60 * 60 * 24,
  });
  return data.genres;
}
