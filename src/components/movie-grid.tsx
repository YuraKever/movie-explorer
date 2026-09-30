import type { MovieCardData } from "@/features/movies/types";
import { MovieCard } from "./movie-card";

/** 2 columns on phones (from 320px) → 5 on desktop; shared by every movie grid. */
export const MOVIE_GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

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
    <div className={MOVIE_GRID}>
      {movies.map((movie, i) => (
        <MovieCard key={movie.id} movie={movie} priority={priority && i < 5} />
      ))}
    </div>
  );
}

/** Placeholder cards in the same grid, while results load. */
export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className={MOVIE_GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] animate-pulse rounded-xl bg-black/5 dark:bg-white/10"
        />
      ))}
    </div>
  );
}
