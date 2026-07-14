import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { searchMovies } from "./api";

/**
 * Хук поиска фильмов. Запрос не выполняется на пустой строке (`enabled`),
 * а `keepPreviousData` не даёт сетке «моргать» пустотой, пока летит новый запрос.
 */
export function useSearchMovies(query: string) {
  const q = query.trim();

  return useQuery({
    queryKey: ["search-movies", q],
    queryFn: () => searchMovies(q),
    enabled: q.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
