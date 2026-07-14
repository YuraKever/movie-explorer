import { tmdbFetch } from "@/lib/tmdb";
import type { Genre, MovieDetail } from "./types";

/**
 * Серверные запросы к TMDB (RSC и `generateMetadata`): напрямую через серверный
 * клиент, с ключом и без сетевого хопа в собственный прокси.
 *
 * НЕ импортировать из клиентских компонентов: `tmdbFetch` читает серверные
 * переменные окружения. Клиентские запросы — в `api.ts` (через `/api/tmdb`).
 */
export function getMovieDetail(id: string | number) {
  return tmdbFetch<MovieDetail>(`movie/${id}`);
}

/** Справочник жанров для фильтров каталога. Кэшируется надолго — список стабилен. */
export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>("genre/movie/list", {}, {
    revalidate: 60 * 60 * 24,
  });
  return data.genres;
}
