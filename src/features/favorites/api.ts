import type { MovieCardData } from "@/features/movies/types";

/**
 * Client-side requests to our favorites API (`/api/favorites/*`).
 * The session travels automatically in Better Auth's httpOnly cookie.
 */
async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchFavorites(): Promise<MovieCardData[]> {
  const { items } = await jsonFetch<{ items: MovieCardData[] }>("/api/favorites");
  return items;
}

export function addFavoriteRequest(movie: MovieCardData) {
  return jsonFetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movie),
  });
}

export function removeFavoriteRequest(movieId: number) {
  return jsonFetch(`/api/favorites/${movieId}`, { method: "DELETE" });
}

export async function importFavoritesRequest(
  movies: MovieCardData[],
): Promise<MovieCardData[]> {
  const { items } = await jsonFetch<{ items: MovieCardData[] }>(
    "/api/favorites/import",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movies),
    },
  );
  return items;
}
