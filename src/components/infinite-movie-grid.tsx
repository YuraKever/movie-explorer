"use client";

import { useEffect, useRef } from "react";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { MovieGrid } from "./movie-grid";
import type { Movie, PaginatedResponse } from "@/features/movies/types";

type Props = {
  query: UseInfiniteQueryResult<
    InfiniteData<PaginatedResponse<Movie>>,
    Error
  >;
  emptyMessage?: string;
};

/**
 * Бесконечная сетка фильмов поверх `useInfiniteQuery`. Следующая страница
 * тянется, когда невидимый сентинел приближается к вьюпорту (IntersectionObserver
 * с запасом 600px — подгружаем заранее, без «дёрганья» у самого низа).
 *
 * Переиспользуется и в каталоге, и в поиске: вся разница — какой запрос передан.
 */
export function InfiniteMovieGrid({
  query,
  emptyMessage = "Ничего не найдено.",
}: Props) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <SkeletonGrid />;

  if (isError) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium">⚠️ Не удалось загрузить</p>
        <p className="mt-1 text-foreground/70">
          {error instanceof Error ? error.message : "Неизвестная ошибка"}
        </p>
      </div>
    );
  }

  const movies = dedupeById(data?.pages.flatMap((page) => page.results) ?? []);
  const total = data?.pages[0]?.total_results ?? 0;

  if (movies.length === 0) {
    return <p className="py-16 text-center text-foreground/60">{emptyMessage}</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-foreground/60">
        Найдено: {total.toLocaleString("ru-RU")}
      </p>
      <MovieGrid movies={movies} />

      {/* Сентинел бесконечной прокрутки */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {isFetchingNextPage && (
        <p className="py-6 text-center text-sm text-foreground/50">Загрузка…</p>
      )}
      {!hasNextPage && (
        <p className="py-8 text-center text-sm text-foreground/40">Это всё 🎬</p>
      )}
    </div>
  );
}

/** Список без дублей: TMDB иногда повторяет один фильм на разных страницах. */
function dedupeById(movies: Movie[]): Movie[] {
  const seen = new Set<number>();
  const out: Movie[] = [];
  for (const movie of movies) {
    if (!seen.has(movie.id)) {
      seen.add(movie.id);
      out.push(movie);
    }
  }
  return out;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] animate-pulse rounded-xl bg-black/5 dark:bg-white/10"
        />
      ))}
    </div>
  );
}
