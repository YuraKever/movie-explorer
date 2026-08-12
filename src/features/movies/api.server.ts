import { tmdbFetch } from "@/lib/tmdb";
import type { Genre, MovieDetail } from "./types";

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

/** Genre list for the discover filters. Cached long — the list is stable. */
export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>("genre/movie/list", {}, {
    revalidate: 60 * 60 * 24,
  });
  return data.genres;
}
