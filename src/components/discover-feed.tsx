"use client";

import { useDiscoverMovies } from "@/features/movies/queries";
import { InfiniteMovieGrid } from "./infinite-movie-grid";
import type { DiscoverFilters } from "@/features/movies/types";

/**
 * Лента каталога: бесконечная сетка по текущим фильтрам. Смена фильтров меняет
 * `filters` (из URL) → новый queryKey → лента перезапускается с первой страницы.
 */
export function DiscoverFeed({ filters }: { filters: DiscoverFilters }) {
  const query = useDiscoverMovies(filters);
  return (
    <InfiniteMovieGrid
      query={query}
      emptyMessage="По этим фильтрам ничего не нашлось."
    />
  );
}
