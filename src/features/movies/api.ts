import type { DiscoverFilters, Movie, PaginatedResponse } from "./types";

/**
 * Клиентские запросы к TMDB через собственный прокси `/api/tmdb/*`.
 * Ключ подставляется на сервере в Route Handler — клиент его не видит.
 *
 * Серверные (RSC / generateMetadata) запросы живут отдельно в `api.server.ts`,
 * чтобы серверный клиент TMDB (и переменные окружения) не попадали в бандл клиента.
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
    throw new Error(body?.error ?? `Запрос не удался (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/** Поиск фильмов по названию (постранично). */
export function searchMovies(query: string, page = 1) {
  return proxyFetch<PaginatedResponse<Movie>>("search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

/** Каталог с фильтрами (жанр / год / сортировка), постранично. */
export function discoverMovies(filters: DiscoverFilters, page = 1) {
  const params: Record<string, string> = {
    page: String(page),
    include_adult: "false",
    sort_by: filters.sort ?? "popularity.desc",
  };
  if (filters.genre) params.with_genres = filters.genre;
  if (filters.year) params.primary_release_year = filters.year;
  // При сортировке по рейтингу отсекаем малоизвестные фильмы с парой голосов.
  if (filters.sort === "vote_average.desc") params["vote_count.gte"] = "200";

  return proxyFetch<PaginatedResponse<Movie>>("discover/movie", params);
}
