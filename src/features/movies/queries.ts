import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { searchMovies, discoverMovies } from "./api";
import type { DiscoverFilters, Movie, PaginatedResponse } from "./types";

/** Следующая страница TMDB или undefined, если достигли конца. */
function getNextPageParam(last: PaginatedResponse<Movie>) {
  return last.page < last.total_pages ? last.page + 1 : undefined;
}

/**
 * Поиск с бесконечной подгрузкой. Пустой запрос не выполняется (`enabled`),
 * `keepPreviousData` не даёт ленте «моргать» при смене запроса.
 */
export function useSearchMovies(query: string) {
  const q = query.trim();

  return useInfiniteQuery({
    queryKey: ["search-movies", q],
    queryFn: ({ pageParam }) => searchMovies(q, pageParam),
    enabled: q.length > 0,
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Каталог с фильтрами и бесконечной подгрузкой. Смена фильтров сбрасывает ленту. */
export function useDiscoverMovies(filters: DiscoverFilters) {
  return useInfiniteQuery({
    queryKey: ["discover-movies", filters],
    queryFn: ({ pageParam }) => discoverMovies(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
