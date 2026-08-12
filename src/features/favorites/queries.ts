import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { MovieCardData } from "@/features/movies/types";
import {
  addFavoriteRequest,
  fetchFavorites,
  removeFavoriteRequest,
} from "./api";

/** Single cache key — every component reads the same list. */
const FAVORITES_KEY = ["favorites"] as const;

/** Minimal slice to store (newest first, same order as the old store). */
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
 * Favorites from the server. The query is enabled only for a signed-in user
 * (a guest has an empty list, and /api/favorites would answer 401).
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

/** Whether a movie is a favorite (reads the shared useFavorites cache). */
export function useIsFavorite(movieId: number) {
  const { data } = useFavorites();
  return data?.some((m) => m.id === movieId) ?? false;
}

/**
 * Optimistic favorite toggle: the UI changes instantly, on failure we roll back
 * to the previous state, and finally resync with the server.
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
