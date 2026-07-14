import type { Movie, PaginatedResponse } from "./types";

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

/** Поиск фильмов по названию. */
export function searchMovies(query: string, page = 1) {
  return proxyFetch<PaginatedResponse<Movie>>("search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });
}
