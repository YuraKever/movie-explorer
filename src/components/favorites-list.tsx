"use client";

import Link from "next/link";
import { useFavorites } from "@/features/favorites/queries";
import { ErrorTile } from "@/components/error-tile";
import { MovieGrid, SkeletonGrid } from "@/components/movie-grid";

/**
 * Server-side favorites list. While loading — a skeleton; then the grid, an
 * error, or an invitation to start. The /favorites page is already protected on
 * the server (requireUser), so only signed-in users get here.
 */
export function FavoritesList() {
  const { data, isPending, isError, error } = useFavorites();

  if (isPending) return <SkeletonGrid count={5} />;

  if (isError) return <ErrorTile title="Could not load favorites" error={error} />;

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-foreground/60">Nothing here yet.</p>
        <p className="mt-1 text-sm text-foreground/50">
          Hit ♥ on a poster to save a movie. Start with{" "}
          <Link href="/discover" className="text-amber-600 hover:underline dark:text-amber-400">
            discover
          </Link>
          .
        </p>
      </div>
    );
  }

  return <MovieGrid movies={data} priority />;
}
