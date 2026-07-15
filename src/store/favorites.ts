import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MovieCardData } from "@/features/movies/types";

type FavoritesState = {
  /** Избранные фильмы, самые свежие — в начале. */
  items: MovieCardData[];
  toggle: (movie: MovieCardData) => void;
  remove: (id: number) => void;
  isFavorite: (id: number) => boolean;
};

/**
 * Стор избранного на Zustand с persist в localStorage. Храним минимальный срез
 * (`MovieCardData`), чтобы `/favorites` рисовалась мгновенно из localStorage без
 * похода в TMDB. Массив (а не Set/Map) — чтобы переживать JSON-сериализацию и
 * сохранять порядок добавления.
 *
 * ВАЖНО: компоненты, читающие стор, должны гейтить вывод через `useHydrated`,
 * иначе получим рассинхрон гидрации (сервер не видит localStorage).
 */
export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (movie) =>
        set((state) => {
          if (state.items.some((m) => m.id === movie.id)) {
            return { items: state.items.filter((m) => m.id !== movie.id) };
          }
          const compact: MovieCardData = {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
          };
          return { items: [compact, ...state.items] };
        }),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((m) => m.id !== id) })),
      isFavorite: (id) => get().items.some((m) => m.id === id),
    }),
    { name: "movie-explorer:favorites" },
  ),
);
