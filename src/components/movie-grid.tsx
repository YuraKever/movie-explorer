import type { MovieCardData } from "@/features/movies/types";
import { MovieCard } from "./movie-card";

/**
 * Адаптивная сетка карточек: 2 колонки на телефоне (от 320px) → 5 на десктопе.
 * Пустой результат обрабатывается здесь же, чтобы вызывающий код не дублировал
 * это состояние на каждой странице (тренды, поиск, избранное).
 */
export function MovieGrid({
  movies,
  priority = false,
}: {
  movies: MovieCardData[];
  /** Грузить первый ряд eager — только когда сетка выше сгиба (главная, лента). */
  priority?: boolean;
}) {
  if (movies.length === 0) {
    return (
      <p className="py-16 text-center text-foreground/60">
        Ничего не найдено.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie, i) => (
        <MovieCard key={movie.id} movie={movie} priority={priority && i < 5} />
      ))}
    </div>
  );
}
