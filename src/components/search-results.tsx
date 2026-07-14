"use client";

import { useSearchMovies } from "@/features/movies/queries";
import { MovieGrid } from "@/components/movie-grid";

/**
 * Результаты поиска на клиенте через TanStack Query. Обрабатывает все состояния:
 * пустой запрос, загрузка (skeleton), ошибка, пусто, успех.
 */
export function SearchResults({ query }: { query: string }) {
  const q = query.trim();
  const { data, isLoading, isError, error } = useSearchMovies(q);

  if (!q) {
    return (
      <p className="py-16 text-center text-foreground/60">
        Введите название фильма, чтобы начать поиск.
      </p>
    );
  }

  if (isLoading) {
    return <SkeletonGrid />;
  }

  if (isError) {
    return (
      <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium">⚠️ Не удалось выполнить поиск</p>
        <p className="mt-1 text-foreground/70">
          {error instanceof Error ? error.message : "Неизвестная ошибка"}
        </p>
      </div>
    );
  }

  const movies = data?.results ?? [];

  return (
    <div className="mt-6">
      <p className="mb-4 text-sm text-foreground/60">
        {data?.total_results ?? 0} результатов по запросу «{q}»
      </p>
      <MovieGrid movies={movies} />
    </div>
  );
}

/** Заглушка-скелет на время первой загрузки — совпадает по сетке с результатами. */
function SkeletonGrid() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] animate-pulse rounded-xl bg-black/5 dark:bg-white/10"
        />
      ))}
    </div>
  );
}
