import { tmdbFetch } from "@/lib/tmdb";
import type { MovieDetail } from "./types";

/**
 * Функции запросов к TMDB, сгруппированные по фиче. Тонкие обёртки над
 * серверным клиентом — вся авторизация и кэш живут в lib/tmdb.
 *
 * `getMovieDetail` вызывается и в `generateMetadata`, и в самой странице;
 * Next дедуплицирует одинаковые fetch в рамках одного рендера, так что
 * это один сетевой запрос, а не два.
 */
export function getMovieDetail(id: string | number) {
  return tmdbFetch<MovieDetail>(`movie/${id}`);
}
