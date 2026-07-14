"use client";

import { useSearchMovies } from "@/features/movies/queries";
import { InfiniteMovieGrid } from "@/components/infinite-movie-grid";

/**
 * Результаты поиска: та же бесконечная сетка, что и в каталоге, но по запросу.
 * Пустую строку не ищем — показываем подсказку.
 */
export function SearchResults({ query }: { query: string }) {
  const q = query.trim();
  const infinite = useSearchMovies(q);

  if (!q) {
    return (
      <p className="py-16 text-center text-foreground/60">
        Введите название фильма, чтобы начать поиск.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <InfiniteMovieGrid
        query={infinite}
        emptyMessage={`Ничего не найдено по «${q}».`}
      />
    </div>
  );
}
