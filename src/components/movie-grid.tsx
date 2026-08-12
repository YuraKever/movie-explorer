import type { MovieCardData } from "@/features/movies/types";
import { MovieCard } from "./movie-card";

/**
 * Responsive card grid: 2 columns on phones (from 320px) → 5 on desktop.
 * The empty result is handled here so callers do not repeat that state on every
 * page (trending, search, favorites).
 */
export function MovieGrid({
  movies,
  priority = false,
}: {
  movies: MovieCardData[];
  /** Load the first row eagerly — only when the grid is above the fold. */
  priority?: boolean;
}) {
  if (movies.length === 0) {
    return (
      <p className="py-16 text-center text-foreground/60">No results.</p>
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
