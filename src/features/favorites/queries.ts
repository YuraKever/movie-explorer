import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { MovieCardData } from "@/features/movies/types";
import {
  addFavoriteRequest,
  fetchFavorites,
  removeFavoriteRequest,
} from "./api";

/** Единый ключ кеша — все компоненты читают один и тот же список. */
const FAVORITES_KEY = ["favorites"] as const;

/** Минимальный срез для хранения (порядок как в старом сторе — свежие первыми). */
function compact(movie: MovieCardData): MovieCardData {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  };
}

/**
 * Избранное с сервера. Запрос включается только для залогиненного пользователя
 * (у гостя список пуст, а /api/favorites вернул бы 401).
 */
export function useFavorites() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: fetchFavorites,
    enabled: Boolean(session),
    staleTime: 5 * 60 * 1000,
  });
}

/** Является ли фильм избранным (читает общий кеш useFavorites). */
export function useIsFavorite(movieId: number) {
  const { data } = useFavorites();
  return data?.some((m) => m.id === movieId) ?? false;
}

/**
 * Переключение избранного с оптимистичным обновлением: UI меняется мгновенно,
 * при ошибке откатываемся к предыдущему состоянию, в конце — ресинк с сервером.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movie, isFav }: { movie: MovieCardData; isFav: boolean }) =>
      isFav ? removeFavoriteRequest(movie.id) : addFavoriteRequest(movie),

    onMutate: async ({ movie, isFav }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const prev = queryClient.getQueryData<MovieCardData[]>(FAVORITES_KEY);
      queryClient.setQueryData<MovieCardData[]>(FAVORITES_KEY, (old = []) =>
        isFav
          ? old.filter((m) => m.id !== movie.id)
          : [compact(movie), ...old],
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(FAVORITES_KEY, ctx.prev);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}
